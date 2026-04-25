# Madoo AI

Monorepo con Turborepo + pnpm workspaces.

## Estructura

```
.
├── apps/
│   ├── frontend/   # App de frontend
│   └── backend/    # App de backend
├── packages/       # Paquetes compartidos (vacío por ahora)
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
