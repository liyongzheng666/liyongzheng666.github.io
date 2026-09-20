(function () {
  "use strict";

  const topic = window.PAL_TOPIC || { lessonOrder: [], problems: [] };
  const lessons = window.PAL_LESSONS || {};
  const state = { lessonId: "", frameIndex: 0, timer: null };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function difficultyClass(difficulty) {
    if (difficulty === "Easy") return "easy";
    if (difficulty === "Hard") return "hard";
    return "medium";
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "#";
    } catch (_error) {
      return "#";
    }
  }

  function getProblem(id) {
    return topic.problems.find((item) => item.id === id) || {};
  }

  function activeLessonIds() {
    return (topic.lessonOrder || []).filter((id) => getProblem(id).id);
  }

  function renderRoadmap() {
    function renderCards(items) {
      return items.map((item) => {
        const available = Boolean(lessons[item.id]);
        const href = available ? `#lesson-${item.id}` : safeExternalUrl(item.url);
        const target = available ? "" : " target=\"_blank\" rel=\"noopener\"";
        return `
          <a class="road-card${available ? " ready" : ""}" href="${href}"${target}>
            <div class="meta">
              <span>${escapeHtml(item.phase)}</span>
              <span class="tag ${difficultyClass(item.difficulty)}">${escapeHtml(item.difficulty)}</span>
              ${available ? "<span class=\"tag ready-tag\">已配动画</span>" : ""}
            </div>
            <h3>${escapeHtml(item.id)}. ${escapeHtml(item.title)}</h3>
            <p><strong>${escapeHtml(item.method)}</strong></p>
            <p>${escapeHtml(item.summary)}</p>
            <p>动画重点：${escapeHtml(item.demo)}</p>
          </a>
        `;
      }).join("");
    }

    document.getElementById("roadmapList").innerHTML = renderCards(topic.problems.slice(0, 6));
    document.getElementById("advancedRoadmap").innerHTML = renderCards(topic.problems.slice(6));
  }

  function renderTabs() {
    const target = document.getElementById("lessonTabs");
    target.innerHTML = activeLessonIds().map((id) => {
      const item = getProblem(id);
      const active = id === state.lessonId;
      const available = Boolean(lessons[id]);
      return `
        <button
          type="button"
          class="lesson-tab${active ? " active" : ""}"
          data-lesson-id="${escapeHtml(id)}"
          ${available ? "" : "disabled"}
        >
          <span>${escapeHtml(item.phase || "章节")}</span>
          <strong>LC ${escapeHtml(id)}</strong>
          <small>${available ? escapeHtml(item.method || "互动讲解") : "正在扩充"}</small>
        </button>
      `;
    }).join("");

    target.querySelectorAll("[data-lesson-id]").forEach((button) => {
      button.addEventListener("click", () => selectLesson(button.dataset.lessonId, true));
    });
  }

  function paragraphList(items) {
    return (items || []).map((item) => `<p>${escapeHtml(item)}</p>`).join("");
  }

  function renderSample(sample) {
    if (!sample) return "";
    const rows = (sample.rows || []).map((row) => `
      <div>
        <b>${escapeHtml(row.label)}</b>
        <span>${escapeHtml(row.content)}</span>
        <strong>${escapeHtml(row.result)}</strong>
      </div>
    `).join("");
    return `
      <article class="module" aria-labelledby="sample-title">
        <h3 id="sample-title">2. 先手算一个例子</h3>
        <p><code>${escapeHtml(sample.input)}</code>，输出 <code>${escapeHtml(sample.output)}</code>。${escapeHtml(sample.explanation)}</p>
        <div class="manual-table">${rows}</div>
      </article>
    `;
  }

  function renderDemo(lesson) {
    const demo = lesson.demo || {};
    return `
      <article class="module demo-module" aria-labelledby="demo-title">
        <div class="demo-copy">
          <h3 id="demo-title">3. 跟着动画走</h3>
          <p><strong>${escapeHtml(demo.title || "动画演示")}</strong></p>
          <p>${escapeHtml(demo.intro || "每一步只看一个变化。")}</p>
        </div>
        <div class="demo" aria-label="${escapeHtml(lesson.titleZh)} 动画演示">
          <div class="demo-label" id="primaryLabel"></div>
          <div class="string-row lesson-string-row" id="primaryRow" aria-label="主动画行"></div>
          <div class="demo-label" id="secondaryLabel"></div>
          <div class="string-row lesson-string-row secondary-row" id="secondaryRow" aria-label="辅助动画行"></div>
          <div class="demo-status" id="statsRow"></div>
          <p class="frame-note" id="frameNote" aria-live="polite"></p>
          <div class="chip-row" id="chipRow"></div>
          <div class="controls" aria-label="动画控制">
            <button type="button" id="prevBtn" aria-label="上一步" title="上一步">‹</button>
            <button type="button" id="playBtn" aria-label="播放或暂停动画" title="播放或暂停">播放</button>
            <button type="button" id="nextBtn" aria-label="下一步" title="下一步">›</button>
            <button type="button" id="resetBtn" aria-label="重置动画" title="重置">重置</button>
          </div>
          <div class="progress" aria-hidden="true"><i id="progressBar"></i></div>
        </div>
      </article>
    `;
  }

  function renderDeepDives(items) {
    return (items || []).map((item) => `
      <details class="deep-dive">
        <summary>${escapeHtml(item.title)}</summary>
        ${paragraphList(item.paragraphs)}
        ${item.code ? `<pre><code>${escapeHtml(item.code)}</code></pre>` : ""}
      </details>
    `).join("");
  }

  function renderTests(tests) {
    return (tests || []).map((test) => `
      <div class="test-case">
        <code>${escapeHtml(test.input)}</code>
        <span>期望 ${escapeHtml(test.expected)} · ${escapeHtml(test.note)}</span>
      </div>
    `).join("");
  }

  function renderLessonShell(lesson) {
    const complexity = lesson.complexity || {};
    document.getElementById("lessonMount").innerHTML = `
      <div class="lesson-head">
        <div>
          <p class="section-kicker">${escapeHtml(lesson.stage)}</p>
          <h2>LC ${escapeHtml(lesson.id)}. ${escapeHtml(lesson.titleEn)}</h2>
          <p>${escapeHtml(lesson.summary)}</p>
        </div>
        <a class="source-link" href="${safeExternalUrl(lesson.source)}" target="_blank" rel="noopener">LeetCode 官方出处</a>
      </div>

      <article class="module" aria-labelledby="ask-title">
        <h3 id="ask-title">1. 题目到底在问什么</h3>
        ${paragraphList(lesson.question)}
      </article>

      ${renderSample(lesson.sample)}
      ${renderDemo(lesson)}

      <article class="module" aria-labelledby="idea-title">
        <h3 id="idea-title">4. 一句人话思路</h3>
        <p><strong>${escapeHtml(lesson.idea)}</strong></p>
      </article>

      <article class="module code-module" aria-labelledby="code-title">
        <h3 id="code-title">5. 把思路翻译成 C++</h3>
        <p>${escapeHtml(lesson.codeIntro)}</p>
        <pre><code>${escapeHtml(lesson.code)}</code></pre>
      </article>

      <article class="module practice" aria-labelledby="practice-title">
        <h3 id="practice-title">6. 现在轮到你</h3>
        <p>${escapeHtml(lesson.practice?.prompt || "先自己想一想。")}</p>
        <details>
          <summary>提示</summary>
          <p>${escapeHtml(lesson.practice?.hint || "")}</p>
        </details>
        <details>
          <summary>答案与边界测试</summary>
          <p>${escapeHtml(lesson.practice?.answer || "")}</p>
          <div class="tests">${renderTests(lesson.tests)}</div>
        </details>
      </article>

      ${renderDeepDives(lesson.deepDives)}

      <aside class="note">
        <strong>复杂度与边界</strong>
        <p>时间：<code>${escapeHtml(complexity.time)}</code>；空间：<code>${escapeHtml(complexity.space)}</code>。${escapeHtml(complexity.explanation)}</p>
        <p>建议重点测：${(complexity.edgeCases || []).map(escapeHtml).join("、")}。</p>
      </aside>
    `;
  }

  function stateClass(value) {
    const allowed = new Set(["idle", "active", "match", "mismatch", "chosen", "discarded", "best", "muted"]);
    return allowed.has(value) ? value : "idle";
  }

  function renderCells(values, states, pointers) {
    return (values || []).map((value, index) => {
      const pointerHtml = (pointers || [])
        .filter((pointer) => pointer.index === index)
        .map((pointer) => `<span class="pointer ${escapeHtml(pointer.position || "top")}">${escapeHtml(pointer.label)}</span>`)
        .join("");
      return `
        <div class="char-cell ${stateClass(states?.[index])}">
          ${pointerHtml}
          <span class="char">${escapeHtml(value)}</span>
          <span class="idx">${index}</span>
        </div>
      `;
    }).join("");
  }

  function stop() {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }
    const playBtn = document.getElementById("playBtn");
    if (playBtn) playBtn.textContent = "播放";
  }

  function currentLesson() {
    return lessons[state.lessonId];
  }

  function renderFrame() {
    const lesson = currentLesson();
    const frames = lesson?.demo?.frames || [];
    const frame = frames[state.frameIndex];
    if (!frame) return;
    const primary = lesson.demo.primary || [];
    const secondary = frame.secondary || lesson.demo.secondary || [];

    document.getElementById("primaryLabel").textContent = lesson.demo.primaryLabel || "";
    document.getElementById("primaryRow").style.gridTemplateColumns = `repeat(${Math.max(primary.length, 1)}, minmax(46px, 1fr))`;
    document.getElementById("primaryRow").innerHTML = renderCells(primary, frame.primaryStates, frame.pointers);

    const secondaryLabel = document.getElementById("secondaryLabel");
    const secondaryRow = document.getElementById("secondaryRow");
    if (secondary.length > 0) {
      secondaryLabel.textContent = lesson.demo.secondaryLabel || "辅助行";
      secondaryRow.hidden = false;
      secondaryRow.style.gridTemplateColumns = `repeat(${Math.max(secondary.length, 1)}, minmax(46px, 1fr))`;
      secondaryRow.innerHTML = renderCells(secondary, frame.secondaryStates, []);
    } else {
      secondaryLabel.textContent = "";
      secondaryRow.hidden = true;
      secondaryRow.innerHTML = "";
    }

    document.getElementById("statsRow").innerHTML = (frame.stats || []).map((stat) => `
      <div>
        <span>${escapeHtml(stat.label)}</span>
        <strong>${escapeHtml(stat.value)}</strong>
      </div>
    `).join("");
    document.getElementById("frameNote").textContent = `${frame.title}：${frame.message}`;
    document.getElementById("chipRow").innerHTML = (frame.chips || []).map((chip) => `<span>${escapeHtml(chip)}</span>`).join("");
    document.getElementById("prevBtn").disabled = state.frameIndex === 0;
    document.getElementById("nextBtn").disabled = state.frameIndex === frames.length - 1;
    document.getElementById("progressBar").style.width = `${(state.frameIndex / Math.max(frames.length - 1, 1)) * 100}%`;
  }

  function go(delta) {
    const frames = currentLesson()?.demo?.frames || [];
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
      document.getElementById("frameNote").textContent = "系统已开启“减少动效”，请使用上一步和下一步按钮查看。";
      return;
    }
    const frames = currentLesson()?.demo?.frames || [];
    if (state.frameIndex === frames.length - 1) state.frameIndex = 0;
    document.getElementById("playBtn").textContent = "暂停";
    renderFrame();
    state.timer = window.setInterval(() => go(1), 1600);
  }

  function bindDemo() {
    document.getElementById("prevBtn").addEventListener("click", () => {
      stop();
      go(-1);
    });
    document.getElementById("nextBtn").addEventListener("click", () => {
      stop();
      go(1);
    });
    document.getElementById("resetBtn").addEventListener("click", () => {
      stop();
      state.frameIndex = 0;
      renderFrame();
    });
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
    const hashMatch = window.location.hash.match(/^#lesson-(.+)$/);
    if (hashMatch && lessons[hashMatch[1]]) return hashMatch[1];
    return activeLessonIds().find((id) => lessons[id]) || "";
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button, a, summary")) return;
      if (event.key === "ArrowLeft") {
        stop();
        go(-1);
      } else if (event.key === "ArrowRight") {
        stop();
        go(1);
      }
    });
    window.addEventListener("hashchange", () => {
      const hashMatch = window.location.hash.match(/^#lesson-(.+)$/);
      if (hashMatch) selectLesson(hashMatch[1], false);
    });
  }

  renderRoadmap();
  state.lessonId = initialLessonId();
  renderTabs();
  selectLesson(state.lessonId, false);
  bindKeyboard();
}());
