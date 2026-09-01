"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getCategory, TEST_CATEGORIES } from "../../lib/mcq";

const MIXED_SIZE = 10;
const SUBJECT_SIZE = 5;
const TEST_TIME = 10 * 60;

export default function TakeTestPage() {
  const [category, setCategory] = useState("mixed"); const [questions, setQuestions] = useState([]); const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0); const [seconds, setSeconds] = useState(TEST_TIME); const [started, setStarted] = useState(false); const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [user, setUser] = useState(null); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [testId, setTestId] = useState(null);
  const selectedCategory = useMemo(() => getCategory(category), [category]);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user || null)); const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null)); return () => l.subscription.unsubscribe(); }, []);
  useEffect(() => { if (!started || submitted) return; if (seconds <= 0) { setSubmitted(true); return; } const t = setInterval(() => setSeconds(v => v - 1), 1000); return () => clearInterval(t); }, [started, submitted, seconds]);

  async function startTest(id = category) {
    setLoading(true); setError(""); setSaved(false);
    const size = id === "mixed" ? MIXED_SIZE : SUBJECT_SIZE; let query = supabase.from("mcq_questions").select("id,subject,exam,question,options,correct_answer,explanation");
    if (id !== "mixed") query = query.eq("subject", TEST_CATEGORIES.find(x => x.id === id)?.title || id);
    const { data, error: e } = await query; setLoading(false); if (e || !data?.length) { setError(e?.message || "No MCQs are available for this subject yet."); return; }
    const selected = [...data].sort(() => Math.random() - .5).slice(0, Math.min(size, data.length));
    const subjectTitle = id === "mixed" ? "Mixed" : TEST_CATEGORIES.find(x => x.id === id)?.title || id;
    const { data: td } = await supabase.from("tests").select("id").eq("subject", subjectTitle).eq("is_active", true).limit(1).maybeSingle();
    setTestId(td?.id || null); setCategory(id); setQuestions(selected); setAnswers({}); setCurrent(0); setSeconds(TEST_TIME); setSubmitted(false); setStarted(true);
  }

  async function submit() {
    setSubmitted(true); if (!user || saved) return; setSaving(true);
    const scoreNow = questions.reduce((n, q) => n + (answers[q.id] === q.correct_answer ? 1 : 0), 0); const attemptedNow = Object.keys(answers).length; const wrongNow = attemptedNow - scoreNow; const unansweredNow = questions.length - attemptedNow;
    const pct = questions.length ? Number(((scoreNow / questions.length) * 100).toFixed(2)) : 0;
    const { error: e } = await supabase.from("test_attempts").insert({ test_id: testId, user_id: user.id, score: scoreNow, total_questions: questions.length, correct_answers: scoreNow, wrong_answers: wrongNow, unanswered: unansweredNow, percentage: pct, answers, submitted_at: new Date().toISOString() });
    setSaving(false); if (!e) setSaved(true); else setError(e.message);
  }

  const score = questions.reduce((n, q) => n + (answers[q.id] === q.correct_answer ? 1 : 0), 0); const attempted = Object.keys(answers).length; const wrong = attempted - score; const unanswered = questions.length - attempted; const percentage = questions.length ? Math.round(score / questions.length * 100) : 0;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0"), secs = (seconds % 60).toString().padStart(2, "0");

  if (!started) return <div className="test-page"><section className="test-hero"><div><span className="eyebrow">FREE MOCK TESTS</span><h1>Test Your Preparation</h1><p>Live MCQs from your Supabase question bank, selected for competitive exams.</p></div><div className="test-hero-stat"><strong>5–10</strong><span>Questions / Test</span></div><div className="test-hero-stat"><strong>10 min</strong><span>Time Limit</span></div></section>{error && <div className="notice-bar"><strong>Notice</strong>{error}</div>}<div className="test-layout"><main className="test-main-card"><div className="test-section-heading"><div><span className="eyebrow">CHOOSE A SUBJECT</span><h2>Start a Practice Test</h2></div><span className="test-badge">Supabase MCQs</span></div><div className="subject-grid"><button disabled={loading} className="subject-card mixed" onClick={() => startTest("mixed")}><span>⚡</span><strong>Mixed Test</strong><small>10 questions • All subjects</small></button>{TEST_CATEGORIES.map(item => <button disabled={loading} key={item.id} className="subject-card" onClick={() => startTest(item.id)}><span>{item.icon}</span><strong>{item.title}</strong><small>5 relevant MCQs • {item.description}</small></button>)}</div></main><aside className="test-side-card"><h3>How it works</h3><div className="step"><b>1</b><span>Choose your subject</span></div><div className="step"><b>2</b><span>Answer live MCQs</span></div><div className="step"><b>3</b><span>Finish before the timer</span></div><div className="step"><b>4</b><span>See score & explanations</span></div><div className="test-ad-placeholder">ADVERTISEMENT</div></aside></div></div>;

  if (submitted) return <div className="test-page"><section className="result-card"><span className="eyebrow">TEST COMPLETED</span><h1>{percentage >= 80 ? "Excellent Work! 🎉" : percentage >= 50 ? "Good Attempt! 💪" : "Keep Practising! 📚"}</h1><div className="score-circle"><strong>{score}/{questions.length}</strong><span>{percentage}%</span></div><div className="result-stats"><div><strong>{score}</strong><span>Correct</span></div><div><strong>{wrong}</strong><span>Wrong</span></div><div><strong>{unanswered}</strong><span>Unanswered</span></div></div><div className="result-ad">ADVERTISEMENT</div>{saving && <p className="save-status">Saving your result…</p>}{saved && <p className="save-status">✓ Result saved to your student account.</p>}{!user && <p className="save-status">Login to save your score and track your progress.</p>}{error && <p className="save-status">{error}</p>}<div className="result-actions"><button onClick={() => startTest(category)} className="primary-test-btn">Retake Test</button><button onClick={() => { setStarted(false); setSubmitted(false); }} className="secondary-test-btn">Choose Another Subject</button>{user ? <Link href="/dashboard" className="secondary-test-btn">My Dashboard</Link> : <Link href="/login" className="secondary-test-btn">Login / Signup</Link>}<Link href="/jobs" className="secondary-test-btn">View Latest Jobs</Link></div></section><section className="answer-review"><div className="test-section-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h2>See your answers</h2></div><span className="test-badge">{selectedCategory?.title || "Mixed Test"}</span></div>{questions.map((q, i) => { const ua = answers[q.id]; const ok = ua === q.correct_answer; return <article key={q.id} className={`review-item ${ok ? "correct" : "wrong"}`}><div className="review-number">{i + 1}</div><div className="review-content"><h3>{q.question}</h3><p>Your answer: <b>{ua === undefined ? "Not attempted" : q.options[ua]}</b></p><p>Correct answer: <b>{q.options[q.correct_answer]}</b></p><small>{q.explanation}</small></div><div className="review-icon">{ok ? "✓" : "✕"}</div></article>; })}</section></div>;

  const q = questions[current], progress = Math.round((current + 1) / questions.length * 100);
  return <div className="test-page"><section className="quiz-topbar"><div><span className="eyebrow">{selectedCategory?.title || "MIXED TEST"}</span><h1>Mock Test</h1></div><div className={`quiz-timer ${seconds <= 60 ? "danger" : ""}`}>⏱ {minutes}:{secs}</div></section><div className="quiz-progress"><span style={{ width: `${progress}%` }} /></div><div className="quiz-layout"><main className="question-card"><div className="question-meta"><span>Question {current + 1} of {questions.length}</span><span>{attempted} answered</span></div><h2>{q.question}</h2><div className="option-list">{q.options.map((option, i) => <button key={option} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))} className={`option ${answers[q.id] === i ? "selected" : ""}`}><span>{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div className="quiz-actions"><button disabled={current === 0} onClick={() => setCurrent(v => v - 1)} className="secondary-test-btn">← Previous</button>{current < questions.length - 1 ? <button onClick={() => setCurrent(v => v + 1)} className="primary-test-btn">Next Question →</button> : <button onClick={submit} className="primary-test-btn">Submit Test ✓</button>}</div></main><aside className="question-nav-card"><h3>Questions</h3><div className="question-numbers">{questions.map((item, i) => <button key={item.id} onClick={() => setCurrent(i)} className={`${current === i ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`}>{i + 1}</button>)}</div><div className="quiz-legend"><span><i className="dot answered-dot" />Answered</span><span><i className="dot" />Not answered</span></div><div className="test-ad-placeholder">ADVERTISEMENT</div></aside></div></div>;
}
