import { supabase } from "./supabase";

export async function getSchemes({ state = null, category = null, limit = 100 } = {}) {
  let query = supabase.from("government_schemes").select("*").eq("is_active", true).order("published_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(limit);
  if (state) query = query.eq("state", state);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) { console.error("getSchemes:", error.message); return []; }
  return data || [];
}

export async function getSchemeBySlug(slug) {
  const { data, error } = await supabase.from("government_schemes").select("*").eq("slug", slug).eq("is_active", true).single();
  if (error) { console.error("getSchemeBySlug:", error.message); return null; }
  return data;
}

export async function getRecommendedSchemes(currentSlug, limit = 12) {
  const { data, error } = await supabase.from("government_schemes").select("id,title,slug,state,category,short_description,published_date").eq("is_active", true).neq("slug", currentSlug).order("published_date", { ascending: false, nullsFirst: false }).limit(limit);
  if (error) { console.error("getRecommendedSchemes:", error.message); return []; }
  return data || [];
}
