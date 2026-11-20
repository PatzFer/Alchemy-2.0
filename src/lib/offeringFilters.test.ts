import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMarilunaOfferings } from './offeringFilters';
import type { MarilunaOffering } from '../types';

const offerings: MarilunaOffering[] = [
  { id: '1', title: 'Lenormand reading', type: 'service', status: 'active', description: 'Persoonlijke kaartlegging', deliverables: ['Voorbereiding', 'Nabespreking'] },
  { id: '2', title: 'Sacred Crystals', type: 'product', status: 'draft', description: 'Boek over kristallen' },
  { id: '3', title: 'Alchemie workshop', type: 'workshop', status: 'archived', description: 'Groepssessie' },
  { id: '4', title: 'Energetische begeleiding', type: 'service', status: undefined as unknown as 'draft' },
];

test('offering search is case-insensitive and includes descriptions and deliverables', () => {
  assert.deepEqual(filterMarilunaOfferings(offerings, { query: 'LENORMAND' }).map((item) => item.id), ['1']);
  assert.deepEqual(filterMarilunaOfferings(offerings, { query: 'kristallen' }).map((item) => item.id), ['2']);
  assert.deepEqual(filterMarilunaOfferings(offerings, { query: 'nabespreking' }).map((item) => item.id), ['1']);
});

test('offering filters combine type and status without mutating original order', () => {
  assert.deepEqual(filterMarilunaOfferings(offerings, { type: 'service', status: 'active' }).map((item) => item.id), ['1']);
  assert.deepEqual(filterMarilunaOfferings(offerings, { status: 'archived' }).map((item) => item.id), ['3']);
  assert.deepEqual(offerings.map((item) => item.id), ['1', '2', '3', '4']);
});

test('legacy offerings without status remain visible as drafts', () => {
  assert.deepEqual(filterMarilunaOfferings(offerings, { status: 'draft' }).map((item) => item.id), ['2', '4']);
});

test('empty search and all filters preserve the full catalogue', () => {
  assert.deepEqual(filterMarilunaOfferings(offerings, { query: '  ', type: 'all', status: 'all' }), offerings);
});
