/**
 * Intent Engine — understands what the creator is trying to accomplish.
 *
 * Turns raw, unstructured input (an idea, a URL, a pasted description) into
 * a structured reading the rest of the pipeline can act on: what's being
 * made, who it's for, and what to go research first.
 */

import { getAIProvider } from '@/lib/ai';
import type { JsonSchema } from '@/lib/ai';

export interface IntentReading {
  goal: string;
  audience: string | null;
  platform: string | null;
  objective: string;
  /** Queries the Research Engine should run next. */
  suggestedResearchQueries: string[];
  confidence: number;
}

const INTENT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    goal: {
      type: 'string',
      description:
        'One sentence: what is being created (e.g. "recreate a visual style", "turn a long video into Shorts").',
    },
    audience: { type: 'string', nullable: true, description: 'Who this is for, if inferable.' },
    platform: {
      type: 'string',
      nullable: true,
      description: 'Target platform if known: YouTube, YouTube Shorts, TikTok, Instagram Reels, etc.',
    },
    objective: { type: 'string', description: 'Why this is being made — the underlying goal.' },
    suggestedResearchQueries: {
      type: 'array',
      items: { type: 'string' },
      description: '2-5 concrete search queries to find relevant audiovisual references.',
    },
    confidence: { type: 'number', description: 'How confident this reading is, from 0 to 1.' },
  },
  required: ['goal', 'objective', 'suggestedResearchQueries', 'confidence'],
};

const SYSTEM = `You are the Intent Engine inside FrameNix, an intelligent audiovisual production platform.
Your only job is to read a creator's raw input — an idea, a URL, a reference, a description — and
determine what they are actually trying to accomplish, so the rest of the platform (research,
analysis, blueprinting) can act on a clear objective instead of a vague prompt. Be concrete. Prefer
specific, actionable research queries over generic ones. Return only the structured reading.`;

export async function readIntent(rawInput: string): Promise<IntentReading> {
  const ai = getAIProvider();
  const result = await ai.generateText({
    system: SYSTEM,
    prompt: `Creator input:\n"""${rawInput}"""\n\nRead this input and return the structured intent.`,
    responseSchema: INTENT_SCHEMA,
    temperature: 0.2,
  });

  return result.json as IntentReading;
}
