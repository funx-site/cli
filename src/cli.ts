#!/usr/bin/env node

/**
 * Funx CLI — public package for deploying Workers-style handlers.
 * Operator commands (STS, router-deploy, api-build, runtime-deploy, deploy keys)
 * stay in funx-site/funx under cli/ and are intentionally absent here.
 */

import { Command } from "commander";
import { createRequire } from "node:module";
import { readLocalSession } from "./auth/session.js";
import { getTokenPath } from "./utils/config.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const DOCS = "https://github.com/funx-site/cli#readme";

const program = new Command();

program
  .name("funx")
  .description("把 Workers 风格的处理函数部署到 https://<name>.funx.run")
  .version(version);

program.addHelpText(
  "after",
  `
说明:
  公开包 @funx-site/cli。运维命令（STS、router-deploy、api-build、runtime-deploy、deploy key）在 funx-site/funx 的 cli/，不在这里。
  认证尚未接通。代理请先询问用户，不要无人值守地完成浏览器登录。
  文档: ${DOCS}
`
);

program
  .command("status")
  .description("查看本地登录状态（不访问网络）")
  .action(() => {
    const session = readLocalSession();
    console.log("未登录");
    if (session.hasEnvToken || session.hasTokenFile) {
      console.log("本地有 API token，但 funx-api 认证尚未接通，没有校验，也不会发到服务器。");
      console.log("token 内容不会打印。");
    } else {
      console.log("请运行: funx login");
    }
    console.log(`Token 文件: ${session.tokenPath}`);
  });

program
  .command("login")
  .description("登录（占位：不打开浏览器，不调用 funx-api）")
  .action(() => {
    const tokenPath = getTokenPath();
    console.error(
      [
        "funx login 尚未接通 funx-api。",
        "请用户本人完成登录。代理不能在无人值守时完成浏览器登录，请停下来询问用户。",
        `计划中的认证是 API token，写入 ${tokenPath}（对齐 demox CLI 的 ~/.demox/token.json）。`,
        "本命令不会打开浏览器，也不会访问网络。",
        "文档: https://github.com/funx-site/cli#认证",
      ].join("\n")
    );
    process.exit(1);
  });

program
  .command("dev")
  .description("在本地运行 worker（尚未接通）")
  .argument("[target]", "worker 目录或文件")
  .option("-p, --port <port>", "本地端口（尚未使用）")
  .option("--var <pair...>", "KEY=value（尚未使用）")
  .action(() => {
    notWired(
      "dev",
      "本地 dev 依赖 funx 仓库里的运行时 shim，不能在不带上平台代码的情况下安全转发。"
    );
  });

program
  .command("deploy")
  .description("部署 worker 到 https://<name>.funx.run（尚未接通）")
  .argument("[target]", "worker 目录或文件")
  .option("-n, --name <name>", "worker 名称，对应 https://<name>.funx.run")
  .action(() => {
    notWired("deploy");
  });

program
  .command("list")
  .alias("ls")
  .description("列出 worker（尚未接通）")
  .action(() => {
    notWired("list");
  });

function notWired(name: string, extra?: string): never {
  const lines = [
    `funx ${name} 尚未接通。`,
    "这个公开包用来把 Workers 风格的处理函数部署到 https://<name>.funx.run。",
    "funx-api 认证接上之前，该命令不会访问云端。",
  ];
  if (extra) lines.push(extra);
  lines.push(`文档: ${DOCS}`);
  console.error(lines.join("\n"));
  process.exit(1);
}

if (process.argv.slice(2).length === 0) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
