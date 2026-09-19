/**
 * Health & Sovereign Body Tracking Utilities
 *
 * Core calculations for:
 * 1. Body progress differences (weight & 11 body measurements, non-judgmental)
 * 2. Body shape calculation based on actual measurements (vs Personal Styling archetype)
 * 3. Water tracker stats (750ml bottles, goal tracking, 7-day cadence)
 * 4. "Wat kan ik vandaag thuis doen?" intelligent home workout generator
 * 5. Weekly body check Sunday reminder logic
 */

import {
  BodyMeasurementEntry,
  ProgressLog,
  WaterTrackerState,
  WaterLogEntry,
  WeeklyBodyCheckReminder,
  PersonalStyleState,
  DailyCheckIn,
  CycleProfile,
} from '../types';
import { calculateCycleStatus } from './cycleUtils';

export type ProgressTimeRange = '4_weeks' | '3_months' | '6_months' | '1_year' | 'all';

export interface ProgressComparisonItem {
  key: string;
  label: string;
  unit: string;
  currentValue?: number;
  previousValue?: number;
  startingValue?: number;
  diffFromPrevious?: number;
  diffFromStart?: number;
  trend: 'stable' | 'increased' | 'decreased' | 'no_data';
}

export const BODY_MEASUREMENT_FIELDS: {
  key: keyof Omit<BodyMeasurementEntry, 'id' | 'date' | 'unit' | 'notes'>;
  labelNl: string;
  labelEn: string;
  hintNl?: string;
  hintEn?: string;
}[] = [
  { key: 'shoulder', labelNl: 'Schouders', labelEn: 'Shoulders', hintNl: 'Over het breedste punt van beide schouders' },
  { key: 'bicepLeft', labelNl: 'Linkerbovenarm', labelEn: 'Left Bicep', hintNl: 'Ontspannen, halverwege schouder en elleboog' },
  { key: 'bicepRight', labelNl: 'Rechterbovenarm', labelEn: 'Right Bicep', hintNl: 'Ontspannen, halverwege schouder en elleboog' },
  { key: 'chest', labelNl: 'Borst', labelEn: 'Chest', hintNl: 'Over het volste deel van de borstkas' },
  { key: 'waist', labelNl: 'Taille', labelEn: 'Waist', hintNl: 'Smalste punt boven de navel' },
  { key: 'abdomen', labelNl: 'Onderbuik', labelEn: 'Abdomen', hintNl: 'Ongeveer 2 cm onder de navel' },
  { key: 'hip', labelNl: 'Heupen', labelEn: 'Hips', hintNl: 'Breedste punt over de billen' },
  { key: 'thighLeft', labelNl: 'Linkerdij', labelEn: 'Left Thigh', hintNl: 'Breedste punt van het bovenbeen' },
  { key: 'thighRight', labelNl: 'Rechterdij', labelEn: 'Right Thigh', hintNl: 'Breedste punt van het bovenbeen' },
  { key: 'calfLeft', labelNl: 'Linkerkuit', labelEn: 'Left Calf', hintNl: 'Breedste punt van de kuit' },
  { key: 'calfRight', labelNl: 'Rechterkuit', labelEn: 'Right Calf', hintNl: 'Breedste punt van de kuit' },
];

/**
 * Filter logs based on chosen time range
 */
