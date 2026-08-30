import { getSchemes } from "../lib/schemeQueries";
import { getUpdates } from "../lib/queries";
import { STATES, stateSlug } from "../lib/states";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://job-website-vvuu.onrender.com";

export default async function sitemap() {
  const [jobs, schemes] = await Promise.all([getUpdates({ limit: 500 }), getSchemes({ limit: 5000 })]);
  const now = new Date();
  const urls = [
    "", "/jobs", "/results", "/admit-card", "/answer-key", "/notification", "/syllabus", "/government-schemes",
    ...STATES.map((state) => `/government-schemes/${stateSlug(state)}`),
    ...jobs.map((item) => `/job/${item.slug}`),
    ...schemes.map((item) => `/scheme/${item.slug}`),
  ];
  return urls.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "daily", priority: path === "" ? 1 : path.startsWith("/scheme/") || path.startsWith("/job/") ? 0.8 : 0.7 }));
}
