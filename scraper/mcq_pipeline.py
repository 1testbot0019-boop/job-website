import hashlib
import json
import os
import re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Use only first-party commission websites as factual source material.
# The pipeline creates ORIGINAL practice questions; it does not copy question
# banks or reproduce copyrighted third-party MCQ sets.
SOURCES = [
    {
        "name": "UKPSC",
        "url": "https://psc.uk.gov.in/",
        "exam_code": "UKPSC_GS_PRELIMS",
        "subject": "General Studies",
    },
    {
        "name": "UKPSC Archive",
        "url": "https://psc.uk.gov.in/archive/announcements",
        "exam_code": "UKPSC_GS_PRELIMS",
        "subject": "General Studies",
    },
    {
        "name": "UKSSSC Old Question Papers",
        "url": "https://sssc.uk.gov.in/pages/display/49-old-question-papers",
        "exam_code": "UKSSSC_GRADUATE",
        "subject": "General",
    },
    {
        "name": "UKSSSC",
        "url": "https://sssc.uk.gov.in/",
        "exam_code": "UKSSSC_GRADUATE",
        "subject": "General",
    },
]

HEADERS = {
    "User-Agent": "JobWebsite-MCQ-Bot/2.0 (+official-source-monitoring)"
}


def fetch_source(source):
    response = requests.get(source["url"], headers=HEADERS, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = " ".join(soup.stripped_strings)
    text = re.sub(r"\s+", " ", text)
    return text[:18000]


def generate_questions(source, source_text):
    if not OPENAI_API_KEY:
        print("OPENAI_API_KEY is not configured; skipping AI generation.")
        return []

    prompt = f"""
Create 30 ORIGINAL competitive-exam MCQs for Indian government-exam preparation.
Use ONLY the official source information below as factual context and combine it
with stable, standard exam knowledge relevant to the named exam. Do NOT copy,
quote, or reproduce questions from the source or any third-party question bank.

Target exam: {source['exam_code']}
Source: {source['name']}
Subject: {source['subject']}

Requirements:
- exactly 30 questions
- exactly 4 options per question
- exactly one correct option
- include a useful explanation
- avoid ambiguous, outdated, subjective, or duplicate questions
- for UKPSC GS include Indian polity, history, geography, science, economy,
  environment and Uttarakhand-specific preparation where appropriate
- for UKSSSC Graduate include Uttarakhand GK, India GK, reasoning, arithmetic,
  general awareness and other stable graduate-level preparation where appropriate
- do not claim that an AI-generated question is an official previous-year question

Return ONLY valid JSON as an array with objects having:
question, options (array of 4 strings), correct_answer (0-3), explanation, topic, difficulty.

Official source content:
{source_text}
"""

    payload = {
        "model": "gpt-4.1-mini",
        "input": prompt,
        "temperature": 0.35,
        "max_output_tokens": 12000,
    }
    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=180,
    )
    response.raise_for_status()
    data = response.json()
    output = data.get("output_text", "")
    if not output:
        parts = []
        for item in data.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in ("output_text", "text"):
                    parts.append(content.get("text", ""))
        output = "".join(parts)
    output = re.sub(r"^```(?:json)?\s*|\s*```$", "", output.strip(), flags=re.I)
    return json.loads(output)


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    total = 0
    seen_fingerprints = set()

    for source in SOURCES:
        try:
            source_text = fetch_source(source)
            questions = generate_questions(source, source_text)
            added = 0
            for item in questions:
                question = str(item.get("question", "")).strip()
                options = item.get("options")
                correct = item.get("correct_answer")
                if (
                    not question
                    or not isinstance(options, list)
                    or len(options) != 4
                    or not isinstance(correct, int)
                    or correct not in range(4)
                ):
                    continue

                fingerprint = hashlib.sha256(
                    (source["exam_code"] + "|" + question.lower()).encode()
                ).hexdigest()
                if fingerprint in seen_fingerprints:
                    continue
                seen_fingerprints.add(fingerprint)

                existing = (
                    supabase.table("mcq_questions")
                    .select("id")
                    .eq("question", question)
                    .limit(1)
                    .execute()
                )
                if existing.data:
                    continue

                supabase.table("mcq_questions").insert(
                    {
                        "subject": source["subject"],
                        "exam": source["name"],
                        "exam_code": source["exam_code"],
                        "question": question,
                        "options": options,
                        "correct_answer": int(correct),
                        "explanation": str(item.get("explanation", "")).strip(),
                        "topic": str(item.get("topic", "General")),
                        "difficulty": str(item.get("difficulty", "medium")).lower(),
                        "source_url": source["url"],
                        "source_name": source["name"],
                        "negative_marks": 0.25,
                    }
                ).execute()
                total += 1
                added += 1
            print(f"{source['name']}: added {added} original MCQs")
        except Exception as exc:
            print(f"{source['name']} failed: {exc}")

    print(
        f"Pipeline complete. Inserted {total} new MCQs at "
        f"{datetime.now(timezone.utc).isoformat()}"
    )


if __name__ == "__main__":
    main()
