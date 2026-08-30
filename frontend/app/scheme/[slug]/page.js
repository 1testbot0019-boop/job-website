import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecommendedSchemes, getSchemeBySlug } from "../../../lib/schemeQueries";

export const revalidate = 1800;

function Section({ title, children }) { return <section className="mb-9"><h2 className="font-display text-2xl text-ridge mb-3">{title}</h2><div className="leading-8 text-ink/80 whitespace-pre-line">{children}</div></section>; }
function LinkButton({ href, children, primary = false }) { if (!href) return null; return <a href={href} target="_blank" rel="noopener noreferrer" className={primary ? "bg-marigold text-ink px-5 py-3 font-semibold" : "border border-ridge text-ridge px-5 py-3 font-semibold"}>{children}</a>; }

export async function generateMetadata({ params }) {
  const scheme = await getSchemeBySlug(params.slug);
  if (!scheme) return {};
  return { title: scheme.seo_title || `${scheme.title} – Eligibility, Benefits & Apply`, description: scheme.seo_description || scheme.short_description || `${scheme.title}: eligibility, benefits, documents and application process.` };
}

export default async function SchemePage({ params }) {
  const scheme = await getSchemeBySlug(params.slug);
  if (!scheme) notFound();
  const recommended = await getRecommendedSchemes(params.slug, 12);
  const source = scheme.official_source_name || "Official Government Website";
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
      <article>
        <Link href={`/government-schemes/${scheme.state.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="text-sm text-marigold">← {scheme.state} Schemes</Link>
        <div className="font-mono text-xs uppercase tracking-widest text-marigold mt-5 mb-3">{scheme.state} · {scheme.category}</div>
        <h1 className="font-display text-4xl md:text-5xl text-ridge leading-tight mb-4">{scheme.title}</h1>
        <p className="text-lg text-ink/70 leading-8 mb-7">{scheme.short_description || scheme.description}</p>
        <div className="flex flex-wrap gap-3 mb-10"><LinkButton href={scheme.official_url} primary>Visit Official Government Website</LinkButton>{scheme.myscheme_url && <LinkButton href={scheme.myscheme_url}>View on myScheme</LinkButton>}</div>

        <Section title="Scheme Overview">{scheme.description || scheme.short_description || "This page provides a concise guide to the government scheme. Please verify current details on the official source."}</Section>
        <Section title="Benefits">{scheme.benefits || "Benefits depend on the scheme rules and applicant category. See the official source for current benefit amounts, services and limits."}</Section>
        <Section title="Eligibility Criteria">{scheme.eligibility || "Eligibility criteria are determined by the implementing department. Check the official government source before applying."}</Section>
        <Section title="Required Documents">{scheme.documents || "Check the official application portal for the current document checklist."}</Section>
        <Section title="How to Apply">{scheme.application_process || "Open the official government link above, read the current guidelines, and complete the application through the authorised government portal."}</Section>
        <Section title="Official Source"><p>This information was prepared for easier understanding. The authoritative source is <strong>{source}</strong>. Scheme rules, dates, eligibility and benefits can change; verify them before applying.</p></Section>
        <div className="border border-stone bg-white/60 p-5 text-sm">Last verified: {scheme.last_verified ? new Date(scheme.last_verified).toLocaleDateString("en-IN") : "Not recorded"}. This website does not accept scheme applications or payments.</div>
      </article>

      <aside className="lg:sticky lg:top-6 h-fit border border-stone bg-white p-5">
        <h2 className="font-display text-2xl text-ridge mb-2">More Government Schemes</h2>
        <p className="text-sm text-ink/60 mb-3">Keep browsing without returning to the homepage.</p>
        <div className="divide-y divide-stone">{recommended.map((item) => <Link key={item.id} href={`/scheme/${item.slug}`} className="block py-4"><div className="text-[10px] uppercase tracking-widest text-marigold">{item.state} · {item.category}</div><div className="font-semibold text-ridge leading-5 mt-1">{item.title}</div></Link>)}</div>
        <Link href="/government-schemes" className="mt-4 block border border-ridge text-center py-3 font-semibold text-ridge">All States & Schemes</Link>
      </aside>
    </div>
  );
}
