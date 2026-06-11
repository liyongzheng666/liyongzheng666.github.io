---
title: 项目索引
description: 统一查看 Ally 的静态网页项目与相关远端仓库。
layout: wide
---

<style>
  .project-page {
    max-width: 1180px;
    margin: 0 auto 4rem;
  }

  .project-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.55fr);
    gap: 1.5rem;
    align-items: end;
    margin: 1.25rem 0 2rem;
    padding: 1.4rem 0 1.8rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  }

  .project-kicker,
  .project-meta {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0f766e;
    font-weight: 700;
  }

  .project-hero h2 {
    margin: 0.45rem 0 0.7rem;
    font-size: clamp(2rem, 5vw, 4.2rem);
    line-height: 1.02;
    letter-spacing: 0;
  }

  .project-hero p,
  .project-section-lead {
    color: #52606d;
    font-size: 1rem;
    line-height: 1.75;
    margin: 0;
  }

  .project-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
  }

  .project-stat {
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 8px;
    padding: 0.8rem;
    background: rgba(248, 250, 252, 0.7);
  }

  .project-stat strong {
    display: block;
    font-size: 1.45rem;
    line-height: 1;
    color: #111827;
  }

  .project-stat span {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.78rem;
    color: #64748b;
  }

  .project-section {
    margin-top: 2.2rem;
  }

  .project-section-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .project-section-head h2 {
    margin: 0;
    font-size: 1.5rem;
    line-height: 1.25;
  }

  .project-grid {
    display: grid;
    gap: 1.15rem;
  }

  .project-card {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(280px, 0.88fr);
    gap: 0;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  }

  .project-shot {
    min-height: 100%;
    background: #eef2f7;
    border-right: 1px solid rgba(148, 163, 184, 0.22);
  }

  .project-shot img {
    width: 100%;
    height: 100%;
    min-height: 290px;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  .project-shot-fit img {
    object-fit: contain;
    background: #edf7fb;
  }

  .project-info {
    display: flex;
    flex-direction: column;
    padding: 1.35rem;
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 0.9rem;
  }

  .project-tag {
    border: 1px solid rgba(20, 184, 166, 0.28);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    color: #0f766e;
    background: rgba(240, 253, 250, 0.9);
    font-size: 0.75rem;
    line-height: 1.35;
  }

  .project-info h3 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.24;
  }

  .project-info p {
    margin: 0.8rem 0 1rem;
    color: #4b5563;
    line-height: 1.72;
  }

  .project-note {
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(148, 163, 184, 0.24);
    color: #64748b;
    font-size: 0.88rem;
  }

  .project-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.1rem;
  }

  .project-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 2.35rem;
    border-radius: 7px;
    padding: 0.45rem 0.75rem;
    font-size: 0.9rem;
    font-weight: 650;
    text-decoration: none;
    border: 1px solid rgba(15, 23, 42, 0.12);
    color: #111827;
    background: #fff;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .project-action:hover {
    transform: translateY(-1px);
    border-color: rgba(15, 118, 110, 0.45);
    background: #f8fafc;
  }

  .project-action-primary {
    color: #fff;
    border-color: #0f766e;
    background: #0f766e;
  }

  .project-action-primary:hover {
    color: #fff;
    background: #115e59;
  }

  .repo-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .repo-item {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 8px;
    padding: 1rem;
    background: rgba(248, 250, 252, 0.65);
  }

  .repo-item h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
  }

  .repo-item p {
    margin: 0 0 0.7rem;
    color: #52606d;
    line-height: 1.65;
  }

  .repo-item a {
    font-weight: 650;
    color: #0f766e;
    text-decoration: none;
  }

  .dark .project-card,
  .dark .project-stat,
  .dark .repo-item,
  .dark .project-action {
    background: rgba(23, 23, 23, 0.86);
    border-color: rgba(115, 115, 115, 0.38);
  }

  .dark .project-hero {
    border-color: rgba(115, 115, 115, 0.32);
  }

  .dark .project-hero p,
  .dark .project-section-lead,
  .dark .project-info p,
  .dark .project-note,
  .dark .repo-item p,
  .dark .project-stat span {
    color: #a3a3a3;
  }

  .dark .project-stat strong,
  .dark .project-action {
    color: #f5f5f5;
  }

  .dark .project-shot {
    border-color: rgba(115, 115, 115, 0.38);
    background: #171717;
  }

  .dark .project-action-primary {
    color: #fff;
    background: #0f766e;
    border-color: #0f766e;
  }

  @media (max-width: 900px) {
    .project-hero,
    .project-card,
    .repo-list {
      grid-template-columns: 1fr;
    }

    .project-section-head {
      display: block;
    }

    .project-stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .project-shot {
      border-right: 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.22);
    }
  }

  @media (max-width: 560px) {
    .project-stats {
      grid-template-columns: 1fr;
    }

    .project-info {
      padding: 1rem;
    }

    .project-action {
      width: 100%;
      justify-content: center;
    }
  }
