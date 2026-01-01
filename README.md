# Universal SQL Prototype (Cross-Connector Query Engine)

- [System Architecture](docs/system-architecture.md)
- [Query Lifecycle](docs/query-lifecycle.md)
- [Performance & Scaling](docs/performance-and-scaling.md)
- [Six-Month Execution Plan](docs/six-month-execution-plan.md)

---

## Overview

This repository contains a **thin-slice prototype** of a *Universal SQL query engine* that enables querying across multiple SaaS data sources (e.g., GitHub, Jira) using a single SQL interface.

The goal of this project is **not** to build a full SQL engine. Instead, it demonstrates how a production-grade system can be structured to support:

- Strong separation of **control plane** and **data plane**
- Safe, governed cross-source queries
- Connector extensibility
- Entitlement enforcement (RLS / CLS)
- Rate limiting and isolation
- Freshness-aware caching
- Observability and load testing
- A clear path from prototype to production

> The design intentionally prioritizes the **control plane first**, ensuring governance, isolation, and predictability before execution.

---

## Supported Capabilities

### SQL Features (Prototype Scope)

| Feature | Supported |
|------|---------|
| `SELECT *` | ✅ |
| Column projection | ✅ |
| Table aliases | ✅ |
| Single-source queries | ✅ |
| Cross-source JOIN (1 join) | ✅ |
| Multiple JOINs | ❌ (explicitly rejected) |
| Aggregates (`COUNT`, `SUM`) | ❌ |
| Expressions / functions | ❌ |

> The prototype intentionally supports **exactly one JOIN** to demonstrate cross-source execution without introducing unnecessary complexity.

---

## Example Queries

### Single Source
```sql
SELECT id, title
FROM github.pull_requests
```

### Cross-Source Join
```sql
SELECT pr.id, pr.title, ji.key
FROM github.pull_requests pr
JOIN jira.issues ji
  ON pr.issue_key = ji.key
```

---

## Architecture Overview

The system is split into **Control Plane** and **Data Plane**, mirroring production-grade analytical systems.

```
src/
 ├── control_plane/
 │    ├── connector_registry.js
 │    ├── policy_store.js
 │    ├── rls.js
 │    ├── columnMask.js
 │    └── tenant_context.js
 │
 └── data_plane/
      ├── gateway/
      │    └── server.js
      ├── planner/
      │    ├── planner.js
      │    └── sqlParser.js
      ├── execution/
      │    ├── executor.js
      │    ├── joiner.js
      │    └── projector.js
      ├── cache/
      │    └── cache.js
      ├── rate_limit/
      │    ├── tokenBucket.js
      │    └── rateLimiter.js
      ├── observability/
      │    └── metrics.js
      └── connectors/
           ├── github/
           └── jira/
```

---

## Control Plane

### Connector Registry

Connectors are registered declaratively:

```js
{
  github: {
    rateLimitPerSecond: 2,
    execute: ...
  },
  jira: {
    rateLimitPerSecond: 2,
    execute: ...
  }
}
```

This enables:
- Easy onboarding of new connectors
- Per-connector configuration (rate limits, capabilities)
- No connector-specific logic in the gateway

---

### Policy Enforcement (Entitlements)

Policies are defined centrally and enforced uniformly.

- **Row-Level Security (RLS)**  
  Filters rows based on tenant/user context

- **Column-Level Security (CLS)**  
  Masks sensitive fields (e.g., email)

> Policies are enforced **after data fetch** in the prototype for clarity.  
> In production, policies would be compiled and enforced earlier during planning or pushed down where possible.

---

### Tenant Context

Each request resolves a tenant and user context:

```json
{
  "tenantId": "tenant-1",
  "userId": "srikanth",
  "roles": ["engineer"]
}
```

This context drives:
- Entitlements
- Policy evaluation
- Rate limiting (future extension)

---

## Data Plane

### Gateway

The query gateway (`/v1/query`) is intentionally **thin**:
- Validates input
- Resolves tenant context
- Delegates to planner and executor
- Maps errors to HTTP responses

No connector, policy, cache, or rate-limiting logic lives here.

---

### Planner

The planner:
- Parses SQL using a real SQL parser
- Extracts:
  - Sources (`github`, `jira`)
  - Join information (if present)
  - Projection (SELECT list)
- Explicitly rejects unsupported queries (e.g., multiple joins)

Planner output is a **logical execution plan**, not a physical one.

---

### Executor

The executor:
1. Enforces **rate limits per connector**
2. Applies **freshness-aware caching**
3. Executes each connector independently
4. Applies **RLS and CLS**
5. Executes joins (if needed)
6. Applies projection
7. Returns final rows with metadata

All execution logic is centralized here.

---

### Rate Limiting

- Implemented using a **token bucket**
- Enforced **per connector**
- Time-based refill
- Visible failure (`429 RATE_LIMIT_EXHAUSTED`)

---

### Freshness & Caching

The data plane implements a bounded **LRU cache** for query results.

- Cache eviction is handled via LRU + TTL
- Query-time freshness is controlled using `max_staleness_ms`
- Cached results are reused only if they satisfy the requested staleness bound

---

## Observability

- Request-level tracing with `trace_id`
- Prometheus metrics exposed via `/metrics`
- Connector latency and throughput tracked

---

## Load Testing

- k6-based load test
- Sustained concurrent load
- Rate limiting enforced correctly
- No crashes under stress

---

## Deployment Modes

- **Tier 1**: Shared runtime, logical isolation via tenant context
- **Tier 2**: Shared cluster, isolated namespaces per tenant
- **Tier 3**: Fully dedicated control and data plane per tenant

---

## Design Trade-offs

- Single JOIN only (explicit scope control)
- In-memory joins for determinism
- Post-fetch policy enforcement for clarity

---

## How This Evolves to Production

The prototype maps cleanly to a production system:
- Planner → optimizer
- Executor → distributed execution
- Control plane → admin-managed services

---

## Running Locally

```bash
node src/data_plane/gateway/server.js
```

---

## Further Reading

- [System Architecture](docs/system-architecture.md)
- [Query Lifecycle](docs/query-lifecycle.md)
- [Performance & Scaling](docs/performance-and-scaling.md)
- [Six-Month Execution Plan](docs/six-month-execution-plan.md)
