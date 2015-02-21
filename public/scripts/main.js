/**
 * Created by mauricio on 2/20/15.
 */
// support onpushstate
(function (history) {
  var pushState = history.pushState;
  history.pushState = function(state) {
    if (typeof history.onpushstate === "function") {
      history.onpushstate({state: state});
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

window.$$ = function (selector) {
  return document.querySelector(selector);
};