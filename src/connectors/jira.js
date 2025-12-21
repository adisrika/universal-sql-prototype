async function fetchIssues() {
  await new Promise(r => setTimeout(r, 100));
  return [{ key: "PROJ-1", status: "Open" }];
}

module.exports = { fetchIssues };

