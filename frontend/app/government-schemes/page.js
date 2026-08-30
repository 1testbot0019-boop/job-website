import Link from "next/link";
import SchemeCard from "../../components/SchemeCard";
import { getSchemes } from "../../lib/schemeQueries";
import { STATES, stateSlug } from "../../lib/states";

export const revalidate = 1800;
export const metadata = {
  title: "Government Schemes in India 2026 – State Wise Schemes, Eligibility & Benefits",
  description: "Find Central and State Government Schemes in India with eligibility, benefits, required documents, application process and official government links.",
};

export default async function GovernmentSchemesPage() {
  const schemes = await getSchemes({ limit: 100 });
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
      <header className="mb-10 max-w-4xl">
        <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">Government Schemes · State Wise</div>
        <h1 className="font-display text-4xl md:text-5xl text-ridge leading-tight mb-4">Government Schemes in India</h1>
        <p className="text-lg text-ink/70 leading-8">Explore government welfare schemes by State and Union Territory. Each scheme page explains benefits, eligibility, documents and how to apply, with a direct link to the official government source.</p>
      </header>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-ridge mb-5">Browse Schemes State Wise</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {STATES.map((state) => <Link key={state} href={`/government-schemes/${stateSlug(state)}`} className="border border-stone bg-white p-4 font-semibold text-ridge hover:border-marigold transition-colors">{state}</Link>)}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-5"><div><h2 className="font-display text-2xl text-ridge">Latest Government Schemes</h2><p className="text-sm text-ink/60">Official-source-backed scheme information.</p></div></div>
        {schemes.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{schemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}</div> : <div className="border border-dashed border-stone p-6 text-ink/65">Scheme records will appear here as the official scheme dataset is populated.</div>}
      </section>
    </div>
  );
}
