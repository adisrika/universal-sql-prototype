function applyColumnMask(rows, policy, tableName) {
  const maskPolicy = policy?.column_mask?.[tableName];
  if (!maskPolicy) {
    return rows;
  }

  return rows.map(row => {
    const maskedRow = { ...row };

    for (const [column, rule] of Object.entries(maskPolicy)) {
      if (rule === "MASK" && maskedRow[column]) {
        maskedRow[column] = "****";
      }
    }

    return maskedRow;
  });
}

module.exports = { applyColumnMask };