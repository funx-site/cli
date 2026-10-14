/**
 * Local config paths for the public Funx CLI.
 * Mirrors demox-site/cli (`~/.demox/token.json`) as `~/.funx/token.json`.
 */

import os from "node:os";
import path from "node:path";

export function getConfigDir(): string {
  const override = (process.env.FUNX_CONFIG_DIR || "").trim();
  if (override) return path.resolve(override);
  return path.join(os.homedir(), ".funx");
}

export function getTokenPath(): string {
  return path.join(getConfigDir(), "token.json");
}
