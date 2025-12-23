const { checkRateLimit } = require("../rate_limit/rateLimiter");
const connectorRegistry = require("../../control_plane/connector_registry");
const { applyRLS } = require("../../control_plane/rls");
const { applyColumnMask } = require("../../control_plane/columnMask");
const policyStore = require("../../control_plane/policy_store");
const { innerJoin } = require("./joiner");
const { applyProjection } = require("./projector");

async function executePlan({ plan, tenantContext }) {
  const results = {};

  for (const source of plan.sources) {
    const connector = connectorRegistry[source];
    if (!connector) {
      throw new Error(`Connector not registered: ${source}`);
    }

    checkRateLimit(source);

    const rawRows = await connector.execute({ tenantContext });

    const rlsRows = applyRLS(
      rawRows,
      policyStore,
      `${source}.${connector.tables[0]}`
    );

    const finalRows = applyColumnMask(
      rlsRows,
      policyStore,
      `${source}.${connector.tables[0]}`
    );

    results[source] = finalRows;
  }

  // Apply join if present
    if (plan.join) {
    const { left, right } = plan.join;

    const joined = innerJoin(
        results[left.source],
        results[right.source],
        left.column,
        right.column
    );

    return {
        rows: applyProjection(joined, plan.projection)
    };
    }

    // Single-source query
    const source = plan.sources[0];
    const rows = results[source] || [];

    return {
        rows: plan.projection
            ? applyProjection(rows, plan.projection)
            : rows
    };

}

module.exports = { executePlan };
