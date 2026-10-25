import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'RSI Atlas',
  description: '递归自我改进（RSI）的图谱：把每个工作拆成论文、源码与轨迹三部分来核对。',
  base: '/rsi-atlas/',
  appearance: 'force-dark',
  lastUpdated: false,

  head: [
    ['meta', { name: 'theme-color', content: '#121211' }],
    ['meta', { property: 'og:title', content: 'RSI Atlas · 递归自我改进图谱' }],
    ['meta', { property: 'og:description', content: '把「AI 改进 AI」拆成可以核对的部分：论文、源码与真实轨迹的三方对照。' }],
  ],

  markdown: {
    // 文章里保留了较多原始 HTML（图表、批判卡片）
    html: true,
  },

  themeConfig: {
    nav: [
      { text: '收录', link: '/works/' },
      { text: '对比', link: '/compare/' },
      { text: '方法', link: '/method' },
      { text: '关于', link: '/about' },
      {
        text: '工具',
        items: [
          { text: 'RSIGym 轨迹浏览器', link: '/explore/rsigym.html', target: '_blank' },
          { text: 'RSIGym 原文（arXiv）', link: 'https://arxiv.org/abs/2610.10310' },
          { text: 'Harness² 代码', link: 'https://github.com/google-research/harness2' },
        ],
      },
    ],

    sidebar: {
      '/works/': [
        {
          text: '收录',
          items: [
            { text: '总览', link: '/works/' },
            { text: 'RSIGym · 深读', link: '/works/rsigym' },
            { text: 'Harness² · 深读', link: '/works/harness2' },
          ],
        },
        {
          text: '相关',
          items: [
            { text: '横向对比', link: '/compare/' },
            { text: '分析方法', link: '/method' },
          ],
        },
      ],
    },

    outline: { level: [2, 3], label: '本页目录' },
    search: { provider: 'local' },

    socialLinks: [{ icon: 'github', link: 'https://github.com/CaiZongyuan/rsi-atlas' }],

    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',

    footer: {
      message: '独立评述 · 非官方文档 · 原始论文与代码版权归各作者所有',
      copyright: 'Built with VitePress',
    },
  },
})
