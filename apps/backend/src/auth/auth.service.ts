import {
  AuthSessionResponseSchema,
  type AuthSessionResponse,
  type GithubLoginInput,
  type PasswordLoginInput,
  type RegisterInput,
} from "@madoo/shared";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { toUserDto } from "../users/dto/user.dto";
import { toMyWorkspaceDto } from "../workspaces/dto/workspace.dto";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { GoogleTokenVerifier } from "./google-token.verifier";

export type AuthResult = AuthSessionResponse;

type PendingPromptInput = {
  pendingPrompt?: string;
  pendingTone?: string;
  pendingLength?: string;
  pendingAudience?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly verifier: GoogleTokenVerifier,
    private readonly config: ConfigService,
    private readonly workspaces: WorkspacesService,
  ) {}

  async loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResult> {
    const payload = await this.verifier.verify(dto.idToken);

    const email = payload.email!.toLowerCase();
    const googleId = payload.sub!;

    const user = await this.prisma.user.upsert({
      where: { googleId },
      create: {
        googleId,
        email,
        name: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
        emailVerified: !!payload.email_verified,
        locale: payload.locale ?? null,
        lastLoginAt: new Date(),
      },
      update: {
        email,
        name: payload.name ?? undefined,
        avatarUrl: payload.picture ?? undefined,
        emailVerified: !!payload.email_verified,
        locale: payload.locale ?? undefined,
        lastLoginAt: new Date(),
      },
    });

    await this.linkAuthAccount(user.id, "GOOGLE", googleId, email);

    return this.issueSession(user, dto);
  }

  async register(dto: RegisterInput): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name ?? null,
        passwordHash,
        emailVerified: false,
        lastLoginAt: new Date(),
      },
    });

    return this.issueSession(user, dto);
  }

  async loginWithPassword(dto: PasswordLoginInput): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials.");
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueSession(user, dto);
  }

  async loginWithGithub(dto: GithubLoginInput): Promise<AuthResult> {
    const clientId = this.config.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.config.get<string>("GITHUB_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        "GitHub login is not configured (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).",
      );
    }

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: dto.code,
          redirect_uri: dto.redirectUri,
        }),
      },
    );
    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      error_description?: string;
    };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException(
        tokenJson.error_description ?? "GitHub code exchange failed.",
      );
    }

    const ghHeaders = {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "madoo-backend",
    };
    const ghUserRes = await fetch("https://api.github.com/user", {
      headers: ghHeaders,
    });
    if (!ghUserRes.ok) {
      throw new UnauthorizedException("Failed to fetch GitHub profile.");
    }
    const ghUser = (await ghUserRes.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string | null;
      email: string | null;
    };

    let email = ghUser.email?.toLowerCase() ?? null;
    let emailVerified = false;
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: ghHeaders,
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary =
        emails.find((e) => e.primary && e.verified) ??
        emails.find((e) => e.verified);
      if (primary) {
        email = primary.email.toLowerCase();
        emailVerified = primary.verified;
      }
    }
    if (!email) {
      throw new UnauthorizedException(
        "Your GitHub account has no verified email address.",
      );
    }

    const user = await this.upsertOauthUser({
      provider: "GITHUB",
      providerAccountId: String(ghUser.id),
      email,
      emailVerified,
      name: ghUser.name ?? ghUser.login,
      avatarUrl: ghUser.avatar_url,
    });

    return this.issueSession(user, dto);
  }

  async issueSession(
    user: User,
    pending?: PendingPromptInput,
  ): Promise<AuthResult> {
    await this.workspaces.ensurePersonalWorkspace({
      userId: user.id,
      displayName: user.name,
      email: user.email,
    });

    const memberships = await this.workspaces.listForUser(user.id);
    const workspaces = memberships.map((row) =>
      toMyWorkspaceDto(row, row.membership),
    );
    const defaultWorkspaceId = workspaces[0]!.id;

    let pendingPromptId: string | null = null;
    if (pending?.pendingPrompt && pending.pendingPrompt.trim()) {
      const pp = await this.prisma.pendingPrompt.create({
        data: {
          userId: user.id,
          prompt: pending.pendingPrompt.trim(),
          tone: pending.pendingTone ?? null,
          length: pending.pendingLength ?? null,
          audience: pending.pendingAudience ?? null,
        },
      });
      pendingPromptId = pp.id;
    }

    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get<string>("JWT_SECRET"),
        expiresIn: this.config.get<string>("JWT_EXPIRES_IN") ?? "7d",
      },
    );

    return AuthSessionResponseSchema.parse({
      token,
      user: toUserDto(user),
      pendingPromptId,
      workspaces,
      defaultWorkspaceId,
    });
  }

  tokenMaxAgeMs(): number {
    const raw = this.config.get<string>("JWT_EXPIRES_IN") ?? "7d";
    const match = /^(\d+)([smhd])$/.exec(raw.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
      match[2] as "s" | "m" | "h" | "d"
    ];
    return value * unit;
  }

  private async upsertOauthUser(input: {
    provider: "GITHUB";
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<User> {
    const account = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (account) {
      return this.prisma.user.update({
        where: { id: account.userId },
        data: {
          name: account.user.name ?? input.name ?? undefined,
          avatarUrl: account.user.avatarUrl ?? input.avatarUrl ?? undefined,
          lastLoginAt: new Date(),
        },
      });
    }

    // Link by verified email when the user already exists (e.g. signed up with Google first).
    if (!input.emailVerified) {
      const clash = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (clash) {
        throw new BadRequestException(
          "This email already has an account. Verify the email on your provider before linking.",
        );
      }
    }

    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        emailVerified: input.emailVerified,
        lastLoginAt: new Date(),
      },
      update: { lastLoginAt: new Date() },
    });

    await this.linkAuthAccount(
      user.id,
      input.provider,
      input.providerAccountId,
      input.email,
    );

    return user;
  }

  private async linkAuthAccount(
    userId: string,
    provider: "GOOGLE" | "GITHUB",
    providerAccountId: string,
    email: string | null,
  ): Promise<void> {
    await this.prisma.authAccount.upsert({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      create: { userId, provider, providerAccountId, email },
      update: { email },
    });
  }
}
