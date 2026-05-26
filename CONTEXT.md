# CONTEXT.md — Energy AI Oversight Platform (Pre-sales Demo)

> 接手继续开发前，先读 `ANTIGRAVITY_HANDOFF.md`。当前最新规范与下一步计划以该文件 + `能源部Demo演示故事线.md` 为准。

## 项目概况

- **仓库**：https://github.com/Noah-Wu0/Energy-AI-Monitoring-Platform-Test-Demo2
- **定位**：哈萨克斯坦能源部级 AI 监管平台概念原型，面向副部长 + 数字化司演示
- **技术栈**：React 19 + TypeScript + Vite + Tailwind CSS v4 + ECharts + React Leaflet + ReactFlow
- **特点**：纯前端原型，数据硬编码，无需后端/API Key，`npm install && npm run dev` 即跑

## 运行方式

```bash
git clone https://github.com/Noah-Wu0/Energy-AI-Monitoring-Platform-Test-Demo2.git
cd Energy-AI-Monitoring-Platform-Test-Demo2
npm install
npm run dev
# 打开 http://localhost:3000
```

无需配置任何环境变量。

## 页面路由

| 路由 | 页面 | 所属幕 |
|------|------|--------|
| `/sensing/national-grid` | 副部长 Dashboard（全国能源地图 + KPI + 闭环追踪 + 风险事件） | Act I: 全景风险感知 |
| `/sensing/regional/:id` | 区域设施下钻（Aktau 等） | Act I 下钻 |
| `/warning/timeseries` | 管线时序 AI 预测 + 多算法对比 + 历史案例匹配 + 未来风险预测 | Act II: 告警到归因 |
| `/warning/enterprise` | 企业跨系统数据对账（Identity Graph + Reconciliation Matrix + AI Narrative） | Act II 交叉验证 |
| `/attribution/workflow` | 6-Agent 贝叶斯集成归因工作流 | Act III: 监管处置闭环 |
| `/attribution/graph` | 知识图谱关联挖掘 | Act III 证据支撑 |
| `/audit/event/:id` | 生命周期审计矩阵（9 阶段 × 5 层级） | Act III 审计留痕 |
| `/audit/report` | 监管报告自动生成 | Act IV: 效能量化 |

## 数据文件

- `src/data/geo.ts` — 7 个主要城市坐标
- `src/data/electricity.ts` — 发电站/变电站/输电线路
- `src/data/oilgas.ts` — 油田/气田/炼油厂/管线
- `src/data/coal.ts` — 煤田/铀矿/铁路（已补 Pavlodar/Ekibastuz 数据）
- `src/data/aktau/` — Aktau 地区详细数据
- `src/data/anomaly/` — 异常检测数据（队列/时序/算法对比/类似案例）
- `src/data/attribution/case_001_attribution.ts` — 6-Agent 归因数据
- `src/data/audit/case_001_lifecycle_matrix.ts` — 审计矩阵数据
- `src/data/graph/case_001_graph.ts` — 知识图谱数据

## 已完成的修改（2026-05-26）

### 语言 - 全部英文化
所有 UI 文案、数据标签、KPI 均已从中文转为英文。

### P0 修改（对应努尔 2026-05-25 批评意见）

1. **Pavlodar 煤矿数据** — `coal.ts` 已补 Ekibastuz 盆地（12.5 Gt, KZ 最大）+ GRES-1/GRES-2 + Aksu 电站
2. **NationalGrid 重构为副部长 Dashboard** — 新增 KPI 条（供给稳定性/异常事件/待处置/合规率）+ 闭环追踪条（Detect→Attribute→Dispatch→Resolve→Review→Archive）+ 风险事件分级面板
3. **PipelineTimeSeries 叙事从"发现"改为"预测"** — 全部文案改为 pre-emptive prediction，新增 Future Risk Forecast（30D/90D horizon）
4. **所有数字加置信区间** — `ano_0512_metadata.ts` 中所有 KPI 附带 95% CI 和回测准确率
5. **LeftMenu 重构成 4 幕闭环故事** — Act I 全景风险感知 → Act II 告警到归因 → Act III 监管处置闭环 → Act IV 效能量化

