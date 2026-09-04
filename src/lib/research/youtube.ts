/**
 * YouTube implementation of ResearchProvider, backed by the YouTube Data
 * API v3. Plain `fetch` against the REST endpoints — no SDK dependency.
 */

import type { ReferenceResult, ResearchProvider, ResearchQuery } from './provider';
import { ResearchProviderError } from './provider';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchItem {
  id: { videoId?: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: Record<string, { url: string }>;
  };
  contentDetails: {
    duration: string; // ISO 8601, e.g. "PT4M13S"
  };
}

export class YouTubeResearchProvider implements ResearchProvider {
  readonly name = 'youtube';

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new ResearchProviderError('Missing YOUTUBE_API_KEY.', 'youtube');
    }
  }

  async search(query: ResearchQuery): Promise<ReferenceResult[]> {
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);

    const videoIds = await this.findVideoIds(query.query, limit);
    if (videoIds.length === 0) return [];

    return this.hydrate(videoIds);
  }

  private async findVideoIds(q: string, limit: number): Promise<string[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', String(limit));
    url.searchParams.set('key', this.apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      throw new ResearchProviderError(
        `YouTube search failed with status ${res.status}.`,
        'youtube',
        await safeText(res),
      );
    }

    const json = (await res.json()) as { items?: YouTubeSearchItem[] };
    return (json.items ?? [])
      .map((item) => item.id.videoId)
      .filter((id): id is string => Boolean(id));
  }

  private async hydrate(videoIds: string[]): Promise<ReferenceResult[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('key', this.apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      throw new ResearchProviderError(
        `YouTube video lookup failed with status ${res.status}.`,
        'youtube',
        await safeText(res),
      );
    }

    const json = (await res.json()) as { items?: YouTubeVideoItem[] };

    return (json.items ?? []).map((item) => ({
      id: item.id,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${item.id}`,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      durationSec: parseIso8601Duration(item.contentDetails.duration),
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
      raw: item,
    }));
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

/** Parses an ISO 8601 duration (e.g. "PT1H2M3S") into whole seconds. */
export function parseIso8601Duration(duration: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}
