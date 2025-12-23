const { parseSQL } = require("./sqlParser");

function planQuery(sql) {
  const ast = parseSQL(sql);
  return {
    sources: ["github", "jira"],
    astType: ast.type
  };
}

module.exports = { planQuery };

