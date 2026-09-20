(function () {
  "use strict";

  const topic = window.PAL_TOPIC;
  const state = {
    index: 0,
    timer: null
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escapeHtml(value) {
    return String(value)
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

  function renderRoadmap() {
    function renderCards(items) {
      return items.map((item) => `
      <a class="road-card" href="${safeExternalUrl(item.url)}" target="_blank" rel="noopener">
        <div class="meta">
          <span>${escapeHtml(item.phase)}</span>
          <span class="tag ${difficultyClass(item.difficulty)}">${escapeHtml(item.difficulty)}</span>
        </div>
        <h3>${escapeHtml(item.id)}. ${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.method)}</strong></p>
        <p>${escapeHtml(item.summary)}</p>
        <p>动画重点：${escapeHtml(item.demo)}</p>
      </a>
      `).join("");
    }

    document.getElementById("roadmapList").innerHTML = renderCards(topic.problems.slice(0, 6));
    document.getElementById("advancedRoadmap").innerHTML = renderCards(topic.problems.slice(6));
  }

  function renderTests() {
    const target = document.getElementById("testList");
    target.innerHTML = topic.tests.map(([input, answer, note]) => `
      <div class="test-case">
        <code>s = "${escapeHtml(input)}"</code>
        <span>期望 ${answer} · ${note}</span>
      </div>
    `).join("");
  }

  function stop() {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }
    document.getElementById("playBtn").textContent = "播放";
  }

  function renderString(frame) {
    const target = document.getElementById("stringRow");
    const chars = Array.from(topic.sample.value);
    target.innerHTML = chars.map((char, index) => {
      const inRange = frame.left >= 0 && index >= frame.left && index <= frame.right;
      const active = index === frame.left || index === frame.right;
      const className = `char-cell${inRange ? " in-range" : ""}${active ? " active" : ""}`;
      return `
        <div class="${className}">
          <span class="char">${char}</span>
          <span class="idx">index ${index}</span>
        </div>
      `;
    }).join("");
  }

  function renderFrame() {
    const frames = topic.sample.frames;
    const frame = frames[state.index];
    renderString(frame);
    document.getElementById("centerLabel").textContent = frame.center;
    document.getElementById("rangeLabel").textContent = frame.range;
    document.getElementById("countLabel").textContent = frame.count;
    document.getElementById("frameNote").textContent = frame.note;
    document.getElementById("prevBtn").disabled = state.index === 0;
    document.getElementById("nextBtn").disabled = state.index === frames.length - 1;
    document.getElementById("progressBar").style.width = `${(state.index / (frames.length - 1)) * 100}%`;
  }

  function go(delta) {
    const frames = topic.sample.frames;
    state.index = Math.max(0, Math.min(frames.length - 1, state.index + delta));
    renderFrame();
    if (state.index === frames.length - 1) stop();
  }

  function play() {
    if (state.timer !== null) {
      stop();
      return;
    }
    if (prefersReducedMotion) {
      document.getElementById("frameNote").textContent =
        "系统已开启“减少动效”，请使用上一步和下一步按钮查看。";
      return;
    }
    if (state.index === topic.sample.frames.length - 1) state.index = 0;
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
      state.index = 0;
      renderFrame();
    });
    document.getElementById("playBtn").addEventListener("click", play);
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
    renderFrame();
  }

  renderRoadmap();
  renderTests();
  bindDemo();
}());
