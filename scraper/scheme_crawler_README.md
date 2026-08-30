# Government scheme crawler

`government_schemes_crawler.py` crawls configured official government domains only. It discovers scheme/yojana/welfare/benefit pages, extracts title and description, stores the official page URL, and writes to Supabase `government_schemes`.

Coverage catalogue: Central Government + 28 States + 8 Union Territories.

The crawler is conservative and does not invent or substitute third-party URLs. Some government sites are JavaScript-heavy or expose schemes only through PDFs/API calls; those sources may require a dedicated adapter later.
