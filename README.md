# Solar Intelligence Platform

Web-first monorepo for the Solar Intelligence Platform.

## Monorepo Structure

```text
apps/
  web/        # Next.js web app
  api/        # NestJS backend API
  engine/     # FastAPI calculation engine
packages/
  types/      # Shared TypeScript types
  config/     # Shared configuration
```

## Workspace Commands

From repository root:

```bash
npm install
npm run engine:setup
```

Run all services:

```bash
npm run dev
```

Run with Docker Compose:

```bash
docker compose up --build
```

Run specific services:

```bash
npm run dev:web
npm run dev:api
npm run dev:engine
```

Quality/build:

```bash
npm run lint
npm run build
```

## Current Status

- Phase 0 documentation freeze: completed
- Phase 1.1 scaffold: completed
- Phase 1.2 runtimes initialized: completed
- Phase 1.3 root workspace scripts: completed
- Phase 1.4 minimal Docker runtime setup: completed
- Phase 1.5 API auth scaffold (register/login/me): completed
- Phase 1.6 API config scaffold (`env`, `app`, `database`): completed
- Phase 1.7 web design-system baseline (`shadcn/ui`, tokens, shell): completed
- Business logic: not started
