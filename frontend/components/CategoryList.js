import { getUpdates } from "../lib/queries";
import NoticeCard from "./NoticeCard";

export default async function CategoryList({ category, title, blurb }) {
  const updates = await getUpdates({ category, limit: 50 });

  return (
    <>
      <h1 className="font-display text-3xl text-ridge mb-2">{title}</h1>
      {blurb && <p className="text-ink/70 mb-8 max-w-xl">{blurb}</p>}

      {updates.length === 0 ? (
        <p className="font-body text-sm text-ink/70 border border-dashed border-stone p-6">
          No {title.toLowerCase()} have been collected yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {updates.map((u) => (
            <NoticeCard key={u.id} update={u} />
          ))}
        </div>
      )}
    </>
  );
}
