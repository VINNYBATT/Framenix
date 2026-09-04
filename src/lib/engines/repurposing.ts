/**
 * Repurposing Engine — NOT IMPLEMENTED.
 *
 * Would treat one source video as a producer of many platform-adapted
 * outputs (YouTube, Shorts, TikTok, Reels, a teaser, a quote clip, ...) —
 * see section 4, "Repurposing Engine". See production.ts for why this
 * throws instead of faking a result.
 */

import { NotImplementedError } from './errors';

export interface RepurposingRequest {
  sourceUrl: string;
  targetPlatforms: string[];
}

export interface RepurposingResult {
  targets: Array<{ platform: string; outputUrl: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function repurposeContent(request: RepurposingRequest): Promise<RepurposingResult> {
  throw new NotImplementedError('Repurposing Engine');
}
