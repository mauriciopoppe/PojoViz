/**
 * Created by mauricio on 2/17/15.
 */
export default [
  {
    entryPoint: "window",
    analyzerConfig: {
      levels: 1,
    },
  },
  {
    label: "ExtJS",
    src: "//cdn.sencha.com/ext/gpl/4.2.1/ext-all.js",
    entryPoint: "Ext",
    analyzerConfig: {
      levels: 1,
    },
  },
  {
    entryPoint: "THREE",
  },
  {
    entryPoint: "Phaser",
    src: "//cdnjs.cloudflare.com/ajax/libs/phaser/2.0.6/phaser.min.js",
    analyzerConfig: {
      visitSimpleFunctions: true,
    },
  },
];
