function applyRLS(rows, policy, tableName) {
  const tablePolicy = policy?.rls?.[tableName];
  if (!tablePolicy) {
    return rows;
  }

  return rows.filter(row => {
    return Object.entries(tablePolicy).every(([column, rule]) => {
      if (rule.in) {
        return rule.in.includes(row[column]);
      }
      return true;
    });
  });
}

module.exports = { applyRLS };

