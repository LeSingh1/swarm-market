# Swarm Market — Hackathon Battle Plan (Beta Fund X EverMind, May 30)

**Submission deadline: 4:00 PM sharp. Submit via Butterbase MCP, code `build0530`.**
Demo 4:00–5:00, audience vote 5:00–5:30.

---

## ⏱ LIVE TRACKER — keep this open, check it every 30 min
"On track" = you can pass the **on-track test** for the most recent time row. If you can't, you're behind → fire the **if behind** cut and keep moving. Never sit and debug past a checkpoint.

| Time | You should be… | On-track TEST (must be true) | If behind → cut |
|---|---|---|---|
| **10:09–10:30** | Setup | Repo cloned by both · EverMind API key in hand · empty Vite app **deployed to a live URL** | Skip styling, just get the URL live |
| **10:30–11:10** | Workshops | A can store+recall ONE memory in EverMind · B has card components drafted | A: write down the exact EverMind call even if not coded |
| **11:10–11:20** | Freeze contract | `contract.ts` agreed & untouched · demo domain locked (fintech SDR) | — (never skip this) |
| **12:00** | **CHECKPOINT 1** | Store shows cards from an API call · EverMind round-trips a memory | Cards from B's fixtures is fine; real API can lag |
| **1:00** | Post-lunch | `/agent/run` returns a real Claude-written email | Hard-code the task + prompt; don't tune |
| **2:00** | **CHECKPOINT 2** | A real run **publishes a real pack that appears in the store** | One pack only; drop multi-pack |
| **2:30** | 🔴 **BANK RECORDING** | A clean full run is **screen-recorded and saved** | Non-negotiable. Do it the instant the loop works once |
| **3:00** | **CHECKPOINT 3** | Full E2E live: publish → search → install → success → rep bump | If install flaky, demo with the banked recording |
| **3:15** | 🧊 **FEATURE FREEZE** | No new features. Polish + record only | — |
| **3:45** | Assets done | 2-min video cut · 2 slides done | Use the 2:30 banked take for the video |
| **3:50** | 🚀 **SUBMIT** | Submitted via Butterbase MCP (`build0530`) | Submit whatever works; partial > late |
| **4:00** | Deadline | — | — |

**Right-now status (10:09):** you should be finishing **Setup**. If the live Vite URL isn't up yet, that's the one thing to fix before 10:30.

**Golden rule:** build order = priority order. If only **publish + install** ever work, that's still the entire winning demo. Everything after is upside.

---

## What we're building (one line)
An **app store for agent experience**. One agent learns a lesson, packages it as a tradeable **skill-pack**, and publishes it to a shared EverMind-backed registry. A second, cold agent searches the store, **installs** the pack, and instantly behaves better without ever learning it itself. Memory becomes a liquid, tradeable asset.

**The demo money-shot:** cold Agent B fails → browses the Market → clicks Install → immediately succeeds, citing a skill it never learned. "B never learned that. It *bought* it."

## Goals (ranked)
1. **Audience Favorite** — win the room. The store UI + install-moment must read instantly from the back row.
2. **Beta Fellowship** — looks like a real venture: data-network-effect moat for learned behavior.
3. **Most technically impressive EverMind use** — cross-agent capability transfer via a reputation-ranked market.

---

## Team & tooling

| | Person A — Shaurya | Person B — Vivaan |
|---|---|---|
| **Owns** | Full backend: Butterbase + EverMind + agent loop (reflect → extract → publish → search → install → rate) | Frontend (Market storefront, agent panels, install animation, polish) **+ a slice of backend** so we finish by 4 |
| **Tools** | Claude Max 20x (heavy parallel use, fine), Cursor Pro Max | Codex Pro (UI components + B's backend slice), Claude Pro (use sparingly, lower limits) |
| **Also owns** | Slide deck (2 slides) technical content, end-to-end integration | **The recorded mockup fallback**, video recording, demo narration |

**B's backend slice (so A isn't a bottleneck):** the `GET /market/search` + `POST /market/rate` endpoints and the seed/fixtures script. Small, well-bounded, lets B unblock the UI without waiting on A.

---

## The integration contract (FREEZE THIS FIRST — 10 min, both people)
Write this to `src/types/contract.ts` in the first 10 min of build block 1. **Do not change it after.** This is what lets A and B build in parallel without merge hell.

