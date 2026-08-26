"""
FreeJobAlert.com collector - Uttarakhand government jobs section.

Why this exists: the official UKPSC/UKSSSC/Police sites block requests
from GitHub Actions' cloud IP ranges (confirmed - they load fine from a
normal Indian home connection, but time out from GitHub's servers every
time). FreeJobAlert is a long-running, ordinary content site that already
aggregates these same official notices into clean tables, updates daily
(often within hours of the source), and isn't a locked-down government
portal - it doesn't need the same "run from an Indian IP" workaround.

Page structure (as fetched): the Uttarakhand page has several distinct
<table> sections, each preceded by a heading:
    "Latest Government Jobs in Uttarakhand"   -> job postings
    "Uttarakhand Govt Jobs Result 2026"       -> results
    "Uttarakhand Govt Jobs Admit Card 2026"   -> admit cards
    "Uttarakhand Govt Jobs Answer Key 2026"   -> answer keys
    "Uttarakhand Govt Jobs Cut Off 2026"      -> cutoffs (filed as RESULT)

Further down the page there are sitewide "Top Govt Jobs" / "ADMIT CARDS" /
"RESULTS" widgets that are NOT specific to Uttarakhand (they mix in jobs
from other states) - those are deliberately skipped by only processing
tables whose heading contains "uttarakhand".

Since I can't fetch this page's exact live HTML tag/class names from this
environment, table position + heading text is used to categorize rows
instead of guessed CSS classes - the same "don't rely on invisible
selectors" approach as extract.py.
"""

import re
from bs4 import BeautifulSoup

from db import save_update
from classify import classify
from extract import fetch_html, parse_date

DEPARTMENT_HINTS = {
    "ukpsc": "UKPSC",
    "uksssc": "UKSSSC",
    "police": "Uttarakhand Police",
}

LISTING_URL = "https://www.freejobalert.com/uttarakhand-government-jobs/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

HEADING_CATEGORY_MAP = [
    (re.compile(r"result", re.I), "RESULT"),
    (re.compile(r"cut\s*off", re.I), "RESULT"),
    (re.compile(r"admit card", re.I), "ADMIT_CARD"),
    (re.compile(r"answer key", re.I), "ANSWER_KEY"),
    (re.compile(r"syllabus", re.I), "SYLLABUS"),
    (re.compile(r"job", re.I), "JOB"),
]

DATE_CELL_PATTERN = re.compile(r"\d{1,2}\s+\w{3,9}\s+\d{4}")


def heading_for_table(table_tag):
    """Walk backwards through previous siblings/elements to find the nearest heading."""
    node = table_tag
    for _ in range(30):  # safety limit
        node = node.find_previous(["h1", "h2", "h3", "h4"])
        if node is None:
            return ""
        return node.get_text(strip=True)
    return ""


def category_from_heading(heading: str):
    for pattern, category in HEADING_CATEGORY_MAP:
        if pattern.search(heading):
            return category
    return None


def guess_department(title: str) -> str:
    text = title.lower()
    for hint, dept in DEPARTMENT_HINTS.items():
        if hint in text:
            return dept
    return "Uttarakhand Govt"


def fetch_notices():
    html = fetch_html(LISTING_URL, HEADERS)
    soup = BeautifulSoup(html, "html.parser")

    notices = []
    seen_urls = set()

    for table in soup.find_all("table"):
        heading = heading_for_table(table)
        if "uttarakhand" not in heading.lower():
            continue  # skip sitewide/other-state widgets

        table_category = category_from_heading(heading)

        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if not cells:
                continue  # header row

            link_tag = row.find("a", href=True)
            if not link_tag:
                continue

            title = link_tag.get_text(strip=True)
            if not title or len(title) < 8:
                continue

            official_url = link_tag["href"]
            if official_url in seen_urls:
                continue
            seen_urls.add(official_url)

            row_text = row.get_text(" ", strip=True)
            date_match = DATE_CELL_PATTERN.search(row_text)
            published_date = parse_date(date_match.group(0)) if date_match else None

            category = table_category or classify(title)

            notices.append(
                {
                    "title": title,
                    "department": guess_department(title),
                    "category": category,
                    "description": title,
                    "published_date": published_date,
                    "source_url": LISTING_URL,
                    "official_url": official_url,
                    "pdf_url": official_url if official_url.lower().endswith(".pdf") else None,
                }
            )

    return notices


def run():
    notices = fetch_notices()
    print(f"[FreeJobAlert] fetched {len(notices)} candidate notices")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
