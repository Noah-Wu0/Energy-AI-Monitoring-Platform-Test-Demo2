# Antigravity 交接说明

> 项目：Energy AI Oversight Platform pre-sales demo
> 日期：2026-05-26
> 交接目标：Antigravity 继续承接 Codex 当前改版，不要重开思路，不要把项目改回“功能展示 / BI 大屏 / 事后分析”。

---

## 1. 必须先读的文件

开始改代码前，按顺序读：

1. `CONTEXT.md`
2. `能源部Demo演示故事线.md`
3. `努尔意见改版执行计划与验收标准.md`
4. 本文件 `ANTIGRAVITY_HANDOFF.md`

如果文件之间有冲突，以本文件 + `能源部Demo演示故事线.md` 为准。

---

## 2. 项目核心判断

这个 demo 不是能源 BI 大屏，也不是工程师监控台。

它要讲的是：

```text
能源部总部如何用 AI 在事故、供给波动、违规扩大和问责发生前，
提前发现风险，解释原因，推动预防性处置，并形成可审计、可汇报的闭环。
```

最重要的价值关键词：

- 事前预警
- 防患于未然
- 预防性处置窗口
- 跨系统证据链
- 责任部门与 SLA
- 审计留痕
- 部长简报

不要把重点放在：

- AI 模型多先进
- 图表多复杂
- 数据点多完整
- 事后复盘多漂亮
- 预算 / TCO / AB 对比

用户已经明确说过：不用做 AB 对比，不要讲预算，不要“防 Nuer”防得太圆滑。Nuer 只是第三方挑刺参考，主线还是客户能不能感知 AI 的事前预警价值。

---

## 3. 演示故事线

固定一个主案例：

```text
Aktau GCS-001 / Western Caspian Energy
潜在违规生产 + 油气安全风险
```

主线按 6 幕讲：

| 幕 | 主页面 | 只回答一个问题 |
|---|---|---|
| Act I | `/sensing/national-grid` | 今天国家能源系统有没有事？ |
| Act II | `/warning/timeseries/ANO-2026-0512` | 未来什么时候会出事，还有多久能干预？ |
| Act III | `/warning/enterprise/ENT-0091` | 为什么判断它有风险？ |
| Act IV | `/attribution/workflow/CASE-2026-001` | 原因是什么，下一步谁处理？ |
| Act V | `/audit/event/CASE-2026-001` | 预防处置有没有按时推进？ |
| Act VI | `/audit/report` | 副部长如何向上汇报？ |

下钻页只能作为证据，不要抢主线：

| 下钻页 | 用途 |
|---|---|
| `/warning/timeseries/ANO-2026-0512/diagnostics` | 模型对比、完整时序诊断、相似案例 |
| `/audit/event/CASE-2026-001/matrix` | 全量生命周期矩阵、审计证据 |
| `/attribution/graph` | 知识图谱证据支撑 |

---

## 4. 已经完成的改动

### 4.1 文档与计划

- 新增 `能源部Demo演示故事线.md`
- 新增 `努尔意见改版执行计划与验收标准.md`
- 更新 `CONTEXT.md`，要求执行前先看本地计划
- 本文件作为 Antigravity 继续承接的总交接

### 4.2 首页

文件：

- `src/pages/NationalGrid.tsx`

已完成：

- 左侧能源统计面板默认折叠
- 右侧风险事件面板默认折叠
- 地图成为第一视觉
- KPI 改为监管问题：
  - Supply Stability
  - High-Risk Events
  - Pending Decisions
  - Avoided Exposure
- 移除结构性 emoji
- 15 分钟表述改为当前 SCADA feed，不把它讲成系统实时能力限制

### 4.3 预警页拆分

文件：

- `src/pages/PipelineDecision.tsx`
- `src/pages/PipelineTimeSeries.tsx`
- `src/App.tsx`
- `src/components/LeftMenu.tsx`

已完成：

- `/warning/timeseries/:anomalyId` 现在进入 `PipelineDecision`
- `PipelineDecision` 只讲：
  - 92% breach risk within 48H
  - 36H action window
  - 75 MMcm avoided exposure
  - responsible owner = Inspection Dept
- 原 `PipelineTimeSeries` 保留为 `/warning/timeseries/:anomalyId/diagnostics`
- 菜单名改为 `AI Risk & Action Forecast`

### 4.4 归因页

文件：

- `src/pages/WorkflowAttribution.tsx`

已完成：

- 右侧 Master Agent 面板新增 `Preventive Intervention`
- 明确：
  - 36H action deadline
  - 90D incident risk 68%
  - owner = Inspection Dept
  - target = Unit-2C + 12 substations

### 4.5 审计页拆分

文件：

- `src/pages/EventAuditSla.tsx`
- `src/pages/EventAudit.tsx`
- `src/App.tsx`
- `src/components/LeftMenu.tsx`

