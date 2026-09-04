import { notFound } from 'next/navigation';
import { getProjectWithGraph } from '@/lib/projects';
import { StudioPipeline } from '@/components/studio/StudioPipeline';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectWithGraph(projectId);
  if (!project) notFound();

  return <StudioPipeline initialProject={JSON.parse(JSON.stringify(project))} />;
}
