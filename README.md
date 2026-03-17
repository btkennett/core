# @foundrynorth/core

Shared resilience, observability, event, environment, type, text, and cache utilities for Foundry North platforms.

## Install

```bash
npm install @foundrynorth/core
```

## Subpath Exports

This package uses subpath exports — import from the specific module you need:

```typescript
import { withRetry, circuitBreaker } from "@foundrynorth/core/resilience";
import { createLogger } from "@foundrynorth/core/observability";
import { signHmac, verifyHmac } from "@foundrynorth/core/events";
import { requireEnv, optionalEnv } from "@foundrynorth/core/env";
import { slugify, truncate } from "@foundrynorth/core/text";
import { createCache } from "@foundrynorth/core/cache";
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

## Consumers

- **fn-legacy** (Compass)
- **fn-flux** (Compass Ops)
- **fn-worker** (BullMQ processor)

## Development

```bash
npm run build    # Compile TypeScript
npm version patch  # Bump version
npm publish      # Publish to npm
```

After publishing, update consumers: `npm install @foundrynorth/core@latest`

## Full Documentation

See [fn-docs: Shared Packages](https://fn-docs.vercel.app/docs/compass-v2/shared-packages) for detailed API reference and publish workflow.
