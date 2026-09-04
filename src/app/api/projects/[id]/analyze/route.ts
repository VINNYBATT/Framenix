import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { analyzeVideo } from '@/lib/engines/analysis';

// Phase 1 keeps this bounded so one click doesn't fan out into dozens of
// sequential Gemini calls; the studio UI lets the user analyze in batches.
const MAX_PER_CALL = 5;

/**
 * STEP 3 of the Phase 1 workflow (section 6): runs the Video Analysis
 * Engine over every reference that doesn't have an analysis yet.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { references: { include: { analysis: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const pending = project.references
    .filter((ref) => !ref.analysis && ref.url)
    .slice(0, MAX_PER_CALL);

  const results = await Promise.allSettled(
    pending.map(async (ref) => {
      const analysis = await analyzeVideo(ref.url as string);
      return prisma.analysisResult.create({
        data: {
          referenceId: ref.id,
          status: 'COMPLETE',
          structure: analysis.structure as object,
          pacing: analysis.pacing as object,
          visual: analysis.visual as object,
          audio: analysis.audio as object,
          captions: analysis.captions as object,
          narrative: analysis.narrative as object,
          summary: analysis.summary,
          modelUsed: process.env.GEMINI_VIDEO_MODEL || 'gemini-2.5-flash',
        },
      });
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      await prisma.analysisResult
        .create({
          data: {
            referenceId: pending[i]!.id,
            status: 'FAILED',
            error: String((result as PromiseRejectedResult).reason),
          },
        })
        .catch(() => undefined);
    }
  }

  const remaining = await prisma.reference.count({
    where: { projectId: project.id, analysis: { is: null } },
  });

  if (remaining === 0) {
    await prisma.project.update({ where: { id: project.id }, data: { stage: 'PATTERN_EXTRACTION' } });
  }

  return NextResponse.json({
    analyzed: results.length - failures.length,
    failed: failures.length,
    remaining,
  });
}
