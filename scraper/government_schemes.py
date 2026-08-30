"""Populate the government_schemes table with official India-wide and Uttarakhand scheme records.

This collector uses stable official government URLs and is safe to run repeatedly.
"""

import hashlib
import re

from supabase import create_client

from db import SUPABASE_KEY, SUPABASE_URL

SCHEMES = [
    {
        "title": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
        "state": "All India",
        "state_code": "IN",
        "category": "Financial Inclusion",
        "department": "Department of Financial Services, Government of India",
        "short_description": "Financial inclusion scheme providing access to banking services and basic bank accounts.",
        "description": "Pradhan Mantri Jan Dhan Yojana is a national financial inclusion programme that provides access to banking and financial services.",
        "benefits": "Access to a basic bank account and other eligible financial services as per scheme rules.",
        "eligibility": "Eligibility is subject to the official scheme guidelines and participating bank requirements.",
        "documents": "Identity and address documents as required by the bank and official scheme guidelines.",
        "application_process": "Visit a participating bank or follow the official PMJDY instructions.",
        "official_url": "https://pmjdy.gov.in/",
        "official_source_name": "Pradhan Mantri Jan Dhan Yojana",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
        "state": "All India",
        "state_code": "IN",
        "category": "Housing",
        "department": "Ministry of Housing and Urban Affairs, Government of India",
        "short_description": "Central housing scheme for eligible urban beneficiaries.",
        "description": "Pradhan Mantri Awas Yojana - Urban supports housing assistance for eligible beneficiaries under official guidelines.",
        "benefits": "Housing assistance and benefits as applicable under the current official scheme rules.",
        "eligibility": "Eligibility depends on beneficiary category and current official guidelines.",
        "documents": "Documents required under the official application process.",
        "application_process": "Apply through the official PMAY-U process or authorised local agency.",
        "official_url": "https://pmay-urban.gov.in/",
        "official_source_name": "PMAY-U",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "state": "All India",
        "state_code": "IN",
        "category": "Health",
        "department": "National Health Authority, Government of India",
        "short_description": "Government health assurance scheme for eligible beneficiaries.",
        "description": "Ayushman Bharat PM-JAY provides health assurance benefits to eligible families according to official programme rules.",
        "benefits": "Cashless health treatment benefits at eligible empanelled hospitals, subject to scheme rules.",
        "eligibility": "Eligibility is determined through official beneficiary criteria.",
        "documents": "Beneficiary identification and other documents required under official guidelines.",
        "application_process": "Check eligibility and follow the official National Health Authority process.",
        "official_url": "https://pmjay.gov.in/",
        "official_source_name": "National Health Authority",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "PM-KISAN Samman Nidhi",
        "state": "All India",
        "state_code": "IN",
        "category": "Agriculture",
        "department": "Ministry of Agriculture and Farmers Welfare, Government of India",
        "short_description": "Income support scheme for eligible farmer families.",
        "description": "PM-KISAN provides income support to eligible landholding farmer families subject to official eligibility conditions.",
        "benefits": "Income support as notified by the Government of India and subject to scheme conditions.",
        "eligibility": "Eligible farmer families as defined in the official PM-KISAN guidelines.",
        "documents": "Land and identity details required by the official registration process.",
        "application_process": "Register or complete beneficiary services through the official PM-KISAN portal.",
        "official_url": "https://pmkisan.gov.in/",
        "official_source_name": "PM-KISAN",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "Pradhan Mantri Ujjwala Yojana (PMUY)",
        "state": "All India",
        "state_code": "IN",
        "category": "Women and Welfare",
        "department": "Ministry of Petroleum and Natural Gas, Government of India",
        "short_description": "LPG connection support scheme for eligible households.",
        "description": "PMUY supports eligible beneficiaries with LPG connections according to current official guidelines.",
        "benefits": "Benefits related to LPG connection support as available under official scheme rules.",
        "eligibility": "Eligibility is subject to the official PMUY criteria.",
        "documents": "Identity, address and other documents required under official guidelines.",
        "application_process": "Apply through an authorised LPG distributor or the official scheme process.",
        "official_url": "https://www.pmuy.gov.in/",
        "official_source_name": "Pradhan Mantri Ujjwala Yojana",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "National Scholarship Portal Schemes",
        "state": "All India",
        "state_code": "IN",
        "category": "Education",
        "department": "Ministry of Education and participating departments",
        "short_description": "Scholarship programmes available through the National Scholarship Portal.",
        "description": "The National Scholarship Portal provides access to multiple government scholarship schemes for eligible students.",
        "benefits": "Scholarship benefits vary by scheme and applicant category.",
        "eligibility": "Eligibility varies by the selected scholarship scheme.",
        "documents": "Academic, identity and category documents as required by the selected scheme.",
        "application_process": "Search and apply through the official National Scholarship Portal.",
        "official_url": "https://scholarships.gov.in/",
        "official_source_name": "National Scholarship Portal",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "Uttarakhand Atal Ayushman Uttarakhand Yojana",
        "state": "Uttarakhand",
        "state_code": "UK",
        "category": "Health",
        "department": "Government of Uttarakhand",
        "short_description": "State health assurance scheme and related beneficiary services for eligible residents.",
        "description": "Uttarakhand health assurance services are provided under the state's official scheme framework and eligibility rules.",
        "benefits": "Health assurance benefits at eligible hospitals subject to official rules.",
        "eligibility": "Eligibility is determined under the current official Uttarakhand scheme guidelines.",
        "documents": "Identity and beneficiary documents required by the official process.",
        "application_process": "Use the official Uttarakhand health scheme portal and follow current instructions.",
        "official_url": "https://health.uk.gov.in/",
        "official_source_name": "Government of Uttarakhand",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
    {
        "title": "Mukhyamantri Swarojgar Yojana Uttarakhand",
        "state": "Uttarakhand",
        "state_code": "UK",
        "category": "Employment and Entrepreneurship",
        "department": "Government of Uttarakhand",
        "short_description": "Self-employment and entrepreneurship support under Uttarakhand government programmes.",
        "description": "The scheme provides support for eligible self-employment and enterprise activities according to official Uttarakhand guidelines.",
        "benefits": "Financial and institutional support subject to the applicable official scheme provisions.",
        "eligibility": "Eligibility depends on current Uttarakhand government guidelines.",
        "documents": "Identity, residence, project and other documents required by the official process.",
        "application_process": "Follow the application procedure notified by the relevant Uttarakhand department.",
        "official_url": "https://uk.gov.in/",
        "official_source_name": "Government of Uttarakhand",
        "myscheme_url": "https://www.myscheme.gov.in/",
    },
]


def slugify(value):
    value = re.sub(r"[^a-z0-9]+", "-", value.lower())
    return value.strip("-")[:180]


def content_hash(item):
    return hashlib.sha256(
        f"scheme|{item['title']}|{item['state']}|{item['official_url']}".encode("utf-8")
    ).hexdigest()


def get_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY env vars are not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def run():
    client = get_client()
    saved = 0
    for item in SCHEMES:
        record = dict(item)
        record["slug"] = slugify(record["title"])
        record["important_dates"] = {}
        record["is_active"] = True
        record["seo_title"] = record["title"] + " – Eligibility, Benefits & How to Apply"
        record["seo_description"] = record["short_description"]
        record["keywords"] = [record["title"], record["state"], "government scheme"]
        client.table("government_schemes").upsert(record, on_conflict="slug").execute()
        saved += 1
        print(f"[government_schemes] saved: {record['title']}")
    print(f"[government_schemes] completed: {saved}")


if __name__ == "__main__":
    run()
