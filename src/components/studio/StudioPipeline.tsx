'use client';

import { useState } from 'react';
import type { ClientProject, ProjectStage } from './types';

const STAGE_LABELS: Record<ProjectStage, string> = {
  INPUT: 'Understand',
  RESEARCHING: 'Research',
  ANALYZING: 'Analyze',
  PATTERN_EXTRACTION: 'Patterns',
  BLUEPRINT: 'Blueprint',
  REVIEW: 'Review',
  PRODUCTION: 'Production',
  DONE: 'Done',
};
const STAGE_ORDER: ProjectStage[] = [
  'INPUT',
  'RESEARCHING',
  'ANALYZING',
  'PATTERN_EXTRACTION',
  'BLUEPRINT',
  'REVIEW',
  'PRODUCTION',
];

async function postJSON(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { data, status: res.status });
  return data;
}

export function StudioPipeline({ initialProject }: { initialProject: ClientProject }) {
  const [project, setProject] = useState(initialProject);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  async function refresh() {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) setProject(await res.json());
  }

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      const status = (err as { status?: number })?.status;
      setNotice({ kind: status === 501 ? 'info' : 'error', text: message });
    } finally {
      setBusy(null);
    }
  }

  const intent = project.intents[0];
  const patternSet = project.patternSets[0];
  const blueprint = project.blueprints[0];
  const pendingAnalysis = project.references.filter((r) => !r.analysis).length;
  const stageIndex = STAGE_ORDER.indexOf(project.stage);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-1 text-sm text-muted">Project</p>
      <h1 className="mb-8 text-3xl font-normal text-ink">{project.title}</h1>

      <ol className="mb-12 flex flex-wrap gap-2">
        {STAGE_ORDER.map((stage, i) => (
          <li
            key={stage}
            className={`rounded-full border px-3 py-1 text-xs ${
              i <= stageIndex
                ? 'border-white/30 text-ink'
                : 'border-white/10 text-muted/60'
            }`}
          >
            {STAGE_LABELS[stage]}
          </li>
        ))}
      </ol>

      {notice && (
        <div
          className={`mb-8 rounded-lg border p-4 text-sm ${
            notice.kind === 'error' ? 'border-red-400/30 text-red-300' : 'border-white/15 text-muted'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Intent */}
      <Section title="Intent" subtitle="What the Intent Engine understood.">
        {intent ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Goal" value={intent.goal} />
            <Field label="Objective" value={intent.objective} />
            <Field label="Audience" value={intent.audience} />
            <Field label="Platform" value={intent.platform} />
          </dl>
        ) : (
          <p className="text-sm text-muted">No intent yet.</p>
        )}
      </Section>

      {/* Research */}
      <Section
        title="References"
        subtitle="What FrameNix found."
        action={
          project.references.length === 0 ? (
            <ActionButton busy={busy === 'research'} onClick={() => run('research', () => postJSON(`/api/projects/${project.id}/research`))}>
              Find references
            </ActionButton>
          ) : null
        }
      >
        {project.references.length === 0 ? (
          <p className="text-sm text-muted">No references yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {project.references.map((ref) => (
              <li key={ref.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink">{ref.title || ref.url}</p>
                  <p className="truncate text-muted">{ref.channel}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {ref.analysis ? (ref.analysis.status === 'COMPLETE' ? 'Analyzed' : ref.analysis.status) : 'Not analyzed'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {project.references.length > 0 && pendingAnalysis > 0 && (
          <div className="mt-4">
            <ActionButton busy={busy === 'analyze'} onClick={() => run('analyze', () => postJSON(`/api/projects/${project.id}/analyze`))}>
              Analyze {Math.min(pendingAnalysis, 5)} reference{Math.min(pendingAnalysis, 5) === 1 ? '' : 's'}
            </ActionButton>
          </div>
        )}
      </Section>

      {/* Patterns */}
      <Section
        title="Patterns"
        subtitle="What makes these references work."
        action={
          project.references.length > 0 && pendingAnalysis === 0 && !patternSet ? (
            <ActionButton busy={busy === 'patterns'} onClick={() => run('patterns', () => postJSON(`/api/projects/${project.id}/patterns`))}>
              Find patterns
            </ActionButton>
          ) : null
        }
      >
        {!patternSet ? (
          <p className="text-sm text-muted">No patterns yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {patternSet.patterns.map((p) => (
              <li key={p.id} className="rounded-lg border border-white/10 p-3 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">{p.category}</p>
                <p className="text-ink">{p.label}</p>
                <p className="mt-1 text-muted">{p.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Blueprint */}
      <Section
        title="Blueprint"
        subtitle="The production plan."
        action={
          patternSet && patternSet.patterns.length > 0 && !blueprint ? (
            <ActionButton busy={busy === 'blueprint'} onClick={() => run('blueprint', () => postJSON(`/api/projects/${project.id}/blueprint`))}>
              Generate blueprint
            </ActionButton>
          ) : null
        }
      >
        {!blueprint ? (
          <p className="text-sm text-muted">No blueprint yet.</p>
        ) : (
          <div className="flex flex-col gap-6 text-sm">
            <div>
              <p className="mb-1 text-ink">{blueprint.concept}</p>
              <p className="text-muted">{blueprint.objective}</p>
              <p className="mt-2 text-xs text-muted">
                {blueprint.targetFormat} · {blueprint.durationSec ? `${blueprint.durationSec}s` : 'duration TBD'}
              </p>
            </div>
            {blueprint.narrative && (
              <div className="grid grid-cols-3 gap-4 rounded-lg border border-white/10 p-3">
                <Field label="Hook" value={blueprint.narrative.hook ?? null} />
                <Field label="Arc" value={blueprint.narrative.arc ?? null} />
                <Field label="Payoff" value={blueprint.narrative.payoff ?? null} />
              </div>
            )}
            <ol className="flex flex-col gap-3">
              {blueprint.scenes.map((scene) => (
                <li key={scene.id} className="rounded-lg border border-white/10 p-3">
                  <p className="mb-1 text-ink">{scene.title}</p>
                  <p className="mb-2 text-muted">{scene.description}</p>
                  <ul className="flex flex-col gap-1 pl-4 text-muted">
                    {scene.shots.map((shot) => (
                      <li key={shot.id} className="list-disc">
                        {shot.description}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <div>
              <ActionButton busy={busy === 'produce'} onClick={() => run('produce', () => postJSON(`/api/projects/${project.id}/produce`))}>
                Start production
              </ActionButton>
              <p className="mt-2 text-xs text-muted">
                The Production Engine isn&apos;t built yet — this calls the real endpoint and reports
                back honestly rather than faking an output.
              </p>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12 border-t border-white/10 pt-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg text-ink">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-ink">{value || '—'}</dd>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded-full bg-pill px-5 py-2 text-sm font-medium text-pill-ink transition disabled:opacity-40"
    >
      {busy ? 'Working…' : children}
    </button>
  );
}
