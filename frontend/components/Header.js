import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Latest Jobs" },
  { href: "/results", label: "Results" },
  { href: "/admit-card", label: "Admit Card" },
  { href: "/answer-key", label: "Answer Key" },
  { href: "/notification", label: "Notifications" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/search", label: "Search" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="top-strip">
        <div className="site-shell header-main">
          <Link href="/" className="brand">
            <span className="brand-mark">UK</span>
            <span>
              <strong>Uttarakhand Rojgar</strong>
              <small>Government Jobs • Results • Admit Cards</small>
            </span>
          </Link>

          <div className="header-note">
            <span>🇮🇳</span>
            <span>Latest Government Updates</span>
          </div>
        </div>
      </div>

      <nav className="nav-bar">
        <div className="site-shell nav-inner">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
