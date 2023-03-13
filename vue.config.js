const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  chainWebpack: (config) => {
    config.optimization.splitChunks(false);
  },
});
