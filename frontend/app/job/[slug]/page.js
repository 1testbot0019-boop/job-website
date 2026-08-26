import { notFound } from "next/navigation";
import { getUpdateBySlug } from "../../../lib/queries";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const update = await getUpdateBySlug(params.slug);
  if (!update) return {};

  return {
    title: `${update.title} | Uttarakhand Rojgar`,
    description: update.description?.slice(0, 155) ?? update.title,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "Not listed";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function NoticeDetailPage({ params }) {
  const update = await getUpdateBySlug(params.slug);
  if (!update) notFound();

  const dates = update.important_dates || {};

  return (
    <article>
      <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">
        {update.category.replace("_", " ")} · {update.department}
      </div>

      <h1 className="font-display text-3xl text-ridge mb-6 leading-snug">{update.title}</h1>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 border-y border-stone py-5 font-body text-sm">
        <div>
          <dt className="text-ink/50 uppercase text-xs tracking-wide mb-1">Published</dt>
          <dd>{formatDate(update.published_date)}</dd>
        </div>
        {dates.start && (
          <div>
            <dt className="text-ink/50 uppercase text-xs tracking-wide mb-1">Applications open</dt>
            <dd>{dates.start}</dd>
          </div>
        )}
        {dates.end && (
          <div>
            <dt className="text-ink/50 uppercase text-xs tracking-wide mb-1">Last date</dt>
            <dd>{dates.end}</dd>
          </div>
        )}
        {dates.exam_date && (
          <div>
            <dt className="text-ink/50 uppercase text-xs tracking-wide mb-1">Exam date</dt>
            <dd>{dates.exam_date}</dd>
          </div>
        )}
      </dl>

      {update.description && (
        <p className="mb-8 leading-relaxed max-w-2xl">{update.description}</p>
      )}

      <div className="flex flex-wrap gap-3 mb-10">
        <a
          href={update.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-marigold text-ink px-5 py-2.5 font-body font-medium hover:opacity-90 transition-opacity"
        >
          View official notification
        </a>
        {update.pdf_url && (
          <a
            href={update.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ridge text-ridge px-5 py-2.5 font-body hover:bg-ridge hover:text-paper transition-colors"
          >
            Download PDF
          </a>
        )}
      </div>

      <p className="font-mono text-xs text-ink/50 border-t border-stone pt-4">
        Source: {update.department} — {update.source_url}. Always confirm details
        against the official notification before applying.
      </p>
    </article>
  );
}
