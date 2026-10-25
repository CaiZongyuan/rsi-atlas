---
title: Harness² 深读
description: 论文与 GitHub 源码双证据：不改模型权重，只改模型外面那层壳。看「提议—探测—组合」在代码里怎么落地，+11.5 分的基线是什么，污染面在哪里。
---
<div class="art-head">
  <div class="art-kicker">Harness² · arXiv 2610.14224 · 2026-10 · google-research/harness2</div>
  <h1>不去改模型，<br><span>去改「包住模型的那层壳」</span></h1>
  <p class="art-sub">如果任务在测试时才出现、又没有标准答案，怎么判断一次框架修改是变好还是变坏？Harness² 的答案是不判断“对错”，只判断“行为有没有按预期变化”——然后把这一路的经验存下来，交给下一个任务。这篇深读把<b>论文</b>和<b>114 个文件的仓库</b>摆在一起，看机制怎么落地、数字怎么来的、哪些地方要打折。</p>
  <div class="art-meta">
    <span>证据 · <b>论文全文 / 仓库 114 文件 · 核心约 12k 行</b></span>
    <span>读法 · <b>先看第 05 节的 12 条批判</b></span>
    <span>约 20 分钟</span>
  </div>
  <div class="hstats">
    <div class="hstat"><div class="k">头条增益</div><div class="v">+11.5</div><div class="d">WorkBuddy-Bench 均分 · GLM-5 / OpenCode</div></div>
    <div class="hstat"><div class="k">单步算力</div><div class="v">4×</div><div class="d">基线 1 次 rollout，Harness² k=1 要 4 次</div></div>
    <div class="hstat"><div class="k">预算恒等式</div><div class="v">4k / 3k</div><div class="d">rollout 数 / 改进会话数，代码硬校验</div></div>
    <div class="hstat"><div class="k">基线 harness</div><div class="v">全空</div><div class="d">systemprompt / guardrails / memory 皆是空文件</div></div>
  </div>
</div>
<p class="small" style="margin-top:26px">
  这是一篇独立评述。文中每个结论都标注证据类型：<span class="ev paper">论文</span> 指正文与表格，
  <span class="ev code">源码</span> 指 GitHub 仓库文件（带行号）。和前一篇不同，Harness² <b>没有公开运行轨迹</b>——
  <code>runs/</code> 目录不在 release 里，所以这一篇没有「轨迹露」这一维，第 05 节因此更依赖代码自曝的细节。
</p>
<div class="sec-eyebrow">01 · 问题</div>

## 它要解决的两个问题

论文先摆了一个前提：智能体的能力不只取决于模型，还取决于**运行框架**（harness）——提示词、记忆、技能、工具与编排<sup>（§1）</sup>。同一个模型换一套框架，表现可以差很多。论文引的证据很直接：强模型在不同框架下差异显著。

把 RSI 用到这一层，开放世界会立刻撞上两个障碍：

1. **没有可靠的验证器。** 任务在框架设计阶段看不见，测试时又是全新的。没有标准答案，就没有一个可信的信号告诉你“这次改对了”。现有的变通办法——代理信号、假定的真实答案、成对输出判断——要么不可靠，要么引入了另一种泄漏<sup>（§1）</sup>。
2. **改进不迁移。** 针对某个任务调出来的框架，换个任务就失效；随着任务分布漂移，直接继承上一条高度定制的框架，反而会把噪声带进下一轮。

论文的核心问题因此变成一句话：<b>递归自我改进能不能既改进当前的框架，又改进“未来怎么改进框架”？</b>

这个问法值得停一下。它把 RSI 的“递归”落在了两个不同的对象上：<b>执行框架</b>是被改进的系统，<b>改进框架</b>是改进它的机制。后者在任务进行期间保持固定，任务结束后才更新<sup>（§2.1）</sup>。整个论文的骨架就是这个区分。

<div class="note">
  <span class="lb">为什么这个问题是真问题</span>
  “没有验证器”不是论文刻意选的困难模式，而是开放世界部署的默认状态。任何依赖“改完跑个分看看”的方法，在这里都会失效——因为分要等任务结束、甚至要等人工标注之后才存在。Harness² 的全部设计都是围绕“<b>在不知道对错的情况下，如何安全地修改系统</b>”展开的。
</div>
<div class="sec-eyebrow">02 · 机制</div>

## 两层递归，一个对比步骤

### 改的东西：8 个文件组件

一个运行框架在代码里就是一棵<b>文件树</b>——<code>Tree = dict[str, str]</code>，相对路径映射到内容<span class="ev code">tree.py:31</span>。哪些路径算“可编辑组件”由正则白名单判定<span class="ev code">tree.py:92-110</span>。在 OpenCode 执行器下是 8 个组件：

<table class="tbl">
  <thead><tr><th>#</th><th>组件</th><th>文件位置</th><th>激活方式</th></tr></thead>
  <tbody>
    <tr><td class="nm">c1</td><td>系统提示词</td><td><code>systemprompt.md</code></td><td>always-on</td></tr>
    <tr><td class="nm">c2</td><td>护栏</td><td><code>guardrails.md</code></td><td>always-on</td></tr>
    <tr><td class="nm">c3</td><td>长期记忆</td><td><code>LongTermMEMORY.md</code></td><td>always-on</td></tr>
    <tr><td class="nm">c4</td><td>工具指导</td><td><code>tool_descriptions/tool_guidance.md</code></td><td>always-on</td></tr>
    <tr><td class="nm">c5</td><td>子智能体</td><td><code>sub_agents/&lt;n&gt;/AGENT.md</code></td><td>独立上下文</td></tr>
    <tr><td class="nm">c6</td><td>技能</td><td><code>skills/&lt;n&gt;/SKILL.md</code></td><td>按需加载</td></tr>
    <tr><td class="nm">c7</td><td>脚本</td><td><code>scripts/&lt;n&gt;.py</code></td><td>按需 bash</td></tr>
    <tr><td class="nm">c8</td><td>中间件插件</td><td><code>plugin/&lt;n&gt;.ts</code></td><td>常驻工具循环</td></tr>
  </tbody>
