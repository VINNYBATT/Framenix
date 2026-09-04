'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawInput.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      router.push(`/studio/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-24">
      <p className="mb-3 text-sm tracking-wide text-muted">FrameNix Studio</p>
      <h1 className="mb-4 text-4xl font-normal leading-tight text-ink">
        Tell us what you want to make.
      </h1>
      <p className="mb-10 max-w-lg text-muted">
        An idea, a reference, a video URL, an objective — anything. FrameNix will research
        relevant references, understand what makes them work, and propose a production plan.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="e.g. I want to turn my 20-minute interview into a set of YouTube Shorts that hook fast, like the top creators in the productivity space."
          rows={6}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-4 text-ink placeholder:text-muted/70 focus:border-white/25 focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !rawInput.trim()}
          className="self-start rounded-full bg-pill px-6 py-3 text-sm font-medium text-pill-ink transition disabled:opacity-40"
        >
          {loading ? 'Reading intent…' : 'Start'}
        </button>
      </form>
    </main>
  );
}
