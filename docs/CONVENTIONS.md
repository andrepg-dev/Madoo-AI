---
date: 2026-04-27
status: living document — update when conventions change
---

# Madoo — Building Conventions

Este documento es la **fuente de verdad** sobre cómo se construyen
features end-to-end en Madoo. Todo nuevo código debe seguir estas
reglas. Cuando una convención cambie, actualizar este archivo en el
mismo PR.

---

## 1. Stack y estructura del monorepo

```
apps/
  backend/          # NestJS 10 + Prisma 5 + Postgres + Redis
  frontend/         # Next.js 15 + React 19 + TanStack Query + axios
packages/
  shared/           # @madoo/shared — tipos + zod schemas + constantes
docs/
  CONVENTIONS.md    # este archivo
application progress/
  NN-titulo.md      # log numerado de cada cambio sustancial
```

- **Workspace manager:** pnpm + Turborepo. Cada package interno se
  consume con `"workspace:*"`.
- **Naming:** todos los packages internos llevan el prefijo `@madoo/`.

---

## 2. La regla de oro: una feature = tres capas coordinadas

Cualquier endpoint nuevo se construye **siempre** en el mismo orden y
con coherencia entre las tres capas:

1. **`packages/shared`** define el contrato (tipo + zod schema + cualquier
   constante compartida como nombres de header).
2. **`apps/backend`** expone el endpoint, valida el input contra el
   schema del shared, y devuelve la forma exacta que el shared describe.
3. **`apps/frontend/actions/<resource>.ts`** consume el endpoint con
   el wrapper `fetcher`, valida la respuesta contra el mismo schema, y
   exporta hooks de TanStack Query.

Si las tres capas no están alineadas, **el feature no está listo**.

---

## 3. `packages/shared` — el contrato

Todo tipo o validación que cruce la frontera client/server vive aquí.

### Qué va

- **Tipos** que ambos lados consumen (`User`, `Workspace`, `Role`, …).
- **zod schemas** para validación a ambos lados.
- **Constantes** del protocolo (nombres de header, paths, enums).
- **Helpers puros** sin dependencias de DOM ni de Node específicos
  (e.g. builders de URL de tracking).

### Qué NO va

- Modelos de Prisma (esos viven en `apps/backend/prisma/schema.prisma`).
  El shared **deriva tipos del dominio**, no los reusa de Prisma.
- Componentes React, hooks, JSX.
- Lógica de framework (Nest decorators, Next utilities).

### Patrón

```ts
// packages/shared/src/<resource>.ts
import { z } from "zod";

export const ResourceSchema = z.object({
  id: z.string().min(1),
  // …
});

export type Resource = z.infer<typeof ResourceSchema>;
```

Cada nuevo archivo se exporta desde `packages/shared/src/index.ts`.

### Cómo lo consumen los apps

- `package.json` de cada app declara `"@madoo/shared": "workspace:*"`.
- Frontend: `next.config.ts` lleva `transpilePackages: ["@madoo/shared"]`
  para compilar el TS source directamente — sin paso de build.
- Backend: ts-node lo resuelve por symlink de pnpm.

---

## 4. Backend (NestJS) — patrón por feature

Por cada recurso nuevo se crea **un módulo**:

```
apps/backend/src/<resource>/
  <resource>.module.ts
  <resource>.controller.ts
  <resource>.service.ts
  dto/<resource>.dto.ts        # toDto(entity) + tipo DTO
  dto/create-<resource>.dto.ts # class-validator DTO de entrada
```

### Reglas

- **Multi-tenancy obligatorio.** Toda tabla nueva (excepto `User`,
  `Workspace`, `Membership`) lleva `workspaceId`. Toda query del
  servicio recibe `workspaceId` como parámetro y filtra por él.
- **Guards:** los endpoints autenticados llevan
  `@UseGuards(JwtAuthGuard, WorkspaceGuard)`. El orden importa
  (JWT primero). Endpoints públicos (`/auth/google`, webhooks,
  tracking) explícitamente sin guards.
- **Headers:** el frontend manda `X-Workspace-Id`. El nombre vive en
  `WORKSPACE_HEADER` de `@madoo/shared`. Nunca hardcodear el string.
- **Decorators:** `@CurrentUser()` para el JWT payload,
  `@CurrentWorkspace()` para `{ id, role }` del workspace activo.
- **DTOs de salida:** siempre con `toXxxDto(entity)` que serializa
  `Date → ISO string` y oculta campos sensibles. Nunca devolver
  entidades de Prisma crudas.
- **DTOs de entrada:** clase con `class-validator` (NestJS los valida
  con el `ValidationPipe` global). Si el shape también va a validarse
  en frontend, definir el zod schema en `@madoo/shared` y mantener los
  dos sincronizados.
- **Errores:** usar las excepciones de Nest (`BadRequestException`,
  `ForbiddenException`, `NotFoundException`). Mensajes en inglés y sin
  detalles internos.
- **Imports circulares:** evitar; si son inevitables, `forwardRef` y
  documentar la razón.

---

## 5. Frontend — `actions/` (sin hooks) + TanStack Query en componentes

**Toda comunicación con el backend pasa por `apps/frontend/actions/`.**
Los componentes nunca llaman `axios` ni `fetch` directamente.

### Regla dura: `actions/*.ts` NO contienen hooks

Los archivos en `apps/frontend/actions/` exportan **únicamente**:

1. **Schemas zod** del body (request) y de la response, importados
   desde `@madoo/shared` cuando ya existen ahí.
2. **Funciones puras async** que llaman al backend con el `fetcher`,
   parsean el body con su schema (`BodySchema.parse(input)`) y
   devuelven la response parseada con su schema
   (`ResponseSchema.parse(raw)`).
