import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { getConfigDir, getTokenPath } from "../dist/utils/config.js";

const original = process.env.FUNX_CONFIG_DIR;

afterEach(() => {
  if (original === undefined) delete process.env.FUNX_CONFIG_DIR;
  else process.env.FUNX_CONFIG_DIR = original;
});

test("defaults to ~/.funx/token.json", () => {
  delete process.env.FUNX_CONFIG_DIR;
  assert.equal(getConfigDir(), path.join(os.homedir(), ".funx"));
  assert.equal(getTokenPath(), path.join(os.homedir(), ".funx", "token.json"));
});

test("FUNX_CONFIG_DIR overrides the config directory", () => {
  process.env.FUNX_CONFIG_DIR = "/tmp/funx-config";
  assert.equal(getConfigDir(), path.resolve("/tmp/funx-config"));
  assert.equal(getTokenPath(), path.join(path.resolve("/tmp/funx-config"), "token.json"));
});