export function filterLogsByTimeRange<T extends { date: string }>(logs: T[], range: ProgressTimeRange = 'all'): T[] {
  if (!logs || logs.length === 0) return [];
  if (range === 'all') return [...logs].sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date();
  const daysMap: Record<ProgressTimeRange, number> = {
    '4_weeks': 28,
    '3_months': 90,
    '6_months': 180,
    '1_year': 365,
    'all': 99999,
  };

  const cutoff = new Date(now.getTime() - daysMap[range] * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return logs.filter((log) => log.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
}

export interface ProgressDifferencesResult {
  weightComparison?: ProgressComparisonItem;
  measurementComparisons: ProgressComparisonItem[];
  hasData: boolean;
  totalEntriesCount: number;
  weight: {
    current?: number;
    previous?: number;
    diffPrev?: number;
    start?: number;
    diffStart?: number;
  };
  measurements: Record<
    string,
    {
      current?: number;
      previous?: number;
      diffPrev?: number;
      start?: number;
      diffStart?: number;
    }
  >;
  latestEntry?: BodyMeasurementEntry;
}

/**
 * Calculate factual changes across weight and body measurements
 * Strictly non-judgmental: no labels like "good" or "bad".
 */
export function calculateProgressDifferences(
  measurementsHistory: BodyMeasurementEntry[] = [],
  progressLogs: ProgressLog[] = [],
  range: ProgressTimeRange = 'all'
): ProgressDifferencesResult {
  const filteredWeightLogs = filterLogsByTimeRange(
    progressLogs.filter((p) => p.weightKg !== undefined && p.weightKg !== null),
    range
  );

  const filteredMeasurements = filterLogsByTimeRange(measurementsHistory, range);

  // Weight comparison
  let weightComparison: ProgressComparisonItem | undefined;
  const weightObj: ProgressDifferencesResult['weight'] = {};

  if (filteredWeightLogs.length > 0) {
    const start = filteredWeightLogs[0].weightKg as number;
    const latest = filteredWeightLogs[filteredWeightLogs.length - 1].weightKg as number;
    const prev =
      filteredWeightLogs.length > 1
        ? (filteredWeightLogs[filteredWeightLogs.length - 2].weightKg as number)
        : undefined;

    const diffFromStart = Number((latest - start).toFixed(1));
    const diffFromPrevious = prev !== undefined ? Number((latest - prev).toFixed(1)) : undefined;

    weightObj.current = latest;
    weightObj.previous = prev;
    weightObj.start = start;
    weightObj.diffPrev = diffFromPrevious;
    weightObj.diffStart = diffFromStart;

    weightComparison = {
      key: 'weight',
      label: 'Gewicht',
      unit: 'kg',
      currentValue: latest,
      previousValue: prev,
      startingValue: start,
      diffFromPrevious,
      diffFromStart,
      trend:
        diffFromPrevious === undefined || Math.abs(diffFromPrevious) < 0.2
          ? 'stable'
          : diffFromPrevious > 0
          ? 'increased'
          : 'decreased',
    };
  }

  const measurementComparisons: ProgressComparisonItem[] = [];
  const measurementsMap: ProgressDifferencesResult['measurements'] = {};

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    const withField = filteredMeasurements.filter(
      (m) => m[field.key] !== undefined && m[field.key] !== null
    );
    if (withField.length === 0) {
      measurementsMap[field.key] = {};
      return;
    }

    const startVal = withField[0][field.key] as number;
    const latestVal = withField[withField.length - 1][field.key] as number;
    const prevVal =
      withField.length > 1
        ? (withField[withField.length - 2][field.key] as number)
        : undefined;

    const diffStart = Number((latestVal - startVal).toFixed(1));
    const diffPrev = prevVal !== undefined ? Number((latestVal - prevVal).toFixed(1)) : undefined;

    measurementsMap[field.key] = {
      current: latestVal,
      previous: prevVal,
      start: startVal,
      diffPrev,
      diffStart,
    };

    measurementComparisons.push({
      key: field.key,
      label: field.labelNl,
      unit: 'cm',
      currentValue: latestVal,
      previousValue: prevVal,
      startingValue: startVal,
      diffFromPrevious: diffPrev,
      diffFromStart: diffStart,
      trend:
        diffPrev === undefined || Math.abs(diffPrev) < 0.2
          ? 'stable'
          : diffPrev > 0
          ? 'increased'
          : 'decreased',
    });
  });

  const totalEntriesCount = filteredMeasurements.length + filteredWeightLogs.length;
  const latestEntry =
    filteredMeasurements.length > 0
      ? filteredMeasurements[filteredMeasurements.length - 1]
      : undefined;

  return {
    weightComparison,
    measurementComparisons,
    hasData: totalEntriesCount > 0,
    totalEntriesCount,
    weight: weightObj,
    measurements: measurementsMap,
    latestEntry,
  };
}

