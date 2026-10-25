---
title: 横向对比
description: 按「改什么 / 怎么判断 / 递归到哪一层 / 能不能复现」四个维度，把 RSI 工作摆在同一条轴上。
---

<div class="doc-back"><a href="../index.html">← 回到首页</a></div>

# 横向对比

「递归自我改进」不是一个方法，而是一族主张。把它们放进同一张表，最有用的问题不是“谁分数高”，而是：**它改的是哪一层？判断好坏的信号从哪来？这个信号能撑起它的结论吗？**

## 已核验

<div class="tbl wrap">
<table>
<thead><tr><th>维度</th><th>RSIGym</th><th>Harness²</th></tr></thead>
<tbody>
<tr><td class="nm">出处</td><td>arXiv 2610.10310</td><td>Google Cloud AI Research / 西北大学</td></tr>
<tr><td class="nm">改什么</td><td>数据 + 训练配方 + 执行框架</td><td>只改执行框架（8 个组件文件）</td></tr>
<tr><td class="nm">自由度</td><td>三条赛道切换权限（Data / Harness / Joint）</td><td>单一自由度：框架组件</td></tr>
<tr><td class="nm">递归层级</td><td>单轮：一次运行、一次提交</td><td>两层：任务级 + 构建级</td></tr>
<tr><td class="nm">判断信号</td><td>官方基准分（开发期可用同一批题自评）</td><td>行为对比（无验证器）</td></tr>
<tr><td class="nm">评测</td><td>SWE-V / TB2 / AIME / GPQA / Skills，5 基准 × 6 模型</td><td>WorkBuddy-Bench / JobBench / LAB，4 种模型×框架配置</td></tr>
<tr><td class="nm">成本口径</td><td>平台计费，$500/次（评测与沙箱不计费）</td><td>总 token（执行 + 改进都计入）</td></tr>
<tr><td class="nm">产物</td><td>代码 ✓ · 轨迹 ✓（18/42）</td><td>代码 ✓ · 轨迹未见公开</td></tr>
<tr><td class="nm">主要局限</td><td>开发集 = 测试集；每格只跑一次</td><td>行为信号较弱；只有论文一级核验</td></tr>
</tbody>
</table>
</div>

<p class="small" style="margin-top:12px">「已核验」指我读过论文与仓库；RSIGym 还额外读了 18 条轨迹。两篇现在都到源码一级；Harness² 无公开轨迹，代码自曝是唯一深挖渠道。</p>

## 怎么读

**先看「判断信号」这一行。** 它决定了结论的天花板：

- 用**官方基准分**（RSIGym）：信号强、可比，但如果允许在同一批题上反复挑，分数会结构性偏高。
- 用**行为对比**（Harness²）：更接近真实部署（真的没有答案），但只能证明“行为变了”，证明不了“变得更对”。

**再看「递归层级」。** 只有真的把上一轮的修改带进下一轮，才谈得上“递归”；只跑一次、提交一次，那是“单轮自动研究”，不是 RSI。目前这两篇里，只有 Harness² 明确实现了第二层。

**最后看「产物」。** 数字能不能复核，取决于代码、数据和评测清单是否公开。

## 提名：尚未核验

下面这些出现在上述两篇的相关工作里，我暂时只按论文转述，**没有独立核验**。列在这里是为了标出对比轴的完整形状，不代表结论。

<div class="tbl wrap">
<table>
<thead><tr><th>工作</th><th>改什么</th><th>问题设定</th></tr></thead>
<tbody>
<tr><td class="nm">PostTrainBench</td><td>训练全流程</td><td>只给一块 H100 和互联网，初始代码、数据、超参都要自己搭</td></tr>
<tr><td class="nm">AutoHarnessBench</td><td>执行框架</td><td>冻结模型权重，只搜索框架；带公开反馈与留出评测</td></tr>
<tr><td class="nm">RSIBench-Data</td><td>训练数据</td><td>固定训练与评测栈，只改数据策略</td></tr>
<tr><td class="nm">Meta-Harness</td><td>执行框架</td><td>在一批训练任务上离线搜索框架代码，再部署最佳方案</td></tr>
<tr><td class="nm">ReasoningBank</td><td>上下文策略</td><td>框架固定，只把历史轨迹提炼成策略检索回上下文</td></tr>
<tr><td class="nm">Harness Scaling</td><td>执行框架</td><td>给每个测试实例额外预算改框架，实例之间不传状态</td></tr>
</tbody>
</table>
</div>

<p class="small" style="margin-top:12px">以上信息全部转述自 RSIGym 与 Harness² 的相关工作段落。如果你读过原文并发现转述有误，欢迎<a href="https://github.com/CaiZongyuan/rsi-atlas/issues">提 issue</a>。</p>

## 一句话总结

- **RSIGym** 证明了：在受限预算内，前沿研究智能体能把一个小模型在单一基准上推高很多，而且可复现地发生了很多次。它没证明：这套系统具备递归能力，或联合优化优于单独优化。
- **Harness²** 证明了：在没有验证器的开放世界里，只改框架也能稳定涨分，且改进经验可以跨任务复用。它还没证明：行为对比在更大任务分布上依然可靠。
