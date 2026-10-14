/**
 * Local session probe.
 *
 * funx-api auth is not wired in this package. This module only checks whether
 * a token file or FUNX_TOKEN is present. It does not read token bytes, open a
 * browser, or call the network.
 *
 * Browser login, once it exists, must be completed by the user. An agent stops
 * and asks instead of finishing it unattended.
 */

import { existsSync } from "node:fs";
import { getTokenPath } from "../utils/config.js";

export interface LocalSession {
  /** Always false until funx-api auth can verify a token. */
  loggedIn: false;
  tokenPath: string;
  hasTokenFile: boolean;
  hasEnvToken: boolean;
}

export function readLocalSession(): LocalSession {
  const tokenPath = getTokenPath();
  return {
    loggedIn: false,
    tokenPath,
    hasTokenFile: existsSync(tokenPath),
    hasEnvToken: Boolean((process.env.FUNX_TOKEN || "").trim()),
  };
}
