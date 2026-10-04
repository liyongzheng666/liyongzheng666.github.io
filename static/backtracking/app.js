(function () {
  "use strict";

  const topic = window.BT_TOPIC || { lessonOrder: [], lessons: [] };
  const lessonArray = [
    ...((window.BT_FOUNDATIONS && window.BT_FOUNDATIONS.length) ? window.BT_FOUNDATIONS : []),
    ...((window.BT_ADVANCED && window.BT_ADVANCED.length) ? window.BT_ADVANCED : [])
  ];
  const lessons = lessonArray.length
    ? Object.fromEntries(lessonArray.map((lesson) => [lesson.id, lesson]))
    : (window.BT_LESSONS || {});
  const state = { lessonId: "", frameIndex: 0, timer: null };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(value) {
    if (value === "#") return "#";
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "#";
    } catch (_error) {
      return "#";
    }
  }

  function problem(id) {
    return topic.lessons.find((item) => item.id === id) || lessons[id] || {};
  }

  function lessonIds() {
    if (lessonArray.length) return lessonArray.map((lesson) => lesson.id);
    return (topic.lessonOrder || []).filter((id) => lessons[id]);
  }

  function difficultyClass(value) {
    if (value === "Easy") return "easy";
    if (value === "Hard") return "hard";
    if (value === "Warmup") return "warmup";
    return "medium";
  }

  function renderRoadmap() {
    const cards = lessonArray.length ? lessonArray : (topic.lessons || []);
    document.getElementById("roadmapList").innerHTML = cards.map((item) => `
      <a class="road-card" href="#lesson-${escapeHtml(item.id)}">
        <div class="meta">
          <span>${escapeHtml(item.stage)}</span>
          <span class="tag ${difficultyClass(item.difficulty)}">${escapeHtml(item.difficulty)}</span>
          <span class="tag ready">已配动图</span>
        </div>
        <h3>${escapeHtml(item.id)}. ${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.method)}</strong></p>
        <p>${escapeHtml(item.summary)}</p>
      </a>
    `).join("");
  }

  function renderTabs() {
    const target = document.getElementById("lessonTabs");
    target.innerHTML = lessonIds().map((id) => {
      const item = problem(id);
      return `
        <button type="button" class="lesson-tab${id === state.lessonId ? " active" : ""}" data-lesson-id="${escapeHtml(id)}">
          <span>${escapeHtml(item.stage)}</span>
          <strong>${escapeHtml(id)}</strong>
          <small>${escapeHtml(item.method)}</small>
        </button>
      `;
    }).join("");
    target.querySelectorAll("[data-lesson-id]").forEach((button) => {
      button.addEventListener("click", () => selectLesson(button.dataset.lessonId, true));
    });
  }

  function renderList(items, className) {
    return `<ul class="${className || ""}">${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderConcepts(items) {
    return (items || []).map((item) => `
      <div class="concept">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </div>
    `).join("");
  }

  function renderFrameTree(frame) {
    const tree = frame.tree || [];
    if (!tree.length) return "";
    return `<div class="tree">${tree.map((node) => `<span>${escapeHtml(node)}</span>`).join("")}</div>`;
  }

  function renderCodeBlock(title, code, id) {
    return `
      <details class="code-details"${id === "starter" ? "" : " open"}>
        <summary>${escapeHtml(title)}</summary>
        <pre><code>${escapeHtml(code)}</code></pre>
      </details>
    `;
  }

  function renderLessonShell(lesson) {
    const meta = problem(lesson.id);
    document.getElementById("lessonMount").innerHTML = `
      <div class="lesson-head">
        <div>
          <p class="section-kicker">${escapeHtml(lesson.stage)}</p>
          <h2>${escapeHtml(lesson.id)} · ${escapeHtml(lesson.title)}</h2>
          <p>${escapeHtml(lesson.goal)}</p>
        </div>
        <a class="source-link" href="${safeUrl(lesson.url)}" target="_blank" rel="noopener">${meta.url === "#" ? "热身练习" : "LeetCode 官方出处"}</a>
      </div>

      <article class="module">
        <h3>1. 题目到底在问什么</h3>
        <p>${escapeHtml(lesson.statement)}</p>
        <p><strong>小例子：</strong><code>${escapeHtml(lesson.example.input)}</code> → <code>${escapeHtml(lesson.example.output)}</code>。${escapeHtml(lesson.example.explain || lesson.example.expected)}</p>
      </article>

      <article class="module">
        <h3>2. 建模卡</h3>
        <div class="concept-grid">${renderConcepts(lesson.concepts)}</div>
      </article>

      <article class="module demo-module">
        <div>
          <h3>3. 动图轨迹</h3>
          <p>每一帧都对应一次真实算法动作，重点看 <code>path</code> 和共享状态怎样恢复。</p>
          <div class="controls" aria-label="动画控制">
            <button type="button" id="prevBtn" aria-label="上一步" title="上一步">‹</button>
            <button type="button" id="playBtn" aria-label="播放或暂停" title="播放或暂停">播放</button>
            <button type="button" id="nextBtn" aria-label="下一步" title="下一步">›</button>
            <button type="button" id="resetBtn" aria-label="重置" title="重置">重置</button>
          </div>
          <div class="progress" aria-hidden="true"><i id="progressBar"></i></div>
        </div>
        <div class="trace-card" aria-live="polite">
          <div class="trace-meta">
            <span id="frameCount"></span>
            <span id="frameAction"></span>
            <span id="frameLine"></span>
          </div>
          <p class="frame-note" id="frameMessage"></p>
          <div class="path-row" id="pathRow"></div>
          <div class="var-grid" id="varGrid"></div>
          <div class="answers" id="answersBox"></div>
          <div id="treeBox"></div>
        </div>
      </article>

      <article class="module">
        <h3>4. 逐步理解</h3>
        ${renderList(lesson.walkthrough, "walkthrough")}
      </article>

      <article class="module split">
        <div>
          <h3>5. 常见坑</h3>
          ${renderList(lesson.pitfalls)}
        </div>
        <div>
          <h3>6. 过关检查</h3>
          ${renderList(lesson.checks)}
        </div>
      </article>

      <article class="module">
        <h3>7. 分层提示</h3>
        <details>
          <summary>卡住后先看提示</summary>
          ${renderList(lesson.hints)}
        </details>
        ${renderCodeBlock("C++17 starter · 先补 TODO", lesson.starter, "starter")}
      ${renderCodeBlock("C++17 完整示例 · 可直接编译运行", lesson.code, "code")}
      </article>
    `;
  }

  function traceFrames() {
    const lesson = lessons[state.lessonId];
    if (!lesson) return [];
    return lesson._frames || (lesson._frames = lesson.trace());
  }

  function stop() {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }
    const playBtn = document.getElementById("playBtn");
    if (playBtn) playBtn.textContent = "播放";
  }

  function renderPath(path) {
    if (!path || !path.length) return "<span class=\"empty\">path = []</span>";
    return path.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  }

  function renderVariables(vars) {
    return Object.entries(vars || {}).map(([key, value]) => `
      <div>
        <span>${escapeHtml(key)}</span>
        <strong>${escapeHtml(Array.isArray(value) ? JSON.stringify(value) : value)}</strong>
      </div>
    `).join("");
  }

  function renderAnswers(answers) {
    if (!answers || !answers.length) return "<strong>answers</strong><p>[]</p>";
    return `<strong>answers</strong><p>${escapeHtml(JSON.stringify(answers))}</p>`;
  }

  function renderFrame() {
    const frames = traceFrames();
    const frame = frames[state.frameIndex];
    if (!frame) return;
    document.getElementById("frameCount").textContent = `${state.frameIndex + 1} / ${frames.length}`;
    document.getElementById("frameAction").textContent = frame.action;
    document.getElementById("frameLine").textContent = `C++ 行 ${frame.line || "-"}`;
    document.getElementById("frameMessage").textContent = frame.message;
    document.getElementById("pathRow").innerHTML = renderPath(frame.path);
    document.getElementById("varGrid").innerHTML = renderVariables(frame.variables);
    document.getElementById("answersBox").innerHTML = renderAnswers(frame.answers);
    document.getElementById("treeBox").innerHTML = renderFrameTree(frame);
    document.getElementById("prevBtn").disabled = state.frameIndex === 0;
    document.getElementById("nextBtn").disabled = state.frameIndex === frames.length - 1;
    document.getElementById("progressBar").style.width = `${(state.frameIndex / Math.max(frames.length - 1, 1)) * 100}%`;
  }

  function go(delta) {
    const frames = traceFrames();
    state.frameIndex = Math.max(0, Math.min(frames.length - 1, state.frameIndex + delta));
    renderFrame();
    if (state.frameIndex === frames.length - 1) stop();
  }

  function play() {
    if (state.timer !== null) {
      stop();
      return;
    }
    if (prefersReducedMotion) {
      document.getElementById("frameMessage").textContent = "系统开启了减少动效，请使用上一步和下一步查看。";
      return;
    }
    if (state.frameIndex === traceFrames().length - 1) state.frameIndex = 0;
    document.getElementById("playBtn").textContent = "暂停";
    renderFrame();
    state.timer = window.setInterval(() => go(1), 1500);
  }

  function bindDemo() {
    document.getElementById("prevBtn").addEventListener("click", () => { stop(); go(-1); });
    document.getElementById("nextBtn").addEventListener("click", () => { stop(); go(1); });
    document.getElementById("resetBtn").addEventListener("click", () => { stop(); state.frameIndex = 0; renderFrame(); });
    document.getElementById("playBtn").addEventListener("click", play);
    renderFrame();
  }

  function selectLesson(id, pushHash) {
    if (!id || !lessons[id]) return;
    stop();
    state.lessonId = id;
    state.frameIndex = 0;
    renderTabs();
    renderLessonShell(lessons[id]);
    bindDemo();
    if (pushHash) history.replaceState(null, "", `#lesson-${id}`);
  }

  function initialLessonId() {
    const match = window.location.hash.match(/^#lesson-(.+)$/);
    if (match && lessons[match[1]]) return match[1];
    return lessonIds()[0] || "";
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button, a, summary")) return;
      if (event.key === "ArrowLeft") {
        stop();
        go(-1);
      }
      if (event.key === "ArrowRight") {
        stop();
        go(1);
      }
    });
    window.addEventListener("hashchange", () => {
      const match = window.location.hash.match(/^#lesson-(.+)$/);
      if (match) selectLesson(match[1], false);
    });
  }

  renderRoadmap();
  state.lessonId = initialLessonId();
  renderTabs();
  selectLesson(state.lessonId, false);
  bindKeyboard();
}());
