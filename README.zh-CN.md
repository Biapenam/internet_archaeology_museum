# Internet Archaeology Museum（互联网考古博物馆）

[English](README.md) · [简体中文](README.zh-CN.md)

> 像走进博物馆一样，探索互联网的历史。

Internet Archaeology Museum 是一个开源、静态优先的互联网历史体验。从 1990 年一路漫游到 2026 年，拖动时间轴，打开展品档案，沿着浏览器、平台、硬件、软件和网络文化之间的联系自由探索。

它不是一个传统的互联网百科，而是一座可以随便逛的数字博物馆。

## 功能

- 1990–2026 时间轴，包含 16 个档案节点，支持直接选年、键盘操作和逐档案节点播放
- 8 个互联网时代：早期网页、浏览器大战、泡沫之后、Web 2.0、移动互联网、平台时代、疫情互联网、AI 互联网
- 155 件互联网展品，每个展品都有简短的历史说明和“它为何重要”
- 中英文统一检索，支持微信、百度、淘宝等常用名称与别名，并提供键盘选择和无结果反馈
- 分开“全馆随机”和“当前档案随机”；“历史上的今天”区分确切日期与推荐节点
- 桌面、平板和手机响应式布局
- 键盘导航、可见焦点状态、语义化控件和减少动画支持
- 不伪造真实网站历史截图；卡片使用符号和文字
- 页面内中英文切换，语言偏好会保存在浏览器本地
- 全馆分类、地区标签、年代和关键词筛选，并为较长目录提供分批加载
- 支持分享年份、展品、目录筛选与比较配置（例如 `?year=2005&exhibit=youtube`）
- 浏览器本地收藏与带展品 ID 的纠错入口
- 每个时代都有博物馆展厅，并提供分类浏览、历史事件、互联网关系图、互联网堆栈和过去 vs 现在对比
- 深色 / 浅色主题，并默认跟随系统偏好
- 展品档案包含关系链接、实体时间线、来源链接和 Wayback Machine 入口

## 截图

首页第一屏先介绍博物馆，并提供时间轴、全馆目录和 Windows 95 展品的直接入口；时间轴与年份概况位于下方。未单独建档的年份会明确标注所参考的较早档案。历史用户数显示 ITU 或世界银行来源、统计口径和核验日期；部分展品状态和地区仍待逐条来源核验。

## 技术栈

- React + TypeScript
- Vite
- CSS custom properties 与响应式 CSS
- Lucide icons

## 项目结构

```text
src/
  App.tsx       # 展厅布局和交互
  data.ts       # 时代、时间节点和展品数据
  i18n.ts       # 中英文文案和本地化数据
  extraEntities.ts # 扩展后的全球展品目录
  types.ts      # 共享数据类型
  styles.css    # 视觉系统、响应式布局和动画规则
public/
  favicon.svg
```

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run verify:data
npm run verify:runtime
npm run verify:dist
```

## 使用 npx 启动

运行已发布到 npm 的安装包（需要 Node.js 20.19+）：

```bash
npx --yes internet-archaeology-museum
```

也可以直接从公开的 GitHub 仓库运行（需要 Git）：

```bash
npx --yes --package=github:Biapenam/internet_archaeology_museum internet-archaeology-museum
```

从 GitHub 安装时会自动构建网页。也可以先生成本地 npm 安装包，再从安装包启动：

```bash
npm pack
npx --yes --package ./internet-archaeology-museum-0.1.0.tgz internet-archaeology-museum
```

命令会在 `http://127.0.0.1:4173/` 启动本地服务并打开浏览器；可用 `--port 4182` 指定端口，或用 `--no-open` 仅启动服务。按 Ctrl+C 停止。

`dist/` 是可以直接发布的静态产物。Vite 使用相对资源路径，因此既能部署在域名根路径，也能部署在 GitHub Pages 这类项目子路径下。把 `dist/` 目录内容上传到 GitHub Pages、Vercel、Netlify 或 Cloudflare Pages 即可，不需要服务器进程。本仓库维护者没有执行外部部署，因此没有可提供的线上演示 URL。项目使用 hash 导航，不需要额外配置 SPA 重写；静态主机只需按常规返回根目录的 `index.html`。

## 数据来源

历史资料直接保存在 `src/data.ts` 和 `src/extraEntities.ts`，不依赖 API。`src/userStatistics.ts` 为每个档案节点记录 ITU 估算或世界银行互联网使用率 × 同年人口的四舍五入计算，并标明观察年份、方法、来源和核验日期；2026 节点展示 ITU 的 2025 年估算。展品链接指向官方网站或 Wikipedia 参考页面；许多展品状态与地区字段仍需逐条核对原始来源。视觉语言是博物馆式重构，不代表任何产品的官方历史截图。外部来源链接可能独立变化。

欢迎提交日期、来源、地区背景、无障碍和文字方面的改进。重要历史事实请尽量附上来源链接，并保持展品说明简洁。

## 架构

博物馆采用静态优先架构。时间节点、时代、事件、关系和 155 件展品都保存在带类型的数据模块中，React 组件负责展厅界面和交互。不需要数据库、登录、API key 或运行时服务，可以直接部署到 GitHub Pages、Vercel、Netlify 或 Cloudflare Pages。目录包含北美、欧洲、中国、日本、韩国、印度以及全球互联网文化，同时保留不同地区生态各自的发展路径。

## 推荐浏览路径

进入博物馆，拖动时间轴到一个关键年份，打开展品，沿着相关展品继续探索，然后使用互联网关系图或过去 vs 现在进行比较。项目保持单页静态体验，让陌生用户可以直接开始漫游。

## Roadmap

当前版本已经完成完整的可探索档案。未来可以继续补充经过核验的地区来源、历史事件引用和可选地图展厅，同时保持静态优先核心不变。

## License

MIT，详见 [LICENSE](LICENSE)。
