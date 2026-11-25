import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:18746";
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
});
try {
  for (const [width, height, colorScheme, prefix] of [
    [1440, 1000, "light", ""],
    [768, 1000, "light", "/de"],
    [390, 844, "dark", "/de"],
    [320, 800, "dark", ""],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/architecture/",
      "/contribute/",
      "/community/",
      "/development/",
      "/roadmap/",
      "/devlog/",
    ]) {
      const response = await page.goto(`${base}${prefix}${route}`);
      assert.equal(response.status(), 200);
      assert.equal(
        await page.locator("html").getAttribute("lang"),
        prefix ? "de" : "en",
      );
      assert.equal(await page.locator("main h1").count(), 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${prefix}${route}, ${width}px`,
      );
      assert.equal(await page.locator("iframe").count(), 0);
      const transfers = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      );
      assert.ok(
        transfers < 200_000,
        `Asset transfer budget exceeded at ${prefix}${route}: ${transfers}`,
      );
      if (process.env.AXE_PATH) {
        await page.addScriptTag({ path: process.env.AXE_PATH });
        const results = await page.evaluate(() =>
          window.axe.run({
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
            },
          }),
        );
        assert.deepEqual(
          results.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
          [],
          `${prefix}${route}, ${width}px`,
        );
      }
      if (
        screenshots &&
        ((width === 1440 &&
          ["/", "/contribute/", "/development/"].includes(route)) ||
          (width === 390 && ["/", "/community/"].includes(route)))
      ) {
        await page.screenshot({
          path: join(
            screenshots,
            `erp4us-${route.replaceAll("/", "") || "home"}-${width}.png`,
          ),
          fullPage: true,
        });
      }
      if (route === "/") {
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            document.activeElement.getAttribute("href"),
          ),
          "#content",
        );
        const nav = page.locator(".nav-group").first().locator("summary");
        await nav.focus();
        await page.keyboard.press("Enter");
        assert.ok(await nav.locator("..").evaluate((el) => el.open));
        await page.keyboard.press("Escape");
        assert.equal(await nav.locator("..").evaluate((el) => el.open), false);
        const opposite = colorScheme === "dark" ? "light" : "dark";
        await page.locator("#site-theme").selectOption(opposite);
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          opposite,
        );
        await page.reload();
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          opposite,
        );
        await page.locator("#site-theme").selectOption("system");
      }
      if (
        route === "/contribute/" &&
        (await page.locator("#area-filter").count())
      ) {
        const items = page.locator("#opportunity-list > li");
        assert.ok(await items.count());
        await page.locator("#area-filter").selectOption("docs");
        assert.ok(await items.filter({ visible: true }).count());
        assert.equal(
          await page
            .locator('#opportunity-list > li:not([data-areas~="docs"]):visible')
            .count(),
          0,
        );
        await page.locator("#area-filter").selectOption("");
        assert.equal(
          await items.filter({ visible: true }).count(),
          await items.count(),
        );
        assert.equal(
          await page.locator("body").getAttribute("data-compromised"),
          null,
        );
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "Passed Chromium navigation, locale, theme, filtering, layout and asset-budget checks at 320/390/768/1440 px",
  );
} finally {
  await browser.close();
}
