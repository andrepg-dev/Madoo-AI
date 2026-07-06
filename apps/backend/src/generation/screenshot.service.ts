import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import puppeteer, { type Page } from "puppeteer";
import os from "node:os";

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);
  private launchDiagnosticsLogged = false;

  private static defaultPuppeteerCacheDir(): string {
    return `${os.homedir()}/.cache/puppeteer`;
  }

  private diagnosticHint(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    const executablePathEnv = process.env.PUPPETEER_EXECUTABLE_PATH ?? "(not set)";
    const cacheDirEnv = process.env.PUPPETEER_CACHE_DIR ?? ScreenshotService.defaultPuppeteerCacheDir();

    if (raw.includes("Could not find Chrome")) {
      return [
        "Red flag: Puppeteer Chrome binary missing.",
        `PUPPETEER_EXECUTABLE_PATH=${executablePathEnv}`,
        `PUPPETEER_CACHE_DIR=${cacheDirEnv}`,
        "Fix: run `npx puppeteer browsers install chrome` from apps/backend.",
        "Alt fix: set PUPPETEER_EXECUTABLE_PATH to system Chrome/Chromium binary.",
      ].join(" ");
    }

    if (raw.includes("No usable sandbox") || raw.includes("setuid sandbox")) {
      return [
        "Red flag: Chromium sandbox issue.",
        "Runtime likely blocks sandbox. Keep --no-sandbox flags or configure sandbox support.",
      ].join(" ");
    }

    if (raw.includes("error while loading shared libraries")) {
      return [
        "Red flag: missing OS libs required by Chromium.",
        "Install runtime deps for Puppeteer/Chrome in host image.",
      ].join(" ");
    }

    if (raw.includes("Failed to launch the browser process") || raw.includes("ENOENT")) {
      return [
        "Red flag: browser launch failed.",
        `Check executable path env: ${executablePathEnv}`,
        `Check Puppeteer cache: ${cacheDirEnv}`,
      ].join(" ");
    }

    return "Red flag: screenshot pipeline failed for unknown launch/render reason. Inspect stack trace.";
  }

  /**
   * `domcontentloaded` fires before image resources finish downloading, so a
   * naive capture renders blank/missing images. Wait until every asset has
   * settled (load or error) and web fonts are ready, bounded by a timeout so a
   * slow/broken asset can't hang the capture forever. Runs as a string so the
   * browser-context DOM globals don't need the TS `dom` lib on the backend.
   *
   * Covers BOTH `<img>` elements AND CSS `background-image` URLs — email heroes
   * and cards are frequently built with `background-image`, which `document.images`
   * does not track. Without preloading those, the capture fires before the
   * background downloads and the element renders as its flat fallback color.
   */
  private async waitForAssets(page: Page): Promise<void> {
    const script = `(async () => {
      const waiters = [];

      for (const img of Array.from(document.images)) {
        if (img.complete) continue;
        waiters.push(new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }));
      }

      // Collect every CSS background-image URL (a value can hold several layers
      // and gradients, e.g. "linear-gradient(...), url(a), url(b)").
      const urls = new Set();
      const re = /url\\(\\s*(['"]?)([^'")]+)\\1\\s*\\)/g;
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const bg = getComputedStyle(el).backgroundImage;
        if (!bg || bg === 'none') continue;
        let m;
        while ((m = re.exec(bg)) !== null) {
          const u = m[2];
          if (u && !u.startsWith('data:')) urls.add(u);
        }
      }
      for (const u of urls) {
        waiters.push(new Promise((resolve) => {
          const im = new Image();
          im.addEventListener('load', resolve, { once: true });
          im.addEventListener('error', resolve, { once: true });
          im.src = u;
        }));
      }

      await Promise.all(waiters);
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) {}
      }
    })()`;

    await Promise.race([
      page.evaluate(script).catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 12_000)),
    ]);
  }

  /**
   * Wrap `{{variable}}` merge tags in colored spans, mirroring the in-app
   * preview (`highlightMergeTags` on the client). Only touches text nodes — never
   * attributes like href/style — so links stay intact. Runs as a string so the
   * browser-context DOM globals don't need the TS `dom` lib on the backend.
   */
  private async highlightMergeTags(page: Page): Promise<void> {
    const script = String.raw`(() => {
      const PATTERN = /\{\{[^}]+\}\}/;
      const SPLIT = /(\{\{[^}]+\}\})/g;
      const STYLE = "color:#2f6fea;background:rgba(47,111,234,0.12);border-radius:3px;padding:0 3px;font-weight:600;";
      if (!document.body) return;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const targets = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeValue && PATTERN.test(node.nodeValue)) targets.push(node);
      }
      for (const textNode of targets) {
        const frag = document.createDocumentFragment();
        for (const part of textNode.nodeValue.split(SPLIT)) {
          if (!part) continue;
          if (PATTERN.test(part)) {
            const span = document.createElement('span');
            span.setAttribute('style', STYLE);
            span.textContent = part;
            frag.appendChild(span);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        }
        if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
      }
    })()`;

    await page.evaluate(script).catch(() => undefined);
  }

  async screenshotHtml(
    html: string,
    options: {
      type?: "png" | "jpeg";
      quality?: number;
      highlightVariables?: boolean;
      // Cap the captured height (px). A very tall email produces a huge PNG that
      // bloats the model's vision context; clip it while keeping width intact.
      maxHeight?: number;
    } = {},
  ): Promise<Buffer> {
    const type = options.type ?? "png";
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    try {
      if (!this.launchDiagnosticsLogged) {
        this.launchDiagnosticsLogged = true;
        try {
          const resolved = puppeteer.executablePath();
          this.logger.log(`Puppeteer executable resolved: ${resolved}`);
        } catch (resolveErr) {
          const hint = this.diagnosticHint(resolveErr);
          this.logger.error(`Puppeteer executable resolution failed. ${hint}`);
        }
      }

      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();
      // Evita timeouts prematuros al renderizar HTML con recursos externos o carga lenta.
      page.setDefaultTimeout(60_000);
      page.setDefaultNavigationTimeout(60_000);

      await page.setViewport({ width: 800, height: 600 });
      // `networkidle0` a veces no llega a cumplirse con emails que disparan requests
      // (p.ej. fuentes externas). Usamos una condición más segura.
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      // Espera a que imágenes y fuentes carguen antes de capturar.
      await this.waitForAssets(page);
      // Resalta los merge tags como en el preview de la app (solo previews).
      if (options.highlightVariables) await this.highlightMergeTags(page);
      // Pequeña pausa para que el layout termine de calcular antes de capturar.
      await new Promise((r) => setTimeout(r, 150));

      const element = await page.$("table, body");
      if (!element) {
        throw new InternalServerErrorException("No renderable element found in email HTML.");
      }

      // When a maxHeight is requested and the element is taller, clip the capture
      // via a page-level screenshot bounded to the element's box.
      if (options.maxHeight) {
        const box = await element.boundingBox();
        if (box && box.height > options.maxHeight) {
          const clip = {
            x: box.x,
            y: box.y,
            width: box.width,
            height: options.maxHeight,
          };
          const clipped = await page.screenshot(
            type === "jpeg"
              ? { type: "jpeg", quality: options.quality ?? 90, clip }
              : { type: "png", clip },
          );
          return Buffer.from(clipped);
        }
      }

      const screenshot = await element.screenshot(
        type === "jpeg"
          ? { type: "jpeg", quality: options.quality ?? 90 }
          : { type: "png" },
      );
      return Buffer.from(screenshot);
    } catch (err) {
      const hint = this.diagnosticHint(err);
      this.logger.error(`Screenshot failed. ${hint}`);
      if (err instanceof Error) {
        this.logger.error(err.stack ?? err.message);
      } else {
        this.logger.error(String(err));
      }
      throw new InternalServerErrorException("Failed to generate email preview screenshot.");
    } finally {
      await browser?.close();
    }
  }

  async pdfFromHtml(html: string): Promise<Buffer> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(60_000);
      page.setDefaultNavigationTimeout(60_000);

      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await this.waitForAssets(page);
      await new Promise((r) => setTimeout(r, 150));

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      });
      return Buffer.from(pdf);
    } catch (err) {
      const hint = this.diagnosticHint(err);
      this.logger.error(`PDF export failed. ${hint}`);
      if (err instanceof Error) {
        this.logger.error(err.stack ?? err.message);
      } else {
        this.logger.error(String(err));
      }
      throw new InternalServerErrorException("Failed to generate email PDF.");
    } finally {
      await browser?.close();
    }
  }
}
