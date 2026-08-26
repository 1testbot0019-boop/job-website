import { supabase } from "./supabase";

/** Latest N updates, optionally filtered by category. */
export async function getUpdates({ category = null, limit = 30 } = {}) {
  let query = supabase
    .from("updates")
    .select("*")
    .eq("is_active", true)
    .order("published_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getUpdates error:", error.message);
    return [];
  }
  return data ?? [];
}

/** A single update by its slug, for the detail page. */
export async function getUpdateBySlug(slug) {
  const { data, error } = await supabase
    .from("updates")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getUpdateBySlug error:", error.message);
    return null;
  }
  return data;
}

/** Full-text search across title + description. */
export async function searchUpdates(term) {
  if (!term || term.trim().length === 0) return [];

  const { data, error } = await supabase
    .from("updates")
    .select("*")
    .textSearch("search_vector", term, { type: "websearch" })
    .eq("is_active", true)
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error("searchUpdates error:", error.message);
    return [];
  }
  return data ?? [];
}
