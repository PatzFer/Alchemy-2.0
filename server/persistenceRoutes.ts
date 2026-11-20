import { Router, Request, Response } from 'express';
import { createSupabasePersistence, isValidAlchemySnapshotPayload } from './supabasePersistence';

const router = Router();

function getBearerToken(req: Request): string | null {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token && token.length <= 8192 && !/\s/.test(token) ? token : null;
}

router.get('/snapshot', async (req: Request, res: Response) => {
  let persistence;
  try {
    persistence = createSupabasePersistence();
  } catch {
    return res.status(503).json({ error: 'Supabase persistence configuration is invalid.' });
  }
  if (!persistence) {
    return res.status(503).json({ error: 'Supabase persistence is not configured.' });
  }
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'A Supabase access token is required.' });
  }
  try {
    const snapshot = await persistence.loadLatestSnapshot(token);
    return res.json({ snapshot });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('(401)') ? 401 :
      error instanceof Error && error.message.includes('(403)') ? 403 : 500;
    return res.status(status).json({ error: 'Unable to load the authenticated owner snapshot.' });
  }
});

router.post('/snapshot', async (req: Request, res: Response) => {
  let persistence;
  try {
    persistence = createSupabasePersistence();
  } catch {
    return res.status(503).json({ error: 'Supabase persistence configuration is invalid.' });
  }
  if (!persistence) {
    return res.status(503).json({ error: 'Supabase persistence is not configured.' });
  }
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'A Supabase access token is required.' });
  }
  const { payload, schemaVersion, source, expectedRevision } = req.body ?? {};
  if (!isValidAlchemySnapshotPayload(payload)) {
    return res.status(400).json({ error: 'A valid Alchemy state object is required.' });
  }
  if (schemaVersion !== undefined && (!Number.isInteger(schemaVersion) || schemaVersion < 1)) {
    return res.status(400).json({ error: 'schemaVersion must be a positive integer.' });
  }
  if (expectedRevision !== undefined && expectedRevision !== null &&
      (!Number.isInteger(expectedRevision) || expectedRevision < 0)) {
    return res.status(400).json({ error: 'expectedRevision must be a non-negative integer.' });
  }
  const allowedSources = ['migration', 'autosave', 'manual_backup', 'restore'];
  if (source !== undefined && !allowedSources.includes(source)) {
    return res.status(400).json({ error: 'Unsupported snapshot source.' });
  }
  try {
    const snapshot = await persistence.saveSnapshot(
      token, payload, schemaVersion ?? 1, source ?? 'autosave',
      expectedRevision === null ? undefined : expectedRevision,
    );
    return res.status(201).json({ snapshot });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('(401)') ? 401 :
      error instanceof Error && error.message.includes('(403)') ? 403 :
      error instanceof Error && error.message.includes('snapshot_revision_conflict') ? 409 : 500;
    return res.status(status).json({ error: 'Unable to save the authenticated owner snapshot.' });
  }
});

export default router;
