---
title: freecad-occt-debug-kit
description: OCCT/FreeCAD 圆角失败根因诊断 Agent 与量化 Eval 工具链。
layout: wide
---

<style>
  .agent-page {
    --cream: #faf5ec;
    --paper: #fffaf2;
    --sage: #7d9b76;
    --sage-dark: #5f7f5b;
    --sage-pale: #e7efe0;
    --terracotta: #c47b5a;
    --brown: #6f5138;
    --ink: #2f3e2e;
    --muted: #5f6b55;

    max-width: 1080px;
    margin: 0 auto 3rem;
    padding: clamp(1.4rem, 4vw, 3rem);
    background:
      radial-gradient(circle at 10% 8%, rgba(201, 173, 126, 0.18), transparent 28%),
      linear-gradient(160deg, #fdf8ef 0%, #f7eedd 55%, #f1e5cf 100%);
    border: 1px solid rgba(111, 81, 56, 0.12);
    border-radius: 28px;
    box-shadow: 0 26px 70px rgba(70, 50, 30, 0.10);
    color: var(--ink);
    font-family: "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
    line-height: 1.75;
  }

  .agent-page * { box-sizing: border-box; }

  .agent-hero {
    position: relative;
    text-align: center;
    padding: 1.4rem 0 2.2rem;
  }

  .agent-eyebrow {
    display: inline-block;
    margin: 0 0 0.7rem;
    padding: 0.32rem 0.9rem;
    border: 1px solid rgba(93, 124, 88, 0.28);
    border-radius: 999px;
    background: rgba(231, 239, 224, 0.7);
    color: var(--sage-dark);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .agent-hero h1 {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.8rem);
    line-height: 1.12;
    letter-spacing: 0.01em;
    color: #31452f;
  }

  .agent-subtitle {
    max-width: 720px;
    margin: 1rem auto 0;
    color: var(--muted);
    font-size: clamp(1rem, 2vw, 1.15rem);
  }

  .agent-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.2rem 0 0;
  }

  .agent-tag {
    border: 1px solid rgba(196, 123, 90, 0.26);
    border-radius: 999px;
    padding: 0.26rem 0.72rem;
    background: rgba(255, 250, 242, 0.8);
    color: #8a5438;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .agent-hero-cover {
    margin: 1.8rem auto 0;
    max-width: 760px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(70, 50, 30, 0.12);
    border: 1px solid rgba(111, 81, 56, 0.12);
  }

  .agent-hero-cover img {
    display: block;
    width: 100%;
    height: auto;
  }

  .agent-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
    margin-top: 1.5rem;
  }

  .agent-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 999px;
    padding: 0.62rem 1.15rem;
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    border: 1px solid rgba(111, 81, 56, 0.22);
    background: var(--paper);
    color: var(--brown);
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .agent-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(70, 50, 30, 0.12);
    background: #fffdf7;
  }

  .agent-btn-primary {
    border-color: var(--sage-dark);
    background: var(--sage);
    color: #fff;
  }

  .agent-btn-primary:hover {
    background: var(--sage-dark);
  }

  .agent-section {
    margin-top: 2.8rem;
  }

  .agent-section-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.1rem;
  }

  .agent-section-head::before,
  .agent-section-head::after {
    content: "";
    height: 1px;
    flex: 1;
    background: linear-gradient(to right, transparent, rgba(111, 81, 56, 0.28));
  }

  .agent-section-head::after {
    background: linear-gradient(to left, transparent, rgba(111, 81, 56, 0.28));
  }

  .agent-section-head h2 {
    margin: 0;
    font-size: clamp(1.35rem, 3vw, 1.8rem);
    color: #3a5237;
  }

  .agent-lead {
    max-width: 760px;
    margin: 0 auto;
    text-align: center;
    color: var(--muted);
    font-size: 1.04rem;
  }

  .agent-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .agent-card {
    padding: 1.2rem 1.25rem;
    background: rgba(255, 250, 242, 0.78);
    border: 1px solid rgba(111, 81, 56, 0.14);
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(70, 50, 30, 0.06);
  }

  .agent-card h3 {
    margin: 0 0 0.5rem;
    font-size: 1.06rem;
    color: #3f5b3b;
  }

  .agent-card p {
    margin: 0;
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.7;
  }

  .agent-doors {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .agent-door {
    display: block;
    padding: 1.3rem 1.35rem;
    border-radius: 18px;
    text-decoration: none;
    color: var(--ink);
    background: rgba(231, 239, 224, 0.7);
    border: 1px solid rgba(93, 124, 88, 0.22);
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .agent-door:hover {
    transform: translateY(-2px);
    border-color: rgba(93, 124, 88, 0.55);
    background: rgba(231, 239, 224, 0.95);
  }

  .agent-door small {
    display: block;
    color: var(--sage-dark);
    font-weight: 700;
    letter-spacing: 0.04em;
    margin-bottom: 0.35rem;
  }

  .agent-door strong {
    display: block;
    font-size: 1.12rem;
    margin-bottom: 0.4rem;
  }

  .agent-door span {
    color: var(--muted);
    font-size: 0.92rem;
  }

  .agent-code {
    margin: 1.2rem 0 0;
    padding: 1.1rem 1.2rem;
    background: #26342a;
    border-radius: 16px;
    color: #e8e0cc;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 0.9rem;
    line-height: 1.75;
    overflow-x: auto;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  .agent-code .cm { color: #a8b89a; }
  .agent-code .ok { color: #d9c58a; }

  .agent-status {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
    margin-top: 1.2rem;
  }

  .agent-status-item {
    padding: 1rem;
    background: rgba(255, 250, 242, 0.7);
    border-radius: 16px;
    border: 1px solid rgba(111, 81, 56, 0.12);
  }

  .agent-status-item strong {
    display: block;
    color: #3f5b3b;
    font-size: 1rem;
    margin-bottom: 0.3rem;
  }

  .agent-status-item span {
    color: var(--muted);
    font-size: 0.88rem;
  }

  .agent-back {
    display: block;
    margin-top: 3rem;
    text-align: center;
    color: var(--brown);
    font-weight: 600;
    text-decoration: none;
  }

  .agent-back:hover { color: var(--sage-dark); }

  .dark .agent-page {
    --cream: #1b211c;
    --paper: #242b22;
    --sage: #8aa584;
    --sage-dark: #a6c09e;
    --sage-pale: #2a3528;
    --terracotta: #d49a7a;
    --brown: #d7b69b;
    --ink: #e6e0d0;
    --muted: #b6b2a2;
    background:
      radial-gradient(circle at 10% 8%, rgba(125, 155, 118, 0.10), transparent 30%),
      linear-gradient(160deg, #1c231b 0%, #202820 55%, #262c21 100%);
    border-color: rgba(200, 180, 150, 0.14);
  }

  .dark .agent-page .agent-card,
  .dark .agent-page .agent-status-item {
    background: rgba(30, 38, 29, 0.8);
    border-color: rgba(200, 180, 150, 0.14);
  }

  .dark .agent-page .agent-door {
    background: rgba(42, 53, 40, 0.7);
    border-color: rgba(166, 192, 158, 0.22);
  }

  .dark .agent-page .agent-tag {
    background: rgba(36, 43, 34, 0.8);
    color: #e3b99c;
  }

  .dark .agent-page .agent-btn {
    background: #2b3328;
    border-color: rgba(215, 182, 155, 0.25);
    color: #e2d5c0;
  }

  .dark .agent-page .agent-btn-primary {
    background: var(--sage);
    border-color: var(--sage);
    color: #1e261c;
  }

  .dark .agent-page .agent-code {
    background: #111710;
  }

  @media (max-width: 760px) {
    .agent-grid,
    .agent-status {
      grid-template-columns: 1fr 1fr;
    }

    .agent-doors {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .agent-grid,
    .agent-status {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="agent-page">
  <header class="agent-hero">
    <p class="agent-eyebrow">Root-Cause Investigation Agent</p>
    <h1>freecad-occt-debug-kit</h1>
    <p class="agent-subtitle">面向 OCCT / FreeCAD 圆角与倒角失败场景的根因诊断 Agent + 量化 Eval 工具链。</p>
    <div class="agent-tags" aria-label="项目标签">
      <span class="agent-tag">Agent</span>
      <span class="agent-tag">OCCT</span>
      <span class="agent-tag">FreeCAD</span>
      <span class="agent-tag">Root-Cause</span>
      <span class="agent-tag">5 维 Eval</span>
      <span class="agent-tag">macOS Apple Silicon</span>
    </div>
    <div class="agent-actions">
      <a class="agent-btn agent-btn-primary" href="https://github.com/liyongzheng666/freecad-occt-debug-kit" target="_blank" rel="noreferrer">GitHub 仓库 ↗</a>
      <a class="agent-btn" href="https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/README.md" target="_blank" rel="noreferrer">README</a>
      <a class="agent-btn" href="https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/AGENT.md" target="_blank" rel="noreferrer">AGENT.md</a>
      <a class="agent-btn" href="https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/GEOMETRY.md" target="_blank" rel="noreferrer">GEOMETRY.md</a>
    </div>
    <div class="agent-hero-cover">
      <img src="/images/projects/freecad-occt-debug-kit.svg" alt="freecad-occt-debug-kit 田园风封面：放大镜观察几何方块" loading="eager">
    </div>
  </header>

  <section class="agent-section">
    <div class="agent-section-head"><h2>这个项目在做什么</h2></div>
    <p class="agent-lead">把「为什么会失败」从一句猜测，变成一条可复现、可定位、可评分、可回归的调试闭环：从可复现构建、几何采集，到自动化的根因诊断 Agent 与量化 Eval。</p>
  </section>

  <section class="agent-section">
    <div class="agent-section-head"><h2>核心能力</h2></div>
    <div class="agent-grid">
      <div class="agent-card">
        <h3>🌱 可复现调试环境</h3>
        <p>pinned forks + Pixi 工具链 + 幂等 bootstrap：一条命令从裸 clone 到可调试的 OCCT / FreeCAD 环境。</p>
      </div>
      <div class="agent-card">
        <h3>🔍 确定性工具层</h3>
        <p>BREP → mesh / geom / defect 转换，并加入 BOP 面面自交校验，堵住「假绿」盲区。</p>
      </div>
      <div class="agent-card">
        <h3>🧭 根因决策回路</h3>
        <p>observe → 定位 → 机制 → 反事实 → 结论，把诊断过程变成可追踪的决策链。</p>
      </div>
      <div class="agent-card">
        <h3>📊 五维量化 Eval</h3>
        <p>13 个 case 基线、反事实真分、弃权四态，数字漂移即回归，CI 自动把关。</p>
      </div>
      <div class="agent-card">
        <h3>⚖️ Rule / LLM 接缝</h3>
        <p>确定性规则与 LLM 决策可 A/B，方便评估「模型到底贡献了什么」。</p>
      </div>
      <div class="agent-card">
        <h3>🖼️ 几何 Viewer 联动</h3>
        <p>捕获的 BREP 可转成可视化资产，交给 Print viewer 端做直观检查。</p>
      </div>
    </div>
  </section>

  <section class="agent-section">
    <div class="agent-section-head"><h2>两条读者入口</h2></div>
    <div class="agent-doors">
      <a class="agent-door" href="https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/GEOMETRY.md" target="_blank" rel="noreferrer">
        <small>几何建模 / 内核开发者</small>
        <strong>GEOMETRY.md</strong>
        <span>失效本体 S0–S6、失效四态、Parasolid 对照、缺陷导出与 LLDB 捕获。</span>
      </a>
      <a class="agent-door" href="https://github.com/liyongzheng666/freecad-occt-debug-kit/blob/main/AGENT.md" target="_blank" rel="noreferrer">
        <small>Agent / Harness / Eval 工程师</small>
        <strong>AGENT.md</strong>
        <span>决策回路、decide 接缝 A/B、五维打分、弃权四态与轨迹 / review 闭环。</span>
      </a>
    </div>
  </section>

  <section class="agent-section">
    <div class="agent-section-head"><h2>30 秒上手</h2></div>
    <pre class="agent-code"><code><span class="cm"># 合成 case 根因诊断</span>
python -m agent.loop.investigate box 5

<span class="cm"># 用自己的模型文件诊断</span>
python -m agent.loop.investigate <span class="ok">"brep:/abs/m.brep"</span> 5 --edges 3

<span class="cm"># 五维 + 弃权四态分层打分</span>
bash agent/eval/eval.sh</code></pre>
  </section>

  <section class="agent-section">
    <div class="agent-section-head"><h2>当前状态</h2></div>
    <div class="agent-status">
      <div class="agent-status-item"><strong>环境 / 构建层</strong><span>成熟：一条命令从裸 clone 到可调试</span></div>
      <div class="agent-status-item"><strong>几何工具</strong><span>成熟：60+ 离线断言 + 夹具回归</span></div>
      <div class="agent-status-item"><strong>Agent + Eval</strong><span>v0 投产，13 case 基线</span></div>
      <div class="agent-status-item"><strong>CI + 护栏</strong><span>离线单测门 + 基线回归门已落地</span></div>
    </div>
  </section>

  <a class="agent-back" href="/">← 回到首页</a>
</div>
