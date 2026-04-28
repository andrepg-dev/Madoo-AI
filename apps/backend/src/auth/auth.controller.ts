import { GoogleLoginInputSchema } from "@madoo/shared";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from "@nestjs/common";
import { toUserDto } from "../users/dto/user.dto";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleLoginDto) {
    const input = GoogleLoginInputSchema.parse(dto);
    return this.auth.loginWithGoogle(input);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() current: { sub: string }) {
    const user = await this.users.findByIdOrThrow(current.sub);
    return toUserDto(user);
  }
}
