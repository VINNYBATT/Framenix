/**
 * Research Engine — discovers relevant external audiovisual references.
 *
 * Phase 1 is a thin, deliberately dumb layer over the YouTube research
 * provider: it runs the queries it's given and returns what comes back.
 * Query *selection* is the Intent Engine's job; ranking, deduplication
 * across providers, and semantic matching are future work (see section 4,
 * "Research Engine" — this file implements only "reference discovery").
 */

import { getResearchProvider } from '@/lib/research';
import type { ReferenceResult } from '@/lib/research';

export interface ResearchOptions {
  queries: string[];
  /** Max references per query. */
  limitPerQuery?: number;
}

export async function findReferences(options: ResearchOptions): Promise<ReferenceResult[]> {
  const provider = getResearchProvider();
  const limit = options.limitPerQuery ?? 6;

  const batches = await Promise.all(
    options.queries.map((query) => provider.search({ query, limit })),
  );

  // De-duplicate by (source, id) across queries — the same video can
  // legitimately surface for more than one query.
  const seen = new Set<string>();
  const references: ReferenceResult[] = [];
  for (const batch of batches) {
    for (const ref of batch) {
      const key = `${ref.source}:${ref.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      references.push(ref);
    }
  }

  return references;
}