/**
 * Estimated Body Shape Calculation
 * Based on actual recorded measurements (Shoulders, Chest, Waist, Abdomen, Hips).
 * Non-medical, calm, factual categorization.
 */
export interface BodyShapeResult {
  category:
    | 'Zandloper'
    | 'Peer / Driehoek'
    | 'Omgekeerde Driehoek'
    | 'Rechthoek / Atletisch'
    | 'Appel / Ovaal'
    | 'Onvoldoende metingen';
  categoryEn: string;
  shapeCode: 'hourglass' | 'pear' | 'inverted_triangle' | 'rectangle' | 'apple' | 'unknown';
  estimatedShapeLabel: string;
  description: string;
  disclaimer: string;
  isReliable: boolean;
  rationaleNl: string;
  confidence: 'high' | 'moderate' | 'preliminary' | 'none';
  ratios: {
    waistToHip?: number;
    waistToChest?: number;
    chestToHip?: number;
    shoulderToHip?: number;
  };
  keyMeasurements: {
    shoulder?: number;
    chest?: number;
    waist?: number;
    abdomen?: number;
    hip?: number;
  };
}

export function calculateEstimatedBodyShape(
  latestMeasurement?: BodyMeasurementEntry,
  progressLogs?: ProgressLog[]
): BodyShapeResult {
  const shoulder = latestMeasurement?.shoulder;
  const chest = latestMeasurement?.chest || progressLogs?.find((l) => l.measurements?.chestCm)?.measurements?.chestCm;
  const waist = latestMeasurement?.waist || progressLogs?.find((l) => l.measurements?.waistCm)?.measurements?.waistCm;
  const abdomen = latestMeasurement?.abdomen;
  const hip = latestMeasurement?.hip || progressLogs?.find((l) => l.measurements?.hipsCm)?.measurements?.hipsCm;

  const keyMeasurements = { shoulder, chest, waist, abdomen, hip };
  const standardDisclaimer =
    'Dit is een wiskundige indicatie op basis van de door jou ingevoerde omtrekmaten. Het is een rustig referentiepunt voor pasvorm en styling, geen medische evaluatie.';

  // If waist and hip are missing, we cannot calculate
  if (!waist || !hip) {
    return {
      category: 'Onvoldoende metingen',
      categoryEn: 'Insufficient measurements',
      shapeCode: 'unknown',
      estimatedShapeLabel: 'Onvoldoende meetgegevens',
      description: 'Voer minimaal je taille- en heupomtrek in om een betrouwbare lichaamsvormindicatie te berekenen.',
      disclaimer: standardDisclaimer,
      isReliable: false,
      rationaleNl: 'Voeg minimaal taille en heupen toe om een berekende lichaamsvormindicatie te genereren.',
      confidence: 'none',
      ratios: {},
      keyMeasurements,
    };
  }

  const waistToHip = Number((waist / hip).toFixed(2));
  const topMeasure = chest || shoulder;
  const waistToChest = topMeasure ? Number((waist / topMeasure).toFixed(2)) : undefined;
  const chestToHip = topMeasure ? Number((topMeasure / hip).toFixed(2)) : undefined;
  const shoulderToHip = shoulder && hip ? Number((shoulder / hip).toFixed(2)) : undefined;

  const ratios = { waistToHip, waistToChest, chestToHip, shoulderToHip };

  // Rule 1: Apple / Oval
  if ((abdomen && abdomen >= hip * 0.95) || waistToHip >= 0.88) {
    return {
      category: 'Appel / Ovaal',
      categoryEn: 'Apple / Oval',
      shapeCode: 'apple',
      estimatedShapeLabel: 'Appel / Ovaal',
      description: 'Zachte, rondere verhoudingen rondom de taille en romp, met vaak slankere armen en benen.',
      disclaimer: standardDisclaimer,
      isReliable: true,
      rationaleNl: `Taille en buikomtrek liggen relatief dicht bij de heupomtrek (taille/heup verhouding ca. ${waistToHip}).`,
      confidence: topMeasure ? 'high' : 'moderate',
      ratios,
      keyMeasurements,
    };
  }

  // Rule 2: Inverted triangle
  if ((shoulderToHip && shoulderToHip >= 1.06) || (chestToHip && chestToHip >= 1.06)) {
    return {
      category: 'Omgekeerde Driehoek',
      categoryEn: 'Inverted Triangle',
      shapeCode: 'inverted_triangle',
      estimatedShapeLabel: 'Omgekeerde Driehoek',
      description: 'Bovenlichaam en schouders zijn breder dan de heupen, met een atletisch en krachtig silhouet.',
      disclaimer: standardDisclaimer,
      isReliable: true,
      rationaleNl: 'Bovenlichaam (schouders/borst) is merkbaar breder gemeten dan de heupen.',
      confidence: shoulder ? 'high' : 'moderate',
      ratios,
      keyMeasurements,
    };
  }

  // Rule 3: Pear / Triangle
  if (waistToHip <= 0.82 && ((chestToHip && chestToHip <= 0.92) || (shoulderToHip && shoulderToHip <= 0.95))) {
    return {
      category: 'Peer / Driehoek',
      categoryEn: 'Pear / Triangle',
      shapeCode: 'pear',
      estimatedShapeLabel: 'Peer / Driehoek',
      description: 'Heupen en dijen zijn breder dan de borst en schouders, met een fraai gedefinieerde smallere taille.',
      disclaimer: standardDisclaimer,
      isReliable: true,
      rationaleNl: `Heupomtrek is substantieel breder dan bovenlichaam (taille/heup verhouding ca. ${waistToHip}).`,
      confidence: 'high',
      ratios,
      keyMeasurements,
    };
  }

  // Rule 4: Hourglass
  if (waistToHip <= 0.78 && topMeasure && Math.abs(topMeasure - hip) / hip <= 0.08) {
    return {
      category: 'Zandloper',
      categoryEn: 'Hourglass',
      shapeCode: 'hourglass',
      estimatedShapeLabel: 'Zandloper',
      description: 'Harmonisch evenwicht tussen borst/schouders en heupen, vergezeld van een duidelijk gedefinieerde taille.',
      disclaimer: standardDisclaimer,
      isReliable: true,
      rationaleNl: `Gebalanceerde borst/heup verhouding met een uitgesproken gedefinieerde taille (taille/heup verhouding ${waistToHip}).`,
      confidence: 'high',
      ratios,
      keyMeasurements,
    };
  }

  // Rule 5: Rectangle / Athletic
  return {
    category: 'Rechthoek / Atletisch',
    categoryEn: 'Rectangle / Athletic',
    shapeCode: 'rectangle',
    estimatedShapeLabel: 'Rechthoek / Atletisch',
    description: 'Evenwichtige, rechte lijnen tussen schouders, taille en heupen met een natuurlijke sportieve houding.',
    disclaimer: standardDisclaimer,
    isReliable: true,
    rationaleNl: `Schouders, taille en heupen liggen proportioneel dicht bij elkaar (taille/heup verhouding ca. ${waistToHip}).`,
    confidence: 'moderate',
    ratios,
    keyMeasurements,
  };
}

