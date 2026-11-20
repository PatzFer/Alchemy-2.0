import type { ProgressLog } from '../types';

function detectDelimiter(input: string): ',' | ';' {
  const firstLine = input.split(/\r?\n/, 1)[0] || '';
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (let i = 0; i < firstLine.length; i += 1) {
    if (firstLine[i] === '"') quoted = !quoted;
    else if (!quoted && firstLine[i] === ',') commas += 1;
    else if (!quoted && firstLine[i] === ';') semicolons += 1;
  }
  return semicolons > commas ? ';' : ',';
}

function parseCsvRows(input: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('Het Renpho CSV-bestand bevat een niet-afgesloten tekstveld.');
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[\s_%-]/g, '').replace(/[()\[\]]/g, '');
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

/** Convert a Renpho CSV export into the safe, app-native progress fields. */
export function parseRenphoCsv(csv: string): ProgressLog[] {
  if (typeof csv !== 'string' || !csv.trim()) {
    throw new Error('Het CSV-bestand is leeg.');
  }

  const normalizedCsv = csv.replace(/^\uFEFF/, '');
  const rows = parseCsvRows(normalizedCsv, detectDelimiter(normalizedCsv));
  if (rows.length < 2) throw new Error('Geen meetgegevens gevonden in het CSV-bestand.');

  const headers = rows[0].map(normalizeHeader);
  const dateColumn = findColumn(headers, ['date', 'datetime', 'measurementtime', 'time']);
  const weightColumn = findColumn(headers, ['weight']);
  const bodyFatColumn = findColumn(headers, ['bodyfat', 'fatpercentage']);
  const muscleColumn = findColumn(headers, ['skeletalmuscle', 'musclepercentage']);
  const waterColumn = findColumn(headers, ['bodywater', 'waterpercentage']);

  if (dateColumn < 0 || weightColumn < 0) {
    throw new Error('Dit lijkt geen herkenbare Renpho-export: datum en gewicht moeten aanwezig zijn.');
  }

  const weightHeader = rows[0][weightColumn].toLowerCase();
  const weightIsPounds = /\b(lb|lbs|pound)\b/.test(weightHeader);
  const byDate = new Map<string, ProgressLog>();

  for (const values of rows.slice(1)) {
    const date = parseDate(values[dateColumn] || '');
    if (!date) continue;
    const rawWeight = parseNumber(values[weightColumn]);
    const weightKg = rawWeight === undefined ? undefined : Number((weightIsPounds ? rawWeight * 0.45359237 : rawWeight).toFixed(2));
    const bodyFatPercentage = parseNumber(values[bodyFatColumn]);
    const muscleMassPercentage = parseNumber(values[muscleColumn]);
    const hydrationPercentage = parseNumber(values[waterColumn]);

    if (weightKg === undefined && bodyFatPercentage === undefined && muscleMassPercentage === undefined && hydrationPercentage === undefined) continue;

    const existing = byDate.get(date);
    byDate.set(date, {
      id: existing?.id || `renpho-${date}`,
      date,
      weightKg: weightKg ?? existing?.weightKg,
      composition: {
        ...(existing?.composition || {}),
        ...(bodyFatPercentage !== undefined ? { bodyFatPercentage } : {}),
        ...(muscleMassPercentage !== undefined ? { muscleMassPercentage } : {}),
        ...(hydrationPercentage !== undefined ? { hydrationPercentage } : {}),
      },
      recordedFact: 'Geïmporteerd uit Renpho CSV',
    });
  }

  const result = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (result.length === 0) throw new Error('Geen geldige Renpho-metingen gevonden. Controleer het datum- en gewichtsformaat.');
  return result;
}


/** Merge imported scale readings without discarding manually entered notes or measurements. */
export function mergeRenphoProgressLogs(
  existingLogs: ProgressLog[],
  importedLogs: ProgressLog[],
): ProgressLog[] {
  const byDate = new Map(existingLogs.map((log) => [log.date, log]));
  for (const incoming of importedLogs) {
    const existing = byDate.get(incoming.date);
    byDate.set(incoming.date, {
      ...existing,
      ...incoming,
      id: existing?.id || incoming.id,
      weightKg: incoming.weightKg ?? existing?.weightKg,
      measurements: existing?.measurements || incoming.measurements,
      composition: {
        ...(existing?.composition || {}),
        ...(incoming.composition || {}),
      },
      recordedFact: existing?.recordedFact || incoming.recordedFact,
      feelingNotes: existing?.feelingNotes,
      aiInterpretation: existing?.aiInterpretation,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
