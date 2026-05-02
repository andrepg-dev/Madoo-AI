import { Controller, Get, Header, Param, Post } from "@nestjs/common";
import { UnsubscribeService } from "./unsubscribe.service";

@Controller({ path: "unsubscribe", version: "1" })
export class UnsubscribeController {
  constructor(private readonly unsubscribeService: UnsubscribeService) {}

  @Post(":token")
  postUnsubscribe(@Param("token") token: string) {
    return this.unsubscribeService.unsubscribe(token);
  }

  @Get(":token")
  @Header("Content-Type", "text/html; charset=utf-8")
  getLanding(@Param("token") token: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribe</title>
  </head>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#f6f1ea;color:#2f2720;">
    <main style="max-width:520px;margin:72px auto;padding:24px;background:#fff;border:1px solid #e8dfd4;border-radius:12px;">
      <h1 style="margin:0 0 10px 0;font-size:26px;">Unsubscribe</h1>
      <p style="margin:0 0 20px 0;line-height:1.6;color:#6f6359;">Confirm you want to stop receiving emails from this workspace.</p>
      <form method="post" action="/api/v1/unsubscribe/${token}">
        <button type="submit" style="border:0;border-radius:10px;padding:10px 16px;background:#2f2720;color:#fff;cursor:pointer;">Unsubscribe me</button>
      </form>
    </main>
  </body>
</html>`;
  }
}
