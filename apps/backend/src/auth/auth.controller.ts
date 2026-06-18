import {
  GithubLoginInputSchema,
  GoogleLoginInputSchema,
  PasswordLoginInputSchema,
  RegisterInputSchema,
  type AuthSessionResponse,
} from "@madoo/shared";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { toUserDto } from "../users/dto/user.dto";
import { UsersService } from "../users/users.service";
import { AUTH_TOKEN_COOKIE, authCookieOptions } from "./auth-cookie";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async google(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = GoogleLoginInputSchema.parse(body);
    return this.withSessionCookie(res, await this.auth.loginWithGoogle(input));
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = RegisterInputSchema.parse(body);
    return this.withSessionCookie(res, await this.auth.register(input));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = PasswordLoginInputSchema.parse(body);
    return this.withSessionCookie(
      res,
      await this.auth.loginWithPassword(input),
    );
  }

  @Post("github")
  @HttpCode(HttpStatus.OK)
  async github(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = GithubLoginInputSchema.parse(body);
    return this.withSessionCookie(res, await this.auth.loginWithGithub(input));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_TOKEN_COOKIE, authCookieOptions());
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() current: { sub: string }) {
    const user = await this.users.findByIdOrThrow(current.sub);
    return toUserDto(user);
  }

  private withSessionCookie(
    res: Response,
    session: AuthSessionResponse,
  ): AuthSessionResponse {
    res.cookie(
      AUTH_TOKEN_COOKIE,
      session.token,
      authCookieOptions(this.auth.tokenMaxAgeMs()),
    );
    return session;
  }
}
