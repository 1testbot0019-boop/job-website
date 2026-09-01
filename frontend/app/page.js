import Link from "next/link";
import { getUpdates } from "../lib/queries";

export const revalidate = 3600;

const QUICK_LINKS = [
  { href: "/jobs", label: "Latest Government Jobs", tone: "red" },
  { href: "/results", label: "Latest Results", tone: "green" },
  { href: "/admit-card", label: "Admit Card", tone: "orange" },
  { href: "/take-test", label: "Take Free Test", tone: "gold" },
  { href: "/answer-key", label: "Answer Key", tone: "blue" },
  { href: "/notification", label: "Government Notifications", tone: "purple" },
  { href: "/syllabus", label: "Syllabus", tone: "teal" },
  { href: "/search", label: "Search Jobs & Results", tone: "pink" },
];

const SECTIONS = [
  { key: "JOB", title: "Latest Jobs", href: "/jobs" },
  { key: "ADMIT_CARD", title: "Admit Card", href: "/admit-card" },
  { key: "RESULT", title: "Latest Results", href: "/results" },
];

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean).join(", ") || fallback;
  if (typeof value === "object") return Object.values(value).map((item) => safeText(item)).filter(Boolean).join(", ") || fallback;
  return fallback;
}

function formatDate(dateStr) {
  if (!dateStr || typeof dateStr === "object") return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function UpdateList({ title, href, items }) {
  return <section className="portal-column"><div className="column-title"><span>{title}</span><Link href={href}>View All »</Link></div><div className="column-body">{items.length === 0 ? <p className="empty-column">No updates available yet.</p> : items.map((item) => { const titleText = safeText(item?.title, "Untitled Update"); const slug = safeText(item?.slug, ""); return <article key={item.id} className="portal-item">{slug ? <Link href={`/job/${slug}`} className="item-link">{titleText}</Link> : <span className="item-link">{titleText}</span>}{item?.published_date && <time>{formatDate(item.published_date)}</time>}</article>; })}</div></section>;
}

export default async function HomePage() {
  const updates = await getUpdates({ limit: 60 });
  const byCategory = (category) => updates.filter((item) => safeText(item?.category).toUpperCase() === category).slice(0, 8);
  return <div className="portal-page">
    <section className="welcome-panel"><span className="home-eyebrow">INDIA'S GOVERNMENT JOB & EXAM HUB</span><h1>Government Jobs, Results, Admit Cards &amp; Mock Tests</h1><p>Find official government updates and improve your preparation with free subject-wise MCQ tests.</p><div className="home-actions"><Link href="/jobs" className="home-primary">Find Latest Jobs →</Link><Link href="/take-test" className="home-secondary">Take a Free Test 📝</Link></div></section>
    <section className="quick-grid" aria-label="Quick links">{QUICK_LINKS.map((item) => <Link key={item.href + item.label} href={item.href} className={`quick-card ${item.tone}`}>{item.label}</Link>)}</section>
    <section className="test-promo"><div><span className="home-eyebrow">NEW • FREE PRACTICE</span><h2>Prepare Smarter With Daily MCQ Tests</h2><p>Practice GK, Reasoning, Quantitative Aptitude, English, Computer, Indian Polity &amp; History, Uttarakhand GK and SSC-style questions.</p></div><Link href="/take-test" className="promo-button">Start Test →</Link></section>
    <section className="notice-bar"><strong>Latest Update:</strong><span>Government job vacancies, results and admit cards are updated automatically.</span></section>
    <section className="three-columns"><UpdateList title="Latest Job" href={SECTIONS[0].href} items={byCategory("JOB")} /><UpdateList title="Admit Card" href={SECTIONS[1].href} items={byCategory("ADMIT_CARD")} /><UpdateList title="Latest Results" href={SECTIONS[2].href} items={byCategory("RESULT")} /></section>
    <section className="category-grid"><CategoryBox title="Uttarakhand Government Jobs" href="/jobs" text="Find the latest vacancies, eligibility, important dates and official notifications." /><CategoryBox title="Results" href="/results" text="Check recently released examination and recruitment results." /><CategoryBox title="Admit Card" href="/admit-card" text="Download hall tickets and check examination dates." /><CategoryBox title="Free Mock Tests" href="/take-test" text="Take timed MCQ tests and instantly see your score and answer explanations." /></section>
  </div>;
}

function CategoryBox({ title, href, text }) { return <section className="category-box"><h2><Link href={href}>{title}</Link></h2><p>{text}</p><Link href={href} className="category-more">Explore »</Link></section>; }
