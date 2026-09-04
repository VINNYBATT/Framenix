import { YouTubeResearchProvider } from './youtube';
import type { ResearchProvider } from './provider';

export type { ResearchProvider, ResearchQuery, ReferenceResult } from './provider';
export { ResearchProviderError } from './provider';

let cached: ResearchProvider | null = null;

/** Returns the process-wide ResearchProvider. Phase 1 always resolves to YouTube. */
export function getResearchProvider(): ResearchProvider {
  if (cached) return cached;
  cached = new YouTubeResearchProvider(process.env.YOUTUBE_API_KEY || '');
  return cached;
}
