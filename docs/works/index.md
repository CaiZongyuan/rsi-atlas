---
title: 收录
description: RSI Atlas 收录的所有工作：每篇都按论文、源码、轨迹三个维度核对。
---

<div class="doc-back"><a href="../index.html">← 回到首页</a></div>

# 收录

同一个词，不同的实验对象。这里的每一篇都尽量读到底：论文说了什么、代码怎么做的、真实运行留下了什么。

<div class="works" style="margin-top:34px">
  <a class="work" href="./rsigym.html">
    <div class="top"><span class="badge">深读</span><span>RSIGym</span><span>arXiv 2610.10310</span></div>
    <h3>RSIGym</h3>
    <p>把训练、推理、采样、评测、沙箱包成带预算与权限的微服务，让研究智能体自己改数据、改配方、改执行框架。三条赛道（Data / Harness / Joint）× 五个基准 × 六个前沿模型。</p>
    <div class="go">论文 ✓ · 源码 ✓ · 18 条轨迹 ✓　→</div>
  </a>
  <a class="work" href="./harness2.html">
    <div class="top"><span class="badge">深读</span><span>Harness²</span><span>Google Research / 西北大学</span></div>
    <h3>Harness²</h3>
    <p>不改模型权重，只改模型外面那层运行框架。没有验证器时，用「提议—探测—组合」产生的行为对比来指导编辑；再把改进过程本身沉淀成经验库，供下一个任务复用。</p>
    <div class="go">论文 ✓ · 源码 ✓（12 条批判）　→</div>
  </a>
</div>

## 收录标准

不是所有叫 RSI 的工作都值得放进同一个列表。这里收的条件是：**它明确改了系统的某一层，并且给出了可核对的证据**（分数、代码或运行记录），而不只是一个架构主张。

按「改什么」分类，目前收录的两篇恰好落在两端：

| | RSIGym | Harness² |
|---|---|---|
| 改的那一层 | 数据 + 训练配方 + 执行框架 | 只改执行框架（8 个组件） |
| 递归层级 | 单轮（跨周期未测） | 两层（任务级 + 构建级） |
| 反馈来源 | 官方基准分（开发期可自评） | 无验证器，靠行为对比 |

## 正在读

下面这些在对比页里有条目，但还没有单独成篇。它们大多出现在上述两篇的相关工作里，我暂时只按论文转述，**未做独立核验**：

- **PostTrainBench** — 给智能体一块 H100 和互联网，让它自己搭训练流水线。
- **AutoHarnessBench** — 冻结模型权重，只搜索执行框架。
- **RSIBench-Data** — 固定训练栈，只改训练数据。
- **Meta-Harness** — 在一批训练任务上离线搜索执行框架代码，再部署最佳方案。
- **ReasoningBank** — 固定执行框架，把历史轨迹里提炼的策略检索回上下文。
- **Harness Scaling** — 给每个测试实例额外预算去改框架，但不在实例之间传递状态。

如果你觉得有该收的，欢迎在 [GitHub](https://github.com/CaiZongyuan/rsi-atlas/issues) 提 issue。
