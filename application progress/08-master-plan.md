---
date: 2026-04-26
area: planning / monorepo
files: master plan
---

# 08 — Master Plan: construir Madoo end-to-end

Plan vivo. Cada `[ ]` es un to-do. Marcar `[x]` cuando esté hecho. Cada
fase grande genera su propio entry numerado en `application progress/`.

---

## 0. Resumen del producto

Madoo es un **email marketing AI-native**: el usuario describe el email
en palabras, Madoo lo escribe, lo diseña, lo envía. Compite con Mailchimp/
Klaviyo pero invierte el modelo: prompt-driven en vez de form-driven.

Las seis "columnas" del producto:

1. Generación AI (prompt → subject + body + layout)
2. Editor + preview (variantes v1/v2/v3, AI-assisted edits)
3. Sending infra (Resend bajo el capó, SPF/DKIM/DMARC automatizados)
4. Contacts & audiences (CSV, segmentación, tags)
5. Analytics (opens, clicks, bounces, A/B)
6. Compliance (unsubscribe, GDPR/CAN-SPAM, audit)

Filosofía de auth: **el login no es un muro**. Sólo se pide cuando el
usuario presiona Enter en el textarea, y el prompt se preserva a través
del round-trip.

---

## 1. Estado actual (línea de partida)

### Hecho ✅

- Monorepo Turborepo + pnpm (`apps/frontend`, `apps/backend`,
  `packages/*` vacío).
- Frontend Next.js 15 + React 19 + inline styles + CSS variables,
  fuentes via `next/font/google`. Tema warm clay por defecto.
- TanStack Query + axios wrapper + `actions/<resource>.ts` como
  patrón de acceso a la API.
- Backend NestJS 10 + Prisma 5 + Postgres 16 (puerto 5433 via
  `docker-compose`), `/api/v1` con `ValidationPipe` global y CORS
  configurable.
- Auth Google Identity Services (popup in-page) → backend verifica el
  ID token con `google-auth-library` → emite JWT propio.
- Flow de prompt-gating: prompt se persiste en `localStorage` +
  `PendingPrompt` y se restaura post-login.
- TopBar muestra usuario logueado con dropdown (avatar/iniciales,
  Sign out funcional).
- Pantallas estáticas en frontend: `/`, `/contacts`, `/campaigns`,
  `/analytics`, `/domain`. Todas con datos mockeados.

### Mock / pendiente ⚠️

- **Generación**: `GeneratingScreen` es animación falsa de 5 pasos.
  `EditorScreen` usa `generateSubject()` / `generateBody()` hardcoded
  en `lib/data.ts`. **No hay LLM**.
- **Editor**: "Quick edits" no hace nada. El textarea AI no envía a
  ningún lado.
- **Templates**: 12 previews React, sin backend.
- **Contacts**: `MOCK_CONTACTS` y `SEGMENTS` estáticos. Sin CSV
  import. Sin segments en DB.
- **Campaigns**: `MOCK_CAMPAIGNS`. `ComposeModal` es un wizard
  visual, no manda nada.
- **Domain**: dominio `acme.co` hardcoded, DNS records mock, sin
  verificación real.
- **Analytics**: números fijos, gráfico SVG hardcoded.
- **Sending**: no existe.
- **Tracking, unsubscribe, footer compliance**: no existen.
- **Billing**: no existe.

---

## 2. Decisiones arquitectónicas (cerradas antes de empezar)

Estas decisiones bloquean el resto del plan. **Confirmar antes de
ejecutar Fase 0.**

### 2.1 Modelo de tenancy

**Decisión propuesta:** introducir `Workspace` + `Membership` ahora,
antes de Fase 1. El producto promete "connect *your* domain" → cada
domain/contact list/campaign vive bajo un workspace, no bajo un user
suelto. Retrofitear 6 tablas con un FK nuevo después es el camino
doloroso.

```prisma
model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   Membership[]
}

model Membership {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        Role     @default(OWNER)
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([workspaceId, userId])
}

enum Role { OWNER ADMIN MEMBER }
```

