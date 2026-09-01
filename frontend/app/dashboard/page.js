"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const router = useRouter(); const [user, setUser] = useState(null); const [attempts, setAttempts] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const { data: { user: u } } = await supabase.auth.getUser(); if (!u) { router.replace("/login"); return; } setUser(u); const { data } = await supabase.from("test_attempts").select("id,score,total_questions,percentage,correct_answers,wrong_answers,unanswered,submitted_at,tests(title,subject)").eq("user_id", u.id).order("submitted_at", { ascending: false }).limit(50); setAttempts(data || []); setLoading(false); })(); }, [router]);
  async function logout() { await supabase.auth.signOut(); router.replace("/login"); }
  const total = attempts.length, avg = total ? Math.round(attempts.reduce((n, a) => n + Number(a.percentage || 0), 0) / total) : 0, best = total ? Math.max(...attempts.map(a => Number(a.percentage || 0))) : 0;
  if (loading) return <div className="auth-page"><div className="auth-card"><h1>Loading dashboard…</h1></div></div>;
  return <div className="dashboard-page"><section className="dashboard-hero"><div><span className="eyebrow">STUDENT DASHBOARD</span><h1>Keep improving, {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student"}.</h1><p>Your mock-test history and preparation progress in one place.</p></div><div className="dashboard-actions"><Link href="/take-test" className="primary-test-btn">Take New Test</Link><button onClick={logout} className="secondary-test-btn">Logout</button></div></section><div className="dashboard-stats"><div><strong>{total}</strong><span>Tests Completed</span></div><div><strong>{avg}%</strong><span>Average Score</span></div><div><strong>{best}%</strong><span>Best Score</span></div></div><section className="dashboard-card"><div className="test-section-heading"><div><span className="eyebrow">HISTORY</span><h2>Your Test Attempts</h2></div></div>{attempts.length === 0 ? <div className="empty-dashboard"><h3>No tests yet</h3><p>Take your first mock test and your result will appear here.</p><Link href="/take-test" className="primary-test-btn">Start First Test</Link></div> : <div className="attempt-list">{attempts.map(a => <article key={a.id} className="attempt-row"><div><strong>{a.tests?.title || "Mock Test"}</strong><span>{a.tests?.subject || "General"} • {new Date(a.submitted_at).toLocaleDateString("en-IN")}</span></div><div><b>{a.score}/{a.total_questions}</b><span>{Number(a.percentage).toFixed(0)}%</span></div></article>)}</div>}</section></div>;
}
