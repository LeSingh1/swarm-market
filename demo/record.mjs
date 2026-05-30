// Records a no-audio screen capture of the full SwarmMarket feature tour.
// Requires the dev servers running (npm run dev:all) at http://localhost:5173.
// Output: demo/video/*.webm  (transcoded to demo/demo.mp4 below)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const W = 1440, H = 810;
const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const pause = (p, ms) => p.waitForTimeout(ms);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  recordVideo: { dir: "demo/video", size: { width: W, height: H } },
});
const page = await ctx.newPage();

try {
  // 1) Landing — the hero
  await page.goto(BASE, { waitUntil: "networkidle" });
  await pause(page, 2600);

  // 2) "See how it works" — scroll the explainer into view
  await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  await pause(page, 4200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(page, 1200);

  // 3) Enter the market
  await page.getByRole("link", { name: /Enter the market/i }).first().click();
  await pause(page, 2600); // hold on the market top — "live action" swarm feed is here

  // 4) Autopublish — Publisher agent: run -> reflect -> publish a NEW pack
  await page.evaluate(() => {
    const label = [...document.querySelectorAll(".panel-label")].find((l) => /publisher/i.test(l.textContent ?? ""));
    label?.closest(".panel")?.querySelector(".btn-run")?.click();
  });
  await page.waitForFunction(() => {
    const label = [...document.querySelectorAll(".panel-label")].find((l) => /publisher/i.test(l.textContent ?? ""));
    const panel = label?.closest(".panel");
    const btn = panel?.querySelector(".btn-run");
    const out = panel?.querySelector(".output .typed")?.textContent ?? "";
    return btn && !btn.disabled && out.length > 30;
  }, { timeout: 30000 });
  await pause(page, 3200); // hold on the freshly published pack

  // 5) Cold consumer run (no skill-pack) -> ✗ Failed
  await page.evaluate(() => {
    const panel = document.getElementById("consumer-avatar")?.closest(".panel");
    panel?.querySelector(".btn-run")?.click();
  });
  await page.waitForFunction(() => {
    const panel = document.getElementById("consumer-avatar")?.closest(".panel");
    const btn = panel?.querySelector(".btn-run");
    const out = panel?.querySelector(".output .typed")?.textContent ?? "";
    return btn && !btn.disabled && out.length > 40;
  }, { timeout: 30000 });
  await pause(page, 3000); // hold on the ✗ Failed state

  // 6) Install the Fintech pack -> flight animation + ✓ Success flip (one call)
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".card")];
    const target = cards.find((c) => /fintech/i.test(c.querySelector(".card-name")?.textContent ?? "")) ?? cards[0];
    target.querySelector(".btn-install")?.click();
  });
  await page.waitForFunction(() => {
    const ok = [...document.querySelectorAll(".outcome.ok")].some((o) => /Success/.test(o.textContent ?? ""));
    const out = document.querySelector(".col-agents .output.bright .typed")?.textContent ?? "";
    return ok && out.length > 40;
  }, { timeout: 30000 });
  await pause(page, 3600); // hold on the ✓ Success state

  // 7) Live Diff — same task, before / after
  await page.evaluate(() => {
    [...document.querySelectorAll(".hint")].find((h) => /before|after/i.test(h.textContent ?? ""))?.click();
  });
  await page.waitForSelector(".ld-modal", { timeout: 8000 });
  await pause(page, 5000); // read the diff
  await page.keyboard.press("Escape");
  await pause(page, 1200);

  // 8) Lineage tree — pack provenance / forks
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /lineage/i.test(b.textContent ?? ""))?.click();
  });
  await page.waitForSelector(".lt-card", { timeout: 8000 });
  await pause(page, 4800); // read the lineage graph
  await page.evaluate(() => document.querySelector(".lt-close")?.click());
  await pause(page, 1200);

  // 9) MCP install path — agents install over MCP, no human
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".card")];
    const target = cards.find((c) => /fintech/i.test(c.querySelector(".card-name")?.textContent ?? "")) ?? cards[0];
    [...target.querySelectorAll("button")].find((b) => b.textContent?.includes("</>"))?.click();
  });
  await page.waitForSelector(".is-snippet-modal", { timeout: 8000 });
  await pause(page, 4200); // read the MCP snippet
  await page.evaluate(() => document.querySelector(".is-snippet-close")?.click());
  await pause(page, 1200);

  // 10) LIVE MCP — a real Claude-over-MCP client publishes a pack (run -> reflect -> publish).
  // Same recording context, so this flows straight on as the finale.
  await page.goto(`${BASE}/demo/mcp-terminal.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.done === "1", { timeout: 60000 });
  await pause(page, 4000); // hold on the published-over-MCP result
} catch (err) {
  console.error("record flow error:", err.message);
} finally {
  await ctx.close(); // flushes the video file
  await browser.close();
}

// Transcode the Playwright webm -> H.264 mp4 (plays everywhere), then clean up.
const webm = readdirSync("demo/video").find((f) => f.endsWith(".webm"));
execFileSync(ffmpeg, [
  "-y", "-i", `demo/video/${webm}`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "20",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "demo/demo.mp4",
], { stdio: "ignore" });
rmSync("demo/video", { recursive: true, force: true });
console.log("wrote demo/demo.mp4");
