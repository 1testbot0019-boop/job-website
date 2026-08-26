import { getUpdates } from "../lib/queries";
import NoticeCard from "../components/NoticeCard";

export const revalidate = 3600; // re-fetch at most once an hour

export default async function HomePage() {
  const updates = await getUpdates({ limit: 30 });

  return (
    <>
      <section className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-marigold mb-2">
          Updated automatically, every few hours
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ridge leading-tight max-w-2xl">
          Every official Uttarakhand government job, result and admit card, in one place.
        </h1>
      </section>

      <section>
        <h2 className="font-display text-xl text-ridge mb-4 pb-2 border-b border-stone">
          Latest updates
        </h2>

        {updates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {updates.map((u) => (
              <NoticeCard key={u.id} update={u} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <p className="font-body text-sm text-ink/70 border border-dashed border-stone p-6">
      No updates have been collected yet. Once the scraper runs and your
      Supabase table has rows, they will appear here automatically.
    </p>
  );
}
