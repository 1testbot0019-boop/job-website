"""FreeJobAlert discovery collector with verified official-link extraction."""

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
SOCIAL_HOSTS = {
    "facebook.com", "www.facebook.com", "twitter.com", "www.twitter.com",
    "x.com", "www.x.com", "youtube.com", "www.youtube.com",
    "instagram.com", "www.instagram.com", "telegram.me", "t.me",
    "whatsapp.com", "www.whatsapp.com", "linkedin.com", "www.linkedin.com",
}
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

HEADING_CATEGORY_MAP = [
    (re.compile(r"result|cut\s*off", re.I), "RESULT"),
    (re.compile(r"admit card", re.I), "ADMIT_CARD"),
    (re.compile(r"answer key", re.I), "ANSWER_KEY"),
    (re.compile(r"syllabus", re.I), "SYLLABUS"),
    (re.compile(r"job", re.I), "JOB"),
]
DATE_CELL_PATTERN = re.compile(r"\d{1,2}\s+\w{3,9}\s+\d{4}")


def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()


def heading_for_table(table_tag):
    heading = table_tag.find_previous(["h1", "h2", "h3", "h4"])
    return clean(heading.get_text(" ", strip=True)) if heading else ""


def category_from_heading(heading):
    for pattern, category in HEADING_CATEGORY_MAP:
        if pattern.search(heading):
            return category
    return None


def guess_department(title):
    text = title.lower()
    for hint, dept in DEPARTMENT_HINTS.items():
        if hint in text:
            return dept
    return "Uttarakhand Govt"


def is_external_candidate(url):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.netloc.lower().split(":")[0]
    if host in FREEJOBALERT_HOSTS or host.endswith(".freejobalert.com"):
        return False
    if host in SOCIAL_HOSTS or any(host.endswith("." + domain) for domain in SOCIAL_HOSTS):
        return False
    return True


def official_host_score(host, title):
    host = host.lower()
    title = title.lower()
    score = 0

    # First-party Indian government/institution domains.
    if host.endswith(".gov.in") or ".gov.in" in host:
        score += 100
    if host.endswith(".nic.in") or ".nic.in" in host:
        score += 95
    if host.endswith(".ac.in") or ".ac.in" in host:
        score += 70
    if host.endswith(".edu.in") or ".edu.in" in host:
        score += 60

    # Match the organisation named in the job title.
    organisation_tokens = {
        "ukpsc": ("psc.uk.gov.in", "ukpsc"),
        "uksssc": ("sssc.uk.gov.in", "uksssc"),
        "police": ("uttarakhandpolice.uk.gov.in", "police"),
        "iit roorkee": ("iitr.ac.in", "iitroorkee", "iit-roorkee"),
        "nit uttarakhand": ("nituk.ac.in", "nituttarakhand"),
        "powergrid": ("powergrid.in", "powergrid"),
    }
    for token, hosts in organisation_tokens.items():
        if token in title and any(h in host for h in hosts):
            score += 120
            break

    return score


def score_official_link(url, text, title, context=""):
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    blob = f"{text} {url} {context}".lower()
    title_lower = title.lower()
    score = official_host_score(host, title_lower)

    label_scores = [
        ("official notification", 180),
        ("official advertisement", 170),
        ("download notification", 160),
        ("notification pdf", 155),
        ("advertisement", 120),
        ("notification", 110),
        ("official website", 80),
        ("notice", 70),
        ("apply online", 55),
        ("apply", 35),
    ]
    for phrase, value in label_scores:
        if phrase in blob:
            score += value

    if parsed.path.lower().split("?")[0].endswith(".pdf"):
        score += 45
    if any(word in parsed.path.lower() for word in ("notification", "advertisement", "recruitment", "career", "vacancy", "notice")):
        score += 35

    # Penalise generic third-party job portals, while allowing genuine first-party domains.
    third_party = ("sarkariresult", "freejobalert", "rojgar", "jagran", "freshers", "careerpower")
    if any(part in host for part in third_party):
        score -= 200

    return score


def extract_key_value_table(table):
    rows = []
    for tr in table.find_all("tr"):
        cells = [clean(cell.get_text(" ", strip=True)) for cell in tr.find_all(["th", "td"])]
        if len(cells) >= 2:
            rows.append(cells)
    return rows


def extract_section_text(soup, patterns):
    for heading in soup.find_all(["h2", "h3", "h4", "strong", "b"]):
        title = clean(heading.get_text(" ", strip=True)).lower()
        if any(pattern in title for pattern in patterns):
            parts = []
            for node in heading.find_all_next():
                if node.name in ["h2", "h3", "h4"] and node is not heading:
                    break
                if node.name in ["p", "li"]:
                    value = clean(node.get_text(" ", strip=True))
                    if value and value not in parts:
                        parts.append(value)
                if len(parts) >= 8:
                    break
            if parts:
                return " ".join(parts)
    return None


