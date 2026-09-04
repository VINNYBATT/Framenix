import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { findReferences } from '@/lib/engines/research';

/**
 * STEP 2 of the Phase 1 workflow (section 6): discovers references using
 * the queries the Intent Engine suggested (or queries the user overrides
 * with in the request body).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { intents: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const intentRaw = project.intents[0]?.raw as { suggestedResearchQueries?: string[] } | null;
  const queries: string[] =
    Array.isArray(body?.queries) && body.queries.length > 0
      ? body.queries
      : intentRaw?.suggestedResearchQueries ?? [];

  if (queries.length === 0) {
    return NextResponse.json(
      { error: 'No research queries available. Provide `queries` in the request body.' },
      { status: 400 },
    );
  }

  let results;
  try {
    results = await findReferences({ queries, limitPerQuery: 6 });
  } catch (error) {
    return NextResponse.json(
      { error: 'The Research Engine could not complete this search.', detail: String(error) },
      { status: 502 },
    );
  }

  const references = await prisma.$transaction(
    results.map((ref) =>
      // Scoped to this project: the same video can legitimately be a
      // reference in more than one project, and each needs its own row.
      prisma.reference.upsert({
        where: { id: `${project.id}:${ref.source}:${ref.id}` },
        update: {},
        create: {
          id: `${project.id}:${ref.source}:${ref.id}`,
          projectId: project.id,
          source: 'YOUTUBE_SEARCH',
          url: ref.url,
          title: ref.title,
          channel: ref.channel,
          publishedAt: ref.publishedAt ? new Date(ref.publishedAt) : null,
          durationSec: ref.durationSec,
          thumbnailUrl: ref.thumbnailUrl,
          metadata: ref.raw as object,
        },
      }),
    ),
  );

  await prisma.project.update({ where: { id: project.id }, data: { stage: 'ANALYZING' } });

  return NextResponse.json({ references });
}
