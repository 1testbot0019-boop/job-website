import Link from "next/link";
import SkylineDivider from "./SkylineDivider";

const NAV = [
  { href: "/jobs", label: "Jobs" },
  { href: "/results", label: "Results" },
  { href: "/admit-card", label: "Admit Cards" },
  { href: "/answer-key", label: "Answer Keys" },
  { href: "/notification", label: "Notifications" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/search", label: "Search" },
];

export default function Header() {
  return (
    <header className="bg-ridge text-paper">
      <div className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Uttarakhand Rojgar
          <span className="block font-mono text-[11px] tracking-widest uppercase text-marigold mt-1">
            Jobs · Results · Admit Cards
          </span>
        </Link>
      </div>
      <nav className="max-w-4xl mx-auto px-5 pb-4 flex flex-wrap gap-x-5 gap-y-1 font-body text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-marigold transition-colors">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="text-ridge">
        <SkylineDivider />
      </div>
    </header>
  );
}
