import Link from "next/link";
import { notFound } from "next/navigation";
import SchemeCard from "../../../components/SchemeCard";
import { getSchemes } from "../../../lib/schemeQueries";
import { STATES, stateFromSlug, stateSlug } from "../../../lib/states";

export const revalidate = 1800;

export async function generateStaticParams() {
  return STATES.map((state) => ({ state: stateSlug(state) }));
}

export async function generateMetadata({ params }) {
  const state = stateFromSlug(params.state);
  if (!state) return {};
  return { title: `${state} Government Schemes 2026 – Eligibility, Benefits & Apply`, description: `Latest ${state} government schemes with eligibility, benefits, required documents, application process and official government links.` };
}

export default async function StateSchemesPage({ params }) {
  const state = stateFromSlug(params.state);
  if (!state) notFound();
  const schemes = await getSchemes({ state, limit: 100 });
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
      <div className="mb-8"><Link href="/government-schemes" className="text-sm text-marigold">← All Government Schemes</Link><div className="font-mono text-xs uppercase tracking-widest text-marigold mt-5 mb-2">State Government Schemes</div><h1 className="font-display text-4xl text-ridge">{state} Government Schemes</h1><p className="mt-4 max-w-3xl text-ink/70 leading-7">Find {state} welfare schemes, financial assistance, scholarships, employment support and other government programmes. Verify the latest rules and application status on the official department website before applying.</p></div>
      {schemes.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{schemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}</div> : <div className="border border-dashed border-stone p-8 text-ink/65">No verified scheme records have been published for {state} yet. This page is ready for the official scheme dataset.</div>}
    </div>
  );
}
