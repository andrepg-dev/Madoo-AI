import { UserSchema, type User as SharedUser } from "@madoo/shared";
import type { User } from "@prisma/client";

export type UserDto = SharedUser;

export function toUserDto(user: User): UserDto {
  return UserSchema.parse({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  });
}
