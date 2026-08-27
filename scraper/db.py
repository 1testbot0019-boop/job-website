"""Shared database helper for all scrapers."""

import os
import re
import hashlib
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_client: Client | None = None


# ============================================================
# 9 MANUAL OFFICIAL NOTIFICATION URL OVERRIDES
# ============================================================

MANUAL_OFFICIAL_URLS = {
    "734415c5-28dd-4cf8-8f51-dfebe6865e0f":
        "https://cdn.s3waas.gov.in/s33a0772443a0739141292a5429b952fe6/uploads/2026/08/17876394141665.pdf",

    "71759583-34b4-429c-b370-98ad60cf49b3":
        "https://iitr.ac.in/Careers/static/Project_Jobs/CE/2026/adv210820261.pdf",

    "93d07165-b550-4b40-a1cd-94d151564d79":
        "https://iitr.ac.in/Careers/static/Post_Doctoral_Fellowship/CE/2026/adv190820264.pdf",

    "8526d0bd-1efb-4366-9da7-4731bc03af0c":
        "https://iitr.ac.in/Careers/static/Project_Jobs/MI/2026/adv22082026.pdf",

    "fb2e1b2a-4b5a-4d75-a508-71d67173682a":
        "https://www.powergrid.in/sites/default/files/apprentices_document/NR-I%20Detailed%20Advertisement..pdf",

    "4cf67b9f-0f08-459a-b944-fe0c1a3a10d0":
        "https://bel-india.in/wp-content/uploads/2026/08/Deatiled-Security-Havildar-Advertisment.pdf",

    "9b90614a-e02c-454f-b4a4-5b51cf5fbec1":
        "https://psc.uk.gov.in/candidate-corner/recruitment",

    "2777b43d-e461-463e-8784-acc480243de4":
        "https://iitr.ac.in/Careers/static/Project_Jobs/CE/2026/adv200820261.pdf",

    "54c56641-98d4-4df8-95ca-874026da5e58":
        "https://nituk.ac.in/uploads/topics/17875656546470.pdf",
}


# ============================================================
# ACTUAL SUPABASE COLUMNS
# ============================================================

UPDATES_COLUMNS = {
    "id",
    "title",
    "slug",
    "category",
    "department",
    "description",
    "important_dates",
    "published_date",
    "source_url",
    "official_url",
    "pdf_url",
    "content_hash",
    "is_active",
    "created_at",
    "last_updated",
    "search_vector",
    "vacancy_details",
    "qualification",
    "age_limit",
    "application_fee",
    "selection_process",
    "how_to_apply",
    "official_notification_url",
    "apply_online_url",
    "official_website_url",
}


# ============================================================
# SUPABASE CLIENT
# ============================================================

def get_client() -> Client:
    global _client

    if _client is None:

        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_KEY env vars are not set. "
                "Add them as GitHub Actions secrets."
            )

        _client = create_client(
            SUPABASE_URL,
            SUPABASE_KEY
        )

    return _client


# ============================================================
# SLUG
# ============================================================

def make_slug(title: str, department: str) -> str:

    base = f"{department}-{title}"

    return re.sub(
        r"[^a-z0-9]+",
        "-",
        base.lower()
    ).strip("-")[:180]


# ============================================================
# CONTENT HASH
# ============================================================

def make_hash(title: str, source_url: str) -> str:

    return hashlib.sha256(
        f"{title.strip()}|{source_url.strip()}".encode()
    ).hexdigest()


# ============================================================
# GET OLD FREEJOBALERT RECORDS
# ============================================================

def get_freejobalert_records() -> list[dict]:

    client = get_client()

    response = (
        client.table("updates")
        .select("id,title,official_url,source_url")
        .ilike(
            "official_url",
            "%freejobalert.com%"
        )
        .execute()
    )

    return response.data or []


# ============================================================
# MANUAL REPAIR
# ============================================================

