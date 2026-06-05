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
│   └── design-system/ # Design system (@madoo/design-system) + Storybook
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

### Design system (`@madoo/design-system`)

```bash
pnpm --filter @madoo/design-system dev         # Storybook en http://localhost:6006
pnpm --filter @madoo/design-system build       # Build estatico de Storybook
```

Mas detalles en [`packages/design-system/README.md`](./packages/design-system/README.md).
