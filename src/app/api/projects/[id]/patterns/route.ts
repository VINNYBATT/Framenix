import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { discoverPatterns } from '@/lib/engines/patterns';
import type { VideoAnalysis } from '@/lib/engines/analysis';

/**
 * STEP 4 of the Phase 1 workflow (section 6): synthesizes recurring
 * patterns across every reference that has a completed analysis.
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

  const analyzed = project.references.filter((ref) => ref.analysis?.status === 'COMPLETE');
  if (analyzed.length === 0) {
    return NextResponse.json(
      { error: 'No completed analyses yet. Analyze references before extracting patterns.' },
      { status: 400 },
    );
  }

  let patterns;
  try {
    patterns = await discoverPatterns(
      analyzed.map((ref) => ({
        title: ref.title || ref.url || ref.id,
        url: ref.url || '',
        analysis: {
          summary: ref.analysis!.summary || '',
          structure: ref.analysis!.structure,
          pacing: ref.analysis!.pacing,
          visual: ref.analysis!.visual,
          audio: ref.analysis!.audio,
          captions: ref.analysis!.captions,
          narrative: ref.analysis!.narrative,
        } as unknown as VideoAnalysis,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'The Pattern Discovery Engine could not synthesize patterns.', detail: String(error) },
      { status: 502 },
    );
  }

  const patternSet = await prisma.patternSet.create({
    data: {
      projectId: project.id,
      status: 'COMPLETE',
      patterns: {
        create: patterns.map((p) => ({
          category: p.category,
          label: p.label,
          description: p.description,
          evidence: { refIndexes: p.evidenceRefIndexes } as object,
          strength: p.strength,
        })),
      },
    },
    include: { patterns: true },
  });

  await prisma.project.update({ where: { id: project.id }, data: { stage: 'BLUEPRINT' } });

  return NextResponse.json(patternSet);
}