/**
 * Compare Calculated Body Shape with Personal Style State
 */
export function compareWithPersonalStyle(
  calculated: BodyShapeResult,
  personalStyle?: PersonalStyleState
): {
  isAligned: boolean;
  userExplicitShape?: string;
  calculatedShape: string;
  guidanceNl: string;
  hasDivergence: boolean;
} {
  const userShape = personalStyle?.bodyShape || personalStyle?.calculatedBodyShape;
  const calculatedName = calculated.category;

  if (!userShape || calculated.shapeCode === 'unknown') {
    return {
      isAligned: true,
      userExplicitShape: userShape,
      calculatedShape: calculatedName,
      guidanceNl: 'Berekend profiel kan dienen als rustige suggestie bij silhouetkeuzes in je stijlpaspoort.',
      hasDivergence: false,
    };
  }

  const normalizedUser = userShape.toLowerCase();
  const normalizedCalc = calculatedName.toLowerCase();

  const isAligned =
    normalizedUser.includes(normalizedCalc.slice(0, 4)) ||
    normalizedCalc.includes(normalizedUser.slice(0, 4));

  let guidanceNl = 'Je gemeten omtrekmaten bevestigen je gekozen stijlsilhouet.';
  if (!isAligned) {
    guidanceNl = `Je opgeslagen stijlvoorkeur vermeldt '${userShape}', terwijl recente metingen neigen naar '${calculatedName}'. Beide kunnen naast elkaar bestaan: je eigen stijlgevoel en hoe je je wilt kleden zijn altijd leidend.`;
  }

  return {
    isAligned,
    userExplicitShape: userShape,
    calculatedShape: calculatedName,
    guidanceNl,
    hasDivergence: !isAligned,
  };
}