Todas las tablas posteriores (Email, Template, Contact, Segment,
Domain, Campaign, Event, BillingSubscription) llevarán `workspaceId`.

**Alternativa**: V1 single-user-per-account, documentado y tracked
para v2. Más simple ahora, costoso luego. **No recomendado.**

### 2.2 Pipeline de render de email — React Email

**Decisión:** los emails se escriben como **componentes React** usando
`@react-email/components` (`<Html>`, `<Body>`, `<Container>`,
`<Heading>`, `<Section>`, `<Button>`, `<Text>`, etc.). El LLM emite
**JSX como string** + un schema de variables; el backend lo transpila
con Babel, lo evalúa en un sandbox `vm`, y lo renderiza a HTML
email-safe con `react-dom/server` (o `@react-email/render`).

**Por qué React Email y no MJML:**

- El stack ya es React end-to-end. Sin DSL nuevo que aprender / que el
  LLM se equivoque generando.
- Claude tiene infinitamente más training data en JSX que en MJML.
- Las variables son props con defaults inline:
  `const Email = ({ recipientName = "friend", company = "your team" } = {}) => (...)`.
  Substitución por contacto = render del componente con
  `{ recipientName: contact.firstName, ... }`. Sin string-replace, sin
  escaping de tokens.
- Los 12 templates actuales (`TemplatePreview.tsx`) se migran a React
  Email casi 1:1.

**Pipeline backend (`ReactToHtmlService`)** — referencia ya probada:

1. `compileComponent(code: string)` — Babel transpila JSX con
   `@babel/preset-react` → `vm.createContext` con `React` y
   `@react-email/components` (`Components`) inyectados →
   `vm.runInContext(wrapped, sandbox, { timeout: 3000 })` →
   `sandbox.exports.default` es el componente. Antes del transpile,
   regex blocklist corta `process.`, `require(`, `import(`, `eval(`,
   `Function(`, `globalThis`, `global.`, `__proto__`, `constructor[`,
   `child_process`, `fs.`, `exec(`, `spawn(`.
2. `renderComponent(Component, variables)` — invoca con props,
   `renderToStaticMarkup(React.createElement(Component, variables))`,
   prepende doctype XHTML 1.0 Transitional, retorna HTML.
3. `compile(code, variables)` — atajo que combina los dos.

**Patrón obligatorio para los componentes que emite el LLM:**

```jsx
const Email = ({
  recipientName = "there",
  company = "your team",
  ctaUrl = "https://example.com",
} = {}) => (
  <Html>
    <Body>...</Body>
  </Html>
);
```

Defaults inline → el componente nunca explota si faltan props, y el
preview sin contacto seleccionado renderiza algo razonable.

**Caching:** `compileComponent` se llama una vez por
`sha256(componentCode)` (cache en memoria + opcional en Redis).
Después se llama `renderComponent` N veces — una por destinatario en
el pipeline de send. **No re-transpilar por destinatario.**

**Preview en frontend:** `<iframe srcdoc={variant.compiledHtml}>` con
props de preview (mock contact). Mismo HTML que recibe el destinatario
→ paridad pixel garantizada.

**Seguridad — V1 vs prod:** `vm` nativo NO es un sandbox real
(escapable con suficiente esfuerzo). Para V1 es aceptable porque el
`componentCode` viene sólo del LLM (controlado por Madoo) o de
templates curados internos — los end-users **nunca** pegan JSX raw.
**Antes de prod**: migrar a `isolated-vm` (V8 isolate real). Tracked
en riesgos.

### 2.3 Streaming de generación

**Decisión:** `@nestjs/common` ya trae `@Sse()`. SSE para todo lo que
sea generación incremental (subject + body streaming). No introducir
WebSockets.

### 2.4 Workspace `packages/shared`

Hoy está vacío. Va a contener:

- Tipos TypeScript compartidos (`User`, `Email`, `Contact`, etc.).
- Schemas `zod` para validación a ambos lados (front + back).
- Helpers de URL de tracking (`buildOpenPixelUrl`, `buildClickUrl`)
  para que el rendering server-side y el sending compartan la misma
  lógica.
- Tipos de eventos del dominio (`EmailGeneratedEvent`,
  `CampaignSentEvent`).

