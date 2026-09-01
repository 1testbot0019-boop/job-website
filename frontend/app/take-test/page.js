"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getCategory, TEST_CATEGORIES } from "../../lib/mcq";

const MIXED_SIZE = 10;
const SUBJECT_SIZE = 5;
const TEST_TIME = 10 * 60;
const examGroups = [
  { id: "all", title: "All Tests", icon: "🎯" },
  { id: "government", title: "Government Exams", icon: "🇮🇳" },
  { id: "uttarakhand", title: "Uttarakhand Exams", icon: "🏔️" },
  { id: "aptitude", title: "Aptitude & Reasoning", icon: "🧠" },
];

export default function TakeTestPage() {
  const [category, setCategory] = useState("mixed");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(TEST_TIME);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testId, setTestId] = useState(null);
  const [activeGroup, setActiveGroup] = useState("all");
  const selectedCategory = useMemo(() => getCategory(category), [category]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!started || submitted) return;
    if (seconds <= 0) { setSubmitted(true); return; }
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [started, submitted, seconds]);

  async function startTest(id = category) {
    setLoading(true); setError(""); setSaved(false);
    const size = id === "mixed" ? MIXED_SIZE : SUBJECT_SIZE;
    let query = supabase.from("mcq_questions").select("id,subject,exam,question,options,correct_answer,explanation");
    if (id !== "mixed") query = query.eq("subject", TEST_CATEGORIES.find((item) => item.id === id)?.title || id);
    const { data, error: queryError } = await query;
    setLoading(false);
    if (queryError || !data?.length) { setError(queryError?.message || "No MCQs are available for this subject yet."); return; }
    const selected = [...data].sort(() => Math.random() - 0.5).slice(0, Math.min(size, data.length));
    const subjectTitle = id === "mixed" ? "Mixed" : TEST_CATEGORIES.find((item) => item.id === id)?.title || id;
    const { data: testData } = await supabase.from("tests").select("id").eq("subject", subjectTitle).eq("is_active", true).limit(1).maybeSingle();
    setTestId(testData?.id || null); setCategory(id); setQuestions(selected); setAnswers({}); setCurrent(0); setSeconds(TEST_TIME); setSubmitted(false); setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitted(true);
    if (!user || saved) return;
    setSaving(true);
    const scoreNow = questions.reduce((total, q) => total + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
    const attemptedNow = Object.keys(answers).length;
    const wrongNow = attemptedNow - scoreNow;
    const unansweredNow = questions.length - attemptedNow;
    const pct = questions.length ? Number(((scoreNow / questions.length) * 100).toFixed(2)) : 0;
    const { error: saveError } = await supabase.from("test_attempts").insert({ test_id: testId, user_id: user.id, score: scoreNow, total_questions: questions.length, correct_answers: scoreNow, wrong_answers: wrongNow, unanswered: unansweredNow, percentage: pct, answers, submitted_at: new Date().toISOString() });
    setSaving(false); if (!saveError) setSaved(true); else setError(saveError.message);
  }

  const score = questions.reduce((total, q) => total + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
  const attempted = Object.keys(answers).length;
  const wrong = attempted - score;
  const unanswered = questions.length - attempted;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  if (!started) {
    const visibleCategories = activeGroup === "all" ? TEST_CATEGORIES : TEST_CATEGORIES.filter((item) => {
      if (activeGroup === "uttarakhand") return item.id === "uk-gk";
      if (activeGroup === "aptitude") return ["reasoning", "quant", "english", "computer"].includes(item.id);
      return ["gk", "reasoning", "quant", "english", "computer", "polity"].includes(item.id);
    });
    return <div className="test-hub">
      <section className="test-hub-hero"><div className="test-hub-hero-copy"><span className="test-hub-kicker">FREE MOCK TESTS</span><h1>Practice. Improve. <em>Crack Your Exam.</em></h1><p>Attempt exam-focused mock tests, check your score instantly and understand where you need more practice.</p><div className="test-hero-actions"><button className="hub-primary-btn" onClick={() => startTest("mixed")} disabled={loading}>{loading ? "Loading…" : "Start Free Mock Test →"}</button><Link className="hub-outline-btn" href="/dashboard">View My Progress</Link></div><div className="hero-trust"><span>✓ Free to attempt</span><span>✓ Instant results</span><span>✓ Detailed solutions</span></div></div><div className="hero-score-card"><div className="hero-score-icon">🏆</div><strong>Prepare like the real exam</strong><p>Timed questions • Practice sets • Performance tracking</p><div className="mini-score-row"><span>Questions</span><b>5–10</b></div><div className="mini-score-row"><span>Time</span><b>10 min</b></div></div></section>
      <section className="test-hub-content">{error && <div className="notice-bar"><strong>Notice</strong>{error}</div>}
        <div className="test-hub-heading"><div><span className="hub-section-kicker">EXPLORE TEST SERIES</span><h2>Choose your exam</h2><p>Practice with relevant MCQs for the exams you are preparing for.</p></div><span className="series-count">{TEST_CATEGORIES.length + 1} free practice sets</span></div>
        <div className="exam-tabs">{examGroups.map((group) => <button key={group.id} onClick={() => setActiveGroup(group.id)} className={activeGroup === group.id ? "active" : ""}><span>{group.icon}</span>{group.title}</button>)}</div>
        <div className="featured-test-card"><div className="featured-icon">⚡</div><div className="featured-copy"><span>RECOMMENDED</span><h3>Daily Mixed Mock Test</h3><p>10 questions from General Knowledge, Reasoning, Quantitative Aptitude, English and Computer.</p><div className="featured-meta"><b>10 Questions</b><b>10 Minutes</b><b>Instant Result</b></div></div><button onClick={() => startTest("mixed")} disabled={loading} className="featured-btn">Take Test →</button></div>
        <div className="test-series-grid">{visibleCategories.map((item) => <article className="series-card" key={item.id}><div className="series-card-top"><div className="series-icon">{item.icon}</div><span className="free-pill">FREE</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="series-info"><span>📝 {SUBJECT_SIZE} MCQs</span><span>⏱ 10 min</span></div><button onClick={() => startTest(item.id)} disabled={loading}>Start Practice →</button></article>)}</div>
        <div className="hub-ad-slot">ADVERTISEMENT</div>
        <section className="why-test-section"><div className="test-hub-heading"><div><span className="hub-section-kicker">WHY PRACTICE HERE?</span><h2>Build speed, accuracy & confidence</h2></div></div><div className="benefit-grid"><div><span>🎯</span><h3>Exam-focused questions</h3><p>Practice MCQs selected for government and competitive exam preparation.</p></div><div><span>⏱️</span><h3>Timed practice</h3><p>Train yourself to solve questions quickly before the real examination.</p></div><div><span>📊</span><h3>Instant performance</h3><p>Get your score, accuracy and answer review immediately after submission.</p></div><div><span>📚</span><h3>Detailed explanations</h3><p>Review every answer and identify topics that need more preparation.</p></div></div></section>
      </section></div>;
  }

  if (submitted) return <div className="test-page"><section className="result-card"><span className="eyebrow">TEST COMPLETED</span><h1>{percentage >= 80 ? "Excellent Work! 🎉" : percentage >= 50 ? "Good Attempt! 💪" : "Keep Practising! 📚"}</h1><div className="score-circle"><strong>{score}/{questions.length}</strong><span>{percentage}%</span></div><div className="result-stats"><div><strong>{score}</strong><span>Correct</span></div><div><strong>{wrong}</strong><span>Wrong</span></div><div><strong>{unanswered}</strong><span>Unanswered</span></div></div><div className="result-ad">ADVERTISEMENT</div>{saving && <p className="save-status">Saving your result…</p>}{saved && <p className="save-status">✓ Result saved to your student account.</p>}{!user && <p className="save-status">Login to save your score and track your progress.</p>}{error && <p className="save-status">{error}</p>}<div className="result-actions"><button onClick={() => startTest(category)} className="primary-test-btn">Retake Test</button><button onClick={() => { setStarted(false); setSubmitted(false); }} className="secondary-test-btn">Choose Another Test</button>{user ? <Link href="/dashboard" className="secondary-test-btn">My Dashboard</Link> : <Link href="/login" className="secondary-test-btn">Login / Signup</Link>}<Link href="/jobs" className="secondary-test-btn">View Latest Jobs</Link></div></section><section className="answer-review"><div className="test-section-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h2>See your answers</h2></div><span className="test-badge">{selectedCategory?.title || "Mixed Test"}</span></div>{questions.map((q, i) => { const userAnswer = answers[q.id]; const correct = userAnswer === q.correct_answer; return <article key={q.id} className={`review-item ${correct ? "correct" : "wrong"}`}><div className="review-number">{i + 1}</div><div className="review-content"><h3>{q.question}</h3><p>Your answer: <b>{userAnswer === undefined ? "Not attempted" : q.options[userAnswer]}</b></p><p>Correct answer: <b>{q.options[q.correct_answer]}</b></p><small>{q.explanation}</small></div><div className="review-icon">{correct ? "✓" : "✕"}</div></article>; })}</section></div>;

  const q = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);
  return <div className="test-page"><section className="quiz-topbar"><div><span className="eyebrow">{selectedCategory?.title || "MIXED TEST"}</span><h1>Mock Test</h1></div><div className={`quiz-timer ${seconds <= 60 ? "danger" : ""}`}>⏱ {minutes}:{secs}</div></section><div className="quiz-progress"><span style={{ width: `${progress}%` }} /></div><div className="quiz-layout"><main className="question-card"><div className="question-meta"><span>Question {current + 1} of {questions.length}</span><span>{attempted} answered</span></div><h2>{q.question}</h2><div className="option-list">{q.options.map((option, i) => <button key={option} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))} className={`option ${answers[q.id] === i ? "selected" : ""}`}><span>{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div className="quiz-actions"><button disabled={current === 0} onClick={() => setCurrent((v) => v - 1)} className="secondary-test-btn">← Previous</button>{current < questions.length - 1 ? <button onClick={() => setCurrent((v) => v + 1)} className="primary-test-btn">Next Question →</button> : <button onClick={submit} className="primary-test-btn">Submit Test ✓</button>}</div></main><aside className="question-nav-card"><h3>Questions</h3><div className="question-numbers">{questions.map((item, i) => <button key={item.id} onClick={() => setCurrent(i)} className={`${current === i ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`}>{i + 1}</button>)}</div><div className="quiz-legend"><span><i className="dot answered-dot" />Answered</span><span><i className="dot" />Not answered</span></div><div className="test-ad-placeholder">ADVERTISEMENT</div></aside></div></div>;
}
