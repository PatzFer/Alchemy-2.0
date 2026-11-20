import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOfferingInput } from './offeringValidation';

const valid = { title: 'Lenormand reading', price: 45, description: 'Persoonlijke reading', deliverables: 'Voorbereiding\nReading' };

test('offering validation accepts a complete valid service', () => {
  assert.equal(validateOfferingInput(valid), null);
});

test('offering validation requires a non-empty title and limits its length', () => {
  assert.equal(validateOfferingInput({ ...valid, title: '   ' }), 'title_required');
  assert.equal(validateOfferingInput({ ...valid, title: 'x'.repeat(121) }), 'title_too_long');
});

test('offering validation rejects invalid prices and overly long descriptions', () => {
  assert.equal(validateOfferingInput({ ...valid, price: Number.POSITIVE_INFINITY }), 'price_invalid');
  assert.equal(validateOfferingInput({ ...valid, price: -1 }), 'price_invalid');
  assert.equal(validateOfferingInput({ ...valid, description: 'x'.repeat(3001) }), 'description_too_long');
});

test('offering validation bounds deliverable count and individual line length', () => {
  assert.equal(validateOfferingInput({ ...valid, deliverables: Array(31).fill('item').join('\n') }), 'too_many_deliverables');
  assert.equal(validateOfferingInput({ ...valid, deliverables: 'x'.repeat(161) }), 'deliverable_too_long');
});
