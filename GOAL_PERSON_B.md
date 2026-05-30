# GOAL — Person B (Vivaan): Frontend + backend slice

> Paste this whole file into Codex / Claude as your kickoff prompt.

## Your goal
Build the **Swarm Market** storefront UI — the thing that wins the room — plus a small
backend slice so Person A isn't a bottleneck, plus the **fallback recording** and the
**2-minute video**. Swarm Market is an app store for agent experience: agents publish
learned **skill-packs** to a shared registry, and other agents **install** them to
instantly get better.

Deadline: working UI by **3:00 PM**, feature freeze **3:15**, record video **3:15–3:45**,
submit **3:50** via Butterbase MCP (`build0530`).

## The one demo moment your UI must sell
Cold agent **fails** → user **browses the store** → clicks **Install** (satisfying
animation) → agent **immediately succeeds** shown side-by-side → **rep score ticks up** →
store visibly fills with packs. This must read from the back of the room in 5 seconds.

## Files (already scaffolded — build on them, don't rewrite)
- `src/types/contract.ts` — **FROZEN. Do not edit.** Types + routes. Build to it exactly.
- `src/lib/api.ts` — typed client, one function per route. Use it; don't hand-roll fetches.
- `src/components/Market.tsx` — main screen: store grid (left) + Publisher/Consumer panels (right).
- `src/components/SkillPackCard.tsx` — the card with Install button + ★ rep badge.
- `src/components/AgentPanel.tsx` — per-agent run + outcome badge (the before/after lives here).

## Your backend slice (own these so A isn't blocking you)
- `getSearch` (`GET /market/search?q=`) and `postRate` (`POST /market/rate`) in `backend/api.ts`.
- The Butterbase swaps in `backend/db.ts` (replace the in-memory Map with real calls).

## Build order (= priority order)
1. **Scaffold + deploy NOW.** `npm create vite@latest . -- --template react-ts`, add Tailwind,
   render `<Market/>`, deploy to get a **live URL** in the first 30 min.
2. **Store grid renders.** Cards from `search()`. Use your own fixtures until A's API is live,
   then drop them. Search box filters.
3. **Agent panels.** Run button → shows result + outcome badge. Cold = ✗ ignored, success = ✓ replied.
4. **The install moment.** Install button → animation → `justInstalled` highlight → rep badge
   bumps. Make it feel good — this is the money shot.
5. **Before/after polish.** Stateless fail vs. post-install success, visually obvious.
6. **Bank the fallback (~2:30).** The MOMENT the full loop works once, screen-record a clean
   run. The video submission uses this if the live run flickers. Do not skip this.

## Hard constraints
- **Never edit `contract.ts`.** A builds against it in parallel.
- Deploy early and keep the live URL green. Big, legible UI > clever UI.
- Env: `VITE_API_BASE_URL=/api`. Never commit `.env`.
- Slides: Slide 1 = team (names, Irvington HS / Fremont, builder cred, team–problem fit).
  Slide 2 = product (one-liner, problem, solution). Video ≤ 2 min.

## Definition of done
On the deployed URL: run Publisher → a card appears in the store → run Consumer cold (fails)
→ Install the card (animation) → run Consumer again (succeeds, before/after visible) → rep
ticks up. Plus: a banked clean screen recording and a ≤2-min video ready to submit.
