import {
  GoogleLoginResponseSchema,
  type GoogleLoginResponse,
} from "@madoo/shared";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { toUserDto } from "../users/dto/user.dto";
import {
  toMyWorkspaceDto
} from "../workspaces/dto/workspace.dto";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { GoogleTokenVerifier } from "./google-token.verifier";

export type AuthResult = GoogleLoginResponse;

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
    if (dto.pendingPrompt && dto.pendingPrompt.trim()) {
      const pp = await this.prisma.pendingPrompt.create({
        data: {
          userId: user.id,
          prompt: dto.pendingPrompt.trim(),
          tone: dto.pendingTone ?? null,
          length: dto.pendingLength ?? null,
          audience: dto.pendingAudience ?? null,
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

    return GoogleLoginResponseSchema.parse({
      token,
      user: toUserDto(user),
      pendingPromptId,
      workspaces,
      defaultWorkspaceId,
    });
  }
}
