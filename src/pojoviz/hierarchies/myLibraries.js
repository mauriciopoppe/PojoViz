/**
 * Created by mauricio on 2/17/15.
 */
export default [
  {
    label: 'PojoViz',
    entryPoint: 'pojoviz',
    alwaysDirty: true,
    additionalForbiddenTokens:
      'global:pojoviz.InspectedInstances.pojoviz.analyzer.items',
    analyzerConfig: {
      levels: 3,
      visitArrays: false
    }
  },
  {
    label: 'function-plot',
    entryPoint: 'functionPlot',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/function-plot/1.25.1/function-plot.js'
  },
  {
    label: 'greuler',
    entryPoint: 'greuler',
    src: 'https://cdn.jsdelivr.net/npm/greuler@1.0.0/dist/greuler.min.js'
  }
]
