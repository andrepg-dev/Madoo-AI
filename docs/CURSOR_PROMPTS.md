---
date: 2026-05-02
status: living document — update when a phase finishes or changes
---

# Madoo — Prompts for Cursor

Pack of packaged instructions to run the rest of the master plan
(`application progress/08-master-plan.md`) in Cursor with a weaker
model. Each prompt is atomic: exact paths, clear criteria,
explicit "DO NOT DO".

**Workflow per prompt:**
1. Cursor reads `docs/CONVENTIONS.md` + `application progress/08-master-plan.md`.
2. Summarizes the plan in 5 bullets before touching files. Asks for confirmation.
3. Implements.
4. Runs `pnpm typecheck && pnpm lint` in each affected app.
5. Creates `application progress/NN-...md`.
6. Reports summarized diff and next steps.

If Cursor gets stuck or goes out of scope: cancel, cut the prompt in
half, start over.

---

## 0) Preamble (paste at the beginning of the Cursor session)

```
You are working on Madoo-AI, a Turborepo + pnpm monorepo with:
- apps/backend (NestJS 10 + Prisma 5 + Postgres 5433 + Redis 6379)
- apps/frontend (Next.js 15 + React 19 + TanStack Query + axios)
- packages/shared (@madoo/shared — types + zod schemas)

NON-NEGOTIABLE RULES (read docs/CONVENTIONS.md before each task):
1. Every feature = 3 layers: contract in @madoo/shared → backend (Nest module with workspaceId) → frontend (actions/<resource>.ts WITHOUT hooks, only pure functions + zod parse).
2. Every new table has workspaceId (except User/Workspace/Membership).
3. Authenticated endpoints: @UseGuards(JwtAuthGuard, WorkspaceGuard) + @CurrentWorkspace().
4. Frontend: HTTP only with `fetcher` from @/lib/fetch. Components use useQuery/useMutation directly, NEVER wrapper hooks in actions/.
5. Output DTOs: toXxxDto() (Date → ISO string). Never return raw Prisma entities.
6. Validation: zod in shared, class-validator in backend input DTOs, zod parse in frontend response.
7. DO NOT use UI libraries. Inline styles + CSS vars (theme warm clay).
8. Each large chunk of work = a new file in `application progress/NN-title.md` with frontmatter (date, area, files) and summary.
9. DO NOT invent endpoints, schemas, or names. If in doubt, ask before writing.
10. DO NOT touch future phases: complete only the requested task.

Stack already committed:
- LLM: @anthropic-ai/sdk, claude-sonnet-4-6 model, prompt caching since day 1.
- Streaming: NestJS @Sse(). No WebSockets.
- Queue: bullmq + ioredis.
- CSV: papaparse.
- Sending: resend SDK.
- Email render: @react-email/components + react-dom/server, transpiled with @babel/core + @babel/preset-react, built-in sandbox vm.
- Tracking: node:dns/promises, @nestjs/schedule, @nestjs/throttler.
- Charts: recharts. Billing: stripe. Logs: nestjs-pino. Errors: @sentry/{node,nextjs}.

Before writing code, ALWAYS:
1. `cat application\ progress/08-master-plan.md` — master plan.
2. `cat docs/CONVENTIONS.md` — conventions.
3. `ls apps/backend/src/<similar-module>/` — see existing pattern.
4. Confirm the plan in 5 bullets before touching files.
```

---

## 1) PHASE 1 — VERIFICATION

### Prompt 1.1 — Manual E2E + checklist

