# RSI Atlas

> 递归自我改进（RSI）的图谱：把「AI 改进 AI」拆成可以核对的部分。

在线站点：**https://caizongyuan.github.io/rsi-atlas/**

一个关于 RSI 的独立阅读站。每收录一个工作，就用三种证据交叉核对：**论文说了什么、代码怎么做的、真实运行留下了什么**。

## 已收录

| 工作 | 深度 | 证据 |
|---|---|---|
| **RSIGym**（arXiv 2610.10310） | 深读 | 论文 ✓ 源码 ✓ 18 条轨迹 ✓ |
| **Harness²**（Google Research / 西北大学） | 导读 | 论文 ✓ 源码 待核 |

## 站点结构

```
docs/
├── index.md              首页
├── works/
│   ├── index.md          收录总览
│   ├── rsigym.md         RSIGym 深读（8 章 · 13 条批判）
│   └── harness2.md       Harness² 导读
├── compare/index.md      横向对比矩阵
├── method.md             分析方法（三把尺子 + 证据标记）
├── about.md              关于 / 更新日志 / 许可
└── public/
    ├── explore/rsigym.html  轨迹浏览器（独立页，按需加载数据）
    └── data/rsigym.json.gz  18 次运行的精简轨迹（4.5MB，gzip）
```

## 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:5173/rsi-atlas/
pnpm build    # 产物在 docs/.vitepress/dist
pnpm preview
```

需要 Node 22+ 与 pnpm 11。

## 新增一篇收录

1. 在 `docs/works/` 下新建 `<name>.md`，frontmatter 写 `title` 与 `description`；
2. 正文用 `##` / `###` 组织章节（右侧目录会自动生成）；
3. 结论处标注证据类型：`<span class="ev paper">论文</span>` / `<span class="ev code">源码</span>` / `<span class="ev traj">轨迹</span>`；
4. 在 `docs/.vitepress/config.mts` 的 sidebar 与 `docs/works/index.md` 里加条目。

可复用的样式类：`.fig`（图表容器）、`.note` / `.note.warnbox`（提示框）、`.crit` + `.sev`（批判卡片）、`.evwrap`、`.tbl`、`.tracks`、`.two-col`、`pre.code`、`.hstats`。

## 部署

推送到 `main` 触发 `.github/workflows/deploy.yml`：pnpm 构建 → 上传 artifact → 部署到 GitHub Pages。

> 注意：`config.mts` 里的 `base` 是 `/rsi-atlas/`。如果改仓库名，这里要同步改。

## 数据来源与许可

- 论文、代码、轨迹的版权归各自作者所有；
- RSIGym 代码仓库为 CC BY-NC 4.0，本站为非商业性评述；
- 站点文本采用 CC BY-NC 4.0。

引用本站结论时，请连同证据类型一起引（论文 / 源码 / 轨迹），原因见[分析方法](https://caizongyuan.github.io/rsi-atlas/method)。
