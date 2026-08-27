"""Shared database helper for all scrapers."""

import os
import re
import hashlib

from supabase import create_client, Client


# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_client: Client | None = None


# ============================================================
# 9 MANUALLY VERIFIED OFFICIAL URLS
# ============================================================

MANUAL_OFFICIAL_URLS = {

    # DESO Almora - GIS Technician
    "734415c5-28dd-4cf8-8f51-dfebe6865e0f":
        "https://cdn.s3waas.gov.in/s33a0772443a0739141292a5429b952fe6/uploads/2026/08/17876394141665.pdf",

    # IIT Roorkee - Project Associate
    "71759583-34b4-429c-b370-98ad60cf49b3":
        "https://iitr.ac.in/Careers/static/Project_Jobs/CE/2026/adv210820261.pdf",

    # IIT Roorkee - Post-Doctoral Fellow
    "93d07165-b550-4b40-a1cd-94d151564d79":
        "https://iitr.ac.in/Careers/static/Post_Doctoral_Fellowship/CE/2026/adv190820264.pdf",

    # IIT Roorkee - Junior Research Fellow
    "8526d0bd-1efb-4366-9da7-4731bc03af0c":
        "https://iitr.ac.in/Careers/static/Project_Jobs/MI/2026/adv22082026.pdf",

    # POWERGRID - Apprentices
    "fb2e1b2a-4b5a-4d75-a508-71d67173682a":
        "https://www.powergrid.in/sites/default/files/apprentices_document/NR-I%20Detailed%20Advertisement..pdf",

    # BEL - Havildar
    "4cf67b9f-0f08-459a-b944-fe0c1a3a10d0":
        "https://bel-india.in/wp-content/uploads/2026/08/Deatiled-Security-Havildar-Advertisment.pdf",

    # UKPSC - Veterinary Officer
    "9b90614a-e02c-454f-b4a4-5b51cf5fbec1":
        "https://psc.uk.gov.in/candidate-corner/recruitment",

    # IIT Roorkee - Research Associate I / JRF
    "2777b43d-e461-463e-8784-acc480243de4":
        "https://iitr.ac.in/Careers/static/Project_Jobs/CE/2026/adv200820261.pdf",

    # NIT Uttarakhand - JRF / Research Associate
    "54c56641-98d4-4df8-95ca-874026da5e58":
        "https://nituk.ac.in/uploads/topics/17875656546470.pdf",
}


# ============================================================
# SUPABASE TABLE COLUMNS
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
# SLUG GENERATOR
# ============================================================

def make_slug(
    title: str,
    department: str
) -> str:

    base = f"{department}-{title}"

    slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        base.lower()
    )

    return slug.strip("-")[:180]


# ============================================================
# CONTENT HASH
# ============================================================

def make_hash(
    title: str,
    source_url: str
) -> str:

    value = (
        f"{title.strip()}|"
        f"{source_url.strip()}"
    )

    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


# ============================================================
# GET FREEJOBALERT RECORDS
# ============================================================

def get_freejobalert_records() -> list[dict]:

    client = get_client()

    response = (
        client
        .table("updates")
        .select(
            "id,title,official_url,source_url"
        )
        .ilike(
            "official_url",
            "%freejobalert.com%"
        )
        .execute()
    )

    return response.data or []


# ============================================================
# UPDATE OFFICIAL URL
# ============================================================

def update_official_url(
    record_id: str,
    official_url: str
) -> None:

    client = get_client()

    update_data = {
        "official_url": official_url,
        "official_notification_url": official_url,
    }

    # If URL is a PDF, also save it as pdf_url.
    if (
        official_url
        .lower()
        .split("?")[0]
        .endswith(".pdf")
    ):

        update_data["pdf_url"] = official_url

    (
        client
        .table("updates")
        .update(update_data)
        .eq("id", record_id)
        .execute()
    )


# ============================================================
# REPAIR ALL 9 MANUAL RECORDS
# ============================================================

