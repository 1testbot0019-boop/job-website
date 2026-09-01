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

SOURCES = [
    {
        "name": "UKPSC",
        "url": "https://psc.uk.gov.in/",
        "exam_code": "UKPSC_GS_PRELIMS",
        "subject": "General Studies",
    },
    {
        "name": "UKSSSC",
        "url": "https://sssc.uk.gov.in/",
        "exam_code": "UKSSSC_GRADUATE",
        "subject": "General",
    },
]

HEADERS = {"User-Agent": "JobWebsite-MCQ-Bot/1.0 (+official-source-monitoring)"}


def fetch_source(source):
    response = requests.get(source["url"], headers=HEADERS, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = " ".join(soup.stripped_strings)
    text = re.sub(r"\s+", " ", text)
    return text[:12000]


def generate_questions(source, source_text):
    if not OPENAI_API_KEY:
        print("OPENAI_API_KEY is not configured; skipping AI generation.")
        return []

    prompt = f"""
Create 20 ORIGINAL competitive-exam MCQs for Indian government-exam preparation.
Use the official source information below only as factual context. Do NOT copy questions from any source.
Prefer current, syllabus-relevant and exam-style questions. Avoid ambiguous questions.
Each question must have exactly 4 options and exactly one correct option.
Return ONLY valid JSON as an array with objects having:
question, options (array of 4 strings), correct_answer (0-3), explanation, topic, difficulty.
Source: {source['name']}
Exam: {source['exam_code']}
Subject: {source['subject']}
Official source content:
{source_text}
"""

    payload = {
        "model": "gpt-4.1-mini",
        "input": prompt,
        "temperature": 0.4,
        "max_output_tokens": 8000,
    }
    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()
    output = data.get("output_text", "")
    if not output:
        # Fallback for response payloads that expose text in output blocks.
        parts = []
        for item in data.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in ("output_text", "text"):
                    parts.append(content.get("text", ""))
        output = "".join(parts)
    output = output.strip()
    output = re.sub(r"^```(?:json)?\s*|\s*```$", "", output, flags=re.I)
    return json.loads(output)


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    total = 0
    for source in SOURCES:
        try:
            source_text = fetch_source(source)
            questions = generate_questions(source, source_text)
            for item in questions:
                question = str(item.get("question", "")).strip()
                options = item.get("options")
                correct = item.get("correct_answer")
                if not question or not isinstance(options, list) or len(options) != 4 or correct not in range(4):
                    continue
                fingerprint = hashlib.sha256((source["exam_code"] + "|" + question.lower()).encode()).hexdigest()
                existing = supabase.table("mcq_questions").select("id").eq("question", question).limit(1).execute()
                if existing.data:
                    continue
                supabase.table("mcq_questions").insert({
                    "subject": source["subject"],
                    "exam": source["exam_code"],
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
                }).execute()
                total += 1
            print(f"{source['name']}: added {len(questions)} generated candidates")
        except Exception as exc:
            print(f"{source['name']} failed: {exc}")
    print(f"Pipeline complete. Inserted {total} new MCQs at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    main()
