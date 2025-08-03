module.exports = {
  plugins: [
    require('autoprefixer')({
      cascade: false
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      require('cssnano')({
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
          discardEmpty: true,
          mergeRules: true,
          minifyFontValues: true,
          minifySelectors: true,
          reduceIdents: false, // Keep animation names readable
          svgo: true,
          calc: {
            precision: 3
          }
        }]
      })
    ] : [])
  ]
};