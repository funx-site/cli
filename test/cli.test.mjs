import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = require("../package.json");
const bin = path.join(root, "bin", "cli.js");

function run(args, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  if (!Object.prototype.hasOwnProperty.call(extraEnv, "FUNX_TOKEN")) delete env.FUNX_TOKEN;
  if (!Object.prototype.hasOwnProperty.call(extraEnv, "FUNX_CONFIG_DIR")) {
    env.FUNX_CONFIG_DIR = path.join(tmpdir(), `funx-cli-missing-${process.pid}`);
  }
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8",
    env,
  });
}

test("package metadata mirrors demox-style public CLI naming", () => {
  assert.equal(pkg.name, "@funx-site/cli");
  assert.equal(pkg.bin.funx, "bin/cli.js");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.engines.node, ">=20");
  assert.equal(typeof pkg.version, "string");
  assert.ok(pkg.version.length > 0);
});

test("--version prints the version from package.json", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), pkg.version);
});

test("--help describes the public worker CLI", () => {
  const result = run(["--help"]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, text);
  assert.match(result.stdout, /Usage: funx/);
  assert.match(text, /@funx-site\/cli/);
  assert.match(text, /https:\/\/<name>\.funx\.run/);
  assert.match(text, /\bstatus\b/);
  assert.match(text, /\bdev\b/);
  assert.match(text, /\bdeploy\b/);
  assert.match(text, /\blist\|ls\b/);
  assert.doesNotMatch(text, /router-deploy|api-build|runtime-deploy|TENCENTCLOUD|SECRET_KEY|deploy-keys/);
});

test("no args prints help and exits 0", () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: funx/);
});

test("status reports not logged in and does not print token material", () => {
  const absent = run(["status"]);
  assert.equal(absent.status, 0, absent.stderr);
  assert.match(absent.stdout, /未登录/);
  assert.match(absent.stdout, /funx login/);
  assert.doesNotMatch(`${absent.stdout}\n${absent.stderr}`, /token\.json".*"accessToken"|Bearer /);

  const dir = mkdtempSync(path.join(tmpdir(), "funx-cli-"));
  const secret = "fx_test_token_do_not_print";
  writeFileSync(path.join(dir, "token.json"), JSON.stringify({ accessToken: secret }), { mode: 0o600 });
  try {
    const present = run(["status"], { FUNX_CONFIG_DIR: dir, FUNX_TOKEN: secret });
    const text = `${present.stdout}\n${present.stderr}`;
    assert.equal(present.status, 0, text);
    assert.match(present.stdout, /未登录/);
    assert.doesNotMatch(text, new RegExp(secret));
    assert.doesNotMatch(text, /accessToken/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("login refuses unattended browser auth", () => {
  const result = run(["login"]);
  const text = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 1, text);
  assert.match(text, /尚未接通/);
  assert.match(text, /询问用户/);
  assert.match(text, /不会打开浏览器/);
  assert.doesNotMatch(text, /localhost:\d+/);
});

test("dev, deploy, and list are unwired and do not call the cloud", () => {
  for (const args of [["dev", "./worker"], ["deploy", "./worker", "--name", "hello"], ["list"], ["ls"]]) {
    const result = run(args);
    const text = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, `${args.join(" ")}: ${text}`);
    assert.match(text, /尚未接通/);
    assert.match(text, /https:\/\/github\.com\/funx-site\/cli#readme/);
    assert.match(text, /https:\/\/<name>\.funx\.run/);
    assert.doesNotMatch(text, /TENCENTCLOUD|SECRET_ID|SECRET_KEY|tencentscf\.com/);
  }
});

test("deploy --help exits 0 before the unwired action", () => {
  const result = run(["deploy", "--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--name/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /尚未接通/);
});

test("sources do not call the network or embed operator credentials", () => {
  const sources = ["src/cli.ts", "src/auth/session.ts", "src/utils/config.ts"]
    .map((file) => readFileSync(path.join(root, file), "utf8"))
    .join("\n");
  assert.doesNotMatch(sources, /TENCENTCLOUD|SECRET_ID|SECRET_KEY|deploy-keys|tencentscf/);
  assert.doesNotMatch(sources, /from ["']node:https["']|from ["']node:http["']|fetch\(/);
});