已完成：

- `/audit/event/:caseId` 现在进入 `EventAuditSla`
- 原 `EventAudit` 矩阵保留为 `/audit/event/:caseId/matrix`
- 菜单名改为 `Preventive SLA Audit`
- `EventAuditSla` 第一视觉强调：
  - `22H left to prevent escalation`
  - 36H preventive inspection window
  - dispatch is the critical path
  - AI detection before confirmed incident

### 4.6 高级咨询风地图与交互优化

文件：

- `src/pages/NationalGrid.tsx`
- `src/index.css`

已完成：

- **高级咨询风配色系统（低饱和、正式、部长级大屏）**：
  - **背景底图**：暖灰 `#F5F2EA`，与外围邻国的浅米灰 `#ECE8DF` 遮罩层形成柔和过渡。
  - **国土主体**：哈萨克斯坦采用象牙白 `#FBFAF5`，配合 `0.25` 的低不透明度 CartoDB 瓦片，使山脉水体纹理微弱隐现，极具高端政务决策品质。
  - **双层平滑国界线**：弃用鲜亮绿色与荧光呼吸发光，采用灰绿色 `#7D8C84`（线宽 `1.3px`），并在下方铺设 `3.2px`、不透明度 `40%` 的浅灰 `#D8DDD6` 作为平滑外描边，消除硬锯齿感与“贴纸感”。
  - **行政区划边界**：采用淡灰绿 `#D1D8D1`（极细 `0.9px`，不透明度 `45%`），极大限度精简背景杂音，将视线锁定在主干网络上。
  - **管网线路层级**：重点线路（1150kV/石油干线）使用深色 `#6F4A28`，主干线路（500kV/天然气干线）使用深棕铜色 `#9C6B3C`，普通线路降低不透明度至 `72%` 实现自然退后；外部及规划线路（Planned/Transit/Coal Rail）统一采用 `#9A9A9A` 的极细灰色虚线。
  - **首府政务标识**：城市节点统一使用 `#264653`；首都 Astana（阿斯塔纳 ★）特调为深政务蓝 `#102A43` 并包覆细沙金（`#C5A059`）外边缘圈，精致大气。
  - **流程链路配色**：闭环追踪条流程全部统一更换为监管深蓝灰 `#355C7D`，体现严密政务闭环。
- **去除冗余气泡交互（拒绝画蛇添足）**：
  - 彻底删除了鼠标悬停/点击州区域时弹出的阻碍性白底 `<Popup>` 文本泡。
  - 恢复为极简无字高亮 —— 悬停时该州边界轻微高亮并呈浅灰绿轻度填充，鼠标移开自然消失，不再有任何弹窗遮挡底层的电站、管线或城市标志，交互流畅自如。

---

## 5. 下一步优先级

### P0：不要改偏主线

继续任何开发前先检查：

- 这个页面是否回答了一个明确的监管问题？
- 是否体现事前预警和防患价值？
- 是否有一个唯一主视觉？
- 是否能从当前页自然进入下一幕？

如果答案是否，就先拆页或删减信息，不要继续加卡片。

### P1：ReportGeneration 改成部长简报闭环

优先做这个。

目标页面：

- `/audit/report`

当前问题：

- 还像“报告生成器”
- 没有把前面 AI 风险、证据链、处置 SLA、审计留痕沉淀成副部长可汇报材料

建议改法：

- 主视觉改为 `Minister Briefing Output`
- 第一屏回答：
  - AI 发现了什么风险？
  - 为什么是事前预警？
  - 预防窗口还剩多久 / 是否已经分派？
  - 证据链来自哪里？
  - 需要部长做什么决策？
- 把普通编辑器、模板、导出选项降级为下钻/右侧辅助

建议模块：

```text
Minister Briefing Output
1. Risk Finding
   92% breach risk within 48H at Aktau GCS-001
2. Preventive Action
   Dispatch inspection within remaining 22H window
3. Evidence Basis
   SCADA + self-reporting + approval + tax/customs + historical pattern
4. SLA Status
   Dispatch is critical path; regional acknowledgement pending
5. Minister Decision Needed
   Approve preventive inspection / cross-agency review
```

验收标准：

- 3 秒内能看出这是给副部长向上汇报的材料
- 不新增不可追溯结论
- 所有数字能回到前序页面
- 强调“防患窗口”，不是只做事后报告

### P2：EnterpriseReporting 简化为证据链主线页

目标页面：

- `/warning/enterprise/ENT-0091`

当前风险：

- 信息量可能偏大
- 可能像企业经营分析，而不是能源部证据链

建议方向：

- 主页面只回答：为什么判断它有风险？
- 第一屏放一个清晰结论：
  - `Cross-system evidence confirms high-risk pattern`
