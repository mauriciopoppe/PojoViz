import Inspector from './Inspector'
import { deepMerge } from '../util/lodash-replacements'

class Angular extends Inspector {
  constructor (config) {
    super(
      deepMerge(
        {
          entryPoint: 'angular',
          displayName: 'AngularJS',
          alwaysDirty: true,
          additionalForbiddenTokens: 'global:jQuery'
        },
        config
      )
    )

    this.services = [
      '$animate',
      '$cacheFactory',
      '$compile',
      '$controller',
      // '$document',
      '$exceptionHandler',
      '$filter',
      '$http',
      '$httpBackend',
      '$interpolate',
      '$interval',
      '$locale',
      '$log',
      '$parse',
      '$q',
      '$rootScope',
      '$sce',
      '$sceDelegate',
      '$templateCache',
      '$timeout'
      // '$window'
    ].map(function (v) {
      return { checked: true, name: v }
    })
  }

  getSelectedServices () {
    const me = this
    const toAnalyze = []

    window.angular.module('app', ['ng'])
    this.injector = window.angular.injector(['app'])

    me.services.forEach(function (s) {
      if (s.checked) {
        const obj = me.injector.get(s.name)
        toAnalyze.push(obj)
      }
    })
    return toAnalyze
  }

  /**
   * @override
   */
  inspectSelf () {
    const me = this
    this.debug && console.log('inspecting angular')

    // get the objects that need to be forbidden
    const toForbid = me.parseForbiddenTokens()
    this.debug && console.log('forbidding: ', toForbid)
    this.analyzer.forbid(toForbid, true)

    this.analyzer.add([window.angular].concat(this.getSelectedServices()))
  }

  /**
   * Since Angular is a script retrieved on demand but the instance
   * is already created in InspectedInstance, let's alter the
   * properties it has before making the request
   */
  modifyInstance (options) {
    this.src = options.src
  }
}

export default Angular
