"""Discover government schemes from official Central, State and UT websites.

The crawler is intentionally conservative: scheme records are created only from
pages hosted on the configured official government domain. It now also discovers
department pages for agriculture, farming, horticulture, solar/renewable energy,
animal husbandry, dairy, fisheries, rural development, MSME and allied sectors.
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
    "User-Agent": "Mozilla/5.0 (compatible; IndiaGovSchemeBot/2.0; +https://github.com/1testbot0019-boop/job-website)"
}
TIMEOUT = 20
MAX_PAGES_PER_SOURCE = 150
MAX_DEPTH = 3

SCHEME_WORDS = (
    "scheme", "schemes", "yojana", "yojanas", "programme", "program",
    "welfare", "subsidy", "benefit", "scholarship", "pension", "grant",
    "financial assistance", "social security", "आवास", "योजना", "पेंशन",
    "छात्रवृत्ति", "सब्सिडी", "कल्याण"
)

# Department/topic discovery words. These make the crawler reach department
# pages even when the state portal does not call them a "scheme" page.
TOPIC_WORDS = (
    "agriculture", "agri", "farmer", "farmers", "farming", "kisan", "crop",
    "horticulture", "fruit", "vegetable", "organic farming", "natural farming",
    "solar", "renewable energy", "energy", "saur", "surya",
    "animal husbandry", "livestock", "dairy", "milk", "fisheries", "fishery",
    "rural development", "rural livelihood", "cooperative", "co-operation",
    "msme", "micro small", "industries", "self employment", "startup",
    "women", "child", "education", "health", "housing", "skill development",
    "irrigation", "water conservation", "forest", "handloom", "handicraft",
    "tribal", "social welfare", "minority", "pension"
)

CATEGORY_WORDS = {
    "Agriculture & Farming": ("agriculture", "agri", "farmer", "farmers", "farming", "kisan", "crop", "cultivation", "seed", "soil", "irrigation", "farm"),
    "Horticulture": ("horticulture", "orchard", "fruit", "vegetable", "mushroom", "floriculture", "beekeeping", "nursery", "polyhouse", "greenhouse"),
    "Solar & Renewable Energy": ("solar", "renewable energy", "photovoltaic", "solar pv", "saur", "surya", "rooftop solar", "solar pump"),
    "Animal Husbandry & Dairy": ("animal husbandry", "livestock", "dairy", "milk", "cattle", "goat", "sheep", "poultry", "pig", "fodder"),
    "Fisheries": ("fisheries", "fishery", "fish farming", "aquaculture", "fisherman"),
    "Rural Development": ("rural development", "rural livelihood", "village", "panchayat", "self help group", "shg"),
    "MSME & Entrepreneurship": ("msme", "micro small", "industry", "industries", "startup", "entrepreneur", "self employment", "business"),
    "Education": ("education", "student", "school", "college", "scholarship", "skill"),
    "Health": ("health", "medical", "hospital", "ayush", "medicine"),
    "Women & Child": ("women", "woman", "girl", "child", "anganwadi", "maternal"),
    "Housing": ("housing", "awas", "home", "shelter"),
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


def matches_words(text: str, words: tuple[str, ...]) -> bool:
    hay = (text or "").lower()
    return any(word in hay for word in words)


def looks_like_scheme_link(text: str, url: str) -> bool:
    return matches_words(f"{text} {url}", SCHEME_WORDS)


def looks_like_topic_link(text: str, url: str) -> bool:
    return matches_words(f"{text} {url}", TOPIC_WORDS)


def category_for(text: str) -> str:
    hay = (text or "").lower()
    # More specific sectors first so horticulture/solar do not become generic agriculture.
    for category in (
        "Solar & Renewable Energy", "Horticulture", "Animal Husbandry & Dairy",
        "Fisheries", "Agriculture & Farming", "Rural Development",
        "MSME & Entrepreneurship", "Education", "Health", "Women & Child",
        "Housing", "Social Security",
    ):
        if any(w in hay for w in CATEGORY_WORDS[category]):
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

    text = clean(soup.get_text(" "), 22000)
    # A page is a candidate when its title/URL or body contains scheme/topic language.
    if not (looks_like_scheme_link(name, url) or looks_like_topic_link(name, url) or looks_like_scheme_link(text[:8000], url)):
        return None

    generic = ("home", "welcome", "contact us", "about us", "search", "login", "sitemap")
    if name.lower().strip() in generic:
        return None

    # Do not turn a broad department landing page into a scheme unless it has
    # actual programme/benefit language or a meaningful scheme-like title.
    if not looks_like_scheme_link(name, url) and not looks_like_scheme_link(text[:12000], url):
        return None

    description = ""
    meta = soup.find("meta", attrs={"name": re.compile("description", re.I)})
    if meta and meta.get("content"):
        description = clean(meta.get("content"))
    if not description:
        paragraphs = [clean(p.get_text(" ")) for p in soup.find_all("p")]
        description = next((p for p in paragraphs if len(p) >= 80), clean(text[:800]))

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
        "keywords": [name, source["state"], category_for(text), "government scheme"],
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
                if not href.startswith(("http://", "https://")) or not same_official_host(href, root):
                    continue
                # Follow scheme links and relevant department/topic links. This is
                # the key expansion over the previous crawler.
                if looks_like_scheme_link(text, href) or looks_like_topic_link(text, href):
                    queue.append((normalize_url(href), depth + 1))
            time.sleep(0.10)
        except requests.RequestException as exc:
            print(f"[scheme] {source['state']}: {url} -> {exc}")
    return records


def save_records(records):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    for record in records:
        record.pop("content_hash", None)
        try:
            client.table("government_schemes").upsert(record, on_conflict="slug").execute()
            saved += 1
            print(f"[scheme] saved {record['state']} [{record['category']}]: {record['title']}")
        except Exception as exc:
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
