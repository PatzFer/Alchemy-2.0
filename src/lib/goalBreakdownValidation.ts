export interface GoalBreakdownMilestone {
  title: string;
  durationMins: number;
  suggestedDay: string;
}

/**
 * Validate untrusted model output before it is sent to the client.
 * Returns null for malformed or incomplete responses; never invents milestones.
 */
export function validateGoalBreakdown(value: unknown): GoalBreakdownMilestone[] | null {
  const candidate = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { milestones?: unknown }).milestones)
      ? (value as { milestones: unknown[] }).milestones
      : null;

  if (!candidate || candidate.length < 3 || candidate.length > 5) return null;

  const milestones: GoalBreakdownMilestone[] = [];
  for (const item of candidate) {
    if (!item || typeof item !== 'object') return null;
    const entry = item as Record<string, unknown>;
    if (typeof entry.title !== 'string') return null;
    const title = entry.title.trim();
    if (!title || title.length > 160) return null;

    const durationMins = entry.durationMins;
    if (typeof durationMins !== 'number' || !Number.isFinite(durationMins) || durationMins < 5 || durationMins > 240) return null;

    const suggestedDay = typeof entry.suggestedDay === 'string' ? entry.suggestedDay.trim() : '';
    if (suggestedDay.length > 80) return null;

    milestones.push({
      title,
      durationMins: Math.round(durationMins),
      suggestedDay: suggestedDay || 'Binnenkort',
    });
  }

  return milestones;
}
