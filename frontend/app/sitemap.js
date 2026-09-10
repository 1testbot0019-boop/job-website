import { STATES, stateSlug } from "../lib/states";

export const revalidate = 3600;

const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://job-website-vvuu.onrender.com").replace(/\/$/, "");

async function fetchSlugs(table, limit) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const endpoint = `${url}/rest/v1/${table}?select=slug&is_active=eq.true&limit=${limit}`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.map((item) => item.slug).filter(Boolean) : [];
  } catch (error) {
    console.error(`Sitemap ${table} fetch error:`, error);
    return [];
  }
}

export default async function sitemap() {
  const [jobSlugs, schemeSlugs] = await Promise.all([
    fetchSlugs("updates", 1000),
    fetchSlugs("government_schemes", 5000),
  ]);

  const urls = [
    "",
    "/jobs",
    "/results",
    "/admit-card",
    "/answer-key",
    "/notification",
    "/syllabus",
    "/government-schemes",
    ...STATES.map((state) => `/government-schemes/${stateSlug(state)}`),
    ...jobSlugs.map((slug) => `/job/${encodeURIComponent(slug)}`),
    ...schemeSlugs.map((slug) => `/scheme/${encodeURIComponent(slug)}`),
  ];

  const uniqueUrls = [...new Set(urls)];
  const now = new Date();

  return uniqueUrls.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority:
      path === "" ? 1 :
      path.startsWith("/job/") || path.startsWith("/scheme/") ? 0.8 : 0.7,
  }));
}
