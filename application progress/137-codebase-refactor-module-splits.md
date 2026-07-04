# 137 — Codebase refactor: split oversized modules

Fecha: 2026-07-04

## Objetivo

Refactor de limpieza (behavior-preserving) sobre los archivos más grandes del
monorepo. Ningún cambio de lógica, JSX ni contratos — solo extracción de
código a módulos enfocados. Ejecutado con Codex bajo instrucciones y
revisión por archivo; cada paso verificado con build antes de commit.

## Cambios

### Backend
- `generation/generation.service.ts` 1960 → 1527 líneas.
  - `generation.tools.ts` — definiciones de tools de Anthropic (EMIT_EMAIL_TOOL, etc.) + `buildQuickChartUrl`.
  - `generation.prompts.ts` — STATIC_INSTRUCTION, FEW_SHOT_TEXT y constantes de límites.
  - `generation.util.ts` — helpers puros (sanitizeGeneratedVariableSchema, formatLlmError, …) + `GenerationAbortedError`.
- `admin/admin-analytics.service.ts` 1146 → ~930 líneas.
  - `admin-analytics.util.ts` — helpers puros de fechas/agregación (metricDelta, buildInsights, …) + tipos compartidos.

### Client
- `settings/settings-view.tsx` 1241 → 186 líneas.
  - `components/settings/AccountPanel.tsx`, `WorkspacePanel.tsx` (con MemberRow privado), `SupportPanel.tsx`, `settings-ui.tsx` (NavRow/SectionHeader/Card + helpers/tipos).
- `components/home/project-show-case.tsx` 1285 → ~430 líneas.
  - `show-case-utils.ts`, `CommunityTemplateUseModal.tsx` (+ ScopeToggle, ShareToCommunityModal), `MakePrivateModal.tsx`, `show-case-menus.tsx`.
  - Re-export de `ShareToCommunityModal` mantiene vivo el import desde `ShareProjectDropdown.tsx`.

### Landing
- `components/HomePage.tsx` 1938 → ~1530 líneas.
  - `components/home/TemplatePreviewImage.tsx`, `arrows.tsx`, `AttachMenu.tsx`, `useTypingPlaceholder.ts`, `home-utils.tsx`.

## Verificación

- `pnpm build` verde en backend (nest), client, landing (next) tras cada paso.
- Test de backend (`credit-window.spec.ts`) verde.
- Diffs revisados: las líneas añadidas en los archivos originales son solo imports; movimientos verbatim confirmados por spot-check contra git history.

## Commits

- `refactor(backend): split generation.service into tools, prompts, and util modules`
- `refactor(backend): extract admin-analytics pure helpers into admin-analytics.util`
- `refactor(client): split settings-view into panel components under components/settings`
- `refactor(landing): extract HomePage subcomponents and helpers into components/home`
- `refactor(client): split project-show-case into modals, menus, and utils modules`
