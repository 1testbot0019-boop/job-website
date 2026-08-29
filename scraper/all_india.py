"""All-India state government job collector.

Uses FreeJobAlert state landing pages only as a discovery layer, then opens
individual job pages and keeps the verified external/official link extracted
from the job detail page. This lets the site expand beyond Uttarakhand
without changing the database schema.
"""

import re
import time
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from classify import classify
from db import save_update
from extract import fetch_html, parse_date
from freejobalert import (
    HEADERS,
    extract_structured_content,
    heading_for_table,
    clean,
    category_from_heading,
)


BASE = "https://www.freejobalert.com/"

# FreeJobAlert's current state landing-page slugs.
STATE_PAGES = {
    "Andaman and Nicobar": "andaman-nicobar-government-jobs/",
    "Andhra Pradesh": "andhra-pradesh-government-jobs/",
    "Arunachal Pradesh": "arunachal-pradesh-government-jobs/",
    "Assam": "assam-government-jobs/",
    "Bihar": "bihar-government-jobs/",
    "Chandigarh": "chandigarh-government-jobs/",
    "Chhattisgarh": "chhattisgarh-government-jobs/",
    "Dadra and Nagar Haveli and Daman and Diu": "daman-diu-government-jobs/",
    "Delhi": "delhi-government-jobs/",
    "Goa": "goa-government-jobs/",
    "Gujarat": "gujarat-government-jobs/",
    "Haryana": "haryana-government-jobs/",
    "Himachal Pradesh": "himachal-pradesh-government-jobs/",
    "Jammu and Kashmir": "jammu-kashmir-government-jobs/",
    "Jharkhand": "jharkhand-government-jobs/",
    "Karnataka": "karnataka-government-jobs/",
    "Kerala": "kerala-government-jobs/",
    "Ladakh": "ladakh-government-jobs/",
    "Lakshadweep": "lakshadweep-government-jobs/",
    "Madhya Pradesh": "madhya-pradesh-government-jobs/",
    "Maharashtra": "maharashtra-government-jobs/",
    "Manipur": "manipur-government-jobs/",
    "Meghalaya": "meghalaya-government-jobs/",
    "Mizoram": "mizoram-government-jobs/",
    "Nagaland": "nagaland-government-jobs/",
    "Odisha": "odisha-government-jobs/",
    "Puducherry": "puducherry-government-jobs/",
    "Punjab": "punjab-government-jobs/",
    "Rajasthan": "rajasthan-government-jobs/",
    "Sikkim": "sikkim-government-jobs/",
    "Tamil Nadu": "tn-government-jobs/",
    "Telangana": "telangana-government-jobs/",
    "Tripura": "tripura-government-jobs/",
    "Uttar Pradesh": "up-government-jobs/",
    "Uttarakhand": "uttarakhand-government-jobs/",
    "West Bengal": "west-bengal-government-jobs/",
}

DATE_PATTERN = re.compile(r"\d{1,2}\s+\w{3,9}\s+\d{4}")


def make_description(title, state):
    return (
        f"Get complete recruitment information for {title}, including "
        f"important dates, vacancy details, eligibility and the official "
        f"notification link for {state}. Always read the official notification "
        f"before applying."
    )


def fetch_state(state, path):
    listing_url = urljoin(BASE, path)
    print(f"[state] {state}: {listing_url}")

    html = fetch_html(listing_url, HEADERS, timeout=25, retries=2, backoff=3)
    soup = BeautifulSoup(html, "html.parser")
    notices = []
    seen_urls = set()

    for table in soup.find_all("table"):
        heading = heading_for_table(table)
        heading_lower = heading.lower()

        # Ignore unrelated central-job tables on the state page.
        if state.lower() not in heading_lower and not (
            state == "Tamil Nadu" and "tamil nadu" in heading_lower
        ):
            continue

        table_category = category_from_heading(heading)

        for row in table.find_all("tr"):
            if not row.find_all("td"):
                continue

            link_tag = row.find("a", href=True)
            if not link_tag:
                continue

            title = clean(link_tag.get_text(" ", strip=True))
            detail_url = urljoin(listing_url, link_tag["href"].strip())

            if not title or len(title) < 8 or detail_url in seen_urls:
                continue
            seen_urls.add(detail_url)

            try:
                extracted = extract_structured_content(detail_url, title)
            except Exception as exc:
                print(f"[skip] {state}: extraction failed for {title}: {exc}")
                continue

            official_url = extracted.get("official_url")
            if not official_url:
                print(f"[skip] {state}: no verified official link: {title}")
                continue

            row_text = clean(row.get_text(" ", strip=True))
            date_match = DATE_PATTERN.search(row_text)

            notices.append({
                "title": title,
                "department": state + " Govt",
                "category": table_category or classify(title),
                "description": make_description(title, state),
                "published_date": parse_date(date_match.group(0)) if date_match else None,
                "source_url": detail_url,
                "official_url": official_url,
                "pdf_url": extracted.get("pdf_url"),
                "apply_url": extracted.get("apply_url"),
                "official_website_url": extracted.get("official_website_url"),
                "important_dates": extracted.get("important_dates", {}),
                "vacancy_details": extracted.get("vacancy_details", []),
                "notification_details": extracted.get("notification_details", {}),
                "eligibility": extracted.get("eligibility"),
                "age_limit": extracted.get("age_limit"),
                "application_fee": extracted.get("application_fee"),
                "selection_process": extracted.get("selection_process"),
                "how_to_apply": extracted.get("how_to_apply"),
                "meta_description": make_description(title, state)[:155],
            })

            time.sleep(0.4)

    return notices


def run():
    print("=" * 60)
    print("All-India state collector starting")
    print(f"State/UT sources: {len(STATE_PAGES)}")
    print("=" * 60)

    total = 0
    for state, path in STATE_PAGES.items():
        try:
            notices = fetch_state(state, path)
            print(f"[state] {state}: {len(notices)} verified notices")
            for notice in notices:
                save_update(notice)
            total += len(notices)
        except Exception as exc:
            # One broken state page must never stop the remaining states.
            print(f"[error] {state} failed: {exc}")

    print("=" * 60)
    print(f"All-India state collector completed: {total} notices")
    print("=" * 60)


if __name__ == "__main__":
    run()
