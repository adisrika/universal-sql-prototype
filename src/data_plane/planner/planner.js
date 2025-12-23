const { parseSQL } = require("./sqlParser");

const SUPPORTED_SOURCES = ["github", "jira"];

/**
 * Extract join information from AST.
 * Supports exactly ONE JOIN for the prototype.
 */
function extractJoin(ast) {
  if (!ast.from || ast.from.length === 1) {
    return null;
  }

  // Fail fast: multiple joins are out of scope for the prototype
  if (ast.from.length > 2) {
    throw new Error(
      "Multiple joins are not supported in this prototype"
    );
  }

  const leftTable = ast.from[0];
  const joinNode = ast.from[1];

  if (!joinNode.on) {
    throw new Error("JOIN without ON clause is not supported");
  }

  const on = joinNode.on;

  // Only support simple equality joins: a.col = b.col
  if (
    on.operator !== "=" ||
    !on.left ||
    !on.right
  ) {
    throw new Error(
      "Only equality joins are supported in this prototype"
    );
  }

  const leftSource =
    leftTable.db ||
    (leftTable.table && leftTable.table.split(".")[0]);

  const rightSource =
    joinNode.db ||
    (joinNode.table && joinNode.table.split(".")[0]);

  if (!leftSource || !rightSource) {
    throw new Error("Unable to resolve join sources");
  }

  return {
    left: {
      source: leftSource,
      column: on.left.column
    },
    right: {
      source: rightSource,
      column: on.right.column
    }
  };
}

function extractProjection(ast) {
  // SELECT *
  if (
    ast.columns.length === 1 &&
    ast.columns[0].expr &&
    (
      ast.columns[0].expr.type === "star" ||
      (
        ast.columns[0].expr.type === "column_ref" &&
        ast.columns[0].expr.column === "*"
      )
    )
  ) {
    return null;
  }

  const projection = [];

  for (const col of ast.columns) {
    const expr = col.expr;

    if (expr.type !== "column_ref") {
      throw new Error(
        "Only simple column projections are supported in this prototype"
      );
    }

    // Guard again just in case
    if (expr.column === "*") {
      return null;
    }

    projection.push({
      column: expr.column
    });
  }

  return projection;
}


/**
 * Main planner entry point.
 * Converts SQL into an execution plan.
 */
function planQuery(sql) {
  const ast = parseSQL(sql);

  if (!ast.from || ast.from.length === 0) {
    throw new Error("Invalid SQL: missing FROM clause");
  }

  const sources = new Set();

  // Collect sources from FROM + JOIN clauses
  for (const fromNode of ast.from) {
    let source;
    let table;

    if (fromNode.db) {
      // Parser provided db + table separately
      source = fromNode.db;
      table = fromNode.table;
    } else if (fromNode.table && fromNode.table.includes(".")) {
      // Fully qualified table name
      [source, table] = fromNode.table.split(".");
    } else {
      throw new Error(
        `Invalid table reference '${fromNode.table}'. Expected <source>.<table>`
      );
    }

    if (!SUPPORTED_SOURCES.includes(source)) {
      throw new Error(`Unsupported data source: ${source}`);
    }

    sources.add(source);
  }

  const join = extractJoin(ast);

  const projection = extractProjection(ast);

  return {
    sources: Array.from(sources),
    join,
    projection,
    ast
  };
}

module.exports = { planQuery };