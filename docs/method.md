---
title: 分析方法
description: 为什么每篇都要读三遍——论文、源码、轨迹——以及每类证据能支撑什么结论。
---

<div class="doc-back"><a href="../index.html">← 回到首页</a></div>

# 分析方法

同一篇论文，读法不同，得到的结论可以完全相反。这个站点固定用三种证据交叉验证，并给每条结论打上来源标记。

## 三把尺子

<div class="tracks">
  <div class="track">
    <h4>论文</h4><div class="who">WHAT THEY CLAIM</div>
    <ul>
      <li><span>能回答</span><span>动机、方法、主张</span></li>
      <li><span>弱点</span><span>只能看到作者想让你看的</span></li>
    </ul>
  </div>
  <div class="track">
    <h4>源码</h4><div class="who">HOW IT ACTUALLY WORKS</div>
    <ul>
      <li><span>能回答</span><span>约束、计费、评测协议</span></li>
      <li><span>弱点</span><span>读起来慢，且不一定最新</span></li>
    </ul>
  </div>
  <div class="track">
    <h4>轨迹</h4><div class="who">WHAT REALLY HAPPENED</div>
    <ul>
      <li><span>能回答</span><span>时间去哪、失败多少次</span></li>
      <li><span>弱点</span><span>不是每个工作都公开</span></li>
    </ul>
  </div>
</div>

三者能互相证伪的地方，才是最有信息量的地方。举两个已经收录的例子：

- 论文说“预算是一个研究约束”，但轨迹里的 `/v1/balance` 显示 18 次运行没有一次用完额度——**约束从未生效**。
- 论文说“智能体能自我改进”，但源码里 Harness 赛道换了一个更强的目标模型——**对照组不是同一个起点**。

## 证据标记

文章里每个关键结论后面都会跟一个标记：

<div class="evwrap" style="margin-top:18px">
  <span class="ev paper">论文</span><span>原文可直接查到的段落、表格或图注</span>
</div>
<div class="evwrap">
  <span class="ev code">源码</span><span>GitHub 仓库里的文件与行号</span>
</div>
<div class="evwrap">
  <span class="ev traj">轨迹</span><span>公开运行记录里可复算的数字</span>
</div>

没有标记的句子，通常是我的判断，会在上下文里写明“我认为”“这说明”。

## 数字怎么复算

凡是站点里出现、而论文没有直接给出的数字，都会尽量给出可重跑的路径：

- RSI-Index 的分项与均值：由论文表 2 的分数按定义复算，误差 &lt; 0.0001。
- 任务级标准误：按二项分布估算，只作为“噪声上界”，不假设同一任务的多次尝试相关。
- 轨迹统计（步数、token、时间去向、自评分）：脚本在仓库的 `analysis/` 目录，输入是公开的 18 个 JSON。

<details>
<summary>为什么标准误要按“任务”而不是“trial”算？</summary>
<div class="body">
同一道题的三次尝试高度相关——它们共享题目、共享模型、共享评分器。把 300 次 trial 当成 300 个独立样本，会把误差算小一半以上。
所以这里按任务数（60 / 89 / 100 / 37）估标准误，得到的区间更宽、更保守。
</div>
</details>

## 已知局限

1. **只看得到公开的那部分。** RSIGym 公开了 42 次实验里的 18 次（part-01），Sol 6 / Sol 6.1 的全部运行、所有 $1000 预算实验、Data / Harness 赛道都不在本地，因此无法复算完整主表。
2. **轨迹本身可能被裁剪。** 公开 JSON 是整理后的结构化记录，原始 CLI 日志只是其中一部分；我看到的“全流程”未必是全部。
3. **判断有立场。** 我的默认假设是“结论需要证据支撑”，这会让评述偏严格；如果你觉得某条批判过重，欢迎带着反例来讨论。
4. **时间有限。** 每篇的核验深度不同，会在文章开头明确标出（深读 / 导读 / 仅提名）。

## 怎么引用

如果你要引用本站的某个结论，请连同证据类型一起引，例如：

> RSIGym 的 18 次运行中平台实际扣费合计约 $5,960，而公开 JSON 里的 `total_cost_usd` 合计仅 $1,113（轨迹证据，复算见 analysis/costs.json）。

单独引用“$5,960”而不说明它来自轨迹里的余额响应，会让人误以为是论文数字。