3. **Query keys** jerárquicos (constantes).

**Nunca**: `useQuery`, `useMutation`, `"use client"`, hooks
personalizados que envuelvan TanStack Query. Esto deja los actions
puros, testables sin React, y consumibles desde cualquier capa
(componentes, server actions, scripts, tests).

### Estructura por recurso

```ts
// apps/frontend/actions/<resource>.ts  (sin "use client", sin hooks)
import { z } from "zod";
import {
  CreateResourceSchema,
  ResourceSchema,
  type CreateResourceInput,
  type Resource,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const ResourceListSchema = z.array(ResourceSchema);

export const resourceKeys = {
  all: ["resource"] as const,
  list: () => [...resourceKeys.all, "list"] as const,
  detail: (id: string) => [...resourceKeys.all, "detail", id] as const,
};

export const resourceApi = {
  list: async (): Promise<Resource[]> => {
    const raw = await fetcher.get<unknown>("/resource");
    return ResourceListSchema.parse(raw);
  },
  create: async (input: CreateResourceInput): Promise<Resource> => {
    const body = CreateResourceSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateResourceInput>("/resource", body);
    return ResourceSchema.parse(raw);
  },
};
```

### Cómo se usan: TanStack Query directo en el componente

```tsx
// apps/frontend/components/.../SomeScreen.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceApi, resourceKeys } from "@/actions/resource";

export function SomeScreen() {
  const list = useQuery({
    queryKey: resourceKeys.list(),
    queryFn: () => resourceApi.list(),
  });

  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: resourceApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: resourceKeys.list() }),
  });

  // …
}
```

**Por qué este patrón:**
- TanStack Query queda visible en el componente que lo usa — opciones
  (`enabled`, `staleTime`, `onSuccess`) se ajustan al sitio del consumo
  sin abrir un wrapper.
- Los actions son funciones puras: testeables sin React, reusables
  desde cualquier capa.
- El componente lee la signature de `useQuery`/`useMutation` de
  TanStack — sin contratos ad-hoc por feature.

### Reglas

- **Wrapper único:** todo HTTP usa `fetcher` de `@/lib/fetch`. Inyecta
  `Authorization: Bearer …` y `X-Workspace-Id` automáticamente.
- **Validación con shared, ambos lados:** body con `BodySchema.parse(input)`
  antes de mandar; response con `ResponseSchema.parse(raw)` antes de
  retornar. Si el server devuelve algo inesperado o el caller manda
  basura, el error explota cerca del fetch, no a 6 componentes de
  distancia.
- **Sin lógica de UI en actions.** Sólo: I/O, parseo, query keys.
- **Estado de servidor → TanStack Query** (en el componente). Estado de
  UI local → React state normal.
- **Errores HTTP:** `fetcher` ya lanza `ApiError(status, message)`. El
  componente lo recibe vía `mutation.error` / `query.error`.
- **`enabled` condicional:** queries que dependen del user logueado o
  del workspace activo se gating con `enabled` en el `useQuery` del
  componente, no en el action.

### Storage local

`apps/frontend/lib/storage.ts` es el único módulo que toca
`localStorage`. Mantener todas las claves prefijadas con `madoo.`.

---

## 6. Tenancy: Workspace + Membership

- **Cada user que se loguea con Google** obtiene automáticamente un
  workspace "Personal" + un `Membership(role=OWNER)` (lógica en
  `WorkspacesService.ensurePersonalWorkspace`).
- El frontend lee la lista con `useMyWorkspaces()` y mantiene un
  `activeWorkspace` en el `WorkspaceProvider`. El id se persiste en
  `localStorage` bajo `madoo.workspace.id`.
- El header `X-Workspace-Id` lo añade el axios interceptor de forma
  transparente.
- **Roles** (`OWNER | ADMIN | MEMBER`): definidos en Prisma y en
  `@madoo/shared`. V1 todos los users son OWNER de su workspace
  Personal. La gating por rol llega cuando se habiliten invitaciones.

---

## 7. Logging de progreso

Cada cambio sustancial se documenta como un archivo numerado en
`application progress/`. Reglas:

- Numeración correlativa, padding a 2 dígitos: `09-…`, `10-…`.
- Frontmatter con `date`, `area`, `files`.
- Cuerpo: qué se hizo, por qué, qué queda pendiente.

Esto es la fuente de verdad operacional — cuando alguien pregunta
"qué se cambió la semana pasada", se lee este folder.

---

## 8. Orden de implementación de un feature nuevo

1. **Decidir el contrato.** Tipo + schema en `@madoo/shared`.
2. **Backend:** modelo Prisma (con `workspaceId`) → migración →
   service → DTO → controller → guard.
3. **Frontend:** action en `actions/<resource>.ts` → hooks → componente
   que los consume.
4. **Verificar la coherencia:** la respuesta real del backend pasa el
   `Schema.parse()` del action sin warnings. Si falla, alguno de los
   tres lados está desalineado y se arregla **en el mismo PR**.
5. **Progreso:** entrada numerada en `application progress/`.

---

## 9. Lo que **NO** hacemos

- ❌ UI libraries (Chakra/MUI/Mantine). Inline styles + CSS vars,
  decisión deliberada (ver entrada 01 de `application progress/`).
- ❌ Llamadas HTTP fuera de `actions/`.
- ❌ Tipos duplicados entre front y back. Si el tipo cruza la red,
  vive en `@madoo/shared`.
- ❌ Tablas sin `workspaceId` (excepto las tres tablas de identidad).
- ❌ String literals para nombres de header / query keys que se
  repiten — extraer a constante en `@madoo/shared`.
- ❌ Devolver entidades Prisma crudas desde controllers.
