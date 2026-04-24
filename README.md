# @foundrynorth/core

Shared resilience, observability, event, environment, type, text, cache, time, and DataForSEO utilities for Foundry North platforms.

## Install

```bash
npm install @foundrynorth/core
```

## Subpath Exports

This package uses subpath exports. Import from the specific module you need instead of the package root:

```typescript
import { withRetry, circuitBreaker } from "@foundrynorth/core/resilience";
import { createLogger } from "@foundrynorth/core/observability";
import { signHmac, verifyHmac } from "@foundrynorth/core/events";
import { requireEnv, optionalEnv } from "@foundrynorth/core/env";
import { slugify, truncate } from "@foundrynorth/core/text";
import { createMemoryCache } from "@foundrynorth/core/cache";
import { businessDaysExact } from "@foundrynorth/core/time";
import { resolveDataForSeoLocationHint } from "@foundrynorth/core/dataforseo";
```

| Export | Purpose |
|--------|---------|
| `@foundrynorth/core/resilience` | Retry with backoff, circuit breaker, timeout wrapper |
| `@foundrynorth/core/observability` | Structured logging, metric helpers |
| `@foundrynorth/core/events` | HMAC signing/verification for cross-app events |
| `@foundrynorth/core/env` | Type-safe environment variable access |
| `@foundrynorth/core/types` | Shared TypeScript types |
| `@foundrynorth/core/text` | Text manipulation utilities |
| `@foundrynorth/core/cache` | Caching utilities |
| `@foundrynorth/core/time` | Shared time helpers |
| `@foundrynorth/core/dataforseo` | DataForSEO location helpers and datasets |

## Consumers

- **fn-legacy** (Compass)
- **fn-flux** (Compass Ops)
- **fn-forge** (Compass Creative)
- **fn-v2** (Trigger runtime)
- Historical fn-worker usage is deprecated

## Development

```bash
nvm use
npm ci
npm run build
npm test
```

The repo includes:

- `.nvmrc` pinned to the contributor Node version used in CI
- `.devcontainer/devcontainer.json` for a no-services VS Code/Codespaces setup

The package still targets `Node >=18` for consumers; the pinned Node version is only for consistent local development and release verification.

## Contributor Notes

Use `src/` as the source of truth and treat `dist/` as generated output from `npm run build`.

Before opening a PR or cutting a release, run:

```bash
npm run release:check
```

That command performs the same high-signal checks used for publishing:

- TypeScript build
- Vitest suite
- `npm pack --dry-run` to confirm the package can be packed cleanly

CI runs the same command on pushes and pull requests.

## Release

1. Make and review the source changes in `src/` and docs as needed.
2. Run `npm run release:check`.
3. Bump the version with `npm version patch`, `npm version minor`, or `npm version major`.
4. Publish with `npm publish`.
5. Update consumers: `npm install @foundrynorth/core@latest`

## Full Documentation

See:

- [fn-docs: Shared Packages](https://fn-docs.vercel.app/docs/compass-v2/shared-packages)
- [fn-docs: Shared Package Workflow](https://fn-docs.vercel.app/docs/getting-started/shared-package-workflow)
