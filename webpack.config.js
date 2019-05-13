var path = require('path');
var webpack = require('webpack');
const uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

module.exports = {
    entry: {
      "filesafe.js": "./src/Filesafe.js",
      "filesafe.min.js": "./src/Filesafe.js",
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: './[name]',
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
              name: 'filesafe-js/EncryptionWorker.js',
              // inline: true,
              // fallback: false
            }
          }
        },
      ]
    },
    stats: {
        colors: true
    },
    plugins: [
      new uglifyJsPlugin({
        include: /\.min\.js$/,
        minimize: true
      }),
    ],
    devtool: 'source-map'
};
