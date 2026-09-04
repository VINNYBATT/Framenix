import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateDemoUser } from '@/lib/demo-user';
import { readIntent } from '@/lib/engines/intent';

/**
 * STEP 1 (user input) + STEP 2 kickoff of the Phase 1 workflow (section 6):
 * takes the creator's raw input, runs the Intent Engine on it, and creates
 * the project already carrying its first structured Intent.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawInput = typeof body?.rawInput === 'string' ? body.rawInput.trim() : '';

  if (!rawInput) {
    return NextResponse.json({ error: 'rawInput is required.' }, { status: 400 });
  }

  const user = await getOrCreateDemoUser();

  let intentReading;
  try {
    intentReading = await readIntent(rawInput);
  } catch (error) {
    return NextResponse.json(
      { error: 'The Intent Engine could not read this input.', detail: String(error) },
      { status: 502 },
    );
  }

  const project = await prisma.project.create({
    data: {
      title: body?.title || intentReading.goal || rawInput.slice(0, 80),
      ownerId: user.id,
      stage: 'RESEARCHING',
      intents: {
        create: {
          rawInput,
          goal: intentReading.goal,
          audience: intentReading.audience,
          platform: intentReading.platform,
          objective: intentReading.objective,
          confidence: intentReading.confidence,
          raw: intentReading as unknown as object,
        },
      },
    },
    include: { intents: true },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function GET() {
  const user = await getOrCreateDemoUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(projects);
}
