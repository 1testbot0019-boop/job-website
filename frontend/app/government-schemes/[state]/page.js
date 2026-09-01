import Link from "next/link";
import { notFound } from "next/navigation";
import SchemeCard from "../../../components/SchemeCard";
import { getSchemes } from "../../../lib/schemeQueries";
import { STATES, stateFromSlug, stateSlug } from "../../../lib/states";

export const revalidate = 1800;

const CATEGORIES = [
  "Agriculture & Farming",
  "Horticulture",
  "Solar & Renewable Energy",
  "Animal Husbandry & Dairy",
  "Fisheries",
  "Rural Development",
  "MSME & Entrepreneurship",
  "Education",
  "Health",
  "Women & Child",
  "Housing",
  "Social Security",
];

export async function generateStaticParams() {
  return STATES.map((state) => ({ state: stateSlug(state) }));
}

export async function generateMetadata({ params }) {
  const state = stateFromSlug(params.state);
  if (!state) return {};
  return {
    title: `${state} Government Schemes 2026 – Agriculture, Solar, Horticulture & More`,
    description: `Find ${state} government schemes for agriculture, farming, horticulture, solar, dairy, fisheries, MSME, education and welfare with official links.`,
  };
}

export default async function StateSchemesPage({ params, searchParams }) {
  const state = stateFromSlug(params.state);
  if (!state) notFound();
  const category = searchParams?.category || null;
  const schemes = await getSchemes({ state, category, limit: 200 });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
      <div className="mb-8">
        <Link href="/government-schemes" className="text-sm text-marigold">← All Government Schemes</Link>
        <div className="font-mono text-xs uppercase tracking-widest text-marigold mt-5 mb-2">State Government Schemes</div>
        <h1 className="font-display text-4xl text-ridge">{state} Government Schemes</h1>
        <p className="mt-4 max-w-3xl text-ink/70 leading-7">Find official {state} schemes for agriculture, farming, horticulture, solar and renewable energy, dairy, fisheries, rural development, MSME, education, health and social welfare.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/government-schemes/${stateSlug(state)}`} className={`px-3 py-2 border text-sm ${!category ? "border-marigold bg-marigold/10" : "border-stone bg-white"}`}>All Categories</Link>
        {CATEGORIES.map((item) => (
          <Link key={item} href={`/government-schemes/${stateSlug(state)}?category=${encodeURIComponent(item)}`} className={`px-3 py-2 border text-sm ${category === item ? "border-marigold bg-marigold/10" : "border-stone bg-white"}`}>{item}</Link>
        ))}
      </div>

      <div className="mb-5 text-sm text-ink/60">{schemes.length} scheme{schemes.length === 1 ? "" : "s"}{category ? ` in ${category}` : ""}</div>

      {schemes.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}
        </div>
      ) : (
        <div className="border border-dashed border-stone p-8 text-ink/65">No verified scheme records have been published for this category yet. The scheduled official-source crawler will continue looking for new records.</div>
      )}
    </div>
  );
}
