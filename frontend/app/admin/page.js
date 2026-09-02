"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    // Refresh once so a newly assigned server-side app_metadata role is present
    // in the access token instead of relying on a stale browser session.
    let session;
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data?.session || null;
    if (!session) {
      const current = await supabase.auth.getSession();
      session = current.data?.session || null;
    }

    if (!session) {
      setLoading(false);
      router.replace("/login?next=/admin");
      return;
    }

    setMe(session.user);
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));

    if (response.status === 401) {
      setLoading(false);
      router.replace("/login?next=/admin");
      return;
    }
    if (!response.ok) {
      setError(result.error || "You are not authorized to access the admin dashboard.");
      setLoading(false);
      return;
    }

    setUsers(result.users || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => users.filter((u) => `${u.email} ${u.name} ${u.provider}`.toLowerCase().includes(query.toLowerCase())),
    [users, query]
  );
  const confirmed = users.filter((u) => u.email_confirmed_at).length;
  const recent = users.filter((u) => u.last_sign_in_at && Date.now() - new Date(u.last_sign_in_at).getTime() < 7 * 86400000).length;

  if (loading) return <main className="max-w-7xl mx-auto px-4 py-12"><div className="border border-stone bg-white p-8">Loading admin dashboard…</div></main>;
  if (error) return <main className="max-w-7xl mx-auto px-4 py-12"><div className="border border-stone bg-white p-8"><h1 className="font-display text-3xl text-ridge">Admin access required</h1><p className="mt-3 text-ink/70">{error}</p><p className="mt-4 text-sm text-ink/60">Your Supabase account must have the server-side admin role or be listed in ADMIN_EMAILS.</p><button onClick={load} className="mt-5 border border-stone bg-white px-4 py-2">Retry</button></div></main>;

  return <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div><div className="font-mono text-xs uppercase tracking-widest text-marigold mb-2">ADMIN CONSOLE</div><h1 className="font-display text-4xl text-ridge">User Management</h1><p className="mt-2 text-ink/65">Secure account and sign-in activity overview.</p></div>
      <button onClick={load} className="border border-stone bg-white px-4 py-2">Refresh</button>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <div className="border border-stone bg-white p-5"><div className="text-sm text-ink/60">Total users</div><strong className="text-3xl text-ridge">{users.length}</strong></div>
      <div className="border border-stone bg-white p-5"><div className="text-sm text-ink/60">Verified emails</div><strong className="text-3xl text-ridge">{confirmed}</strong></div>
      <div className="border border-stone bg-white p-5"><div className="text-sm text-ink/60">Signed in last 7 days</div><strong className="text-3xl text-ridge">{recent}</strong></div>
    </div>

    <div className="border border-stone bg-white overflow-hidden">
      <div className="p-4 border-b border-stone flex flex-wrap gap-3 justify-between items-center"><h2 className="font-display text-2xl text-ridge">Registered Users</h2><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email or name…" className="border border-stone px-3 py-2 w-full md:w-72" /></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-stone bg-stone/20"><th className="p-3">User</th><th className="p-3">Provider</th><th className="p-3">Registered</th><th className="p-3">Last sign-in</th><th className="p-3">Email</th><th className="p-3">Last tracked activity</th></tr></thead><tbody>{filtered.map((u) => <tr key={u.id} className="border-b border-stone/70"><td className="p-3"><strong>{u.name || "—"}</strong><div className="text-xs text-ink/50">{u.email}</div></td><td className="p-3">{u.provider}</td><td className="p-3">{formatDate(u.created_at)}</td><td className="p-3">{formatDate(u.last_sign_in_at)}</td><td className="p-3">{u.email_confirmed_at ? <span className="text-green-700">Verified</span> : <span className="text-amber-700">Pending</span>}</td><td className="p-3">{u.last_activity ? <><strong>{u.last_activity.event_type}</strong><div className="text-xs text-ink/50">{formatDate(u.last_activity.created_at)}</div></> : "—"}</td></tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="p-8 text-center text-ink/60">No users found.</div>}
    </div>

    <div className="mt-6 border border-stone/70 bg-white p-4 text-sm text-ink/60"><strong className="text-ridge">Security:</strong> Passwords are never displayed or stored by this dashboard. Supabase Auth keeps password hashes internally; this dashboard only reads account metadata and tracked authentication events.</div>
  </main>;
}
