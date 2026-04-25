import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthedRequest } from "./jwt-auth.guard";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.user;
});
