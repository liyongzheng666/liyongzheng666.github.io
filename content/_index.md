---
title: Ally 的个人博客
layout: hextra-home
---

{{< rawhtml >}}
<style>
  .home-editorial {
    max-width: 940px;
    margin: 0 auto 4.5rem;
  }

  /* ---------- Masthead / Hero ---------- */
  .home-masthead {
    padding: 1rem 0 1rem;
    margin-bottom: 1.5rem;
  }

  .home-eyebrow {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #0f766e;
  }

  .home-title {
    margin: 0.7rem 0 0;
    font-size: clamp(2.4rem, 6vw, 4.4rem);
    line-height: 1.04;
    letter-spacing: -0.01em;
    font-weight: 700;
    color: #111827;
  }

  .home-lead {
    max-width: 640px;
    margin: 1.1rem 0 0;
    font-size: 1.05rem;
    line-height: 1.78;
    color: #52606d;
  }

  .home-hero-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.4rem;
    margin-top: 1.6rem;
    font-size: 0.98rem;
  }

  .home-hero-links a {
    text-decoration: none;
    color: #64748b;
    font-weight: 600;
    transition: color 160ms ease;
  }

  .home-hero-links a:hover {
    color: #0f766e;
  }

  .home-hero-links a.home-cta {
    color: #0f766e;
  }

  .home-hero-links a.home-cta:hover {
    color: #115e59;
  }

  /* ---------- Section label ---------- */
  .home-section {
    margin-top: 3.4rem;
  }

  .home-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1.4rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  }

  .home-section-label {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0f766e;
    font-weight: 700;
  }

  .home-more {
    text-decoration: none;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: color 160ms ease;
  }

  .home-more:hover {
    color: #0f766e;
  }

  /* ---------- Focus card ---------- */
  .focus-card {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
    gap: 0;
    overflow: hidden;
    text-decoration: none;
    border: 1px solid rgba(148, 163, 184, 0.26);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
    transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
  }

  .focus-card:hover {
    transform: translateY(-3px);
    border-color: rgba(15, 118, 110, 0.5);
    box-shadow: 0 26px 55px rgba(15, 23, 42, 0.1);
  }

  .focus-card + .focus-card {
    margin-top: 1.4rem;
  }

  .focus-shot {
    background: #edf7fb;
    border-right: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
  }

  .focus-shot img {
    width: 100%;
    height: 100%;
    min-height: 280px;
    object-fit: contain;
    display: block;
  }

  .focus-body {
    display: flex;
    flex-direction: column;
    padding: 1.6rem 1.7rem;
  }

  .focus-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 0.9rem;
  }

  .focus-tags span {
    border: 1px solid rgba(20, 184, 166, 0.28);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    color: #0f766e;
    background: rgba(240, 253, 250, 0.9);
    font-size: 0.74rem;
    line-height: 1.35;
  }

  .focus-body h2 {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    line-height: 1.2;
    color: #111827;
  }

  .focus-body p {
    margin: 0.8rem 0 1.2rem;
    color: #4b5563;
    line-height: 1.74;
  }

  .focus-open {
    margin-top: auto;
    color: #0f766e;
    font-weight: 700;
    font-size: 0.98rem;
  }

  /* ---------- Selected list ---------- */
  .home-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .home-list li + li {
    border-top: 1px solid rgba(148, 163, 184, 0.22);
  }

  .home-list a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 1rem;
    padding: 1.05rem 0.4rem;
    text-decoration: none;
    border-radius: 8px;
    transition: background 160ms ease, padding 160ms ease;
  }

  .home-list a:hover {
    background: rgba(240, 253, 250, 0.6);
    padding-left: 0.85rem;
    padding-right: 0.85rem;
  }

  .home-list-text {
    min-width: 0;
  }

  .home-list-title {
    display: block;
    font-size: 1.08rem;
    font-weight: 650;
    color: #111827;
    transition: color 160ms ease;
  }

  .home-list a:hover .home-list-title {
    color: #0f766e;
  }

  .home-list-desc {
    display: block;
    margin-top: 0.2rem;
    color: #64748b;
    font-size: 0.92rem;
    line-height: 1.6;
  }

  .home-list-arrow {
    color: #94a3b8;
    font-size: 1.1rem;
    transition: transform 160ms ease, color 160ms ease;
  }

  .home-list a:hover .home-list-arrow {
    color: #0f766e;
    transform: translateX(4px);
  }

  /* ---------- Entries ---------- */
  .home-entries {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .home-entry {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.1rem 1.15rem;
    text-decoration: none;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 10px;
    background: rgba(248, 250, 252, 0.6);
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .home-entry:hover {
    transform: translateY(-2px);
    border-color: rgba(15, 118, 110, 0.4);
    background: #fff;
  }

  .home-entry strong {
    font-size: 1.02rem;
    color: #111827;
  }

  .home-entry span {
    color: #64748b;
    font-size: 0.88rem;
    line-height: 1.6;
  }

  /* ---------- Dark mode ---------- */
  .dark .home-title,
  .dark .focus-body h2 {
    color: #f5f5f5;
  }

  .dark .home-lead,
  .dark .focus-body p,
  .dark .home-list-desc,
  .dark .home-entry span {
    color: #a3a3a3;
  }

  .dark .home-list-title,
  .dark .home-entry strong {
    color: #f5f5f5;
  }

  .dark .home-section-head {
    border-color: rgba(115, 115, 115, 0.32);
  }

  .dark .focus-card,
  .dark .home-entry {
    background: rgba(23, 23, 23, 0.86);
    border-color: rgba(115, 115, 115, 0.38);
  }

  .dark .focus-shot {
    background: #0f1f24;
    border-color: rgba(115, 115, 115, 0.32);
  }

  .dark .home-list li + li {
    border-color: rgba(115, 115, 115, 0.28);
  }

  .dark .home-list a:hover,
  .dark .home-entry:hover {
    background: rgba(20, 184, 166, 0.08);
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 760px) {
    .focus-card {
      grid-template-columns: 1fr;
    }

    .focus-shot {
      border-right: 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .home-entries {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .home-list a {
      padding: 0.95rem 0.3rem;
    }
  }
</style>

<div class="home-editorial">
  <header class="home-masthead">
    <p class="home-eyebrow">个人项目 · 写作 · 静态网页</p>
    <h1 class="home-title">Ally 的项目书架</h1>
    <p class="home-lead">把散落在 GitHub Pages 上的静态网页、工具与终端指南收进一个入口，也继续记录技术实践与备考笔记。</p>
    <nav class="home-hero-links" aria-label="主要入口">
      <a class="home-cta" href="/projects">浏览项目索引 →</a>
      <a href="/blog">读博客</a>
      <a href="https://github.com/liyongzheng666" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </header>

  <section class="home-section" aria-labelledby="home-focus-label">
    <div class="home-section-head">
      <span class="home-section-label" id="home-focus-label">焦点 · Featured</span>
    </div>
    <a class="focus-card" href="https://liyongzheng666.github.io/geometry-engineer-ai-road/" target="_blank" rel="noreferrer" aria-label="打开几何算法工程师的AI之路">
      <div class="focus-shot">
        <img src="/images/projects/geometry-engineer-ai-road.svg" alt="几何算法工程师的AI之路网页预览图" loading="eager" decoding="sync">
      </div>
      <div class="focus-body">
        <div class="focus-tags">
          <span>12 周课程</span>
          <span>验证闭环</span>
          <span>C++ 几何</span>
        </div>
        <h2>几何算法工程师的 AI 之路</h2>
        <p>面向几何造型算法工程师的 12 周 AI 提效课程：每周一个"粘贴即验证"C++ 工作台，配计划拆解、代码解读与补充知识（CMake、退化容差、Eigen）。前 3 周已上线，含 8 个验证闭环 harness。</p>
        <span class="focus-open">打开课程主页 ↗</span>
      </div>
    </a>
    <a class="focus-card" href="https://liyongzheng666.github.io/ielts-study-plan/" target="_blank" rel="noreferrer" aria-label="打开雅思 9 个月学习计划">
      <div class="focus-shot">
        <img src="/images/projects/ielts-study-plan.svg" alt="雅思 9 个月学习计划网页预览图" loading="eager" decoding="sync">
      </div>
      <div class="focus-body">
        <div class="focus-tags">
          <span>IELTS</span>
          <span>9 个月计划</span>
          <span>进度记录</span>
        </div>
        <h2>雅思 9 个月学习计划</h2>
        <p>可阅读、可切换、可打印的备考网页：总计划、月度执行方案、九个月本地进度板，外加逐篇精读样例——从词卡、同义替换、错题归因一直做到写作与口语。</p>
        <span class="focus-open">打开学习计划 ↗</span>
      </div>
    </a>
  </section>

  <section class="home-section" aria-labelledby="home-selected-label">
    <div class="home-section-head">
      <span class="home-section-label" id="home-selected-label">精选项目 · Selected</span>
      <a class="home-more" href="/projects">查看全部项目 →</a>
    </div>
    <ul class="home-list">
      <li>
        <a href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/fish-terminal-setup/" target="_blank" rel="noreferrer">
          <span class="home-list-text">
            <span class="home-list-title">Fish Terminal Setup Guide</span>
            <span class="home-list-desc">Fish 终端快捷键与环境配置速查，按范围、接入清单与命令捷径整理。</span>
          </span>
          <span class="home-list-arrow" aria-hidden="true">→</span>
        </a>
      </li>
      <li>
        <a href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/tmux-ghostty-guide/" target="_blank" rel="noreferrer">
          <span class="home-list-text">
            <span class="home-list-title">tmux + Ghostty Guide</span>
            <span class="home-list-desc">面向 Mac + Ghostty 用户的 tmux 入门，用 session / window / pane 三层结构讲清终端工作区。</span>
          </span>
          <span class="home-list-arrow" aria-hidden="true">→</span>
        </a>
      </li>
      <li>
        <a href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/claude-code-training/" target="_blank" rel="noreferrer">
          <span class="home-list-text">
            <span class="home-list-title">Claude Code 命令培训</span>
            <span class="home-list-desc">系统学习 Claude Code CLI、斜杠命令、权限模式、MCP、Hooks 与日常工作流。</span>
          </span>
          <span class="home-list-arrow" aria-hidden="true">→</span>
        </a>
      </li>
      <li>
        <a href="https://liyongzheng666.github.io/Print/" target="_blank" rel="noreferrer">
          <span class="home-list-text">
            <span class="home-list-title">3D Graph Visualization</span>
            <span class="home-list-desc">浏览器里的 2D / 3D 边数据可视化工具，支持 JSON 加载、旋转缩放与同步高亮。</span>
          </span>
          <span class="home-list-arrow" aria-hidden="true">→</span>
        </a>
      </li>
    </ul>
  </section>

  <section class="home-section" aria-labelledby="home-entries-label">
    <div class="home-section-head">
      <span class="home-section-label" id="home-entries-label">逛逛 · Explore</span>
    </div>
    <div class="home-entries">
      <a class="home-entry" href="/projects">
        <strong>项目索引 →</strong>
        <span>按工具 / 指南 / 入口分组查看全部已上线网页。</span>
      </a>
      <a class="home-entry" href="/blog">
        <strong>博客 →</strong>
        <span>技术实践、建站记录与后续项目复盘。</span>
      </a>
      <a class="home-entry" href="/about">
        <strong>关于 →</strong>
        <span>认识 Ally 与这个站点。</span>
      </a>
    </div>
  </section>
</div>
{{< /rawhtml >}}