### Skill-pack object
```ts
type SkillPack = {
  id: string;            // "sp_8f3a"
  name: string;          // "Fintech objection: lead with compliance"
  lesson: string;        // the distilled, portable lesson (not a transcript)
  trigger: string;       // when this pack should fire
  domain: string;        // "sdr-outreach"
  rep_score: number;     // starts 0, +1 per good outcome
  provenance: { created_by: string; episode_count: number };
  created_at: string;    // ISO
};
```

### API (Butterbase serverless functions; memory ops go through EverMind)
| Method | Route | Does |
|---|---|---|
| POST | `/agent/run` | Run agent on a task → returns `{actions, outcome, episodes[]}`; writes episodes to EverMind |
| POST | `/agent/reflect` | Distill episodes → one `SkillPack` (real LLM call) |
| POST | `/market/publish` | Persist pack to EverMind long-term memory + Butterbase `skill_packs` table |
| GET | `/market/search?q=` | Return ranked `SkillPack[]` (keyword or single embedding lookup) |
| POST | `/market/install` | Pull pack into a target agent's EverMind memory |
| POST | `/market/rate` | `+1` rep_score after a good outcome |

### Butterbase tables
- `skill_packs` (the registry mirror of the contract object)
- `agent_runs` (run log: agent_id, task, outcome, ts)
- `install_events` (pack_id, agent_id, ts) — powers the "B bought it" moment