/**
 * Water Tracker Calculations (750ml bottle system)
 */
export const BOTTLE_VOLUME_ML = 750;

export function calculateWaterStats(
  waterTracker?: WaterTrackerState,
  todayStr: string = new Date().toISOString().split('T')[0]
): {
  todayBottles: number;
  todayVolumeL: string;
  targetBottles: number;
  targetVolumeL: string;
  percentOfTarget: number;
  weeklyAverageL: string;
  weeklyAverageBottles: number;
  recentDays: { date: string; bottles: number; volumeL: string }[];
} {
  const defaultTarget = waterTracker?.defaultTargetBottles || 4; // 3.0 L
  const history = waterTracker?.history || [];

  const todayLog = history.find((h) => h.date === todayStr) || {
    date: todayStr,
    bottles: 0,
    volumeMl: 0,
    targetBottles: defaultTarget,
  };

  const targetBottles = todayLog.targetBottles || defaultTarget;

  // Build 7-day history
  const recentDays: { date: string; bottles: number; volumeL: string }[] = [];
  const now = new Date();
  let totalVolumeRecent = 0;
  let daysCounted = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const item = history.find((h) => h.date === dStr);
    const bottles = item ? item.bottles : dStr === todayStr ? todayLog.bottles : 0;
    const volL = ((bottles * BOTTLE_VOLUME_ML) / 1000).toFixed(2);
    recentDays.push({ date: dStr, bottles, volumeL: volL });
    totalVolumeRecent += bottles * BOTTLE_VOLUME_ML;
    daysCounted++;
  }

  const avgMl = daysCounted > 0 ? totalVolumeRecent / daysCounted : 0;
  const weeklyAverageL = (avgMl / 1000).toFixed(1);
  const weeklyAverageBottles = Number((avgMl / BOTTLE_VOLUME_ML).toFixed(1));
  const percentOfTarget =
    targetBottles > 0 ? Math.min(100, Math.round((todayLog.bottles / targetBottles) * 100)) : 0;

  return {
    todayBottles: todayLog.bottles,
    todayVolumeL: ((todayLog.bottles * BOTTLE_VOLUME_ML) / 1000).toFixed(2),
    targetBottles,
    targetVolumeL: ((targetBottles * BOTTLE_VOLUME_ML) / 1000).toFixed(1),
    percentOfTarget,
    weeklyAverageL,
    weeklyAverageBottles,
    recentDays,
  };
}

export function getTodayWaterLog(
  waterTracker?: WaterTrackerState,
  todayStr: string = new Date().toISOString().split('T')[0]
): WaterLogEntry {
  const history = waterTracker?.history || [];
  return (
    history.find((h) => h.date === todayStr) || {
      date: todayStr,
      bottles: 0,
      volumeMl: 0,
      targetBottles: waterTracker?.defaultTargetBottles || 4,
    }
  );
}

/**
 * Sunday Measurement Reminder Helpers
 */
