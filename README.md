# AI 能源监管平台（售前 Demo）

哈萨克斯坦能源部级 AI 监管平台概念原型。面向副部长 + 数字化司演示。

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS v4 + ECharts + Leaflet + ReactFlow

## 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

## 下载与安装

```bash
# 1. 克隆仓库
git clone https://github.com/Noah-Wu0/Energy-AI-Monitoring-Platform-Test-Demo2.git

# 2. 进入项目目录
cd Energy-AI-Monitoring-Platform-Test-Demo2

# 3. 安装依赖
npm install

# 4. 配置 Gemini API Key
cp .env.example .env
# 编辑 .env 文件，填入你的 GEMINI_API_KEY
```

## 启动

```bash
npm run dev
```

浏览器访问 `http://localhost:3000`。

## 页面导航

| 路由 | 页面 | 说明 |
|------|------|------|
| `/sensing/national-grid` | 副部长 Dashboard | 全国能源地图，供给稳定性、风险事件、闭环追踪 |
| `/sensing/regional/:id` | 区域设施 | Aktau 等区域下钻 |
| `/warning/timeseries` | 管线时序预测 | AI 时序预测 + 多算法对比 + 历史案例匹配 |
| `/warning/enterprise` | 企业交叉比对 | 跨系统数据对账（SCADA / 财务 / 排放 / 许可证） |
| `/attribution/workflow` | Agent 归因工作流 | 6-Agent 贝叶斯集成归因 |
| `/attribution/graph` | 知识图谱 | 隐藏关联挖掘 |
| `/audit/event/:id` | 审计矩阵 | 全生命周期审计 + 时限追踪 |
| `/audit/report` | 监管报告 | 自动生成部长简报 |

## 项目说明

- 纯前端原型，数据硬编码在 TypeScript 文件中，无后端 API
- 部分模块标注为"PENDING"状态（供热数据待接入）
- 需 `GEMINI_API_KEY` 环境变量（用于 AI 解释等动态功能）
- 地图使用 CartoDB 免费瓦片，无需 token

## 构建生产版本

```bash
npm run build
npm run preview
```