</table>
<p class="small" style="margin-top:10px">组件表据 <span class="ev code">opencode.py:42-88</span> 与论文图 2。<b>注意一个论文不会强调的事实：“8 个组件”是 OpenCode 专属口径。</b>Codex 执行器下面是另一套——只有 <code>AGENTS.md</code> 一个 always-on，加 skills、子智能体、脚本和 <code>.codex/hooks.json</code>，插件的位置被 hooks 取代<span class="ev code">codex.py:39-74</span>。论文表 1/表 2 把两种执行器的结果并列展示时，这个差异被抹平了。</p>

编辑操作只有三种：增（新文件）、删（删除文件）、改（改内容），由 diff 统计<span class="ev code">tree.py:393-404</span>。没被提到的组件按“省略即继承”处理<span class="ev code">tree.py:20</span>。

### 提议 → 探测 → 组合

这是全文最值得看的部分。一个对比步骤<sup>（§2.2.1）</sup>：

1. **提议。** 先用当前框架跑一次<b>参考执行</b>，看清它“怎么做事”。然后提两个候选：<b>不变性候选</b>针对跨领域通病（规划、工具使用、上下文管理、委派），提示词里硬性规定“不许加领域知识，那是另一个候选的事”<span class="ev code">prompts.py:347-370</span>；<b>领域候选</b>针对当前领域的流程、约束与格式<span class="ev code">prompts.py:372-404</span>。
2. **探测。** 两个候选在相同模型、相同环境下各跑一遍同一任务，比较轨迹与交付物相对参考执行的变化。
3. **组合。** 读完整套证据，选择性地合并、修订、采用某一个、或者保留原框架，然后执行组合后的框架。

代码里有两个设计值得单独指出：

<b>第一，“提案”就是磁盘上的文件编辑。</b>提议阶段把会话工作目录里被改过的整棵 harness 树拷回来当成提案——提示词原话：“你的磁盘编辑就是提案，回复本身不改变 harness”<span class="ev code">prompts.py:181-184</span>，落盘逻辑在 <span class="ev code">proposer.py:178-179</span>。也就是说，“让模型改框架”在实现层面就是“给模型一个文件系统”。

<b>第二，正确性被物理隔绝在方法之外。</b>方法内部能看到的所有执行记录，是一个叫 <code>RunView</code> 的结构，注释写得很死：“方法对一次已完成 rollout 的全部认知。<b>永远不带分数</b>”<span class="ev code">spec.py:176-178</span>；而评分函数 <code>score()</code> 的注释是“只被 <code>core.judge</code> 调用，只在对选择做出承诺之后”<span class="ev code">spec.py:247-250</span>。探测阶段唯一的程序化信号是“交付物是否存在”这个布尔值<span class="ev code">recursion.py:283-287</span>。

<figure class="fig">
  <div class="figt">一次 k=1 的 Harness² step：4 次 rollout，3 次改进会话，1 次反思</div>
  <svg viewBox="0 0 960 340" role="img" aria-label="Harness² 单步流水线与预算构成">
    <defs>
      <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 z" fill="#4f4d47"/>
      </marker>
    </defs>
    <g font-family="IBM Plex Mono,monospace" font-size="10" fill="#827f76">
      <text x="0" y="14">执行器 rollout</text>
      <text x="0" y="216">改进会话（编辑器模型）</text>
    </g>
    <line x1="130" y1="30" x2="130" y2="200" stroke="#292825"/>
    <!-- executor row -->
    <g>
      <rect x="140" y="46" width="120" height="60" rx="9" fill="#181816" stroke="#383632"/>
      <text x="200" y="72" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">基础 rollout</text>
      <text x="200" y="92" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">×1 · 参考执行 e⁰</text>
      <rect x="300" y="46" width="130" height="60" rx="9" fill="#181816" stroke="#383632"/>
      <text x="365" y="72" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">INV 候选</text>
      <text x="365" y="92" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">跨领域缺陷</text>
      <rect x="300" y="118" width="130" height="60" rx="9" fill="#181816" stroke="#383632"/>
      <text x="365" y="144" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">DOM 候选</text>
      <text x="365" y="164" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">领域知识</text>
      <rect x="470" y="82" width="130" height="60" rx="9" fill="#181816" stroke="#383632"/>
      <text x="535" y="108" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">组合框架 H′</text>
      <text x="535" y="128" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">合并 / 采用 / 保留</text>
      <rect x="640" y="82" width="120" height="60" rx="9" fill="#1f2a24" stroke="#2c3f33"/>
      <text x="700" y="108" text-anchor="middle" fill="#88c49c" font-size="12" font-family="Noto Serif SC,serif">最终 rollout</text>
      <text x="700" y="128" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">交付物 y</text>
      <rect x="800" y="82" width="130" height="60" rx="9" fill="#181816" stroke="#383632"/>
      <text x="865" y="108" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">judge 评分</text>
      <text x="865" y="128" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">只在选择后</text>
      <line x1="260" y1="76" x2="300" y2="76" stroke="#4f4d47" marker-end="url(#ah)"/>
      <line x1="260" y1="148" x2="300" y2="148" stroke="#4f4d47" marker-end="url(#ah)"/>
      <line x1="430" y1="76" x2="470" y2="104" stroke="#4f4d47" marker-end="url(#ah)"/>
      <line x1="430" y1="148" x2="470" y2="120" stroke="#4f4d47" marker-end="url(#ah)"/>
      <line x1="600" y1="112" x2="640" y2="112" stroke="#4f4d47" marker-end="url(#ah)"/>
      <line x1="760" y1="112" x2="800" y2="112" stroke="#4f4d47" marker-end="url(#ah)"/>
    </g>
    <!-- improver row -->
    <g>
      <rect x="300" y="232" width="130" height="56" rx="9" fill="#181816" stroke="#383632"/>
      <text x="365" y="256" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">INV 编辑会话</text>
      <text x="365" y="274" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">改 harness 文件</text>
      <rect x="300" y="296" width="130" height="40" rx="9" fill="#181816" stroke="#383632"/>
      <text x="365" y="320" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">DOM 编辑会话</text>
      <rect x="470" y="232" width="130" height="56" rx="9" fill="#181816" stroke="#383632"/>
      <text x="535" y="256" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">组合会话</text>
      <text x="535" y="274" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">读候选池 + diff</text>
      <rect x="640" y="232" width="290" height="56" rx="9" fill="#181816" stroke="#383632"/>
      <text x="785" y="256" text-anchor="middle" fill="#a3a097" font-size="12" font-family="Noto Serif SC,serif">反思会话（记账之外）</text>
      <text x="785" y="274" text-anchor="middle" fill="#827f76" font-size="10" font-family="IBM Plex Mono,monospace">蒸馏 EXPERIENCE.md 入库</text>
      <line x1="365" y1="232" x2="365" y2="196" stroke="#4f4d47" stroke-dasharray="3 3" marker-end="url(#ah)"/>
      <line x1="535" y1="232" x2="535" y2="196" stroke="#4f4d47" stroke-dasharray="3 3" marker-end="url(#ah)"/>
      <line x1="700" y1="232" x2="700" y2="196" stroke="#4f4d47" stroke-dasharray="3 3" marker-end="url(#ah)"/>
    </g>
    <g font-family="IBM Plex Mono,monospace" font-size="10" fill="#827f76">
      <text x="140" y="330">基线只有第 1 格：1 次 rollout，0 个改进会话。k=1 的 Harness² 是 4 + 3 + 1。</text>
    </g>
  </svg>
  <p class="small" style="margin-top:12px">预算恒等式来自 <span class="ev code">ledger.py:26-33</span>：<code>R = 4k</code>（k 次基础 + 2k 次候选 + k 次最终 rollout），<code>P = 3k</code>（k 次 INV + k 次 DOM + k 次组合会话）。阶段结束后硬校验，不符抛 <code>BudgetError</code><span class="ev code">ledger.py:89-113</span>。注意 P 记的是“阶段数”不是原始模型调用数——重试只进 attempts 与 usd<span class="ev code">ledger.py:123-124</span>。</p>
