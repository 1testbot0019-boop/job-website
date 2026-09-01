import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminServer";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { admin } = auth;
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: events, error: eventError } = await admin
    .from("auth_activity")
    .select("user_id,event_type,created_at,ip_address,user_agent")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (eventError) console.error("auth_activity read failed", eventError.message);

  const lastEvent = new Map();
  for (const event of events || []) {
    if (!lastEvent.has(event.user_id)) lastEvent.set(event.user_id, event);
  }

  const users = (data?.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
    phone: u.phone,
    provider: u.app_metadata?.provider || (u.identities?.[0]?.provider ?? "email"),
    name: u.user_metadata?.full_name || "",
    banned_until: u.banned_until,
    last_activity: lastEvent.get(u.id) || null,
  }));

  return NextResponse.json({ users, total: users.length });
}
