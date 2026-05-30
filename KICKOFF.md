# KICKOFF — paste-and-go at 11:10

Skeleton is in this folder. Contract is frozen in `src/types/contract.ts` — **do not edit after 11:20.**

## Build order (= priority order). If only steps 1–4 work, you still have the whole demo.
1. EverMind round-trip (A) — store + recall one memory. **Do this during the 10:30 workshop.**
2. Publisher runs → reflects → publishes a real pack → card appears in store.
3. Consumer runs cold → fails.
4. Install pack → consumer runs again → succeeds → rep ticks up.  ← **MONEY SHOT, bank a recording here (~2:30)**
5. Polish: install animation, before/after, store filling up.

## Person A — Shaurya (backend)
```bash
cd ~/Claude/projects/swarm-market
npm i @anthropic-ai/sdk
# env: ANTHROPIC_API_KEY, EVERMIND_API_KEY, EVERMIND_BASE_URL
```
- Fill the 3 `TODO(workshop)` calls in `backend/evermind.ts` from the EverMind session.
- Create Butterbase tables from `backend/schema.sql`.
- Wire `backend/api.ts` handlers into Butterbase serverless functions (one per route in `contract.API`).
- Real loop lives in `backend/agent.ts` (run + reflect already drafted).

## Person B — Vivaan (frontend + search/rate slice)
```bash
cd ~/Claude/projects/swarm-market
npm create vite@latest . -- --template react-ts   # if not already a Vite app
npm i && npm i -D tailwindcss && npx tailwindcss init
npm run dev   # deploy ASAP for a live URL
```
- Render `<Market/>` from `src/components/` (Market, SkillPackCard, AgentPanel are drafted).
- Own backend slice: `getSearch` + `postRate` in `backend/api.ts` and the Butterbase swaps in `backend/db.ts`.
- Build the **fallback**: screen-record a clean run the moment step 4 works.
- Owns: 2-min video + demo narration.

## Integration checkpoints (60-sec standup each)
- **12:00** — UI shows cards from an API; EverMind stores+returns a memory.
- **2:00** — a real agent run publishes a real pack that shows up in the store.
- **3:00** — full E2E: publish → search → install → success → rep bump.
- **3:15** — FEATURE FREEZE.  **3:50** — SUBMIT (`build0530` via Butterbase MCP).

## Env (.env)
```
ANTHROPIC_API_KEY=
EVERMIND_API_KEY=
EVERMIND_BASE_URL=
VITE_API_BASE_URL=/api
```
