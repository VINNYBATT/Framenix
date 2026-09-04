import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { executeBlueprint } from '@/lib/engines/production';
import { NotImplementedError } from '@/lib/engines/errors';
import type { Blueprint as BlueprintType } from '@/lib/engines/blueprint';

/**
 * STEP 7 of the Phase 1 workflow (section 6). The Production Engine is not
 * implemented — this route exists so the studio UI has a real endpoint to
 * call and a real, honest failure mode to render, rather than a client
 * that pretends production is possible.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blueprint = await prisma.blueprint.findFirst({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: { scenes: { include: { shots: true } } },
  });
  if (!blueprint) {
    return NextResponse.json({ error: 'No blueprint to produce yet.' }, { status: 400 });
  }

  try {
    const result = await executeBlueprint(blueprint as unknown as BlueprintType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotImplementedError) {
      return NextResponse.json(
        {
          error: error.message,
          implemented: false,
        },
        { status: 501 },
      );
    }
    throw error;
  }
}
