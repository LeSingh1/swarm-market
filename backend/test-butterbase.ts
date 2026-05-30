// ============================================================
// Butterbase connectivity + table verifier. Run once creds are in .env:
//   npm run test:butterbase
// Talks to the REAL tables directly (not through db.ts's Map fallback), so a
// PASS means Butterbase genuinely persists data with your key + RLS settings.
// Cleans up after itself.
// ============================================================
import "./env"

const APP_ID = process.env.BUTTERBASE_APP_ID
const API_URL = process.env.BUTTERBASE_API_URL ?? "https://api.butterbase.ai"
const ANON_KEY = process.env.BUTTERBASE_ANON_KEY

function ok(msg: string) { console.log(`  ok: ${msg}`) }
function fail(msg: string, extra?: unknown): never {
  console.error(`  FAIL: ${msg}`)
  if (extra) console.error("   ", extra)
  process.exit(1)
}
function unwrap(res: any, where: string) {
  if (res?.error) fail(`${where} -> ${res.error.message ?? JSON.stringify(res.error)}`)
  return res?.data
}

async function main() {
  if (!APP_ID) {
    console.log("BUTTERBASE_APP_ID not set in .env — nothing to test yet.")
    console.log("Add BUTTERBASE_APP_ID (and BUTTERBASE_ANON_KEY) to .env, create the 3 tables")
    console.log("from schema.sql, then re-run: npm run test:butterbase")
    process.exit(0)
  }

  console.log(`Connecting to Butterbase ${API_URL} (app ${APP_ID})...`)
  const { createClient } = await import("@butterbase/sdk")
  const c: any = createClient({ appId: APP_ID, apiUrl: API_URL, anonKey: ANON_KEY })

  const id = `sp_test_${Date.now()}`
  const row = {
    id, name: "TEST pack (safe to delete)", lesson: "verifier", trigger: "verifier",
    domain: "test", rep_score: 0, created_by: "verifier", episode_count: 1,
    created_at: new Date().toISOString(),
  }

  console.log("\n[1] insert into skill_packs")
  unwrap(await c.from("skill_packs").insert(row), "insert skill_packs")
  ok("inserted a pack")

  console.log("[2] read it back")
  const got = unwrap(await c.from("skill_packs").select("*").eq("id", id), "select skill_packs")
  if (!got?.length) fail("inserted pack did not come back — writes may be blocked by RLS")
  ok(`read back: "${got[0].name}" rep=${got[0].rep_score}`)

  console.log("[3] update rep_score")
  unwrap(await c.from("skill_packs").update({ rep_score: 1 }).eq("id", id), "update skill_packs")
  const bumped = unwrap(await c.from("skill_packs").select("rep_score").eq("id", id), "reselect")
  if (bumped?.[0]?.rep_score !== 1) fail(`rep_score did not persist (got ${bumped?.[0]?.rep_score})`)
  ok("rep_score persisted as 1")

  console.log("[4] insert agent_runs + install_events")
  unwrap(await c.from("agent_runs").insert(
    { agent_id: "agent_test", task: "verify", outcome: "success", result: "ok" }), "insert agent_runs")
  ok("logged an agent_run")
  unwrap(await c.from("install_events").insert({ pack_id: id, agent_id: "agent_test" }), "insert install_events")
  ok("logged an install_event")

  console.log("[5] cleanup test row")
  unwrap(await c.from("skill_packs").delete().eq("id", id), "delete skill_packs")
  ok("removed the test pack")

  console.log("\nBUTTERBASE OK — real tables persist reads/writes with your key. db.ts will use them live.")
}

main().catch((e) => { console.error(e); process.exit(1) })
