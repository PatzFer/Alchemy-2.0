import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRenphoProgressLogs, parseRenphoCsv } from './renphoCsv';

test('Renpho CSV import maps metric weight and body composition by local date', () => {
  const logs = parseRenphoCsv([
    'Date,Weight(kg),Body Fat(%),Skeletal Muscle(%),Body Water(%)',
    '2026-11-18 08:15,91.2,43.5,27.1,40.2',
    '2026-11-19 08:20,90.8,43.2,27.3,40.5',
  ].join('\n'));

  assert.equal(logs.length, 2);
  assert.equal(logs[0].date, '2026-11-18');
  assert.equal(logs[0].weightKg, 91.2);
  assert.equal(logs[0].composition?.bodyFatPercentage, 43.5);
  assert.equal(logs[0].composition?.muscleMassPercentage, 27.1);
  assert.equal(logs[0].composition?.hydrationPercentage, 40.2);
});

test('Renpho CSV import converts pounds to kilograms and handles quoted CSV cells', () => {
  const logs = parseRenphoCsv([
    'Date,Weight(lb),Body Fat(%)',
    '"2026-11-20 07:30",200,35.5',
  ].join('\n'));

  assert.equal(logs[0].weightKg, 90.72);
  assert.equal(logs[0].composition?.bodyFatPercentage, 35.5);
});

test('Renpho CSV import merges duplicate dates and skips invalid rows', () => {
  const logs = parseRenphoCsv([
    'Date,Weight(kg),Body Fat(%)',
    '2026-11-20,90,35',
    '2026-11-20,89.8,34.8',
    'not-a-date,91,34',
    '2026-11-21,,',
  ].join('\n'));

  assert.equal(logs.length, 1);
  assert.equal(logs[0].weightKg, 89.8);
  assert.equal(logs[0].composition?.bodyFatPercentage, 34.8);
});

test('Renpho CSV import rejects unrelated or empty exports with a clear error', () => {
  assert.throws(() => parseRenphoCsv(''), /leeg/i);
  assert.throws(() => parseRenphoCsv('Name,Value\nWeight,90'), /datum en gewicht/i);
});

test('Renpho CSV import rejects unclosed quoted fields', () => {
  assert.throws(
    () => parseRenphoCsv('Date,Weight(kg)\n"2026-11-20,90'),
    /niet-afgesloten/i,
  );
});


test('Renpho CSV import supports European semicolon separators and decimal commas', () => {
  const logs = parseRenphoCsv([
    'Date;Weight(kg);Body Fat(%)',
    '2026-11-20 08:00;90,4;35,2',
  ].join('\n'));
  assert.equal(logs[0].weightKg, 90.4);
  assert.equal(logs[0].composition?.bodyFatPercentage, 35.2);
});


test('Renpho merge updates scale fields while preserving manual notes and measurements', () => {
  const existing = [{
    id: 'manual-1',
    date: '2026-11-20',
    weightKg: 91,
    measurements: { waistCm: 90, hipsCm: 120 },
    composition: { bodyFatPercentage: 44 },
    feelingNotes: 'Voel me energiek',
    recordedFact: 'Handmatige meting',
    aiInterpretation: 'Bestaande interpretatie',
  }];
  const imported = parseRenphoCsv([
    'Date,Weight(kg),Body Fat(%),Body Water(%)',
    '2026-11-20,90.5,43.5,41',
  ].join('\n'));
  const merged = mergeRenphoProgressLogs(existing, imported);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'manual-1');
  assert.equal(merged[0].weightKg, 90.5);
  assert.equal(merged[0].measurements?.waistCm, 90);
  assert.equal(merged[0].feelingNotes, 'Voel me energiek');
  assert.equal(merged[0].recordedFact, 'Handmatige meting');
  assert.equal(merged[0].aiInterpretation, 'Bestaande interpretatie');
  assert.equal(merged[0].composition?.bodyFatPercentage, 43.5);
  assert.equal(merged[0].composition?.hydrationPercentage, 41);
});