---

## 3. Tool stack comprometido (no re-litigar después)

| Categoría | Pick | Notas |
|-----------|------|-------|
| LLM | `@anthropic-ai/sdk` | Default Claude Sonnet 4.6. Habilitar prompt caching desde el día uno. |
| Streaming | NestJS `@Sse()` | Sin WebSockets. |
| Queue | `bullmq` + `ioredis` | Redis nuevo en `docker-compose`. |
| CSV | `papaparse` | Front (preview) y back (parse). |
| Sending | `resend` SDK | Driver default. Interface para Postmark/SES en v2. |
| Email render | `@react-email/components` + `react-dom/server` | Componentes React → HTML email-safe. Opcional: `@react-email/render` para inline-styling más fino. |
| Transpile + sandbox | `@babel/core` + `@babel/preset-react` + `vm` (built-in) | Compila JSX-string del LLM en runtime. V1 con `vm`; pre-prod migrar a `isolated-vm`. |
| Validación | `zod` | En `packages/shared`. |
| DNS | `node:dns/promises` | Built-in. |
| Logs | `nestjs-pino` | Estructurados. |
| Errores | `@sentry/node` + `@sentry/nextjs` | DSN via env. |
| Charts | `recharts` | Frontend, reemplazar SVG hardcoded. |
| Billing | `stripe` | Webhooks + customer portal. |
| Cron | `@nestjs/schedule` | DNS recheck, warmup throttle. |
| Throttling | `@nestjs/throttler` | Por endpoint público. |
| Cache | `@nestjs/cache-manager` + Redis | Cuando haga falta. |
| Uploads | `multer` | CSV files. |
| Dates | `dayjs` | Frontend. |

**No usar:** ningún UI library (Chakra/MUI/Mantine). Inline styles
+ CSS vars es decisión deliberada (entrada 01).

---

## 4. Variables de entorno (a poblar)

### Backend (`apps/backend/.env`)

```
DATABASE_URL=postgresql://madoo:madoo@localhost:5433/madoo?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<existing>
CORS_ORIGINS=http://localhost:3000

# Fase 1
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

# Fase 3
RESEND_API_KEY=
APP_URL=http://localhost:3000
SENDING_DOMAIN=madoo.app

# Fase 4
TRACKING_HOST=https://t.madoo.app   # opcional, separar pixel/click

# Fase 5
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_GROWTH=price_xxx
SENTRY_DSN=
```

