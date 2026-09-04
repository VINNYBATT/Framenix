import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { buildBlueprint } from '@/lib/engines/blueprint';
import type { IntentReading } from '@/lib/engines/intent';
import type { DiscoveredPattern } from '@/lib/engines/patterns';

/**
 * STEP 5 of the Phase 1 workflow (section 6): produces the production
 * blueprint from the latest intent and the latest pattern set. Advances
 * the project to REVIEW — STEP 6 is the studio UI rendering this plan.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      intents: { orderBy: { createdAt: 'desc' }, take: 1 },
      patternSets: { include: { patterns: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const intent = project.intents[0];
  const patternSet = project.patternSets[0];
  if (!intent) {
    return NextResponse.json({ error: 'This project has no intent reading yet.' }, { status: 400 });
  }
  if (!patternSet || patternSet.patterns.length === 0) {
    return NextResponse.json(
      { error: 'No patterns yet. Extract patterns before generating a blueprint.' },
      { status: 400 },
    );
  }

  let blueprint;
  try {
    blueprint = await buildBlueprint(
      (intent.raw as unknown as IntentReading) ?? {
        goal: intent.goal || '',
        audience: intent.audience,
        platform: intent.platform,
        objective: intent.objective || '',
        suggestedResearchQueries: [],
        confidence: intent.confidence || 0,
      },
      patternSet.patterns.map(
        (p): DiscoveredPattern => ({
          category: p.category,
          label: p.label,
          description: p.description,
          evidenceRefIndexes: ((p.evidence as { refIndexes?: number[] } | null)?.refIndexes) ?? [],
          strength: p.strength ?? 0,
        }),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'The Blueprint Engine could not produce a plan.', detail: String(error) },
      { status: 502 },
    );
  }

  const previousCount = await prisma.blueprint.count({ where: { projectId: project.id } });

  const saved = await prisma.blueprint.create({
    data: {
      projectId: project.id,
      version: previousCount + 1,
      status: 'DRAFT',
      concept: blueprint.concept,
      objective: blueprint.objective,
      targetFormat: blueprint.targetFormat,
      durationSec: blueprint.durationSec,
      narrative: blueprint.narrative as object,
      voice: blueprint.voice as object,
      music: blueprint.music as object,
      captionsPlan: blueprint.captionsPlan as object,
      visualDirection: blueprint.visualDirection,
      scenes: {
        create: blueprint.scenes.map((scene, sceneIndex) => ({
          order: sceneIndex,
          title: scene.title,
          description: scene.description,
          durationSec: scene.durationSec,
          shots: {
            create: scene.shots.map((shot, shotIndex) => ({
              order: shotIndex,
              description: shot.description,
              cameraNotes: shot.cameraNotes,
              durationSec: shot.durationSec,
              transition: shot.transition,
            })),
          },
        })),
      },
    },
    include: { scenes: { include: { shots: true } } },
  });

  await prisma.project.update({ where: { id: project.id }, data: { stage: 'REVIEW' } });

  return NextResponse.json(saved);
}