### EverMind responsibilities
- **Episodic memory** per agent (raw run history)
- **Long-term store** for published skill-packs (the registry's source of truth)
- Retrieval on install: pack lands in consumer agent's memory and changes its next action

---

## Collaboration workflow
- **Git:** init repo at check-in, push to GitHub immediately so deploy works. Branch by ownership: A on `backend`, B on `frontend`, merge to `main` at each integration checkpoint. Conflicts are rare because file ownership is split.
- **File ownership:** A owns `/backend` (or `/api`). B owns `/src/components`, `/src/pages`. **Shared & frozen:** `/src/types/contract.ts`.
- **Live URL early:** B deploys the Vite app in the first 30 min so we always have a working link. Backend deploys via Butterbase.
- **Sync cadence:** 60-second standup at each hour boundary. "What's green, what's blocked."
- **The golden rule:** if it's 3:15 and a feature isn't working, it's cut. The recorded fallback covers us.

---

## Hour-by-hour (real event schedule)

### 9:54–10:30 — Check-in / snacks → DON'T WASTE IT (setup)
Most teams idle here. We set up so build block 1 is pure code.
- **Both:** redeem Butterbase promo `BUILD0530`, join Discord (`#Butterbase-support`), confirm EverMind workshop access (evermind.ai/workshop), `git init` + GitHub repo.
- **A:** create Butterbase project, get EverMind API key, scaffold `/backend`, confirm one Claude API call works end-to-end.
- **B:** scaffold Vite + React + Tailwind, deploy to get a **live URL now**, stub the Market grid with hardcoded cards.

### 10:30–11:10 — Opening remarks + workshops
- **A:** fully attend the **EverMind workshop** — this is core, nail the memory API (store + retrieve). Note the exact publish/retrieve calls.
- **B:** catch the **Butterbase** setup bits, then peel off to build card components + the install-button animation against the frozen contract.

### 11:10–12:00 — Build block 1 (50 min): foundation + contract
- **First 10 min, together:** write & freeze `contract.ts`. Agree on the demo domain (**SDR outreach / fintech objection** — concrete, legible).
- **A:** EverMind round-trip working — store one episode, retrieve it. Create Butterbase tables. Stub `/agent/run` returning canned episodes.
- **B:** Market storefront renders from `GET /market/search` (A's stub or B's own fixtures). Search bar + cards + rep badges live on the deployed URL.
- **Checkpoint 12:00:** UI shows cards from an API. EverMind stores+returns a memory. Merge to `main`.

### 12:00–1:00 — Lunch (eat, but keep momentum — free hour most teams waste)
- **A:** real agent loop skeleton — `/agent/run` calls Claude on the SDR task, returns real actions + episodes; start `/agent/reflect` (episodes → one SkillPack).
- **B:** Publisher + Consumer agent panels (two columns), install animation polished, before/after result component.

### 1:00–4:00 — Build block 2 (the meat, 3 hrs)

**1:00–2:00 — Core publish loop**
- **A:** Publisher agent end-to-end: run task → reflect → **extract a real skill-pack** → `POST /market/publish` to EverMind + Butterbase. A new card appears in the store with rep 0.
- **B:** wire UI to the **live** API (drop fixtures). Publishing visibly adds a card. Search returns real packs.
- **Checkpoint 2:00:** a real agent run produces a real pack that shows up in the store. Merge.

**2:00–3:00 — The install money-moment**
- **A:** Consumer agent: cold run **fails** → `GET /market/search` finds A's pack → `POST /market/install` into consumer's EverMind memory → next run **visibly applies the lesson and succeeds** → `POST /market/rate` bumps rep.
- **B:** the install animation + **before/after visual** (stateless fail vs. post-install success, side by side). Rep score ticks up on screen.
- **⚠️ At ~2:30, the moment the loop works once:** B **screen-records a clean full run** → this is the **mockup fallback**. Bank it now, don't wait.
- **Checkpoint 3:00:** full E2E live: publish → search → install → success → rep bump. Merge.

**3:00–3:15 — INTEGRATION + FEATURE FREEZE**
- Full end-to-end run on the deployed URL, twice. Fix only what breaks the demo path. **No new features after 3:15. None.**

**3:15–3:45 — Polish + record + slides**
- **B:** record the **2-min video demo** (live run; if anything flickers, use the 2:30 banked recording). Show: cold agent fails → browse store → install → instant success → rep ticks up → store filling with packs.
- **A:** build the 2 required slides (below) + rehearse narration with B.

**3:45–4:00 — SUBMIT (buffer for gremlins)**
- Submit via **Butterbase MCP**, submission code `build0530`. **Target submit time 3:50**, not 3:59. Leave 10 min for upload/MCP issues.

### 4:00–5:00 — Demo (3 min / team)
- Lead with the money-shot in the first 20 seconds. Narrate the install moment, point at the rep score. End on the store filling up = network effect.

### 5:00–5:30 — Audience vote & awards.

---

## Required submission assets
**Slide 1 — Team:** names, school (Irvington HS / Fremont), relevant builder cred, team–problem fit.
**Slide 2 — Product:** one-liner ("App store for agent experience"), problem (agents re-learn the same lessons in isolation — billions of redundant tokens), solution (extract → publish → reputation-rank → instant transfer via EverMind).
**Video (≤2 min):** the working install-moment demo.

## Demo script (memorize the first 30 seconds)
1. "Every AI agent learns the same lessons over and over, in isolation. We made experience tradeable."
2. Publisher agent grinds a task → reflects → **publishes a skill-pack** (card appears, rep 0).
3. Spin up **cold Agent B** → it fails the same task.
4. B **browses the Market**, finds the pack, clicks **Install**.
5. B **immediately succeeds**, citing the installed skill. *Point at the screen:* "B never learned that. It bought it."
6. Outcome feeds back → **rep ticks up**. "The market curates itself."
7. Pan to the store filling with packs: "The more agents on the network, the smarter every agent gets. That's the moat."

---

## Risk register
| Risk | Mitigation |
|---|---|
| EverMind API fights us | A de-risks the store+retrieve round-trip during the 10:30 workshop, before any feature depends on it. Thin memory interface so we can see exactly where it breaks. |
| Live agents flake on stage | **Banked screen recording at 2:30.** Video submission uses the clean take regardless. |
| Merge hell | Frozen `contract.ts` + file-ownership split + hourly merges. |
| Run out of time | Hard feature freeze 3:15, submit 3:50. Build order is priority order — if we only get publish+install working, that's still the whole demo. |
| Butterbase MCP submission breaks | Submit at 3:50 with 10 min buffer; ask in `#Butterbase-support` early if MCP setup is shaky. |
| Search too fancy | Keyword match first. Only add embedding lookup if time leftover. |

## Cut-list (drop in this order if behind)
1. Embedding/semantic search → keyword match.
2. Multiple skill-packs → one great pack + one consumer.
3. Rep decay / multi-rating → flat `+1` counter.
4. Memory inspector panel → cut entirely.
**Never cut:** the store UI, the install animation, the before/after, the EverMind round-trip.

---

## Setup checklist (DO NOW, before 10:30)
**Both:**
- [ ] `git clone https://github.com/LeSingh1/swarm-market && cd swarm-market`
- [ ] Redeem Butterbase promo `BUILD0530`, join Discord `#Butterbase-support`
- [ ] Confirm EverMind workshop access (evermind.ai/workshop)
- [ ] Create `.env` (NOT committed) from the keys below

**A (Shaurya):**
- [ ] `npm i @anthropic-ai/sdk`
- [ ] Get `EVERMIND_API_KEY` + base URL; confirm ONE Claude API call returns text
- [ ] Open `GOAL_PERSON_A.md`, paste into Cursor

**B (Vivaan):**
- [ ] `npm create vite@latest . -- --template react-ts && npm i` + Tailwind
- [ ] `npm run dev`, then deploy → **get a live URL now** (Vercel/Netlify)
- [ ] Open `GOAL_PERSON_B.md`, paste into Codex

**`.env`**
```
ANTHROPIC_API_KEY=
EVERMIND_API_KEY=
EVERMIND_BASE_URL=
VITE_API_BASE_URL=/api
```

---

## API quick reference (build to `contract.ts`)
| Method | Route | In → Out |
|---|---|---|
| POST | `/agent/run` | `{agent_id, task}` → `AgentRun{actions, outcome, result, applied_pack_id?, episodes}` |
| POST | `/agent/reflect` | `{agent_id, episodes}` → `{pack: SkillPack}` |
| POST | `/market/publish` | `{pack}` → `{pack}` (stored in EverMind `market` ns + `skill_packs`) |
| GET | `/market/search?q=` | → `{packs: SkillPack[]}` (ranked by rep_score) |
| POST | `/market/install` | `{agent_id, pack_id}` → `{ok, pack}` (copies into agent's EverMind memory) |
| POST | `/market/rate` | `{pack_id, delta:1}` → `{pack}` (bumps rep) |

`SkillPack = { id, name, lesson, trigger, domain, rep_score, provenance{created_by, episode_count}, created_at }`

---

## APPENDIX A — Person A prompt (paste into Cursor / Claude)
> Build the backend for **Swarm Market** — an app store for agent experience. One agent learns a lesson, packages it as a tradeable **skill-pack**, and publishes it to a shared **EverMind**-backed registry. A second, cold agent searches the store, **installs** the pack, and instantly behaves better without ever learning it. You own Butterbase + EverMind + the agent loop. Working E2E by 3:00, freeze 3:15, submit 3:50.
>
> **Demo moment to serve:** cold consumer fails → Install → immediately succeeds → rep ticks up. Keep it deterministic.
>
> **Files (scaffolded, build on them):** `contract.ts` (FROZEN, never edit), `backend/evermind.ts` (fill 3 `TODO(workshop)` calls from the EverMind session — #1 task), `backend/agent.ts` (run+reflect drafted), `backend/api.ts` (6 routes → Butterbase functions), `backend/db.ts`, `backend/schema.sql`.
>
> **Build order (= priority):** 1) EverMind store+recall round-trip. 2) tables + `postPublish`. 3) publisher `run→reflect` makes ONE real pack. 4) `install` + apply (cold fails, installed succeeds). 5) `rate` bumps rep.
>
> **Constraints:** never edit `contract.ts`; keep cold=fail/installed=success; never commit `.env`; hand B working endpoints at each checkpoint.
>
> **Done:** run(cold,fail)→reflect→publish→search→install→run(success, applied_pack_id)→rate, all on real EverMind + Butterbase.

