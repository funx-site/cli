# Funx CLI

把 Workers 风格的处理函数部署到 `https://<name>.funx.run`。

这是公开包 `@funx-site/cli`（命令名 `funx`），给用户和自动化代理使用。命名和目录对齐 [demox-site/cli](https://github.com/demox-site/cli)（`@demox-site/cli` / `demox`）：`bin/cli.js` 启动编译后的 `dist/cli.js`，源码在 `src/`，测试用 Node 自带的 `node:test`。

平台运维工具不在这个仓库里。STS、router-deploy、api-build、runtime-deploy 和 deploy key 在 [funx-site/funx](https://github.com/funx-site/funx) 的 `cli/`。这里不复制这些流程，也不存放密钥。

## 安装

需要 Node.js 20 或更高版本。

```bash
npm i -g @funx-site/cli
npx @funx-site/cli
```

查看版本和帮助：

```bash
funx --version
funx --help
```

本仓库这一版还没有发布到 npm。上面的安装命令是包接好之后的用法。

## 你将部署什么

处理函数和 Cloudflare Workers 同一形状：

```js
export default {
  async fetch(request, env, ctx) {
    return Response.json({ path: new URL(request.url).pathname, hi: env.GREETING });
  },
};
```

部署完成后的公开地址是 `https://<name>.funx.run`。名称规则、运行时限制和 HTTP API 见 [funx 仓库 README](https://github.com/funx-site/funx) 与 [docs/API.md](https://github.com/funx-site/funx/blob/main/docs/API.md)。

## 当前命令

funx-api 的公开认证还没接到这个包。下面的命令可以执行，但不会访问云端。

| 命令 | 行为 |
| --- | --- |
| `funx --help` | 显示帮助 |
| `funx --version` | 打印 `package.json` 中的版本 |
| `funx status` | 查看本地登录状态。目前恒为未登录，不联网 |
| `funx login` | 占位。不打开浏览器，不提交凭据，退出码 1 |
| `funx dev [path]` | 占位。本地 dev 依赖 funx 仓库里的运行时 shim，这里不转发 |
| `funx deploy [path] --name <name>` | 占位。退出码 1，并指向本文档 |
| `funx list` / `funx ls` | 占位。退出码 1 |

## 认证

计划中的方式是 API token（`Authorization: Bearer`），不是在这个包里保存云厂商密钥。

- 用户本人登录之后，CLI 把 token 写到 `~/.funx/token.json`，对齐 demox CLI 的 `~/.demox/token.json`。
- 非交互环境以后可以读 `FUNX_TOKEN`。`funx status` 发现该变量或 token 文件时，只报告本地有 token、尚未校验。它不打印内容，也不发给服务器。
- `FUNX_CONFIG_DIR` 可以改配置目录，默认是 `~/.funx`。

`funx login` 在认证接通之前不会启动浏览器，也不会监听本地回调。代理或自动化环境不要无人值守地完成浏览器登录，先停下来询问用户。

## 开发这个仓库

```bash
npm install
npm test
```

测试不访问网络。`npm test` 会先编译 TypeScript，再跑 `node --test`。

## 许可证

MIT
