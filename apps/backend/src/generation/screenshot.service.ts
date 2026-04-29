import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import puppeteer from "puppeteer";

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  async screenshotHtml(html: string): Promise<Buffer> {
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

      const screenshot = await element.screenshot({ type: "png" });
      return Buffer.from(screenshot);
    } catch (err) {
      this.logger.error("Screenshot failed", err);
      throw new InternalServerErrorException("Failed to generate email preview screenshot.");
    } finally {
      await browser?.close();
    }
  }
}