- 只保留 4 类证据：
  - SCADA vs self-reporting
  - approval / permit mismatch
  - tax / customs mismatch
  - emissions / energy output mismatch
- 其他图谱、明细、长表作为下钻或折叠

### P3：WorkflowAttribution 再收紧

目标页面：

- `/attribution/workflow/CASE-2026-001`

当前已补 `Preventive Intervention`，但页面仍有大量 6-agent 证据。

建议下一步：

- 主页面第一屏进一步强调：
  - primary cause
  - 36H dispatch
  - 68% 90D risk
  - owner
- 6-agent 全量证据可以继续保留，但最好折叠或下钻。

---

## 6. UI/UX 规范

使用 `/Users/wushikunawuzihan/.agents/skills/ui-ux-pro-max/SKILL.md` 的约束。关键执行规则如下：

- 每个主页面只有一个视觉中心
- 主线页面只保留 `结论 + 动作 + 关键数字`
- 证据、模型、长列表、矩阵进下钻页
- 不使用 emoji 作为结构性图标
- 用 Lucide icon，保持同一图标语言
- 重要按钮高度至少 `44px`
- icon-only 按钮必须有 `aria-label`
- 演示屏核心文字不能小到需要凑近看
- 不要靠颜色单独表达状态，至少要有文字或 icon
- 不要为了塞信息继续使用 8px/9px 小字
- 页面不可横向溢出，不要让固定栏盖住关键内容

视觉风格：

- 政务监管风
- 浅色、克制、清晰
- 不要炫酷暗黑大屏
- 黑色可以用于关键决策卡，但不要把整页做暗

---

## 7. 数据与文案规范

### 数字口径

- `92% within 48H` 是风险预测，不是定罪概率
- `0.87 similarity` 是模式匹配，不是直接处罚依据
- `75 MMcm` 是 estimated exposure，不是已确认损失
- `68% 90D incident risk` 是预防干预参考，不是事故断言
- 所有 AI 建议都要表达为 recommendation + human approval required

### 绝对不要写

- “系统自动执法”
- “AI 已确认违规”
- “确定造成损失”
- “替代监管人员”
- “省多少钱 / TCO / 预算回报”
- “传统 vs AI AB 对比”

### 推荐措辞

- `pre-emptive warning`
- `preventive intervention`
- `estimated exposure`
- `risk signal`
- `pattern similarity`
- `human approval required`
- `audit trail`
- `minister briefing`

---

## 8. 路由现状

当前关键路由：

```text
/sensing/national-grid
/warning/timeseries/ANO-2026-0512
/warning/timeseries/ANO-2026-0512/diagnostics
/warning/enterprise/ENT-0091
/attribution/workflow/CASE-2026-001
/attribution/graph
/audit/event/CASE-2026-001
/audit/event/CASE-2026-001/matrix
/audit/report
```

原则：

- 不要随意改主线路由
- 如果拆页，优先加 `/details`、`/diagnostics`、`/matrix` 这类下钻路由
- 菜单只指向主线页，不指向复杂下钻页

---

## 9. 验收命令

每次改完至少跑：

```bash
npm run lint
npm run build
```

视觉验收建议：

```bash
npm run dev
# 打开 http://localhost:3000
```

主线手动走一遍：

```text
NationalGrid
-> AI Risk & Action Forecast
-> Enterprise Cross-Reference
-> Agent Attribution Workflow
-> Preventive SLA Audit
-> Regulatory Report Generation
```

检查点：

- 首页：地图是不是第一视觉？
- 预警页：第一眼是不是事前预警 + 处置窗口？
- 企业页：是不是证据链，不是经营分析？
- 归因页：是不是直接给预防干预计划？
- 审计页：是不是防患窗口 + SLA，而不是复杂矩阵？
- 报告页：是不是部长简报，不是普通文档生成器？

---

## 10. 当前工作区状态提示

本交接时有未提交修改，主要包括：

- `src/pages/PipelineDecision.tsx`
- `src/pages/EventAuditSla.tsx`
- `src/pages/NationalGrid.tsx`
- `src/pages/PipelineTimeSeries.tsx`
- `src/pages/WorkflowAttribution.tsx`
- `src/App.tsx`
- `src/components/LeftMenu.tsx`
- `CONTEXT.md`
- `能源部Demo演示故事线.md`
- `努尔意见改版执行计划与验收标准.md`

还有 `output/playwright/*.png` 是视觉验收截图，可以保留作参考，也可以后续清理。

不要在不了解的情况下 revert 这些改动。

---

## 11. 最重要的一句话

如果后续不知道该怎么取舍，就按这句话判断：

```text
能源行业防患才是最重要的。
主线页必须让副部长看到：AI 提前发现了什么风险、还剩多久能干预、谁必须现在行动、如何留下证据并向上汇报。
```
