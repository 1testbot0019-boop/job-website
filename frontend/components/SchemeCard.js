import Link from "next/link";

export default function SchemeCard({ scheme }) {
  return (
    <Link href={`/scheme/${scheme.slug}`} className="block border border-stone bg-white p-5 hover:border-ridge transition-colors">
      <div className="text-[10px] uppercase tracking-widest text-marigold mb-2">{scheme.state} · {scheme.category}</div>
      <h2 className="font-display text-xl text-ridge leading-snug mb-2">{scheme.title}</h2>
      <p className="text-sm text-ink/65 leading-6">{scheme.short_description || "Eligibility, benefits, documents, application process and official government link."}</p>
      <span className="inline-block mt-4 text-sm font-semibold text-ridge">View Scheme →</span>
    </Link>
  );
}
