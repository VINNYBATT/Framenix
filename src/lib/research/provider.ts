/**
 * Research provider abstraction.
 *
 * The Research Engine (src/lib/engines/research.ts) talks to this
 * interface. Phase 1 ships YouTube only (see ./youtube.ts), but the shape
 * is intentionally generic — a reference is "a piece of audiovisual content
 * discovered somewhere," not "a YouTube video" — so a future provider
 * (Vimeo, TikTok's research API, a general web-video crawler) can be added
 * without reshaping callers.
 */

export interface ResearchQuery {
  /** Free-text query — a topic, format, or competitor to search for. */
  query: string;
  /** Maximum number of references to return. */
  limit?: number;
}

export interface ReferenceResult {
  /** Provider-qualified id, e.g. a YouTube video id. */
  id: string;
  source: string; // e.g. "youtube"
  url: string;
  title: string;
  channel?: string;
  publishedAt?: string; // ISO 8601
  durationSec?: number;
  thumbnailUrl?: string;
  /** Raw provider payload, kept for traceability. */
  raw?: unknown;
}

export interface ResearchProvider {
  readonly name: string;
  search(query: ResearchQuery): Promise<ReferenceResult[]>;
}

export class ResearchProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ResearchProviderError';
  }
}
