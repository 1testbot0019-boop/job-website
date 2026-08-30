"""Discover government schemes from official Central, State and UT websites.

The crawler is deliberately conservative: it only stores pages whose host is the
configured official government host (or a subdomain of it). It follows links whose
text/URL looks scheme-related and keeps the final official page as official_url.
It does not fabricate URLs or use third-party scheme directories as sources.
"""

from __future__ import annotations

import hashlib
import re
import time
from collections import deque
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from db import SUPABASE_KEY, SUPABASE_URL
from government_scheme_sources import OFFICIAL_SOURCES
from supabase import create_client

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IndiaGovSchemeBot/1.0; +https://github.com/1testbot0019-boop/job-website)"
}
TIMEOUT = 18
MAX_PAGES_PER_SOURCE = 35
MAX_DEPTH = 2

SCHEME_WORDS = (
    "scheme", "schemes", "yojana", "yojanas", "programme", "program",
    "welfare", "subsidy", "benefit", "scholarship", "pension", "grant",
    "financial assistance", "social security", "आवास", "योजना", "पेंशन",
    "छात्रवृत्ति", "सब्सिडी", "कल्याण"
)

CATEGORY_WORDS = {
    "Agriculture": ("agri", "farmer", "kisan", "crop", "horticulture", "fisher", "dairy"),
    "Education": ("education", "student", "school", "college", "scholarship", "skill"),
    "Health": ("health", "medical", "hospital", "ayush", "medicine"),
    "Women and Child": ("women", "woman", "girl", "child", "anganwadi", "maternal"),
    "Housing": ("housing", "awas", "home", "shelter"),
    "Employment and Entrepreneurship": ("employment", "job", "self employment", "startup", "entrepreneur", "msme"),
    "Social Security": ("pension", "widow", "disability", "senior citizen", "social security"),
}


def clean(value: str, limit: int = 12000) -> str:
    return re.sub(r"\s+", " ", value or "").strip()[:limit]


def same_official_host(url: str, root: str) -> bool:
    a = (urlparse(url).hostname or "").lower().rstrip(".")
    b = (urlparse(root).hostname or "").lower().rstrip(".")
    return bool(a and b and (a == b or a.endswith("." + b)))


def normalize_url(url: str) -> str:
    p = urlparse(url)
    return p._replace(fragment="").geturl().rstrip("/") + "/"


def looks_like_scheme_link(text: str, url: str) -> bool:
    hay = f"{text} {url}".lower()
    return any(word in hay for word in SCHEME_WORDS)


def category_for(text: str) -> str:
    hay = text.lower()
    for category, words in CATEGORY_WORDS.items():
        if any(w in hay for w in words):
            return category
    return "General"


def extract_record(source: dict, url: str, html: str):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    title = clean(soup.title.get_text(" ") if soup.title else "")
    h1 = soup.find("h1")
    heading = clean(h1.get_text(" ") if h1 else "")
    name = heading or title
    if not name or len(name) < 5:
        return None

    text = clean(soup.get_text(" "), 18000)
    if not looks_like_scheme_link(name, url) and not looks_like_scheme_link(text[:5000], url):
        return None

    # Avoid saving generic home/search/contact pages as schemes.
    generic = ("home", "welcome", "contact us", "about us", "search", "login", "sitemap")
    if name.lower().strip() in generic:
        return None

    description = ""
    meta = soup.find("meta", attrs={"name": re.compile("description", re.I)})
    if meta and meta.get("content"):
        description = clean(meta.get("content"))
    if not description:
        paragraphs = [clean(p.get_text(" ")) for p in soup.find_all("p")]
        description = next((p for p in paragraphs if len(p) >= 80), clean(text[:600]))

    slug_base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:160]
    if not slug_base:
        return None
    slug = f"{slug_base}-{source['state_code'].lower()}"
    digest = hashlib.sha256(f"scheme|{source['state']}|{name}|{url}".encode()).hexdigest()
    return {
        "title": name[:500],
        "slug": slug,
        "state": source["state"],
        "state_code": source["state_code"],
        "category": category_for(text),
        "department": source["name"],
        "short_description": description[:1000],
        "description": description,
        "benefits": "See the official scheme page for current benefits and assistance.",
        "eligibility": "See the official scheme page for current eligibility conditions.",
        "documents": "See the official scheme page for required documents.",
        "application_process": "Follow the application instructions on the official government page.",
        "important_dates": {},
        "official_url": url,
        "official_source_name": source["name"],
        "myscheme_url": "https://www.myscheme.gov.in/",
        "published_date": None,
        "is_active": True,
        "seo_title": f"{name} - Eligibility, Benefits & How to Apply",
        "seo_description": description[:300],
        "keywords": [name, source["state"], "government scheme"],
        "content_hash": digest,
    }


def crawl_source(source: dict):
    root = normalize_url(source["url"])
    queue = deque([(root, 0)])
    seen = set()
    records = []
    session = requests.Session()
    session.headers.update(HEADERS)

    while queue and len(seen) < MAX_PAGES_PER_SOURCE:
        url, depth = queue.popleft()
        if url in seen or depth > MAX_DEPTH or not same_official_host(url, root):
            continue
        seen.add(url)
        try:
            response = session.get(url, timeout=TIMEOUT, allow_redirects=True)
            if response.status_code != 200 or "text/html" not in response.headers.get("content-type", ""):
                continue
            final_url = normalize_url(response.url)
            if not same_official_host(final_url, root):
                continue
            html = response.text
            record = extract_record(source, final_url, html)
            if record:
                records.append(record)

            soup = BeautifulSoup(html, "html.parser")
            if depth >= MAX_DEPTH:
                continue
            for a in soup.find_all("a", href=True):
                href = urljoin(final_url, a.get("href"))
                text = clean(a.get_text(" "))
                if not href.startswith(("http://", "https://")):
                    continue
                if not same_official_host(href, root):
                    continue
                if looks_like_scheme_link(text, href):
                    queue.append((normalize_url(href), depth + 1))
            time.sleep(0.15)
        except requests.RequestException as exc:
            print(f"[scheme] {source['state']}: {url} -> {exc}")
    return records


def save_records(records):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    for record in records:
        # Remove helper field not present in the DB schema.
        record.pop("content_hash", None)
        try:
            client.table("government_schemes").upsert(record, on_conflict="slug").execute()
            saved += 1
            print(f"[scheme] saved {record['state']}: {record['title']}")
        except Exception as exc:  # noqa: BLE001
            print(f"[scheme] database error for {record['title']}: {exc}")
    return saved


def run():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY env vars are not set")

    total = 0
    for source in OFFICIAL_SOURCES:
        print(f"[scheme] crawling {source['state']} -> {source['url']}")
        records = crawl_source(source)
        print(f"[scheme] {source['state']}: discovered {len(records)} candidate pages")
        total += save_records(records)
    print(f"[scheme] official state/UT crawler completed: {total} records saved")


if __name__ == "__main__":
    run()
