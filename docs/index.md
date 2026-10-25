---
layout: page
title: RSI Atlas · 递归自我改进图谱
description: 把「AI 改进 AI」拆成可以核对的部分：论文、源码与真实轨迹的三方对照。
---

<div class="home">
<div class="home-hero">
<div class="home-kicker">RSI Atlas · 递归自我改进图谱</div>
<h1>把「AI 改进 AI」<br><span>拆成可以核对的部分</span></h1>
<p class="sub">
「递归自我改进」是个很响的词，但每篇论文说的其实是不同的东西：有的改数据，有的改执行框架，有的改改进流程本身。这个站点逐个收录它们，用同三把尺子量：<b>论文说了什么、代码怎么做的、真实运行留下了什么</b>。
</p>
<div class="home-actions">
<a class="btn primary" href="./works/rsigym.html">从 RSIGym 读起 →</a>
<a class="btn" href="./compare/">看横向对比</a>
<a class="btn" href="./explore/rsigym.html" target="_blank">打开轨迹浏览器 ↗</a>
</div>
<div class="home-stats">
<div class="s"><div class="k">已收录</div><div class="v">2</div><div class="d">1 篇深读 · 1 篇导读</div></div>
<div class="s"><div class="k">轨迹步数</div><div class="v">7,098</div><div class="d">18 次运行 · 8,392 次工具调用</div></div>
<div class="s"><div class="k">批判条目</div><div class="v">13</div><div class="d">每条标注证据来源</div></div>
<div class="s"><div class="k">证据维度</div><div class="v">3</div><div class="d">论文 / 源码 / 轨迹</div></div>
</div>
</div>

<section class="home-sec">
<div class="home-sec-h"><h2>收录</h2><p>每篇都尽量读到底：论文、仓库、运行记录</p></div>
<div class="works">
<a class="work" href="./works/rsigym.html">
<div class="top"><span class="badge">深读</span><span>arXiv 2610.10310</span><span>2026-10</span></div>
<h3>RSIGym</h3>
<p>把训练、推理、采样、评测、沙箱包成带预算的微服务，让研究智能体自己改数据、改配方、改执行框架。一句话结论：想法漂亮，证据链比摘要薄。</p>
<div class="go">读全文 · 约 18 分钟 →</div>
</a>
<a class="work" href="./works/harness2.html">
<div class="top"><span class="badge">导读</span><span>Google Research / 西北大学</span><span>2026-10</span></div>
<h3>Harness²</h3>
<p>不改模型权重，只改模型外面那层运行框架；没有验证器时，用「提议—探测—组合」的对比证据来指导编辑，并把改进经验沉淀成库供下一个任务复用。</p>
<div class="go">读导读 · 约 8 分钟 →</div>
</a>
</div>
</section>

<section class="home-sec">
<div class="home-sec-h"><h2>三把尺子</h2><p>为什么同一个结论要看三遍</p></div>
<div class="axis">
<div><h4>论文说</h4><p>作者的叙事与结论。先信，但记住哪些是断言、哪些是测量——两者的分量完全不同。</p></div>
<div><h4>代码做</h4><p>仓库里的真实约束：什么被锁死、什么能改、评测怎么跑、计费怎么算。论文写不下的都在这里。</p></div>
<div><h4>轨迹露</h4><p>运行留下的逐步记录。它会暴露论文不会写的部分：时间花在哪、失败多少次、自评和官方差多少。</p></div>
</div>
</section>

<section class="home-sec">
<div class="home-sec-h"><h2>对比</h2><p>同一个词，不同的实验对象</p></div>
<p style="margin-top:18px;font-size:15px;line-height:1.9;color:var(--muted);max-width:720px">
RSI 不是一个单一的方法，而是一族主张。对比页按「改什么 / 怎么判断好坏 / 递归到哪一层 / 能不能复现」四件事，把收录的工作摆在同一条轴上。
</p>
<div class="home-actions" style="margin-top:22px">
<a class="btn" href="./compare/">打开对比矩阵 →</a>
<a class="btn" href="./method">先看分析方法</a>
</div>
</section>

<div class="home-foot">
独立评述，非官方文档。原始论文、代码与数据的版权归各作者所有；站点内容为分析文本，引用处均标注来源。
</div>
</div>