</figure>

组合本身是<b>纯模型驱动</b>的：一个普通阶段调用 <code>prompts.aggregate</code><span class="ev code">recursion.py:412-426</span>，让模型读整个候选池（含各候选相对当前框架的 unified diff<span class="ev code">context.py:308-318</span>），然后自己编辑产出唯一框架。可选项就三个：MERGE（跨候选合并）、ADOPT ONE WHOLESALE（整体采用某一个）、KEEP_BASE（保留原样）<span class="ev code">prompts.py:932-937</span>。

### 并行与顺序：k 控制的是预算

- **并行递归**：2k 个候选（k 个 INV + k 个 DOM）全部 roll 完后，开 k 个独立组合会话，各产出一个最终框架并执行。宽度换多样性<sup>（§2.2.2）</sup>。
- **顺序递归**：k 轮对比步骤串联，每轮把组合结果和累积的执行历史带进下一轮。深度换收敛。

两种模式的预算完全相同（都是 4k/3k），差别在墙钟。论文的措辞是“并行探索多个候选”——但代码里默认相位并发只有 2：<code>PHASE_WIDTH = 2</code>，外加 <code>PROPOSER_CONCURRENCY = 2</code> 的信号量<span class="ev code">config.py:176,178</span>。这个名字里的“并行”比实际发生的要宽。

### 构建级：经验库

每个任务结束后，系统回看完整改进记录，用模型蒸馏出经验（<code>_distil</code><span class="ev code">selection.py:454-505</span>），只有“被执行对比支持”的才入库。库条目 = <b>完整 adopted harness 树</b> + 一份 <code>EXPERIENCE.md</code>（适用情形、经验、支持证据、置信度）<span class="ev code">library.py:128-150</span>。

下一个任务仍从共同的 H₀ 起手，但提议阶段会先看到库——按域组织的目录被拷进提议者上下文，模型被要求“先浏览 INDEX.md 再打开相关的”<span class="ev code">context.py:161-165</span>。注意设计上的取舍：<b>不是自动继承上一个任务的框架，而是通过“提议”选择性复用</b>。这一点直接回应了“任务特定编辑不迁移”。
<div class="sec-eyebrow">03 · 结果</div>

## 数字：三个基准，四种配置

主实验 = 2 个执行器（OpenCode / Codex）× 2 个冻结模型（Gemini 3.5 Flash / GLM-5），三个专业基准：WorkBuddy-Bench（Code/Web/Office 办公交付物）、JobBench（端到端专业工作任务）、LAB（法律，报 Partial 逐项标准通过率）。主表是 k=1，“+递归”是 k=5 并行。每次运行打乱任务顺序，报三次运行均值±标准差<sup>（§3.1）</sup>。编辑器默认是 OpenCode 下的 Claude Opus 4.8。

