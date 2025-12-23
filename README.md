# Universal SQL Prototype (Cross-Connector Query Engine)

## Overview

This project is a **thin-slice prototype** of a Universal SQL query engine that enables querying across multiple SaaS data sources (e.g., GitHub, Jira) using a single SQL interface.

The goal of the prototype is **not** to build a full SQL engine, but to demonstrate:

- Clean separation of **control plane** and **data plane**
- How connectors can be onboarded easily
- Cross-source query execution and joins
- Policy enforcement (RLS / CLS)
- Rate limiting and isolation
- Extensibility toward a production-grade architecture

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
      ├── rate_limit/
      │    ├── tokenBucket.js
      │    └── rateLimiter.js
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
> In production, policies would be pushed down or enforced at plan time.

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

The gateway (`/v1/query`) is intentionally **thin**:
- Validates input
- Resolves tenant context
- Delegates to planner and executor
- Maps errors to HTTP responses

No connector, policy, or rate-limiting logic lives here.

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
2. Executes each connector independently
3. Applies **RLS and CLS**
4. Executes joins (if needed)
5. Applies projection
6. Returns final rows

All execution logic is centralized here.

---

### Rate Limiting

- Implemented using a **token bucket**
- Enforced **per connector**
- Time-based refill
- Visible failure (`429 RATE_LIMIT_EXHAUSTED`)

This models real SaaS connector constraints.

---

## Error Handling

| Scenario | Behavior |
|------|--------|
| Unsupported SQL | 400 with clear error |
| Rate limit exceeded | 429 with retry hint |
| Unauthorized access | Rows filtered via RLS |

Errors are explicit and user-visible.

---

## Design Trade-offs & Intentional Limitations

### Why only one JOIN?
Supporting multiple joins requires:
- Join graphs
- Join ordering
- Cost estimation

These are out of scope for a thin-slice prototype.  
The planner and executor are structured so this can be added later without redesign.

---

### Why in-memory joins?
The prototype uses an in-memory join to:
- Keep behavior deterministic
- Avoid external dependencies

In production, this would be replaced with:
- Embedded engines (DuckDB)
- Or distributed execution

---

### Why post-fetch policy enforcement?
For clarity and simplicity.

In production:
- RLS/CLS would be enforced earlier
- Or pushed down to the source where possible

---

## How This Evolves to Production

This prototype maps cleanly to a production system:

- Planner → Logical plan + optimizer
- Executor → Distributed execution engine
- Joiner → Embedded analytical engine
- Rate limiter → Per-tenant + per-user
- Policy store → External policy service
- Control plane → Admin-managed configuration

---

## Summary

This prototype demonstrates:

- Cross-source SQL execution
- Clean architectural separation
- Connector extensibility
- Policy enforcement
- Rate limiting
- Honest scope control

It intentionally prioritizes **clarity and correctness** over feature breadth.

---

## Running Locally

```bash
node src/data_plane/gateway/server.js
```

```bash
curl -X POST http://localhost:3000/v1/query   -H "Content-Type: application/json"   -d '{"sql":"SELECT * FROM github.pull_requests"}'
```

---

## Final Note

This repository is designed to be **readable** and **reviewable**.  
Every limitation is intentional, documented, and easy to evolve.
