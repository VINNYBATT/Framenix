/**
 * Production Engine — NOT IMPLEMENTED.
 *
 * This is where an approved Blueprint would be executed: asset generation
 * (image/video/voice/music), captioning, compositing and rendering (see
 * section 4, "Production Engine"). The data model (Production, Output,
 * Asset — prisma/schema.prisma) already has a home for this engine's work,
 * and the interface below is what the /studio review step will call once
 * it exists. Per section 41 of the master prompt, this throws rather than
 * returning a fabricated result — the UI must render this as a distinct
 * "not available yet" state, never as a finished production.
 */

import type { Blueprint } from './blueprint';
import { NotImplementedError } from './errors';

export interface ProductionResult {
  outputs: Array<{ url: string; platform: string; format: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function executeBlueprint(blueprint: Blueprint): Promise<ProductionResult> {
  throw new NotImplementedError('Production Engine');
}
