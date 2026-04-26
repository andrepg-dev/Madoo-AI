# 07 — Fix TopBar hydration mismatch

## Problem
Next.js logged a recoverable hydration error pointing at `components/shell/TopBar.tsx:79` ("Hydration failed because the server rendered HTML didn't match the client").

## Root cause
`AuthContext` initializes `hasToken` synchronously from `localStorage`:

```ts
const [hasToken, setHasToken] = useState(() =>
  typeof window === "undefined" ? false : Boolean(getToken()),
);
```

On the server `hasToken` is always `false` → `loading=false`, `user=null` → TopBar renders the **Sign in** button.
On the client's first render `hasToken` is `true` when a token exists → `loading=true` → TopBar renders **nothing** in the auth slot (or the avatar once `useMe` resolves).

The two trees disagreed on the auth slot, so React triggered a hydration mismatch.

## Fix
Gate the auth-dependent slot in `TopBar` behind a `mounted` flag so the SSR output and the first client paint always match (both render the empty slot), and the real auth UI only appears after mount.

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

{mounted && !user && !loading && (<button>Sign in</button>)}
{mounted && user && (<avatar dropdown />)}
```

This is a local fix — `AuthContext` itself is unchanged. Other consumers of `useAuth()` that have similar SSR/CSR divergence may need the same treatment if they appear in pages rendered on the server.

## Files changed
- `apps/frontend/components/shell/TopBar.tsx`