<table class="tbl">
  <thead><tr><th>配置</th><th>WorkBuddy-Bench 均分</th><th>JobBench</th><th>LAB Partial</th></tr></thead>
  <tbody>
    <tr><td class="nm">Gemini 3.5 Flash / OpenCode</td><td>72.4 → <b>77.5</b>（+5.1）</td><td>31.5 → <b>36.0</b>（+4.5）</td><td>79.9 → <b>81.9</b>（+2.0）</td></tr>
    <tr><td class="nm">Gemini 3.5 Flash / Codex</td><td>74.5 → <b>77.5</b>（+3.0）</td><td>33.9 → <b>35.3</b>（+1.4）</td><td>71.6 → <b>75.6</b>（+4.0）</td></tr>
    <tr><td class="nm">GLM-5 / OpenCode</td><td>64.2 → <b>75.7</b>（<span class="best">+11.5</span>）</td><td>20.6 → <b>24.2</b>（+3.6）</td><td>59.6 → <b>71.4</b>（<span class="best">+11.8</span>）</td></tr>
    <tr><td class="nm">GLM-5 / Codex</td><td>64.4 → <b>75.3</b>（+10.9）</td><td>23.6 → <b>24.8</b>（+1.2）</td><td>58.1 → <b>65.9</b>（+7.8）</td></tr>
  </tbody>
</table>
<p class="small" style="margin-top:10px">12 个“基准×配置”组合全部正向<sup>（表 1、表 2）</sup>。摘要里的三个头条数字——WB 最多 +11.5、JB +4.5、LAB +11.8pp——分别来自 GLM-5/OpenCode 的 WB、Gemini/OpenCode 的 JB、GLM-5/OpenCode 的 LAB。<b>它们是三篇不同的“最大值”，不是同一配置的三连击。</b></p>

<figure class="fig">
  <div class="figt">头条数字的另一面：同一张表里，检索基线追平了头条</div>
  <svg viewBox="0 0 960 300" role="img" aria-label="LAB GLM-5 OpenCode 各方法分数对比">
    <g font-family="IBM Plex Mono,monospace" font-size="10" fill="#827f76">
      <text x="0" y="14">LAB Partial 通过率 · GLM-5 / OpenCode · 论文表 2</text>
    </g>
    <line x1="150" y1="40" x2="150" y2="252" stroke="#292825"/>
    <line x1="150" y1="252" x2="930" y2="252" stroke="#292825"/>
    <g font-family="IBM Plex Mono,monospace" font-size="10" fill="#827f76">
      <text x="150" y="270">0</text><text x="330" y="270">25</text><text x="510" y="270">50</text><text x="690" y="270">75</text><text x="870" y="270">100</text>
    </g>
    <line x1="150" y1="70" x2="930" y2="70" stroke="#292825" stroke-dasharray="2 4"/>
    <g font-family="Noto Serif SC,serif" font-size="11" fill="#a3a097">
      <text x="142" y="74" text-anchor="end">基础 harness</text>
      <text x="142" y="122" text-anchor="end">ReasoningBank</text>
      <text x="142" y="170" text-anchor="end">Meta-Harness †</text>
      <text x="142" y="218" text-anchor="end">Harness² k=1</text>
    </g>
    <g>
      <rect x="150" y="52" width="527" height="20" rx="4" fill="#181816" stroke="#383632"/>
      <text x="687" y="67" fill="#a3a097" font-size="11" font-family="IBM Plex Mono,monospace">59.6</text>
      <rect x="150" y="100" width="635" height="20" rx="4" fill="#1f2a24" stroke="#2c3f33"/>
      <rect x="150" y="100" width="635" height="20" rx="4" fill="#88c49c" opacity=".22"/>
      <text x="795" y="115" fill="#88c49c" font-size="11" font-family="IBM Plex Mono,monospace">71.3</text>
      <rect x="150" y="148" width="534" height="20" rx="4" fill="#181816" stroke="#383632"/>
      <text x="694" y="163" fill="#a3a097" font-size="11" font-family="IBM Plex Mono,monospace">60.0</text>
      <rect x="150" y="196" width="635" height="20" rx="4" fill="#1f2a24" stroke="#2c3f33"/>
      <text x="795" y="211" fill="#88c49c" font-size="11" font-family="IBM Plex Mono,monospace">71.4</text>
    </g>
    <text x="795" y="238" fill="#88c49c" font-size="11" font-family="Noto Serif SC,serif">差 0.1</text>
  </svg>
  <p class="small" style="margin-top:12px">摘要的头条是“LAB 提高 11.8 个百分点”。但在同一张表里，<b>ReasoningBank——一个完全不改框架、只把过去轨迹里的策略检索回上下文的方法——拿到 71.3，与 Harness² 的 71.4 只差 0.1</b>。换句话说，这个 +11.8 里，几乎全部可以由“从空 harness 到有内容”解释，而不是由“递归优化”解释。这不是论文造假，是摘要的叙事选择：它报了最大值，没报对照组。（C3）</p>
</figure>

### 另外三组值得记的数字

**预算研究。** k 从 1 到 5，JobBench 的增益从 4.5 涨到 7.5，WorkBuddy-Bench 从 5.1 涨到 8.4<sup>（§4）</sup>；WB-Code 从 76.5 推到 80.8，Office 从 79.5 推到 83.4。两种递归形式随 k 单调改善，但 k=2 时 Code 上顺序高于并行——“并行更好”不是单调结论。

**消融。** 三个组件都有独立贡献<sup>（表 3）</sup>：去掉经验库 −3.1（WB）/ −1.8（JB）；去掉范围分工 −2.9 / −3.7；去掉组合 −1.6 / −1.9。“把编辑器按不变性/领域分工”在 JobBench 上影响最大。

**跨任务与跨基准迁移。** 用 k=5 积累的库，在不额外探测的情况下让后续构建在 Code/Web/Office 分别再涨 0.9/4.4/5.1 分；把 JobBench 的库搬到 WorkBuddy-Bench，三个域分别 +0.6/+0.5/+2.9<sup>（图 7）</sup>。排除每个任务自身的条目后仍有 +1.9/+1.7。这是全文最硬的第二层递归证据——它测的是“改进经验”本身，不是执行分数。

