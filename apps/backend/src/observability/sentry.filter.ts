import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Sentry } from "./sentry";

/**
 * Forwards uncaught exceptions to Sentry while preserving the default
 * NestJS error response. HttpExceptions in the 4xx range are not reported
 * (they're expected user errors and would just be noise).
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: unknown = { message: "Internal server error" };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      payload = exception.getResponse();
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      try {
        Sentry.captureException(exception, {
          tags: { route: request.url, method: request.method },
        });
      } catch (err) {
        this.logger.warn(
          `Sentry capture failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }

    if (typeof payload === "string") {
      response.status(status).json({ message: payload });
    } else {
      response.status(status).json(payload);
    }
  }
}
