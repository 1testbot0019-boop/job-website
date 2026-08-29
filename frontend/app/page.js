import Link from "next/link";
import { getUpdates } from "../lib/queries";

export const revalidate = 3600;

const QUICK_LINKS = [
  { href: "/jobs", label: "Latest Government Jobs", tone: "red" },
  { href: "/results", label: "Latest Results", tone: "green" },
  { href: "/admit-card", label: "Admit Card", tone: "orange" },
  { href: "/answer-key", label: "Answer Key", tone: "blue" },
  { href: "/notification", label: "Government Notifications", tone: "purple" },
  { href: "/syllabus", label: "Syllabus", tone: "teal" },
  { href: "/jobs", label: "Uttarakhand Jobs", tone: "indigo" },
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
  return (
    <section className="portal-column">
      <div className="column-title">
        <span>{title}</span>
        <Link href={href}>View All »</Link>
      </div>
      <div className="column-body">
        {items.length === 0 ? (
          <p className="empty-column">No updates available yet.</p>
        ) : (
          items.map((item) => {
            const titleText = safeText(item?.title, "Untitled Update");
            const slug = safeText(item?.slug, "");
            return (
              <article key={item.id} className="portal-item">
                {slug ? (
                  <Link href={`/job/${slug}`} className="item-link">{titleText}</Link>
                ) : (
                  <span className="item-link">{titleText}</span>
                )}
                {item?.published_date && <time>{formatDate(item.published_date)}</time>}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const updates = await getUpdates({ limit: 60 });

  const byCategory = (category) => updates.filter((item) => safeText(item?.category).toUpperCase() === category).slice(0, 8);
  const latestJobs = byCategory("JOB");
  const latestAdmitCards = byCategory("ADMIT_CARD");
  const latestResults = byCategory("RESULT");

  return (
    <div className="portal-page">
      <section className="welcome-panel">
        <h1>Government Jobs, Results &amp; Admit Card</h1>
        <p>Latest official updates for government jobs, results, admit cards and notifications across India.</p>
      </section>

      <section className="quick-grid" aria-label="Quick links">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href + item.label} href={item.href} className={`quick-card ${item.tone}`}>
            {item.label}
          </Link>
        ))}
      </section>

      <section className="notice-bar">
        <strong>Latest Update:</strong>
        <span>Government job vacancies, results and admit cards are updated automatically.</span>
      </section>

      <section className="three-columns">
        <UpdateList title="Latest Job" href={SECTIONS[0].href} items={latestJobs} />
        <UpdateList title="Admit Card" href={SECTIONS[1].href} items={latestAdmitCards} />
        <UpdateList title="Latest Results" href={SECTIONS[2].href} items={latestResults} />
      </section>

      <section className="category-grid">
        <CategoryBox title="Uttarakhand Government Jobs" href="/jobs" text="Find the latest vacancies, eligibility, important dates and official notifications." />
        <CategoryBox title="Results" href="/results" text="Check recently released examination and recruitment results." />
        <CategoryBox title="Admit Card" href="/admit-card" text="Download hall tickets and check examination dates." />
        <CategoryBox title="Answer Key" href="/answer-key" text="Find official answer keys and related updates." />
      </section>
    </div>
  );
}

function CategoryBox({ title, href, text }) {
  return (
    <section className="category-box">
      <h2><Link href={href}>{title}</Link></h2>
      <p>{text}</p>
      <Link href={href} className="category-more">Read More »</Link>
    </section>
  );
}
