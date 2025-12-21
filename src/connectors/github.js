async function fetchPullRequests() {
  await new Promise(r => setTimeout(r, 150));
  return [{ id: 1, title: "Fix bug", issue_key: "PROJ-1" }];
}

module.exports = { fetchPullRequests };

