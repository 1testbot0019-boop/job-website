"""FreeJobAlert discovery collector with automatic official-link extraction."""

import re
import time
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from db import save_update
from classify import classify
from extract import fetch_html, parse_date

DEPARTMENT_HINTS = {
    "ukpsc": "UKPSC",
    "uksssc": "UKSSSC",
    "police": "Uttarakhand Police",
    "iit roorkee": "IIT Roorkee",
    "nit uttarakhand": "NIT Uttarakhand",
    "powergrid": "POWERGRID",
}

LISTING_URL = "https://www.freejobalert.com/uttarakhand-government-jobs/"
FREEJOBALERT_HOSTS = {"freejobalert.com", "www.freejobalert.com"}

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
    heading = table_tag.find_previous(["h1", "h2", "h3", "h4"])
    return heading.get_text(strip=True) if heading else ""


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


def is_external_candidate(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.netloc.lower().split(":")[0]
    if host in FREEJOBALERT_HOSTS or host.endswith(".freejobalert.com"):
        return False
    blocked = ("facebook.com", "twitter.com", "x.com", "youtube.com", "instagram.com", "telegram.me", "whatsapp.com")
    return not any(domain in host for domain in blocked)


def score_official_link(url: str, text: str) -> int:
    """Prefer government/official notification links over ordinary external links."""
    host = urlparse(url).netloc.lower()
    blob = f"{text} {url}".lower()
    score = 0

    if host.endswith(".gov.in") or ".gov.in" in host:
        score += 100
    if host.endswith(".nic.in") or ".nic.in" in host:
        score += 90
    if host.endswith(".ac.in") or ".ac.in" in host:
        score += 60
    if any(word in host for word in ("ukpsc", "uksssc", "iit", "nit", "powergrid")):
        score += 45
    if "official notification" in blob or "official advertisement" in blob:
        score += 80
    if "official website" in blob or "official link" in blob:
        score += 60
    if "notification" in blob or "advertisement" in blob:
        score += 35
    if "apply online" in blob or "apply" in blob:
        score += 25
    if url.lower().split("?")[0].endswith(".pdf"):
        score += 20
    return score


def extract_official_links(detail_url: str):
    """Open the FreeJobAlert detail page and return official notification/app/PDF links.

    FreeJobAlert remains only the discovery source. The public-facing official_url
    is selected from external links that look like first-party government or
    institution links.
    """
    try:
        html = fetch_html(detail_url, HEADERS, timeout=20, retries=2, backoff=3)
    except Exception as exc:  # noqa: BLE001
        print(f"[official-link] could not open {detail_url}: {exc}")
        return None, None, None

    soup = BeautifulSoup(html, "html.parser")
    candidates = []

    for a in soup.find_all("a", href=True):
        href = urljoin(detail_url, a["href"].strip())
        text = a.get_text(" ", strip=True)
        if not is_external_candidate(href):
            continue
        score = score_official_link(href, text)
        if score >= 25:
            candidates.append((score, href, text))

    if not candidates:
        return None, None, None

    candidates.sort(key=lambda item: item[0], reverse=True)
    official_url = candidates[0][1]
    pdf_url = next((url for _, url, _ in candidates if url.lower().split("?")[0].endswith(".pdf")), None)
    apply_url = next(
        (url for _, url, text in candidates if "apply" in f"{text} {url}".lower()),
        None,
    )
    return official_url, pdf_url, apply_url


def make_description(title: str, department: str) -> str:
    return (
        f"Get the latest information about {title}. This page provides an "
        f"original summary of the {department} notice, important dates and a "
        f"link to the official notification. Always verify eligibility and "
        f"application details from the official source before applying."
    )


def fetch_notices():
    html = fetch_html(LISTING_URL, HEADERS)
    soup = BeautifulSoup(html, "html.parser")

    notices = []
    seen_urls = set()

    for table in soup.find_all("table"):
        heading = heading_for_table(table)
        if "uttarakhand" not in heading.lower():
            continue

        table_category = category_from_heading(heading)

        for row in table.find_all("tr"):
            if not row.find_all("td"):
                continue

            link_tag = row.find("a", href=True)
            if not link_tag:
                continue

            title = link_tag.get_text(strip=True)
            detail_url = urljoin(LISTING_URL, link_tag["href"].strip())
            if not title or len(title) < 8 or detail_url in seen_urls:
                continue
            seen_urls.add(detail_url)

            row_text = row.get_text(" ", strip=True)
            date_match = DATE_CELL_PATTERN.search(row_text)
            published_date = parse_date(date_match.group(0)) if date_match else None
            category = table_category or classify(title)
            department = guess_department(title)

            official_url, pdf_url, _apply_url = extract_official_links(detail_url)
            if not official_url:
                print(f"[skip] no official external link found: {title}")
                continue

            notices.append(
                {
                    "title": title,
                    "department": department,
                    "category": category,
                    "description": make_description(title, department),
                    "published_date": published_date,
                    "source_url": detail_url,
                    "official_url": official_url,
                    "pdf_url": pdf_url,
                }
            )
            time.sleep(0.4)

    return notices


def run():
    notices = fetch_notices()
    print(f"[FreeJobAlert] fetched {len(notices)} notices with official links")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