### Frontend (`apps/frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<existing>
NEXT_PUBLIC_SENTRY_DSN=
```

---

# Plan por fases

## Fase 0 — Pre-work y decisiones bloqueantes

> Salir de esta fase con tenancy decidido, infra de cola levantada, y
> `packages/shared` poblado.

- [ ] Confirmar la decisión de Workspace + Membership con el equipo.
- [ ] Migración Prisma: agregar `Workspace`, `Membership`, `Role`. Cada
      `User` que se loguea por primera vez con Google crea un workspace
      "Personal" y un membership OWNER.
- [ ] Endpoint `GET /api/v1/workspaces/me` que devuelva el workspace
      activo del user (single-workspace en V1).
- [ ] Frontend: `useWorkspace()` hook + `<WorkspaceProvider>`.
      Inyectar `X-Workspace-Id` en el axios request interceptor.
- [ ] Backend: `@CurrentWorkspace()` decorator + guard que extrae el
      workspace del header y verifica membership.
- [ ] Agregar Redis a `docker-compose.yml`:
      ```yaml
      redis:
        image: redis:7-alpine
        container_name: madoo-redis
        ports: ["6379:6379"]
        volumes: ["madoo-redis-data:/data"]
      ```
- [ ] Crear `packages/shared` con `package.json` (workspace
      `@madoo/shared`), `tsconfig`, exports de tipos + zod schemas
      vacíos. Wirear en `apps/frontend` y `apps/backend`.
- [ ] Definir el primer schema compartido en `@madoo/shared`:
      `WorkspaceSchema`, `UserSchema`.

## Fase 1 — Generación AI real (cierra el loop "describir → email")

> Reemplazar el `GeneratingScreen` falso y `generateBody()` hardcoded
> con generación real vía Claude Sonnet 4.6, persistir el resultado.

### Backend

- [ ] Schema Prisma: `Email`, `EmailVariant`, `EmailGenerationRun`,
      `Template`. Cada uno con `workspaceId`.
      ```
      Email { id, workspaceId, prompt, tone, length, audience, status, currentVariantId }
      EmailVariant { id, emailId, componentCode, variableSchema, compiledHtml, subject, version, createdAt }
      EmailGenerationRun { id, emailId, model, inputTokens, outputTokens, cachedTokens, latencyMs, error?, createdAt }
      Template { id, workspaceId?, name, category, componentCode, variableSchema, accent, bg, isPublic, tier }
      ```
- [ ] `EmailsModule` con CRUD básico (`POST /emails`, `GET /emails/:id`,
      `GET /emails`, `DELETE /emails/:id`).
- [ ] `GenerationModule`: servicio que envuelve Anthropic SDK con
      prompt caching (system prompt + few-shot de componentes React
      Email cacheados). Output **estructurado** (tool use forzado):
      ```ts
      { subject: string;
        componentCode: string;
        variableSchema: VariableSpec[]; }
      type VariableSpec = { name: string; label?: string;
        default: string; role?: "text" | "url" | "image" | "date" };
      ```
      System prompt incluye:
      - Lista exacta de componentes válidos de `@react-email/components`.
      - Restricciones: no `import`/`require`/`process`/etc. (mismo
        blocklist que el sandbox), defaults inline en props, exportar
        como `const Email = (...) => (...)`.
      - 4 templates seed como few-shot (los que migremos primero).
- [ ] `POST /emails/:id/generate` (SSE): emite eventos
      `meta` → `subject` → `code-chunk` (× N) → `done`. Cuando llega
      `done`: compila + renderiza + persiste `EmailVariant`
      (`componentCode`, `compiledHtml`, `variableSchema`) y
      `EmailGenerationRun`.
- [ ] `POST /emails/:id/edit`: AI edit follow-up. Recibe la instrucción
      ("make it shorter") + el `componentCode` actual + el
      `variableSchema` como contexto. Claude regresa el nuevo
      `componentCode` (mismo schema de output). Se compila, valida
      (sandbox lo carga sin throw), persiste como nuevo `EmailVariant`.
- [ ] `ReactToHtmlService` (referencia: el fragmento que ya tenemos
      probado en otro proyecto):
      - `validateCode(code)`: regex blocklist (`process.`, `require(`,
        `import(`, `eval(`, `Function(`, `globalThis`, `global.`,
        `__proto__`, `constructor[`, `child_process`, `fs.`, `exec(`,
        `spawn(`) → `BadRequestException("Code not allowed.")`.
      - `compileComponent(code)`: Babel `transformSync` con
        `@babel/preset-react` → `vm.createContext({ React, Components,
        exports })` → `vm.runInContext(wrappedCode, ctx, { timeout:
        3000, displayErrors: true })`. `wrappedCode` desestructura
        todos los componentes de `@react-email/components` y exporta
        `Email` (o `Default`). Cachear el componente compilado por
        `sha256(componentCode)`.
      - `renderComponent(Component, variables)`:
        `renderToStaticMarkup(React.createElement(Component, variables))`,
        prepende doctype XHTML 1.0 Transitional.
      - `compile(code, variables)`: shortcut que llama a los dos.
- [ ] Validador de `variableSchema`: zod schema en `@madoo/shared`,
      asegura que cada variable tiene `name` (camelCase, válida como
      ident JS), `default` (string), opcional `label`/`role`. Rechaza
      generaciones con schema inválido y reintenta una vez con feedback
      al modelo.
- [ ] Migrar `PendingPrompt.consume()` para que emita un `Email` y
      dispare `generate` automáticamente.

### Frontend

- [ ] `actions/emails.ts` con `useCreateEmail`, `useEmail`,
      `useGenerateEmailStream` (SSE consumer custom),
      `useEditEmail`.
- [ ] Reescribir `GeneratingScreen` para consumir el stream real
      (mostrar subject cuando llega, indicador "compilando…" cuando
      llega `done` y el backend está renderizando).
- [ ] `EditorScreen` lee de `Email + currentVariant`. Preview:
      `<iframe srcdoc={variant.compiledHtml} title="Email preview"
      sandbox="allow-same-origin">` (sin scripts, sin popups).
- [ ] Quick edits laterales ("Make it shorter", "More casual tone",
      "Add urgency", etc.) → POST `/edit` con la instrucción + el
      `componentCode` actual. Mostrar diff sutil al cambiar variante
      (highlight del bloque que cambió).
- [ ] Variantes v1/v2/v3 = los últimos 3 `EmailVariant` por email.
      Switch entre variantes recompila el `<iframe srcdoc>`.
- [ ] Migrar los 12 templates de `TemplatePreview.tsx` a componentes
      React Email (`@react-email/components`):
      - V1: 4 templates (launch, newsletter, sale, welcome) escritos a
        mano y guardados como seed (`Template` rows, `isPublic: true`,
        `workspaceId: null`).
      - Cada template define `componentCode` + `variableSchema` +
        `accent` + `bg`.
      - Los 8 restantes se migran en sprints paralelos durante
        Fases 2-3.
- [ ] El AI editor lateral muestra `variableSchema` como una lista de
      variables editables (campo "Default value" + el botón "map to
      contact field" cuando se entre al ComposeModal).
- [ ] Eliminar `generateSubject` / `generateBody` / `altSubject` de
      `lib/data.ts`. Mover `MOCK_CAMPAIGNS`/`MOCK_CONTACTS` a fixtures
      de seed (no se usarán más en producción).

### Verificación Fase 1

- [ ] E2E: usuario tipea "anuncia mi nuevo pricing", presiona Enter,
      ve subject + cuerpo aparecer en streaming, edita "make it more
      casual", aparece variante 2.
- [ ] El `componentCode` generado pasa el `validateCode` blocklist en
      el 100% de los casos (si no, el LLM se reintenta una vez con
      feedback).
- [ ] El `<iframe srcdoc>` del frontend renderiza pixel-idéntico al
      `compileComponent + renderComponent` server-side con las mismas
      props.
- [ ] Sandbox timeout: un componente con `while(true){}` en el body
      del componente tira `BadRequestException` en ≤3s.
- [ ] Costo del primer prompt: validar prompt caching reduce input
      tokens en ≥80% en la segunda llamada.
- [ ] `EmailGenerationRun` tiene latencia + tokens persistidos.

## Fase 2 — Contacts & audiences (paralelo a Fase 1)

> Cierra la mitad "a quién mando esto". CSV import real, segmentos
> persistidos.

### Backend

- [ ] Schema: `Contact`, `Tag`, `ContactTag`, `Segment`,
      `SuppressionEntry`. Todos con `workspaceId`. Email único por
      workspace (ix `[workspaceId, email]`).
- [ ] `ContactsModule`: CRUD + bulk operations.
- [ ] `POST /contacts/import` (multipart/form-data, `multer`):
      sube CSV, parse server-side con `papaparse`, valida headers,
      mapea columnas, devuelve preview + import job id.
- [ ] `POST /contacts/import/:jobId/confirm`: encola job en BullMQ
      `contacts-import` que procesa en chunks de 500. Idempotente
      (upsert por email).
- [ ] `SegmentsModule`: segmento = `{ name, query: SegmentQuery }`.
      `SegmentQuery` es JSON con DSL simple: `{ tags: ["pro"], status:
      "active", lastOpenAfter: "..." }`. Resolver compila a Prisma
      `where`.
- [ ] Endpoint "smart segment": `POST /segments/from-prompt` recibe
      texto natural, usa Claude para emitir el `SegmentQuery`,
      preview de resultados antes de guardar.
- [ ] `SuppressionEntry` (workspaceId, email, reason, createdAt) — se
      llena automáticamente desde unsubscribes y bounces hard. Toda
      query de "audiencia para enviar" lo excluye.

### Frontend

- [ ] `actions/contacts.ts`, `actions/segments.ts`.
- [ ] `ContactsScreen` reemplaza `MOCK_CONTACTS` con
      `useContacts({ segmentId })`.
- [ ] Modal "Import CSV": dropzone (`react-dropzone` o nativo HTML5
      drag&drop), preview con `papaparse` client-side (primeras 10
      filas + detección de columnas), step de mapeo de columnas
      (`first_name` → CSV col X), confirm → POST.
- [ ] Modal "New segment" con AI ("describe your group") + builder
      manual.
- [ ] Tags: `POST /contacts/:id/tags`, render como pills.
- [ ] Reescribir step 3 ("Map your variables") del `ComposeModal`:
      ahora la fuente de las variables no es `EMAIL_VARIABLES` (mock)
      sino `currentVariant.variableSchema`. Cada variable (prop name
      como `recipientName`) se mapea a una columna del CSV. Se siguen
      respetando defaults inline del componente cuando un contacto
      no tiene la columna.

### Verificación Fase 2

- [ ] Importar 5k contactos en CSV en < 30s. Polling del job hasta
      done. Errores por fila reportados (línea X: email inválido).
- [ ] Crear segmento "Pro customers active in last 30 days" via AI →
      preview muestra count → guardado.
- [ ] Borrar contacto → cascade (sus tags, sus events futuros se
      saltan).

## Fase 3 — Sending pipeline + Domain + Compliance (bundle)

> Esta fase **no se puede partir**. Mandar emails sin unsubscribe link
> es ilegal en US/EU. Tres componentes que se shipean juntos.

### 3.A Domain verification

- [ ] Schema: `Domain { id, workspaceId, hostname, status, dkimPublicKey,
      dkimPrivateKey?, verifiedAt? }`, `DnsCheck { id, domainId, type,
      hostname, expected, actual?, ok, checkedAt }`.
- [ ] `DomainsModule`: `POST /domains` crea registro, genera par DKIM
      RSA 2048 (almacena private encriptada con KMS o, en V1,
      `crypto.privateDecrypt` con `JWT_SECRET`-derived key — flag para
      pasar a KMS pre-prod), devuelve los 4 DNS records que el usuario
      tiene que pegar.
- [ ] Worker BullMQ `domain-dns-recheck`: corre cada 15 min los
      domains `pending`. Usa `node:dns/promises` para resolver SPF,
      DKIM, DMARC, return-path. Marca `verifiedAt` cuando 3/4 pasan.
- [ ] `POST /domains/:id/recheck` para trigger manual.
- [ ] Frontend `DomainScreen` real: `useDomain()`, mostrar status real,
      botón Re-check ahora hace algo, copy buttons funcionales.

### 3.B Sending pipeline

- [ ] Schema: `Campaign { id, workspaceId, emailId, segmentId,
      status, scheduledFor?, sentAt?, fromName, fromEmail, replyTo?,
      abTest: boolean }`, `CampaignDelivery { id, campaignId, contactId,
      messageId?, status, sentAt?, openedAt?, clickedAt?, bouncedAt?,
      unsubscribedAt? }`.
- [ ] `CampaignsModule`: CRUD + `POST /campaigns/:id/send` valida
      (domain verified, audience > 0, email tiene variant, footer ok)
      y encola job `campaign-send`.
- [ ] Worker `campaign-send`: itera la audiencia en chunks de 200.
      Compila `componentCode` **una sola vez** al arrancar el job
      (`ReactToHtmlService.compileComponent`). Por cada chunk:
      1. Por cada contacto: construye `variables` mapeando
         `variableSchema` → columnas del contacto, con fallback al
         `default` del componente.
      2. `renderComponent(Component, variables)` → HTML por contacto.
      3. Post-procesa el HTML: inyecta tracking pixel
         (`<img src="...t/o/{token}.gif" />`), reescribe `<a href>`
         con tracking redirect, agrega footer compliance + unsubscribe
         link.
      4. Llama Resend `batch.send()`. Persiste `messageId` en
         `CampaignDelivery`.
      5. Rate-limit con `@nestjs/throttler` token bucket configurado
         para empezar conservador (warmup IP).
- [ ] `SendingProvider` interface (driver). `ResendDriver`
      implementa `send(batch)`, `parseWebhook(req)`. Permite agregar
      Postmark/SES después sin tocar `CampaignsModule`.
- [ ] `POST /campaigns/:id/test` envía a 1 email de prueba (el del
      user logueado) sin afectar contadores.

### 3.C Compliance (V1, no opcional)

- [ ] Footer auto-inyectado en cada email enviado: nombre del
      remitente, dirección postal del workspace (`Workspace.postalAddress`,
      requerido por CAN-SPAM), link a unsubscribe.
- [ ] Header `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058).
- [ ] `POST /unsubscribe/:token` (público, sin auth): token firmado
      con HMAC, decodifica `{ contactId, campaignId }`. Marca
      `Contact.status='unsubscribed'`, agrega a `SuppressionEntry`,
      registra `Event(type=unsubscribed)`. Página estática de
      confirmación.
- [ ] Double opt-in (opt-in, no V1 default): infra lista pero
      apagado por flag `Workspace.requireDoubleOptIn`.
- [ ] `WorkspaceSettings.postalAddress` requerido **antes** del primer
      send. Frontend bloquea send sin él.
- [ ] Auditoría: cada send escribe `AuditLog { workspaceId, action,
      actorUserId, payload, createdAt }`.

### Verificación Fase 3

- [ ] Verificar dominio real en Cloudflare → DNS check pasa → status
      verified.
- [ ] Mandar campaña test a 1 contacto propio → llega con footer
      compliance, unsubscribe link funciona, click en unsubscribe
      borra al contacto de la lista.
- [ ] `messageId` de Resend persistido en `CampaignDelivery`.

## Fase 4 — Tracking + Analytics

> Convertir cada send en datos. Pixel, click rewrite, webhooks de
> Resend, agregaciones.

### Backend

- [ ] Schema: `Event { id, workspaceId, campaignId, contactId, type,
      data, createdAt }`. Type ∈ `delivered | opened | clicked |
      bounced | complained | unsubscribed`. Index
      `(campaignId, type, createdAt)`.
- [ ] `TrackingModule` con endpoints públicos:
      - `GET /t/o/:token.gif` → 1×1 transparent gif + escribe
        `Event(opened)`. Token = HMAC(deliveryId).
      - `GET /t/c/:token` → resuelve URL real, escribe
        `Event(clicked)`, redirect 302.
- [ ] Click rewrite: en el pipeline de send (3.B paso 2), reemplazar
      todos los `<a href>` del HTML compilado por
      `${TRACKING_HOST}/t/c/${token}`. Persistir mapping
      `{ token → originalUrl }` en `TrackedLink`.
- [ ] Webhook Resend: `POST /webhooks/resend` (verificar firma).
      Mapea eventos `email.delivered`, `email.bounced`,
      `email.complained` → `Event` rows. Hard bounce → suppression.
- [ ] Servicios de agregación:
      `CampaignStatsService.getCampaignStats(campaignId)` (counts +
      rates), `WorkspaceStatsService.getOverview()`.
- [ ] Materialized view `campaign_stats` refresheada cada 5 min via
      cron (Postgres `REFRESH MATERIALIZED VIEW CONCURRENTLY`).

### Frontend

- [ ] `actions/analytics.ts` con `useCampaignStats`,
      `useWorkspaceOverview`.
- [ ] `AnalyticsScreen` real con `recharts` (line chart de opens,
      bar chart de top links). Dropdown de campaña.
- [ ] `CampaignsScreen` muestra `openRate` / `clickRate` reales por
      campaña.

### Verificación Fase 4

- [ ] Mandar email a inbox propio → abrir en cliente que carga
      imágenes → `Event(opened)` aparece. Click un link → redirect
      ok + `Event(clicked)`.
- [ ] Webhook Resend simulado con `curl` → bounce registrado, contacto
      marcado.

## Fase 5 — Billing + observabilidad + polish

> Lo que cierra el ciclo de cobro y producción.

### Billing

- [ ] Stripe customer creado al crear workspace.
- [ ] Schema: `BillingSubscription { workspaceId, stripeCustomerId,
      stripeSubscriptionId, plan, status, currentPeriodEnd }`.
- [ ] `BillingModule`: `POST /billing/checkout-session` → Stripe
      Checkout, `POST /webhooks/stripe` (verifica firma) → upserta
      subscription.
- [ ] Plan limits enforcement en `ContactsService.upsert`,
      `CampaignsService.send`. Plan starter = 1k contactos, growth =
      5k.
- [ ] Frontend `/settings/billing` con plan actual + upgrade button +
      customer portal link.

### Observabilidad

- [ ] `nestjs-pino` con request id, redact tokens.
- [ ] Sentry en backend y frontend con DSN env.
- [ ] Health check ampliado: DB ping, Redis ping, Anthropic ping,
      Resend ping.
- [ ] Métricas básicas (opcional): `prom-client` exporter + endpoint
      `/metrics` protegido.

### Polish

- [ ] Loading skeletons en lugar de spinners en todas las pantallas.
- [ ] Error boundaries en frontend (per-screen).
- [ ] Empty states con CTA claro (sin contactos → "Import CSV", sin
      dominio → "Connect domain").
- [ ] `useToast` global para errores de mutation.
- [ ] Migrar `apps/frontend/lib/data.ts` para que sólo exporte
      constantes UI (categorías, tones), no fixtures de datos.
- [ ] Borrar `dist/` del backend del repo.

---

# 5. Riesgos / open questions

- **Costo de Anthropic en MVP**: una sola generación con Sonnet 4.6 +
  prompt caching cuesta ~$0.005. 100 generaciones/mes/usuario en
  starter ≈ $0.50/user. OK. Trackear `EmailGenerationRun.totalCost`
  para correlación con plan.
- **DKIM key storage**: V1 con encriptación derivada de `JWT_SECRET`
  es aceptable para localhost/staging. **Antes de prod**: mover a
  AWS KMS o Vault. Marcar en backlog.
- **Resend rate limits**: 10 req/s default. Para campañas grandes
  (>10k recipients), nuestra cola tiene que respetar eso. Documentar
  en el `ResendDriver` y dejar configurable.
- **React Email migration de templates existentes**: 12 templates a
  migrar. Trabajo manual. V1 ships con 4 (launch, newsletter, sale,
  welcome); los 8 restantes en sprints paralelos durante Fase 2-3.
- **Seguridad del sandbox de compilación**: Node `vm` con regex
  blocklist + timeout 3s es defensa en profundidad ligera. Es
  aceptable mientras `componentCode` venga sólo del LLM (Claude) y de
  templates curados internos — los end-users **nunca** pegan JSX raw
  en el editor (sólo prompts en lenguaje natural). **Antes de habilitar
  templates publicados por usuarios, marketplace, o cualquier path que
  acepte JSX externo**: migrar a `isolated-vm` (V8 isolate real, no
  evadible). Tracked.
- **Cookies / GDPR**: el tracking pixel cuenta como cookie/tracking
  para GDPR. El footer ya cubre el aviso. Si hay clientes en EU es
  posible que necesitemos consent banner antes de open tracking.
  Out of scope para V1, escalable a v2.
- **Workspace switching UI**: V1 es single-workspace efectivo (cada
  user crea su "Personal"). Multi-workspace + invitaciones queda
  para v2. La data model ya lo soporta.

---

# 6. Cómo se ejecuta este plan

1. Cada fase grande (0..5) genera **un entry numerado** en
   `application progress/` cuando se completa o se hace progreso
   sustancial. Format: `09-fase-0-tenancy-y-shared.md`, etc.
2. Cuando un to-do tenga subtareas no triviales o un fix
   incidental, también se registra como su propia entrada (siguiendo
   el patrón actual: `03-fix-...`, `05-fix-...`, etc.).
3. El plan vive en este mismo archivo. Marcar `[x]` los to-dos
   completados; mover a "done" o tachar visualmente cuando una fase
   completa termina.
4. Si una decisión de la sección 2 cambia, **actualizar este archivo
   en el mismo PR** que la cambia. No dejar drift.
