import _ from "lodash";

const changeFakePropertyName = {
  "[[Prototype]]": "__proto__",
};

const utils = {
  translate: function (x, y) {
    return "translate(" + (x || 0) + ", " + (y || 0) + ")";
  },
  scale: function (s) {
    return "scale(" + (s || 1) + ")";
  },
  transform: function (obj) {
    const t = [];
    _.forOwn(obj, function (v, k) {
      t.push(utils[k].apply(utils, v));
    });
    return t.join(" ");
  },
  prefixer: function () {
    const args = [].slice.call(arguments);
    args.unshift("pv");
    return args.join("-");
  },
  transformProperty: function (v) {
    if (changeFakePropertyName.hasOwnProperty(v)) {
      return changeFakePropertyName[v];
    }
    return v;
  },
  escapeCls: function (v) {
    return v.replace(/\$/g, "_");
  },
};

export default utils;

