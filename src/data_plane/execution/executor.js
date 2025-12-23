const connectorRegistry = require("../../control_plane/connector_registry");
const { applyRLS } = require("../../control_plane/rls");
const { applyColumnMask } = require("../../control_plane/columnMask");
const policyStore = require("../../control_plane/policy_store");

async function executePlan({ plan, tenantContext }) {
  const results = {};

  for (const source of plan.sources) {
    const connector = connectorRegistry[source];
    if (!connector) {
      throw new Error(`Connector not registered: ${source}`);
    }

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

  return results;
}

module.exports = { executePlan };
