export type OfferingValidationError =
  | 'title_required'
  | 'title_too_long'
  | 'price_invalid'
  | 'description_too_long'
  | 'too_many_deliverables'
  | 'deliverable_too_long';

export function validateOfferingInput(input: {
  title: string;
  price: number | '';
  description: string;
  deliverables: string;
}): OfferingValidationError | null {
  const title = input.title.trim();
  if (!title) return 'title_required';
  if (title.length > 120) return 'title_too_long';
  if (input.price !== '' && (!Number.isFinite(input.price) || input.price < 0)) return 'price_invalid';
  if (input.description.length > 3000) return 'description_too_long';

  const items = input.deliverables.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (items.length > 30) return 'too_many_deliverables';
  if (items.some((item) => item.length > 160)) return 'deliverable_too_long';
  return null;
}
