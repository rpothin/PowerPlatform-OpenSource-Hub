module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "20" }, modules: false }],
    "@babel/preset-typescript"
  ]
};