def repair_manual_official_urls():

    client = get_client()

    print(
        f"[manual repair] processing "
        f"{len(MANUAL_OFFICIAL_URLS)} records"
    )

    for record_id, official_url in MANUAL_OFFICIAL_URLS.items():

        update_data = {
            "official_url": official_url,
            "official_notification_url": official_url,
        }

        if official_url.lower().split("?")[0].endswith(".pdf"):
            update_data["pdf_url"] = official_url

        response = (
            client.table("updates")
            .update(update_data)
            .eq("id", record_id)
            .execute()
        )

        print(
            f"[manual repair:fixed] {record_id}"
        )

        print(
            f"  NEW: {official_url}"
        )

    print(
        f"[manual repair] completed: "
        f"{len(MANUAL_OFFICIAL_URLS)}/"
        f"{len(MANUAL_OFFICIAL_URLS)}"
    )


# ============================================================
# PREPARE RECORD
# ============================================================

def _prepare_record(record: dict) -> dict:

    record = dict(record)

    # apply_url → apply_online_url
    if (
        record.get("apply_url")
        and not record.get("apply_online_url")
    ):
        record["apply_online_url"] = record["apply_url"]

    # official_url → official_notification_url
    if (
        record.get("official_url")
        and not record.get("official_notification_url")
    ):
        record["official_notification_url"] = (
            record["official_url"]
        )

    # eligibility → qualification
    if (
        record.get("eligibility")
        and not record.get("qualification")
    ):
        record["qualification"] = record["eligibility"]

    # JSONB application fee
    fee = record.get("application_fee")

    if fee is not None and not isinstance(
        fee,
        (dict, list)
    ):
        record["application_fee"] = {
            "text": str(fee)
        }

    # Remove fields that don't exist in DB
    record.pop("apply_url", None)
    record.pop("eligibility", None)
    record.pop("notification_details", None)
    record.pop("meta_description", None)

    return {
        key: value
        for key, value in record.items()
        if key in UPDATES_COLUMNS
    }


# ============================================================
# SAVE / UPDATE JOB
# ============================================================

def save_update(record: dict) -> None:

    client = get_client()

    record = _prepare_record(record)

    record["slug"] = make_slug(
        record["title"],
        record["department"]
    )

    record["content_hash"] = make_hash(
        record["title"],
        record["source_url"]
    )

    # --------------------------------------------------------
    # Check whether record already exists
    # --------------------------------------------------------

    existing = (
        client.table("updates")
        .select(
            "id,official_url,official_notification_url"
        )
        .eq(
            "content_hash",
            record["content_hash"]
        )
        .limit(1)
        .execute()
    )

    if existing.data:

        existing_row = existing.data[0]

        existing_id = existing_row["id"]

        # ----------------------------------------------------
        # NEVER allow FreeJobAlert to replace a verified URL
        # ----------------------------------------------------

        if existing_id in MANUAL_OFFICIAL_URLS:

            locked_url = MANUAL_OFFICIAL_URLS[
                existing_id
            ]

            record["official_url"] = locked_url

            record[
                "official_notification_url"
            ] = locked_url

            if locked_url.lower().split("?")[0].endswith(".pdf"):
                record["pdf_url"] = locked_url

            print(
                "[protected] Keeping manual official URL"
            )

            print(
                f"  {record['title']}"
            )

            print(
                f"  OFFICIAL: {locked_url}"
            )

        else:

            # ----------------------------------------------
            # Protect against FreeJobAlert overwriting
            # an existing official URL
            # ----------------------------------------------

            old_url = existing_row.get(
                "official_url"
            )

            if (
                old_url
                and "freejobalert.com"
                not in old_url.lower()
                and record.get("official_url")
                and "freejobalert.com"
                in record["official_url"].lower()
            ):

                record["official_url"] = old_url

                existing_notification = (
                    existing_row.get(
                        "official_notification_url"
                    )
                )

                if existing_notification:
                    record[
                        "official_notification_url"
                    ] = existing_notification

                print(
                    "[protected] Existing official URL kept"
                )

        # ----------------------------------------------------
        # Update existing row
        # ----------------------------------------------------

        (
            client.table("updates")
            .update(record)
            .eq("id", existing_id)
            .execute()
        )

        print(
            f"[updated] "
            f"{record['department']} :: "
            f"{record['title']}"
        )

        return

    # ========================================================
    # New record
    # ========================================================

    client.table("updates").insert(
        record
    ).execute()

    print(
        f"[saved] "
        f"{record['department']} :: "
        f"{record['title']}"
    )
