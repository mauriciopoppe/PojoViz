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


(function () {
  var $$ = function (selector) {
    return document.querySelector(selector);
  };
  var pages = $$('core-animated-pages');
  var scaffold = $$('core-scaffold');
  var knownConfigurationPopup = $$('#knownConfigurationPopup');

  function runLibrary(entry) {
    // global name, data properties
    var schema = pojoviz.schemas.find(entry);
    pojoviz
      .run(schema)
      .then(function() {
        pojoviz.draw.render();
      })
      .fail(function (e) {
        pojoviz.utils.notification(e);
        throw e;
      })
      .done();
    // pojoviz.render();
    pages.selected = 'app';
    scaffold.closeDrawer();
  }

  /**
   * Pushes a new token to the history stack
   * @param {string} hash
   */
  function changeHistory(hash) {
    window.history.pushState(
      {command: hash},
      hash,
      '#' + hash
    );
  }

  window.onpopstate = history.onpushstate = function(e) {
    var command = e.state.command;
    if (~command.indexOf('render/')) {
      runLibrary(command.split('/')[1]);
      return;
    }
    pages.selected = command;
  };

  window.pushState = function (hash) {
    // if the hash doesn't start with render/
    if (hash.indexOf('render/') === -1) {
      // default to readme
      hash = 'readme';
    }
    changeHistory(hash);
  };

  // settings + readme on click event
  [].slice.call(scaffold
    .querySelectorAll('core-scaffold .toolbar-page'))
    .forEach(function (v) {
      v.addEventListener('click', function (event) {
        changeHistory(event.target.dataset.command);
      });
    });

  // listen for the event notification to update the status
  // of the toast (polymer's notification)
  var toast = document.getElementById('toast');
  document
    .addEventListener('pojoviz-notification', function (e) {
      toast.text = e.detail;
      toast.show();
    });

  window.addEventListener('polymer-ready', function () {
    // query params
    var params = {};
    location.search.substring(1).split('&')
      .forEach(function (v) {
        var sp = v.split('=');
        params[sp[0]] = sp[1];
      });
    // hide some elements
    if (params.toolbar === 'false') {
      document.documentElement.className += ' notoolbar';
    }

    // fired from elements/libraryMenu.html
    document
      .addEventListener('library-select', function (e) {
        changeHistory(e.detail);
      });

    // runtime configuration popup
    document
      .querySelector('#runtime-configuration')
      .addEventListener('click', function () {
        var hash = location.hash.substr(1);
        var schema = pojoviz.schemas.find(hash.split('/')[1]);
        if (schema) {
          var node = $$('#knownConfigurationPopup /deep/ pojoviz-inspector-form');
          node.setRecordWithDefaults(schema);
          knownConfigurationPopup.toggle();
        }
      });

    // bind the configuration of known schemas to the sidebar
    $$('#libraries').sections = [{
      icon: 'exit-to-app',
      label: 'Known Schemas',
      libraries: pojoviz.schemas.knownSchemas
    }, {
      icon: 'favorite',
      label: 'Notable Libraries',
      libraries: pojoviz.schemas.notableLibraries
    }, {
      icon: 'stars',
      label: 'My libraries',
      libraries: pojoviz.schemas.myLibraries
    }, {
      icon: 'warning',
      label: 'Huge Schemas',
      libraries: pojoviz.schemas.hugeSchemas
    }, {
      icon: 'cloud',
      label: 'Downloaded',
      libraries: pojoviz.schemas.downloaded
    }];

    // hash autorender check
    setTimeout(function () {
      var hash = (history.state && history.state.command) ||
        location.hash.substr(1);
      window.pushState(hash);
    }, 0);
  });
})();