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


if (!/p_expected_revision\s+bigint/i.test(sql) ||
    !/snapshot_revision_conflict/i.test(sql) ||
    !/p_expected_revision\s+is\s+not\s+null[\s\S]*?p_expected_revision\s*<>\s*current_revision/i.test(sql)) {
  throw new Error('Snapshot RPC must enforce optimistic compare-and-swap revision checks.');
}
if (!/revoke\s+all\s+on\s+function\s+public\.save_app_state_snapshot\s*\(uuid,\s*integer,\s*jsonb,\s*text,\s*text,\s*bigint\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i.test(sql)) {
  throw new Error('Revision-aware snapshot RPC must be inaccessible to browser roles.');
}
if (!/grant\s+execute\s+on\s+function\s+public\.save_app_state_snapshot\s*\(uuid,\s*integer,\s*jsonb,\s*text,\s*text,\s*bigint\)\s+to\s+service_role/i.test(sql)) {
  throw new Error('Revision-aware snapshot RPC must be restricted to service_role.');
}


const durableSessionTable = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.security_sessions\s*\(([\s\S]*?)\);/i)?.[1] || '';
for (const column of ['owner_id', 'session_hash', 'authenticated_with', 'expires_at', 'revoked_at']) {
  if (!new RegExp('\\b' + column + '\\b', 'i').test(durableSessionTable)) {
    throw new Error(`Durable security_sessions schema is missing required column: ${column}`);
  }
}
if (!/session_hash\s+text\s+not\s+null\s+unique/i.test(durableSessionTable)) {
  throw new Error('Durable sessions must store a unique hash, never the raw browser session token.');
}
if (!/owner_id\s+uuid\s+not\s+null\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i.test(durableSessionTable)) {
  throw new Error('Durable sessions must be bound to a verified Supabase Auth owner.');
}

const totpTable = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.security_totp\s*\(([\s\S]*?)\);/i)?.[1] || '';
if (!/secret_ciphertext\s+bytea\s+not\s+null/i.test(totpTable) ||
    !/encryption_key_version\s+text\s+not\s+null/i.test(totpTable)) {
  throw new Error('TOTP secrets must be encrypted at rest and retain an encryption key version.');
}
const integrationTable = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.integration_connections\s*\(([\s\S]*?)\);/i)?.[1] || '';
if (!/access_token_ciphertext\s+bytea/i.test(integrationTable) ||
    !/refresh_token_ciphertext\s+bytea/i.test(integrationTable) ||
    !/encryption_key_version\s+text/i.test(integrationTable)) {
  throw new Error('Integration credentials must use encrypted token columns and a key version.');
}
const recoveryTable = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.security_recovery_codes\s*\(([\s\S]*?)\);/i)?.[1] || '';
if (!/code_hash\s+text\s+not\s+null/i.test(recoveryTable) || !/used_at\s+timestamptz/i.test(recoveryTable)) {
  throw new Error('Recovery codes must be stored as one-time hashes, never plaintext values.');
}


const sessionAuthMethods = sql.match(/alter\s+table\s+public\.security_sessions[\s\S]*?add\s+constraint\s+security_sessions_authenticated_with_check[\s\S]*?check\s*\(authenticated_with\s+in\s*\(([^)]*)\)\)/i)?.[1] || '';
for (const method of ['passkey', 'totp', 'recovery_code', 'password']) {
  if (!sessionAuthMethods.includes(`'${method}'`)) {
    throw new Error(`Durable session schema is missing the ${method} authentication method.`);
  }
}

const securityPreferencesRpc = /create\s+or\s+replace\s+function\s+public\.save_alchemy_security_preferences\s*\([\s\S]*?security\s+definer[\s\S]*?set\s+search_path\s*=\s*''[\s\S]*?revoke\s+all\s+on\s+function\s+public\.save_alchemy_security_preferences\s*\(uuid,\s*jsonb\)\s+from\s+public,\s*anon,\s*authenticated[\s\S]*?grant\s+execute\s+on\s+function\s+public\.save_alchemy_security_preferences\s*\(uuid,\s*jsonb\)\s+to\s+service_role/i;
if (!securityPreferencesRpc.test(sql)) {
  throw new Error('Owner security preferences RPC must be pinned, server-only and executable by service_role.');
}

process.stdout.write(`Supabase migration checks passed: ${files.length} migration(s), unique versions, required tables, RLS and server-only grants.\n`);
