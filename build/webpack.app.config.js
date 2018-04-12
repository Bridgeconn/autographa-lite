const path = require("path");
const merge = require("webpack-merge");
const base = require("./webpack.base.config");

module.exports = env => {
  return merge(base(env), {
    entry: {
      app: "./src/main.js"
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "../src")
    }
  });
};
