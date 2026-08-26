"""
UKSSSC (Uttarakhand Subordinate Service Selection Commission) collector.

Uses the shared, selector-free extractor in extract.py - the previous
"table tr" selector matched 0 rows because the real page doesn't use a
plain table for its notice list.
"""

from db import save_update
from classify import classify
from extract import fetch_html, extract_notices

DEPARTMENT = "UKSSSC"
LISTING_URL = "https://sssc.uk.gov.in/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


def fetch_notices():
    html = fetch_html(LISTING_URL, HEADERS)
    raw_notices = extract_notices(html, LISTING_URL)

    notices = []
    for n in raw_notices:
        pdf_url = n["official_url"] if n["official_url"].lower().endswith(".pdf") else None
        notices.append(
            {
                "title": n["title"],
                "department": DEPARTMENT,
                "category": classify(n["title"]),
                "description": n["title"],
                "published_date": n["published_date"],
                "source_url": LISTING_URL,
                "official_url": n["official_url"],
                "pdf_url": pdf_url,
            }
        )
    return notices


def run():
    notices = fetch_notices()
    print(f"[UKSSSC] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
