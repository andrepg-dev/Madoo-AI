# Madoo AI — Progress Log 02

**Date:** 2026-04-25
**Scope:** Frontend integration of the backend auth/prompt API. Replaced the hand-rolled `fetch` helper with an axios wrapper, introduced TanStack Query, and moved all server operations into a dedicated `actions/` directory.

---

## 1. Goals

- Wire the existing NestJS backend (Google login + pending prompts) into the Next.js frontend.
- Keep the in-page Google popup login (GIS, no redirect).
- Standardize all data access through:
  - a single axios-based fetch wrapper (`lib/fetch.ts`)
  - typed TanStack Query hooks living under `actions/`
- Make future CRUD work a one-file-per-resource exercise inside `actions/`.

## 2. Dependencies

Added to `apps/frontend/package.json`:

- `axios` ^1.7.9
- `@tanstack/react-query` ^5.62.7

Installed via `pnpm install` at the workspace root.

## 3. New Files

### `lib/fetch.ts` — axios wrapper
- `http`: `axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } })`.
- Request interceptor injects `Authorization: Bearer <token>` from `getToken()`.
- Response interceptor:
  - Normalizes errors into `ApiError(status, message)`.
  - Joins NestJS class-validator array messages into a single string.
  - On `401`, calls `clearToken()` so stale sessions self-evict.
- `fetcher` helper exposes typed `get`/`post`/`put`/`patch`/`delete` returning unwrapped `data`.

### `lib/storage.ts` — localStorage helpers
- Extracted from the old `lib/api.ts`.
- Exports: `getToken`, `setToken`, `clearToken`, `savePendingPrompt`, `readPendingPrompt`, `clearPendingPrompt`, `StoredPrompt`.
- Keys unchanged: `madoo.auth.token`, `madoo.pendingPrompt`.

### `actions/auth.ts`
- Types: `AuthUser`, `GoogleLoginInput`, `GoogleLoginResponse`.
- `authKeys` — `['auth']` / `['auth','me']` query keys.
- `authApi.loginWithGoogle()` and `authApi.me()` — pure fetcher calls (usable outside React).
- Hooks:
  - `useGoogleLogin()` — `useMutation` for `POST /auth/google`.
  - `useMe(options?)` — `useQuery` for `GET /auth/me`, gated by presence of token, `retry: false`, 5-min `staleTime`.

### `actions/prompts.ts`
- Type: `PendingPrompt`, `CreatePendingPromptInput`.
- `promptKeys` — `['prompts']` / `['prompts','pending']`.
- `promptsApi.{listPending, createPending, consumePending}` — bound to `/prompts/pending` routes.
- Hooks:
  - `usePendingPrompts()` — list query.
  - `useCreatePendingPrompt()` — mutation, invalidates `pending` list on success.
  - `useConsumePendingPrompt()` — mutation, invalidates `pending` list on success.

### `components/providers/QueryProvider.tsx`
- Client component that creates a `QueryClient` once with `useState` (per-render safety) and renders `QueryClientProvider`.
- Defaults: `refetchOnWindowFocus: false`, `retry: 1`, `staleTime: 30s`.

## 4. Modified Files

### `app/layout.tsx`
- Wraps the tree in `<QueryProvider>` outside `<AuthProvider>` so auth hooks can use the query client.

### `lib/api.ts` — now a compatibility shim
- Re-exports the storage helpers from `lib/storage.ts`, `ApiError` from `lib/fetch.ts`, and `AuthUser` / `GoogleLoginResponse` types from `actions/auth.ts`.
- The old `request<T>()` and `api.{loginWithGoogle, me}` callers are gone — anything that needs to hit the API now imports from `@/actions/*`.
- Kept the file as a shim so existing imports in `HomeScreen` (`readPendingPrompt`, `clearPendingPrompt`, `savePendingPrompt`) keep working without churn.

### `components/auth/AuthContext.tsx`
- Replaced manual `useEffect(api.me)` hydration with `useMe({ enabled: hasToken })`.
- `finishLogin(token, user)` now seeds the cache via `qc.setQueryData(authKeys.me(), user)` instead of writing to local state.
- `logout()` calls `clearToken()` and then `qc.removeQueries(...) + qc.clear()` so all server state evicts in one shot.
- `loading` is derived from `hasToken && meQuery.isLoading`; `user` is `meQuery.data ?? null`.

### `components/auth/LoginModal.tsx`
- Switched the `await api.loginWithGoogle(...)` call to `googleLogin.mutateAsync(...)` from `useGoogleLogin()`.
- `submitting` is now `googleLogin.isPending` — no separate state.
- Imports moved from `@/lib/api` to `@/lib/storage` + `@/actions/auth`.

## 5. Verification

- `pnpm --filter @madoo/frontend exec tsc --noEmit` → ✅ no output (clean).
- `pnpm --filter @madoo/frontend build` → ✅ all 8 routes generated, no type errors.
  - `/` first-load JS: 145 kB (includes the new TanStack runtime).

## 6. Conventions Established

- **All server operations live in `apps/frontend/actions/<resource>.ts`.** One file per resource. Every file exports:
  1. Types for inputs and responses.
  2. A `<resource>Keys` object for query keys.
  3. A `<resource>Api` object of pure async functions calling `fetcher.*`.
  4. The TanStack hooks (`use<Verb><Resource>`) consumers should import.
- **Pure API callers** (`authApi`, `promptsApi`) exist alongside hooks so non-React code paths (e.g. server components, scripts) can reuse them.
- **The `fetcher` from `lib/fetch.ts` is the only allowed transport** — components should never call `fetch` or `axios` directly.
- **Tokens are read inside the axios request interceptor**; no manual header passing in actions.

## 7. What's Next

- Add a `TopBar` user menu (avatar + logout) using the existing `useAuth()` + `logout()` plumbing.
- Move the `HomeScreen` "save pending prompt" logic to use `useCreatePendingPrompt` once the user is authenticated, so we can drop the localStorage round-trip on the post-login resume flow.
- Add an `actions/campaigns.ts` (and corresponding backend module) for the Campaigns screen — first real CRUD using the new conventions.
- React Query devtools in dev mode (optional, behind `process.env.NODE_ENV === 'development'`).

## 8. File Index (new/changed in this pass)

```
apps/frontend/package.json                                    (deps)
apps/frontend/app/layout.tsx                                  (QueryProvider wrap)
apps/frontend/lib/api.ts                                      (now a shim)
apps/frontend/lib/fetch.ts                                    NEW
apps/frontend/lib/storage.ts                                  NEW
apps/frontend/actions/auth.ts                                 NEW
apps/frontend/actions/prompts.ts                              NEW
apps/frontend/components/providers/QueryProvider.tsx          NEW
apps/frontend/components/auth/AuthContext.tsx                 (TanStack-backed)
apps/frontend/components/auth/LoginModal.tsx                  (mutation-backed)
```
