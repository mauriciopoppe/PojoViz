import GenericAnalyzer from './Inspector';
import utils from '../util/';

const toInspect = [
  Object, Function,
  Array, Date, Boolean, Number, Math, String, RegExp, JSON,
  Error
];

class BuiltIn extends GenericAnalyzer {
  constructor(options) {
    super(options);
  }

  /**
   * @override
   */
  inspectSelf() {
    this.debug && console.log('inspecting builtIn objects');
    this.analyzer.add(this.getItems());
  }

  /**
   * @override
   * @returns {Array}
   */
  getItems() {
    return toInspect;
  }

  showSearch(nodeName, nodeProperty) {
    const url = 'https://developer.mozilla.org/en-US/search?' +
      utils.toQueryString({
        q: encodeURIComponent(nodeName + ' ' + nodeProperty)
      });
    window.open(url);
  }
}

export default BuiltIn;