import express, { Request, Response } from "express";

const router = express.Router();

// In-memory or persisted integration configuration
interface ServerIntegrationConfig {
  calendar: {
    status: 'connected' | 'not_connected' | 'needs_attention' | 'disconnected';
    accountEmail?: string;
    lastSync?: string;
    readOnly: boolean;
    syncedEventsCount: number;
    isPatriciaOnlySchedule: boolean;
  };
  gmail: {
    status: 'connected' | 'not_connected' | 'needs_attention' | 'disconnected';
    accountEmail?: string;
    lastSync?: string;
    readOnly: boolean;
    businessOnly: boolean;
    syncedThreadsCount: number;
    messages: Array<{
      id: string;
      threadId: string;
      sender: string;
      senderEmail: string;
      subject: string;
      date: string;
      snippet: string;
      unread: boolean;
      possibleClientMatchId?: string;
      needsReview?: boolean;
    }>;
  };
  healthConnect: {
    status: 'connected' | 'not_connected' | 'unavailable';
    platform: 'android' | 'web';
    lastSync?: string;
    stepsToday?: number;
    activeMinutes?: number;
    isStepsOnly: boolean;
    isPrivateOnly: boolean;
  };
  instagram: {
    status: 'connected' | 'not_connected' | 'needs_attention' | 'disconnected';
    accountUsername?: string;
    accountType?: 'business' | 'creator';
    lastSync?: string;
    posts: Array<{
      id: string;
      caption: string;
      mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL';
      timestamp: string;
      likeCount?: number;
      commentsCount?: number;
      reach?: number;
      matchedContentPostId?: string;
      needsReview?: boolean;
    }>;
  };
  pushNotifications: {
    enabled: boolean;
    permission: 'default' | 'granted' | 'denied';
    lastTested?: string;
  };
}

const serverState: ServerIntegrationConfig = {
  calendar: {
    status: 'not_connected',
    accountEmail: undefined,
    lastSync: undefined,
    readOnly: true,
    syncedEventsCount: 0,
    isPatriciaOnlySchedule: true,
  },
  gmail: {
    status: 'not_connected',
    accountEmail: undefined,
    lastSync: undefined,
    readOnly: true,
    businessOnly: true,
    syncedThreadsCount: 0,
    messages: [],
  },
  healthConnect: {
    status: 'unavailable',
    platform: 'web',
    isStepsOnly: true,
    isPrivateOnly: true,
    stepsToday: undefined,
  },
  instagram: {
    status: 'not_connected',
    accountUsername: undefined,
    accountType: 'business',
    posts: [],
  },
  pushNotifications: {
    enabled: true,
    permission: 'default',
    lastTested: undefined,
  },
};

// GET /api/integrations/status
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    integrations: serverState,
    environment: {
      hasGoogleOAuth: !!process.env.GOOGLE_CLIENT_ID,
      hasInstagramOAuth: !!process.env.INSTAGRAM_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV || "development",
    },
  });
});

