import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MarilunaGmailMessage } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);

let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignInForService = async (
  scopes: string[] = ['https://www.googleapis.com/auth/gmail.readonly']
): Promise<{ user: User; accessToken: string; email: string }> => {
  const provider = new GoogleAuthProvider();
  scopes.forEach((sc) => provider.addScope(sc));

  const result = await signInWithPopup(firebaseAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Geen OAuth access token ontvangen van Google.');
  }

  cachedAccessToken = credential.accessToken;
  const email = result.user.email || 'contact@mariluna.be';

  return { user: result.user, accessToken: cachedAccessToken, email };
};

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
    throw new Error(`Gmail API Fout: ${profileRes.statusText}`);
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
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Geen onderwerp)';
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

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
