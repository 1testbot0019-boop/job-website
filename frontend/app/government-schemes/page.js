import Link from "next/link";
import SchemeCard from "../../components/SchemeCard";
import { getSchemes } from "../../lib/schemeQueries";
import { STATES, stateSlug } from "../../lib/states";

export const revalidate = 1800;
export const metadata = {
  title: "Government Schemes in India 2026 – State Wise, Agriculture, Solar & Horticulture",
  description: "Find Central and State Government Schemes in India for agriculture, farming, horticulture, solar, dairy, fisheries, MSME, education, health and welfare with official government links.",
};

const CATEGORIES = [
  ["Agriculture & Farming", "Agriculture, farmers, crops, irrigation and farming support"],
  ["Horticulture", "Fruit, vegetables, orchards, mushroom, beekeeping and protected cultivation"],
  ["Solar & Renewable Energy", "Solar power, rooftop solar, solar pumps and renewable energy"],
  ["Animal Husbandry & Dairy", "Livestock, dairy, poultry, goat, sheep and fodder schemes"],
  ["Fisheries", "Fisheries, aquaculture and fish farming assistance"],
  ["Rural Development", "Rural livelihoods, villages, SHGs and local development"],
  ["MSME & Entrepreneurship", "Business, startups, MSME and self-employment support"],
  ["Education", "Scholarships, students, schools, colleges and skills"],
  ["Health", "Health, medical, AYUSH and welfare programmes"],
  ["Women & Child", "Women, girls, children and maternal support"],
  ["Housing", "Housing, shelter and home assistance"],
  ["Social Security", "Pension, disability, widow and senior citizen schemes"],
];

export default async function GovernmentSchemesPage() {
  const schemes = await getSchemes({ limit: 100 });
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
      <header className="mb-10 max-w-4xl">
        <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">Government Schemes · State Wise</div>
        <h1 className="font-display text-4xl md:text-5xl text-ridge leading-tight mb-4">Government Schemes in India</h1>
        <p className="text-lg text-ink/70 leading-8">Explore government schemes by State and Union Territory, including agriculture, farming, horticulture, solar and renewable energy, dairy, fisheries, MSME and welfare programmes. Scheme records are collected from official government sources and include a direct official link.</p>
      </header>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-ridge mb-5">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map(([category, description]) => (
            <div key={category} className="border border-stone bg-white p-4">
              <h3 className="font-semibold text-ridge">{category}</h3>
              <p className="text-sm text-ink/60 mt-1 leading-6">{description}</p>
            </div>
          ))}
        </div>
      </section>

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