export function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function isSundayMeasurementReminderDue(
  reminder?: WeeklyBodyCheckReminder,
  now: Date = new Date()
): {
  isDue: boolean;
  reason?: 'sunday_active' | 'snoozed' | 'skipped' | 'completed' | 'disabled' | 'not_sunday';
  snoozedRemainingMins?: number;
} {
  if (!reminder || reminder.enabled === false) {
    return { isDue: false, reason: 'disabled' };
  }

  const isSunday = now.getDay() === 0;
  const currentWeek = getISOWeekString(now);

  if (reminder.lastSkippedWeek === currentWeek) {
    return { isDue: false, reason: 'skipped' };
  }

  if (reminder.lastCompletedDate) {
    const compDate = new Date(reminder.lastCompletedDate);
    const compWeek = getISOWeekString(compDate);
    if (compWeek === currentWeek) {
      return { isDue: false, reason: 'completed' };
    }
  }

  if (reminder.snoozedUntil) {
    const snoozeTime = new Date(reminder.snoozedUntil).getTime();
    if (now.getTime() < snoozeTime) {
      const remainingMins = Math.ceil((snoozeTime - now.getTime()) / (1000 * 60));
      return { isDue: false, reason: 'snoozed', snoozedRemainingMins: remainingMins };
    }
  }

  if (isSunday || (reminder.snoozedUntil && now.getTime() >= new Date(reminder.snoozedUntil).getTime())) {
    return { isDue: true, reason: 'sunday_active' };
  }

  return { isDue: false, reason: 'not_sunday' };
}

/**
 * Exercise Definition for Home Workouts
 */
export type WorkoutDuration = 5 | 10 | 15 | 20 | 30;

export interface EquipmentOption {
  id: string;
  name: string;
  nameNl: string;
  iconName: string;
}

export const AVAILABLE_HOME_EQUIPMENT: EquipmentOption[] = [
  { id: 'pilates_ring', name: 'Pilates ring', nameNl: 'Pilates ring', iconName: 'Circle' },
  { id: 'resistance_bands', name: 'Resistance bands', nameNl: 'Weerstandsbanden', iconName: 'Activity' },
  { id: 'light_dumbbells', name: 'Dumbbells (1-3 kg)', nameNl: 'Gewichten 1–3 kg', iconName: 'Dumbbell' },
  { id: 'bodyweight', name: 'Bodyweight / Mat', nameNl: 'Lichaamsgewicht / Mat', iconName: 'User' },
];

export interface SuggestedExercise {
  id: string;
  name: string;
  equipment: 'Pilates ring' | 'Resistance bands' | 'Dumbbells (1-3 kg)' | 'Bodyweight / Mat';
  targetMuscle: string;
  description: string;
  setsRepsOrDuration: string;
}

export interface HomeWorkoutSuggestion {
  id: string;
  title: string;
  durationMinutes: number;
  intensity: 'gentle' | 'moderate' | 'energizing' | 'restorative';
  contextualNote: string;
  exercises: SuggestedExercise[];
  equipmentNeeded: string[];
  isRestRecommended?: boolean;
}

