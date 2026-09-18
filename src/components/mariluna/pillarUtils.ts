import { ContentPillar, ContentPlan, ContentPost, Idea, Project, Task } from '../../types';

export const DEFAULT_PLATFORMS = [
  'Instagram',
  'Facebook',
  'Website',
  'Newsletter',
  'LinkedIn',
  'Podcast',
  'Other',
];

export const DEFAULT_FORMATS = [
  'Carousel',
  'Reel / Video',
  'Static Post',
  'Story',
  'Article / Essay',
  'Newsletter',
  'Audio / Podcast',
  'Other',
];

export const CONTENT_STATUSES = [
  { id: 'idea', label: 'Idee', badge: 'bg-[#F2ECE1] text-[#7A6E60]' },
  { id: 'draft', label: 'Draft', badge: 'bg-[#EDE4D5] text-[#6B5E4E]' },
  { id: 'planned', label: 'Gepland', badge: 'bg-[#E5DCD0] text-[#554A3E]' },
  { id: 'ready', label: 'Klaar', badge: 'bg-[#DCD0C0] text-[#3D352B]' },
  { id: 'published', label: 'Gepubliceerd', badge: 'bg-[#D5E2D0] text-[#2B4E29]' },
  { id: 'archived', label: 'Gearchiveerd', badge: 'bg-[#EAE5DF] text-[#8C8377]' },
] as const;

export const IDEA_STATUSES = [
  { id: 'new', label: 'Nieuw', color: 'bg-[#F2ECE1] text-[#7A6E60]' },
  { id: 'exploring', label: 'Exploring', color: 'bg-[#EFE8DC] text-[#6B5E4E]' },
  { id: 'developing', label: 'In Uitwerking', color: 'bg-[#E6DCCF] text-[#5A4E40]' },
  { id: 'ready_to_use', label: 'Klaar voor gebruik', color: 'bg-[#D8CEBF] text-[#3C342A]' },
  { id: 'parked', label: 'Geparkeerd', color: 'bg-[#EAE4DC] text-[#8C8276]' },
  { id: 'converted', label: 'Omgezet', color: 'bg-[#D9E4D4] text-[#2E4F2C]' },
] as const;

/**
 * Normalizes pillars from ContentPlan into full ContentPillar objects
 */
export function normalizePillars(rawPillars: (string | ContentPillar)[]): ContentPillar[] {
  if (!rawPillars || rawPillars.length === 0) return [];
  return rawPillars.map((p, idx) => {
    if (typeof p === 'string') {
      return {
        id: `pillar-${idx}-${p.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: p,
        archived: false,
      };
    }
    return {
      ...p,
      archived: !!p.archived,
    };
  });
}

export function getPillarName(p: string | ContentPillar): string {
  if (typeof p === 'string') return p;
  return p.name;
}

export function normalizePlatforms(platforms?: string[]): string[] {
  if (!platforms || platforms.length === 0) {
    return DEFAULT_PLATFORMS;
  }
  return platforms;
}

export function getStatusLabel(status: string): string {
  const found = CONTENT_STATUSES.find((s) => s.id === status);
  if (found) return found.label;
  if (status === 'drafted') return 'Draft';
  return status;
}

export function getIdeaStatusLabel(status: string): string {
  if (status === 'raw' || status === 'new') return 'Nieuw';
  if (status === 'exploring') return 'Exploring';
  if (status === 'developing') return 'In Uitwerking';
  if (status === 'ready' || status === 'ready_to_use') return 'Klaar voor gebruik';
  if (status === 'parked') return 'Geparkeerd';
  if (status === 'converted' || status === 'converted_to_project') return 'Omgezet';
  if (status === 'archived') return 'Gearchiveerd';
  return status;
}