</style>

{{< rawhtml >}}
<div class="project-page">
  <section class="project-hero">
    <div>
      <div class="project-kicker">GitHub Pages Portfolio</div>
      <h2>上线作品的一方书架</h2>
      <p>把已经能直接打开的静态网页，像书一样陈列在一处。每个项目配真实预览，按工具、指南与资料入口分组，随手取阅。</p>
    </div>
    <div class="project-stats" aria-label="项目统计">
      <div class="project-stat"><strong>6</strong><span>已上线页面</span></div>
      <div class="project-stat"><strong>5</strong><span>学习指南</span></div>
      <div class="project-stat"><strong>1</strong><span>交互工具</span></div>
    </div>
  </section>

  <section class="project-section">
    <div class="project-section-head">
      <div>
        <div class="project-meta">Interactive Tool</div>
        <h2>可交互工具</h2>
      </div>
      <p class="project-section-lead">能在浏览器里直接操作、观察结果的页面。</p>
    </div>

    <div class="project-grid">
      <article class="project-card">
        <a class="project-shot" href="https://liyongzheng666.github.io/Print/" target="_blank" rel="noreferrer" aria-label="打开 3D Graph Visualization">
          <img src="/images/projects/print.png" alt="3D Graph Visualization 的双视图边数据可视化截图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">Canvas</span>
            <span class="project-tag">JSON Viewer</span>
            <span class="project-tag">已上线</span>
          </div>
          <h3>3D Graph Visualization</h3>
          <p>基于 HTML5 Canvas 和 JavaScript 的 2D / 3D 边数据可视化工具，支持 JSON 数据加载、旋转缩放、同步高亮与标签搜索。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/Print/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/Print" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">适合调试边、点、重叠线段和 2D / 3D 映射关系。</div>
        </div>
      </article>
    </div>
  </section>

  <section class="project-section">
    <div class="project-section-head">
      <div>
        <div class="project-meta">Learning Guides</div>
        <h2>学习与终端指南</h2>
      </div>
      <p class="project-section-lead">独立网页指南，适合持续学习、快速回看和分享给别人。</p>
    </div>

    <div class="project-grid">
      <article class="project-card">
        <a class="project-shot project-shot-fit" href="https://liyongzheng666.github.io/geometry-engineer-ai-road/" target="_blank" rel="noreferrer" aria-label="打开几何算法工程师的AI之路">
          <img src="/images/projects/geometry-engineer-ai-road.svg" alt="几何算法工程师的AI之路网页预览图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">12 周课程</span>
            <span class="project-tag">验证闭环</span>
            <span class="project-tag">C++ 几何</span>
          </div>
          <h3>几何算法工程师的 AI 之路</h3>
          <p>面向几何造型算法工程师的 12 周 AI 提效课程主页：展望与路线、每周计划拆解、harness 代码解读和补充知识点（CMake 构建、退化容差、Eigen 集成），内容直接读自 GitHub 仓库。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/geometry-engineer-ai-road/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/geometry-engineer-ai-road" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">前 3 周已上线（8 个验证闭环 harness），第 4–12 周按同一范式持续更新。</div>
        </div>
      </article>

      <article class="project-card">
        <a class="project-shot project-shot-fit" href="https://liyongzheng666.github.io/ielts-study-plan/" target="_blank" rel="noreferrer" aria-label="打开雅思 9 个月学习计划">
          <img src="/images/projects/ielts-study-plan.svg" alt="雅思 9 个月学习计划网页预览图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">IELTS</span>
            <span class="project-tag">9 个月计划</span>
            <span class="project-tag">进度记录</span>
          </div>
          <h3>雅思 9 个月学习计划</h3>
          <p>把总计划、月度执行方案和学习成果示范整合成一个可阅读、可切换、可打印的网页，并提供保存在浏览器本地的九个月进度板；成果示范现已含逐篇精读样例，从词卡、同义替换、错题归因一直做到写作与口语。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/ielts-study-plan/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/ielts-study-plan" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">适合按总纲理解路线、按月份执行进度，并照「成果示范」把每篇精读榨出 7 类产出。</div>
        </div>
      </article>

      <article class="project-card">
        <a class="project-shot" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/fish-terminal-setup/" target="_blank" rel="noreferrer" aria-label="打开 Fish Terminal Setup Guide">
          <img src="/images/projects/fish-terminal.png" alt="Fish Terminal Setup Guide 首页截图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">Fish</span>
            <span class="project-tag">快捷键</span>
            <span class="project-tag">GitHub Pages</span>
          </div>
          <h3>Fish Terminal Setup Guide</h3>
          <p>从 Terminal-setup 中拆出的 Fish 终端快捷键与环境配置分享页，按范围、接入清单、键盘快捷键和命令捷径整理。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/fish-terminal-setup/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/fish-terminal-setup-guide-pages" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">上游资料来自 Terminal-setup 仓库，页面偏速查和分享。</div>
        </div>
      </article>

      <article class="project-card">
        <a class="project-shot project-shot-fit" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/tmux-ghostty-guide/" target="_blank" rel="noreferrer" aria-label="打开 tmux + Ghostty Guide">
          <img src="/images/projects/tmux-ghostty.png" alt="tmux 与 Ghostty 新手指南预览图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">tmux</span>
            <span class="project-tag">Ghostty</span>
            <span class="project-tag">新手指南</span>
          </div>
          <h3>tmux + Ghostty Guide</h3>
          <p>面向 Mac + Ghostty 用户的 tmux 入门分享页，用 session / window / pane 三层结构解释终端工作区。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/tmux-ghostty-guide/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/fish-terminal-setup-guide-pages/tree/main/tmux-ghostty-guide" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">更像一份可以转发给新手的像素风终端分享稿。</div>
        </div>
      </article>

      <article class="project-card">
        <a class="project-shot project-shot-fit" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/codex-terminal-skills/" target="_blank" rel="noreferrer" aria-label="打开 Codex 终端与 Skill 系统学习路线">
          <img src="/images/projects/codex-terminal-skills.svg" alt="Codex 终端与 Skill 系统学习路线预览图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">Codex</span>
            <span class="project-tag">OMX</span>
            <span class="project-tag">Skills</span>
          </div>
          <h3>Codex 终端与 Skill 系统学习路线</h3>
          <p>系统学习 Codex CLI、oh-my-codex 工作流与 Skill 调用技巧的路线图，包含命令速查、练习计划和提示词模板。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/codex-terminal-skills/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/fish-terminal-setup-guide-pages/tree/main/codex-terminal-skills" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">适合把 Codex 终端、Skill、review 与 GitHub 工作流串起来系统练。</div>
        </div>
      </article>

      <article class="project-card">
        <a class="project-shot project-shot-fit" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/claude-code-training/" target="_blank" rel="noreferrer" aria-label="打开 Claude Code 命令与操作完整培训">
          <img src="/images/projects/claude-code-training.svg" alt="Claude Code 命令与操作完整培训预览图" loading="eager" decoding="sync">
        </a>
        <div class="project-info">
          <div class="project-tags">
            <span class="project-tag">Claude Code</span>
            <span class="project-tag">MCP</span>
            <span class="project-tag">Hooks</span>
          </div>
          <h3>Claude Code 命令与操作完整培训</h3>
          <p>独立网页形态的 Claude Code 培训页，覆盖 CLI、slash commands、权限模式、上下文管理、MCP、Hooks、Subagents 与日常交付工作流。</p>
          <div class="project-actions">
            <a class="project-action project-action-primary" href="https://liyongzheng666.github.io/fish-terminal-setup-guide-pages/claude-code-training/" target="_blank" rel="noreferrer">访问页面 ↗</a>
            <a class="project-action" href="https://github.com/liyongzheng666/fish-terminal-setup-guide-pages/tree/main/claude-code-training" target="_blank" rel="noreferrer">查看源码</a>
          </div>
          <div class="project-note">不再作为普通博客文章维护，博客只保留项目入口。</div>
        </div>
      </article>
    </div>
  </section>

  <section class="project-section">
    <div class="project-section-head">
      <div>
        <div class="project-meta">Sources</div>
        <h2>统一仓库与上游资料</h2>
      </div>
    </div>

    <div class="repo-list">
      <article class="repo-item">
        <h3>fish-terminal-setup-guide-pages</h3>
        <p>统一维护 Fish、tmux、Codex、Claude Code 等独立网页指南的 GitHub Pages 仓库。</p>
        <a href="https://github.com/liyongzheng666/fish-terminal-setup-guide-pages" target="_blank" rel="noreferrer">查看统一仓库 ↗</a>
      </article>
      <article class="repo-item">
        <h3>Terminal-setup</h3>
        <p>macOS 终端环境一键配置脚本，也是 Fish 指南页的上游资料来源。</p>
        <a href="https://github.com/liyongzheng666/Terminal-setup" target="_blank" rel="noreferrer">查看上游仓库 ↗</a>
      </article>
    </div>
  </section>
</div>
{{< /rawhtml >}}
