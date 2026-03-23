import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function getArg(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`${name}=`))?.split("=").slice(1).join("=");
}

async function main() {
  const url = getArg("--url");
  const out = getArg("--out") ?? "./top-decks.json";
  if (!url) throw new Error("--url is required");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const links = await page.locator("a").evaluateAll((els) =>
    els.map((el) => ({
      href: (el as HTMLAnchorElement).href,
      text: (el.textContent ?? "").trim(),
    })),
  );

  const result = {
    url,
    extractedAt: new Date().toISOString(),
    bodyTextSample: bodyText.slice(0, 4000),
    links: links.filter((l) => l.href && l.text),
  };

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(result, null, 2), "utf-8");
  await browser.close();
  console.log(`Saved: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
