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
      await page.setViewport({ width: 800, height: 600 });
      await page.setContent(html, { waitUntil: "networkidle0" });

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
