var path = require('path');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    "filesafe.js": "./src/Filesafe.js",
    "filesafe.min.js": "./src/Filesafe.js",
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './[name]',
    library: 'FilesafeJS',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [{
        test: /\.js$/,
        loader: 'babel-loader',
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            filename: 'filesafe-js/EncryptionWorker.js',
            // inline: 'fallback',
          }
        }
      },
    ],
  },
  stats: {
    colors: true,
  },
};
