import { Task, CalendarEvent, LifeProfile, DailyCheckIn, FoundationData, Language } from '../types';

export interface DayCapacity {
  workdayHours: number;
  scheduledEventsMinutes: number;
  taskCommitmentMinutes: number;
  bufferMinutes: number;
  availableFreeMinutes: number;
  formattedFreeTime: string;
  status: 'spacious' | 'harmonious' | 'dense' | 'overcrowded';
  recommendation: string;
  explanation?: string;
  rescheduleCandidate?: Task;
}

export function formatApproximateTime(minutes: number, lang: Language = 'nl'): string {
  const isNl = lang === 'nl';
  if (minutes <= 0) {
    return isNl ? 'Geen vrije ruimte' : 'No free capacity';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round((minutes % 60) / 15) * 15; // round to nearest 15 min

  if (hours === 0) {
    return `±${Math.max(15, remainingMins)}m`;
  }
  if (remainingMins === 0) {
    return isNl ? `±${hours}u` : `±${hours}h`;
  }
  if (remainingMins === 60) {
    return isNl ? `±${hours + 1}u` : `±${hours + 1}h`;
  }
  const minsStr = remainingMins < 10 ? `0${remainingMins}` : `${remainingMins}`;
  return isNl ? `±${hours}u${minsStr}` : `±${hours}h ${minsStr}m`;
}

export function calculateDayCapacity(
  tasks: Task[],
  events: CalendarEvent[],
  profile: LifeProfile,
  selectedDate: string,
  checkIn?: DailyCheckIn,
  foundation?: FoundationData,
  lang: Language = 'nl'
): DayCapacity {
  const isNl = lang === 'nl';
  const dateObj = new Date(selectedDate);
  const dayOfWeekIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeekEn = dayNamesEn[dayOfWeekIndex];

  // 1. Determine Work Hours for today
  let isWorkDay = false;
  let workStart = profile.workingHoursStart || '09:00';
  let workEnd = profile.workingHoursEnd || '17:00';
  let commuteMinutes = (profile.commuteTimeMinutes || 0) * 2;

  // Check foundation work contexts if configured
  if (foundation?.work?.workContexts && foundation.work.workContexts.length > 0) {
    const matchedContext = foundation.work.workContexts.find((ctx) =>
      ctx.workdays.some((d) => d.toLowerCase() === dayOfWeekEn)
    );
    if (matchedContext) {
      isWorkDay = true;
      workStart = matchedContext.startTime || workStart;
      workEnd = matchedContext.endTime || workEnd;
      if (matchedContext.commuteMinutes !== undefined) {
        commuteMinutes = matchedContext.commuteMinutes * 2;
      }
    }
  } else if (profile.workingDays && profile.workingDays.length > 0) {
    isWorkDay = profile.workingDays.some(
      (d) => d.toLowerCase().slice(0, 3) === dayOfWeekEn.slice(0, 3)
    );
  } else {
    // Default weekday assumption (Mon-Fri) if not yet configured
    isWorkDay = dayOfWeekIndex >= 1 && dayOfWeekIndex <= 5;
  }

  let totalWorkdayMinutes = 0;
  if (isWorkDay) {
    const [startH, startM] = workStart.split(':').map(Number);
    const [endH, endM] = workEnd.split(':').map(Number);
    totalWorkdayMinutes = Math.max(0, endH * 60 + endM - (startH * 60 + startM));
  }
  const workdayHours = Math.max(0, totalWorkdayMinutes / 60);

  // 2. Scheduled calendar events for selected date
  const dateEvents = events.filter((e) => e.date === selectedDate);
  const scheduledEventsMinutes = dateEvents.reduce((acc, evt) => {
    const [sH, sM] = evt.startTime.split(':').map(Number);
    const [eH, eM] = evt.endTime.split(':').map(Number);
    const dur = eH * 60 + eM - (sH * 60 + sM);
    return acc + Math.max(0, dur);
  }, 0);

  // 3. Active tasks due today
  const activeTasks = tasks.filter(
    (t) => t.dueDate === selectedDate && t.status !== 'completed'
  );
  const taskCommitmentMinutes = activeTasks.reduce(
    (acc, t) => acc + (t.estimatedDuration || 30),
    0
  );

  // 4. Essential personal time (morning ritual, nutrition/meals, wind-down)
  const essentialPersonalMinutes = 150; // 2.5 hours total for waking hygiene, meals, wind-down

  // 5. Total waking usable pool (~16 waking hours = 960 min)
  const baseUnavailableMinutes =
    (isWorkDay ? totalWorkdayMinutes + commuteMinutes : 0) +
    scheduledEventsMinutes +
    essentialPersonalMinutes;

  const rawAvailableMinutes = Math.max(0, 960 - baseUnavailableMinutes);

  // 6. Check-in Context Interpretation
  // The check-in directly influences realistic cognitive and physical capacity
  let capacityFactor = 1.0;
  let explanation = '';

  if (checkIn) {
    if (checkIn.feeling === 'sick') {
      // Sick: body demands rest, capacity severely restricted
      capacityFactor = 0.25;
      explanation = isNl
        ? 'Je lichaam vraagt vandaag om rust. Richt je uitsluitend op essentiële afspraken en rust.'
        : 'Your body asks for rest today. Focus only on essential commitments and prioritize recovery.';
    } else if (checkIn.feeling === 'mentally_heavy') {
      // Mentally heavy: reduce cognitive overload
      capacityFactor = 0.55;
      explanation = isNl
        ? 'Emotioneel of mentaal zwaarder vandaag. We verlichten de cognitieve druk en houden de taken eenvoudig.'
        : 'Mentally heavy today. We are lowering cognitive pressure and prioritizing gentle, simple steps.';
    } else if (checkIn.feeling === 'lower') {
      if (checkIn.feelingDriver === 'poor_sleep') {
        capacityFactor = 0.7;
        explanation = isNl
          ? 'Minder energie door slecht slapen. Belangrijke taken blijven haalbaar, zware taken schuiven door.'
          : 'Lower energy due to poor sleep. Keeping essentials reachable while avoiding unnecessary heavy tasks.';
      } else if (checkIn.feelingDriver === 'stress') {
        capacityFactor = 0.65;
        explanation = isNl
          ? 'Hoge stress ervaren. Meer ademruimte ingebouwd tussen verplichtingen.'
          : 'Stress present today. Extra buffer space preserved between commitments.';
      } else if (checkIn.feelingDriver === 'cycle') {
        capacityFactor = 0.75;
        explanation = isNl
          ? 'Cyclusritme beïnvloedt je energie. Pacing afgestemd op natuurlijk herstel.'
          : 'Cycle rhythm affecting energy. Pacing tailored to natural restorative capacity.';
      } else {
        capacityFactor = 0.75;
        explanation = isNl
          ? 'Lagere energie gemeld. We beschermen je avond en houden het tempo realistisch.'
          : 'Lower energy reported. Guarding your evening and keeping the pace realistic.';
      }
    } else if (checkIn.feeling === 'good') {
      capacityFactor = 1.0;
      explanation = isNl
        ? 'Je voelt je goed en helder. Normale capaciteit voor focus en actie.'
        : 'Feeling good and clear. Full capacity for focused action.';
    }
  }

  const realisticAvailableMinutes = Math.round(rawAvailableMinutes * capacityFactor);
  const formattedFreeTime = formatApproximateTime(realisticAvailableMinutes, lang);

  // Status and recommendations
  let status: DayCapacity['status'] = 'harmonious';
  let recommendation = isNl
    ? `Realistische vrije tijd vandaag: ${formattedFreeTime}. Voldoende ruimte voor een ontspannen tempo.`
    : `Realistic free time today: ${formattedFreeTime}. Balanced room for a steady pace.`;

  if (realisticAvailableMinutes < 60 || taskCommitmentMinutes > realisticAvailableMinutes) {
    status = 'overcrowded';
    recommendation = isNl
      ? `Realistische vrije tijd vandaag: ${formattedFreeTime}. Je agenda en taken zitten overvol.`
      : `Realistic free time today: ${formattedFreeTime}. Your schedule is over capacity.`;
  } else if (realisticAvailableMinutes < 120) {
    status = 'dense';
    recommendation = isNl
      ? `Realistische vrije tijd vandaag: ${formattedFreeTime}. Houd focus op maximaal 1 of 2 kerntaken.`
      : `Realistic free time today: ${formattedFreeTime}. Focus strictly on 1 or 2 essential items.`;
  } else if (realisticAvailableMinutes >= 240 && activeTasks.length <= 3) {
    status = 'spacious';
    recommendation = isNl
      ? `Realistische vrije tijd vandaag: ${formattedFreeTime}. Ruime ademruimte voor creativiteit of rust.`
      : `Realistic free time today: ${formattedFreeTime}. Spacious capacity for creative flow or rest.`;
  }

  // Find a candidate task to reschedule if overcrowded or low energy
  let rescheduleCandidate: Task | undefined;
  if ((status === 'overcrowded' || (checkIn && checkIn.feeling !== 'good')) && activeTasks.length > 1) {
    // Pick the lowest priority or longest non-urgent task
    rescheduleCandidate = [...activeTasks]
      .filter((t) => t.priority !== 'high')
      .sort((a, b) => (b.estimatedDuration || 0) - (a.estimatedDuration || 0))[0];
  }

  return {
    workdayHours,
    scheduledEventsMinutes,
    taskCommitmentMinutes,
    bufferMinutes: activeTasks.length * 15,
    availableFreeMinutes: realisticAvailableMinutes,
    formattedFreeTime,
    status,
    recommendation,
    explanation,
    rescheduleCandidate,
  };
}

export interface GentleTaskAdvice {
  taskId: string;
  taskTitle: string;
  realm: 'personal' | 'mariluna';
  reason: string;
  suggestedAction: 'reschedule' | 'postpone' | 'simplify' | 'delegate' | 'remove';
  suggestedDate?: string;
  message: string;
}

export function detectMissedAndOverdueTasks(tasks: Task[]): GentleTaskAdvice[] {
  const today = new Date().toISOString().split('T')[0];
  const missedTasks = tasks.filter(
    (t) => t.status !== 'completed' && (t.missed || (t.dueDate && t.dueDate < today))
  );

  return missedTasks.map((t) => {
    // Generate a thoughtful suggestion based on realm
    const nextThursday = getNextDayOfWeek(4); // 4 = Thursday
    const nextSaturday = getNextDayOfWeek(6); // 6 = Saturday
    const targetDate = t.realm === 'personal' ? nextSaturday : nextThursday;
    const targetName = t.realm === 'personal' ? 'Saturday morning' : 'Thursday afternoon';

    return {
      taskId: t.id,
      taskTitle: t.title,
      realm: t.realm,
      reason: `You were focused on essentials yesterday.`,
      suggestedAction: 'reschedule',
      suggestedDate: targetDate,
      message: t.rescheduleSuggestion || `You didn't get to this today. Would you like me to move it to ${targetName}?`,
    };
  });
}

function getNextDayOfWeek(dayOfWeekIndex: number): string {
  const d = new Date();
  const currentDay = d.getDay();
  let diff = dayOfWeekIndex - currentDay;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