def extract_structured_content(detail_url, job_title):
    html = fetch_html(detail_url, HEADERS, timeout=20, retries=2, backoff=3)
    soup = BeautifulSoup(html, "html.parser")

    candidates = []
    seen = set()

    for a in soup.find_all("a", href=True):
        href = urljoin(detail_url, a["href"].strip())
        text = clean(a.get_text(" ", strip=True))
        if not is_external_candidate(href):
            continue
        if href in seen:
            continue
        seen.add(href)

        parent_context = ""
        if a.parent is not None:
            parent_context = clean(a.parent.get_text(" ", strip=True))
        grandparent = a.parent.parent if a.parent is not None else None
        if grandparent is not None:
            parent_context += " " + clean(grandparent.get_text(" ", strip=True))

        score = score_official_link(href, text, job_title, parent_context)
        if score >= 70:
            candidates.append((score, href, text))

    candidates.sort(key=lambda item: item[0], reverse=True)

    # The highest-scoring first-party notification/advertisement is the public official URL.
    official_url = candidates[0][1] if candidates else None

    # Prefer a PDF only when it is itself a strong official candidate.
    pdf_url = next(
        (url for score, url, text in candidates if url.lower().split("?")[0].endswith(".pdf") and score >= 120),
        None,
    )
    apply_url = next(
        (url for score, url, text in candidates if "apply" in f"{text} {url}".lower()),
        None,
    )
    official_website_url = next(
        (url for score, url, text in candidates if "official website" in text.lower()),
        None,
    )

    details = {}
    vacancies = []
    important_dates = {}

    for table in soup.find_all("table"):
        heading = heading_for_table(table).lower()
        rows = extract_key_value_table(table)
        if not rows:
            continue
        if any(word in heading for word in ("important date", "important dates")):
            for row in rows:
                important_dates[row[0]] = " | ".join(row[1:])
        elif any(word in heading for word in ("vacancy", "post details", "post name")):
            header = rows[0]
            for row in rows[1:]:
                if len(row) == len(header):
                    vacancies.append(dict(zip(header, row)))
        elif any(word in heading for word in ("application fee", "eligibility", "age limit", "selection process")):
            details[heading_for_table(table)] = rows

    return {
        "official_url": official_url,
        "pdf_url": pdf_url,
        "apply_url": apply_url,
        "official_website_url": official_website_url,
        "important_dates": important_dates,
        "vacancy_details": vacancies,
        "notification_details": details,
        "eligibility": extract_section_text(soup, ["qualification", "eligibility"]),
        "age_limit": extract_section_text(soup, ["age limit"]),
        "application_fee": extract_section_text(soup, ["application fee", "exam fee"]),
        "selection_process": extract_section_text(soup, ["selection process", "selection procedure"]),
        "how_to_apply": extract_section_text(soup, ["how to apply", "apply online"]),
    }


def make_description(title, department):
    return (
        f"Get complete recruitment information for {title}, including important dates, "
        f"vacancy details, eligibility and official links from {department}. Always read "
        f"the official notification before applying."
    )


def fetch_notices():
    html = fetch_html(LISTING_URL, HEADERS)
    soup = BeautifulSoup(html, "html.parser")
    notices, seen_urls = [], set()

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
            title = clean(link_tag.get_text(" ", strip=True))
            detail_url = urljoin(LISTING_URL, link_tag["href"].strip())
            if not title or len(title) < 8 or detail_url in seen_urls:
                continue
            seen_urls.add(detail_url)

            try:
                extracted = extract_structured_content(detail_url, title)
            except Exception as exc:  # noqa: BLE001
                print(f"[skip] extraction failed for {title}: {exc}")
                continue

            if not extracted["official_url"]:
                print(f"[skip] no verified official link found: {title}")
                continue

            row_text = clean(row.get_text(" ", strip=True))
            date_match = DATE_CELL_PATTERN.search(row_text)
            published_date = parse_date(date_match.group(0)) if date_match else None
            category = table_category or classify(title)
            department = guess_department(title)

            notices.append({
                "title": title,
                "department": department,
                "category": category,
                "description": make_description(title, department),
                "published_date": published_date,
                "source_url": detail_url,
                "official_url": extracted["official_url"],
                "pdf_url": extracted["pdf_url"],
                "apply_url": extracted["apply_url"],
                "official_website_url": extracted["official_website_url"],
                "important_dates": extracted["important_dates"],
                "vacancy_details": extracted["vacancy_details"],
                "notification_details": extracted["notification_details"],
                "eligibility": extracted["eligibility"],
                "age_limit": extracted["age_limit"],
                "application_fee": extracted["application_fee"],
                "selection_process": extracted["selection_process"],
                "how_to_apply": extracted["how_to_apply"],
                "meta_description": make_description(title, department)[:155],
            })
            time.sleep(0.5)
    return notices


def run():
    notices = fetch_notices()
    print(f"[FreeJobAlert] fetched {len(notices)} notices with verified official links")
    for notice in notices:
        save_update(notice)


if __name__ == "__main__":
    run()
