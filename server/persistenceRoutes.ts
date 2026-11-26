import { Router, Request, Response } from 'express';
import { createSupabasePersistence } from './supabasePersistence';
import { requireAppAuth } from './security';

const router = Router();

const SNAPSHOT_ENCRYPTION_BLOCKED = {
  error: 'Cloud snapshots are disabled until application-level encryption and key-rotation tests are complete.',
  code: 'snapshot_encryption_not_ready',
};

function checkSupabaseConfiguration(res: Response): boolean {
  try {
    if (!createSupabasePersistence()) {
      res.status(503).json({ error: 'Supabase persistence is not configured.' });
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ error: 'Supabase persistence configuration is invalid.' });
    return false;
  }
}

// Deliberately disabled for now: integrity hashes are not encryption. No app state
// may be written to plaintext JSONB until owner-bound AES-GCM encryption,
// key rotation and restore tests have been completed.
router.get('/snapshot', (_req: Request, res: Response) => {
  if (!checkSupabaseConfiguration(res)) return;
  return res.status(503).json(SNAPSHOT_ENCRYPTION_BLOCKED);
});

router.post('/snapshot', (_req: Request, res: Response) => {
  if (!checkSupabaseConfiguration(res)) return;
  return res.status(503).json(SNAPSHOT_ENCRYPTION_BLOCKED);
});

// The app-facing endpoints use the HttpOnly owner session, but remain locked by
// the same encryption release gate. Authentication is checked before this handler.
router.get('/app-snapshot', requireAppAuth, (_req: Request, res: Response) => {
  if (!checkSupabaseConfiguration(res)) return;
  return res.status(503).json(SNAPSHOT_ENCRYPTION_BLOCKED);
});

router.post('/app-snapshot', requireAppAuth, (_req: Request, res: Response) => {
  if (!checkSupabaseConfiguration(res)) return;
  return res.status(503).json(SNAPSHOT_ENCRYPTION_BLOCKED);
});

export default router;
