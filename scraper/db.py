"""
Shared database helper for all scrapers.

Uses the Supabase REST API (via the `supabase` python client) so we don't
need a raw Postgres connection from GitHub Actions.

Environment variables required (set as GitHub Actions secrets):
    SUPABASE_URL       - e.g. https://xxxx.supabase.co
    SUPABASE_KEY       - service_role key (NOT the public anon key)
"""

import os
import re
import hashlib
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_KEY env vars are not set. "
                "Add them as GitHub Actions secrets."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def make_slug(title: str, department: str) -> str:
    """Turn 'UKPSC Lecturer Recruitment 2026' into 'ukpsc-lecturer-recruitment-2026'."""
    base = f"{department}-{title}"
    slug = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    return slug[:180]


def make_hash(title: str, official_url: str) -> str:
    """Stable fingerprint used to detect duplicates / re-runs."""
    return hashlib.sha256(f"{title.strip()}|{official_url.strip()}".encode()).hexdigest()


def already_exists(content_hash: str) -> bool:
    client = get_client()
    res = (
        client.table("updates")
        .select("id")
        .eq("content_hash", content_hash)
        .limit(1)
        .execute()
    )
    return len(res.data) > 0


def save_update(record: dict) -> None:
    """
    record must contain: title, category, department, description,
    published_date, source_url, official_url, pdf_url (optional)
    """
    client = get_client()
    record = dict(record)  # don't mutate caller's dict
    record["slug"] = make_slug(record["title"], record["department"])
    record["content_hash"] = make_hash(record["title"], record["official_url"])

    if already_exists(record["content_hash"]):
        return  # duplicate, ignore

    client.table("updates").insert(record).execute()
    print(f"[saved] {record['department']} :: {record['title']}")
