async function execute({ tenantContext }) {
  await new Promise(r => setTimeout(r, 150));

  return [
    {
      id: 1,
      title: "Fix bug",
      issue_key: "PROJ-1",
      repo: "repo-1",
      author_email: "srikanth@company.com"
    },
    {
      id: 2,
      title: "Refactor code",
      issue_key: "PROJ-2",
      repo: "repo-3",
      author_email: "other@company.com"
    }
  ];
}

module.exports = { execute };
