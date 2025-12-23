function resolveTenantContext(req) {
  return {
    tenantId: req.headers["x-tenant-id"] || "tenant-1",
    userId: "srikanth",
    roles: ["engineer"]
  };
}

module.exports = { resolveTenantContext };