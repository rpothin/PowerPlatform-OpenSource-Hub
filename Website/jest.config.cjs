/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./babel.jest.config.cjs" }]
  }
};