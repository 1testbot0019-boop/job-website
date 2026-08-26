"""
Uttarakhand Police recruitment collector.

Same caveat as ukpsc.py: adjust LISTING_URL and the selectors marked
"ADJUST ME" after inspecting the real recruitment page in your browser
(uttarakhandpolice.uk.gov.in or the dedicated recruitment portal it links to).
"""

import requests
from bs4 import BeautifulSoup

from db import save_update
from classify import classify
from ukpsc import parse_date

DEPARTMENT = "Uttarakhand Police"

# ADJUST ME
LISTING_URL = "https://uttarakhandpolice.uk.gov.in/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


def fetch_notices():
    resp = requests.get(LISTING_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # ADJUST ME
    rows = soup.select("table tr")

    notices = []
    for row in rows:
        link_tag = row.select_one("a")
        if not link_tag or not link_tag.get("href"):
            continue

        title = link_tag.get_text(strip=True)
        if not title or len(title) < 8:
            continue

        href = link_tag["href"]
        official_url = href if href.startswith("http") else requests.compat.urljoin(LISTING_URL, href)

        date_tag = row.select_one("td.date, span.date")
        published_date = parse_date(date_tag.get_text()) if date_tag else None

        pdf_url = official_url if official_url.lower().endswith(".pdf") else None

        notices.append(
            {
                "title": title,
                "department": DEPARTMENT,
                "category": classify(title),
                "description": title,
                "published_date": published_date,
                "source_url": LISTING_URL,
                "official_url": official_url,
                "pdf_url": pdf_url,
            }
        )

    return notices


def run():
    notices = fetch_notices()
    print(f"[Police] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
