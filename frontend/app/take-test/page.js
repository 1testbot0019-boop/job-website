"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getCategory, TEST_CATEGORIES } from "../../lib/mcq";

const PRACTICE_TIME = 10 * 60;
const EXAM_MODES = [
  { id: "UKPSC_GS_PRELIMS", title: "UKPSC Prelims – General Studies", short: "UKPSC GS", subject: "General Studies", questions: 150, seconds: 7200, marks: 1, negative: 0.25, icon: "🏔️", note: "150 questions • 2 hours • 1/4 negative marking" },
  { id: "UKPSC_APTITUDE_PRELIMS", title: "UKPSC Prelims – General Aptitude", short: "UKPSC Aptitude", subject: "General Aptitude", questions: 100, seconds: 7200, marks: 1.5, negative: 0.375, icon: "🧠", note: "100 questions • 2 hours • 1/4 negative marking" },
  { id: "UKSSSC_GRADUATE", title: "UKSSSC Graduate Level Practice", short: "UKSSSC Graduate", subject: "General", questions: 100, seconds: 7200, marks: 1, negative: 0, icon: "📚", note: "100-question practice mode • timing/marking varies by recruitment" },
];

const examGroups = [
  { id: "all", title: "All Tests", icon: "🎯" },
  { id: "government", title: "Government Exams", icon: "🇮🇳" },
  { id: "uttarakhand", title: "Uttarakhand Exams", icon: "🏔️" },
  { id: "aptitude", title: "Aptitude & Reasoning", icon: "🧠" },
];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TakeTestPage() {
  const [category, setCategory] = useState("mixed");
  const [examMode, setExamMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(PRACTICE_TIME);
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
  const activeExam = EXAM_MODES.find((item) => item.id === examMode) || null;

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

  async function startTest(id = category, mode = null) {
    setLoading(true);
    setError("");
    setSaved(false);
    const categoryItem = TEST_CATEGORIES.find((item) => item.id === id);
    const subject = mode ? mode.subject : (id === "mixed" ? null : categoryItem?.title || id);
    const size = mode ? mode.questions : (id === "mixed" ? 10 : 5);

    // random() runs inside PostgreSQL, so every attempt gets a fresh question order/pool.
    const { data, error: queryError } = await supabase.rpc("get_random_mcqs", {
      p_subject: subject,
      p_exam_code: mode?.id || null,
      p_limit: size,
    });
    setLoading(false);
    if (queryError || !data?.length) {
      setError(queryError?.message || "No questions are available for this exam yet. We are adding more questions to the pool.");
      return;
    }

    // Shuffle again client-side so the option/question order is not predictable.
    const selected = shuffle(data).slice(0, Math.min(size, data.length));
    const { data: testData } = await supabase
      .from("tests")
      .select("id,duration_seconds,marks_per_question,negative_marks")
      .eq("is_active", true)
      .eq(mode ? "exam_code" : "subject", mode ? mode.id : (id === "mixed" ? "Mixed" : categoryItem?.title || id))
      .limit(1)
      .maybeSingle();

    setTestId(testData?.id || null);
    setExamMode(mode);
    setCategory(id);
    setQuestions(selected);
    setAnswers({});
    setCurrent(0);
    setSeconds(mode ? (testData?.duration_seconds || mode.seconds) : PRACTICE_TIME);
    setSubmitted(false);
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitted(true);
    if (!user || saved) return;
    setSaving(true);
    const marks = activeExam?.marks || 1;
    const negative = activeExam?.negative || 0;
    const correct = questions.reduce((total, q) => total + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
    const attempted = Object.keys(answers).length;
    const wrong = attempted - correct;
    const unanswered = questions.length - attempted;
    const rawMarks = Math.max(0, Number((correct * marks - wrong * negative).toFixed(2)));
    const maxMarks = questions.length * marks;
    const pct = maxMarks ? Number(((rawMarks / maxMarks) * 100).toFixed(2)) : 0;
    const { error: saveError } = await supabase.from("test_attempts").insert({
      test_id: testId,
      user_id: user.id,
      score: rawMarks,
      total_questions: questions.length,
      correct_answers: correct,
      wrong_answers: wrong,
      unanswered,
      percentage: pct,
      answers,
      submitted_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!saveError) setSaved(true); else setError(saveError.message);
  }

  const correct = questions.reduce((total, q) => total + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
  const attempted = Object.keys(answers).length;
  const wrong = attempted - correct;
  const unanswered = questions.length - attempted;
  const marks = activeExam?.marks || 1;
  const negative = activeExam?.negative || 0;
  const rawMarks = Math.max(0, Number((correct * marks - wrong * negative).toFixed(2)));
  const maxMarks = questions.length * marks;
  const percentage = maxMarks ? Math.round((rawMarks / maxMarks) * 100) : 0;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  if (!started) {
    const visibleCategories = activeGroup === "all" ? TEST_CATEGORIES : TEST_CATEGORIES.filter((item) => {
      if (activeGroup === "uttarakhand") return item.id === "uk-gk";
      if (activeGroup === "aptitude") return ["reasoning", "quant", "english", "computer"].includes(item.id);
      return ["gk", "reasoning", "quant", "english", "computer", "polity"].includes(item.id);
    });

    return <div className="test-hub">
      <section className="test-hub-hero">
        <div className="test-hub-hero-copy">
          <span className="test-hub-kicker">COMPETITIVE EXAM TEST SERIES</span>
          <h1>Practice like the real exam. <em>Improve every attempt.</em></h1>
          <p>Fresh randomized MCQs, exam-style timers, negative marking and instant performance reports for government-exam preparation.</p>
          <div className="test-hero-actions">
            <button className="hub-primary-btn" onClick={() => startTest("mixed")} disabled={loading}>{loading ? "Loading…" : "Start Free 10-Min Test →"}</button>
            <Link className="hub-outline-btn" href="/dashboard">View My Progress</Link>
          </div>
          <div className="hero-trust"><span>✓ Fresh questions each attempt</span><span>✓ Exam-style timing</span><span>✓ Instant result</span></div>
        </div>
        <div className="hero-score-card"><div className="hero-score-icon">⏱️</div><strong>Real exam modes</strong><p>Use the official-style UKPSC timing and marking where applicable.</p><div className="mini-score-row"><span>UKPSC GS</span><b>150Q / 120m</b></div><div className="mini-score-row"><span>UKPSC Aptitude</span><b>100Q / 120m</b></div></div>
      </section>

      <section className="test-hub-content">
        {error && <div className="notice-bar"><strong>Notice</strong>{error}</div>}

        <div className="test-hub-heading"><div><span className="hub-section-kicker">FULL EXAM SIMULATIONS</span><h2>Practice by exam</h2><p>Competitive-exam modes use their own question count, timer, marks and negative-marking rules.</p></div><span className="series-count">{EXAM_MODES.length} exam modes</span></div>
        <div className="test-series-grid">
          {EXAM_MODES.map((mode) => <article className="series-card" key={mode.id}><div className="series-card-top"><div className="series-icon">{mode.icon}</div><span className="free-pill">FREE</span></div><h3>{mode.title}</h3><p>{mode.note}</p><div className="series-info"><span>📝 {mode.questions} Q</span><span>⏱ {Math.round(mode.seconds / 60)} min</span><span>−{mode.negative}</span></div><button onClick={() => startTest("mixed", mode)} disabled={loading}>Start Exam Mode →</button></article>)}
        </div>

        <div className="test-hub-heading"><div><span className="hub-section-kicker">QUICK PRACTICE</span><h2>Subject-wise MCQ practice</h2><p>Short practice sets for daily preparation.</p></div></div>
        <div className="exam-tabs">{examGroups.map((group) => <button key={group.id} onClick={() => setActiveGroup(group.id)} className={activeGroup === group.id ? "active" : ""}><span>{group.icon}</span>{group.title}</button>)}</div>
        <div className="test-series-grid">{visibleCategories.map((item) => <article className="series-card" key={item.id}><div className="series-card-top"><div className="series-icon">{item.icon}</div><span className="free-pill">FREE</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="series-info"><span>📝 5 MCQs</span><span>⏱ 10 min</span><span>🔀 Random</span></div><button onClick={() => startTest(item.id)} disabled={loading}>Start Practice →</button></article>)}</div>

        <div className="hub-ad-slot">ADVERTISEMENT</div>
        <section className="why-test-section"><div className="test-hub-heading"><div><span className="hub-section-kicker">WHY PRACTICE HERE?</span><h2>Train for the actual exam</h2></div></div><div className="benefit-grid"><div><span>🔀</span><h3>Fresh random MCQs</h3><p>The question pool is randomized by PostgreSQL for every attempt, so students don't receive the same sequence every time.</p></div><div><span>⏱️</span><h3>Exam-standard timing</h3><p>UKPSC modes use the published 2-hour prelims timing; other recruitments remain configurable by notification.</p></div><div><span>➖</span><h3>Negative marking</h3><p>UKPSC prelims modes apply one-fourth negative marking to match the published scheme.</p></div><div><span>📊</span><h3>Instant analysis</h3><p>See correct, wrong, unanswered, marks and percentage immediately after submission.</p></div></div></section>
      </section>
    </div>;
  }

  if (submitted) return <div className="test-page"><section className="result-card"><span className="eyebrow">TEST COMPLETED</span><h1>{percentage >= 80 ? "Excellent Work! 🎉" : percentage >= 50 ? "Good Attempt! 💪" : "Keep Practising! 📚"}</h1><div className="score-circle"><strong>{rawMarks}/{maxMarks}</strong><span>{percentage}%</span></div><div className="result-stats"><div><strong>{correct}</strong><span>Correct</span></div><div><strong>{wrong}</strong><span>Wrong</span></div><div><strong>{unanswered}</strong><span>Unanswered</span></div></div><div className="result-ad">ADVERTISEMENT</div>{saving && <p className="save-status">Saving your result…</p>}{saved && <p className="save-status">✓ Result saved to your student account.</p>}{!user && <p className="save-status">Login to save your score and track your progress.</p>}{error && <p className="save-status">{error}</p>}<div className="result-actions"><button onClick={() => startTest(category, activeExam)} className="primary-test-btn">Retake Test</button><button onClick={() => { setStarted(false); setSubmitted(false); setExamMode(null); }} className="secondary-test-btn">Choose Another Test</button>{user ? <Link href="/dashboard" className="secondary-test-btn">My Dashboard</Link> : <Link href="/login" className="secondary-test-btn">Login / Signup</Link>}<Link href="/jobs" className="secondary-test-btn">View Latest Jobs</Link></div></section><section className="answer-review"><div className="test-section-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h2>See your answers</h2></div><span className="test-badge">{activeExam?.short || selectedCategory?.title || "Mixed Test"}</span></div>{questions.map((q, i) => { const userAnswer = answers[q.id]; const isCorrect = userAnswer === q.correct_answer; return <article key={q.id} className={`review-item ${isCorrect ? "correct" : "wrong"}`}><div className="review-number">{i + 1}</div><div className="review-content"><h3>{q.question}</h3><p>Your answer: <b>{userAnswer === undefined ? "Not attempted" : q.options[userAnswer]}</b></p><p>Correct answer: <b>{q.options[q.correct_answer]}</b></p><small>{q.explanation}</small></div><div className="review-icon">{isCorrect ? "✓" : "✕"}</div></article>; })}</section></div>;

  const q = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);
  return <div className="test-page"><section className="quiz-topbar"><div><span className="eyebrow">{activeExam?.short || selectedCategory?.title || "MIXED TEST"}</span><h1>{activeExam ? activeExam.title : "Mock Test"}</h1></div><div className={`quiz-timer ${seconds <= 60 ? "danger" : ""}`}>⏱ {minutes}:{secs}</div></section>{activeExam && <div className="quiz-rulebar"><span>{activeExam.questions} questions</span><span>{activeExam.marks} mark/question</span><span>−{activeExam.negative} negative</span><span>Exam mode</span></div>}<div className="quiz-progress"><span style={{ width: `${progress}%` }} /></div><div className="quiz-layout"><main className="question-card"><div className="question-meta"><span>Question {current + 1} of {questions.length}</span><span>{attempted} answered</span></div><h2>{q.question}</h2><div className="option-list">{q.options.map((option, i) => <button key={`${q.id}-${i}`} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))} className={`option ${answers[q.id] === i ? "selected" : ""}`}><span>{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div className="quiz-actions"><button disabled={current === 0} onClick={() => setCurrent((v) => v - 1)} className="secondary-test-btn">← Previous</button>{current < questions.length - 1 ? <button onClick={() => setCurrent((v) => v + 1)} className="primary-test-btn">Next Question →</button> : <button onClick={submit} className="primary-test-btn">Submit Test ✓</button>}</div></main><aside className="question-nav-card"><h3>Questions</h3><div className="question-numbers">{questions.map((item, i) => <button key={item.id} onClick={() => setCurrent(i)} className={`${current === i ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`}>{i + 1}</button>)}</div><div className="quiz-legend"><span><i className="dot answered-dot" />Answered</span><span><i className="dot" />Not answered</span></div><div className="test-ad-placeholder">ADVERTISEMENT</div></aside></div></div>;
}
