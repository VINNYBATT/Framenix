/**
 * Pattern Discovery Engine — finds what recurs across multiple analyzed
 * references (see section 4, "Pattern Discovery Engine"). This is the
 * engine that turns "we looked at one video" into "here's what makes this
 * *category* of video work" — one of FrameNix's stated differentiators.
 *
 * Phase 1 implementation: feed every VideoAnalysis produced so far to
 * Gemini as structured evidence and ask it to synthesize recurring,
 * cross-reference patterns, categorized the same way analysis is
 * categorized (hook, pacing, structure, visual, caption, audio, narrative,
 * format).
 */

import { getAIProvider } from '@/lib/ai';
import type { JsonSchema } from '@/lib/ai';
import type { VideoAnalysis } from './analysis';

export type PatternCategory =
  | 'HOOK'
  | 'PACING'
  | 'STRUCTURE'
  | 'VISUAL'
  | 'CAPTION'
  | 'AUDIO'
  | 'NARRATIVE'
  | 'FORMAT';

export interface DiscoveredPattern {
  category: PatternCategory;
  label: string;
  description: string;
  /** Which input references (by index into the input array) support this pattern. */
  evidenceRefIndexes: number[];
  /** 0..1 — how consistently this pattern recurs across the inputs. */
  strength: number;
}

const PATTERNS_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['HOOK', 'PACING', 'STRUCTURE', 'VISUAL', 'CAPTION', 'AUDIO', 'NARRATIVE', 'FORMAT'],
          },
          label: { type: 'string' },
          description: { type: 'string' },
          evidenceRefIndexes: { type: 'array', items: { type: 'integer' } },
          strength: { type: 'number' },
        },
        required: ['category', 'label', 'description', 'evidenceRefIndexes', 'strength'],
      },
    },
  },
  required: ['patterns'],
};

const SYSTEM = `You are the Pattern Discovery Engine inside FrameNix, an intelligent audiovisual
production platform. You receive structured analyses of several reference videos and must find
what recurs across them — not what each video individually does. A pattern is only worth reporting
if it shows up in more than one reference, or is a striking outlier worth flagging as such. Cite
which input references (by index) support each pattern. Prefer few strong, well-evidenced patterns
over many weak ones.`;

export interface AnalyzedReference {
  title: string;
  url: string;
  analysis: VideoAnalysis;
}

export async function discoverPatterns(references: AnalyzedReference[]): Promise<DiscoveredPattern[]> {
  const ai = getAIProvider();

  const evidence = references
    .map((ref, i) => `[${i}] "${ref.title}" (${ref.url})\n${JSON.stringify(ref.analysis, null, 2)}`)
    .join('\n\n');

  const result = await ai.generateText({
    system: SYSTEM,
    prompt: `Here are ${references.length} analyzed references:\n\n${evidence}\n\nFind the patterns that recur across them.`,
    responseSchema: PATTERNS_SCHEMA,
    temperature: 0.3,
  });

  const parsed = result.json as { patterns: DiscoveredPattern[] };
  return parsed.patterns;
}
