const { BadRequestError } = require("../expressError");

/* Helper for making selective update queries.
 * Creates the SET clause of an SQL UPDATE statement.
 *
 * param dataToUpdate = {Object} {field1: newVal, field2: newVal, ...}
 * param jsToSql {Object} maps js-style data fields to database column names,
 *   like { firstName: "first_name", age: "age" }
 *
 * Returns {Object} {sqlSetCols, dataToUpdate */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  /* Returns an array of object keys from
   * {firstName: 'Aliya', age: 32} => keys = ['firstname', 'age'] */
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  /* Maps variables to matching keys or creates new key
   * cols = ['"first_name"=$1', '"age"=$2']*/
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );
  /* { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] } */
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
