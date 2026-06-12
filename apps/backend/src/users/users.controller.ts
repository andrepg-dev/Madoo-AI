import {
  ChangePasswordInputSchema,
  ConnectedAccountsResponseSchema,
  UpdateUserMeInputSchema,
} from "@madoo/shared";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { toUserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@Controller({ path: "users", version: "1" })
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch("me")
  async updateMe(
    @CurrentUser() current: { sub: string },
    @Body() body: unknown,
  ) {
    const input = UpdateUserMeInputSchema.parse(body);
    const user = await this.users.updateName(current.sub, input.name);
    return toUserDto(user);
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() current: { sub: string },
    @Body() body: unknown,
  ) {
    const input = ChangePasswordInputSchema.parse(body);
    const user = await this.users.changePassword(current.sub, input);
    return toUserDto(user);
  }

  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @CurrentUser() current: { sub: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = await this.users.setAvatar(current.sub, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
    return toUserDto(user);
  }

  @Get("me/accounts")
  async accounts(@CurrentUser() current: { sub: string }) {
    const { accounts, hasPassword } = await this.users.listAuthAccounts(
      current.sub,
    );
    return ConnectedAccountsResponseSchema.parse({
      hasPassword,
      accounts: accounts.map((a) => ({
        provider: a.provider,
        email: a.email,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  }
}
