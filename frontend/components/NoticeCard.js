import Link from "next/link";

const CATEGORY_STYLES = {
  JOB: { label: "Job", color: "bg-marigold" },
  RESULT: { label: "Result", color: "bg-pine" },
  ADMIT_CARD: { label: "Admit Card", color: "bg-rust" },
  ANSWER_KEY: { label: "Answer Key", color: "bg-ridge" },
  NOTIFICATION: { label: "Notice", color: "bg-stone" },
  SYLLABUS: { label: "Syllabus", color: "bg-ridge" },
  PREVIOUS_PAPER: { label: "Previous Paper", color: "bg-stone" },
};

function formatDate(dateStr) {
  if (!dateStr) return "Date not listed";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function NoticeCard({ update }) {
  const style = CATEGORY_STYLES[update.category] || CATEGORY_STYLES.NOTIFICATION;

  return (
    <article className="relative border border-stone bg-white/60 pl-4 pr-5 py-4 flex gap-4 items-start">
      {/* Left category bar - the "stamp" of the notice */}
      <span className={`absolute left-0 top-0 h-full w-1.5 ${style.color}`} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] uppercase tracking-wide text-ink/60">
          <span>{style.label}</span>
          <span aria-hidden="true">·</span>
          <span>{update.department}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={update.published_date ?? ""}>{formatDate(update.published_date)}</time>
        </div>

        <h3 className="font-display text-lg leading-snug text-ridge">
          <Link href={`/job/${update.slug}`} className="hover:underline underline-offset-2">
            {update.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
