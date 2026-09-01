"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter(); const [mode, setMode] = useState("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) router.replace("/dashboard"); }); }, [router]);
  async function submit(e) { e.preventDefault(); setLoading(true); setMessage("");
    if (mode === "signup") { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }); if (error) setMessage(error.message); else if (data.session) router.replace("/dashboard"); else setMessage("Account created. Check your email if confirmation is enabled, then login."); }
    else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(error.message); else router.replace("/dashboard"); }
    setLoading(false);
  }
  return <div className="auth-page"><div className="auth-card"><span className="eyebrow">STUDENT ACCOUNT</span><h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1><p>Save mock-test results, track preparation and build your score history.</p><form onSubmit={submit}>{mode === "signup" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required /> }<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" minLength={6} required />{message && <div className="auth-message">{message}</div>}<button className="primary-test-btn" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "New student? Create an account" : "Already have an account? Login"}</button><Link href="/take-test" className="auth-back">← Continue without login</Link></div></div>;
}
