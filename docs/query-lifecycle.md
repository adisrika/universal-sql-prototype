# Query Lifecycle: End-to-End Flow

See [Performance & Scaling](performance-and-scaling.md) for latency, scaling, and cost controls.

## Purpose

This section describes the **end-to-end lifecycle of a user SQL query** in the Universal SQL platform — from request entry to result delivery.

The lifecycle highlights the **control-plane–first execution model**, where governance and planning occur before any data access.

---

## High-Level Query Flow

1. User submits a SQL query
2. Gateway authenticates and resolves tenant context
3. Control plane validates, governs, and plans the query
4. Data plane executes the approved plan
5. Results and metadata are returned to the user
6. Audit and observability signals are emitted

---

## Step-by-Step Query Lifecycle

### Step 1: Query Submission

An end user submits a SQL query via:
- REST API
- SQL Console
- Application integration

The request includes:
- SQL string
- User identity (OIDC token)
- Optional query hints (e.g., max staleness, timeout)

---

### Step 2: Gateway Authentication & Tenant Resolution

The **Gateway**:
- Authenticates the user
- Extracts tenant identity from token / headers
- Routes the request to the **Query Gateway**

At this point:
- The tenant context is fully resolved
- No data access has occurred

---

### Step 3: Control Plane Metadata Resolution

The Query Gateway fetches control-plane metadata:
- Tenant configuration (isolation mode, limits)
- Connector availability and capabilities
- Schema definitions
- Applicable RLS / CLS policies
- Rate-limit budgets

If any required metadata is missing or invalid, the query is rejected early.

---

### Step 4: SQL Parsing & Logical Planning

The **Planner**:
- Parses the SQL into an AST
- Resolves tables and columns using the Schema Catalog
- Builds a logical query plan

At this stage:
- The plan is backend-agnostic
- No execution decisions are made yet

---

### Step 5: Policy Compilation (RLS / CLS)

The **Policy Service**:
- Compiles Row-Level Security predicates
- Applies Column-Level masking rules
- Injects policy constraints into the logical plan

This ensures:
- Least-privilege access
- Enforcement of source and tenant policies

---

### Step 6: Optimization & Physical Planning

The Planner:
- Pushes down filters and projections
- Selects join strategies (federated vs materialized)
- Considers freshness and rate-limit hints

The output is a **physical execution plan** that is safe to execute.

---

### Step 7: Rate-Limit Admission Control

The **Rate Limit Service** evaluates:
- Available token budgets
- Connector concurrency limits
- Per-user fairness constraints

Possible outcomes:
- Proceed synchronously
- Throttle with retry guidance
- Reroute to async execution (optional)

---

### Step 8: Data Plane Execution

The **Executor**:
- Executes the physical plan
- Invokes connector workers
- Applies joins, projections, and filters
- Uses cache when allowed by freshness constraints

The data plane strictly follows the approved plan and budgets.

---

### Step 9: Result Assembly & Response

The Query Gateway:
- Collects result rows
- Attaches metadata:
  - freshness_ms
  - rate_limit_status
  - trace_id
- Streams or returns the response to the user

---

### Step 10: Audit & Observability

Throughout the lifecycle:
- Audit logs record cross-system access
- Metrics capture latency and errors
- Traces record connector and execution timing

These signals support:
- Compliance
- Debugging
- Capacity planning

---

## Error Handling Model

Errors are surfaced with:
- Stable error codes
- Human-readable messages
- Actionable guidance

Examples:
- `ENTITLEMENT_DENIED`
- `RATE_LIMIT_EXHAUSTED`
- `STALE_DATA`
- `SOURCE_TIMEOUT`

---

## Key Design Properties

- Control plane decisions precede execution
- Data plane is policy-agnostic
- Queries fail fast when governance rules are violated
- All executions are auditable

---

## Why This Lifecycle Matters

This lifecycle ensures:
- Strong security and least privilege
- Predictable performance under load
- Clear separation of responsibilities
- Support for multi-tenant and single-tenant deployments

---

## Next Section

The next section discusses **performance, scalability, and operational considerations**, including autoscaling, backpressure, and cost controls.
