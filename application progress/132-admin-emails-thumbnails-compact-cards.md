# 132 — Admin: compact cards + email thumbnails + rendered-image preview

Date: 2026-07-01

## Changes (frontend only, `apps/admin`)
- **Compact cards**: shrank metric/insight/KPI card typography and padding
  (dashboard `globals.css`: value 30px→21px, smaller labels/hints, lower
  min-heights; retention `Kpi` value text-3xl→text-xl, cohort text-2xl→text-xl).
- **Email list thumbnails**: each row in `/emails` now shows the rendered email
  preview image (`EmailVariant.previewUrl`, populated for all variants) as a
  small thumbnail beside the title (`.email-cell` / `.email-thumb`).
- **Detail render = rendered image**: `components/email-render.tsx` now shows the
  `previewUrl` image by default (the actual rendered email) with an Image/HTML
  toggle; the sandboxed `<iframe srcDoc>` stays as the HTML view / fallback when
  no preview image exists. Fixes "I can't see the email preview".

All previewUrl images are S3 URLs (loaded via plain `<img>`, no next/image
domain config needed). No backend/shared change; deploys via Vercel from `main`.
