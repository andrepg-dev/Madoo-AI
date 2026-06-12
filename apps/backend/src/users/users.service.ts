import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../s3/s3.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async findByIdOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  async updateName(userId: string, name: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  async changePassword(
    userId: string,
    input: { currentPassword?: string; newPassword: string },
  ) {
    const user = await this.findByIdOrThrow(userId);

    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw new BadRequestException("Current password is required.");
      }
      const valid = await bcrypt.compare(
        input.currentPassword,
        user.passwordHash,
      );
      if (!valid) {
        throw new UnauthorizedException("Current password is incorrect.");
      }
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async setAvatar(userId: string, file: { buffer: Buffer; mimetype: string }) {
    if (!["image/png", "image/jpeg"].includes(file.mimetype)) {
      throw new BadRequestException("Avatar must be a PNG or JPEG image.");
    }
    if (file.buffer.byteLength > 4 * 1024 * 1024) {
      throw new BadRequestException("Avatar must be smaller than 4 MB.");
    }
    const url = await this.s3.uploadBuffer(file.buffer, file.mimetype, "avatars");
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
  }

  async listAuthAccounts(userId: string) {
    const user = await this.findByIdOrThrow(userId);
    const accounts = await this.prisma.authAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return { accounts, hasPassword: !!user.passwordHash };
  }
}
