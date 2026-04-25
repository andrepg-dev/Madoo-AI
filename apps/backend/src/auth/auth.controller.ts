import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Version } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { UsersService } from "../users/users.service";
import { toUserDto } from "../users/dto/user.dto";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleLoginDto) {
    return this.auth.loginWithGoogle(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() current: { sub: string }) {
    const user = await this.users.findByIdOrThrow(current.sub);
    return toUserDto(user);
  }
}
