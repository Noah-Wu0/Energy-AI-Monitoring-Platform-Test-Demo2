# CONTEXT.md — Energy AI Studip (Remix: AI STATECRAFT — ENERGY)

## 背景

- **来源**：GitHub `Noah-Wu0/energy-ai-studip`，Google AI Studio 生成
- **定位**：哈萨克斯坦能源部级 AI 监管平台概念原型（Pre-sales Demo）
- **技术栈**：React 19 + TypeScript + Vite + Tailwind v4 + ECharts + React Leaflet + ReactFlow
- **AI 引擎**：Google Gemini (`@google/genai`)，LLM-TS-Foundation-V2.3 时序预测模型
- **拉取日期**：2026-05-26

## 目标

向哈国能源部展示一套端到端的 AI 驱动能源监管平台：
1. 全国能源基础设施实时感知（电力/油气/煤/供热）
2. 管线异常 AI 预测与多算法对比
3. 6-Agent 自动归因工作流（许可证→报告→检查→处罚→整改→复核）
4. 全过程审计矩阵 + 监管报告自动生成

## 故事线（Demo 案例）

主角是 **CASE-2026-001**，Aktau 地区某油气企业（ENT-0091）：

```
[感知层] 全国电网地图 → 下钻 Aktau 地区 → 发现管线输送量异常 ANO-2026-0512
    ↓
[预警层] 时序图上 LLM 预测 vs 实际值出现持续性偏离（偏差 +23.2%，持续 42 小时）
         3 个假说并行推理，历史类似案例匹配（相似度 0.87）
    ↓
[归因层] 触发 6-Agent 工作流，12 个月内 27 个事件跨许可/报告/检查/处罚/整改/复核 6 条泳道追踪
         Master Agent 贝叶斯集成：posterior 0.85 指向"未申报产能扩张"
         知识图谱 7 层节点（物理资产→法律实体→财务流）挖掘隐藏关联
    ↓
[审计层] 9 阶段 × 多层级生命周期矩阵，瓶颈分析 + 优化模拟器（预计节省 35% 时间）
         自动生成部长简报
```

## 页面路由结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/sensing/national-grid` | NationalGrid | 全国能源地图，四层切换 |
| `/sensing/regional/:regionId` | RegionalFacilities | 区域设施（Aktau demo） |
| `/warning/timeseries` | PipelineTimeSeries | 管线时序异常检测 |
| `/warning/enterprise` | EnterpriseReporting | 企业跨系统数据对账 |
| `/attribution/workflow` | WorkflowAttribution | 6-Agent 归因工作流 |
| `/attribution/graph` | KnowledgeGraph | 知识图谱挖掘 |
| `/audit/event/:caseId` | EventAudit | 生命周期审计矩阵 |
| `/audit/report` | ReportGeneration | 报告自动生成 |

## 关键数据文件

- `src/data/geo.ts` — 城市坐标（7 个主要城市）
- `src/data/electricity.ts` — 发电站/变电站/输电线路
- `src/data/oilgas.ts` — 油田/气田/炼油厂/管线
- `src/data/coal.ts` — 煤田/铀矿/铁路
- `src/data/aktau/` — Aktau 地区详细数据（企业/节点/连接/告警/设备）
- `src/data/anomaly/` — 异常检测数据（队列/时序/算法对比/类似案例）
- `src/data/attribution/case_001_attribution.ts` — 6-Agent 归因完整数据
- `src/data/audit/case_001_lifecycle_matrix.ts` — 审计矩阵数据
- `src/data/graph/case_001_graph.ts` — 知识图谱数据

## 特殊规则

- 项目是**纯前端原型**，数据全部硬编码在 TypeScript 文件中，无后端 API
- 部分模块标注为"PENDING"状态（Heating 数据源待接入）
- 运行需 `GEMINI_API_KEY` 环境变量（用于 AI 解释等动态功能）
- 地图使用 CartoDB 免费瓦片，无需 token

## 当前状态

- 代码完整可运行，8 个页面全部可交互
- 数据以 CASE-2026-001 为例贯穿全流程
- 可作为售前演示材料，需配合口头讲解故事线
