module.exports = {
  splitChunks: {
    chunks: 'async',
    cacheGroups: {
      default: {
        minChunks: 2,
        reuseExistingChunk: true,
      },
      vendor_mapbox: {
        test: /\/node_modules\/mapbox-gl\//,
        name: 'vendor-mapbox',
        chunks: 'initial',
        enforce: true,
      },
      vendor_react: {
        test: /\/node_modules\/react\//,
        name: 'vendor-react',
        chunks: 'initial',
        enforce: true,
      },
    },
  },
};
