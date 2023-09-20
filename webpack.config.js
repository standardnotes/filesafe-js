var path = require("path")

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: {
    "filesafe.js": "./src/Filesafe.js",
    "filesafe.min.js": "./src/Filesafe.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "./[name]",
    library: "FilesafeJS",
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
      },
    ],
  },
  stats: {
    colors: true,
  },
}
