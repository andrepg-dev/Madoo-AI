import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { initSentry } from "./observability/sentry";
import { SentryExceptionFilter } from "./observability/sentry.filter";

async function bootstrap() {
  const sentryEnabled = initSentry();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (sentryEnabled) {
    app.useGlobalFilters(new SentryExceptionFilter());
  }

  const origins = (config.get<string>("CORS_ORIGINS") ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = Number(config.get("PORT") ?? 4000);
  await app.listen(port);
  app
    .get(Logger)
    .log(
      `madoo-backend listening on http://localhost:${port}/api/v1 (sentry=${sentryEnabled ? "on" : "off"})`,
    );
}

bootstrap();
