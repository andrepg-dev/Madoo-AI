import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  AuthorizeUrlResponseSchema,
  ConnectionProviderSchema,
  ExchangeConnectionInputSchema,
  ProviderConnectionListSchema,
  type AuthorizeUrlResponse,
  type ProviderConnectionDto,
} from "@madoo/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ConnectionsService } from "./connections.service";

@Controller({ path: "connections", version: "1" })
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get()
  async list(
    @CurrentUser() user: { sub: string },
  ): Promise<ProviderConnectionDto[]> {
    const rows = await this.connections.list(user.sub);
    return ProviderConnectionListSchema.parse(rows);
  }

  @Get(":provider/authorize-url")
  authorizeUrl(@Param("provider") provider: string): AuthorizeUrlResponse {
    const parsed = ConnectionProviderSchema.parse(provider);
    const url = this.connections.getAuthorizeUrl(parsed);
    return AuthorizeUrlResponseSchema.parse({ url });
  }

  @Post(":provider/exchange")
  async exchange(
    @CurrentUser() user: { sub: string },
    @Param("provider") provider: string,
    @Body() body: unknown,
  ): Promise<ProviderConnectionDto> {
    const parsed = ConnectionProviderSchema.parse(provider);
    const input = ExchangeConnectionInputSchema.parse(body);
    return this.connections.exchange(
      user.sub,
      parsed,
      input.code,
      input.redirectUri,
    );
  }

  @Delete(":provider")
  async disconnect(
    @CurrentUser() user: { sub: string },
    @Param("provider") provider: string,
  ): Promise<{ ok: true }> {
    const parsed = ConnectionProviderSchema.parse(provider);
    await this.connections.disconnect(user.sub, parsed);
    return { ok: true };
  }
}