### P1 修改

6. **EnterpriseReporting 增加模式匹配逻辑** — NARRATIVE 改为三阶段（AI Pattern Match → AI Attribution → Warning & Recommendation），跨 5 系统自动关联分析

### 其他清理

- 移除 `vite.config.ts` 中未使用的 `GEMINI_API_KEY` 注入逻辑
- 简化 `.env.example`
- 更新 README.md（中文，含下载 / 安装 / 使用说明）

## 待修改清单（P1/P2，留给 Codex）

以下来自努尔的批评意见，尚未在代码中落地：

> 执行前先看本地计划：`能源部Demo演示故事线.md` + `努尔意见改版执行计划与验收标准.md`。先按故事线确定页面主次，再按 P0/P1 顺序和验收标准推进。

### 待做 #1：首页侧面板折叠
- **位置**：`src/pages/NationalGrid.tsx`
- **当前状态**：左侧统计面板（240px）和右侧风险事件面板（300px）固定宽度
- **期望**：两侧面板可折叠，默认折叠/半折叠，让地图成为唯一主视觉焦点

### 待做 #2：WorkflowAttribution 增加预防干预节点
- **位置**：`src/pages/WorkflowAttribution.tsx` + `src/data/attribution/case_001_attribution.ts`
- **当前状态**：6 条泳道覆盖许可证→报告→检查→处罚→整改→复核（事后追溯闭环）
- **期望**：在 Master Agent 输出后增加"建议预防措施"节点——不只是说"未申报产能扩张"，而是"类似模式在未来 90 天内有 68% 概率导致安全事故"

### 待做 #3：AI 监管影响模块
- **位置**：`src/pages/NationalGrid.tsx` 或 `src/pages/PipelineTimeSeries.tsx`
- **当前状态**：AI 直接带来的监管效果不够突出
- **期望**：首页或预警页增加 AI 监管影响模块，用具体数字展示 AI 如何提前识别、解释并推动处置
  - 持续风险评分
  - 跨系统模式匹配
  - 生成处置窗口
  - 建议责任部门

### 待做 #4：EventAudit 增加时限追踪
- **位置**：`src/pages/EventAudit.tsx`
- **当前状态**：阶段 × 层级矩阵视图，无时间轴
- **期望**：增加时间轴追踪视图，每个阶段标注实际耗时 vs 预期耗时，突出瓶颈

### 待做 #5：部长简报闭环输出
- **位置**：`src/pages/ReportGeneration.tsx`
- **期望**：回答——AI 发现了什么、证据链是什么、处置状态如何、是否留痕、需要部长做什么决策

### 待做 #6：首页增加"潜在损失规避"指标
- **位置**：`src/pages/NationalGrid.tsx` KPI 区域
- **期望**：量化如果不预警的损失（如：该异常持续 30 天将导致 XXX 方天然气浪费 / XXX 吨碳排放超标）

## 努尔核心自检标准（修改时对照）

1. 这是副部长想看的吗？（不是工程师视角，不是企业经理视角）
2. 是事前预警还是事后追溯？（事后 = 降级为历史参考案例）
3. 有数字就有置信区间吗？（没有就别放）
4. 这一屏只有一个重点吗？（超过一个 = 太复杂，拆开）
5. 这个故事形成闭环了吗？（发现→归因→分派→处置→审计）

## 数据约束

- 所有数据硬编码在 TypeScript 文件中，无后端 API
- 部分模块标注 "PENDING"（Heating 数据源待接入）
- 地图使用 CartoDB 免费瓦片，无需 token
- `@google/genai` 已安装但未使用（AI Studio 模板遗留），运行无需 API Key
