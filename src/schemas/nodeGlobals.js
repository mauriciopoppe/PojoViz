/**
 * Created by mauricio on 2/17/15.
 */
module.exports = [{
//  displayName: 'node/x',
//  entryPoint: 'x'
//}, {
  label: 'global',
  entryPoint: 'global',
  displayName: 'node/global',
  forbiddenTokens: 'pojoviz:builtIn',
  analyzerConfig: {
    levels: 3
  }
}, {
  label: 'process',
  entryPoint: 'process',
  displayName: 'node/process',
  analyzerConfig: {
    levels: 5
  }
}, {
  label: 'console',
  entryPoint: 'console',
  displayName: 'node/console'
}, {
  label: 'Buffer',
  entryPoint: 'Buffer',
  displayName: 'node/Buffer'
//}, {
//  label: 'require',
//  entryPoint: 'require',
//  displayName: 'node/require',
//  analyzerConfig: {
//    levels: 0
//  }
//}, {
//  label: 'module',
//  entryPoint: 'module',
//  displayName: 'node/module'
//}, {
//  label: 'exports',
//  entryPoint: 'exports',
//  displayName: 'node/exports'
}].map(function (v) {
    v.remote = true;
    return v;
  });