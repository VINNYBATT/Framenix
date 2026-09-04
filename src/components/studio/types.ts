// Client-safe mirror of ProjectWithGraph (src/lib/projects.ts) — dates
// arrive as ISO strings once the server payload crosses the RSC boundary.

export interface ClientIntent {
  id: string;
  rawInput: string;
  goal: string | null;
  audience: string | null;
  platform: string | null;
  objective: string | null;
  confidence: number | null;
  raw: { suggestedResearchQueries?: string[] } | null;
}

export interface ClientAnalysis {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
  summary: string | null;
  error: string | null;
}

export interface ClientReference {
  id: string;
  url: string | null;
  title: string | null;
  channel: string | null;
  durationSec: number | null;
  thumbnailUrl: string | null;
  analysis: ClientAnalysis | null;
}

export interface ClientPattern {
  id: string;
  category: string;
  label: string;
  description: string;
  strength: number | null;
}

export interface ClientPatternSet {
  id: string;
  status: string;
  patterns: ClientPattern[];
}

export interface ClientShot {
  id: string;
  order: number;
  description: string | null;
  cameraNotes: string | null;
  durationSec: number | null;
  transition: string | null;
}

export interface ClientScene {
  id: string;
  order: number;
  title: string | null;
  description: string | null;
  durationSec: number | null;
  shots: ClientShot[];
}

export interface ClientBlueprint {
  id: string;
  version: number;
  status: string;
  concept: string | null;
  objective: string | null;
  targetFormat: string | null;
  durationSec: number | null;
  visualDirection: string | null;
  narrative: { hook?: string; arc?: string; payoff?: string } | null;
  scenes: ClientScene[];
}

export type ProjectStage =
  | 'INPUT'
  | 'RESEARCHING'
  | 'ANALYZING'
  | 'PATTERN_EXTRACTION'
  | 'BLUEPRINT'
  | 'REVIEW'
  | 'PRODUCTION'
  | 'DONE';

export interface ClientProject {
  id: string;
  title: string;
  stage: ProjectStage;
  intents: ClientIntent[];
  references: ClientReference[];
  patternSets: ClientPatternSet[];
  blueprints: ClientBlueprint[];
}
