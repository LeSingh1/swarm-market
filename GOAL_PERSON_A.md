# GOAL — Person A (Shaurya): Backend

> Paste this whole file into Cursor / Claude as your kickoff prompt.

## Your goal
Build the backend for **Swarm Market** — an app store for agent experience. One agent
learns a lesson, packages it as a tradeable **skill-pack**, and publishes it to a shared
**EverMind**-backed registry. A second, cold agent searches the store, **installs** the
pack, and instantly behaves better without ever learning it itself.

You own: **Butterbase + EverMind + the agent loop.** Deadline: working end-to-end by
**3:00 PM**, feature freeze **3:15**, submit **3:50**.

## The one demo moment everything serves
Cold consumer agent **fails** → browses the store → clicks **Install** → **immediately
succeeds**, citing a skill it never learned → its rep score ticks up. Make that path
bulletproof and deterministic. Everything else is secondary.

## Files (already scaffolded — build on them, don't rewrite)
- `src/types/contract.ts` — **FROZEN. Do not edit.** Shared types + routes. Build to it exactly.
- `backend/evermind.ts` — thin EverMind wrapper. **Fill the 3 `TODO(workshop)` calls** with the
  real store/recall endpoints from the 10:30 EverMind workshop. This is your #1 task.
- `backend/agent.ts` — `runAgent` + `reflect` (real Claude calls) already drafted.
- `backend/api.ts` — the 6 routes. Wire each into a Butterbase serverless function.
- `backend/db.ts` — Butterbase table helpers (swap the in-memory Map for real Butterbase calls).
- `backend/schema.sql` — create these tables in Butterbase first.

## Build order (= priority order — if only 1–4 work, the demo still wins)
1. **EverMind round-trip.** `storeEpisode` + `recallEpisodes` working end-to-end. Verify
   one memory writes and comes back. Do this DURING the workshop.
2. **Tables + publish.** Create `schema.sql` tables. `postPublish` writes a pack to both
   EverMind (shared `market` namespace) and the `skill_packs` table.
3. **Publisher loop.** `postRun` → `postReflect` produces ONE real skill-pack from real
   Claude calls. Confirm a card-worthy pack object comes out.
4. **Install + apply.** `postInstall` copies a pack into the consumer's EverMind memory.
   `runAgent` pulls installed packs and lets them steer output. **Cold run fails,
   post-install run succeeds** — this is already wired in `agent.ts`; keep it deterministic.
5. **Rate.** `postRate` bumps `rep_score` and keeps the EverMind copy in sync.

## Hard constraints
- **Never edit `contract.ts`.** Person B builds against it in parallel.
- Keep the demo deterministic: cold = fail, installed = success. Don't add a flaky real
  judge unless you're done early.
- Env you need: `ANTHROPIC_API_KEY`, `EVERMIND_API_KEY`, `EVERMIND_BASE_URL`. Never commit `.env`.
- Hand B working endpoints by each checkpoint (12:00 stub, 2:00 publish, 3:00 full E2E).

## Definition of done
`POST /agent/run` (cold, fails) → `POST /agent/reflect` → `POST /market/publish` →
`GET /market/search` returns it → `POST /market/install` → `POST /agent/run` (now succeeds,
`applied_pack_id` set) → `POST /market/rate` bumps rep. All against real EverMind + Butterbase.
