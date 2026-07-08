import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ConnectionProvider as PrismaConnectionProvider } from "@prisma/client";
import {
  ProviderConnectionDtoSchema,
  type ConnectionProvider,
  type CreateDraftResponse,
  type ProviderConnectionDto,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  decryptSecret,
  encryptSecret,
  signPayload,
  verifyPayload,
} from "../common/crypto";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const OUTLOOK_SCOPE = "offline_access https://graph.microsoft.com/Mail.ReadWrite";

type DraftInput = { subject: string; html: string };

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ---- helpers ----------------------------------------------------------

  private encKey(): string {
    const key =
      this.config.get<string>("TOKEN_ENCRYPTION_KEY") ??
      this.config.get<string>("JWT_SECRET");
    if (!key) {
      throw new InternalServerErrorException(
        "TOKEN_ENCRYPTION_KEY (or JWT_SECRET fallback) is not configured.",
      );
    }
    return key;
  }

  private toPrismaProvider(provider: ConnectionProvider): PrismaConnectionProvider {
    return provider === "gmail" ? "GMAIL" : "OUTLOOK";
  }

  private redirectUri(provider: ConnectionProvider, override?: string): string {
    if (override) return override;
    const base =
      this.config.get<string>("APP_URL") ??
      this.config.get<string>("CLIENT_APP_URL") ??
      "http://localhost:3003";
    return `${base.replace(/\/$/, "")}/api/connections/${provider}/callback`;
  }

  // ---- public API -------------------------------------------------------

  async list(userId: string): Promise<ProviderConnectionDto[]> {
    const rows = await this.prisma.providerConnection.findMany({
      where: { userId },
    });
    return rows.map((row) =>
      ProviderConnectionDtoSchema.parse({
        provider: row.provider === "GMAIL" ? "gmail" : "outlook",
        accountEmail: row.accountEmail,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        connected: true,
      }),
    );
  }

  getAuthorizeUrl(
    userId: string,
    provider: ConnectionProvider,
    redirectUriOverride?: string,
  ): string {
    const redirectUri = this.redirectUri(provider, redirectUriOverride);
    const state = this.signState(userId, provider);
    if (provider === "gmail") {
      const clientId = this.requireConfig("GOOGLE_CLIENT_ID");
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GMAIL_SCOPE,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    const clientId = this.requireConfig("MS_CLIENT_ID");
    const tenant = this.config.get<string>("MS_TENANT") ?? "common";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: OUTLOOK_SCOPE,
      response_mode: "query",
      state,
    });
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /** Anti-CSRF state bound to the session user + provider, valid for 15 minutes. */
  private signState(userId: string, provider: ConnectionProvider): string {
    return signPayload({ u: userId, p: provider, iat: Date.now() }, this.encKey());
  }

  private verifyState(
    state: string,
    userId: string,
    provider: ConnectionProvider,
  ): void {
    const payload = verifyPayload<{ u: string; p: string; iat: number }>(
      state,
      this.encKey(),
    );
    const STATE_TTL_MS = 15 * 60 * 1000;
    if (
      !payload ||
      payload.u !== userId ||
      payload.p !== provider ||
      typeof payload.iat !== "number" ||
      Date.now() - payload.iat > STATE_TTL_MS
    ) {
      throw new UnauthorizedException("Invalid or expired OAuth state.");
    }
  }

  async exchange(
    userId: string,
    provider: ConnectionProvider,
    code: string,
    state: string,
    redirectUriOverride?: string,
  ): Promise<ProviderConnectionDto> {
    this.verifyState(state, userId, provider);
    const redirectUri = this.redirectUri(provider, redirectUriOverride);
    const tokens =
      provider === "gmail"
        ? await this.exchangeGoogle(code, redirectUri)
        : await this.exchangeMicrosoft(code, redirectUri);

    const accountEmail =
      provider === "gmail"
        ? await this.fetchGoogleEmail(tokens.accessToken)
        : await this.fetchMicrosoftEmail(tokens.accessToken);

    const key = this.encKey();
    const data = {
      accessTokenEnc: encryptSecret(tokens.accessToken, key),
      refreshTokenEnc: tokens.refreshToken
        ? encryptSecret(tokens.refreshToken, key)
        : null,
      expiresAt: tokens.expiresAt,
      accountEmail,
    };
    const prismaProvider = this.toPrismaProvider(provider);
    await this.prisma.providerConnection.upsert({
      where: { userId_provider: { userId, provider: prismaProvider } },
      // Keep an existing refresh token if the provider omits it on re-consent.
      update: {
        accessTokenEnc: data.accessTokenEnc,
        ...(data.refreshTokenEnc ? { refreshTokenEnc: data.refreshTokenEnc } : {}),
        expiresAt: data.expiresAt,
        accountEmail: data.accountEmail,
      },
      create: { userId, provider: prismaProvider, ...data },
    });
    try {
      await this.prisma.productEvent.create({
        data: {
          userId,
          name: "provider.connected",
          source: "connections.exchange",
          properties: { provider, accountEmail },
        },
      });
    } catch {
      // The connection row is authoritative; analytics is best-effort.
    }

    return ProviderConnectionDtoSchema.parse({
      provider,
      accountEmail,
      expiresAt: tokens.expiresAt?.toISOString() ?? null,
      connected: true,
    });
  }

  async disconnect(userId: string, provider: ConnectionProvider): Promise<void> {
    await this.prisma.providerConnection.deleteMany({
      where: { userId, provider: this.toPrismaProvider(provider) },
    });
  }

  async createGmailDraft(userId: string, input: DraftInput): Promise<CreateDraftResponse> {
    const accessToken = await this.validAccessToken(userId, "gmail");
    const connection = await this.requireConnection(userId, "gmail");
    const mime = buildMime(connection.accountEmail, input.subject, input.html);
    const raw = Buffer.from(mime, "utf8").toString("base64url");

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: { raw } }),
      },
    );
    if (!res.ok) {
      throw await this.draftError("Gmail", res);
    }
    return { ok: true, provider: "gmail", openUrl: "https://mail.google.com/mail/u/0/#drafts" };
  }

  async createOutlookDraft(userId: string, input: DraftInput): Promise<CreateDraftResponse> {
    const accessToken = await this.validAccessToken(userId, "outlook");
    const res = await fetch("https://graph.microsoft.com/v1.0/me/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: input.subject,
        body: { contentType: "HTML", content: input.html },
        isDraft: true,
      }),
    });
    if (!res.ok) {
      throw await this.draftError("Outlook", res);
    }
    return {
      ok: true,
      provider: "outlook",
      openUrl: "https://outlook.office.com/mail/drafts",
    };
  }

  // ---- token management -------------------------------------------------

  private async requireConnection(userId: string, provider: ConnectionProvider) {
    const row = await this.prisma.providerConnection.findUnique({
      where: {
        userId_provider: { userId, provider: this.toPrismaProvider(provider) },
      },
    });
    if (!row) {
      throw new NotFoundException(`No ${provider} account connected.`);
    }
    return row;
  }

  private async validAccessToken(
    userId: string,
    provider: ConnectionProvider,
  ): Promise<string> {
    const row = await this.requireConnection(userId, provider);
    const key = this.encKey();
    const stillValid =
      row.expiresAt && row.expiresAt.getTime() - Date.now() > 60_000;
    if (stillValid) {
      return decryptSecret(row.accessTokenEnc, key);
    }
    if (!row.refreshTokenEnc) {
      // No way to refresh — surface a reconnect signal.
      throw new BadRequestException(
        `${provider} session expired. Please reconnect the account.`,
      );
    }
    const refreshToken = decryptSecret(row.refreshTokenEnc, key);
    const refreshed =
      provider === "gmail"
        ? await this.refreshGoogle(refreshToken)
        : await this.refreshMicrosoft(refreshToken);

    await this.prisma.providerConnection.update({
      where: {
        userId_provider: { userId, provider: this.toPrismaProvider(provider) },
      },
      data: {
        accessTokenEnc: encryptSecret(refreshed.accessToken, key),
        ...(refreshed.refreshToken
          ? { refreshTokenEnc: encryptSecret(refreshed.refreshToken, key) }
          : {}),
        expiresAt: refreshed.expiresAt,
      },
    });
    return refreshed.accessToken;
  }

  // ---- provider OAuth calls --------------------------------------------

  private async exchangeGoogle(code: string, redirectUri: string) {
    const body = new URLSearchParams({
      code,
      client_id: this.requireConfig("GOOGLE_CLIENT_ID"),
      client_secret: this.requireConfig("GOOGLE_SECRET_ID"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    return this.googleTokenRequest(body);
  }

  private async refreshGoogle(refreshToken: string) {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.requireConfig("GOOGLE_CLIENT_ID"),
      client_secret: this.requireConfig("GOOGLE_SECRET_ID"),
      grant_type: "refresh_token",
    });
    return this.googleTokenRequest(body);
  }

  private async googleTokenRequest(body: URLSearchParams) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json().catch(() => null)) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
    } | null;
    if (!res.ok || !json?.access_token) {
      throw new BadRequestException(
        `Google token exchange failed: ${json?.error_description ?? res.status}`,
      );
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : null,
    };
  }

  private async exchangeMicrosoft(code: string, redirectUri: string) {
    const body = new URLSearchParams({
      code,
      client_id: this.requireConfig("MS_CLIENT_ID"),
      client_secret: this.requireConfig("MS_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: OUTLOOK_SCOPE,
    });
    return this.microsoftTokenRequest(body);
  }

  private async refreshMicrosoft(refreshToken: string) {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.requireConfig("MS_CLIENT_ID"),
      client_secret: this.requireConfig("MS_CLIENT_SECRET"),
      grant_type: "refresh_token",
      scope: OUTLOOK_SCOPE,
    });
    return this.microsoftTokenRequest(body);
  }

  private async microsoftTokenRequest(body: URLSearchParams) {
    const tenant = this.config.get<string>("MS_TENANT") ?? "common";
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const json = (await res.json().catch(() => null)) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
    } | null;
    if (!res.ok || !json?.access_token) {
      throw new BadRequestException(
        `Microsoft token exchange failed: ${json?.error_description ?? res.status}`,
      );
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : null,
    };
  }

  private async fetchGoogleEmail(accessToken: string): Promise<string | null> {
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as { email?: string } | null;
    return json?.email ?? null;
  }

  private async fetchMicrosoftEmail(accessToken: string): Promise<string | null> {
    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as {
      mail?: string;
      userPrincipalName?: string;
    } | null;
    return json?.mail ?? json?.userPrincipalName ?? null;
  }

  private requireConfig(name: string): string {
    const value = this.config.get<string>(name);
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured.`);
    }
    return value;
  }

  private async draftError(label: string, res: globalThis.Response) {
    const text = await res.text().catch(() => "");
    this.logger.error(`${label} draft creation failed (${res.status}): ${text}`);
    return new InternalServerErrorException(
      `${label} draft creation failed (${res.status}).`,
    );
  }
}

/** Minimal RFC822 MIME message for a Gmail draft. */
function buildMime(from: string | null, subject: string, html: string): string {
  const headers = [
    from ? `From: ${from}` : null,
    "MIME-Version: 1.0",
    `Subject: ${encodeMimeHeader(subject)}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ].filter(Boolean);
  return `${headers.join("\r\n")}\r\n\r\n${html}`;
}

function encodeMimeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}
