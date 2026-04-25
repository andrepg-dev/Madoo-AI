import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleTokenVerifier } from "./google-token.verifier";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { toUserDto, type UserDto } from "../users/dto/user.dto";

export type AuthResult = { token: string; user: UserDto; pendingPromptId: string | null };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly verifier: GoogleTokenVerifier,
    private readonly config: ConfigService,
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

    return { token, user: toUserDto(user), pendingPromptId };
  }
}
