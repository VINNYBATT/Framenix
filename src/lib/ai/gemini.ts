/**
 * Gemini implementation of AIProvider.
 *
 * Uses the Google GenAI SDK (`@google/genai`) — deliberately NOT the
 * deprecated `@google/generative-ai` package. This is the only file in the
 * codebase that should import `@google/genai`; everything else consumes the
 * AIProvider interface (see ./provider.ts).
 */

import { GoogleGenAI } from '@google/genai';
import type {
  AIProvider,
  AIResult,
  AnalyzeVideoOptions,
  GenerateTextOptions,
} from './provider';
import { AIProviderError } from './provider';

const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';
const DEFAULT_VIDEO_MODEL = 'gemini-2.5-flash';

export interface GeminiProviderConfig {
  apiKey: string;
  textModel?: string;
  videoModel?: string;
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  private readonly client: GoogleGenAI;
  private readonly textModel: string;
  private readonly videoModel: string;

  constructor(config: GeminiProviderConfig) {
    if (!config.apiKey) {
      throw new AIProviderError('Missing GEMINI_API_KEY.', 'gemini');
    }
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.textModel = config.textModel || DEFAULT_TEXT_MODEL;
    this.videoModel = config.videoModel || DEFAULT_VIDEO_MODEL;
  }

  async generateText(options: GenerateTextOptions): Promise<AIResult> {
    try {
      const response = await this.client.models.generateContent({
        model: this.textModel,
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        config: {
          ...(options.system ? { systemInstruction: options.system } : {}),
          ...(typeof options.temperature === 'number'
            ? { temperature: options.temperature }
            : {}),
          ...(options.responseSchema
            ? {
                responseMimeType: 'application/json',
                responseSchema: options.responseSchema,
              }
            : {}),
        },
      });

      return this.toResult(response, this.textModel, Boolean(options.responseSchema));
    } catch (error) {
      throw new AIProviderError('Gemini text generation failed.', 'gemini', error);
    }
  }

  async analyzeVideo(options: AnalyzeVideoOptions): Promise<AIResult> {
    try {
      const response = await this.client.models.generateContent({
        model: this.videoModel,
        contents: [
          {
            role: 'user',
            parts: [
              // Gemini accepts YouTube URLs (and other public video URLs)
              // directly as fileData — no upload step required.
              { fileData: { fileUri: options.videoUrl } },
              { text: options.prompt },
            ],
          },
        ],
        config: {
          ...(options.system ? { systemInstruction: options.system } : {}),
          ...(typeof options.temperature === 'number'
            ? { temperature: options.temperature }
            : {}),
          ...(options.responseSchema
            ? {
                responseMimeType: 'application/json',
                responseSchema: options.responseSchema,
              }
            : {}),
        },
      });

      return this.toResult(response, this.videoModel, Boolean(options.responseSchema));
    } catch (error) {
      throw new AIProviderError('Gemini video analysis failed.', 'gemini', error);
    }
  }

  private toResult(
    // The SDK's GenerateContentResponse — typed loosely here since we only
    // rely on the `.text` accessor, which is stable across SDK versions.
    response: { text?: string },
    modelUsed: string,
    expectJson: boolean,
  ): AIResult {
    const text = response.text ?? '';

    if (!expectJson) {
      return { text, modelUsed };
    }

    try {
      return { text, json: JSON.parse(text), modelUsed };
    } catch (error) {
      throw new AIProviderError(
        'Gemini returned a response that did not match the requested JSON schema.',
        'gemini',
        error,
      );
    }
  }
}
