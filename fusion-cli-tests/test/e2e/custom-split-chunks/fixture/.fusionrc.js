module.exports = {
  splitChunks: {
    chunks: 'async',
    cacheGroups: {
      default: {
        minChunks: 2,
        reuseExistingChunk: true,
      },
      vendor_mapbox: {
        test: /.*\/node_modules\/mapbox-gl\/index\.js/,
        name: 'vendor-mapbox',
        chunks: 'initial',
        enforce: true,
      },
      vendor_react: {
        test: /.*\/node_modules\/react\/index\.js/,
        name: 'vendor-react',
        chunks: 'initial',
        enforce: true,
      },
    },
  },
};