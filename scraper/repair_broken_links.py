"""Refresh or remove expired temporary official notification links."""

import re
import time
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from db import get_client
from extract import fetch_html
from freejobalert import (
    HEADERS,
    is_external_candidate,
    is_freejobalert_url,
    score_official_link,
)
from enrich_apply_links import find_apply_url


SIGNED_PARAM_RE = re.compile(
    r"^(x-amz-|x-goog-|awsaccesskeyid$|signature$|expires$|policy$)",
    re.I,
)


def is_temporary_signed_url(url: str | None) -> bool:
    """Return True for URLs containing time-limited cloud-storage signatures."""
    if not url:
        return False

    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=True)
        keys = [key.lower() for key in params]

        if any(SIGNED_PARAM_RE.search(key) for key in keys):
            return True

        blob = url.lower()
        return any(
            token in blob
            for token in (
                "x-amz-signature",
                "x-amz-credential",
                "x-amz-expires",
                "x-goog-signature",
                "googleaccessid",
                "awsaccesskeyid",
                "signature=",
            )
        )
    except Exception:
        return False


def url_is_expired_or_broken(url: str | None) -> bool:
    """Check only non-temporary URLs. Temporary signed URLs are always suspect."""
    if not url:
        return True

    if is_temporary_signed_url(url):
        return True

    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15,
            allow_redirects=True,
            stream=True,
        )
        status = response.status_code
        content_type = response.headers.get("content-type", "").lower()
        body = ""
        if status >= 400 and "text" in content_type:
            body = response.text[:3000].lower()
        response.close()

        if status >= 400:
            return True

        return (
            "request has expired" in body
            or "expiredtoken" in body
            or "accessdenied" in body and "expired" in body
        )
    except Exception:
        # Network errors should not automatically delete a stored URL.
        return False


def find_permanent_official_links(source_url: str, title: str):
    """Re-read the FreeJobAlert source page and keep only permanent links."""
    html = fetch_html(source_url, HEADERS, timeout=20, retries=2, backoff=2)
    soup = BeautifulSoup(html, "html.parser")

    candidates = []
    seen = set()

    for a in soup.find_all("a", href=True):
        href = urljoin(source_url, a["href"].strip())

        if href in seen:
            continue
        seen.add(href)

        if not is_external_candidate(href):
            continue

        # Never store a temporary signed URL permanently.
        if is_temporary_signed_url(href):
            continue

        text = re.sub(r"\s+", " ", a.get_text(" ", strip=True))
        parent_text = (
            re.sub(r"\s+", " ", a.parent.get_text(" ", strip=True))
            if a.parent
            else ""
        )
        context = f"{text} {parent_text}"
        score = score_official_link(href, text, title, context)

        if score >= 70:
            candidates.append((score, href, text, context))

    candidates.sort(key=lambda item: item[0], reverse=True)

    official_url = None
    pdf_url = None
    official_website_url = None

    for score, href, text, context in candidates:
        path = urlparse(href).path.lower().split("?")[0]
        blob = f"{text} {context} {href}".lower()

        if not official_url and (
            "official notification" in blob
            or "official advertisement" in blob
            or "notification pdf" in blob
            or path.endswith(".pdf")
            or "notification" in blob
            or "advertisement" in blob
        ):
            official_url = href

        if not pdf_url and path.endswith(".pdf"):
            pdf_url = href

        if not official_website_url and "official website" in blob:
            official_website_url = href

    # Fallback to the best permanent official candidate.
    if not official_url and candidates:
        official_url = candidates[0][1]

    apply_url = find_apply_url(source_url, title)

    return {
        "official_url": official_url,
        "official_notification_url": official_url,
        "pdf_url": pdf_url,
        "official_website_url": official_website_url,
        "apply_online_url": apply_url,
    }


def run():
    client = get_client()

    response = (
        client.table("updates")
        .select(
            "id,title,source_url,official_url,official_notification_url,"
            "pdf_url,apply_online_url,official_website_url"
        )
        .ilike("source_url", "%freejobalert.com%")
        .limit(2000)
        .execute()
    )

    records = response.data or []
    suspects = []

    for record in records:
        urls_to_check = (
            record.get("official_url"),
            record.get("official_notification_url"),
            record.get("pdf_url"),
        )
        if any(url_is_expired_or_broken(url) for url in urls_to_check if url):
            suspects.append(record)

    print(f"[broken-links] checking {len(suspects)} suspect records")

    fixed = 0
    removed = 0

    for record in suspects:
        title = record.get("title", "")
        source_url = record.get("source_url")
        if not source_url:
            continue

        try:
            fresh = find_permanent_official_links(source_url, title)

            update_data = {}
            for key, value in fresh.items():
                if value:
                    update_data[key] = value

            # If the old URL was temporary and no permanent replacement exists,
            # clear it rather than leaving users with an expired AccessDenied page.
            if not fresh.get("official_url") and is_temporary_signed_url(record.get("official_url")):
                update_data["official_url"] = None
                update_data["official_notification_url"] = None
                removed += 1

            if not fresh.get("pdf_url") and is_temporary_signed_url(record.get("pdf_url")):
                update_data["pdf_url"] = None

            if update_data:
                client.table("updates").update(update_data).eq("id", record["id"]).execute()

                if fresh.get("official_url") or fresh.get("apply_online_url"):
                    fixed += 1
                    print(f"[broken-links:fixed] {title}")
                else:
                    print(f"[broken-links:cleared] {title}")
            else:
                print(f"[broken-links:none] {title}")

        except Exception as exc:
            print(f"[broken-links:error] {title}: {exc}")

        time.sleep(0.25)

    print(
        f"[broken-links] completed: fixed={fixed}, cleared={removed}, "
        f"checked={len(suspects)}"
    )


if __name__ == "__main__":
    run()
