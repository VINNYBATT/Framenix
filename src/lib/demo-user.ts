import { prisma } from '@/lib/db/prisma';

const DEMO_USER_EMAIL = 'demo@framenix.app';

/**
 * Phase 1 has no auth system — that's out of scope for validating the
 * research → analysis → patterns → blueprint pipeline (see section 40,
 * "PASS 1 — FOUNDATION"). Every project is attributed to a single seeded
 * demo user until real auth is built. This is the one place that stands
 * in for it, so it's a one-line change to replace later.
 */
export async function getOrCreateDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (existing) return existing;
  return prisma.user.create({ data: { email: DEMO_USER_EMAIL, name: 'FrameNix Demo' } });
}
