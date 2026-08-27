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
  if (!dateStr || typeof dateStr === "object") {
    return "Date not listed";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "Date not listed";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(", ") || fallback;
  }

  if (typeof value === "object") {
    const values = Object.values(value)
      .map((item) => safeText(item, ""))
      .filter(Boolean);

    return values.join(", ") || fallback;
  }

  return fallback;
}

export default function NoticeCard({ update }) {
  const category = safeText(update?.category, "NOTIFICATION");

  const style =
    CATEGORY_STYLES[category] ||
    CATEGORY_STYLES.NOTIFICATION;

  const department = safeText(
    update?.department,
    "Uttarakhand Government"
  );

  const title = safeText(
    update?.title,
    "Untitled Notification"
  );

  const slug = safeText(
    update?.slug,
    ""
  );

  const publishedDate =
    update?.published_date;

  return (
    <article className="relative border border-stone bg-white/60 pl-4 pr-5 py-4 flex gap-4 items-start">
      <span
        className={`absolute left-0 top-0 h-full w-1.5 ${style.color}`}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] uppercase tracking-wide text-ink/60">
          <span>{style.label}</span>

          <span aria-hidden="true">·</span>

          <span>{department}</span>

          <span aria-hidden="true">·</span>

          <time
            dateTime={
              typeof publishedDate === "string"
                ? publishedDate
                : ""
            }
          >
            {formatDate(publishedDate)}
          </time>
        </div>

        <h3 className="font-display text-lg leading-snug text-ridge">
          {slug ? (
            <Link
              href={`/job/${slug}`}
              className="hover:underline underline-offset-2"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
      </div>
    </article>
  );
}
