import { GeminiProvider } from './gemini';
import type { AIProvider } from './provider';

export type { AIProvider, AIResult, GenerateTextOptions, AnalyzeVideoOptions, JsonSchema } from './provider';
export { AIProviderError } from './provider';

let cached: AIProvider | null = null;

/**
 * Returns the process-wide AIProvider. Phase 1 always resolves to Gemini,
 * but every caller goes through this factory rather than importing
 * GeminiProvider directly, so swapping the default provider later is a
 * one-line change here.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  cached = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY || '',
    textModel: process.env.GEMINI_TEXT_MODEL,
    videoModel: process.env.GEMINI_VIDEO_MODEL,
  });

  return cached;
}
