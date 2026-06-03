# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm + Turborepo monorepo. Main apps live in `apps/`: `frontend` is the authenticated Next.js app on port 3000, `landing` is the public Next.js landing page on port 3001, and `backend` is a NestJS API with Prisma. Shared packages live in `packages/`: `shared` contains cross-app Zod schemas, types, and protocol constants; `ui` contains the design system, tokens, and Storybook stories. Prisma schema and migrations are in `apps/backend/prisma/`. Assets live under each app's `public/`. Project conventions are expanded in `docs/CONVENTIONS.md`.

## Build, Test, and Development Commands

- `pnpm dev`: run all persistent dev tasks through Turbo.
- `pnpm build`: build all packages/apps in dependency order.
- `pnpm lint`: run configured lint tasks; some packages still use placeholder lint scripts.
- `pnpm test`: Turbo test task, currently dependent on package builds.
- `pnpm --filter @madoo/frontend dev`: run the app at `localhost:3000`.
- `pnpm --filter @madoo/landing dev`: run the landing page at `localhost:3001`.
- `pnpm --filter @madoo/backend dev`: run NestJS in watch mode.
- `pnpm --filter @madoo/backend prisma:migrate`: create/apply local Prisma migrations.

## Coding Style & Naming Conventions

Use TypeScript and React functional components. Prefer existing patterns before adding abstractions. Internal packages use the `@madoo/*` scope. New cross-boundary contracts start in `packages/shared/src`, then backend validates against that contract, then frontend `actions/` parse responses with the same schema. Keep `apps/frontend/actions/*.ts` free of hooks and React code. Use path aliases already configured in each app. Keep component names in `PascalCase`, helpers in `camelCase`, and resource folders in lowercase or kebab-case.

## Testing Guidelines

There is no broad test suite yet. Add focused tests next to risky logic, using `*.test.ts` or `*.test.tsx` naming. For UI package work, prefer Storybook stories in `packages/ui/src/**/*.stories.tsx`. For API and shared contract changes, verify schema parsing and DTO serialization paths. Run the smallest relevant command first, then broader Turbo tasks when needed.

## Commit & Pull Request Guidelines

Recent history uses short imperative commits such as `design paper style` and occasional conventional prefixes like `chore:`. Keep commits scoped and direct. Pull requests should include purpose, main changes, verification performed, linked issues if any, and screenshots for landing/frontend UI changes. Note schema, migration, or environment changes explicitly.

## Security & Agent Notes

Do not commit secrets. Keep local env files untracked. Ask a clarifying question when a task is ambiguous, then proceed once intent is clear.
