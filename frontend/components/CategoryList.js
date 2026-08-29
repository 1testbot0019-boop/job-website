import Link from "next/link";
import { getUpdates } from "../lib/queries";
import NoticeCard from "./NoticeCard";

export default async function CategoryList({
  category,
  title,
  blurb,
  state = null,
  stateOptions = [],
}) {
  const updates = await getUpdates({ category, state, limit: 100 });

  return (
    <>
      <h1 className="font-display text-3xl text-ridge mb-2">{title}</h1>
      {blurb && <p className="text-ink/70 mb-6 max-w-2xl">{blurb}</p>}

      {stateOptions.length > 0 && (
        <form
          action="/jobs"
          method="GET"
          className="mb-8 flex flex-col gap-3 rounded-lg border border-stone bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="state"
              className="mb-1 block text-sm font-semibold text-ridge"
            >
              Select State / Union Territory
            </label>
            <select
              id="state"
              name="state"
              defaultValue={state || ""}
              className="w-full rounded border border-stone bg-white px-3 py-2 text-ink"
            >
              <option value="">All India</option>
              {stateOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded bg-ridge px-5 py-2 font-semibold text-white"
          >
            Show Jobs
          </button>

          {state && (
            <Link
              href="/jobs"
              className="rounded border border-stone px-5 py-2 text-center font-semibold text-ridge"
            >
              Show All India
            </Link>
          )}
        </form>
      )}

      {updates.length === 0 ? (
        <p className="font-body text-sm text-ink/70 border border-dashed border-stone p-6">
          {state
            ? `No ${state} ${title.toLowerCase()} have been collected yet.`
            : `No ${title.toLowerCase()} have been collected yet.`}
        </p>
      ) : (
        <div className="mb-4 text-sm text-ink/60">
          Showing {updates.length} {state ? `${state} ` : ""}update
          {updates.length === 1 ? "" : "s"}
        </div>
      )}

      {updates.length > 0 && (
        <div className="flex flex-col gap-3">
          {updates.map((u) => (
            <NoticeCard key={u.id} update={u} />
          ))}
        </div>
      )}
    </>
  );
}
