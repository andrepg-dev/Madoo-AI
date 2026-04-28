# Madoo AI

Monorepo con Turborepo + pnpm workspaces.

## Estructura

```
.
├── apps/
│   ├── frontend/   # App de frontend (Next.js)
│   └── backend/    # App de backend
├── packages/
│   ├── shared/     # Tipos y utilidades compartidas
│   └── ui/         # Design system (@madoo/ui) + Storybook
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Comandos

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Ejecutar dev en todos los workspaces
pnpm build        # Build de todos los workspaces
pnpm lint         # Lint de todos los workspaces
```

### Design system (`@madoo/ui`)

```bash
pnpm --filter @madoo/ui dev         # Storybook en http://localhost:6006
pnpm --filter @madoo/ui build       # Build estatico de Storybook
```

Mas detalles en [`packages/ui/README.md`](./packages/ui/README.md).
