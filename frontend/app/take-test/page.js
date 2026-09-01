"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategory, getQuestions, TEST_CATEGORIES } from "../../lib/mcq";

const TEST_SIZE = 10;
const TEST_TIME = 10 * 60;

export default function TakeTestPage() {
  const [category, setCategory] = useState("mixed");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(TEST_TIME);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedCategory = useMemo(() => getCategory(category), [category]);

  useEffect(() => {
    if (!started || submitted) return;
    if (seconds <= 0) {
      setSubmitted(true);
      return;
    }
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [started, submitted, seconds]);

  const startTest = (id = category) => {
    setCategory(id);
    setQuestions(getQuestions(id, TEST_SIZE));
    setAnswers({});
    setCurrent(0);
    setSeconds(TEST_TIME);
    setSubmitted(false);
    setStarted(true);
  };

  const submit = () => setSubmitted(true);

  const score = questions.reduce((total, q) => total + (answers[q.id] === q.answer ? 1 : 0), 0);
  const attempted = Object.keys(answers).length;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  if (!started) {
    return (
      <div className="test-page">
        <section className="test-hero">
          <div>
            <span className="eyebrow">FREE MOCK TESTS</span>
            <h1>Test Your Preparation</h1>
            <p>Practice MCQs for SSC, Railways, Banking, state exams and Uttarakhand government exams.</p>
          </div>
          <div className="test-hero-stat"><strong>10</strong><span>Questions / Test</span></div>
          <div className="test-hero-stat"><strong>10 min</strong><span>Time Limit</span></div>
        </section>

        <div className="test-layout">
          <main className="test-main-card">
            <div className="test-section-heading">
              <div><span className="eyebrow">CHOOSE A SUBJECT</span><h2>Start a Practice Test</h2></div>
              <span className="test-badge">Instant Result</span>
            </div>
            <div className="subject-grid">
              <button className="subject-card mixed" onClick={() => startTest("mixed")}><span>⚡</span><strong>Mixed Test</strong><small>All subjects</small></button>
              {TEST_CATEGORIES.map((item) => (
                <button key={item.id} className="subject-card" onClick={() => startTest(item.id)}>
                  <span>{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small>
                </button>
              ))}
            </div>
          </main>
          <aside className="test-side-card">
            <h3>How it works</h3>
            <div className="step"><b>1</b><span>Choose your subject</span></div>
            <div className="step"><b>2</b><span>Answer 10 MCQs</span></div>
            <div className="step"><b>3</b><span>Finish before the timer</span></div>
            <div className="step"><b>4</b><span>See score &amp; correct answers</span></div>
            <div className="test-ad-placeholder">ADVERTISEMENT</div>
          </aside>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="test-page">
        <section className="result-card">
          <span className="eyebrow">TEST COMPLETED</span>
          <h1>{percentage >= 80 ? "Excellent Work! 🎉" : percentage >= 50 ? "Good Attempt! 💪" : "Keep Practising! 📚"}</h1>
          <div className="score-circle"><strong>{score}/{questions.length}</strong><span>{percentage}%</span></div>
          <div className="result-stats"><div><strong>{score}</strong><span>Correct</span></div><div><strong>{questions.length - score}</strong><span>Wrong / Unanswered</span></div><div><strong>{attempted}</strong><span>Attempted</span></div></div>
          <div className="result-ad">ADVERTISEMENT</div>
          <div className="result-actions"><button onClick={() => startTest(category)} className="primary-test-btn">Retake Test</button><button onClick={() => { setStarted(false); setSubmitted(false); }} className="secondary-test-btn">Choose Another Subject</button><Link href="/jobs" className="secondary-test-btn">View Latest Jobs</Link></div>
        </section>

        <section className="answer-review">
          <div className="test-section-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h2>See your answers</h2></div><span className="test-badge">{selectedCategory?.title || "Mixed Test"}</span></div>
          {questions.map((q, index) => {
            const userAnswer = answers[q.id];
            const correct = userAnswer === q.answer;
            return <article key={q.id} className={`review-item ${correct ? "correct" : "wrong"}`}><div className="review-number">{index + 1}</div><div className="review-content"><h3>{q.q}</h3><p>Your answer: <b>{userAnswer === undefined ? "Not attempted" : q.options[userAnswer]}</b></p><p>Correct answer: <b>{q.options[q.answer]}</b></p><small>{q.explanation}</small></div><div className="review-icon">{correct ? "✓" : "✕"}</div></article>;
          })}
        </section>
      </div>
    );
  }

  const q = questions[current];
  const progress = Math.round(((current + 1) / questions.length) * 100);

  return (
    <div className="test-page">
      <section className="quiz-topbar"><div><span className="eyebrow">{selectedCategory?.title || "MIXED TEST"}</span><h1>Mock Test</h1></div><div className={`quiz-timer ${seconds <= 60 ? "danger" : ""}`}>⏱ {minutes}:{secs}</div></section>
      <div className="quiz-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="quiz-layout">
        <main className="question-card">
          <div className="question-meta"><span>Question {current + 1} of {questions.length}</span><span>{Object.keys(answers).length} answered</span></div>
          <h2>{q.q}</h2>
          <div className="option-list">
            {q.options.map((option, index) => <button key={option} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: index }))} className={`option ${answers[q.id] === index ? "selected" : ""}`}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
          </div>
          <div className="quiz-actions"><button disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="secondary-test-btn">← Previous</button>{current < questions.length - 1 ? <button onClick={() => setCurrent((value) => value + 1)} className="primary-test-btn">Next Question →</button> : <button onClick={submit} className="primary-test-btn">Submit Test ✓</button>}</div>
        </main>
        <aside className="question-nav-card"><h3>Questions</h3><div className="question-numbers">{questions.map((item, index) => <button key={item.id} onClick={() => setCurrent(index)} className={`${current === index ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`}>{index + 1}</button>)}</div><div className="quiz-legend"><span><i className="dot answered-dot" />Answered</span><span><i className="dot" />Not answered</span></div><div className="test-ad-placeholder">ADVERTISEMENT</div></aside>
      </div>
    </div>
  );
}