```
Task: close the Phase 1 verification of the master plan (section "Phase 1 Verification" in application progress/08-master-plan.md).

Context: the AI generation implementation is already done (apps/backend/src/generation, apps/backend/src/emails, apps/frontend/components/home/{GeneratingScreen,EditorScreen}.tsx). Testing is missing.

Deliverables (DO NOT write code, only report):
1. Start backend and frontend (`pnpm dev`). Report exact commands.
2. For each item in the "Phase 1 Verification" checklist, indicate PASS / FAIL / NOT-TESTED with evidence (logs, SQL queries, described screenshots):
   - E2E: prompt → stream subject + body → edit "make it more casual" → variant 2 visible.
   - validateCode rejects componentCode with `process.`, `require(`, etc. (test with 3 malicious inputs).
   - iframe srcdoc renders identical to the server-side render with the same props.
   - Sandbox timeout: component with `while(true){}` → BadRequestException in ≤3s.
   - Prompt caching: compare inputTokens in 1st vs 2nd generation (query `SELECT inputTokens, cachedTokens FROM "EmailGenerationRun" ORDER BY createdAt DESC LIMIT 5`).
   - EmailGenerationRun persists latencyMs, inputTokens, outputTokens.
3. If any test FAILs: report the file and probable line, DO NOT fix it yet.
4. Create `application progress/18-phase-1-verification.md` with the report.
```

### Prompt 1.2 — Fix detected failures

```
Task: fix ONLY the failures reported in application progress/18-phase-1-verification.md.

Rules:
- One failure = one atomic commit.
- Do not add new features. Do not refactor.
- If a failure requires a Prisma schema change, first show the proposed diff and wait for confirmation.

Deliverable: list of commits with a summary of each.
```

---

## 2) PHASE 2 — CONTACTS & AUDIENCES

Divided into 7 sequential prompts. **Do not skip the order.**

### Prompt 2.1 — Shared contract + Prisma schema

```
Task: define the Contacts/Tags/Segments contract in @madoo/shared and the corresponding Prisma schema. DO NOT write any Nest module or frontend yet.

Steps:
1. In packages/shared/src/contacts.ts (new file): define and export ContactSchema, TagSchema, SegmentSchema, SegmentQuerySchema, SuppressionEntrySchema. Types:
   - Contact: { id, workspaceId, email, firstName?, lastName?, status: "active"|"unsubscribed"|"bounced"|"complained", customFields: Record<string,string>, createdAt, updatedAt }
   - Tag: { id, workspaceId, name, color? }
   - Segment: { id, workspaceId, name, query: SegmentQuery, createdAt }
   - SegmentQuery: { tags?: string[], status?: ContactStatus, createdAfter?: ISO, createdBefore?: ISO, lastOpenAfter?: ISO }
   - SuppressionEntry: { id, workspaceId, email, reason: "unsubscribed"|"hard_bounce"|"complained", createdAt }
2. Export everything from packages/shared/src/index.ts.
3. In apps/backend/prisma/schema.prisma add models: Contact, Tag, ContactTag (join table), Segment, SuppressionEntry. All with workspaceId. Unique index `[workspaceId, email]` on Contact and SuppressionEntry. Cascade from Workspace.
4. Create migration: `cd apps/backend && pnpm prisma migrate dev --name phase2-contacts`.
5. Create `application progress/19-phase-2a-contacts-schema.md` documenting this.

Rules:
- DO NOT create endpoints yet.
- DO NOT touch frontend.
- Confirm the Prisma schema with a diff before running the migration.
```

### Prompt 2.2 — Backend ContactsModule (Basic CRUD, no CSV import)

```
Task: create apps/backend/src/contacts/ with basic Contact CRUD (no CSV import yet).

Endpoints:
- POST /api/v1/contacts (create one)
- GET /api/v1/contacts?segmentId=&search=&page=&pageSize= (paginated list)
- GET /api/v1/contacts/:id
- PATCH /api/v1/contacts/:id
- DELETE /api/v1/contacts/:id
- POST /api/v1/contacts/:id/tags (body: { tagIds: string[] })

Structure: copy the pattern from apps/backend/src/emails/ (controller + service + module + dto/).

Rules:
- @UseGuards(JwtAuthGuard, WorkspaceGuard) on all.
- Service receives workspaceId as the first arg of each method.
- toContactDto() serializes Date to ISO.
- Input DTOs with class-validator (CreateContactDto, UpdateContactDto).
- Register the module in apps/backend/src/app.module.ts.

DO NOT DO:
- CSV import (this is the next task).
- SmartSegment / AI segments.
- Tag CRUD endpoints (this is just assigning existing tags to contacts).

Verification: curl with a valid JWT + X-Workspace-Id creates a contact and it appears in GET.

Document in application progress/20-phase-2b-contacts-crud.md.
```

### Prompt 2.3 — TagsModule + SegmentsModule (No AI)

```
Task: create apps/backend/src/tags/ and apps/backend/src/segments/.

Tags: simple CRUD (POST/GET/DELETE).

Segments:
- POST /segments — body { name, query: SegmentQuery }, validates with SegmentQuerySchema from @madoo/shared.
- GET /segments
- GET /segments/:id
- DELETE /segments/:id
- POST /segments/:id/preview — returns { count, sampleContacts: Contact[] (max 10) } resolving the SegmentQuery to a Prisma where.

Helper: `apps/backend/src/segments/segment-query.ts` with `buildPrismaWhere(workspaceId, query: SegmentQuery): Prisma.ContactWhereInput`.

DO NOT DO: smart segment with Claude (next task).

Document in application progress/21-phase-2c-tags-segments.md.
```

### Prompt 2.4 — CSV Import with BullMQ

```
Task: implement contact import from CSV.

Pre-req: confirm Redis is running (`docker compose ps`). If BullMQ is not installed, install it: `pnpm --filter @madoo/backend add bullmq ioredis @nestjs/bullmq multer papaparse`.

Endpoints:
- POST /contacts/import (multipart, multer): uploads CSV, parses with papaparse server-side, validates required headers (at least `email`), saves temp CSV to disk or in a table `ContactImportJob { id, workspaceId, status, totalRows, processedRows, errors: Json[] }`. Returns { jobId, preview: first 10 rows, detectedColumns: string[] }.
- POST /contacts/import/:jobId/confirm — body { columnMapping: { email: "col_X", firstName?: "col_Y", ... } }. Enqueues BullMQ job "contacts-import".
- GET /contacts/import/:jobId — returns current status of the job.

Worker (apps/backend/src/contacts/contacts-import.processor.ts):
- Processes in chunks of 500.
- Upsert by [workspaceId, email] (idempotent).
- Each row error is accumulated in errors[] as { row, email, reason }.

New Prisma Schema: ContactImportJob. Migration name: `phase2-import-jobs`.

Rules:
- Malformed email → skip + log error, DOES NOT fail the entire job.
- CSV size limit: 10MB. Reject larger with BadRequest.

Document in application progress/22-phase-2d-csv-import.md.
```

### Prompt 2.5 — Smart segments via Claude

```
Task: add POST /segments/from-prompt that uses Claude to generate a SegmentQuery from natural text.

Endpoint:
- POST /segments/from-prompt — body { prompt: string }. Calls GenerationService (reuse the already configured Anthropic client). Force tool use with a tool "build_segment_query" whose schema is SegmentQuerySchema. Returns { query: SegmentQuery, preview: { count, sampleContacts } }.

System prompt: include list of valid columns and valid statuses. Few-shot: 3 examples ("active pro users" → { tags: ["pro"], status: "active" }).

Cache the system prompt + few-shot with prompt caching.

DOES NOT PERSIST. Only returns. The user then calls POST /segments with the returned query.

Document in application progress/23-phase-2e-smart-segments.md.
```

### Prompt 2.6 — Frontend Contacts/Segments

```
Task: replace MOCK_CONTACTS and static SEGMENTS with real data.

Files to create:
- apps/frontend/actions/contacts.ts (pure functions, NO hooks).
- apps/frontend/actions/segments.ts.
- apps/frontend/actions/tags.ts.

Each one: query keys + functions that call fetcher + parse with zod schemas from @madoo/shared.

Components to update:
- apps/frontend/components/contacts/ContactsScreen.tsx: useQuery({ queryKey: contactsKeys.list({segmentId}), queryFn: () => contactsApi.list({segmentId}) }) directly in the component. Keep the exact design, just change the data source.
- "Import CSV" Modal: native HTML5 dropzone (no libraries) → client-side preview with papaparse → column mapping step → confirm. Polling of the job until status="done".
- "New segment" Modal: prompt input → POST /segments/from-prompt → preview → save.

Rules:
- DO NOT use UI or dropzone libraries.
- Keep inline styles + CSS vars.
- Empty state when there are no contacts.

Document in application progress/24-phase-2f-frontend-contacts.md.
```

### Prompt 2.7 — Refactor ComposeModal step 3

```
Task: rewrite step 3 ("Map your variables") of ComposeModal to use `currentVariant.variableSchema` (real) instead of EMAIL_VARIABLES (mock).

File: apps/frontend/components/.../ComposeModal.tsx (find the current component).

Change: each variable from the variableSchema (prop name like `recipientName`) maps to a CSV column / contact customField. If the contact does not have the column, the inline default of the component is used.

DO NOT touch the other steps of the modal.

Document in application progress/25-phase-2g-compose-mapping.md.
```

---

## 3) PHASE 3 — SENDING + DOMAIN + COMPLIANCE

**This phase CANNOT be split between subphases** (master plan rule), but
it can be split into prompts. Sending emails without compliance is illegal, so
3.A + 3.B + 3.C ship in the same final PR even if you build them in parts.

### Prompt 3.1 — Domain schema + DKIM

```
Task: implement 3.A of the master plan (Domain verification).

New Prisma Schema: Domain, DnsCheck (with workspaceId, see list of fields in master plan lines 497-499). Migration `phase3-domains`.

Backend apps/backend/src/domains/:
- POST /domains — creates record, generates RSA 2048 DKIM pair with `crypto.generateKeyPairSync`. Encrypts private key with JWT_SECRET derivation (AES-256-GCM, helper in apps/backend/src/common/crypto.ts). Returns the 4 DNS records (SPF, DKIM, DMARC, return-path).
- GET /domains — workspace list.
- GET /domains/:id — includes latest DnsChecks.
- POST /domains/:id/recheck — manual trigger.
- DELETE /domains/:id.

Helper apps/backend/src/domains/dns-checker.service.ts: uses node:dns/promises to resolve SPF/DKIM/DMARC. Marks verifiedAt when 3/4 pass.

BullMQ worker "domain-dns-recheck" cron every 15min with @nestjs/schedule on all pending domains.

Frontend:
- apps/frontend/actions/domains.ts.
- Real DomainScreen replaces the hardcoded acme.co domain.

Document in application progress/26-phase-3a-domains.md.
```

### Prompt 3.2 — Sending pipeline (Resend driver + Campaign schema)

```
Task: implement 3.B (sending pipeline) partial — schemas + driver + test endpoint, STILL without real send batch.

Prisma Schemas: Campaign, CampaignDelivery (fields in master plan lines 510-514). Migration `phase3-campaigns`.

Backend:
- apps/backend/src/sending/sending-provider.interface.ts: SendingProvider interface with send(batch), parseWebhook(req).
- apps/backend/src/sending/resend.driver.ts: implements the interface using `resend` SDK.
- apps/backend/src/campaigns/ — Campaign CRUD + endpoint POST /campaigns/:id/test that sends 1 email to the logged-in user (compiles componentCode once, renders with mock props, sends with ResendDriver). DOES NOT affect counters.

Rules:
- Reuse existing ReactToHtmlService.
- ENV vars: RESEND_API_KEY, APP_URL, SENDING_DOMAIN. Document in .env.example.

DO NOT DO yet: send to full audience, tracking, compliance footer (next prompts).

Document in application progress/27-phase-3b1-sending-skeleton.md.
```

### Prompt 3.3 — Compliance: footer + unsubscribe

```
Task: implement 3.C (compliance) BEFORE enabling full audience send.

Changes:
1. Schema: add `Workspace.postalAddress: String?`. Migration `phase3-workspace-postal`.
2. Endpoint PATCH /workspaces/me with postalAddress field.
3. apps/backend/src/sending/footer.ts: helper buildComplianceFooter(workspace, contact, deliveryId) that returns HTML with: name, postalAddress, link to unsubscribe (`${APP_URL}/unsubscribe/${token}`).
4. Helper apps/backend/src/sending/unsubscribe-token.ts: HMAC-signed with JWT_SECRET, encodes { contactId, campaignId, deliveryId }.
5. Public endpoint POST /unsubscribe/:token (no guards): decodes, marks Contact.status='unsubscribed', upserts SuppressionEntry, registers Event(type=unsubscribed, next prompt). Also GET for confirmation landing page (static server-rendered HTML).
6. Headers in the sending: List-Unsubscribe + List-Unsubscribe-Post (RFC 8058).
7. Validation in CampaignsService.send: rejects if Workspace.postalAddress is null. Frontend: blocks "Send" button if missing.

Document in application progress/28-phase-3c-compliance.md.
```

### Prompt 3.4 — Sending pipeline batch real

```
Task: close 3.B with the full audience send worker.

Worker apps/backend/src/campaigns/campaign-send.processor.ts (BullMQ "campaign-send"):
1. Resolves audience (segment.query → contacts, excludes SuppressionEntry).
2. Compiles componentCode ONCE at the start (ReactToHtmlService.compileComponent).
3. Iterates in chunks of 200:
   a. Builds variables per contact by mapping variableSchema → customFields (fallback to inline default).
   b. renderComponent → HTML.
   c. Injects compliance footer + unsubscribe link (helpers from prompt 3.3). Tracking pixel and click rewrite will be done by prompt 4.x — for now leave explicit TODOs in the code.
   d. Calls ResendDriver.sendBatch().
   e. Persists messageId in CampaignDelivery.
4. Rate limit with @nestjs/throttler (conservative initial token bucket, configurable by env).

Endpoint: POST /campaigns/:id/send validates (domain verified, audience > 0, variant exists, postalAddress exists) and enqueues.

AuditLog: each send writes row { workspaceId, action: "campaign.send", actorUserId, payload: { campaignId }, createdAt }. New schema if it does not exist.

Document in application progress/29-phase-3b2-sending-batch.md.
```

### Prompt 3.5 — Frontend Campaigns

```
Task: replace MOCK_CAMPAIGNS with real data.

actions/campaigns.ts + actions/audit-log.ts (read-only).

Components:
- CampaignsScreen: useQuery with real campaigns.
- ComposeModal final step "Send": Test (POST /test), Send now (POST /send) buttons. Blocked if postalAddress is missing (show warning + link to settings).
- Settings page for postalAddress (create apps/frontend/app/settings/page.tsx minimum).

Document in application progress/30-phase-3-frontend.md.
```

---

## 4) PHASE 4 — TRACKING + ANALYTICS

### Prompt 4.1 — Event schema + Tracking endpoints

```
Task: implement 4.A of the master plan.

Prisma Schema: Event, TrackedLink. Migration `phase4-tracking`. Index `(campaignId, type, createdAt)`.

apps/backend/src/tracking/tracking.controller.ts (public endpoints, no guards):
- GET /t/o/:token.gif — returns 1x1 transparent gif (hardcoded buffer), writes Event(type=opened). Token = HMAC(deliveryId).
- GET /t/c/:token — resolves TrackedLink, writes Event(type=clicked), redirect 302.

Helper apps/backend/src/tracking/tokens.ts: signTrackingToken / verify.

Modify apps/backend/src/campaigns/campaign-send.processor.ts (from prompt 3.4):
- After rendering HTML, post-process:
  - Insert `<img src="${TRACKING_HOST}/t/o/${token}.gif" width="1" height="1" />` before `</body>`.
  - Rewrite all real `<a href>`: for each one, create TrackedLink, replace href with `${TRACKING_HOST}/t/c/${token}`.

ENV: TRACKING_HOST.

Document in application progress/31-phase-4a-tracking.md.
```

### Prompt 4.2 — Webhook Resend + aggregations

```
Task: implement Resend webhook and aggregations.

Endpoint POST /webhooks/resend (public, verifies signature with Resend secret in ENV: RESEND_WEBHOOK_SECRET):
- Maps email.delivered/email.bounced/email.complained → Event rows.
- Hard bounce → upserts SuppressionEntry, marks Contact.status='bounced'.

apps/backend/src/analytics/:
- CampaignStatsService.getCampaignStats(campaignId, workspaceId) → counts by type + rates (open rate, click rate).
- WorkspaceStatsService.getOverview(workspaceId) → aggregated counters.

Materialized view `campaign_stats`: SQL in a raw Prisma migration. Refresh every 5 min via @nestjs/schedule (`REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_stats`).

Endpoints:
- GET /campaigns/:id/stats
- GET /analytics/overview

Document in application progress/32-phase-4b-analytics-backend.md.
```

### Prompt 4.3 — Frontend Analytics

```
Task: replace the hardcoded SVG in AnalyticsScreen with real recharts.

Pre-req: `pnpm --filter @madoo/frontend add recharts`.

actions/analytics.ts.

AnalyticsScreen:
- Campaign dropdown.
- LineChart of opens over time (recharts).
- BarChart of top clicked links.

CampaignsScreen: real openRate / clickRate (from getCampaignStats) in each row.

Document in application progress/33-phase-4c-analytics-frontend.md.
```

---

## 5) PHASE 5 — BILLING + OBSERVABILITY + POLISH

Three independent prompts, in order of priority.

### Prompt 5.1 — Billing Stripe

```
Task: implement Billing with Stripe.

Pre-req: `pnpm --filter @madoo/backend add stripe`.

Prisma Schema: BillingSubscription. Migration `phase5-billing`. Create Stripe customer upon Workspace creation (modify WorkspacesService.ensurePersonalWorkspace).

apps/backend/src/billing/:
- POST /billing/checkout-session → creates Stripe Checkout Session, returns URL.
- POST /webhooks/stripe (verifies signature with STRIPE_WEBHOOK_SECRET) → upserts BillingSubscription on customer.subscription.{created,updated,deleted} events.
- GET /billing/me → current plan + status.
- POST /billing/portal-session → Stripe Customer Portal URL.

Plan limits enforcement:
- ContactsService.upsert: throws ForbiddenException if it exceeds plan limits.
- CampaignsService.send: ditto.
- Plans: free, basic, medium, pro. Constant table in @madoo/shared.

ENV: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BASIC, STRIPE_PRICE_MEDIUM, STRIPE_PRICE_PRO.

Frontend /settings/billing: current plan + upgrade button + portal link.

Document in application progress/34-phase-5a-billing.md.
```

### Prompt 5.2 — Observability

```
Task: add structured logs, Sentry and health checks.

Backend:
- `pnpm --filter @madoo/backend add nestjs-pino @sentry/node`.
- Configure nestjs-pino with request id + redact tokens (Authorization, JWT, Stripe keys).
- Sentry init in main.ts with SENTRY_DSN.
- Expand /health: DB check (Prisma `$queryRaw`), Redis (ioredis ping), Anthropic (HEAD to API), Resend (ditto).

Frontend:
- `pnpm --filter @madoo/frontend add @sentry/nextjs`.
- Config with NEXT_PUBLIC_SENTRY_DSN.

Document in application progress/35-phase-5b-observability.md.
```

### Prompt 5.3 — Final Polish

```
Task: polish UX before production.

Changes:
1. Loading skeletons instead of spinners on all screens (Contacts, Campaigns, Analytics, Domain, Editor). Components in apps/frontend/components/ui/Skeleton.tsx (inline styles).
2. Error boundaries per screen (apps/frontend/components/ui/ErrorBoundary.tsx).
3. Empty states with CTA: no contacts → "Import CSV", no domain → "Connect domain", no campaigns → "Create campaign".
4. Global useToast (Context + portal) for mutation errors. No library.
5. Clean up apps/frontend/lib/data.ts: only UI constants (categories, tones). Delete MOCK_*.
6. Delete apps/backend/dist/ from the repo + add to .gitignore if missing.

Document in application progress/36-phase-5c-polish.md.
```
