import {
  NotificationSettings,
  SmartNotification,
  Task,
  CalendarEvent,
  Idea,
  Goal,
  NotificationCategory,
  CycleProfile,
  DailyCheckIn,
} from '../types';
import { calculateCycleStatus } from './cycleUtils';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  browserPermission: 'default',
  browserPushEnabled: false,
  inAppNotificationsEnabled: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:30',
  maxDailyFrequency: 3,
  soundEnabled: false,
  categories: {
    important_deadline: true,
    upcoming_task: true,
    calendar_reminder: true,
    mariluna_followup: true,
    forgotten_idea: true,
    goal_checkin: true,
    cycle_insight: true,
    weekly_planning: true,
    rescheduling_suggestion: true,
    reminder_notifications: true,
    calendar_notifications: true,
    meal_planning_notifications: true,
    health_movement_reminders: true,
    mariluna_notifications: true,
    important_ai_suggestions: true,
  },
  // Prompt 10 explicit categories
  reminderNotifications: true,
  calendarNotifications: true,
  mealPlanningNotifications: true,
  healthMovementReminders: true,
  marilunaNotifications: true,
  importantAiSuggestions: true,
  pushNotificationsEnabled: true,
  upcomingTaskReminders: true,
  marilunaFollowUps: true,
  forgottenIdeas: true,
  goalCheckIns: true,
  cycleInsights: true,
  weeklyPlanning: true,
  rescheduleSuggestions: true,
};

/**
 * Checks if current time is inside user-configured Quiet Hours.
 */
