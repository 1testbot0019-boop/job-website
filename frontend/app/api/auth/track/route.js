import { NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/adminServer";

export async function POST(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const eventType = String(body.event_type || "login").slice(0, 40);
    if (!["login", "signup", "logout"].includes(eventType)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for") || "";
    const ip = forwarded.split(",")[0].trim().slice(0, 100) || null;
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 1000) || null;

    const { error: insertError } = await admin.from("auth_activity").insert({
      user_id: user.id,
      event_type: eventType,
      ip_address: ip,
      user_agent: userAgent,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
