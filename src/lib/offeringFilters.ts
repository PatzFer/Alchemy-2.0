import type { MarilunaOffering } from '../types';

export interface OfferingFilters {
  query?: string;
  type?: 'all' | MarilunaOffering['type'];
  status?: 'all' | MarilunaOffering['status'];
}

/** Filter the user's own service catalogue without mutating its stored order or records. */
export function filterMarilunaOfferings(
  offerings: MarilunaOffering[],
  filters: OfferingFilters = {},
): MarilunaOffering[] {
  const query = (filters.query || '').trim().toLocaleLowerCase('nl-BE');
  return offerings.filter((offering) => {
    const matchesQuery = !query ||
      offering.title.toLocaleLowerCase('nl-BE').includes(query) ||
      (offering.description || '').toLocaleLowerCase('nl-BE').includes(query) ||
      (offering.deliverables || []).some((item) => item.toLocaleLowerCase('nl-BE').includes(query));
    const matchesType = !filters.type || filters.type === 'all' || offering.type === filters.type;
    // Older records without a status are treated as drafts, not silently hidden.
    const matchesStatus = !filters.status || filters.status === 'all' ||
      (offering.status || 'draft') === filters.status;
    return matchesQuery && matchesType && matchesStatus;
  });
}
