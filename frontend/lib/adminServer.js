import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireAdmin(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "Unauthorized", status: 401 };

  let admin;
  try {
    admin = getAdminClient();
  } catch (error) {
    console.error("Admin client configuration error", error.message);
    return { error: "Admin service is not configured on the server.", status: 500 };
  }

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { error: "Unauthorized", status: 401 };

  // Prefer the server-controlled Supabase app_metadata role. It cannot be
  // edited by the user, unlike user_metadata. Keep ADMIN_EMAILS as a
  // backwards-compatible fallback for existing deployments.
  const appRole = user.app_metadata?.role;
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = appRole === "admin" || (!!user.email && allowed.includes(user.email.toLowerCase()));
  if (!isAdmin) return { error: "Forbidden", status: 403 };

  return { admin, user };
}

export { getAdminClient };
