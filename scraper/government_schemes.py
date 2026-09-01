"""National discovery fallback for government schemes.

myScheme is an official Government of India discovery platform covering Central,
State and UT schemes. This module is a fallback for discovery; the official-domain
crawler is preferred because it can retain direct department URLs.
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


def client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY env vars are not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:180]


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def fetch(url):
    r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "Mozilla/5.0 GovernmentSchemeBot/2.0"})
    r.raise_for_status()
    return r.text


def discover_myscheme(state):
    """Extract server-rendered myScheme detail links when available."""
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


def category_for(title):
    hay = title.lower()
    groups = {
        "Solar & Renewable Energy": ("solar", "renewable", "surya", "saur"),
        "Horticulture": ("horticulture", "orchard", "mushroom", "beekeeping", "fruit", "vegetable"),
        "Animal Husbandry & Dairy": ("dairy", "livestock", "animal husbandry", "poultry", "goat", "sheep"),
        "Fisheries": ("fisheries", "fishery", "aquaculture", "fish farming"),
        "Agriculture & Farming": ("agriculture", "farmer", "kisan", "crop", "farming", "irrigation", "kisan"),
        "MSME & Entrepreneurship": ("msme", "startup", "entrepreneur", "enterprise", "business", "employment"),
        "Education": ("education", "student", "scholarship", "school", "college", "skill"),
        "Health": ("health", "medical", "hospital", "ayush"),
        "Women & Child": ("women", "girl", "child", "anganwadi", "maternal"),
        "Housing": ("housing", "awas", "home", "shelter"),
        "Social Security": ("pension", "widow", "disability", "senior citizen"),
    }
    for category, words in groups.items():
        if any(word in hay for word in words):
            return category
    return "General"


def save_scheme(db, state, title, myscheme_url):
    # Do not invent an official department URL. myScheme is itself an official
    # Government of India scheme platform, so it is used as the verified fallback.
    category = category_for(title)
    record = {
        "title": title,
        "slug": slugify(f"{state}-{title}"),
        "state": state,
        "state_code": STATES[state],
        "category": category,
        "department": f"Government of {state}",
        "short_description": f"Government scheme for eligible beneficiaries in {state}.",
        "description": f"Scheme information for {title}, discovered through the Government of India myScheme platform.",
        "benefits": "See the official myScheme page for current benefits and conditions.",
        "eligibility": "See the official myScheme page for current eligibility requirements.",
        "documents": "Documents vary by scheme; check the official scheme page.",
        "application_process": "Follow the application instructions on the official scheme page.",
        "important_dates": {},
        "official_url": myscheme_url,
        "official_source_name": "Government of India myScheme",
        "myscheme_url": myscheme_url,
        "last_verified": __import__("datetime").date.today().isoformat(),
        "is_active": True,
        "seo_title": f"{title} - {state} Government Scheme",
        "seo_description": f"Eligibility, benefits and application information for {title} in {state}.",
        "keywords": [title, state, category, "government scheme", "yojana"],
    }
    db.table("government_schemes").upsert(record, on_conflict="slug").execute()


def run():
    db = client()
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
    print(f"[government_schemes] completed: {total} discovered schemes")


if __name__ == "__main__":
    run()
