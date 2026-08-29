"""Find and save direct official application URLs for existing job records."""

import re
import time
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from db import get_client
from extract import fetch_html

from freejobalert import HEADERS, is_freejobalert_url


APPLY_TEXT_RE = re.compile(
    r"\b(apply\s*(online|now)?|online\s*application|registration|register\s*now|application\s*form|apply\s*here)\b",
    re.I,
)

BAD_HOST_PARTS = (
    "freejobalert",
    "sarkariresult",
    "jagran",
    "careerpower",
    "freshers",
    "rojgar",
)


def is_good_apply_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        host = parsed.netloc.lower().split(":")[0]
        if is_freejobalert_url(url):
            return False
        if any(part in host for part in BAD_HOST_PARTS):
            return False
        path = parsed.path.lower()
        if path.endswith(".pdf"):
            return False
        return True
    except Exception:
        return False


def find_apply_url(source_url: str, title: str = "") -> str | None:
    html = fetch_html(source_url, HEADERS, timeout=20, retries=2, backoff=2)
    soup = BeautifulSoup(html, "html.parser")

    candidates = []
    seen = set()

    for a in soup.find_all("a", href=True):
        href = urljoin(source_url, a["href"].strip())
        if href in seen or not is_good_apply_url(href):
            continue
        seen.add(href)

        text = re.sub(r"\s+", " ", a.get_text(" ", strip=True))
        parent_text = re.sub(r"\s+", " ", a.parent.get_text(" ", strip=True)) if a.parent else ""
        blob = f"{text} {parent_text} {href}"

        score = 0
        if APPLY_TEXT_RE.search(text):
            score += 100
        if APPLY_TEXT_RE.search(parent_text):
            score += 35

        path = urlparse(href).path.lower()
        if any(word in path for word in ("apply", "registration", "register", "recruitment", "career", "online")):
            score += 30
        if any(word in blob.lower() for word in ("application form", "application portal", "apply online")):
            score += 25

        # Never treat a generic department homepage as an application link
        # unless the page explicitly labels it as an application action.
        if score >= 70:
            candidates.append((score, href))

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1] if candidates else None


def run():
    client = get_client()
    response = (
        client.table("updates")
        .select("id,title,source_url,apply_online_url,category")
        .ilike("source_url", "%freejobalert.com%")
        .is_("apply_online_url", "null")
        .limit(1000)
        .execute()
    )

    records = response.data or []
    print(f"[apply-links] checking {len(records)} records without an application URL")

    fixed = 0
    for record in records:
        source_url = record.get("source_url")
        if not source_url:
            continue
        try:
            apply_url = find_apply_url(source_url, record.get("title", ""))
            if apply_url:
                client.table("updates").update({"apply_online_url": apply_url}).eq("id", record["id"]).execute()
                fixed += 1
                print(f"[apply-links:fixed] {record.get('title')} -> {apply_url}")
            else:
                print(f"[apply-links:none] {record.get('title')}")
        except Exception as exc:
            print(f"[apply-links:error] {record.get('title')}: {exc}")
        time.sleep(0.25)

    print(f"[apply-links] completed: {fixed}/{len(records)} URLs added")


if __name__ == "__main__":
    run()
