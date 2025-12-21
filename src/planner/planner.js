const { parseSQL } = require("./sqlParser");

function planQuery(sql) {
  const ast = parseSQL(sql);
  return {
    sources: ["github", "jira"],
    ast
  };
}

module.exports = { planQuery };

