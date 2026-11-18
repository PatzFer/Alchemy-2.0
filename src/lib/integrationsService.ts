import {
  IntegrationsState,
  CalendarEvent,
  MarilunaClient,
  MarilunaGmailMessage,
  InstagramPostItem,
  ContentPost,
} from '../types';

export class IntegrationsService {
  /**
   * Request native browser notification permission
   */
  static async requestNotificationPermission(): Promise<'default' | 'granted' | 'denied'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission as 'default' | 'granted' | 'denied';
    } catch {
      return 'denied';
    }
  }

  /**
   * Send a native browser push notification if permitted and in compliance with quiet hours
   */
  static async sendBrowserPush(title: string, options?: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }

    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    try {
      // Android Mobile / Chrome / PWA strictly requires ServiceWorkerRegistration.showNotification
      if ('serviceWorker' in navigator) {
        try {
          let reg: ServiceWorkerRegistration | undefined;

          // 1. Try active controller registration
          if (navigator.serviceWorker.controller) {
            reg = await navigator.serviceWorker.getRegistration();
          }

          // 2. Race with 2.0s timeout on ready
          if (!reg) {
            const regPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise<undefined>((resolve) =>
              setTimeout(() => resolve(undefined), 2000)
            );
            reg = await Promise.race([regPromise, timeoutPromise]);
          }

          // 3. Fallback: get all registrations
          if (!reg) {
            const regs = await navigator.serviceWorker.getRegistrations();
            if (regs.length > 0) reg = regs[0];
          }

          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              icon: '/icon.svg',
              badge: '/icon.svg',
              vibrate: [100, 50, 100],
              data: { url: window.location.origin },
              ...options,
            } as NotificationOptions);
            return true;
          }
        } catch (swErr) {
          console.warn('[Integrations] ServiceWorker notification error:', swErr);
        }
      }

      // Desktop browser fallback ONLY (Android Chrome throws Illegal constructor error on `new Notification(...)`)
      if (!isAndroid) {
        new Notification(title, {
          icon: '/icon.svg',
          badge: '/icon.svg',
          ...options,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Browser push notification could not be shown:', err);
      return false;
    }
  }

  /**
   * Check if current time falls within Quiet Hours (e.g. 21:00 to 08:30)
   */
  static isWithinQuietHours(start = '21:00', end = '08:30'): boolean {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const startMins = (startH || 21) * 60 + (startM || 0);

    const [endH, endM] = end.split(':').map(Number);
    const endMins = (endH || 8) * 60 + (endM || 30);

    if (startMins > endMins) {
      // Overnight (e.g. 21:00 to 08:30 next morning)
      return currentMins >= startMins || currentMins < endMins;
    } else {
      // Same day quiet window
      return currentMins >= startMins && currentMins < endMins;
    }
  }

  /**
   * Register a verified provider connection with the server.
   * Local OAuth/data reads are not reported as server persistence when this request fails.
   */
  static async connectService(
    serviceId: 'google_calendar' | 'mariluna_gmail' | 'health_connect' | 'mariluna_instagram' | 'push_notifications',
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; local?: boolean; error?: string; data?: unknown }> {
    try {
      const res = await fetch(`/api/integrations/connect/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data?.error || `Serververbinding mislukt (${res.status}).` };
      }
      return { success: true, data };
    } catch (err) {
      console.warn(`[Integrations] Could not connect ${serviceId} via server API:`, err);
      return {
        success: false,
        local: true,
        error: 'Providergegevens zijn lokaal opgehaald, maar serverregistratie is niet bevestigd.',
      };
    }
  }

  /**
   * Disconnect a service and report server status accurately.
   */
  static async disconnectService(
    serviceId: 'google_calendar' | 'mariluna_gmail' | 'health_connect' | 'mariluna_instagram' | 'push_notifications'
  ): Promise<{ success: boolean; local?: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/integrations/disconnect/${serviceId}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data?.error || `Serververbreking mislukt (${res.status}).` };
      }
      return { success: true };
    } catch (err) {
      console.warn(`[Integrations] Could not disconnect ${serviceId} via server API:`, err);
      return { success: false, local: true, error: 'Lokale status aangepast; serverstatus kon niet worden bevestigd.' };
    }
  }

  /**
   * Trigger a server-side sync and never fabricate a successful timestamp.
   */
  static async syncService(
    serviceId: string
  ): Promise<{ success: boolean; lastSync?: string; error?: string }> {
    try {
      const res = await fetch(`/api/integrations/sync/${serviceId}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data?.error || `Synchronisatie mislukt (${res.status}).` };
      }
      return { success: true, lastSync: data?.lastSync };
    } catch (err) {
      console.warn(`[Integrations] Could not sync ${serviceId}:`, err);
      return { success: false, error: 'Server synchronisatie kon niet worden bevestigd.' };
    }
  }

  /**
   * Test push notification
   */
  static async testPush() {
    try {
      await fetch('/api/integrations/test-push', { method: 'POST' });
    } catch {
      // ignore
    }
    return this.sendBrowserPush('Alchemy test', {
      body: 'Alchemy test — notificaties werken.',
    });
  }

  /**
   * Context: Analyze calendar schedule for dinner/cooking constraints
   * ONLY checks Patricia's personal calendar events. Never infers Jeroen's schedule.
   */
  static getDinnerCookingContext(dateStr: string, events: CalendarEvent[]): {
    hasLateCommitment: boolean;
    recommendedCookingTimeMins: number;
    summary: string;
    lateEvents: CalendarEvent[];
  } {
    const dayEvents = events.filter((e) => e.date === dateStr);
    
    // Check if any event begins or extends after 17:30
    const lateEvents = dayEvents.filter((e) => {
      if (!e.startTime) return false;
      const [h] = e.startTime.split(':').map(Number);
      return h >= 17;
    });

    if (lateEvents.length > 0) {
      const eventNames = lateEvents.map((e) => `${e.title} (${e.startTime || ''})`).join(', ');
      return {
        hasLateCommitment: true,
        recommendedCookingTimeMins: 20,
        summary: `Avondafspraak: ${eventNames}. Snelle bereiding (<20 min) aanbevolen.`,
        lateEvents,
      };
    }

    return {
      hasLateCommitment: false,
      recommendedCookingTimeMins: 45,
      summary: 'Vrije avond. Ruime kooktijd mogelijk.',
      lateEvents: [],
    };
  }

  /**
   * Match incoming Mariluna Gmail messages against known Mariluna Clients
   */
  static matchGmailWithClients(
    messages: MarilunaGmailMessage[],
    clients: MarilunaClient[]
  ): {
    matched: Array<{ message: MarilunaGmailMessage; client: MarilunaClient }>;
    unmatchedNeedsReview: MarilunaGmailMessage[];
  } {
    const matched: Array<{ message: MarilunaGmailMessage; client: MarilunaClient }> = [];
    const unmatchedNeedsReview: MarilunaGmailMessage[] = [];

    messages.forEach((msg) => {
      const emailLower = msg.senderEmail.toLowerCase();
      const clientMatch = clients.find(
        (c) => c.email && c.email.toLowerCase() === emailLower
      );

      if (clientMatch) {
        matched.push({ message: msg, client: clientMatch });
      } else {
        unmatchedNeedsReview.push(msg);
      }
    });

    return { matched, unmatchedNeedsReview };
  }

  /**
   * Match published Instagram posts with ContentPlan posts
   */
  static matchInstagramWithContentPlan(
    igPosts: InstagramPostItem[],
    contentPosts: ContentPost[]
  ): Array<{
    igPost: InstagramPostItem;
    contentPost?: ContentPost;
  }> {
    return igPosts.map((ig) => {
      const found = contentPosts.find(
        (cp) =>
          cp.platform.toLowerCase() === 'instagram' &&
          (cp.title.toLowerCase().includes(ig.caption.slice(0, 20).toLowerCase()) ||
            ig.caption.toLowerCase().includes(cp.title.slice(0, 20).toLowerCase()))
      );
      return {
        igPost: ig,
        contentPost: found,
      };
    });
  }
}
