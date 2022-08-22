// packages/transforms/src/unwind.js
import lodashGet from "//cdn.jsdelivr.net/gh/lodash/lodash@master/get.js";
import { setProp, unsetProp, flattenReducer } from "./utils.js";
function getUnwindablePaths(obj, currentPath) {
  return Object.keys(obj).reduce((unwindablePaths, key) => {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.prototype.toString.call(value.toJSON) !== "[object Function]" && Object.keys(value).length) {
      unwindablePaths = unwindablePaths.concat(
        getUnwindablePaths(value, newPath)
      );
    } else if (Array.isArray(value)) {
      unwindablePaths.push(newPath);
      unwindablePaths = unwindablePaths.concat(
        value.map((arrObj) => getUnwindablePaths(arrObj, newPath)).reduce(flattenReducer, []).filter((item, index, arr) => arr.indexOf(item) !== index)
      );
    }
    return unwindablePaths;
  }, []);
}
function unwind({ paths = void 0, blankOut = false } = {}) {
  function unwindReducer(rows, unwindPath) {
    return rows.flatMap((row) => {
      const unwindArray = lodashGet(row, unwindPath);
      if (!Array.isArray(unwindArray)) {
        return row;
      }
      if (!unwindArray.length) {
        return unsetProp(row, unwindPath);
      }
      const baseNewRow = blankOut ? {} : row;
      const [firstRow, ...restRows] = unwindArray;
      return [
        setProp(row, unwindPath, firstRow),
        ...restRows.map(
          (unwindRow) => setProp(baseNewRow, unwindPath, unwindRow)
        )
      ];
    });
  }
  paths = Array.isArray(paths) ? paths : paths ? [paths] : void 0;
  return (dataRow) => (paths || getUnwindablePaths(dataRow)).reduce(unwindReducer, [dataRow]);
}
export {
  unwind as default
};
