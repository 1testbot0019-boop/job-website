import { notFound } from "next/navigation";
import { getUpdateBySlug } from "../../../lib/queries";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const update = await getUpdateBySlug(params.slug);

  if (!update) return {};

  return {
    title: `${update.title} | Uttarakhand Rojgar`,
    description:
      update.meta_description ||
      update.description?.slice(0, 155) ||
      update.title,
  };
}

function formatDate(dateStr) {
  if (!dateStr || typeof dateStr === "object") return "Not listed";

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return String(dateStr);

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.map((item) => safeText(item, "")).filter(Boolean).join(", ") || fallback;
  }
  if (typeof value === "object") {
    const values = Object.values(value).map((item) => safeText(item, "")).filter(Boolean);
    return values.join(", ") || fallback;
  }
  return fallback;
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl text-ridge mb-4">{title}</h2>
      {children}
    </section>
  );
}

function LinkButton({ href, children, primary = false }) {
  if (!href || typeof href !== "string") return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        primary
          ? "bg-marigold text-ink px-5 py-3 font-body font-semibold hover:opacity-90 transition-opacity"
          : "border border-ridge text-ridge px-5 py-3 font-body hover:bg-ridge hover:text-paper transition-colors"
      }
    >
      {children}
    </a>
  );
}

/*
 * The scraper stores the verified government/organisation notification
 * in official_url. Older/newer records may also have the more explicit
 * official_notification_url field. IMPORTANT: a PDF is a valid official
 * notification, so it MUST NOT be rejected for the main notification button.
 */
function getOfficialNotificationUrl(update) {
  const candidates = [
    update?.official_notification_url,
    update?.official_url,
    update?.official_website_url,
  ];

  return (
    candidates.find(
      (url) => typeof url === "string" && url.trim().length > 0
    )?.trim() || ""
  );
}

function getPdfUrl(update) {
  const pdfUrl = typeof update?.pdf_url === "string" ? update.pdf_url.trim() : "";
  if (pdfUrl) return pdfUrl;

  const officialUrl = typeof update?.official_url === "string" ? update.official_url.trim() : "";
  const officialIsPdf = officialUrl.toLowerCase().split("?")[0].endsWith(".pdf");

  return officialIsPdf ? officialUrl : "";
}

