import firebaseConfig from '../../firebase-applet-config.json';
import { MarilunaGmailMessage, CalendarEvent, InstagramPostItem } from '../types';

let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

const CLIENT_ID =
  firebaseConfig.oAuthClientId ||
  '869228464647-3fetdjdv9ru3a192vq7ukdrcr0ro6jt3.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Perform Google OAuth 2.0 flow using Google Identity Services (GIS)
 * directly requesting access token from Google without Firebase Auth domain restrictions.
 */
export const googleSignInForService = async (
  scopes: string[] = ['https://www.googleapis.com/auth/gmail.readonly']
): Promise<{ accessToken: string; email: string; grantedScopes: string[] }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Browser omgevingsfout.'));
    }

    const fullScopes = Array.from(
      new Set([
        ...scopes,
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ])
    );

    const triggerGIS = () => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services SDK is niet beschikbaar.'));
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: fullScopes.join(' '),
          callback: async (response: any) => {
            if (response.error) {
              if (response.error === 'access_denied') {
                return reject(new Error('Inloggen/toestemming geannuleerd door gebruiker.'));
              }
              return reject(
                new Error(`Google OAuth Fout: ${response.error_description || response.error}`)
              );
            }

            if (!response.access_token) {
              return reject(new Error('Geen OAuth access token ontvangen.'));
            }

            cachedAccessToken = response.access_token;
            const grantedScopesStr = response.scope || fullScopes.join(' ');
            const grantedScopes = grantedScopesStr.split(' ');

            // Fetch user profile email
            let email = '';
            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.email) email = userData.email;
              }
            } catch {
              // fallback
            }

            resolve({ accessToken: response.access_token, email, grantedScopes });
          },
          error_callback: (err: any) => {
            reject(new Error(err.message || 'Authenticatiescherm kon niet worden geopend.'));
          },
        });

        // Always force Google account chooser screen
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        reject(new Error(err.message || 'Authenticatie met Google mislukt.'));
      }
    };

    if (window.google?.accounts?.oauth2) {
      triggerGIS();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          triggerGIS();
        } else if (attempts > 20) {
          clearInterval(interval);
          reject(
            new Error(
              'Google Identity Services SDK is niet geladen. Controleer de internetverbinding.'
            )
          );
        }
      }, 150);
    }
  });
};

/**
 * Fetch real Google Calendar events and verify access permissions.
 */
export const fetchRealCalendarEventsFromApi = async (
  accessToken: string
): Promise<{
  events: CalendarEvent[];
  accountEmail: string;
  isWriteAccessGranted: boolean;
  totalEventsCount: number;
}> => {
  // 1. Check primary calendar ACL role
  const primaryCalRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!primaryCalRes.ok) {
    if (primaryCalRes.status === 401 || primaryCalRes.status === 403) {
      throw new Error('AUTHENTICATION_EXPIRED');
    }
    throw new Error(`Google Calendar API Fout (${primaryCalRes.status}): ${primaryCalRes.statusText}`);
  }

  const primaryData = await primaryCalRes.json();
  const accountEmail = primaryData.id || '';
  const accessRole = primaryData.accessRole || 'reader';
  const isWriteAccessGranted = accessRole === 'owner' || accessRole === 'writer';

  // 2. Query primary calendar events
  const now = new Date();
  const pastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      pastWeek
    )}&maxResults=50&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!eventsRes.ok) {
    if (eventsRes.status === 401 || eventsRes.status === 403) {
      throw new Error('AUTHENTICATION_EXPIRED');
    }
    throw new Error(`Google Calendar API Fout bij afspraken: ${eventsRes.statusText}`);
  }

  const eventsData = await eventsRes.json();
  const rawItems: any[] = eventsData.items || [];

  const convertedEvents: CalendarEvent[] = rawItems
    .filter((item) => item.status !== 'cancelled' && item.summary)
    .map((item) => {
      const startDateTime = item.start?.dateTime || item.start?.date || '';
      const endDateTime = item.end?.dateTime || item.end?.date || '';

      const dateStr = startDateTime ? startDateTime.split('T')[0] : now.toISOString().split('T')[0];
      const startTimeStr = startDateTime.includes('T')
        ? startDateTime.split('T')[1].slice(0, 5)
        : '09:00';
      const endTimeStr = endDateTime.includes('T')
        ? endDateTime.split('T')[1].slice(0, 5)
        : '10:00';

      return {
        id: `gcal-${item.id}`,
        googleEventId: item.id,
        title: item.summary,
        startTime: startTimeStr,
        endTime: endTimeStr,
        date: dateStr,
        realm: 'personal',
        type: 'appointment',
        location: item.location || undefined,
        isExternalSync: true,
        source: 'google',
      };
    });

  return {
    events: convertedEvents,
    accountEmail,
    isWriteAccessGranted,
    totalEventsCount: convertedEvents.length,
  };
};

