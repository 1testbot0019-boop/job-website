import { notFound } from "next/navigation";
import { getUpdateBySlug } from "../../../lib/queries";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const update = await getUpdateBySlug(params.slug);
  if (!update) return {};
  return {
    title: `${update.title} | Uttarakhand Rojgar`,
    description: update.meta_description || update.description?.slice(0, 155) || update.title,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "Not listed";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function Section({ title, children }) {
  if (!children) return null;
  return <section className="mb-10"><h2 className="font-display text-2xl text-ridge mb-4">{title}</h2>{children}</section>;
}

function LinkButton({ href, children, primary = false }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={primary ? "bg-marigold text-ink px-5 py-3 font-body font-semibold hover:opacity-90 transition-opacity" : "border border-ridge text-ridge px-5 py-3 font-body hover:bg-ridge hover:text-paper transition-colors"}>{children}</a>;
}

export default async function NoticeDetailPage({ params }) {
  const update = await getUpdateBySlug(params.slug);
  if (!update) notFound();

  const dates = update.important_dates || {};
  const vacancies = Array.isArray(update.vacancy_details) ? update.vacancy_details : [];
  const detailGroups = update.notification_details || {};

  return (
    <article className="max-w-4xl pb-10">
      <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">{update.category.replace("_", " ")} · {update.department}</div>
      <h1 className="font-display text-3xl md:text-5xl text-ridge mb-4 leading-tight">{update.title}</h1>
      <p className="text-ink/65 text-lg mb-8">{update.description || "Latest recruitment information, eligibility, dates and official links."}</p>

      <div className="border border-stone bg-white/60 p-5 mb-10 flex flex-wrap gap-3">
        <LinkButton href={update.official_url} primary>Visit Official Notification</LinkButton>
        <LinkButton href={update.apply_url}>Apply Online</LinkButton>
        <LinkButton href={update.pdf_url}>Download Official PDF</LinkButton>
        <LinkButton href={update.official_website_url}>Official Website</LinkButton>
      </div>

      <Section title="Recruitment Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="border border-stone p-4"><strong>Organisation:</strong><br />{update.department}</div>
          <div className="border border-stone p-4"><strong>Category:</strong><br />{update.category.replace("_", " ")}</div>
          <div className="border border-stone p-4"><strong>Published:</strong><br />{formatDate(update.published_date)}</div>
          <div className="border border-stone p-4"><strong>Status:</strong><br />Check the official notice for the latest status.</div>
        </div>
      </Section>

      {Object.keys(dates).length > 0 && <Section title="Important Dates"><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><tbody>{Object.entries(dates).map(([label, value]) => <tr key={label} className="border border-stone"><th className="text-left bg-paper p-3 w-1/2">{label}</th><td className="p-3">{String(value)}</td></tr>)}</tbody></table></div></Section>}

      {vacancies.length > 0 && <Section title="Vacancy Details"><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{Object.keys(vacancies[0]).map(key => <th key={key} className="border border-stone bg-paper text-left p-3">{key}</th>)}</tr></thead><tbody>{vacancies.map((row, index) => <tr key={index}>{Object.keys(vacancies[0]).map(key => <td key={key} className="border border-stone p-3">{row[key]}</td>)}</tr>)}</tbody></table></div></Section>}

      <Section title="Eligibility Criteria">{update.eligibility ? <p className="leading-8 whitespace-pre-line">{update.eligibility}</p> : <p className="leading-8">Please check the official notification for post-wise educational qualifications and eligibility conditions.</p>}</Section>
      {update.age_limit && <Section title="Age Limit"><p className="leading-8 whitespace-pre-line">{update.age_limit}</p></Section>}
      {update.application_fee && <Section title="Application Fee"><p className="leading-8 whitespace-pre-line">{update.application_fee}</p></Section>}
      {update.selection_process && <Section title="Selection Process"><p className="leading-8 whitespace-pre-line">{update.selection_process}</p></Section>}

      {Object.entries(detailGroups).map(([heading, rows]) => <Section key={heading} title={heading}><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-stone p-3">{cell}</td>)}</tr>)}</tbody></table></div></Section>)}

      <Section title="How to Apply">{update.how_to_apply ? <p className="leading-8 whitespace-pre-line">{update.how_to_apply}</p> : <ol className="list-decimal pl-6 space-y-2 leading-8"><li>Open the official notification using the button above.</li><li>Read eligibility, vacancy and date information carefully.</li><li>Use only the official application portal for submission.</li><li>Keep your application number and a copy of the submitted form.</li></ol>}</Section>

      <Section title="Important Links"><div className="flex flex-wrap gap-3"><LinkButton href={update.official_url} primary>Official Notification</LinkButton><LinkButton href={update.apply_url}>Apply Online</LinkButton><LinkButton href={update.pdf_url}>Notification PDF</LinkButton><LinkButton href={update.official_website_url}>Official Website</LinkButton></div></Section>

      <aside className="border border-stone bg-white/40 p-5 text-sm leading-relaxed"><strong>Disclaimer:</strong> This page presents recruitment information in an easy-to-read format. Before applying, always verify vacancies, eligibility, dates, fees and instructions from the official notification and official website.</aside>
    </article>
  );
}
