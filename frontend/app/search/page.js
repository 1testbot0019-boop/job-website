"use client";

import { useState } from "react";
import { searchUpdates } from "../../lib/queries";
import NoticeCard from "../../components/NoticeCard";

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    const data = await searchUpdates(term);
    setResults(data);
    setLoading(false);
  }

  return (
    <>
      <h1 className="font-display text-3xl text-ridge mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. UKPSC lecturer, forest guard result..."
          className="flex-1 border border-stone bg-white px-4 py-2 font-body focus:outline-none focus-visible:outline-2 focus-visible:outline-marigold"
        />
        <button
          type="submit"
          className="bg-ridge text-paper px-5 py-2 font-body hover:bg-ridgeDark transition-colors"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-ink/60 font-mono text-sm">Searching…</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-ink/70 border border-dashed border-stone p-6">
          No matches for &ldquo;{term}&rdquo;. Try fewer or different words.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {results.map((u) => (
          <NoticeCard key={u.id} update={u} />
        ))}
      </div>
    </>
  );
}
