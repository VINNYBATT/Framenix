/**
 * Transformation Engine — NOT IMPLEMENTED.
 *
 * Would adapt an existing piece of content into a different form: long
 * video → Shorts, a different visual style, a different hook, a different
 * platform, a localized version (see section 4, "Transformation Engine").
 * See production.ts for why this throws instead of faking a result.
 */

import { NotImplementedError } from './errors';

export interface TransformationRequest {
  sourceUrl: string;
  kind: 'long-to-shorts' | 'restyle' | 'reformat' | 'localize';
}

export interface TransformationResult {
  outputUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function transformContent(request: TransformationRequest): Promise<TransformationResult> {
  throw new NotImplementedError('Transformation Engine');
}