export function isCurrentlyQuietHours(settings?: NotificationSettings): boolean {
  if (!settings || !settings.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (settings.quietHoursStart || '21:00').split(':').map(Number);
  const [endH, endM] = (settings.quietHoursEnd || '08:30').split(':').map(Number);

  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  if (startMinutes > endMinutes) {
    // Spans overnight (e.g. 21:00 to 08:30)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Same day window
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Synthesizes a sparse, high-value notification digest rather than blasting individual pings.
 */
export function evaluateSmartNotifications(params: {
  settings?: NotificationSettings;
  notificationSettings?: NotificationSettings;
  existingNotifications?: SmartNotification[];
  notifications?: SmartNotification[];
  tasks?: Task[];
  calendarEvents?: CalendarEvent[];
  ideas?: Idea[];
  goals?: Goal[];
  cycleProfile?: CycleProfile;
  todayCheckIn?: DailyCheckIn;
  dailyCheckIns?: DailyCheckIn[];
}): SmartNotification[] {
  if (!params) return [];

  const settings: NotificationSettings =
    params.settings || params.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
  const existingNotifications: SmartNotification[] =
    params.existingNotifications || params.notifications || [];
  const tasks = params.tasks || [];
  const calendarEvents = params.calendarEvents || [];
  const ideas = params.ideas || [];
  const cycleProfile = params.cycleProfile;

  if (!settings || !settings.enabled) return existingNotifications;

  const maxFrequency = settings.maxDailyFrequency || 3;
  const categories = settings.categories || DEFAULT_NOTIFICATION_SETTINGS.categories;

  const todayStr = new Date().toISOString().split('T')[0];
  const newItems: SmartNotification[] = [];

  // Check how many notifications have been added today
  const notificationsToday = existingNotifications.filter(
    (n) => n.timestamp && n.timestamp.split('T')[0] === todayStr
  );

  if (notificationsToday.length >= maxFrequency) {
    // Respect strict maximum daily frequency
    return existingNotifications;
  }

  // 1. Daily Thoughtful Morning Synthesis (combines tasks + calendar + cycle)
  const hasDailyDigest = existingNotifications.some(
    (n) => n.category === 'upcoming_task' && n.timestamp && n.timestamp.split('T')[0] === todayStr
  );

  if (!hasDailyDigest && categories.upcoming_task) {
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr && t.status !== 'completed');
    const highPriority = todayTasks.filter((t) => t.priority === 'high');
    const todayEvents = calendarEvents.filter((e) => e.date === todayStr);

    let digestBody = '';
    if (todayTasks.length === 0) {
      digestBody = 'Your day is open and spacious with no pressing deadlines.';
    } else {
      const mainTask = highPriority[0] || todayTasks[0];
      const realmName = mainTask.realm === 'mariluna' ? 'Mariluna Studio' : 'Personal';
      digestBody = `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} planned. Key focus: "${mainTask.title}" (${realmName}). You have ${todayEvents.length} scheduled event${todayEvents.length > 1 ? 's' : ''}.`;
    }

    // Add gentle cycle context if available and enabled
    if (cycleProfile?.trackingEnabled && categories.cycle_insight) {
      const cycleStatus = calculateCycleStatus(cycleProfile, todayStr);
      digestBody += ` (Rhythm: ${cycleStatus.activePhase} phase, Day ${cycleStatus.cycleDay}).`;
    }

    newItems.push({
      id: 'sn-digest-' + todayStr,
      category: 'upcoming_task',
      title: 'Daily Synthesis & Space',
      body: digestBody,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'thoughtful',
      targetTab: 'today',
    });
  }

  // 2. Forgotten Sparks / Ideas Check (sparse, once a week)
  if (
    categories.forgotten_idea &&
    notificationsToday.length + newItems.length < maxFrequency
  ) {
    const untouchedIdeas = ideas.filter((i) => i.status === 'raw');
    const hasRecentIdeaNotice = existingNotifications.some(
      (n) => n.category === 'forgotten_idea' && Date.now() - new Date(n.timestamp).getTime() < 5 * 24 * 60 * 60 * 1000
    );

    if (!hasRecentIdeaNotice && untouchedIdeas.length >= 3) {
      const spark = untouchedIdeas[0];
      newItems.push({
        id: 'sn-idea-' + Date.now(),
        category: 'forgotten_idea',
        title: 'Untouched Spark in Idea Sanctuary',
        body: `"${spark.title}" has rested in your sanctuary. Would you like to elevate it to a project or let it gently compost?`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'gentle',
        targetTab: 'ideas',
        actionPrompt: `Review the idea "${spark.title}" and suggest whether to turn it into an active project or archive it.`,
      });
    }
  }

  // 3. Gentle Missed Task Reschedule Suggestion
  if (
    categories.rescheduling_suggestion &&
    notificationsToday.length + newItems.length < maxFrequency
  ) {
    const missedTasks = tasks.filter((t) => t.missed && t.status !== 'completed');
    const hasMissedNotice = existingNotifications.some(
      (n) => n.category === 'rescheduling_suggestion' && n.timestamp && n.timestamp.split('T')[0] === todayStr
    );

    if (!hasMissedNotice && missedTasks.length > 0) {
      const missed = missedTasks[0];
      newItems.push({
        id: 'sn-resched-' + missed.id,
        category: 'rescheduling_suggestion',
        title: 'Thoughtful Rescheduling Opportunity',
        body: `"${missed.title}" was not reached yesterday. No guilt—would you like to slide it to a more spacious day?`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'gentle',
        targetTab: 'tasks',
      });
    }
  }

  return [...newItems, ...existingNotifications];
}

/**
 * Requests browser notification permission.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

/**
 * Sends a quick standalone test browser notification.
 */
export async function sendBrowserNotification(
  title: string,
  body: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/icon.svg' });
      return true;
    } catch (e) {
      console.warn('Browser notification error:', e);
      return false;
    }
  }
  return false;
}

/**
 * Dispatches a native browser notification if permissions and quiet hours allow.
 */
export async function triggerBrowserPush(
  notification: SmartNotification,
  settings?: NotificationSettings
): Promise<boolean> {
  if (!settings || !settings.enabled || isCurrentlyQuietHours(settings)) {
    return false;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: notification.category,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (e) {
      console.warn('Browser notification error:', e);
      return false;
    }
  }

  return false;
}
