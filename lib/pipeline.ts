import { Recursiv } from '@recursiv/sdk';
import { query } from './db';

// ── Types ──────────────────────────────────────────────────────────────────

export type DealStage = 'lead' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Deal {
  id: string;
  name: string;
  company: string;
  stage: DealStage;
  deal_value: number | null;
  contact_name: string;
  contact_role: string;
  last_contact: string | null;
  next_step: string;
  notes: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: '#60a5fa' },
  { key: 'demo', label: 'Demo', color: '#a78bfa' },
  { key: 'proposal', label: 'Proposal', color: '#fbbf24' },
  { key: 'negotiation', label: 'Negotiation', color: '#fb923c' },
  { key: 'closed_won', label: 'Closed Won', color: '#34d399' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#f87171' },
];

// ── CRUD ───────────────────────────────────────────────────────────────────
// Table is created server-side (via psql/MCP). Client only reads/writes rows.

export async function listDeals(sdk: Recursiv): Promise<Deal[]> {
  return query<Deal>(sdk, `SELECT * FROM pipeline ORDER BY priority ASC, updated_at DESC`);
}

export async function createDeal(sdk: Recursiv, deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Promise<Deal[]> {
  return query<Deal>(sdk, `
    INSERT INTO pipeline (name, company, stage, deal_value, contact_name, contact_role, last_contact, next_step, notes, priority)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [deal.name, deal.company, deal.stage, deal.deal_value, deal.contact_name, deal.contact_role, deal.last_contact, deal.next_step, deal.notes, deal.priority]);
}

export async function updateDeal(sdk: Recursiv, id: string, fields: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>>): Promise<Deal[]> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${i}`);
    params.push(value);
    i++;
  }
  sets.push(`updated_at = NOW()`);
  params.push(id);
  return query<Deal>(sdk, `UPDATE pipeline SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
}

export async function deleteDeal(sdk: Recursiv, id: string): Promise<void> {
  await query(sdk, `DELETE FROM pipeline WHERE id = $1`, [id]);
}

// Seed data and migrations are handled server-side (via psql/MCP).
// Claude pushes deal updates to the DB when Jack discusses sales.
