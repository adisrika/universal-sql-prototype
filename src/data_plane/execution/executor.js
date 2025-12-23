const { checkRateLimit } = require("../rate_limit/rateLimiter");
const connectorRegistry = require("../../control_plane/connector_registry");
const { applyRLS } = require("../../control_plane/rls");
const { applyColumnMask } = require("../../control_plane/columnMask");
const policyStore = require("../../control_plane/policy_store");
const { innerJoin } = require("./joiner");
const { applyProjection } = require("./projector");
const { cache } = require("../cache/cache");


async function executePlan({ plan, tenantContext, max_staleness_ms }) {
  const results = {};
  const freshness = {};
  const cacheSource = {};

  for (const source of plan.sources) {
    const connector = connectorRegistry[source];
    if (!connector) {
      throw new Error(`Connector not registered: ${source}`);
    }

    // 1. Rate limiting (per connector)
    checkRateLimit(source);

    // 2. Cache lookup (freshness-aware)
    const cacheKey = `${tenantContext.tenantId}:${source}:${plan.ast?.toString?.() || ""}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && max_staleness_ms != null) {
      const ageMs = Date.now() - cachedEntry.fetchedAt;

      if (ageMs <= max_staleness_ms) {
        results[source] = cachedEntry.rows;
        freshness[source] = ageMs;
        cacheSource[source] = "cache";
        continue;
      }
    }

    // 3. Live fetch from connector
    const rawRows = await connector.execute({ tenantContext });

    // 4. Apply RLS
    const rlsRows = applyRLS(
      rawRows,
      policyStore,
      `${source}.${connector.tables[0]}`
    );

    // 5. Apply Column Masking
    const finalRows = applyColumnMask(
      rlsRows,
      policyStore,
      `${source}.${connector.tables[0]}`
    );

    // 6. Store in cache
    cache.set(cacheKey, {
      rows: finalRows,
      fetchedAt: Date.now()
    });

    results[source] = finalRows;
    freshness[source] = 0;
    cacheSource[source] = "live";
  }

  // 7. Join (if present)
  let outputRows;

  if (plan.join) {
    const { left, right } = plan.join;

    const joined = innerJoin(
      results[left.source],
      results[right.source],
      left.column,
      right.column
    );

    outputRows = applyProjection(joined, plan.projection);
  } else {
    // Single-source query
    const source = plan.sources[0];
    const rows = results[source] || [];

    outputRows = plan.projection
      ? applyProjection(rows, plan.projection)
      : rows;
  }

  // 8. Return unified response
  return {
    rows: outputRows,
    freshness_ms: Math.max(...Object.values(freshness)),
    cache_source: cacheSource
  };
}

module.exports = { executePlan };