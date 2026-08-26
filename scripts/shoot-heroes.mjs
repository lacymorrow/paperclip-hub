import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.resolve(fileURLToPath(new URL("../public/concepts", import.meta.url)));
const exe = process.env.PW_CHROME ||
  "/Users/lacy/Library/Caches/ms-playwright/chromium-1208/chrome-mac/Chromium.app/Contents/MacOS/Chromium";

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("file://" + path.join(dir, "hero-options.html"), { waitUntil: "networkidle" });
await page.waitForTimeout(700); // let webfonts settle

// full comparison sheet
await page.screenshot({ path: path.join(dir, "hero-options.png"), fullPage: true });
console.log("shot hero-options (sheet)");

// each frame individually
const frames = await page.locator(".frame").all();
for (let i = 0; i < frames.length; i++) {
  await frames[i].screenshot({ path: path.join(dir, `hero-${i + 1}.png`) });
  console.log("shot hero-" + (i + 1));
}
await browser.close();
