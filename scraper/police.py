"""
Uttarakhand Police recruitment collector.

Uses the shared, selector-free extractor in extract.py.

IMPORTANT - this domain has been timing out (not failing to resolve, but
connection timeout) when run from GitHub Actions. This is a common pattern
for Indian government sites that block requests from foreign/datacenter
IP ranges (which is exactly what GitHub-hosted runners use). A wrong URL
would fail instantly with a DNS error like the old ukpsc.gov.in did; a
timeout instead suggests the domain resolves fine but the connection is
being refused/dropped somewhere in front of the server.

If this keeps timing out after retries, the practical options are:
  1. Point this collector at a mirror/aggregator site instead (e.g. a
     sarkari-results style site that already republishes UKSSSC/Police
     notices) as a workaround, understanding it's a step removed from the
     primary source.
  2. Run the scraper on a self-hosted GitHub Actions runner physically
     located in India (e.g. a small VPS or your own machine) instead of
     GitHub's shared cloud runners.
  3. Route requests through an Indian residential/datacenter proxy.
Options 2 and 3 add cost/complexity, so start by simply re-running the
workflow a few times - some government sites are just slow or flaky
rather than actively blocking.
"""

from db import save_update
from classify import classify
from extract import fetch_html, extract_notices

DEPARTMENT = "Uttarakhand Police"
LISTING_URL = "https://uttarakhandpolice.uk.gov.in/career_recruitment"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


def fetch_notices():
    html = fetch_html(LISTING_URL, HEADERS, timeout=45)
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
    print(f"[Police] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
