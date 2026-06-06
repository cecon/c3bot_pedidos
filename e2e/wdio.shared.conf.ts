// Shared WebdriverIO base config. The web and native layer configs spread this and override
// only `capabilities` and the launch hooks (FR-013: one spec + one page object for both layers).

export const sharedConfig: WebdriverIO.Config = {
  runner: "local",

  // Single shared spec — same assertions run on every layer.
  specs: ["./specs/**/*.e2e.ts"],

  // Smoke is sequential and tiny; one session keeps output readable.
  maxInstances: 1,

  logLevel: "warn",
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,

  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    // Bounded overall budget for the smoke run (FR-011).
    timeout: 90000,
  },
};