/**
 * Fetch real Gmail messages and verify access
 */
export const fetchRealGmailMessagesFromApi = async (
  accessToken: string
): Promise<{ messages: MarilunaGmailMessage[]; accountEmail: string }> => {
  // 1. Verify user profile and email
  const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    if (profileRes.status === 401 || profileRes.status === 403) {
      throw new Error('AUTHENTICATION_EXPIRED');
    }
    throw new Error(`Gmail API Fout (${profileRes.status}): ${profileRes.statusText}`);
  }

  const profileData = await profileRes.json();
  const accountEmail = profileData.emailAddress || 'contact@mariluna.be';

  // 2. Fetch list of messages
  const listRes = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listRes.ok) {
    if (listRes.status === 401 || listRes.status === 403) {
      throw new Error('AUTHENTICATION_EXPIRED');
    }
    throw new Error(`Gmail API Fout bij ophalen berichten: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  const rawMsgList: Array<{ id: string; threadId: string }> = listData.messages || [];

  if (rawMsgList.length === 0) {
    return { messages: [], accountEmail };
  }

  // 3. Fetch details for each message
  const detailedMessages: MarilunaGmailMessage[] = [];

  for (const item of rawMsgList.slice(0, 10)) {
    try {
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgRes.ok) continue;

      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];

      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
      const subjectHeader =
        headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Geen onderwerp)';
      const dateHeader =
        headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

      let senderName = fromHeader;
      let senderEmail = fromHeader;

      if (fromHeader.includes('<')) {
        const parts = fromHeader.split('<');
        senderName = parts[0].trim().replace(/^"|"$/g, '');
        senderEmail = parts[1].replace('>', '').trim();
      }

      const formattedDate = new Date(dateHeader).toISOString().split('T')[0];
      const isUnread = msgData.labelIds?.includes('UNREAD') ?? false;

      detailedMessages.push({
        id: msgData.id,
        threadId: msgData.threadId,
        sender: senderName || senderEmail,
        senderEmail: senderEmail,
        subject: subjectHeader,
        date: formattedDate,
        snippet: msgData.snippet || '',
        unread: isUnread,
      });
    } catch (err) {
      console.warn('Fout bij ophalen bericht-details:', err);
    }
  }

  return { messages: detailedMessages, accountEmail };
};

/**
 * Fetch real Google Fit step count data
 */
export const fetchRealGoogleFitStepsFromApi = async (
  accessToken: string
): Promise<{ stepsToday: number; accountEmail: string }> => {
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  let accountEmail = 'patricia@mariluna.be';
  if (userRes.ok) {
    const userData = await userRes.json();
    if (userData.email) accountEmail = userData.email;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const fitRes = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startOfDay.getTime(),
        endTimeMillis: Date.now(),
      }),
    }
  );

  if (!fitRes.ok) {
    if (fitRes.status === 401 || fitRes.status === 403) {
      throw new Error('AUTHENTICATION_EXPIRED');
    }
    throw new Error(`Google Fit API Error (${fitRes.status}): ${fitRes.statusText}`);
  }

  const fitData = await fitRes.json();
  let totalSteps = 0;

  if (fitData.bucket && fitData.bucket.length > 0) {
    for (const b of fitData.bucket) {
      if (b.dataset) {
        for (const ds of b.dataset) {
          if (ds.point) {
            for (const p of ds.point) {
              if (p.value) {
                for (const v of p.value) {
                  if (typeof v.intVal === 'number') totalSteps += v.intVal;
                  else if (typeof v.fpVal === 'number') totalSteps += Math.round(v.fpVal);
                }
              }
            }
          }
        }
      }
    }
  }

  return { stepsToday: totalSteps, accountEmail };
};

/**
 * Fetch real Instagram posts using an Instagram/Meta Graph API Access Token
 */
export const fetchRealInstagramPostsFromApi = async (
  accessToken: string
): Promise<{ posts: InstagramPostItem[]; accountUsername: string }> => {
  const graphRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media{id,caption,media_type,timestamp,like_count,comments_count}&access_token=${accessToken}`
  );

  if (!graphRes.ok) {
    throw new Error(
      `Instagram Graph API Error (${graphRes.status}): Meta Graph Token is ongeldig of niet geautoriseerd.`
    );
  }

  const data = await graphRes.json();
  const accountUsername = data.username ? `@${data.username}` : '@mariluna.studio';

  const rawMediaList = data.media?.data || [];
  const posts: InstagramPostItem[] = rawMediaList.map((item: any) => ({
    id: item.id,
    caption: item.caption || '',
    mediaType: item.media_type || 'IMAGE',
    timestamp: item.timestamp
      ? item.timestamp.split('T')[0]
      : new Date().toISOString().split('T')[0],
    likeCount: item.like_count ?? 0,
    commentsCount: item.comments_count ?? 0,
  }));

  return { posts, accountUsername };
};
