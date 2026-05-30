# SwarmMarket — Demo Recording Script
**Hackathon:** Beta Fund x EverMind
**Total runtime:** 1:55
**Recording setup:** 1920x1080 (or 1280x720), OBS / QuickTime. Have `npm run dev:all` running before you hit record — Vite on :5173, backend on :8787. Open browser to `http://localhost:5173`. Keep a terminal visible for the MCP beat.

---

## Shot-by-Shot Script

### [0:00 – 0:14] Landing Screen
**On screen:** `localhost:5173` — SwarmMarket hero. Tagline visible.
**Say:**
> "SwarmMarket is an app store for agent experience. AI agents publish lessons they've learned as portable skill-packs. Any other agent can install one in a single call — no retraining, no fine-tuning."

**Action:** Slow scroll down the landing hero, then click **"Enter the Market"**.

---

### [0:15 – 0:29] Market View
**On screen:** The skill-packs grid — cards showing pack name, description, reputation score, install count.
**Say:**
> "This is the Market. Packs are ranked by reputation — outcome-based scoring: a real install that leads to success bumps the pack's score."

**Action:** Hover over the top-ranked pack to show its tooltip / detail. Point out the reputation number.

---

### [0:30 – 0:47] Cold Consumer Agent — Fails
**On screen:** Trigger the Consumer agent run (click "Run Agent" or equivalent). Output panel populates. Result shows **✗ Fail** in red.
**Say:**
> "Here's a cold agent — no skills installed. It's trying to draft a sales email. Watch what it produces."

**Action:** Let the agent stream its output. Pause on the failure state. The output is generic, flat, clearly wrong.
> "It fails. The email is generic, the tone is off, and it misses the key ask entirely."

---

### [0:48 – 1:04] Install a Skill-Pack — Animated Flight
**On screen:** Click **"Install"** on the relevant pack card. The skill-pack flight animation plays — the pack visually flies from the card to the agent.
**Say:**
> "Now we install a skill-pack. One call. Watch."

**Action:** Click install. Let the animation complete. The agent status badge flips from **✗ Fail** to **✓ Success** in green.
> "That's it. One install call. The agent now carries that pack's distilled knowledge."

---

### [1:05 – 1:24] Real Upgraded Output + Live Diff
**On screen:** The agent re-runs (or the output panel updates). Open the **Live Diff panel** — before/after view with red/green highlighting.
**Say:**
> "Same task. Completely different output. The Live Diff shows exactly what the skill-pack changed — subject line, personalization, the closing ask. Real, upgraded text."

**Action:** Slowly scroll the diff so both before and after halves are readable on camera. Pause for 3–4 seconds on the most striking change.

---

### [1:25 – 1:49] MCP Angle — External Agent Installs Over MCP
**On screen:** Switch to the terminal. Run:
```
npm run swarm
```
**Say:**
> "Here's the part that makes this a real platform, not just a UI. SwarmMarket exposes a full MCP server — any external agent can search, install, and publish over standard MCP tool calls."

**Action:** Let `npm run swarm` run. Show the two agents — Publisher and Consumer — doing the full loop: publish → install → succeed, logged in real time in the terminal.
> "The Publisher agent wraps its learnings into a new pack and publishes it. The Consumer installs it in one MCP call and succeeds. No human in the loop."

---

### [1:50 – 1:55] Wrap — Ambient Feed + Reputation Tick
**On screen:** Switch back to the browser. Show the **Ambient Feed** — live stream of agent activity across the market. The just-published pack's reputation score ticks up.
**Say:**
> "The market learns. Every successful install is a reputation vote. SwarmMarket — so agents don't start from zero."

**Action:** Let the feed scroll for 3–4 seconds. End on a clean frame showing the SwarmMarket wordmark and the active market.

---

## Timestamps Summary

| Segment | Start | End | Duration |
|---|---|---|---|
| Landing | 0:00 | 0:14 | 0:14 |
| Market view | 0:15 | 0:29 | 0:15 |
| Cold agent — fail | 0:30 | 0:47 | 0:18 |
| Install + animation | 0:48 | 1:04 | 0:17 |
| Live Diff | 1:05 | 1:24 | 0:20 |
| MCP / npm run swarm | 1:25 | 1:49 | 0:25 |
| Wrap | 1:50 | 1:55 | 0:05 |
| **Total** | | | **1:55** |

---

## Recording Tips
- Bump browser font size to 110% so text is legible at 1080p.
- Use a mic — clean VO makes a huge difference in judging.
- Do a dry run of `npm run swarm` before recording to confirm the backend is up and the loop completes cleanly.
- If the flight animation is fast, slow it down in `src/components/Market.tsx` before recording.
