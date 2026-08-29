import SkylineDivider from "./SkylineDivider";

export default function Footer() {
  return (
    <footer className="mt-16 text-paper bg-ridge">
      <div className="text-ridge">
        <SkylineDivider flip />
      </div>
      <div className="max-w-4xl mx-auto px-5 py-8 font-body text-sm leading-relaxed text-paper/85">
        <p className="mb-2">
          Information on this site is collected from publicly available official
         Government websites. Candidates should always verify details from the official
          notification before applying.
        </p>
        <p className="font-mono text-xs text-paper/60">
          Not an official government website.
        </p>
      </div>
    </footer>
  );
}
