import { createClient } from '@supabase/supabase-js'
import type { AgentRun, SkillPack } from "../src/types/contract"

const db = createClient(
  process.env.SUPABASE_URL ?? 'https://zztzaxmtwyrdkaarhkvz.supabase.co',
  process.env.SUPABASE_KEY ?? 'sb_publishable_QSUNFhocvqpWCMWJh8PmNw_RnCLICiE'
)

const TABLE = 'skill_packs'

// Supabase stores "trigger" (reserved SQL word) as "trigger_condition" — map on read/write
function toRow(p: SkillPack) {
  const { trigger, ...rest } = p
  return { ...rest, trigger_condition: trigger }
}

function fromRow(row: Record<string, unknown>): SkillPack {
  const { trigger_condition, ...rest } = row
  return { ...rest, trigger: trigger_condition } as SkillPack
}

export async function upsertPack(p: SkillPack): Promise<void> {
  const { error } = await db.from(TABLE).upsert(toRow(p))
  if (error) throw new Error(error.message)
}

export async function getPack(id: string): Promise<SkillPack> {
  const { data, error } = await db.from(TABLE).select('*').eq('id', id).single()
  if (error || !data) throw new Error(`pack ${id} not found`)
  return fromRow(data)
}

export async function listPacks(): Promise<SkillPack[]> {
  const { data, error } = await db.from(TABLE).select('*').order('rep_score', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(fromRow)
}

export async function bumpRep(id: string, delta: number): Promise<SkillPack> {
  const current = await getPack(id)
  const { data, error } = await db
    .from(TABLE)
    .update({ rep_score: current.rep_score + delta })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) throw new Error(`pack ${id} not found`)
  return fromRow(data)
}

export async function logRun(_run: AgentRun): Promise<void> {
  // agent_runs table — add when Person A wires it
}

export async function logInstall(_packId: string, _agentId: string): Promise<void> {
  // install_events table — add when Person A wires it
}