// POST /api/integrations/connect/:service
router.post("/connect/:service", (req: Request, res: Response) => {
  const { service } = req.params;
  const now = new Date().toISOString();

  switch (service) {
    case "calendar":
    case "google_calendar": {
      const email = req.body.accountEmail;
      if (!email && !req.body.verified) {
        return res.status(400).json({ error: "Geen geverifieerd account of e-mailadres opgegeven." });
      }
      serverState.calendar = {
        status: "connected",
        accountEmail: email,
        lastSync: now,
        readOnly: true,
        syncedEventsCount: req.body.syncedEventsCount || 0,
        isPatriciaOnlySchedule: true,
      };
      return res.json({ success: true, service: "google_calendar", data: serverState.calendar });
    }

    case "gmail":
    case "mariluna_gmail": {
      const email = req.body.accountEmail;
      const messages = req.body.messages || [];
      if (!email && !req.body.verified) {
        return res.status(400).json({ error: "Geen geverifieerd account of e-mailadres opgegeven." });
      }
      serverState.gmail = {
        status: "connected",
        accountEmail: email,
        lastSync: now,
        readOnly: true,
        businessOnly: true,
        syncedThreadsCount: messages.length,
        messages: messages,
      };
      return res.json({ success: true, service: "mariluna_gmail", data: serverState.gmail });
    }

    case "health_connect": {
      serverState.healthConnect = {
        status: "connected",
        platform: req.body.platform === "android" ? "android" : "web",
        lastSync: now,
        stepsToday: typeof req.body.stepsToday === "number" ? req.body.stepsToday : 0,
        activeMinutes: req.body.activeMinutes ?? 0,
        isStepsOnly: true,
        isPrivateOnly: true,
      };
      return res.json({ success: true, service: "health_connect", data: serverState.healthConnect });
    }

    case "instagram":
    case "mariluna_instagram": {
      const username = req.body.accountUsername || "@mariluna.studio";
      serverState.instagram = {
        status: "connected",
        accountUsername: username,
        accountType: "business",
        lastSync: now,
        posts: [
          {
            id: "ig-101",
            caption: "Het geheim van een serene esthetiek zit in de ademruimte tussen de elementen. 🌿",
            mediaType: "IMAGE",
            timestamp: now.split("T")[0],
            likeCount: 142,
            commentsCount: 18,
            reach: 890,
          },
          {
            id: "ig-102",
            caption: "Atelier rituelen: zacht natuurlijk licht en doordachte proporties.",
            mediaType: "CAROUSEL_ALBUM",
            timestamp: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
            likeCount: 198,
            commentsCount: 24,
            reach: 1250,
          },
        ],
      };
      return res.json({ success: true, service: "mariluna_instagram", data: serverState.instagram });
    }

    case "push_notifications": {
      serverState.pushNotifications.enabled = req.body.enabled !== false;
      serverState.pushNotifications.permission = req.body.permission || "granted";
      serverState.pushNotifications.lastTested = now;
      return res.json({ success: true, service: "push_notifications", data: serverState.pushNotifications });
    }

    default:
      return res.status(400).json({ error: `Onbekende service: ${service}` });
  }
});

// POST /api/integrations/disconnect/:service
router.post("/disconnect/:service", (req: Request, res: Response) => {
  const { service } = req.params;

  switch (service) {
    case "calendar":
    case "google_calendar":
      serverState.calendar = {
        status: "not_connected",
        accountEmail: undefined,
        lastSync: undefined,
        readOnly: true,
        syncedEventsCount: 0,
        isPatriciaOnlySchedule: true,
      };
      break;

    case "gmail":
    case "mariluna_gmail":
      serverState.gmail = {
        status: "not_connected",
        accountEmail: undefined,
        lastSync: undefined,
        readOnly: true,
        businessOnly: true,
        syncedThreadsCount: 0,
        messages: [],
      };
      break;

    case "health_connect":
      serverState.healthConnect = {
        status: serverState.healthConnect.platform === "android" ? "not_connected" : "unavailable",
        platform: serverState.healthConnect.platform,
        lastSync: undefined,
        stepsToday: undefined,
        activeMinutes: undefined,
        isStepsOnly: true,
        isPrivateOnly: true,
      };
      break;

    case "instagram":
    case "mariluna_instagram":
      serverState.instagram = {
        status: "not_connected",
        accountUsername: undefined,
        accountType: "business",
        lastSync: undefined,
        posts: [],
      };
      break;

    case "push_notifications":
      serverState.pushNotifications.enabled = false;
      break;

    default:
      return res.status(400).json({ error: `Onbekende service: ${service}` });
  }

  res.json({ success: true, service, message: `Verbinding met ${service} verbroken.` });
});

// POST /api/integrations/sync/:service
router.post("/sync/:service", (req: Request, res: Response) => {
  const { service } = req.params;
  const now = new Date().toISOString();

  if (service === "calendar" || service === "google_calendar") {
    if (serverState.calendar.status === "connected") {
      serverState.calendar.lastSync = now;
    }
  } else if (service === "gmail" || service === "mariluna_gmail") {
    if (serverState.gmail.status === "connected") {
      serverState.gmail.lastSync = now;
    }
  } else if (service === "health_connect") {
    if (serverState.healthConnect.status === "connected") {
      serverState.healthConnect.lastSync = now;
    }
  } else if (service === "instagram" || service === "mariluna_instagram") {
    if (serverState.instagram.status === "connected") {
      serverState.instagram.lastSync = now;
    }
  }

  res.json({ success: true, service, lastSync: now });
});

// POST /api/integrations/test-push
router.post("/test-push", (_req: Request, res: Response) => {
  const now = new Date().toISOString();
  serverState.pushNotifications.lastTested = now;
  res.json({
    success: true,
    title: "Alchemy Sovereign OS",
    body: "Testnotificatie geslaagd. Je notificatievoorkeuren zijn actief en rustig ingesteld.",
    timestamp: now,
  });
});

export default router;
