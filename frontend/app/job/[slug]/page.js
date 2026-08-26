import { notFound } from "next/navigation";
import { getUpdateBySlug } from "../../../lib/queries";

export const revalidate = 300;

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

function DateBox({ label, value }) {
  if (!value) return null;
  return (
    <div className="border border-stone bg-white/50 p-4">
      <dt className="text-ink/50 uppercase text-xs tracking-wide mb-1">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default async function NoticeDetailPage({ params }) {
  const update = await getUpdateBySlug(params.slug);
  if (!update) notFound();

  const dates = update.important_dates || {};
  const isJob = update.category === "JOB";

  return (
    <article className="max-w-4xl">
      <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">
        {update.category.replace("_", " ")} · {update.department}
      </div>

      <h1 className="font-display text-3xl md:text-4xl text-ridge mb-4 leading-snug">
        {update.title}
      </h1>

      <p className="text-ink/65 mb-8">
        Latest information, important dates and official links for this notice.
      </p>

      <section className="mb-10">
        <h2 className="font-display text-xl text-ridge mb-4">Important Dates</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-body text-sm">
          <DateBox label="Published" value={formatDate(update.published_date)} />
          <DateBox label="Applications open" value={dates.start} />
          <DateBox label="Last date" value={dates.end} />
          <DateBox label="Exam date" value={dates.exam_date} />
        </dl>
      </section>

      <section className="mb-10 border-y border-stone py-8">
        <h2 className="font-display text-xl text-ridge mb-3">
          {isJob ? "About this recruitment" : "About this update"}
        </h2>
        <p className="leading-relaxed max-w-3xl">
          {update.description || update.title}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-ridge mb-3">How to proceed</h2>
        <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
          <li>Read the official notification carefully.</li>
          <li>Check eligibility, important dates and required documents.</li>
          <li>Use only the official website or official application portal.</li>
          <li>Keep a copy of the official notice for future reference.</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-ridge mb-4">Official Links</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={update.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-marigold text-ink px-5 py-2.5 font-body font-medium hover:opacity-90 transition-opacity"
          >
            Visit Official Notification
          </a>
          {update.pdf_url && (
            <a
              href={update.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-ridge text-ridge px-5 py-2.5 font-body hover:bg-ridge hover:text-paper transition-colors"
            >
              Download Official PDF
            </a>
          )}
        </div>
      </section>

      <aside className="border border-stone bg-white/40 p-5 text-sm leading-relaxed">
        <strong>Important:</strong> This page is an information summary. Always
        verify eligibility, vacancies, dates and application instructions from
        the official notification before applying.
      </aside>
    </article>
  );
}
