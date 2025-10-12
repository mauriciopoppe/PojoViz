import _ from "lodash";
import builtInObjects from "./builtInObjects";
import notableLibraries from "./notableLibraries";
import myLibraries from "./myLibraries";
import hugeLibraries from "./hugeLibraries";

const proto = {
  find: function (entry) {
    function predicate(v) {
      return v.entryPoint === entry;
    }
    let result;
    _.forOwn(this, function (schema) {
      result = result || _.find(schema, predicate);
    });
    return result;
  },
};

const schemas = Object.create(proto);

Object.assign(schemas, {
  builtInObjects,
  notableLibraries,
  myLibraries,
  hugeLibraries,
});

export { builtInObjects, notableLibraries, myLibraries, hugeLibraries };
export default schemas;

