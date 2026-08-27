"""Shared database helper for all scrapers."""

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
    base = f"{department}-{title}"
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:180]


def make_hash(title: str, source_url: str) -> str:
    """Use the source detail page as the stable identity across official-link changes."""
    return hashlib.sha256(f"{title.strip()}|{source_url.strip()}".encode()).hexdigest()


def get_freejobalert_records() -> list[dict]:
    """Return existing records whose official_url still points at FreeJobAlert."""
    client = get_client()
    response = (
        client.table("updates")
        .select("id,title,official_url,source_url")
        .ilike("official_url", "%freejobalert.com%")
        .execute()
    )
    return response.data or []


def update_official_url(record_id: str, official_url: str) -> None:
    """Update only the official_url field of an existing record."""
    client = get_client()
    client.table("updates").update({"official_url": official_url}).eq("id", record_id).execute()


def save_update(record: dict) -> None:
    """Insert a new notice or update an existing notice with fresher official links."""
    client = get_client()
    record = dict(record)
    record["slug"] = make_slug(record["title"], record["department"])
    record["content_hash"] = make_hash(record["title"], record["source_url"])

    existing = (
        client.table("updates")
        .select("id")
        .eq("content_hash", record["content_hash"])
        .limit(1)
        .execute()
    )

    if existing.data:
        client.table("updates").update(record).eq("id", existing.data[0]["id"]).execute()
        print(f"[updated] {record['department']} :: {record['title']}")
        return

    client.table("updates").insert(record).execute()
    print(f"[saved] {record['department']} :: {record['title']}")
