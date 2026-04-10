import { Recursiv } from '@recursiv/sdk';
import { PROJECT_ID } from './recursiv';

const DB_NAME = 'default';

export async function query<T = any>(sdk: Recursiv, sql: string, params?: unknown[]): Promise<T[]> {
  const res = await sdk.databases.query({
    project_id: PROJECT_ID,
    database_name: DB_NAME,
    sql,
    params,
  });
  return (res.data?.rows ?? []) as T[];
}
