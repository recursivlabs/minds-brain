import { Recursiv } from '@recursiv/sdk';
import { query, migrate } from './db';

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

// ── Migration ──────────────────────────────────────────────────────────────

const MIGRATION = [
  `CREATE TABLE IF NOT EXISTS pipeline (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    stage TEXT NOT NULL DEFAULT 'lead',
    deal_value INTEGER,
    contact_name TEXT NOT NULL DEFAULT '',
    contact_role TEXT NOT NULL DEFAULT '',
    last_contact DATE,
    next_step TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

let _migrated = false;

export async function ensurePipelineTable(sdk: Recursiv) {
  if (_migrated) return;
  await migrate(sdk, MIGRATION);
  _migrated = true;
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function listDeals(sdk: Recursiv): Promise<Deal[]> {
  await ensurePipelineTable(sdk);
  return query<Deal>(sdk, `SELECT * FROM pipeline ORDER BY priority ASC, updated_at DESC`);
}

export async function createDeal(sdk: Recursiv, deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Promise<Deal[]> {
  await ensurePipelineTable(sdk);
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

// ── Seed data ──────────────────────────────────────────────────────────────

export const SEED_DEALS: Omit<Deal, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Solix Cloud Partnership',
    company: 'Solix',
    stage: 'proposal',
    deal_value: 75000,
    contact_name: 'Akshay Kumar',
    contact_role: 'VP of Alliances Worldwide',
    last_contact: '2026-04-10',
    next_step: 'Send paid POC proposal ($15-25K) — no more free demos',
    notes: '3 demos done (Suresh, Sai, Akshay). ISV/marketplace positioning. John (board) is internal advocate. 17 AI engineers scaling to 45. Risk: 6 weeks of "reviewing internally", no money discussed yet.',
    priority: 1,
  },
  {
    name: 'KEMPT Home Management',
    company: 'KEMPT',
    stage: 'negotiation',
    deal_value: 250000,
    contact_name: 'Kit',
    contact_role: 'Founder',
    last_contact: '2026-04-10',
    next_step: 'Build email ingestion (Gmail API) — top priority for next 2 weeks',
    notes: 'Active on platform, TestFlight rollout to 10-15 users. B2B2C broker model launching mid-June in Denver. Larry (uncle) investing $250-500K, prefers equity over cash. $10/mo per homeowner after trial.',
    priority: 1,
  },
  {
    name: 'Databricks Built On Program',
    company: 'Databricks',
    stage: 'lead',
    deal_value: null,
    contact_name: 'Nolan',
    contact_role: 'Account Executive (frat brother)',
    last_contact: '2026-04-06',
    next_step: 'Build demo video of multi-agent coordination and send to Nolan',
    notes: 'AgentBricks is their multi-agent direction. Built On Program, MCP Marketplace, startup credits available. Acquisition path precedent (Neon ~$1B). Nolan will pull partners into deals when they strengthen his position.',
    priority: 2,
  },
  {
    name: 'IR Workflow Automation',
    company: 'AutoNation',
    stage: 'lead',
    deal_value: null,
    contact_name: 'Bryan Klosterc',
    contact_role: 'Investor Relations',
    last_contact: '2026-04-10',
    next_step: 'Follow-up call this weekend or after earnings — go deeper on both product ideas',
    notes: 'W&L classmate. Winning AI awards for IR innovation, speaking at events. Has 2 product ideas: IR quarterly cycle automation (9 phases → 3 days) and IR social platform (~3-4K US professionals). Credibility window is hot but temporary.',
    priority: 2,
  },
  {
    name: 'Elevea.ai API Swap',
    company: 'Elevea.ai',
    stage: 'demo',
    deal_value: 5000,
    contact_name: 'Carleton',
    contact_role: 'Founder',
    last_contact: '2026-04-08',
    next_step: 'Build demo showing memory-aware analysis vs stateless on same survey data',
    notes: 'Org intelligence startup. React + Supabase + 3 stateless Claude endpoints. Perfect candidate for "API swap" GTM motion. Builder plan ($49/mo + usage) + $2-5K support. Validates the existing-apps GTM motion.',
    priority: 3,
  },
];

export async function seedIfEmpty(sdk: Recursiv) {
  await ensurePipelineTable(sdk);
  const existing = await query(sdk, `SELECT COUNT(*) as count FROM pipeline`);
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) return;
  for (const deal of SEED_DEALS) {
    await createDeal(sdk, deal);
  }
}