export function generateHomeWorkoutSuggestion(options: {
  durationMinutes: WorkoutDuration;
  selectedEquipment: string[];
  energyCheckIn?: DailyCheckIn;
  cycleProfile?: CycleProfile;
}): HomeWorkoutSuggestion {
  const { durationMinutes, selectedEquipment, energyCheckIn, cycleProfile } = options;

  const energyStatus = energyCheckIn?.energy || 'normal';
  const feeling = energyCheckIn?.feeling;
  const mood = energyCheckIn?.mood;

  // Case 1: Sick / Not okay -> PRIORITIZE REST! Do not push workout.
  if (
    feeling === 'sick' ||
    energyStatus === 'very_low' ||
    energyCheckIn?.notes?.toLowerCase().includes('ziek') ||
    energyCheckIn?.notes?.toLowerCase().includes('sick')
  ) {
    return {
      id: `hw-rest-${Date.now()}`,
      title: 'Rust & Herstel (Geen Workout)',
      durationMinutes: 5,
      intensity: 'restorative',
      isRestRecommended: true,
      contextualNote:
        'Je check-in gaf aan dat je je niet fit voelt. Je lichaam herstelt door slaap en rust; forceer geen workout. Als je wilt, kun je 5 minuten rustig ademen in bed of op de bank.',
      equipmentNeeded: ['Geen (Alleen rust)'],
      exercises: [
        {
          id: 'ex-rest-1',
          name: 'Zachte buikademhaling (4-6 ritme)',
          equipment: 'Bodyweight / Mat',
          targetMuscle: 'Zenuwstelsel',
          description: 'Lig comfortabel op je rug of zij. Adem rustig in door je neus, langzaam uit. Geen druk.',
          setsRepsOrDuration: '3 minuten',
        },
        {
          id: 'ex-rest-2',
          name: 'Ontspannend glas warm water of thee',
          equipment: 'Bodyweight / Mat',
          targetMuscle: 'Hydratatie',
          description: 'Geef je lichaam vloeistof en warmte voor herstel.',
          setsRepsOrDuration: '2 minuten',
        },
      ],
    };
  }

  // Case 2: Mentally heavy or Lower -> Low-pressure grounding floor exercises
  if (
    feeling === 'mentally_heavy' ||
    feeling === 'lower' ||
    energyStatus === 'low' ||
    mood === 'reflective' ||
    mood === 'sensitive' ||
    mood === 'overstimulated'
  ) {
    return {
      id: `hw-grounding-${Date.now()}`,
      title: `Lage Druk & Gronding (${durationMinutes} min)`,
      durationMinutes,
      intensity: 'gentle',
      contextualNote:
        'Voor mentale ruimte en een zacht zenuwstelsel. Geen prestatiedruk, puur vloeiende beweging en ademhaling.',
      equipmentNeeded: [
        'Bodyweight / Mat',
        ...(selectedEquipment.includes('Resistance bands') ? ['Resistance bands'] : []),
      ],
      exercises: [
        {
          id: 'ex-g-1',
          name: 'Bekkenkantelingen & Diafragmatische Adem',
          equipment: 'Bodyweight / Mat',
          targetMuscle: 'Onderrug & Bekkenbodem',
          description: 'Lig op de rug met gebogen knieën. Masseer zacht de onderrug tegen de mat.',
          setsRepsOrDuration: '2 minuten rustig',
        },
        {
          id: 'ex-g-2',
          name: 'Kat-Koe Wervelkolom Mobilisatie',
          equipment: 'Bodyweight / Mat',
          targetMuscle: 'Wervelkolom & Schouders',
          description: 'Beweeg op handen en knieën synchroon met je ademhaling.',
          setsRepsOrDuration: '8 zachte herhalingen',
        },
        {
          id: 'ex-g-3',
          name: 'Child’s Pose met zachte Flankstrekking',
          equipment: 'Bodyweight / Mat',
          targetMuscle: 'Heupen, Lats & Ademhaling',
          description: 'Laat je zitbotten naar je hielen zakken en adem diep naar je rug.',
          setsRepsOrDuration: '2 minuten ontspannen',
        },
      ],
    };
  }

  // Case 3: Good / Normal Energy -> Targeted Pilates & Light Strength
  const pool: SuggestedExercise[] = [];

  // Bodyweight base
  pool.push(
    {
      id: 'ex-bw-1',
      name: 'Dead Bug Core Stabiliteit',
      equipment: 'Bodyweight / Mat',
      targetMuscle: 'Diepe dwarse buikspier',
      description: 'Rug op de mat, knieën in 90 graden. Wissel arm en tegenovergesteld been zonder holle rug.',
      setsRepsOrDuration: '3 sets × 10 herhalingen per kant',
    },
    {
      id: 'ex-bw-2',
      name: 'Glute Bridge met Bekkenstabilisatie',
      equipment: 'Bodyweight / Mat',
      targetMuscle: 'Glutes & Hamstrings',
      description: 'Duw vanuit de hielen omhoog, houd bovenin 2 seconden vast zonder overstrekken van de onderrug.',
      setsRepsOrDuration: '3 sets × 12 herhalingen',
    },
    {
      id: 'ex-bw-3',
      name: 'Zijwaartse Clamshell & Glute Medius Lift',
      equipment: 'Bodyweight / Mat',
      targetMuscle: 'Heupstabilisatoren',
      description: 'Lig op je zij, bekken stabiel naar voren gekanteld. Open en sluit rustig de bovenste knie.',
      setsRepsOrDuration: '2 sets × 15 herhalingen per kant',
    }
  );

  if (selectedEquipment.includes('Pilates ring')) {
    pool.push(
      {
        id: 'ex-ring-1',
        name: 'Pilates Ring Dijbeenknijpen (Inner Thigh Bridge)',
        equipment: 'Pilates ring',
        targetMuscle: 'Adductoren & Bekkenbodem',
        description: 'Plaats de ring tussen de binnenkant van je knieën tijdens de glute bridge en knijp gedoseerd samen.',
        setsRepsOrDuration: '3 sets × 12 herhalingen',
      },
      {
        id: 'ex-ring-2',
        name: 'Pilates Ring Borst & Houdingsdruk',
        equipment: 'Pilates ring',
        targetMuscle: 'Schouderbladen & Borstspieren',
        description: 'Houd de ring voor je borst met zachte ellebogen. Knijp vanuit de borstkas en schouderbladen.',
        setsRepsOrDuration: '3 sets × 15 pulsen',
      }
    );
  }

  if (selectedEquipment.includes('Resistance bands')) {
    pool.push(
      {
        id: 'ex-band-1',
        name: 'Banded Side Steps (Monster Walks)',
        equipment: 'Resistance bands',
        targetMuscle: 'Glute Medius & Heupkracht',
        description: 'Plaats de band om de bovenbenen boven de knieën. Stap zijwaarts in een lichte squat.',
        setsRepsOrDuration: '3 sets × 12 stappen heen en terug',
      },
      {
        id: 'ex-band-2',
        name: 'Banded Row voor Open Houding',
        equipment: 'Resistance bands',
        targetMuscle: 'Rhomboids & Achterste Schouder',
        description: 'Trek de band naar je ribbenkast, houd je schouders laag en ontspannen weg van je oren.',
        setsRepsOrDuration: '3 sets × 12 herhalingen',
      }
    );
  }

  if (selectedEquipment.includes('Dumbbells (1-3 kg)')) {
    pool.push(
      {
        id: 'ex-db-1',
        name: 'Light Overhead Press & Bicep Curl Flow',
        equipment: 'Dumbbells (1-3 kg)',
        targetMuscle: 'Schouders & Armen',
        description: 'Vloeiende combinatie met lichte gewichten (1-2 kg) voor spiertonus zonder zware belasting.',
        setsRepsOrDuration: '3 sets × 10 herhalingen',
      },
      {
        id: 'ex-db-2',
        name: 'Standing Bent-Over Lateral Flyes',
        equipment: 'Dumbbells (1-3 kg)',
        targetMuscle: 'Bovenrug & Houdingscorrectie',
        description: 'Licht voorovergebogen vanuit de heupen. Breng de armen zijwaarts omhoog met zachte ellebogen.',
        setsRepsOrDuration: '3 sets × 12 herhalingen',
      }
    );
  }

  // Pick number of exercises according to duration
  const exerciseCount = durationMinutes <= 10 ? 2 : durationMinutes <= 20 ? 3 : 4;
  const chosenExercises = pool.slice(0, exerciseCount);

  // Cycle context observation
  let cycleObservation = 'Afgestemd op een natuurlijk evenwicht van kracht en mobiliteit.';
  if (cycleProfile?.trackingEnabled) {
    const status = calculateCycleStatus(cycleProfile);
    if (status.activePhase === 'menstrual') {
      cycleObservation = 'Menstruele fase: focus op ontspannen bekkenbodem en zachte spiertonus.';
    } else if (status.activePhase === 'follicular') {
      cycleObservation = 'Folliculaire fase: stijgende natuurlijke belastbaarheid en frisse focus.';
    } else if (status.activePhase === 'ovulatory') {
      cycleObservation = 'Ovulatoire fase: natuurlijke piekenergie, aangename spierprikkel.';
    } else if (status.activePhase === 'luteal') {
      cycleObservation = 'Luteale fase: grondende, stabiele beweging zonder overprikkeling.';
    }
  }

  return {
    id: `hw-flow-${Date.now()}`,
    title: `Thuis Flow & Houding (${durationMinutes} min)`,
    durationMinutes,
    intensity: 'moderate',
    contextualNote: cycleObservation,
    exercises: chosenExercises,
    equipmentNeeded: Array.from(new Set(chosenExercises.map((e) => e.equipment))),
  };
}