def repair_manual_official_urls() -> None:

    client = get_client()

    print(
        "[manual repair] processing "
        f"{len(MANUAL_OFFICIAL_URLS)} records"
    )

    repaired = 0

    for record_id, official_url in (
        MANUAL_OFFICIAL_URLS.items()
    ):

        update_data = {
            "official_url": official_url,
            "official_notification_url": official_url,
        }

        if (
            official_url
            .lower()
            .split("?")[0]
            .endswith(".pdf")
        ):

            update_data["pdf_url"] = official_url

        (
            client
            .table("updates")
            .update(update_data)
            .eq("id", record_id)
            .execute()
        )

        repaired += 1

        print(
            f"[manual repair:fixed] {record_id}"
        )

        print(
            f"  NEW: {official_url}"
        )

    print(
        "[manual repair] completed: "
        f"{repaired}/{len(MANUAL_OFFICIAL_URLS)}"
    )


# ============================================================
# PREPARE RECORD BEFORE INSERT / UPDATE
# ============================================================

def _prepare_record(
    record: dict
) -> dict:

    record = dict(record)

    # --------------------------------------------------------
    # apply_url -> apply_online_url
    # --------------------------------------------------------

    if (
        record.get("apply_url")
        and not record.get("apply_online_url")
    ):

        record["apply_online_url"] = (
            record["apply_url"]
        )


    # --------------------------------------------------------
    # official_url -> official_notification_url
    # --------------------------------------------------------

    if (
        record.get("official_url")
        and not record.get(
            "official_notification_url"
        )
    ):

        record["official_notification_url"] = (
            record["official_url"]
        )


    # --------------------------------------------------------
    # eligibility -> qualification
    # --------------------------------------------------------

    if (
        record.get("eligibility")
        and not record.get("qualification")
    ):

        record["qualification"] = (
            record["eligibility"]
        )


    # --------------------------------------------------------
    # Convert application_fee to JSONB-compatible value
    # --------------------------------------------------------

    fee = record.get(
        "application_fee"
    )

    if (
        fee is not None
        and not isinstance(
            fee,
            (dict, list)
        )
    ):

        record["application_fee"] = {
            "text": str(fee)
        }


    # --------------------------------------------------------
    # Remove fields that don't exist in Supabase
    # --------------------------------------------------------

    record.pop(
        "apply_url",
        None
    )

    record.pop(
        "eligibility",
        None
    )

    record.pop(
        "notification_details",
        None
    )

    record.pop(
        "meta_description",
        None
    )


    # --------------------------------------------------------
    # Only return actual DB columns
    # --------------------------------------------------------

    return {
        key: value
        for key, value in record.items()
        if key in UPDATES_COLUMNS
    }


# ============================================================
# FIND EXISTING RECORD
# ============================================================

def _find_existing_record(
    record: dict
):

    client = get_client()

    content_hash = record.get(
        "content_hash"
    )

    if content_hash:

        response = (
            client
            .table("updates")
            .select(
                "id,title,official_url,"
                "official_notification_url,"
                "pdf_url"
            )
            .eq(
                "content_hash",
                content_hash
            )
            .limit(1)
            .execute()
        )

        if response.data:

            return response.data[0]


    # --------------------------------------------------------
    # Fallback: match by source URL.
    # --------------------------------------------------------

    source_url = record.get(
        "source_url"
    )

    if source_url:

        response = (
            client
            .table("updates")
            .select(
                "id,title,official_url,"
                "official_notification_url,"
                "pdf_url"
            )
            .eq(
                "source_url",
                source_url
            )
            .limit(1)
            .execute()
        )

        if response.data:

            return response.data[0]


    return None


# ============================================================
# SAVE / UPDATE JOB
# ============================================================

