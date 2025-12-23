const { checkRateLimit } = require("../rate_limit/rateLimiter");
const connectorRegistry = require("../../control_plane/connector_registry");
const { applyRLS } = require("../../control_plane/rls");
const { applyColumnMask } = require("../../control_plane/columnMask");
const policyStore = require("../../control_plane/policy_store");
const { innerJoin } = require("./joiner");

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

  if (plan.join) {
    const { left, right } = plan.join;

    const joined = innerJoin(
        results[left.source],
        results[right.source],
        left.column,
        right.column
    );

    return {
        joined
    };
  }

  return results;
}

module.exports = { executePlan };
