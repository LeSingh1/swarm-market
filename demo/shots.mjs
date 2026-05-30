// Render each deck slide to a PNG (1920x1080) for dropping into Google Slides.
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2,
})).newPage();

await page.goto(`${BASE}/demo/slides.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

for (let i = 1; i <= 3; i++) {
  await page.waitForTimeout(900); // let spring-stagger settle
  await page.screenshot({ path: `demo/slide-${i}.png` });
  console.log(`wrote demo/slide-${i}.png`);
  if (i < 3) { await page.keyboard.press("ArrowRight"); }
}
await browser.close();
