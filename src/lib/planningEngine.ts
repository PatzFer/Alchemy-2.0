import { Task, CalendarEvent, LifeProfile } from '../types';

export interface DayCapacity {
  workdayHours: number;
  scheduledEventsMinutes: number;
  taskCommitmentMinutes: number;
  bufferMinutes: number;
  availableFreeMinutes: number;
  status: 'spacious' | 'harmonious' | 'dense' | 'overcrowded';
  recommendation: string;
}

export function calculateDayCapacity(
  tasks: Task[],
  events: CalendarEvent[],
  profile: LifeProfile,
  selectedDate: string
): DayCapacity {
  // Parse working hours
  const [startH, startM] = (profile.workingHoursStart || '09:00').split(':').map(Number);
  const [endH, endM] = (profile.workingHoursEnd || '16:30').split(':').map(Number);
  const totalWorkdayMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const workdayHours = Math.max(0, totalWorkdayMinutes / 60);

  // Calculate scheduled calendar minutes for the selected date
  const dateEvents = events.filter((e) => e.date === selectedDate);
  const scheduledEventsMinutes = dateEvents.reduce((acc, evt) => {
    const [sH, sM] = evt.startTime.split(':').map(Number);
    const [eH, eM] = evt.endTime.split(':').map(Number);
    const dur = (eH * 60 + eM) - (sH * 60 + sM);
    return acc + Math.max(0, dur);
  }, 0);

  // Calculate active tasks due today
  const activeTasks = tasks.filter(
    (t) => t.dueDate === selectedDate && t.status !== 'completed'
  );
  const taskCommitmentMinutes = activeTasks.reduce(
    (acc, t) => acc + (t.estimatedDuration || 30),
    0
  );

  const bufferMinutes = activeTasks.length * (profile.preferences?.bufferTimeBetweenTasksMinutes || 20);

  const totalUsedMinutes = scheduledEventsMinutes + taskCommitmentMinutes + bufferMinutes;
  // Based on an active waking day of ~12 usable hours (720 min)
  const availableFreeMinutes = Math.max(0, 720 - totalUsedMinutes);

  let status: DayCapacity['status'] = 'harmonious';
  let recommendation = 'Your day has natural rhythm with plenty of room to think and rest.';

  if (availableFreeMinutes < 90 || taskCommitmentMinutes > 360) {
    status = 'overcrowded';
    recommendation = 'Today is at capacity. Consider moving optional items to later in the week.';
  } else if (availableFreeMinutes < 180) {
    status = 'dense';
    recommendation = 'Focused schedule. Guard your afternoon break strictly.';
  } else if (availableFreeMinutes > 360 && activeTasks.length <= 3) {
    status = 'spacious';
    recommendation = 'Expansive space today. An ideal day for deep creative inquiry or restful pacing.';
  }

  return {
    workdayHours,
    scheduledEventsMinutes,
    taskCommitmentMinutes,
    bufferMinutes,
    availableFreeMinutes,
    status,
    recommendation,
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
