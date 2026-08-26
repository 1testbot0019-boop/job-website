// A simple Himalayan ridge line used as a structural divider instead of a
// generic gradient bar. Appears under the header and above the footer.
export default function SkylineDivider({ flip = false }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className={`w-full h-[28px] ${flip ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <polyline
        points="0,55 90,20 180,45 260,10 340,40 430,15 520,48 610,22 700,50 800,18 900,42 980,12 1080,46 1200,25 1200,60 0,60"
        fill="currentColor"
      />
    </svg>
  );
}
