/**
 * AI provider abstraction.
 *
 * Every engine in src/lib/engines/* talks to this interface, never to a
 * specific vendor SDK. Phase 1 ships a single implementation (Gemini, see
 * ./gemini.ts), but nothing above this boundary knows that — swapping or
 * adding a provider (a different model for video understanding, a second
 * vendor for redundancy, a fine-tuned model for one engine) means writing a
 * new class that satisfies this interface, not touching engine code.
 */

/** A JSON Schema object, as accepted by Gemini's `responseSchema` config. */
export type JsonSchema = Record<string, unknown>;

export interface GenerateTextOptions {
  /** The user-facing instruction/content for this generation. */
  prompt: string;
  /** Optional system instruction that frames the model's role. */
  system?: string;
  /**
   * When provided, the provider is asked to constrain its output to this
   * JSON Schema. The result's `json` field is populated with the parsed,
   * schema-conformant object.
   */
  responseSchema?: JsonSchema;
  temperature?: number;
}

export interface AnalyzeVideoOptions {
  /** A publicly reachable video URL. YouTube URLs are supported natively. */
  videoUrl: string;
  /** What to look for / how to structure the analysis. */
  prompt: string;
  system?: string;
  responseSchema?: JsonSchema;
  temperature?: number;
}

export interface AIResult {
  /** Raw text returned by the model. */
  text: string;
  /** Parsed JSON when a responseSchema was supplied and parsing succeeded. */
  json?: unknown;
  /** Which underlying model actually served the request. */
  modelUsed: string;
}

export interface AIProvider {
  readonly name: string;

  /** Pure text/JSON generation — used by intent, patterns and blueprint engines. */
  generateText(options: GenerateTextOptions): Promise<AIResult>;

  /** Video-grounded generation — used by the video analysis engine. */
  analyzeVideo(options: AnalyzeVideoOptions): Promise<AIResult>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
