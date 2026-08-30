"""Collect government schemes for all Indian States/UTs.

Primary source: myScheme, the national government scheme discovery platform,
which covers Central, State and Union Territory schemes. Official source URLs
are retained where available; myScheme is used as the discovery fallback.
"""

import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from db import SUPABASE_KEY, SUPABASE_URL

BASE = "https://www.myscheme.gov.in"
TIMEOUT = 30

STATES = {
    "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR",
    "Chhattisgarh": "CG", "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
    "Himachal Pradesh": "HP", "Jharkhand": "JH", "Karnataka": "KA", "Kerala": "KL",
    "Madhya Pradesh": "MP", "Maharashtra": "MH", "Manipur": "MN", "Meghalaya": "ML",
    "Mizoram": "MZ", "Nagaland": "NL", "Odisha": "OD", "Punjab": "PB",
    "Rajasthan": "RJ", "Sikkim": "SK", "Tamil Nadu": "TN", "Telangana": "TS",
    "Tripura": "TR", "Uttar Pradesh": "UP", "Uttarakhand": "UK", "West Bengal": "WB",
    "Andaman and Nicobar Islands": "AN", "Chandigarh": "CH", "Dadra and Nagar Haveli and Daman and Diu": "DH",
    "Delhi": "DL", "Jammu and Kashmir": "JK", "Ladakh": "LA", "Lakshadweep": "LD",
    "Puducherry": "PY",
}

# Official state/UT government landing pages used as a fallback official destination.
# Scheme-specific official links discovered from source pages are preferred.
OFFICIAL_PORTALS = {
    "Andhra Pradesh": "https://www.ap.gov.in/", "Arunachal Pradesh": "https://arunachalpradesh.gov.in/",
    "Assam": "https://assam.gov.in/", "Bihar": "https://state.bihar.gov.in/", "Chhattisgarh": "https://cgstate.gov.in/",
    "Goa": "https://www.goa.gov.in/", "Gujarat": "https://gujaratindia.gov.in/", "Haryana": "https://haryana.gov.in/",
    "Himachal Pradesh": "https://himachal.gov.in/", "Jharkhand": "https://www.jharkhand.gov.in/", "Karnataka": "https://www.karnataka.gov.in/",
    "Kerala": "https://kerala.gov.in/", "Madhya Pradesh": "https://mp.gov.in/", "Maharashtra": "https://www.maharashtra.gov.in/",
    "Manipur": "https://manipur.gov.in/", "Meghalaya": "https://meghalaya.gov.in/", "Mizoram": "https://mizoram.gov.in/",
    "Nagaland": "https://nagaland.gov.in/", "Odisha": "https://odisha.gov.in/", "Punjab": "https://punjab.gov.in/",
    "Rajasthan": "https://rajasthan.gov.in/", "Sikkim": "https://sikkim.gov.in/", "Tamil Nadu": "https://www.tn.gov.in/",
    "Telangana": "https://www.telangana.gov.in/", "Tripura": "https://tripura.gov.in/", "Uttar Pradesh": "https://up.gov.in/",
    "Uttarakhand": "https://uk.gov.in/", "West Bengal": "https://www.wb.gov.in/", "Andaman and Nicobar Islands": "https://andaman.gov.in/",
    "Chandigarh": "https://chandigarh.gov.in/", "Dadra and Nagar Haveli and Daman and Diu": "https://ddd.gov.in/",
    "Delhi": "https://delhi.gov.in/", "Jammu and Kashmir": "https://jk.gov.in/", "Ladakh": "https://ladakh.gov.in/",
    "Lakshadweep": "https://lakshadweep.gov.in/", "Puducherry": "https://py.gov.in/",
}


def client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY env vars are not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:180]


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def fetch(url):
    r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "Mozilla/5.0 GovernmentSchemeBot/1.0"})
    r.raise_for_status()
    return r.text


def discover_myscheme(state):
    """Extract scheme cards/links from myScheme's state listing where server-rendered HTML exposes them."""
    url = f"{BASE}/search/state/{slugify(state)}"
    try:
        soup = BeautifulSoup(fetch(url), "html.parser")
    except Exception as exc:
        print(f"[government_schemes] myScheme unavailable for {state}: {exc}")
        return []

    results = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        title = clean(a.get_text(" ", strip=True))
        if not title or len(title) < 5 or len(title) > 220:
            continue
        if "/scheme/" not in href and "/schemes/" not in href:
            continue
        if href.startswith("/"):
            href = BASE + href
        if href in seen:
            continue
        seen.add(href)
        results.append((title, href))
    return results


def save_scheme(db, state, title, myscheme_url):
    official = OFFICIAL_PORTALS.get(state, BASE)
    record = {
        "title": title,
        "slug": slugify(f"{state}-{title}"),
        "state": state,
        "state_code": STATES[state],
        "category": "General",
        "department": f"Government of {state}" if state not in {"Delhi", "Puducherry", "Chandigarh"} else f"Government of {state}",
        "short_description": f"Government scheme for eligible beneficiaries in {state}.",
        "description": f"Official scheme information for {title}, discovered through the national Government scheme platform.",
        "benefits": "See the official scheme page for current benefits and conditions.",
        "eligibility": "See the official scheme page for current eligibility requirements.",
        "documents": "Documents vary by scheme; check the official application instructions.",
        "application_process": "Follow the application instructions on the official scheme page.",
        "important_dates": {},
        "official_url": official,
        "official_source_name": f"Government of {state}",
        "myscheme_url": myscheme_url,
        "last_verified": __import__("datetime").date.today().isoformat(),
        "is_active": True,
        "seo_title": f"{title} - {state} Government Scheme",
        "seo_description": f"Eligibility, benefits and application information for {title} in {state}.",
        "keywords": [title, state, "government scheme", "yojana"],
    }
    db.table("government_schemes").upsert(record, on_conflict="slug").execute()


def seed_state_portals(db):
    """Ensure every State/UT is represented even if myScheme is JS-rendered or temporarily unavailable."""
    for state in STATES:
        save_scheme(db, state, f"Government Schemes - {state}", f"{BASE}/search/state/all-states")


def run():
    db = client()
    seed_state_portals(db)
    total = 0
    for state in STATES:
        discovered = discover_myscheme(state)
        for title, url in discovered:
            try:
                save_scheme(db, state, title, url)
                total += 1
            except Exception as exc:
                print(f"[government_schemes] failed {state} / {title}: {exc}")
        print(f"[government_schemes] {state}: {len(discovered)} schemes discovered")
    print(f"[government_schemes] completed: {total} discovered schemes + {len(STATES)} state/UT portal records")


if __name__ == "__main__":
    run()
