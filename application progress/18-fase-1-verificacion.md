---
date: 2026-05-02
area: fase 1 / verification
files:
  - application progress/08-master-plan.md
  - apps/backend/src/generation/generation.service.ts
  - apps/backend/src/generation/react-to-html.service.ts
  - apps/backend/prisma/schema.prisma
  - apps/frontend/components/home/EditorScreen.tsx
---

# 18 — Fase 1 verification report

## 1) Environment and startup

Project root: `/Users/andreponce/Developments/Madoo-AI`

Exact startup command used by monorepo:

```bash
pnpm dev
```

Resolved script from root `package.json`:

```bash
pnpm dev -> turbo run dev
```

Health checks during run:

- Backend: `GET http://localhost:4000/api/v1/health` -> `200` with `{"status":"ok",...}`.
- Frontend: `GET http://localhost:3000` -> `200` (Home screen HTML returned).

## 2) Fase 1 checklist status

### 2.1 E2E: prompt -> stream subject + body -> edit "make it more casual" -> variant 2 visible

Status: **PASS**

Evidence:

- Created email via API (`POST /api/v1/emails`) -> id `cmookcbkd0001clfkfaopc1b8`.
- Generation SSE (`POST /api/v1/emails/:id/generate`) emitted:
  - `type: "subject"` (id 16 / 28)
  - `type: "code-chunk"` (id 17 / 26)
  - `type: "done"` with `seq: 1` and persisted variant id.
- Edit SSE (`POST /api/v1/emails/:id/edit` with instruction `"make it more casual"`) emitted:
  - `type: "subject"` (id 34 / 52)
  - `type: "code-chunk"` (id 35 / 50)
  - `type: "done"` with `seq: 2`, variant id `cmookey04000dclfknyojyc3i`.
- Final `GET /api/v1/emails/:id` returns variants with `seq: 1` and `seq: 2` (variant 2 persisted and selectable by frontend).

Artifacts:

- `/tmp/fase1-create-email.json`
- `/tmp/fase1-generate.sse`
- `/tmp/fase1-edit.sse`
- `/tmp/fase1-email-after-edit.json`

### 2.2 validateCode rejects malicious `componentCode` (`process.`, `require(`, etc.)

Status: **FAIL**

Evidence (3 malicious inputs against `ReactToHtmlService.compile()`):

1) `require('fs')` -> **REJECTED** (`Blocked pattern in generated component code.`)
2) `eval('2+2')` -> **REJECTED** (`Blocked pattern in generated component code.`)
3) `process.env.JWT_SECRET` -> **REJECTED**, but by render-time error (`Failed to render email HTML: ReferenceError: process is not defined`) instead of validate-time blocklist.

Expected by checklist: reject unsafe code via `validateCode` blocklist before render path.

Artifact:

- `/tmp/fase1-blocklist-tests.jsonl`

Probable file/line:

- `apps/backend/src/generation/react-to-html.service.ts` (blocklist definition near `BLOCKLIST` and `assertSafeSource`, currently no explicit `process.` pattern).

### 2.3 iframe `srcDoc` renders identical to server-side render with same props

Status: **PASS**

Evidence:

- Frontend preview uses backend HTML directly:
  - `srcDoc={activeVariant.compiledHtml}` in `EditorScreen`.
- Re-render parity test on latest variant (`seq: 2`) with same `{}` props:
  - `same: true`
  - `compiledLen: 4006`, `renderedLen: 4006`.

Artifacts:

- `/tmp/fase1-parity.json`
- `apps/frontend/components/home/EditorScreen.tsx` (`iframe` with `srcDoc={activeVariant.compiledHtml}`).

### 2.4 Sandbox timeout: component with `while(true){}` -> `BadRequestException` in <= 3s

Status: **FAIL**

Evidence:

- Running compile on component with `while(true){}` inside component body did **not** fail in <=3s.
- Subprocess timed out at ~5s (`"timedOut": true`), indicating execution hang rather than handled timeout exception.
- An earlier direct run also required manual kill after ~50s.

Artifact:

- `/tmp/fase1-timeout-check.json`

Probable file/line:

- `apps/backend/src/generation/react-to-html.service.ts`
  - VM timeout exists in `vm.runInContext(..., { timeout: 3000 })` for transpiled module execution.
  - No timeout guard around `renderToStaticMarkup(...)` in `renderComponent`, where component body executes.

### 2.5 Prompt caching: compare `inputTokens` on 1st vs 2nd generation

Status: **FAIL**

Evidence:

- Requested SQL from checklist (`SELECT inputTokens, cachedTokens ...`) currently fails due schema mismatch and identifier case:
  - column name `cachedTokens` does not exist.
- Controlled 1st/2nd initial generation (same prompt):
  - 1st run token event: `input_tokens=360`, `cache_creation_input_tokens=2103`, `cache_read_input_tokens=0`
  - 2nd run token event: `input_tokens=360`, `cache_creation_input_tokens=0`, `cache_read_input_tokens=2103`
- Result: cache read is present on second run, but `inputTokens` did not reduce (360 -> 360), so checklist criterion "reduce inputTokens >=80%" is not met with current persisted metric.

Artifacts:

- `/tmp/fase1-generate.sse`
- `/tmp/fase1-generate-2.sse`
- `/tmp/fase1-caching-query.txt`

Probable file/line:

- `apps/backend/src/generation/generation.service.ts` (run persistence fields written as `inputTokens`, `cacheCreationInputTokens`, `cacheReadInputTokens`; no `cachedTokens` field used by checklist query).
- `apps/backend/prisma/schema.prisma` (`EmailGenerationRun` model fields do not include `cachedTokens`).

### 2.6 `EmailGenerationRun` persists `latencyMs`, `inputTokens`, `outputTokens`

Status: **PASS**

Evidence:

Latest DB rows contain all required fields populated:

- `inputTokens`, `outputTokens`, `latencyMs` present in recent runs.
- Example rows show non-null values (e.g. `1502 / 2994 / 54992ms`, `360 / 2317 / 46277ms`).

Artifact:

- `/tmp/fase1-generation-runs.txt`

## 3) Summary of checklist outcome

- PASS: 3
- FAIL: 3
- NO-PROBADO: 0

Open failures to fix in Prompt 1.2:

1. validateCode does not pre-block `process.` usage.
2. Infinite loop inside component body is not bounded by <=3s timeout.
3. Prompt-caching verification criterion based on `inputTokens` cannot be satisfied with current metric shape/query (`cachedTokens` missing and `inputTokens` unchanged across warm runs).
