async function execute({ tenantContext }) {
  await new Promise(r => setTimeout(r, 100));

  return [
    { key: "PROJ-1", status: "Open" },
    { key: "PROJ-2", status: "Done" }
  ];
}

module.exports = { execute };
