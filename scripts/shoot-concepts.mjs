import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.resolve(fileURLToPath(new URL("../public/concepts", import.meta.url)));
const out = process.env.SHOT_OUT || dir;
const pages = ["index", "registry", "studio"];

const exe = process.env.PW_CHROME ||
  "/Users/lacy/Library/Caches/ms-playwright/chromium-1208/chrome-mac/Chromium.app/Contents/MacOS/Chromium";

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
for (const name of pages) {
  await page.goto("file://" + path.join(dir, name + ".html"), { waitUntil: "networkidle" });
  await page.waitForTimeout(600); // let webfonts settle
  await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  console.log("shot", name);
}
await browser.close();
