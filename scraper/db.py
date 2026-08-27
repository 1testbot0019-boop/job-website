"""Shared database helper for all scrapers."""

import os
import re
import hashlib
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_client: Client | None = None

UPDATES_COLUMNS = {
    "id", "title", "slug", "category", "department", "description",
    "important_dates", "published_date", "source_url", "official_url",
    "pdf_url", "content_hash", "is_active", "created_at", "last_updated",
    "search_vector", "vacancy_details", "qualification", "age_limit",
    "application_fee", "selection_process", "how_to_apply",
    "official_notification_url", "apply_online_url", "official_website_url",
}


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
    """Update verified official destination fields for an existing record."""
    client = get_client()
    payload = {
        "official_url": official_url,
        "official_notification_url": official_url,
    }
    if official_url.lower().split("?")[0].endswith(".pdf"):
        payload["pdf_url"] = official_url
    client.table("updates").update(payload).eq("id", record_id).execute()


def _prepare_record(record: dict) -> dict:
    """Map collector fields to the real Supabase schema and drop unknown fields."""
    record = dict(record)

    if record.get("apply_url") and not record.get("apply_online_url"):
        record["apply_online_url"] = record["apply_url"]

    if record.get("official_url") and not record.get("official_notification_url"):
        record["official_notification_url"] = record["official_url"]

    if record.get("eligibility") and not record.get("qualification"):
        record["qualification"] = record["eligibility"]

    fee = record.get("application_fee")
    if fee is not None and not isinstance(fee, (dict, list)):
        record["application_fee"] = {"text": str(fee)}

    record.pop("apply_url", None)
    record.pop("eligibility", None)
    record.pop("notification_details", None)
    record.pop("meta_description", None)

    return {key: value for key, value in record.items() if key in UPDATES_COLUMNS}


def save_update(record: dict) -> None:
    """Insert a notice or update it without overwriting a verified official URL."""
    client = get_client()
    record = _prepare_record(record)
    record["slug"] = make_slug(record["title"], record["department"])
    record["content_hash"] = make_hash(record["title"], record["source_url"])

    existing = (
        client.table("updates")
        .select("id,official_url,official_notification_url,pdf_url")
        .eq("content_hash", record["content_hash"])
        .limit(1)
        .execute()
    )

    if existing.data:
        old = existing.data[0]
        old_official = old.get("official_url") or ""
        old_notification = old.get("official_notification_url") or ""
        incoming_official = record.get("official_url") or ""

        # Never replace a previously verified official destination with a
        # FreeJobAlert URL during the normal scrape after the repair pass.
        if old_official and "freejobalert.com" not in old_official.lower():
            if "freejobalert.com" in incoming_official.lower():
                record.pop("official_url", None)
            if old_notification and "freejobalert.com" not in old_notification.lower():
                record.pop("official_notification_url", None)
            if old.get("pdf_url") and "freejobalert.com" in (record.get("pdf_url") or "").lower():
                record.pop("pdf_url", None)

        client.table("updates").update(record).eq("id", old["id"]).execute()
        print(f"[updated] {record['department']} :: {record['title']}")
        return

    client.table("updates").insert(record).execute()
    print(f"[saved] {record['department']} :: {record['title']}")
