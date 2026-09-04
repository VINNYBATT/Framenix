import { NextResponse } from 'next/server';
import { getProjectWithGraph } from '@/lib/projects';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectWithGraph(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }
  return NextResponse.json(project);
}
