"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

async function trackAuth(event_type) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await fetch("/api/auth/track", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ event_type }) }).catch(() => {});
}

export default function LoginPage() {
  const router = useRouter(); const [mode, setMode] = useState("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) router.replace("/dashboard"); }); }, [router]);
  async function submit(e) {
    e.preventDefault(); setLoading(true); setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setMessage(error.message); else if (data.session) { await trackAuth("signup"); router.replace("/dashboard"); } else setMessage("Account created. Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message); else { await trackAuth("login"); router.replace("/dashboard"); }
    }
    setLoading(false);
  }
  return <main className="student-login-page"><div className="student-login-bg" aria-hidden="true"><span className="login-orb orb-one" /><span className="login-orb orb-two" /></div><div className="student-login-shell">
    <section className="student-login-promo"><Link href="/" className="login-brand">🇮🇳 <span>Govt Jobs India</span></Link><div className="promo-copy"><span className="login-kicker">STUDENT PREPARATION HUB</span><h1>Prepare smarter.<br /><em>Get closer to your goal.</em></h1><p>Track your mock tests, discover government jobs and build your exam preparation streak — all in one place.</p><div className="login-benefits"><div><b>📝</b><span><strong>Free Mock Tests</strong><small>Practice relevant MCQs anytime</small></span></div><div><b>📊</b><span><strong>Track Your Progress</strong><small>Scores, history and performance</small></span></div><div><b>🎯</b><span><strong>Find Your Opportunities</strong><small>Discover jobs for your preparation</small></span></div></div></div><div className="login-stats"><span><strong>8+</strong> Practice Subjects</span><span><strong>100%</strong> Free Practice</span></div></section>
    <section className="student-login-card"><div className="login-card-top"><div className="login-icon">🎓</div><div><span className="login-mini-label">STUDENT ACCOUNT</span><h2>{mode === "login" ? "Welcome back!" : "Start your journey"}</h2></div></div><p className="login-subtitle">{mode === "login" ? "Sign in to continue your exam preparation." : "Create your free account and start practicing."}</p><div className="login-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Login</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create Account</button></div><form onSubmit={submit} className="student-login-form">{mode === "signup" && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required /></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} required /></label>{message && <div className="auth-message">{message}</div>}<button className="student-login-submit" disabled={loading}>{loading ? "Signing you in…" : mode === "login" ? "Continue to Dashboard →" : "Create My Free Account →"}</button></form><div className="login-trust"><span>🔒 Secure login</span><span>•</span><span>Your password is protected by Supabase Auth</span></div><Link href="/take-test" className="login-guest">Continue without account <span>→</span></Link></section>
  </div></main>;
}
