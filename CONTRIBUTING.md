# Contributing to the Solar Intelligence Platform

Thank you for your interest in contributing! This document explains how to set
up a local environment, the conventions we follow, and what to expect from the
pull-request process.

By participating you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Table of Contents

- [Ways to contribute](#ways-to-contribute)
- [Project layout](#project-layout)
- [Local development setup](#local-development-setup)
- [Branching strategy](#branching-strategy)
- [Commit conventions](#commit-conventions)
- [Code style](#code-style)
- [Testing requirements](#testing-requirements)
- [Pull request process](#pull-request-process)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Security issues](#security-issues)

---

## Ways to contribute

- Reporting bugs and reproducible issues
- Proposing new features or improvements
- Improving documentation, examples, or diagrams
- Submitting fixes and enhancements via pull requests
- Reviewing open pull requests

## Project layout

```text
apps/
  web/        # Next.js 16 (App Router) + React 19 + Tailwind
  api/        # NestJS 11 + Prisma 7 + PostgreSQL
  engine/     # FastAPI deterministic calculation engine (Python 3.12)
packages/
  types/      # Shared TypeScript types
  config/     # Shared configuration
docs/         # Architecture, development, and deployment guides
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for an end-to-end overview.

## Local development setup

### Prerequisites

| Tool        | Version             | Notes                                  |
| ----------- | ------------------- | -------------------------------------- |
| Node.js     | `22.x` (LTS)        | Pinned via `.nvmrc`                    |
| npm         | `>= 10`             | Comes with Node 22                     |
| Python      | `3.12+`             | For the FastAPI engine                 |
| Docker      | `>= 24`             | For PostgreSQL, Redis, and the stack   |
| PostgreSQL  | `16+` (via Docker)  | Or use the bundled `docker-compose.yml`|

### One-time setup

```bash
git clone https://github.com/<your-org>/solar-intelligence-platform.git
cd solar-intelligence-platform
nvm use            # picks up Node version from .nvmrc
cp .env.example .env
npm install
npm run engine:setup
```

### Run everything

```bash
docker compose up -d postgres redis   # boot data services
npm run dev                            # web + api + engine concurrently
```

Or run services individually:

```bash
npm run dev:web      # Next.js on http://localhost:3001
npm run dev:api      # NestJS on http://localhost:3000
npm run dev:engine   # FastAPI on http://localhost:8000
```

See [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for Prisma, seeding, and
debugging workflows.

## Branching strategy

We use a trunk-based workflow:

- `main` is always releasable.
- Create short-lived branches from `main` named with one of these prefixes:
  - `feat/<scope>-<short-description>` – new functionality
  - `fix/<scope>-<short-description>` – bug fixes
  - `chore/<scope>-<short-description>` – tooling/build/docs/refactor
  - `docs/<short-description>` – documentation-only changes
- Rebase onto `main` before opening a PR to keep history linear.
- Squash-merge unless multiple meaningful commits clearly tell the story.

## Commit conventions

We follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).
This keeps the changelog automatable and history readable.

```text
<type>(<optional-scope>): <short summary>

<optional body>

<optional footer(s)>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`,
`ci`, `perf`, `style`, `revert`.

Examples:

```text
feat(api): add forecast endpoint guarded by JWT
fix(web): handle missing tariff in dashboard card
docs: clarify provider fallback chain in ARCHITECTURE
```

Breaking changes get a `!` after the type/scope or a `BREAKING CHANGE:` footer.

A `commit-msg` git hook enforces this format locally once you run
`npx husky init` (see [Code style](#code-style)).

## Code style

- **Language conventions** – TypeScript everywhere except the Python engine.
- **Formatting** – Prettier (`.prettierrc`). Run `npx prettier --write .`
  before committing if you don't have an editor-on-save integration.
- **Linting** – ESLint for both apps (`npm run lint`). Treat all warnings as
  signal; fix or explain them in the PR.
- **TypeScript** – `tsc --noEmit` must pass in `apps/api` and `apps/web`.
- **Python** – PEP 8 conventions. Keep deterministic engine code pure and
  fully testable.
- **Imports** – Prefer named exports; never rely on default exports for
  domain modules.
- **Public API contracts** – Any change that crosses the
  web ↔ api ↔ engine boundary must update the relevant doc in `docs/` and
  the shared types in `packages/types/`.

Enable git hooks locally (one time):

```bash
npx husky init
```

This wires up:

- `pre-commit` → `lint-staged` (Prettier on staged files)
- `commit-msg` → `commitlint` against Conventional Commits

## Testing requirements

Pull requests must keep the existing checks green:

```bash
npm run lint                                                  # web + api ESLint/TSC
npm run build                                                 # ensure both apps compile
python -m py_compile apps/engine/src/main.py                  # engine compiles
python apps/engine/tests/run_golden.py                        # deterministic engine golden tests
python apps/api/tests/run_engine_contract_smoke.py            # engine ↔ api contract
python apps/api/tests/run_dashboard_contract_smoke.py         # dashboard contract
python apps/api/tests/run_dashboard_snapshot.py               # dashboard snapshot
```

When you add behavior:

- Add a unit/contract test under the appropriate `tests/` folder.
- Update or add a golden fixture under `apps/engine/tests/fixtures` for any
  deterministic calculation change.
- Document the contract change in the relevant `docs/*.md`.

## Pull request process

1. Open an issue first for non-trivial changes (anything > 200 LOC or that
   crosses service boundaries).
2. Fork or branch, implement, and rebase onto `main`.
3. Fill in the PR template — especially the **Type of change**,
   **How was this tested**, and **Checklist** sections.
4. Ensure CI is green. PRs with red required checks will not be reviewed.
5. Request a review from a code owner (see [`.github/CODEOWNERS`](./.github/CODEOWNERS)).
6. Address review comments; force-push allowed on your branch.
7. A maintainer will squash-merge once approved.

## Reporting bugs and requesting features

Use the structured GitHub issue forms:

- [Bug report](./.github/ISSUE_TEMPLATE/bug_report.yml)
- [Feature request](./.github/ISSUE_TEMPLATE/feature_request.yml)

For general questions, open a GitHub Discussion rather than an issue.

## Security issues

**Do not open public issues for security vulnerabilities.** Follow the
disclosure process in [`SECURITY.md`](./SECURITY.md).
