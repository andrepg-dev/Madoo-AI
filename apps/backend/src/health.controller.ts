import { Controller, Get, Version } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  @Version("1")
  health() {
    return { status: "ok", uptime: process.uptime() };
  }
}
