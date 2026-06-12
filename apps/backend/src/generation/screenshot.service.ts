import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import puppeteer from "puppeteer";
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

  async screenshotHtml(
    html: string,
    options: { type?: "png" | "jpeg"; quality?: number } = {},
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

      // Pequeña pausa para que el layout termine de calcular antes de capturar.
      await new Promise((r) => setTimeout(r, 250));

      const element = await page.$("table, body");
      if (!element) {
        throw new InternalServerErrorException("No renderable element found in email HTML.");
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
      await new Promise((r) => setTimeout(r, 250));

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
