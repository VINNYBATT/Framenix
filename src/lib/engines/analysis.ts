/**
 * Video Analysis Engine — converts one raw audiovisual reference into
 * structured understanding: scene structure, pacing, visual language,
 * audio, captions and narrative (see section 4, "Video Analysis Engine").
 *
 * Phase 1 sends the reference straight to Gemini's native video
 * understanding (Gemini accepts YouTube URLs directly — no download/upload
 * step) and asks for a single structured breakdown across all dimensions
 * in one pass.
 */

import { getAIProvider } from '@/lib/ai';
import type { JsonSchema } from '@/lib/ai';

export interface VideoAnalysis {
  summary: string;
  structure: {
    sceneCount: number;
    averageShotDurationSec: number | null;
    scenes: Array<{ description: string; startSec: number | null; endSec: number | null }>;
  };
  pacing: {
    description: string;
    cutsPerMinute: number | null;
  };
  visual: {
    framing: string;
    cameraMovement: string;
    colorAndLighting: string;
  };
  audio: {
    music: string;
    voice: string;
    soundDesign: string;
  };
  captions: {
    present: boolean;
    style: string;
    placement: string;
  };
  narrative: {
    hook: string;
    arc: string;
    payoff: string;
  };
}

const ANALYSIS_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    structure: {
      type: 'object',
      properties: {
        sceneCount: { type: 'integer' },
        averageShotDurationSec: { type: 'number', nullable: true },
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              startSec: { type: 'number', nullable: true },
              endSec: { type: 'number', nullable: true },
            },
            required: ['description'],
          },
        },
      },
      required: ['sceneCount', 'scenes'],
    },
    pacing: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        cutsPerMinute: { type: 'number', nullable: true },
      },
      required: ['description'],
    },
    visual: {
      type: 'object',
      properties: {
        framing: { type: 'string' },
        cameraMovement: { type: 'string' },
        colorAndLighting: { type: 'string' },
      },
      required: ['framing', 'cameraMovement', 'colorAndLighting'],
    },
    audio: {
      type: 'object',
      properties: {
        music: { type: 'string' },
        voice: { type: 'string' },
        soundDesign: { type: 'string' },
      },
      required: ['music', 'voice', 'soundDesign'],
    },
    captions: {
      type: 'object',
      properties: {
        present: { type: 'boolean' },
        style: { type: 'string' },
        placement: { type: 'string' },
      },
      required: ['present', 'style', 'placement'],
    },
    narrative: {
      type: 'object',
      properties: {
        hook: { type: 'string' },
        arc: { type: 'string' },
        payoff: { type: 'string' },
      },
      required: ['hook', 'arc', 'payoff'],
    },
  },
  required: ['summary', 'structure', 'pacing', 'visual', 'audio', 'captions', 'narrative'],
};

const SYSTEM = `You are the Video Analysis Engine inside FrameNix, an intelligent audiovisual production
platform. Given one video, produce a structured breakdown of how it is made — not what it's about.
Focus on editing craft: scene/shot structure, pacing and cut rhythm, framing and camera movement,
color and lighting, music/voice/sound design, on-screen captions, and narrative structure (hook,
arc, payoff). Be specific and concrete; avoid vague adjectives with nothing observable behind them.`;

export async function analyzeVideo(videoUrl: string): Promise<VideoAnalysis> {
  const ai = getAIProvider();
  const result = await ai.analyzeVideo({
    videoUrl,
    system: SYSTEM,
    prompt:
      'Analyze this video and return the structured breakdown described in the schema. ' +
      'If a dimension cannot be determined, say so honestly in that field rather than guessing.',
    responseSchema: ANALYSIS_SCHEMA,
    temperature: 0.2,
  });

  return result.json as VideoAnalysis;
}
