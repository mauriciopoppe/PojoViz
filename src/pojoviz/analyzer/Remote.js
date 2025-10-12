import _ from "lodash";
import GenericAnalyzer from "./Inspector";

class Remote extends GenericAnalyzer {
  constructor(options) {
    super(options);
    this.remote = true;
  }

  /**
   * @override
   */
  inspectSelf() {}

  /**
   * @override
   */
  fetch() {
    const me = this;
    const pojoviz = window.pojoviz;
    console.log("fetching from remote", this);

    return pojoviz.remote.nodeGlobal(me.prepareConfig()).then(function (json) {
      me.json = json;
    });
  }

  prepareConfig() {
    const options = _.merge({}, this);
    options.analyzerConfig = options.analyzer;
    delete options.analyzer;
    delete options.remote;
    delete options.json;
    return options;
  }
}

export default Remote;

