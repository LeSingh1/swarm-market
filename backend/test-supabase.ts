// ============================================================
// Supabase connectivity + table verifier. Run once creds are in .env:
//   npm run test:supabase
// Talks to the REAL tables directly (not through db.ts's Map fallback), so a
// PASS means Supabase genuinely persists data with your key + RLS settings.
// Cleans up after itself.
// ============================================================
import "./env"
import { createClient } from "@supabase/supabase-js"

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY

function ok(msg: string) { console.log(`  ok: ${msg}`) }
function fail(msg: string, extra?: unknown): never {
  console.error(`  FAIL: ${msg}`)
  if (extra) console.error("   ", extra)
  process.exit(1)
}
function check(res: { error: any }, where: string) {
  if (res?.error) fail(`${where} -> ${res.error.message ?? JSON.stringify(res.error)}`)
}

async function main() {
  if (!URL || !KEY) {
    console.log("SUPABASE_URL / key not set in .env — nothing to test yet.")
    console.log("Add SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) to .env,")
    console.log("run schema.sql in the Supabase SQL editor, then: npm run test:supabase")
    process.exit(0)
  }

  console.log(`Connecting to Supabase ${URL}...`)
  const sb = createClient(URL, KEY, { auth: { persistSession: false } })
  const id = `sp_test_${Date.now()}`

  console.log("\n[1] insert into skill_packs")
  check(await sb.from("skill_packs").insert({
    id, name: "TEST pack (safe to delete)", lesson: "verifier", trigger: "verifier",
    domain: "test", rep_score: 0, created_by: "verifier", episode_count: 1,
    created_at: new Date().toISOString(),
  }), "insert skill_packs")
  ok("inserted a pack")

  console.log("[2] read it back")
  const sel = await sb.from("skill_packs").select("*").eq("id", id)
  check(sel, "select skill_packs")
  if (!sel.data?.length) fail("inserted pack did not come back — RLS likely blocks reads/writes (use service key or disable RLS)")
  ok(`read back: "${sel.data[0].name}"`)

  console.log("[3] update rep_score")
  check(await sb.from("skill_packs").update({ rep_score: 1 }).eq("id", id), "update skill_packs")
  const re = await sb.from("skill_packs").select("rep_score").eq("id", id)
  check(re, "reselect")
  if (re.data?.[0]?.rep_score !== 1) fail(`rep_score did not persist (got ${re.data?.[0]?.rep_score})`)
  ok("rep_score persisted as 1")

  console.log("[4] insert agent_runs + install_events")
  check(await sb.from("agent_runs").insert(
    { agent_id: "agent_test", task: "verify", outcome: "success", result: "ok" }), "insert agent_runs")
  ok("logged an agent_run")
  check(await sb.from("install_events").insert({ pack_id: id, agent_id: "agent_test" }), "insert install_events")
  ok("logged an install_event")

  console.log("[5] cleanup test row")
  check(await sb.from("skill_packs").delete().eq("id", id), "delete skill_packs")
  ok("removed the test pack")

  console.log("\nSUPABASE OK — real tables persist reads/writes with your key. db.ts will use them live.")
}

main().catch((e) => { console.error(e); process.exit(1) })
