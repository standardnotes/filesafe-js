var path = require('path');
var webpack = require('webpack');
module.exports = {
    entry: {
      "filesafe": "./src/Filesafe.js",
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'filesafe.js',
        library: 'FilesafeJS',
        libraryTarget: 'commonjs2'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
        },
        {
          test: /\.worker\.js$/,
          use: {
            loader: 'worker-loader',
            options: {
              inline: true,
              fallback: false
            }
          }
        },
      ]
    },
    stats: {
        colors: true
    },
    plugins: [
    ],
    devtool: 'source-map'
};
