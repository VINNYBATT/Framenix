import { prisma } from '@/lib/db/prisma';

/** The full project graph, as consumed by the studio review UI. */
export function getProjectWithGraph(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      intents: { orderBy: { createdAt: 'desc' } },
      references: { include: { analysis: true } },
      patternSets: { include: { patterns: true }, orderBy: { createdAt: 'desc' } },
      blueprints: {
        include: { scenes: { include: { shots: true }, orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export type ProjectWithGraph = NonNullable<Awaited<ReturnType<typeof getProjectWithGraph>>>;