同一模型兼任编辑器与执行器（k=2）：从 GLM-5 到 Claude Opus 5 的五个模型全部上涨，Opus 5 在三基准 +3.3/+5.5/+3.0，GLM-5 在 LAB +13.7<sup>（图 8）</sup>。这套方法不依赖“找个更强的模型来改自己”。

<div class="note warnbox">
  <span class="lb">论文自己承认的两处失利</span>
  ① 12 个组合里，Codex 下 Gemini 3.5 Flash 的 LAB Partial 上，<b>Meta-Harness（76.5）领先 Harness²（75.6）</b>——离线搜索在这个格子里更强<sup>（§3.2）</sup>。② 图 7 的分析里，如果拿不到参考执行、候选探测和改进库，直接优化基础框架会让 Code 从 73.4 掉到 63.2、Web 从 69.9 掉到 65.0——<b>裸做 harness 优化是有害的</b>，递归 machinery 是安全装置，不是装饰。这两句比摘要诚实得多，也都写在了正文里。
</div>
<div class="sec-eyebrow">04 · 代码里的它</div>

## 翻完仓库之后的六个确认

这一节只写源码确认的事实，判断留给第 05 节。

**1. “改进框架”= 一个按域组织的目录。** 没有复杂的数据结构，就是 <code>&lt;run&gt;/&lt;mode&gt;/&lt;domain&gt;/harnesses/&lt;task&gt;/{harness/, EXPERIENCE.md}</code> 加一个 <code>INDEX.md</code><span class="ev code">library.py:16-23</span>。检索靠模型自己读目录——没有向量检索，没有相似度计算。

**2. 测试流中，库在持续吸收更早的测试任务。** 每个任务开跑前，库被裁剪为“只保留本域流中更早的任务”<span class="ev code">schedule.py:698-702</span>。也就是说一个域里第 2 个任务起，改进器就能看到同域更早任务的 adopted harness 和 lesson。更关键的是 <code>retain()</code> 会把不在当前任务流里的条目<b>直接删掉</b><span class="ev code">library.py:90-104</span>——“先在训练任务上学习、冻结库再考试”的工作流被这个删除机制堵死了。

**3. 基线的空，是字面意义的空。** OpenCode 基线的三个 always-on 组件在 v0 全是空文件，注释自述“v0 就是裸奔的 stock OpenCode run”<span class="ev code">harness_baseline_oc/systemprompt.md</span>；Codex 基线的 <code>AGENTS.md</code> 只有两行（“按任务文件夹里的说明执行，把交付物写到指定输出目录”）。基线清单同时声明 OpenCode 本身（CLI、工具实现、provider）是“冻结的基础设施”，且刻意不设 temperature 和步数上限，以对齐真实 run<span class="ev code">harness_baseline_oc/harness.yaml</span>。

**4. 污染防护做了很多，但网络敞口。** 代码侧能看到：任务材料里的评分标准在递给改进器前被 pop 掉<span class="ev code">lab.py:552-557</span>、三个基准都有 leak 路径硬校验、判分输出目录有 tripwire 扫描<span class="ev code">context.py:419-518</span>、WB 的 code 子集连交付物内容都不给改进器看（只给文件名）<span class="ev code">context.py:351-361</span>。但执行器侧：Codex 带 <code>--dangerously-bypass-approvals-and-sandbox</code> 运行<span class="ev code">codex.py:166</span>，网络无任何限制，官方文档把断网责任推给用户的 egress firewall<sup>（EXPERIMENTS.md）</sup>。

**5. 轨迹是全文进改进器上下文的。** <span class="ev code">context.py:25-26</span> 明写“full trajectory -- no prompt-budget truncation”。执行器联网下载的任何东西，都会流进改进证据；而 tripwire 只匹配 6 个判分标记串。污染不仅污染当次任务，还会被写进 <code>EXPERIENCE.md</code> 传播给同域后续任务。

**6. 判分三种口径并存。** WorkBuddy：code 子集是确定性 verifier，web 是 LLM judge，office 是 rubric<span class="ev code">workbuddy.py:84-110</span>；JobBench 调上游 LLM judge 逐条评分，有 <code>total_score</code> 时按权重加权，否则退化成数条数——代码自己警告两种度量相差约 20 分<span class="ev code">report.py:156-164</span>；LAB 的 judge 失败返回 None，从分母剔除、绝不当 0<sup>（BENCHMARKS.md）</sup>。换 judge 模型就是换测量。

<div class="sec-eyebrow">05 · 批判</div>

## 十二条，按严重程度排

