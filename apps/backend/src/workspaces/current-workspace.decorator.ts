import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { WorkspaceScopedRequest } from "./workspace.guard";

export const CurrentWorkspace = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<WorkspaceScopedRequest>();
  return req.workspace;
});