def save_update(
    record: dict
) -> None:

    client = get_client()

    record = _prepare_record(
        record
    )


    # --------------------------------------------------------
    # Required values
    # --------------------------------------------------------

    title = record.get(
        "title",
        ""
    )

    department = record.get(
        "department",
        "Uttarakhand Govt"
    )

    source_url = record.get(
        "source_url",
        ""
    )


    # --------------------------------------------------------
    # Generate slug
    # --------------------------------------------------------

    record["slug"] = make_slug(
        title,
        department
    )


    # --------------------------------------------------------
    # Generate content hash
    # --------------------------------------------------------

    record["content_hash"] = make_hash(
        title,
        source_url
    )


    # --------------------------------------------------------
    # Find existing record
    # --------------------------------------------------------

    existing = _find_existing_record(
        record
    )


    # ========================================================
    # EXISTING RECORD
    # ========================================================

    if existing:

        existing_id = existing[
            "id"
        ]


        # ----------------------------------------------------
        # MANUAL 9 RECORD PROTECTION
        # ----------------------------------------------------

        if existing_id in (
            MANUAL_OFFICIAL_URLS
        ):

            locked_url = (
                MANUAL_OFFICIAL_URLS[
                    existing_id
                ]
            )


            # NEVER allow FreeJobAlert URL
            # to overwrite the verified URL.

            record[
                "official_url"
            ] = locked_url

            record[
                "official_notification_url"
            ] = locked_url


            if (
                locked_url
                .lower()
                .split("?")[0]
                .endswith(".pdf")
            ):

                record[
                    "pdf_url"
                ] = locked_url


            print(
                "[protected] Keeping manual "
                "official URL"
            )

            print(
                f"  {title}"
            )

            print(
                f"  OFFICIAL: {locked_url}"
            )


        else:

            # ------------------------------------------------
            # GENERAL PROTECTION
            #
            # If database already contains a real official
            # URL, don't replace it with FreeJobAlert.
            # ------------------------------------------------

            old_official_url = (
                existing.get(
                    "official_url"
                )
            )

            new_official_url = (
                record.get(
                    "official_url"
                )
            )


            old_is_freejobalert = (
                old_official_url
                and
                "freejobalert.com"
                in old_official_url.lower()
            )


            new_is_freejobalert = (
                new_official_url
                and
                "freejobalert.com"
                in new_official_url.lower()
            )


            if (
                old_official_url
                and not old_is_freejobalert
                and new_is_freejobalert
            ):

                # Keep existing verified URL.
                record[
                    "official_url"
                ] = old_official_url


                old_notification_url = (
                    existing.get(
                        "official_notification_url"
                    )
                )


                if old_notification_url:

                    record[
                        "official_notification_url"
                    ] = (
                        old_notification_url
                    )


                old_pdf_url = (
                    existing.get(
                        "pdf_url"
                    )
                )


                if old_pdf_url:

                    record[
                        "pdf_url"
                    ] = old_pdf_url


                print(
                    "[protected] Existing official "
                    "URL kept"
                )


        # ----------------------------------------------------
        # Update existing row
        # ----------------------------------------------------

        (
            client
            .table("updates")
            .update(record)
            .eq(
                "id",
                existing_id
            )
            .execute()
        )


        print(
            "[updated] "
            f"{department} :: {title}"
        )

        return


    # ========================================================
    # NEW RECORD
    # ========================================================

    # For a brand-new FreeJobAlert record, the scraper is
    # allowed to insert it only if it has a verified
    # non-FreeJobAlert official URL.

    new_official_url = record.get(
        "official_url"
    )


    if (
        new_official_url
        and
        "freejobalert.com"
        in new_official_url.lower()
    ):

        print(
            "[skip] Refusing to save a "
            "FreeJobAlert URL as official_url:"
        )

        print(
            f"  {title}"
        )

        return


    # --------------------------------------------------------
    # Insert
    # --------------------------------------------------------

    (
        client
        .table("updates")
        .insert(record)
        .execute()
    )


    print(
        "[saved] "
        f"{department} :: {title}"
    )
