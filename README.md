# 日照银行“十五五”战略规划执行管理平台 Demo

这是一个 Vite + React + TypeScript Demo，用于展示战略驾驶舱、部门工作台、战略任务、年度推进、指标任务和小程序展示版本。登录后的 PC 页面与 `/mini-program` 均提供智能助手入口。

## 启动方式

```bash
npm install
npm run dev
```

要在本地同时运行 Netlify Function，请安装 Netlify CLI 后执行：

```bash
npx netlify dev
```

## 智能助手配置

复制 `.env.example` 为 `.env`，仅在服务端配置以下变量：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
```

浏览器只请求 `/api/chat`；密钥不会被打入前端包。接口仅使用 DeepSeek 官方的 OpenAI 兼容 Chat Completions 接口；服务端不调用 OpenAI 服务，也不使用 OpenAI SDK。

站内知识库由 `server/knowledge/documents.ts` 从 `src/data/tasks.ts`、`src/data/indicators.ts`、`src/data/departments.ts` 与 `src/data/dashboard.ts` 直接整理；更新这些真实页面数据后，知识库会随函数构建自动更新。检索实现位于 `server/knowledge/search.ts`，根据中文双字词、标题/关键词和当前页面路径挑选最多 6 段资料。

## Netlify 部署

1. 在 Netlify 导入该仓库，构建命令设为 `npm run build`，发布目录为 `dist`。
2. 在 Site configuration → Environment variables 中设置 `DEEPSEEK_API_KEY` 与 `DEEPSEEK_MODEL`。不要将密钥写入仓库或任何 `VITE_*` 变量。
3. 部署时 Netlify 会构建 `netlify/functions/chat.ts`；`netlify.toml` 已将 `/api/chat` 重定向到该函数。
4. 修改模型时只需更新 `DEEPSEEK_MODEL` 环境变量后重新部署。

接口异常时，先确认 Netlify 环境变量是否存在、模型名是否可用，以及 Function 日志中的 HTTP 状态。日志不会记录 API Key 或用户完整提问内容。

## 演示账号

- `111zlb / 111`：战略管理部门
- `222gsywb / 111`：公司业务部
- `222grywb / 111`：个人业务部
- `222phjrb / 111`：普惠金融部
- `222jhcwb / 111`：计划财务部

登录后会根据账号自动识别所属部门。节点状态、进度和成果摘要会保存到浏览器本地存储，刷新后仍可保留。

## 页面说明

- 战略驾驶舱：展示可点击总览入口、板块分布、年度趋势和成果动态。
- 部门工作台：按登录部门展示牵头/协同任务、年度节点和可填报任务卡。
- 战略任务：支持搜索、多条件筛选、卡片与表格视图切换。
- 任务详情：展示任务总览、2026—2030 年度节点、举措拆分和指标关联。
- 年度推进：按年份、任务、部门、板块、状态和逾期状态筛选年度节点列表。
- 指标任务：展示总部目标、当前完成值、数据差值、完成率及 2025—2030 趋势。

## 数据文件位置

- `src/data/tasks.ts`
- `src/data/indicators.ts`
- `src/data/departments.ts`
- `src/data/dashboard.ts`

数据由 `work/extract_strategy_data.py` 从 Excel 离线生成。前端运行时不读取 Excel，不连接后台，不使用数据库。

## 静态 Demo 限制

当前完成值和部分节点拆分为前端演示数据，仅用于界面展示；项目没有真实身份认证、后台接口或数据写入服务。
