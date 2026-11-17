# 研究与致谢

以下为上游源码与参考文件的只读审查结果。借鉴设计原则，未安装、执行、复制或分发第三方实现。许可证列是各上游仓库的声明，不是本候选的许可证。

| 项目及源码线索 | 适用判断 | 上游声明 |
| --- | --- | --- |
| BrowserAct Skill Forge：[入口](https://github.com/browser-act/skills/blob/main/browser-act-skill-forge/SKILL.md) · [设计文档](https://github.com/browser-act/skills/blob/main/docs/skill-forge.md) | 调整后采用：从验证过的操作提取输入输出明确的能力；不引入其 CLI、生成器、固定调用预算或强制流程。 | [MIT](https://github.com/browser-act/skills/blob/main/LICENSE) |
| Browsing Skills：[入口](https://github.com/browsing-skills/browsing-skills/blob/main/SKILL.md) · [目录说明](https://github.com/browsing-skills/browsing-skills/blob/main/README.md) | 采用按站点、任务或操作加载的思路；既有渐进加载无需新增路由框架，不引入站点注册中心或可执行操作库。 | [MIT](https://github.com/browsing-skills/browsing-skills/blob/main/LICENSE) |
| Vercel agent-browser：[快照引用](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/references/snapshot-refs.md) · [会话](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/references/session-management.md) · [信任边界](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/references/trust-boundaries.md) | 采用局部快照和外部数据边界；已有会话归属规则保留，不复制 CLI 命令和权限配置。 | [Apache-2.0](https://github.com/vercel-labs/agent-browser/blob/main/LICENSE) |
| OpenCLI：[Explorer](https://github.com/elma-joey/opencli/blob/main/skills/opencli-explorer/SKILL.md) · [Browser](https://github.com/elma-joey/opencli/blob/main/skills/opencli-browser/SKILL.md)。审查的是用户给定地址跳转后的仓库。 | 调整后采用：验证操作的输出契约并复用适配器；已有按操作选路线和授权边界，无需增加接口探查层。不引入认证绕过、固定速度分级或强制动态浏览。 | [Apache-2.0](https://github.com/elma-joey/opencli/blob/main/LICENSE) |
| TestDino Playwright Skill：[入口](https://github.com/testdino-hq/playwright-skill/blob/178d1cb537604279d7b54500c4823a6db42b9de/SKILL.md) | 已覆盖：稳定定位、按状态等待、隔离验证。保留按需参考思路，不引入测试目录、版本绑定或完整测试框架。 | [MIT](https://github.com/testdino-hq/playwright-skill/blob/178d1cb537604279d7b54500c4823a6db42b9de/LICENSE) |
| Microsoft Playwright CLI：[内置 Skill](https://github.com/microsoft/playwright-cli/blob/b21724888b8100b05ef8dee3a92f2bb03bf4dcde/skills/playwright-cli/SKILL.md) · [入口实现](https://github.com/microsoft/playwright-cli/blob/b21724888b8100b05ef8dee3a92f2bb03bf4dcde/playwright-cli.js) | 已覆盖：变化后重新定位、按缺口查看 trace；用法由工具自己的 Skill 提供。不引入其命令白名单、依赖或自动安装。 | [Apache-2.0](https://github.com/microsoft/playwright-cli/blob/b21724888b8100b05ef8dee3a92f2bb03bf4dcde/LICENSE) |