## APPENDIX B — Person B prompt (paste into Codex / Claude)
> Build the **Swarm Market** storefront UI (the thing that wins the room) + a small backend slice so A isn't a bottleneck + the fallback recording + the 2-min video. Agents publish learned **skill-packs** to a shared registry; other agents **install** them to instantly get better. UI working by 3:00, freeze 3:15, video 3:15–3:45, submit 3:50.
>
> **Demo moment your UI must sell:** cold agent fails → browse store → Install (animation) → succeeds side-by-side → rep ticks up → store fills. Readable from the back row in 5s.
>
> **Files (scaffolded):** `contract.ts` (FROZEN), `src/lib/api.ts` (typed client), `src/components/Market.tsx` (store + agent panels), `SkillPackCard.tsx` (Install + rep badge), `AgentPanel.tsx` (run + before/after).
>
> **Your backend slice:** `getSearch` + `postRate` in `backend/api.ts`; Butterbase swaps in `backend/db.ts`.
>
> **Build order (= priority):** 1) scaffold + deploy NOW for a live URL. 2) store grid from `search()`. 3) agent panels with outcome badges. 4) the install moment + animation + rep bump. 5) before/after polish. 6) **bank a clean screen recording ~2:30**.
>
> **Constraints:** never edit `contract.ts`; deploy early, keep URL green; big legible UI > clever; never commit `.env`. Slides: 1=team (Irvington HS/Fremont, cred, team-problem fit), 2=product (one-liner, problem, solution). Video ≤2 min.
>
> **Done:** on the live URL — run Publisher → card appears → run Consumer cold (fails) → Install → run again (succeeds, before/after) → rep ticks up. Plus a banked recording + ≤2-min video.
