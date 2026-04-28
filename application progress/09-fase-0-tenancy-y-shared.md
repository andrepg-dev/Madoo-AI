---
date: 2026-04-27
area: backend / frontend / shared / infra
files:
  - packages/shared/* (nuevo)
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/workspaces/* (nuevo)
  - apps/backend/src/auth/auth.service.ts
  - apps/backend/src/auth/auth.module.ts
  - apps/backend/src/app.module.ts
  - apps/backend/package.json
  - apps/backend/.env.example
  - apps/frontend/actions/workspaces.ts (nuevo)
  - apps/frontend/actions/auth.ts
  - apps/frontend/components/workspace/WorkspaceContext.tsx (nuevo)
  - apps/frontend/components/auth/AuthContext.tsx
  - apps/frontend/components/auth/LoginModal.tsx
  - apps/frontend/lib/fetch.ts
  - apps/frontend/lib/storage.ts
  - apps/frontend/next.config.ts
  - apps/frontend/app/layout.tsx
  - apps/frontend/package.json
  - docker-compose.yml
  - docs/CONVENTIONS.md (nuevo)
---

# 09 — Fase 0: tenancy (Workspace + Membership) y `@madoo/shared`

Cierra la "Fase 0" del master plan (entrada 08).

## Qué se hizo

### `packages/shared` (nuevo workspace `@madoo/shared`)

Primer package interno. Convención: tipos + zod schemas + constantes
de protocolo que cruzan client/server.

- `RoleSchema` enum (`OWNER | ADMIN | MEMBER`).
- `UserSchema`, `WorkspaceSchema`, `WorkspaceMembershipSchema`,
  `MyWorkspaceSchema` (workspace + el `role` del user actual).
- `WORKSPACE_HEADER = "x-workspace-id"` — única fuente de verdad para
  el nombre del header de tenancy.
- Sin paso de build: el `package.json` apunta su `main`/`types` al
  TS source. Frontend usa `transpilePackages: ["@madoo/shared"]` en
  `next.config.ts`. Backend lo resuelve por symlink de pnpm.

### Backend

**Prisma:**

- Nuevo enum `Role { OWNER ADMIN MEMBER }`.
- Nueva tabla `Workspace { id, name, slug @unique, ... }`.
- Nueva tabla `Membership { workspaceId, userId, role, ... }` con
  `@@unique([workspaceId, userId])` y cascada en ambos FK.
- `User` recibe `memberships Membership[]`.

**Módulo `WorkspacesModule`:**

- `WorkspacesService.ensurePersonalWorkspace({ userId, displayName,
  email })` — crea workspace "Personal" + membership `OWNER` en el
  primer login. Idempotente (si ya hay membership, devuelve el
  workspace existente). Slug derivado del email, con dedupe `name-2`,
  `name-3`, …
- `WorkspacesService.assertMembership(userId, workspaceId)` — usado
  por el guard.
- `GET /api/v1/workspaces/me` — devuelve los workspaces del user
  autenticado, cada uno con su `role` (forma `MyWorkspaceDto[]`).

**Guard + decorator:**

- `WorkspaceGuard` lee `X-Workspace-Id`, verifica membership, popula
  `req.workspace = { id, role }`.
- `@CurrentWorkspace()` decorator extrae ese contexto en handlers.
- Convención: endpoints autenticados usan
  `@UseGuards(JwtAuthGuard, WorkspaceGuard)` (en ese orden).

**Auth flow extendido:**

- `loginWithGoogle` ahora también garantiza el workspace personal y
  devuelve `workspaces: MyWorkspaceDto[]` + `defaultWorkspaceId` en la
  respuesta. El frontend persiste ese id sin necesidad de un round
  trip extra.
- `AuthModule` ↔ `WorkspacesModule` se referencian con `forwardRef`
  para romper el ciclo (Auth necesita crear workspaces; el controller
  de Workspaces necesita `JwtAuthGuard`).

### Frontend

**Wrapper axios:**

- `lib/fetch.ts` ahora también inyecta `X-Workspace-Id` desde
  `localStorage` en cada request, usando `WORKSPACE_HEADER` del shared.
  Sin override silencioso si el caller ya lo puso.

**`actions/workspaces.ts`:**

- `useMyWorkspaces()` consume `/workspaces/me` y **valida** la
  respuesta con `MyWorkspaceSchema` del shared antes de exponerla.
- Convención escrita en `docs/CONVENTIONS.md`: las respuestas se
  parsean siempre contra el schema compartido.

**`WorkspaceProvider`:**

- `useWorkspace()` expone `{ workspaces, activeWorkspace, loading,
  setActiveWorkspaceId }`.
- Persiste el id activo en `madoo.workspace.id`. Si el storage tiene
  un id que ya no está en la lista (workspace borrado), reescribe al
  primero.
- Limpia el id activo en logout.

**`AuthContext.finishLogin` cambió de firma:**
de `(token, user)` a `({ token, user, workspaces, defaultWorkspaceId })`.
Persiste el workspace id y siembra el cache de TanStack
(`workspaceKeys.me()`). `LoginModal` actualizado.

**Layout:** `WorkspaceProvider` envuelve a `AppShell` dentro de
`AuthProvider`.

### Infra

- `docker-compose.yml`: nuevo servicio `redis` (alpine, healthcheck
  `redis-cli ping`, volumen `madoo-redis-data`). Puerto override por
  `REDIS_PORT` (default 6379).
- `apps/backend/.env.example`: nueva var `REDIS_URL`.

### Documentación

- **`docs/CONVENTIONS.md`** (nuevo) — building instructions para todo
  el proyecto. Reglas sobre `actions/` + wrapper, schema compartido,
  patrón backend por feature, tenancy obligatorio, qué NO hacemos.
  Vivo: actualizar en el mismo PR donde cambie la convención.

## Por qué

- **Workspace antes de Fase 1**: retrofitear `workspaceId` en 6+
  tablas después es el camino doloroso. Todo lo que viene en el
  master plan (Email, Contact, Domain, Campaign, …) lleva
  `workspaceId` desde su primera migración.
- **`@madoo/shared` desde el día uno**: evita drift entre tipos del
  back y del front. Las respuestas del back se validan en el cliente
  contra el mismo schema que el back debería respetar — si el
  contrato se rompe, falla cerca del fetch.
- **`X-Workspace-Id` en header (no en URL ni en JWT)**: permite
  cambiar de workspace activo sin re-emitir token, y mantiene los
  paths REST limpios.

## Pendientes para correr esto

```bash
pnpm install
pnpm --filter @madoo/backend prisma:migrate -- --name workspaces_and_memberships
pnpm --filter @madoo/backend prisma:generate
docker compose up -d redis
```

Tras la migración, los diagnósticos TS sobre `Workspace`/`Membership`
en `@prisma/client` desaparecen.

## Verificación manual

- [ ] Login con Google de un user existente → en DB aparece un
      `Workspace` + `Membership(role=OWNER)`. Subsecuentes logins no
      crean duplicados.
- [ ] `GET /api/v1/workspaces/me` con bearer → devuelve `[{ id, name,
      slug, role: "OWNER", ... }]`.
- [ ] Frontend después del login: `localStorage["madoo.workspace.id"]`
      poblado, `useWorkspace().activeWorkspace` no-null.
- [ ] Llamar a un endpoint que añada `WorkspaceGuard` (futuro) sin el
      header → 400. Con el header pero sin membership → 403.

## Próximo paso

Fase 1 del master plan: generación AI real (Anthropic SDK + React
Email + sandbox de compilación). Ya disponible la base de tenancy
para que `Email`/`EmailVariant`/`EmailGenerationRun`/`Template`
nazcan con `workspaceId` desde el principio.
