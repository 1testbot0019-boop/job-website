"""
Shared, selector-free notice extractor.

Government notice-board pages vary wildly in markup (tables, <li> lists,
<div> cards, etc.) and I can't inspect the live rendered HTML from this
environment to hand-pick exact CSS selectors. Instead of guessing selectors
that might silently match 0 rows (as happened with plain "table tr"), this
walks every <a> tag on the page and keeps the ones that look like an actual
notice: reasonably long link text, not a nav/menu item, with an optional
nearby date.

This is intentionally permissive - a few irrelevant links may slip through
and get saved as NOTIFICATION category. That's a much safer failure mode
than matching nothing at all. You can tighten NAV_BLOCKLIST or filters below
as you see what actually gets captured from each site.
"""

import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

DATE_PATTERN = re.compile(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})")

# Common menu/nav link text to skip. Add to this as you see junk in results.
NAV_BLOCKLIST = {
    "home", "about us", "about", "contact", "contact us", "rti", "downloads",
    "tenders", "gallery", "sitemap", "disclaimer", "privacy policy", "login",
    "register", "notice board", "important links", "quick links", "feedback",
    "faq", "terms and conditions", "help", "search", "hindi", "english",
    "e-tender", "tender", "e-governance", "citizen charter", "organogram",
    "right to information", "grievance", "photo gallery", "video gallery",
}


def parse_date(text: str):
    """Try common Indian-government date formats; return ISO date or None."""
    text = text.strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y", "%d/%m/%y", "%d %B %Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def looks_like_notice(text: str) -> bool:
    t = text.strip().lower()
    if len(t) < 20:
        return False
    if t in NAV_BLOCKLIST:
        return False
    return True


def fetch_html(url: str, headers: dict, timeout: int = 30) -> str:
    resp = requests.get(url, headers=headers, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def extract_notices(html: str, base_url: str):
    """Returns a list of {title, official_url, published_date}."""
    soup = BeautifulSoup(html, "html.parser")
    notices = []
    seen = set()

    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"].strip()

        if not href or href.startswith("javascript:") or href in ("#", "/"):
            continue
        if not looks_like_notice(text):
            continue

        official_url = href if href.startswith("http") else requests.compat.urljoin(base_url, href)
        if official_url in seen:
            continue
        seen.add(official_url)

        # Look for a date in the link text itself, or its parent element's text
        # (many sites put the date in a sibling <td>/<span> next to the link).
        context = text
        if a.parent is not None:
            context += " " + a.parent.get_text(" ", strip=True)

        date_match = DATE_PATTERN.search(context)
        published_date = parse_date(date_match.group(1)) if date_match else None

        notices.append(
            {
                "title": text,
                "official_url": official_url,
                "published_date": published_date,
            }
        )

    return notices
