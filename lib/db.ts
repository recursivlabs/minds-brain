import { Recursiv } from '@recursiv/sdk';
import { PROJECT_ID } from './recursiv';

const DB_NAME = 'default';
let _ensured = false;

export async function ensureDb(sdk: Recursiv) {
  if (_ensured) return;
  await sdk.databases.ensure({ project_id: PROJECT_ID, name: DB_NAME });
  _ensured = true;
}

export async function query<T = any>(sdk: Recursiv, sql: string, params?: unknown[]): Promise<T[]> {
  const res = await sdk.databases.query({
    project_id: PROJECT_ID,
    database_name: DB_NAME,
    sql,
    params,
  });
  return (res.data?.rows ?? []) as T[];
}

export async function migrate(sdk: Recursiv, statements: string[]) {
  await ensureDb(sdk);
  for (const sql of statements) {
    try {
      await query(sdk, sql);
    } catch (err: any) {
      console.warn('Migration warning:', err.message);
    }
  }
}
