import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

if (files.length === 0) {
  throw new Error('No Supabase SQL migrations found.');
}

const versions = new Map<string, string>();
for (const file of files) {
  const version = file.split('_')[0];
  if (!/^\d{14}$/.test(version)) {
    throw new Error(`Migration filename must start with a 14-digit timestamp: ${file}`);
  }
  const existing = versions.get(version);
  if (existing) {
    throw new Error(`Duplicate migration version ${version}: ${existing} and ${file}`);
  }
  versions.set(version, file);
}

const sql = (await Promise.all(files.map((file) => readFile(join(migrationsDir, file), 'utf8')))).join('\n');
const requiredTables = [
  'owner_profiles',
  'app_state_snapshots',
  'security_passkeys',
  'security_totp',
  'security_recovery_codes',
  'security_sessions',
  'integration_connections',
  'audit_events',
];
for (const table of requiredTables) {
  if (!new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\b`, 'i').test(sql)) {
    throw new Error(`Required persistence table is missing: public.${table}`);
  }
  if (!new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i').test(sql)) {
    throw new Error(`Row Level Security is not enabled for public.${table}`);
  }
}

if (!/revoke\s+all\s+on\s+public\.app_state_snapshots\s+from\s+anon\s*,\s*authenticated/i.test(sql)) {
  throw new Error('Snapshot table must not be directly accessible to browser roles.');
}
if (!/grant\s+select\s+on\s+public\.app_state_snapshots\s+to\s+service_role/i.test(sql)) {
  throw new Error('Snapshot table must grant server-role read access.');
}

const serverOnlyTables = [
  'security_passkeys',
  'security_totp',
  'security_recovery_codes',
  'security_sessions',
  'integration_connections',
  'audit_events',
];
for (const table of serverOnlyTables) {
  if (!new RegExp(`revoke\\s+all\\s+on\\s+public\\.${table}\\s+from\\s+anon\\s*,\\s*authenticated`, 'i').test(sql)) {
    throw new Error(`Server-only privileges are not revoked for public.${table}`);
  }
}

if (!/owner_id\s*=\s*\(select\s+auth\.uid\(\)\)/i.test(sql)) {
  throw new Error('Owner-scoped RLS policies using auth.uid() were not found.');
}


if (!new RegExp("alter\\s+table\\s+public\\.app_state_snapshots[\\s\\S]*?add\\s+column\\s+source\\s+text", "i").test(sql)) {
  throw new Error('Snapshot source attribution column is missing.');
}
if (!new RegExp("create\\s+or\\s+replace\\s+function\\s+public\\.save_app_state_snapshot\\s*\\(", "i").test(sql)) {
  throw new Error('Atomic owner-scoped snapshot revision RPC is missing.');
}
if (!new RegExp("security\\s+definer[\\s\\S]*?set\\s+search_path\\s*=\\s*''", "i").test(sql)) {
  throw new Error('Snapshot SECURITY DEFINER RPC must pin an empty search_path.');
}
if (!new RegExp("pg_advisory_xact_lock\\s*\\(", "i").test(sql)) {
  throw new Error('Snapshot revision allocation is not protected by a transaction-scoped lock.');
}
if (!new RegExp("revoke\\s+all\\s+on\\s+function\\s+public\\.save_app_state_snapshot\\s*\\([^;]+?\\)\\s+from\\s+public\\s*,\\s*anon\\s*,\\s*authenticated", "i").test(sql)) {
  throw new Error('Snapshot RPC must be revoked from public, anon and authenticated roles.');
}
if (!new RegExp("grant\\s+execute\\s+on\\s+function\\s+public\\.save_app_state_snapshot\\s*\\([^;]+?\\)\\s+to\\s+service_role", "i").test(sql)) {
  throw new Error('Snapshot RPC must be executable by service_role.');
}

process.stdout.write(`Supabase migration checks passed: ${files.length} migration(s), unique versions, required tables, RLS and server-only grants.\\n`);