<p class="lede">先说公平的话：这套代码的工程质量明显高于论文配套代码的平均水准——预算恒等式硬校验、判分失败不当零、k=1 噪声地板自曝、污染事件主动写进文档。下面的批判不是“它烂”，而是“读表和读摘要时要打的具体折扣”。</p>

  <div class="crit">
    <h3><span class="n">C1</span>「单步」的账单：基线 1 次 rollout，Harness² 是 4 次 + 4 个会话<span class="sev fatal">致命</span></h3>
    <p>摘要与主表的叙事是“a single Harness² step improves…”。但预算恒等式写着 k=1 时 <code>R = 4</code>、<code>P = 3</code><span class="ev code">ledger.py:26-33</span>：1 次基础 + 2 次候选 + 1 次最终 rollout，外加 INV/DOM/组合三个改进会话（编辑器是 Opus 4.8，比两个执行器都强）和 1 次不计账的反思会话。基线那一行是<b>每个任务 1 次 rollout</b>。</p>
    <p><b>为什么重要：</b>“单步”听上去是零成本的测试时技巧，实际是约 4–5 倍执行器算力 + 一整条编辑器算力。图 6 的计算—性能曲线确实把总 token 都算进去了（这点比多数论文诚实），但主表的叙事没有。</p>
    <div class="fix"><b>怎么补：</b>主表旁边直接标注“每任务 rollout 数与编辑器会话数”；或把基线的 best-of-4 也跑出来做同算力对照。</div>
    <div class="evwrap"><span class="ev code">ledger.py:26-33</span><span class="ev paper">图 6</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C2</span>基线是「裸奔」的：+11.5 分里有多少只是“写了一页系统提示词”？<span class="sev fatal">致命</span></h3>
    <p>OpenCode 基线的 systemprompt.md / guardrails.md / LongTermMEMORY.md 在 v0 全是空文件<sup>（harness_baseline_oc/）</sup>，Codex 基线是两行 AGENTS.md。而 GLM-5 / OpenCode 的 WB 增益是 +11.5——全部来自“从空 harness 到有 harness”的跳跃。</p>
    <p><b>为什么重要：</b>消融消掉了库、分工、组合，<b>唯独没有“空 harness vs 一份人手写的合格 harness”这一组</b>。读者无法从论文判断：递归优化到底贡献了多少，还是 merely 补上了一份任何工程师都能写的配置。C3 给出一个侧面答案：在 LAB 上，只检索不改框架的 ReasoningBank 就追平了。</p>
    <div class="fix"><b>怎么补：</b>加一个“手写一次性的合格 harness（一次性人工工程，不递归）”基线，把 +11.5 拆成“补基础”和“递归优化”两部分。</div>
    <div class="evwrap"><span class="ev code">harness_baseline_oc/*</span><span class="ev paper">表 1</span><span class="ev paper">表 2</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C3</span>头条增益与检索基线打平，摘要只讲了大的那个<span class="sev fatal">致命</span></h3>
    <p>表 2，GLM-5 / OpenCode 的 LAB：基础 59.6，ReasoningBank <b>71.3</b>，Meta-Harness 60.0，Harness Scaling 67.8，Harness² <b>71.4</b>。完全不改框架、只把过去轨迹里的策略检索回上下文的 ReasoningBank，与 Harness² 差 0.1。同一张表里 WorkBuddy-Bench 上 Harness²（77.5）对 ReasoningBank（73.4）领先 4.1——那里的增益是实的。</p>
    <p><b>为什么重要：</b>摘要报“LAB +11.8pp”时不提这个对照。两种故事在同一篇论文里并存：WB 型任务上递归优化真的赢过检索；LAB 这个头条格子里，它只是和检索打平。读者需要自己翻表 2 才能知道。</p>
    <div class="fix"><b>怎么补：</b>摘要里对每个头条数字注明最强对照基线；或在正文明说“LAB 上的增益与检索方法不可区分”。</div>
    <div class="evwrap"><span class="ev paper">表 2</span><span class="ev paper">摘要</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C4</span>「测试时未见」名不副实：库在考试过程中持续从更早的考题学习<span class="sev major">重要</span></h3>
    <p>论文的说法是任务“在运行框架设计阶段不可见，在测试时又是全新的”。但代码里：默认 <code>--split all</code>——不传划分文件时，全部任务既学习又被考试；即使 <code>--split test</code>，库在测试流进行中持续增长，每个任务开跑前只保留“本域流中更早的任务”<span class="ev code">schedule.py:698-702</span>；而 <code>retain()</code> 会删除不在当前流的条目<sup>（library.py:90-104）</sup>，“先训练后冻结考试”被主动堵死。</p>
    <p><b>为什么重要：</b>严格意义上的“未见”只剩每个域的第一个任务。这是 continual learning 的标准设定（在线适应本来就允许从历史任务学），但论文的措辞让读者以为每道题都是冷的。对“泛化到新任务”的主张，这是实质折扣。</p>
    <div class="fix"><b>怎么补：</b>把设定改述为“单遍在线适应，允许从同域更早任务学习”，并报告“每域首任务”与“后续任务”的增益差——后者才是泛化的证据。</div>
    <div class="evwrap"><span class="ev code">schedule.py:698-702</span><span class="ev code">library.py:90-104</span><span class="ev paper">§2.3</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C5</span>污染面真实存在，而且已经被触发过一次<span class="sev major">重要</span></h3>
    <p>官方文档白纸黑字：“三个基准都是公开的，JobBench 把每个任务的 <code>RUBRICS.json</code> 发布在 Hugging Face 上。在本 release 的一次验证运行中，<b>一个 Codex rollout 在未被指示的情况下下载了它任务的评分标准</b>”<sup>（EXPERIMENTS.md:95-99）</sup>。叠加条件：Codex 沙箱关闭<span class="ev code">codex.py:166</span>；JobBench 的 runner 提示词主动鼓励“需要时就上网搜参考资料”<span class="ev code">jb_opencode_runner.py:49</span>；release 不做任何网络限制，把断网推给用户的 egress firewall。</p>
    <p><b>为什么重要：</b>论文表格若产生于这种网络环境，JobBench 的 +4.5 归因存疑——模型理论上能在线拿到评分标准。即便发布表格时挡了网，release 也没有强制机制，第三方复现时默认裸奔。</p>
    <div class="fix"><b>怎么补：</b>把网络封锁做进代码（默认拒绝清单 + 环境探测），而不是写在文档里让用户自觉；报告结果时附上所用限制。</div>
    <div class="evwrap"><span class="ev code">codex.py:166</span><span class="ev code">jb_opencode_runner.py:49</span><span class="ev paper">EXPERIMENTS.md</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C6</span>k=1 时两种递归是同一个过程，论文只报了 k=1 和 k=5 两个点<span class="sev major">重要</span></h3>
    <p>代码的报告模块自己写：“k=1 时并行与顺序是同一套程序（一次 INV、一次 DOM、一次组合），两者之间的分差是 <b>NOISE FLOOR，不是结果</b>——k≥2 的效应必须先跨过它”<span class="ev code">report.py:122-131</span>。论文主表用 k=1、“+递归”用 k=5，中间的 k=2/3/4 只有图 5 的曲线；且 k=2 时 Code 上顺序高于并行<sup>（§4）</sup>。</p>
    <p><b>为什么重要：</b>“并行递归更好”不是单调结论，但摘要的语气是单向的。更重要的是：主表每个格子只有三次运行，标准差 1–4 分，而 k=1→5 的增益是 3–4 分——量级接近噪声地板上方一点点。</p>
    <div class="fix"><b>怎么补：</b>报 k=1..5 全序列的均值±标准差（每 k 三次运行），并明确跨过噪声地板的格子。</div>
    <div class="evwrap"><span class="ev code">report.py:122-131</span><span class="ev paper">图 5</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C7</span>选择池结构性排除基础框架：“改坏了选回来”这条退路不存在<span class="sev major">重要</span></h3>
    <p>k&gt;1 时的最终选择，选择池硬编码只含 k 个组合产物，注释原话：“参考执行不在池子里，<b>并且按构造不存在弃权</b>（no abstention by construction）”<span class="ev code">selection.py:93-111</span>。基础框架只有在选择器本身出错时经 fallback 才可能被选；报告模块甚至把 kept_base ≥ 80% 标为 WARNING<span class="ev code">report.py:141-147</span>。</p>
    <p><b>为什么重要：</b>方法在设计上几乎必须交付一个改编后的框架。如果所有候选都比基线差，系统也没有“回到基线”的出口——它会在 k 个坏框架里挑一个。这和论文“组合可以保留当前框架”的表述（KEEP_BASE）有落差：KEEP_BASE 是组合阶段的行为，不是选择阶段的权利。</p>
    <div class="fix"><b>怎么补：</b>把基线匿名放进选择池；或报告“选择器在全部 k 个候选都差时退回基线”的比例。</div>
    <div class="evwrap"><span class="ev code">selection.py:93-111</span><span class="ev code">report.py:141-147</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C8</span>判分口径跨基准不对称：同样“跑飞了”，两个基准两种算法<span class="sev major">重要</span></h3>
    <p>JobBench：没产出交付物 = 按 rubric 权重构造 0 分，<b>真 0 进分母</b><span class="ev code">jobbench.py:1044-1068</span>。LAB 和 WorkBuddy：judge 失败或 verifier 故障 = 返回 None，<b>从分母剔除</b><span class="ev code">lab.py:995-1002</span>。JobBench 因此系统性更严（或说对崩溃更惩罚）；加权与未加权两种口径还相差约 20 分<span class="ev code">report.py:156-164</span>。</p>
    <p><b>为什么重要：</b>三个基准的分数不能直接横向比——“+4.5 分（JB）vs +11.8pp（LAB）”里的“分”和“pp”背后是不同的失败处理。论文没有统一这个口径，也没有报各基准的剔除比例。</p>
    <div class="fix"><b>怎么补：</b>统一失败处理（都记 0 或都剔除，并报剔除率）；跨基准比较时用同一口径重算。</div>
    <div class="evwrap"><span class="ev code">jobbench.py:1044-1068</span><span class="ev code">lab.py:995-1002</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C9</span>探测是盲飞：候选“好坏”只看交付物在不在，n=1<span class="sev minor">值得知道</span></h3>
    <p>探测阶段唯一的程序化信号是 <code>delivered</code>——交付物是否存在这个布尔值<span class="ev code">recursion.py:283-287</span>；对错直到 judge 才第一次进入系统。组合提示词自己承认：“每个候选只有<b>一次</b> rollout，单个好坏结果是弱证据”<span class="ev code">prompts.py:922-924</span>。候选间的取舍实际由“轨迹可读性 + 交付物存在性”代理。</p>
    <p><b>为什么重要：</b>这是“无验证器”设定的必然代价，论文对此是诚实的（§2.2.1 明说行为对比不验证正确性）。但它意味着组合阶段的决策质量没有下限保证——一个痕迹更漂亮但实质更差的候选可能胜出。</p>
    <div class="fix"><b>怎么补：</b>每候选 2–3 次 rollout 再做对比；或至少在报告里给出“组合选错”的案例率。</div>
    <div class="evwrap"><span class="ev code">recursion.py:283-287</span><span class="ev code">prompts.py:922-924</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C10</span>「并行」只有两条道<span class="sev minor">值得知道</span></h3>
    <p><code>PHASE_WIDTH = 2</code> 与 <code>PROPOSER_CONCURRENCY = 2</code><span class="ev code">config.py:176,178</span>：提议与 rollout 的默认相位并发是 2。名为 parallel exploration，k=5 时墙钟收益远小于“并行”一词的暗示——论文自己也要补一句“实际延迟还取决于可用并发度”。</p>
    <div class="evwrap"><span class="ev code">config.py:176,178</span><span class="ev paper">§4</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C11</span>论文数字按官方声明不可复现<span class="ev code">值得知道</span></h3>
    <p>四条叠加：仓库不内置任务清单（“no bundled task lists”<span class="ev code">tasks.py:15</span>）；train/test 划分文件是“本地文件，不是 release 资产”；PINNED.md 直接声明“历史论文运行可能用过不同的任务、模型部署和额外的本地工具”<sup>（PINNED.md:40-42）</sup>；seed 只洗任务流顺序，<b>不控制模型采样</b><sup>（EXPERIMENTS.md:28）</sup>。加上换 judge 模型即换测量。</p>
    <p><b>为什么重要：</b>这不是指责——是官方主动声明的。但它意味着所有表格只能当“作者环境下的测量”读，任何第三方复现都是新实验，不是验证。</p>
    <div class="evwrap"><span class="ev code">tasks.py:15</span><span class="ev code">PINNED.md</span><span class="ev paper">EXPERIMENTS.md:28</span></div>
  </div>
  <div class="crit">
    <h3><span class="n">C12</span>经验库无去重、无上限，污染会沿库复利<span class="sev minor">值得知道</span></h3>
    <p>库对已积累条目没有任何 cap 或去重<span class="ev code">library.py:83-85</span>，域内任务越多，注入后续任务的 <code>context/library/</code> 越臃肿。而轨迹是全文进改进器上下文的<span class="ev code">context.py:25-26</span>：一次联网污染（如下载到 rubric）不仅污染当次，还会写进 EXPERIENCE.md 传播给同域后续任务；tripwire 只匹配 6 个标记串，覆盖不全。</p>
    <p><b>为什么重要：</b>代码对此有一处自曝式修补——某基准上“给文件正文曾经把判分器的通过率和失败项名一起喂了进去”，现在的对策是只给文件名<span class="ev code">context.py:351-361</span>。诚实，但也说明泄漏是工程漏洞而非天然免疫，堵洞是持久战。</p>
    <div class="evwrap"><span class="ev code">library.py:83-85</span><span class="ev code">context.py:351-361</span></div>
  </div>
<div class="sec-eyebrow">06 · 对照</div>

## 和 RSIGym 比，差在哪

两篇都在讲“让智能体自己改自己”，但改的东西、判断依据、失败模式完全不同：

<table class="tbl">
  <thead><tr><th></th><th>RSIGym</th><th>Harness²</th></tr></thead>
  <tbody>
    <tr><td class="nm">改什么</td><td>数据 + 训练配方 + 执行框架（三条赛道）</td><td>只改执行框架的 8 个文件组件</td></tr>
    <tr><td class="nm">判断依据</td><td>官方基准分（开发期可反复自评）</td><td>没有验证器，只比行为差异；分数只在选完后由 judge 给</td></tr>
    <tr><td class="nm">递归层级</td><td>单轮：一次运行、一次提交</td><td>两层：任务内改框架，任务间改“怎么改”</td></tr>
    <tr><td class="nm">证据强度</td><td>有分数，但开发集=测试集、每格只跑一次</td><td>分数干净（无泄漏进方法），但基线空、单步算力差 4–5×、污染靠自觉</td></tr>
    <tr><td class="nm">公开程度</td><td>18 条轨迹可逐步翻</td><td>无公开轨迹，代码自曝是唯一深挖渠道</td></tr>
    <tr><td class="nm">单步算力</td><td>$500 平台预算（真实花费 $5,960/18 次）</td><td>4 次 rollout + 3 个改进会话 + 1 次反思（k=1）</td></tr>
  </tbody>
</table>

一句话对照：<b>RSIGym 用“能测量的分数”换来了一个结构性问题（开发集就是测试集）；Harness² 用“测得没那么准的行为对比”换来了一个更干净的设定（真的没有答案）——但它的基线和算力账单没那么干净。</b>两篇合起来读，正好看出 RSI 评测生态的系统性困难：有分数的一方污染了泛化，没分数的一方说不清增益归谁。

<div class="sec-eyebrow">07 · 判断</div>

## 我的判断

1. **它把“没有验证器”当成一等问题，方向是对的。** 而且代码用结构（RunView 不带分数、score 只在 judge）把这个原则物理化了，不是写在论文里的君子协定。这比大多数“自我改进”工作诚实。
2. **第二层递归的证据是实的，第一层的要拆开看。** 库的跨任务/跨基准迁移（图 7，含排除自身条目的回顾性对照）是全文最硬的证据——它测的是“改进经验”本身。而任务级的 +11.5 更像“harness 从裸奔到合格”的一级跳：同一个格子里只检索不改框架的 ReasoningBank 就追平了（C3）。负责任的说法是：<b>递归优化在 WB 型任务上赢过检索，在 LAB 这个头条格子里没有。</b>
3. **工程诚实度高于平均。** 噪声地板自曝、污染事件主动写进文档、PINNED 声明不可复现、判分失败不当零——这些通常是论文隐藏、代码里也不写的东西。一个愿意自曝的仓库，比一个漂亮的摘要更值得信任。
4. **如果要 adopt，我会分基准对待。** WB 型（交付物明确、有确定性 verifier）最值得试——那里增益是真的且对照干净；JB 型先断网再跑，否则 +4.5 说不清；LAB 型干脆和 ReasoningBank 一起跑，因为增量可能只有 +0.1。
5. **留给下一篇的问题。** 这套方法的天花板取决于“行为对比”能承载多少信息——n=1 rollout、只看交付物在不在。如果候选证据能提到每候选 2–3 次 rollout 加轨迹自动评分（仍无 ground truth），组合阶段的质量可能有质变。这是代码留下的最明显的改进口。

## 遗留待核

- [ ] 论文附录 E 的失败分析与组件复用细节（只读了正文）
- [ ] 图 5 / 6 / 7 / 8 的原始数据不在仓库里，曲线只能引论文
- [ ] JobBench / WorkBuddy 任务总数随下载版本浮动，无法核对论文的确切任务量
- [ ] 无公开运行轨迹——无法像 RSIGym 那样翻步级证据，第 05 节全部批判均止于代码与文档
- [ ] 编辑器默认模型（Opus 4.8）之外的配置未在论文主表出现

<hr class="sep" style="border:0;border-top:1px solid var(--line);margin:48px 0 0">

<p class="small" style="margin-top:20px">
  论文原文：<a href="https://harness2.github.io/" target="_blank">harness2.github.io</a> ·
  代码：<a href="https://github.com/google-research/harness2" target="_blank">google-research/harness2</a>（Apache 2.0，分析基于 2026-10-25 的 main 分支）<br>
  本文为独立评述，非官方解读；数字引自论文表格，代码结论均带文件行号，可自行核对。
</p>