export default async function NoticeDetailPage({ params }) {
  const update = await getUpdateBySlug(params.slug);

  if (!update) notFound();

  const dates = update.important_dates && typeof update.important_dates === "object"
    ? update.important_dates
    : {};

  const vacancies = Array.isArray(update.vacancy_details) ? update.vacancy_details : [];

  const detailGroups = update.notification_details && typeof update.notification_details === "object"
    ? update.notification_details
    : {};

  const category = safeText(update.category, "NOTIFICATION");
  const department = safeText(update.department, "Government Department");
  const title = safeText(update.title, "Recruitment Notification");
  const description = safeText(
    update.description,
    "Latest recruitment information, eligibility, dates and official links."
  );

  const officialNotificationUrl = getOfficialNotificationUrl(update);
  const pdfUrl = getPdfUrl(update);
  const applyUrl = typeof update.apply_online_url === "string"
    ? update.apply_online_url.trim()
    : typeof update.apply_url === "string"
      ? update.apply_url.trim()
      : "";
  const officialWebsiteUrl = typeof update.official_website_url === "string"
    ? update.official_website_url.trim()
    : "";

  return (
    <article className="max-w-4xl pb-10">
      <div className="font-mono text-xs uppercase tracking-widest text-marigold mb-3">
        {category.replace(/_/g, " ")} · {department}
      </div>

      <h1 className="font-display text-3xl md:text-5xl text-ridge mb-4 leading-tight">
        {title}
      </h1>

      <p className="text-ink/65 text-lg mb-8">{description}</p>

      <div className="border border-stone bg-white/60 p-5 mb-10 flex flex-wrap gap-3">
        <LinkButton href={officialNotificationUrl} primary>
          Visit Official Notification
        </LinkButton>

        <LinkButton href={applyUrl}>Apply Online</LinkButton>

        <LinkButton href={pdfUrl}>Download Official PDF</LinkButton>

        <LinkButton href={officialWebsiteUrl}>Official Website</LinkButton>
      </div>

      <Section title="Recruitment Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="border border-stone p-4"><strong>Organisation:</strong><br />{department}</div>
          <div className="border border-stone p-4"><strong>Category:</strong><br />{category.replace(/_/g, " ")}</div>
          <div className="border border-stone p-4"><strong>Published:</strong><br />{formatDate(update.published_date)}</div>
          <div className="border border-stone p-4"><strong>Status:</strong><br />Check the official notification for the latest status.</div>
        </div>
      </Section>

      {Object.keys(dates).length > 0 && (
        <Section title="Important Dates">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {Object.entries(dates).map(([label, value]) => (
                  <tr key={label} className="border border-stone">
                    <th className="text-left bg-paper p-3 w-1/2">{safeText(label)}</th>
                    <td className="p-3">{safeText(value, "Not listed")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {vacancies.length > 0 && (
        <Section title="Vacancy Details">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {Object.keys(vacancies[0] || {}).map((key) => (
                    <th key={key} className="border border-stone bg-paper text-left p-3">{safeText(key)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vacancies.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(vacancies[0] || {}).map((key) => (
                      <td key={key} className="border border-stone p-3">{safeText(row?.[key], "-")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Eligibility Criteria">
        {update.qualification ? (
          <p className="leading-8 whitespace-pre-line">{safeText(update.qualification)}</p>
        ) : update.eligibility ? (
          <p className="leading-8 whitespace-pre-line">{safeText(update.eligibility)}</p>
        ) : (
          <p className="leading-8">Please check the official notification for post-wise educational qualifications and eligibility conditions.</p>
        )}
      </Section>

      {update.age_limit && (
        <Section title="Age Limit"><p className="leading-8 whitespace-pre-line">{safeText(update.age_limit)}</p></Section>
      )}

      {update.application_fee && (
        <Section title="Application Fee"><p className="leading-8 whitespace-pre-line">{safeText(update.application_fee, "Please check the official notification.")}</p></Section>
      )}

      {update.selection_process && (
        <Section title="Selection Process"><p className="leading-8 whitespace-pre-line">{safeText(update.selection_process)}</p></Section>
      )}

      {Object.entries(detailGroups).map(([heading, rows]) => {
        if (!Array.isArray(rows)) return null;
        return (
          <Section key={heading} title={safeText(heading)}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {rows.map((row, index) => {
                    if (!Array.isArray(row)) return null;
                    return (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-stone p-3">{safeText(cell, "-")}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        );
      })}

      <Section title="How to Apply">
        {update.how_to_apply ? (
          <p className="leading-8 whitespace-pre-line">{safeText(update.how_to_apply)}</p>
        ) : (
          <ol className="list-decimal pl-6 space-y-2 leading-8">
            <li>Open the official notification using the button above.</li>
            <li>Read eligibility, vacancy and date information carefully.</li>
            <li>Use only the official application portal for submission.</li>
            <li>Keep your application number and a copy of the submitted form.</li>
          </ol>
        )}
      </Section>

      <Section title="Important Links">
        <div className="flex flex-wrap gap-3">
          <LinkButton href={officialNotificationUrl} primary>Official Notification</LinkButton>
          <LinkButton href={applyUrl}>Apply Online</LinkButton>
          <LinkButton href={pdfUrl}>Notification PDF</LinkButton>
          <LinkButton href={officialWebsiteUrl}>Official Website</LinkButton>
        </div>
      </Section>

      <aside className="border border-stone bg-white/40 p-5 text-sm leading-relaxed">
        This website provides job and recruitment information for reference. Always verify the latest eligibility, dates, vacancies, application procedure and notification on the official government or recruiting organisation website before applying.
      </aside>
    </article>
  );
}
