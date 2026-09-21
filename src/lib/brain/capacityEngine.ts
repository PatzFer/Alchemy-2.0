import { Task, CalendarEvent, DailyCheckIn } from '../../types';
import { BrainCapacityLevel, BrainCapacityAssessment } from './types';

/**
 * CAPACITY ENGINE
 * 
 * Determines practical daily capacity based on:
 * - Real calendar events and working hours
 * - Daily check-in feeling (Good, Lower, Sick, Mentally heavy)
 * - Open task load
 * 
 * Never makes medical assumptions. Provides practical, unhurried scheduling advice.
 */
export function assessCapacity(
  events: CalendarEvent[],
  checkIn?: DailyCheckIn,
  tasks: Task[] = []
): BrainCapacityAssessment {
  // 1. Calculate busy minutes from scheduled events
  let busyMinutes = 0;
  events.forEach((ev) => {
    if (ev.startTime && ev.endTime) {
      const [sh, sm] = ev.startTime.split(':').map(Number);
      const [eh, em] = ev.endTime.split(':').map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur > 0) busyMinutes += dur;
    }
  });

  // Standard daily waking available window: nominal 8 hours (480 mins)
  const freeMinutes = Math.max(0, 480 - busyMinutes);

  // 2. Map explicit check-in feeling (Takes strict precedence over assumptions)
  const feeling = checkIn?.feeling;

  let level: BrainCapacityLevel = 'normal';
  let reason = 'Normale dagcapaciteit met ruimte voor 2–3 gefocuste taken.';
  let recommendedTaskCount = 3;
  let maxTaskMinutes = 90;

  if (feeling === 'sick') {
    level = 'minimal';
    reason = 'Je voelt je ziek of niet fit. Focus uitsluitend op herstel; stel alle niet-essentiële taken uit.';
    recommendedTaskCount = 0;
    maxTaskMinutes = 15;
  } else if (feeling === 'mentally_heavy') {
    level = 'reduced';
    reason = 'Je ervaart mentale zwaarte. Verlaag de cognitieve belasting en kies alleen lichte, overzichtelijke taken.';
    recommendedTaskCount = 1;
    maxTaskMinutes = 30;
  } else if (feeling === 'lower') {
    level = 'reduced';
    reason = 'Je energie ligt lager dan normaal. Bescherm je rust en kies maximaal 1–2 rustige taken.';
    recommendedTaskCount = 2;
    maxTaskMinutes = 45;
  } else if (freeMinutes < 120) {
    // Congested calendar
    level = 'reduced';
    reason = `Met ${Math.round(busyMinutes / 60)}u aan afspraken is je dag vol. Kies hooguit 1 compacte taak.`;
    recommendedTaskCount = 1;
    maxTaskMinutes = 30;
  } else if (freeMinutes >= 270 && (!feeling || feeling === 'good')) {
    level = 'high';
    reason = `Veel ademruimte (${Math.round(freeMinutes / 60)}u vrij) en goede energie. Ideaal voor diepgaande projectfocus.`;
    recommendedTaskCount = 3;
    maxTaskMinutes = 120;
  }

  return {
    level,
    freeMinutes,
    busyMinutes,
    feeling,
    reason,
    recommendedTaskCount,
    maxTaskMinutes,
  };
}

/**
 * Evaluates whether a specific task fits into today's capacity.
 */
export function evaluateTaskFit(
  task: Task,
  capacity: BrainCapacityAssessment
): {
  fits: boolean;
  recommendation: 'plan_today' | 'reschedule_later' | 'split_task';
  reason: string;
} {
  const duration = task.estimatedDuration || 30;

  if (capacity.level === 'minimal') {
    return {
      fits: false,
      recommendation: 'reschedule_later',
      reason: 'Je voelt je niet fit. Stel deze taak uit naar een dag met meer herstelde energie.',
    };
  }

  if (duration > capacity.maxTaskMinutes) {
    return {
      fits: false,
      recommendation: duration >= 90 ? 'split_task' : 'reschedule_later',
      reason: `Deze taak duurt ca. ${duration} minuten, terwijl je dagcapaciteit vandaag max. ${capacity.maxTaskMinutes} min toelaat.`,
    };
  }

  return {
    fits: true,
    recommendation: 'plan_today',
    reason: `Past goed binnen je beschikbare tijd (${duration}m).`,
  };
}

/**
 * TASK SPLITTING (Deterministic fallback generator)
 * Breaks down an oversized or composite task into 3-5 clear, manageable micro-tasks.
 */
export function generateTaskSplits(taskTitle: string): { title: string; durationMinutes: number }[] {
  const lower = taskTitle.toLowerCase();

  if (lower.includes('website') || lower.includes('site')) {
    return [
      { title: 'Homepage en teksten controleren', durationMinutes: 20 },
      { title: 'Diensten en prijzen nakijken', durationMinutes: 15 },
      { title: 'Contactformulier en links testen', durationMinutes: 15 },
      { title: 'Mobiele weergave controleren', durationMinutes: 15 },
      { title: 'Wijzigingen publiceren', durationMinutes: 10 },
    ];
  }

  if (lower.includes('content') || lower.includes('post') || lower.includes('instagram')) {
    return [
      { title: 'Invalshoek en kernboodschap bepalen', durationMinutes: 15 },
      { title: 'Tekst (caption) schrijven', durationMinutes: 20 },
      { title: 'Beeldmateriaal selecteren of maken', durationMinutes: 20 },
      { title: 'Inplannen in Content Planner', durationMinutes: 10 },
    ];
  }

  if (lower.includes('factuur') || lower.includes('administratie') || lower.includes('btw') || lower.includes('belasting')) {
    return [
      { title: 'Ontbrekende bonnetjes en facturen verzamelen', durationMinutes: 20 },
      { title: 'Bedragen en btw-nummers controleren', durationMinutes: 15 },
      { title: 'Doorsturen naar boekhouder of archiveren', durationMinutes: 15 },
    ];
  }

  if (lower.includes('cursus') || lower.includes('workshop') || lower.includes('aanbod')) {
    return [
      { title: 'Kernresultaat en doelgroep uitschrijven', durationMinutes: 25 },
      { title: 'Opbouw van de modules schetsen', durationMinutes: 25 },
      { title: 'Prijsstelling en deliverables bepalen', durationMinutes: 20 },
    ];
  }

  // General 3-step breakdown
  return [
    { title: `Voorbereiding en materiaal klaargezet voor: ${taskTitle}`, durationMinutes: 15 },
    { title: `Eerste kernstap uitvoeren van: ${taskTitle}`, durationMinutes: 30 },
    { title: `Afronden en nakijken van: ${taskTitle}`, durationMinutes: 15 },
  ];
}
