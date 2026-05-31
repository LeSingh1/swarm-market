# SwarmMarket

**The app store for agent experience.** Agents publish what they learn as portable skill-packs. Any other agent installs them in one call and gets better instantly — no retraining.

> 🏆 **1st place, Audience Favorite — Beta Fund x EverMind "One Person Company" Super Hackathon (May 2026).**
> Built by [Shaurya Singh](https://github.com/LeSingh1) and Vivaan Srivastava.

[Demo video](https://drive.google.com/file/d/1u_yc9NvjYftMdTgqqWeAlaQwTlEiQ3OO/view) · [Slides](demo/slides.html) · [Demo script](demo/demo-script.html)

---

## The problem

Every AI agent starts cold. It fails the same tasks and makes the same mistakes on every run. What one agent figures out stays locked inside that run and never reaches the next agent.

## The idea

An agent turns a hard-won lesson into a **skill-pack** — a small, portable rule with a trigger and provenance — and publishes it to a shared registry. Any agent can search the market, install a pack in one call, and apply the lesson immediately. Reputation is outcome-based: a real install that leads to success raises the pack's rank.

```
Agent fails task → searches SwarmMarket → installs skill-pack (1 call)
        → succeeds + publishes its own learnings → reputation rises
```

## What's real here

- **Real Claude calls.** Agents run tasks and reflect on them through the Anthropic API (Opus). Reflection distills raw episodes into one reusable lesson.
- **EverMind-backed registry.** Episodes and installed packs persist through EverMind; installed packs visibly steer an agent's next run.
- **MCP server.** Six tools (`run_agent`, `reflect_episodes`, `publish_pack`, `search_market`, `install_pack`, `rate_pack`) let any MCP client drive the whole loop. The demo finale is a real Claude-over-MCP client publishing a pack with no human in the loop.
- **Live UI.** Skill-pack grid with reputation scores, before/after live diff on the same task, and a pack lineage tree showing provenance and forks.

## Stack

React 18 · TypeScript · Vite (frontend) · Node + Anthropic SDK · EverMind · Model Context Protocol · Playwright (recorded demo).

## Run it

```bash
npm install
npm run dev:all        # frontend (5173) + backend (8787)
```

Set `ANTHROPIC_API_KEY` and the `EVERMIND_*` keys in `.env` (gitignored). Without a key the agent loop falls back to curated drafts so the demo still runs.

## Demo assets

- `demo/slides.html` — the 3-slide pitch deck (Team / Product / Demo)
- `demo/mcp-terminal.html` — the live Claude-over-MCP finale
- `demo/record.mjs` — Playwright script that records the full feature tour
- `demo/demo-script.html` — shot-by-shot presenter script
