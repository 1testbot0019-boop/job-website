"""
UKPSC (Uttarakhand Public Service Commission) collector.

IMPORTANT: I could not browse ukpsc.gov.in from this environment to read its
live HTML, so the CSS selectors below are placeholders based on the common
structure of Indian government notice-board pages (a table or list of
<a> tags, each with a date next to it). Before this will work you MUST:

    1. Open https://ukpsc.gov.in (or the current notices/recruitment page)
       in your browser.
    2. Right-click a notice link -> Inspect, and find:
         - the parent container (table row / <li> / <div>) that repeats
           for each notice
         - the exact tag + class holding the title/link
         - the exact tag + class holding the date (if present)
    3. Update LISTING_URL and the three selectors marked "ADJUST ME" below.

Everything else (de-duplication, classification, saving) will work as-is
once the selectors are correct.
"""

import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

from db import save_update
from classify import classify

DEPARTMENT = "UKPSC"

# ADJUST ME: the actual notices / recruitment listing page
LISTING_URL = "https://ukpsc.gov.in/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


def parse_date(text: str):
    """Try a few common Indian-government date formats; return None if unknown."""
    text = text.strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d %B %Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def fetch_notices():
    resp = requests.get(LISTING_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # ADJUST ME: the repeating container for each notice row.
    # Common patterns: soup.select("table tr"), soup.select("ul.notice-list li"),
    # soup.select("div.notice-item")
    rows = soup.select("table tr")

    notices = []
    for row in rows:
        # ADJUST ME: the <a> tag holding the notice title + link
        link_tag = row.select_one("a")
        if not link_tag or not link_tag.get("href"):
            continue

        title = link_tag.get_text(strip=True)
        if not title or len(title) < 8:
            continue

        href = link_tag["href"]
        official_url = href if href.startswith("http") else requests.compat.urljoin(LISTING_URL, href)

        # ADJUST ME: the cell/span holding the published date, if present
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
    print(f"[UKPSC] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
