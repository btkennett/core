# @foundrynorth/core — Shared Platform Utilities

## Package Info
- **npm**: `@foundrynorth/core@1.0.0` (public)
- **Consumers**: fn-legacy, fn-flux, fn-worker
- **Module**: ESM (`"type": "module"`), Node >=18, ES2022 target

## Subpath Exports
Import from the specific module — never import from the package root in production code:

| Import Path | Purpose |
|-------------|---------|
| `@foundrynorth/core/resilience` | Circuit breakers, retry with exponential backoff |
| `@foundrynorth/core/observability` | Structured logging, metric helpers |
| `@foundrynorth/core/events` | Event typing and dispatch utilities |
| `@foundrynorth/core/env` | Environment variable validation |
| `@foundrynorth/core/types` | Shared TypeScript types |
| `@foundrynorth/core/text` | Text processing utilities |
| `@foundrynorth/core/cache` | Caching utilities |

## Commands
```bash
npm run build          # Compile TypeScript (tsc)
npm test               # Run tests (Vitest)
npm run test:watch     # Watch mode
npm version patch      # Bump version
npm publish            # Publish to npm (runs build via prepublishOnly)
```

## Publish Workflow
1. Make changes in `src/`
2. `npm run build` — verify clean compile
3. `npm test` — verify tests pass
4. `npm version patch` (or `minor`/`major`)
5. `npm publish`
6. Update consumers: `npm install @foundrynorth/core@latest` in fn-legacy, fn-flux, fn-worker
