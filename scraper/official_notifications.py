"""Collect general notices, circulars and corrigendums from official Uttarakhand sources."""

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from db import save_update
from extract import fetch_html, parse_date

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
    )
}

SOURCES = [
    ("UKSSSC", "Uttarakhand Subordinate Service Selection Commission", "https://sssc.uk.gov.in/recruitment-notification/"),
    ("UKPSC", "Uttarakhand Public Service Commission", "https://psc.uk.gov.in/archive/announcements"),
]

KEYWORDS = [
    "notice", "notification", "circular", "corrigendum", "correction",
    "postponed", "postponement", "press note", "disposal order",
    "general notice", "important notice", "संशोधित", "शुद्धि पत्र",
    "स्थगित", "विज्ञप्ति", "सूचना", "संवाद", "परिपत्र", "प्रेस नोट",
    "निरस्तीकरण", "आदेश",
]


def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()


def relevant(title):
    text = clean(title).lower()
    return any(keyword in text for keyword in KEYWORDS)


def extract_date(text):
    match = re.search(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b",
        text or "",
    )
    if not match:
        return None
    try:
        return parse_date(match.group(1))
    except Exception:
        return None


def collect_source(source_code, department, source_url):
    html = fetch_html(source_url, HEADERS, timeout=25, retries=2, backoff=2)
    soup = BeautifulSoup(html, "html.parser")
    results = []
    seen = set()

    for a in soup.find_all("a", href=True):
        title = clean(a.get_text(" ", strip=True))
        href = urljoin(source_url, a["href"].strip())
        if not title or len(title) < 8 or href in seen or not relevant(title):
            continue
        if href.startswith("javascript:") or href.startswith("mailto:"):
            continue
        seen.add(href)

        context = clean(a.parent.get_text(" ", strip=True)) if a.parent else title
        published_date = extract_date(context) or extract_date(title)

        results.append({
            "title": title,
            "department": department,
            "category": "NOTIFICATION",
            "description": (
                f"Official {source_code} notice, circular, corrigendum or general update. "
                "Use the official source link to read or download the notice."
            ),
            "published_date": published_date,
            # Use the individual item URL as source_url so each notice is a
            # separate database record rather than colliding on the listing URL.
            "source_url": href,
            "official_url": href,
            "pdf_url": href if href.lower().split("?")[0].endswith(".pdf") else None,
            "official_notification_url": href,
            "official_website_url": source_url,
            "meta_description": f"Latest official {source_code} notice, circular and corrigendum updates for Uttarakhand.",
        })

    return results


def run():
    total = 0
    for source_code, department, source_url in SOURCES:
        try:
            records = collect_source(source_code, department, source_url)
            for record in records[:40]:
                save_update(record)
                total += 1
            print(f"[official_notifications] {source_code}: {len(records)} candidates")
        except Exception as exc:  # noqa: BLE001
            print(f"[official_notifications] {source_code} failed: {exc}")
    print(f"[official_notifications] saved/updated: {total}")


if __name__ == "__main__":
    run()
