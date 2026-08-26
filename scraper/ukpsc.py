"""
UKPSC (Uttarakhand Public Service Commission) collector.

NOTE: the previous version pointed at "ukpsc.gov.in", which does not
resolve at all - the real, working domain (confirmed by fetching it
directly) is psc.uk.gov.in. This version also uses the shared, selector-
free extractor in extract.py instead of a hand-guessed "table tr" CSS
selector, since the site's actual markup wasn't available to inspect
from this environment.

If GitHub Actions logs show 0 notices found, run `python ukpsc.py` locally
first to see what extract.py picked up - it prints a preview.
"""

from db import save_update
from classify import classify
from extract import fetch_html, extract_notices, parse_date  # noqa: F401  (parse_date kept for other modules that import it from here)

DEPARTMENT = "UKPSC"
LISTING_URL = "https://psc.uk.gov.in/"

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
    print(f"[UKPSC] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
