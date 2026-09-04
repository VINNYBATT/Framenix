/**
 * Blueprint Engine — turns intent + discovered patterns into an executable
 * production plan (see section 4, "Blueprint Engine"). This is the pivot
 * point of the Phase 1 pipeline: everything before it is understanding,
 * everything after it (Production Engine, not yet implemented) is
 * execution.
 */

import { getAIProvider } from '@/lib/ai';
import type { JsonSchema } from '@/lib/ai';
import type { IntentReading } from './intent';
import type { DiscoveredPattern } from './patterns';

export interface BlueprintShot {
  description: string;
  cameraNotes: string | null;
  durationSec: number | null;
  transition: string | null;
}

export interface BlueprintScene {
  title: string;
  description: string;
  durationSec: number | null;
  shots: BlueprintShot[];
}

export interface Blueprint {
  concept: string;
  objective: string;
  targetFormat: string;
  durationSec: number | null;
  narrative: { hook: string; arc: string; payoff: string };
  voice: { style: string } | null;
  music: { style: string } | null;
  captionsPlan: { style: string; placement: string } | null;
  visualDirection: string;
  scenes: BlueprintScene[];
}

const BLUEPRINT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    concept: { type: 'string' },
    objective: { type: 'string' },
    targetFormat: { type: 'string' },
    durationSec: { type: 'number', nullable: true },
    narrative: {
      type: 'object',
      properties: {
        hook: { type: 'string' },
        arc: { type: 'string' },
        payoff: { type: 'string' },
      },
      required: ['hook', 'arc', 'payoff'],
    },
    voice: {
      type: 'object',
      nullable: true,
      properties: { style: { type: 'string' } },
      required: ['style'],
    },
    music: {
      type: 'object',
      nullable: true,
      properties: { style: { type: 'string' } },
      required: ['style'],
    },
    captionsPlan: {
      type: 'object',
      nullable: true,
      properties: { style: { type: 'string' }, placement: { type: 'string' } },
      required: ['style', 'placement'],
    },
    visualDirection: { type: 'string' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          durationSec: { type: 'number', nullable: true },
          shots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                cameraNotes: { type: 'string', nullable: true },
                durationSec: { type: 'number', nullable: true },
                transition: { type: 'string', nullable: true },
              },
              required: ['description'],
            },
          },
        },
        required: ['title', 'description', 'shots'],
      },
    },
  },
  required: ['concept', 'objective', 'targetFormat', 'narrative', 'visualDirection', 'scenes'],
};

const SYSTEM = `You are the Blueprint Engine inside FrameNix, an intelligent audiovisual production
platform. You receive a creator's intent and the patterns discovered across their references, and
must produce one concrete, executable production plan: a concept, a narrative (hook/arc/payoff), a
scene-by-shot breakdown, and direction for voice, music, captions and visual style. Ground every
decision in the intent and the supplied patterns — do not invent generic advice. The plan must be
specific enough that a production engine could execute it, and clear enough that a human reads it
and understands exactly what will be made and why.`;

export async function buildBlueprint(
  intent: IntentReading,
  patterns: DiscoveredPattern[],
): Promise<Blueprint> {
  const ai = getAIProvider();

  const result = await ai.generateText({
    system: SYSTEM,
    prompt:
      `Intent:\n${JSON.stringify(intent, null, 2)}\n\n` +
      `Discovered patterns:\n${JSON.stringify(patterns, null, 2)}\n\n` +
      'Produce the production blueprint.',
    responseSchema: BLUEPRINT_SCHEMA,
    temperature: 0.4,
  });

  return result.json as Blueprint;
}
