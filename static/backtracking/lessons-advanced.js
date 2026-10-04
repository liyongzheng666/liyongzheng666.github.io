(function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function snapshot(action, message, line, path, depth, variables, answers, extra) {
    return Object.assign({
      action,
      message,
      line,
      path: clone(path || []),
      depth: depth || 0,
      nodeId: null,
      parentId: null,
      edgeLabel: "",
      variables: clone(variables || {}),
      answers: clone(answers || [])
    }, extra || {});
  }

  function mergeExtra(extra) {
    const result = Object.assign({}, extra || {});
    delete result.variables;
    return result;
  }

  const LINE_MAP = {};

  function findLine(code, needle) {
    const lines = code.split("\n");
    const index = lines.findIndex((line) => line.includes(needle));
    return index === -1 ? 1 : index + 1;
  }

  function findLineLast(code, needle) {
    const lines = code.split("\n");
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].includes(needle)) return index + 1;
    }
    return 1;
  }

  function findLineAfter(code, before, needle) {
    const lines = code.split("\n");
    const start = lines.findIndex((line) => line.includes(before));
    for (let index = Math.max(0, start + 1); index < lines.length; index += 1) {
      if (lines[index].includes(needle)) return index + 1;
    }
    return findLine(code, needle);
  }

  function withLines(id, frames) {
    const map = LINE_MAP[id] || {};
    return frames.map((frame) => {
      const next = Object.assign({}, frame);
      if (frame.action === "enter") next.line = map.enter || frame.line;
      if (frame.action === "choose") {
        if (frame.variables && frame.variables.childNodeId && id === "79") next.line = map.chooseNeighbor || map.choose || frame.line;
        else next.line = map.choose || frame.line;
      }
      if (frame.action === "undo") next.line = map.undo || frame.line;
      if (frame.action === "resume") next.line = map.resume || frame.line;
      if (frame.action === "answer") {
        if (id === "132" && frame.variables && frame.variables.result !== undefined) next.line = map.returnLine || frame.line;
        else if (id === "132" && frame.variables && frame.variables.updateKind === "leftZero") next.line = map.answerLeftZero || map.answer || frame.line;
        else if (id === "132" && frame.variables && frame.variables.updateKind === "minUpdate") next.line = map.answerMin || map.answer || frame.line;
        else next.line = map.answer || frame.line;
      }
      if (frame.action === "return") {
        if (frame.variables && frame.variables.returning === false) {
          if (frame.variables.reason === "bounds") next.line = map.returnBounds || map.returnFalse || map.returnLine || frame.line;
          else if (frame.variables.reason === "visited") next.line = map.returnVisited || map.returnFalse || map.returnLine || frame.line;
          else if (frame.variables.reason === "mismatch") next.line = map.returnMismatch || map.returnFalse || map.returnLine || frame.line;
          else next.line = map.returnFalse || map.returnLine || frame.line;
        } else if (frame.variables && frame.variables.returnedNodeId) {
          next.line = map.returnTrueFromChild || map.returnTrue || map.returnLine || frame.line;
        } else {
          next.line = map.returnTrue || map.returnLine || frame.line;
        }
      }
      if (frame.action === "pal") next.line = map.pal || frame.line;
      if (frame.action === "prune") {
        if (frame.variables && frame.variables.reason === "same depth duplicate") next.line = map.pruneDuplicate || map.prune || frame.line;
        else if (frame.variables && frame.variables.isPalindrome === false) next.line = map.prunePalindrome || map.prune || frame.line;
        else if (frame.variables && (frame.variables.reason === "too large" || frame.variables.reason === "sorted candidates")) next.line = map.pruneLarge || map.prune || frame.line;
        else if (frame.variables && frame.variables.reason === "bounds") next.line = map.pruneBounds || map.prune || frame.line;
        else if (frame.variables && frame.variables.reason === "visited") next.line = map.pruneVisited || map.prune || frame.line;
        else if (frame.variables && frame.variables.reason === "mismatch") next.line = map.pruneMismatch || map.prune || frame.line;
        else if (frame.variables && frame.variables.reason === "no-improve" && frame.variables.left === 0) next.line = map.pruneNoImproveLeftZero || map.pruneNoImprove || map.prune || frame.line;
        else if (frame.variables && frame.variables.reason === "no-improve") next.line = map.pruneNoImprove || map.prune || frame.line;
        else next.line = map.prune || frame.line;
      }
      next.done = frame.action === "return" && frame.parentId === null;
      return next;
    });
  }

  function traceCombinationSum(input) {
    const candidates = (input && input.candidates ? input.candidates : [2, 3, 5]).slice().sort((a, b) => a - b);
    const target = input && input.target ? input.target : 8;
    const frames = [];
    const path = [];
    const answers = [];
    let nextNode = 0;

    function newNodeId() {
      nextNode += 1;
      return `39-n${nextNode}`;
    }

    function push(action, message, line, start, remain, depth, nodeId, parentId, edgeLabel, extra) {
      const variables = Object.assign({
        candidates,
        start,
        remain,
        target
      }, extra && extra.variables ? extra.variables : {});
      frames.push(snapshot(action, message, line, path, depth, variables, answers, Object.assign({
        nodeId,
        parentId,
        edgeLabel
      }, mergeExtra(extra))));
    }

    function dfs(start, remain, depth, nodeId, parentId, edgeLabel) {
      push("enter", `进入 dfs(start=${start}, remain=${remain})，当前 path=[${path.join(", ")}]`, 12, start, remain, depth, nodeId, parentId, edgeLabel);
      if (remain === 0) {
        answers.push(path.slice());
        push("answer", `remain 归零，记录组合 [${path.join(", ")}]`, 14, start, remain, depth, nodeId, parentId, edgeLabel);
        push("return", "这个节点完成，返回父节点继续枚举兄弟分支", 15, start, remain, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
        return;
      }
      for (let i = start; i < candidates.length; i += 1) {
        const value = candidates[i];
        if (value > remain) {
          push("prune", `${value} 已经大于 remain=${remain}，后面更大，直接剪枝`, 19, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, reason: "sorted candidates" } });
          break;
        }
        const childId = newNodeId();
        path.push(value);
        push("choose", `已经 push ${value}，创建子节点 ${childId}，下一层仍从 i=${i} 开始`, 21, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, childNodeId: childId, nextStart: i, nextRemain: remain - value, startCandidate: i, endCandidate: i } });
        dfs(i, remain - value, depth + 1, childId, nodeId, `选 ${value}@${i}`);
        path.pop();
        push("undo", `子节点 ${childId} 返回后，撤销 ${value}，回到同一层尝试下一个候选数`, 24, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, returnedNodeId: childId } });
      }
      push("return", "本层候选枚举完毕，返回父节点", 26, start, remain, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
    }

    dfs(0, target, 0, newNodeId(), null, "root");
    return frames;
  }

  function traceCombinationSum2(input) {
    const candidates = (input && input.candidates ? input.candidates : [10, 1, 2, 7, 6, 1, 5]).slice().sort((a, b) => a - b);
    const target = input && input.target ? input.target : 8;
    const frames = [];
    const path = [];
    const answers = [];
    let nextNode = 0;

    function newNodeId() {
      nextNode += 1;
      return `40-n${nextNode}`;
    }

    function push(action, message, line, start, remain, depth, nodeId, parentId, edgeLabel, extra) {
      const variables = Object.assign({
        candidates,
        start,
        remain,
        target
      }, extra && extra.variables ? extra.variables : {});
      frames.push(snapshot(action, message, line, path, depth, variables, answers, Object.assign({
        nodeId,
        parentId,
        edgeLabel
      }, mergeExtra(extra))));
    }

    function dfs(start, remain, depth, nodeId, parentId, edgeLabel) {
      push("enter", `进入 dfs(start=${start}, remain=${remain})，这一层只能向右选`, 13, start, remain, depth, nodeId, parentId, edgeLabel);
      if (remain === 0) {
        answers.push(path.slice());
        push("answer", `得到一个不重复组合 [${path.join(", ")}]`, 15, start, remain, depth, nodeId, parentId, edgeLabel);
        push("return", "答案节点结束，返回上一层继续检查同层去重和剪枝", 16, start, remain, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
        return;
      }
      for (let i = start; i < candidates.length; i += 1) {
        const value = candidates[i];
        if (i > start && value === candidates[i - 1]) {
          push("prune", `跳过 candidates[${i}]=${value}：同一层前一个 ${value} 已经做过分支`, 21, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, previous: candidates[i - 1], startCandidate: start, endCandidate: i, reason: "same depth duplicate" } });
          continue;
        }
        if (value > remain) {
          push("prune", `${value} > remain=${remain}，排序后可以停止本层循环`, 25, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, reason: "too large" } });
          break;
        }
        const childId = newNodeId();
        path.push(value);
        push("choose", `已经 push ${value}，子节点 ${childId} 下一层从 ${i + 1} 开始`, 28, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, childNodeId: childId, nextStart: i + 1, nextRemain: remain - value, startCandidate: i, endCandidate: i } });
        dfs(i + 1, remain - value, depth + 1, childId, nodeId, `选 ${value}@${i}`);
        path.pop();
        push("undo", `子节点 ${childId} 返回后，撤销 ${value}，继续找同一层的其他首选项`, 31, i, remain, depth, nodeId, parentId, edgeLabel, { variables: { i, value, returnedNodeId: childId } });
      }
      push("return", "本层枚举结束，返回父节点", 33, start, remain, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
    }

    dfs(0, target, 0, newNodeId(), null, "root");
    return frames;
  }

  function tracePartition(input) {
    const s = typeof input === "string" ? input : (input && input.s ? input.s : "aabbaa");
    const frames = [];
    const path = [];
    const answers = [];
    let nextNode = 0;

    function newNodeId() {
      nextNode += 1;
      return `131-n${nextNode}`;
    }

    function isPalindrome(left, right) {
      let l = left;
      let r = right;
      while (l < r) {
        if (s[l] !== s[r]) return false;
        l += 1;
        r -= 1;
      }
      return true;
    }

    function push(action, message, line, index, depth, nodeId, parentId, edgeLabel, extra) {
      const variables = Object.assign({
        s,
        index,
        start: index,
        remaining: s.slice(index)
      }, extra && extra.variables ? extra.variables : {});
      frames.push(snapshot(action, message, line, path, depth, variables, answers, Object.assign({
        nodeId,
        parentId,
        edgeLabel
      }, mergeExtra(extra))));
    }

    function dfs(index, depth, nodeId, parentId, edgeLabel) {
      push("enter", `进入节点 ${nodeId}：从 index=${index} 开始切，path=[${path.join(" | ")}]`, 18, index, depth, nodeId, parentId, edgeLabel);
      if (index === s.length) {
        answers.push(path.slice());
        push("answer", `index 到达末尾，记录一种切法：${path.join(" | ")}`, 20, index, depth, nodeId, parentId, edgeLabel);
        push("return", `节点 ${nodeId} 是答案叶子，返回父节点 ${parentId || "null"}`, 21, index, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
        return;
      }
      for (let end = index; end < s.length; end += 1) {
        const piece = s.slice(index, end + 1);
        const ok = isPalindrome(index, end);
        if (!ok) {
          push("prune", `候选 s[${index}..${end}]="${piece}" 不是回文，跳过：不会创建递归子节点`, 25, index, depth, nodeId, parentId, edgeLabel, { variables: { start: index, end, startCandidate: index, endCandidate: end, piece, isPalindrome: false } });
          continue;
        }
        const childId = newNodeId();
        path.push(piece);
        push("choose", `已经 push "${piece}"，创建子节点 ${childId}`, 28, index, depth, nodeId, parentId, edgeLabel, { variables: { start: index, end, startCandidate: index, endCandidate: end, piece, isPalindrome: true, childNodeId: childId, nextIndex: end + 1 } });
        dfs(end + 1, depth + 1, childId, nodeId, `切 "${piece}" [${index},${end}]`);
        path.pop();
        push("undo", `子节点 ${childId} 返回，撤销 "${piece}"，继续在节点 ${nodeId} 扩大 end 找兄弟边`, 31, index, depth, nodeId, parentId, edgeLabel, { variables: { start: index, end, startCandidate: index, endCandidate: end, piece, returnedNodeId: childId } });
      }
      push("return", `节点 ${nodeId} 的所有候选区间都检查完，返回父节点 ${parentId || "null"}`, 33, index, depth, nodeId, parentId, edgeLabel, { variables: { returning: true } });
    }

    dfs(0, 0, newNodeId(), null, "root");
    return frames;
  }

  function traceWordSearch(input) {
    const board = input && input.board ? input.board.map((row) => row.slice()) : [
      ["A", "B", "C", "E"],
      ["S", "F", "C", "S"],
      ["A", "D", "E", "E"]
    ];
    const word = input && input.word ? input.word : "ABCCED";
    const rows = board.length;
    const cols = board[0].length;
    const used = Array.from({ length: rows }, () => Array(cols).fill(false));
    const frames = [];
    const path = [];
    const answers = [];
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let nextNode = 0;

    function newNodeId() {
      nextNode += 1;
      return `79-n${nextNode}`;
    }

    function boardState() {
      return board.map((row, r) => row.map((ch, c) => used[r][c] ? `${ch}*` : ch));
    }

    function visitedState() {
      return used.map((row) => row.map(Boolean));
    }

    function push(action, message, line, r, c, k, depth, nodeId, parentId, edgeLabel, extra) {
      const variables = Object.assign({
        r,
        c,
        k,
        need: word[k] || "",
        word,
        visited: visitedState()
      }, extra && extra.variables ? extra.variables : {});
      frames.push(snapshot(action, message, line, path, depth, variables, answers, Object.assign({
        nodeId,
        parentId,
        edgeLabel,
        board: boardState()
      }, mergeExtra(extra))));
    }

    function dfs(r, c, k, depth, nodeId, parentId, edgeLabel) {
      push("enter", `进入节点 ${nodeId}：检查 (${r},${c}) 是否能匹配 word[${k}]`, 10, r, c, k, depth, nodeId, parentId, edgeLabel);
      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        push("prune", `(${r},${c}) 越界，返回 false`, 16, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { reason: "bounds" } });
        push("return", `节点 ${nodeId} 失败返回`, 16, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { returning: false, reason: "bounds" } });
        return false;
      }
      if (used[r][c]) {
        push("prune", `(${r},${c}) 已经在当前路径里，不能重复使用`, 17, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { reason: "visited" } });
        push("return", `节点 ${nodeId} 失败返回`, 17, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { returning: false, reason: "visited" } });
        return false;
      }
      if (board[r][c] !== word[k]) {
        push("prune", `(${r},${c}) 是 ${board[r][c]}，但需要 ${word[k]}，返回 false`, 18, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returning: false, reason: "mismatch" } });
        push("return", `节点 ${nodeId} 字符不匹配，返回父节点`, 18, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { returning: false, reason: "mismatch" } });
        return false;
      }

      used[r][c] = true;
      path.push(`${r},${c}:${board[r][c]}`);
      push("choose", `匹配 ${word[k]}，把 (${r},${c}) 放入路径`, 22, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { start: r, end: c, cell: board[r][c] } });

      if (k === word.length - 1) {
        answers.push(path.slice());
        push("answer", `已经匹配到最后一个字符 ${word[k]}，整词存在`, 24, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c] } });
        path.pop();
        used[r][c] = false;
        push("undo", `成功结果已向上传递，同时释放 (${r},${c}) 便于动画复位`, 25, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returning: true } });
        push("return", `节点 ${nodeId} 成功返回父节点 ${parentId || "null"}`, 26, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returning: true } });
        return true;
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        const childId = newNodeId();
        push("choose", `从 (${r},${c}) 试探下一格 (${nr},${nc})，创建子节点 ${childId}`, 29, nr, nc, k + 1, depth, nodeId, parentId, edgeLabel, { variables: { childNodeId: childId, nextR: nr, nextC: nc, nextK: k + 1 } });
        if (dfs(nr, nc, k + 1, depth + 1, childId, nodeId, `到 (${nr},${nc}) 找 ${word[k + 1]}`)) {
          push("resume", `子节点 ${childId} 返回 true，节点 ${nodeId} 准备恢复 visited 和 path`, 31, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returnedNodeId: childId, childReturned: true } });
          path.pop();
          used[r][c] = false;
          push("undo", `子节点 ${childId} 已成功，(${r},${c}) 释放并返回 true`, 31, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returnedNodeId: childId, returning: true } });
          push("return", `节点 ${nodeId} 成功返回父节点 ${parentId || "null"}`, 32, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c], returnedNodeId: childId, returning: true } });
          return true;
        }
      }

      path.pop();
      used[r][c] = false;
      push("undo", `四个方向都失败，撤销 (${r},${c})`, 36, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { cell: board[r][c] } });
      push("return", `节点 ${nodeId} 没有找到后续字符，返回 false`, 37, r, c, k, depth, nodeId, parentId, edgeLabel, { variables: { returning: false, reason: "exhausted" } });
      return false;
    }

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const rootId = newNodeId();
        if (dfs(r, c, 0, 0, rootId, null, `起点 (${r},${c})`)) return frames;
      }
    }
    push("answer", "所有起点都失败，word 不存在", 47, -1, -1, 0, 0, null, null, "");
    return frames;
  }

  function traceMinCut(input) {
    const s = input && input.s ? input.s : "aabbaab";
    const n = s.length;
    const pal = Array.from({ length: n }, () => Array(n).fill(false));
    const cut = Array.from({ length: n }, (_, i) => i);
    const frames = [];

    function palView() {
      return pal.map((row) => row.map((value) => value ? "T" : "."));
    }

    function push(action, message, line, variables) {
      frames.push(snapshot(action, message, line, [], 0, Object.assign({ s }, variables || {}), [], {
        dp: cut.slice(),
        board: palView()
      }));
    }

    for (let len = 1; len <= n; len += 1) {
      for (let left = 0; left + len - 1 < n; left += 1) {
        const right = left + len - 1;
        if (s[left] === s[right] && (len <= 2 || pal[left + 1][right - 1])) {
          pal[left][right] = true;
          push("pal", `pal[${left}][${right}]=true，"${s.slice(left, right + 1)}" 是回文`, 14, { left, right, len, piece: s.slice(left, right + 1) });
        }
      }
    }

    for (let right = 0; right < n; right += 1) {
      push("enter", `计算 cut[${right}]：枚举最后一段回文 s[left..${right}]`, 21, { right, currentCut: cut[right] });
      for (let left = 0; left <= right; left += 1) {
        if (!pal[left][right]) {
          push("prune", `s[${left}..${right}]="${s.slice(left, right + 1)}" 不是回文，不能当最后一段`, 24, { left, right, piece: s.slice(left, right + 1), isPalindrome: false });
          continue;
        }
        const candidate = left === 0 ? 0 : cut[left - 1] + 1;
        push("choose", `最后一段取 "${s.slice(left, right + 1)}"，候选切数=${candidate}`, 28, { left, right, piece: s.slice(left, right + 1), candidate, previous: cut[right] });
        if (candidate < cut[right]) {
          cut[right] = candidate;
          push("answer", `更新 cut[${right}]=${candidate}`, 30, { left, right, candidate, updateKind: left === 0 ? "leftZero" : "minUpdate" });
        } else {
          push("prune", `候选 ${candidate} 没有优于当前 cut[${right}]=${cut[right]}`, 32, { left, right, candidate, currentCut: cut[right], reason: "no-improve" });
        }
      }
    }
    push("answer", `最终最少切 ${cut[n - 1]} 刀；注意这里没有枚举所有切法`, 36, { result: cut[n - 1] });
    return frames;
  }

  const lessons = [
    {
      id: "39",
      title: "LC39 组合总和",
      stage: "进阶 06｜可重复选择",
      url: "https://leetcode.com/problems/combination-sum/",
      goal: "把“同一个数可以选多次”落实到递归参数：选了 candidates[i] 以后，下一层仍然从 i 开始。",
      statement: "给你一个无重复正整数数组 candidates 和目标 target，找出所有和为 target 的组合。同一个数字可以被选择任意次，组合内顺序不重要。",
      example: {
        input: "candidates = [2,3,5], target = 8",
        output: "[[2,2,2,2],[2,3,3],[3,5]]",
        expected: "先通过 start 固定组合顺序，再用 remain 控制目标余额。"
      },
      concepts: [
        { name: "start", text: "当前层允许从哪个下标开始选。它防止 [2,3,2] 和 [2,2,3] 这种同一组合的排列重复。" },
        { name: "remain", text: "还差多少能凑到 target。remain 为 0 时记录答案，候选数大于 remain 时剪枝。" },
        { name: "可重复", text: "递归调用写 dfs(i, remain - value)，不是 dfs(i + 1, ...)。这一个参数就是本题和 LC40 的核心差别。" }
      ],
      walkthrough: [
        "先排序，这样当 value > remain 时，本层后面的值都不用试。",
        "每层循环从 start 开始，保证组合按下标非递减生成。",
        "选择一个数后 push 到 path，递归进入下一层。",
        "递归回来必须 pop，恢复给同一层下一个分支使用。"
      ],
      pitfalls: [
        "把下一层写成 i + 1 会变成每个数只能用一次。",
        "没有 start 会出现同一组合的不同排列。",
        "记录答案时要拷贝 path，不能保存引用。"
      ],
      checks: [
        "为什么 [2,2,3] 之后不会再出现 [2,3,2]？",
        "当 path=[2,2]、remain=3 时，下一层 start 应该是多少？",
        "撤销动作发生在递归返回前还是返回后？"
      ],
      hints: [
        "先写出 dfs(start, remain) 的含义。",
        "终止条件只看 remain 是否为 0。",
        "画 [2,3,6,7], target=7 的树，重点看 dfs(i, remain-value) 的 i。"
      ],
      starter: `#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

// TODO:
// 1. 解释 start/remain/path/answer 四个变量。
// 2. 在 dfs 里选择 candidates[i] 后递归。
// 3. 想清楚：为什么下一层仍然传 i？
vector<vector<int>> combinationSum(vector<int> candidates, int target) {
    sort(candidates.begin(), candidates.end());
    vector<vector<int>> answer;
    vector<int> path;

    function<void(int, int)> dfs = [&]([[maybe_unused]] int start, [[maybe_unused]] int remain) {
        // TODO: remain == 0 时记录 path
        // TODO: for i from start
        // TODO: 剪枝、选择、递归、撤销
    };

    dfs(0, target);
    return answer;
}

int main() {
    vector<int> candidates{2, 3, 5};
    auto answer = combinationSum(candidates, 8);
    cout << answer.size() << '\\n';
}`,
      code: `#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> combinationSum(vector<int> candidates, int target) {
    sort(candidates.begin(), candidates.end());
    vector<vector<int>> answer; // answer 保存所有合法组合
    vector<int> path;           // path 保存当前递归路径已经选择的数字

    function<void(int, int)> dfs = [&](int start, int remain) {
        // start: 本层可以选择的最小下标；remain: 距离 target 还差多少
        if (remain == 0) {
            answer.push_back(path);
            return;
        }
        for (int i = start; i < (int)candidates.size(); ++i) {
            int value = candidates[i];
            if (value > remain) break;
            path.push_back(value);
            dfs(i, remain - value); // i 不变，所以 value 下一层还可以继续选
            path.pop_back();
        }
    };

    dfs(0, target);
    return answer;
}

int main() {
    vector<int> candidates{2, 3, 5};
    auto answer = combinationSum(candidates, 8);
    cout << '[';
    for (int r = 0; r < (int)answer.size(); ++r) {
        if (r) cout << ',';
        cout << '[';
        const auto& row = answer[r];
        for (int i = 0; i < (int)row.size(); ++i) {
            if (i) cout << ',';
            cout << row[i];
        }
        cout << ']';
    }
    cout << "]\\n";
}`,
      trace: (input) => withLines("39", traceCombinationSum(input))
    },
    {
      id: "40",
      title: "LC40 组合总和 II",
      stage: "进阶 07｜不可重复 + 同层去重",
      url: "https://leetcode.com/problems/combination-sum-ii/",
      goal: "把“每个元素只能用一次”和“输入有重复值但答案不能重复”拆成两个独立规则。",
      statement: "给你一个可能有重复数字的 candidates 和 target。每个数组元素最多使用一次，返回所有不重复的和为 target 的组合。",
      example: {
        input: "candidates = [10,1,2,7,6,1,5], target = 8",
        output: "[[1,1,6],[1,2,5],[1,7],[2,6]]",
        expected: "排序后用 i > start && candidates[i] == candidates[i-1] 跳过同层重复分支。"
      },
      concepts: [
        { name: "不可重复", text: "选择 candidates[i] 后，下一层从 i+1 开始。这个规则保证同一个下标不会用两次。" },
        { name: "同层去重", text: "只有 i > start 且当前值等于前一个值时才跳过。不同层的两个 1 可以一起出现，例如 [1,1,6]。" },
        { name: "排序", text: "排序让相同值相邻，也让 value > remain 的剪枝成立。" }
      ],
      walkthrough: [
        "先排序，把重复数字放到一起。",
        "每一层枚举 i，从 start 到末尾。",
        "如果 i > start 且 candidates[i] == candidates[i-1]，说明同层前一个相同值已经开过分支，跳过。",
        "递归时传 i+1，因为每个下标只能使用一次。"
      ],
      pitfalls: [
        "把去重写成 i > 0 会误删不同层的重复值。",
        "递归时传 i 会把本题做成 LC39。",
        "没有排序就无法正确做同层去重。"
      ],
      checks: [
        "为什么 [1,1,6] 合法，但同一层第二个 1 要跳过？",
        "i > start 中的 start 是谁的 start？",
        "LC39 和 LC40 的递归参数只有哪一处不同？"
      ],
      hints: [
        "把排序后的 [1,1,2,5] target=3 画出来。",
        "同层去重只管“同一层的选择入口”。",
        "用下标区分两个 1，用数值判断重复分支。"
      ],
      starter: `#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

// TODO:
// 1. 排序。
// 2. 写 dfs(start, remain)。
// 3. 加同层去重：i > start && candidates[i] == candidates[i - 1]。
vector<vector<int>> combinationSum2([[maybe_unused]] vector<int> candidates, [[maybe_unused]] int target) {
    vector<vector<int>> answer;
    vector<int> path;
    return answer;
}

int main() {
    vector<int> candidates{10, 1, 2, 7, 6, 1, 5};
    auto answer = combinationSum2(candidates, 8);
    cout << answer.size() << '\\n';
}`,
      code: `#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> combinationSum2(vector<int> candidates, int target) {
    sort(candidates.begin(), candidates.end());
    vector<vector<int>> answer;
    vector<int> path;

    function<void(int, int)> dfs = [&](int start, int remain) {
        if (remain == 0) {
            answer.push_back(path);
            return;
        }
        for (int i = start; i < (int)candidates.size(); ++i) {
            int value = candidates[i];
            if (i > start && value == candidates[i - 1]) continue; // 同层重复入口
            if (value > remain) break;
            path.push_back(value);
            dfs(i + 1, remain - value); // i + 1 表示当前下标不能再用
            path.pop_back();
        }
    };

    dfs(0, target);
    return answer;
}

int main() {
    vector<int> candidates{10, 1, 2, 7, 6, 1, 5};
    auto answer = combinationSum2(candidates, 8);
    cout << '[';
    for (int r = 0; r < (int)answer.size(); ++r) {
        if (r) cout << ',';
        cout << '[';
        const auto& row = answer[r];
        for (int i = 0; i < (int)row.size(); ++i) {
            if (i) cout << ',';
            cout << row[i];
        }
        cout << ']';
    }
    cout << "]\\n";
}`,
      trace: (input) => withLines("40", traceCombinationSum2(input))
    },
    {
      id: "131",
      title: "LC131 分割回文串",
      stage: "进阶 08｜切分型回溯",
      url: "https://leetcode.com/problems/palindrome-partitioning/",
      goal: "把“选择一个数”升级成“选择一段区间”，先用直接回文检查掌握搜索树，再理解回文 DP 优化。",
      statement: "给定字符串 s，把 s 分割成若干子串，使每个子串都是回文，返回所有可能的分割方案。",
      example: {
        input: "s = \"aabbaa\"",
        output: "[[\"a\",\"a\",\"b\",\"b\",\"a\",\"a\"],[\"a\",\"a\",\"b\",\"b\",\"aa\"],[\"a\",\"a\",\"bb\",\"a\",\"a\"],[\"a\",\"a\",\"bb\",\"aa\"],[\"a\",\"abba\",\"a\"],[\"aa\",\"b\",\"b\",\"a\",\"a\"],[\"aa\",\"b\",\"b\",\"aa\"],[\"aa\",\"bb\",\"a\",\"a\"],[\"aa\",\"bb\",\"aa\"],[\"aabbaa\"]]",
        expected: "每一层从 index 开始枚举 end，只有 s[index..end] 是回文时才递归。"
      },
      concepts: [
        { name: "index", text: "下一段必须从哪里开始。index 到达 s.size() 时，说明整串刚好被切完。" },
        { name: "end", text: "当前层尝试把 s[index..end] 作为下一段。end 扩大，选择的子串也变长。" },
        { name: "直接检查", text: "初学先用双指针判断 s[index..end] 是否回文；等搜索树想明白后，再把这一步换成 pal[index][end]。" }
      ],
      walkthrough: [
        "在 index=0 时，先走最左深分支：\"a\" -> \"a\" -> \"b\" -> \"b\" -> \"a\" -> \"a\"，得到第一种逐字符切法。",
        "回到 index=4 的节点后，兄弟边 \"aa\" 也合法，于是同一条前缀会生成 \"a\" | \"a\" | \"b\" | \"b\" | \"aa\"。",
        "继续返回到 index=2，可以把两个 b 合成 \"bb\"，再接后面的 \"a\" | \"a\" 或 \"aa\"。",
        "回到根节点时，\"aa\" 这条边还能走出 \"aa\" | \"bb\" | \"aa\"；\"aab\"、\"aabb\"、\"aabba\" 会被明确拒绝，整段 \"aabbaa\" 是最后一条长回文边。"
      ],
      pitfalls: [
        "把 index 写成 index + 1 会漏掉长度大于 1 的子串。",
        "忘记 pop 会把上一条切法污染到下一条。",
        "LC131 返回所有切法，LC132 只返回最少切几刀，两题目标不同。"
      ],
      checks: [
        "为什么 dfs(end + 1) 而不是 dfs(index + 1)？",
        "path 里放的是字符、下标，还是子串？",
        "如果 s=\"aaa\"，答案数量为什么不是只看不同字符串？"
      ],
      hints: [
        "先写 isPalindrome(s, left, right)。",
        "dfs(index) 的循环变量叫 end，含义会更清楚。",
        "终止条件是 index == s.size()。"
      ],
      starter: `#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// TODO:
// 1. 写 isPalindrome(s, left, right)。
// 2. dfs(index) 里枚举 end。
// 3. 只有 s[index..end] 是回文时才 push + dfs(end + 1)。
vector<vector<string>> partition([[maybe_unused]] string s) {
    vector<vector<string>> answer;
    vector<string> path;
    return answer;
}

int main() {
    auto answer = partition("aabbaa");
    cout << answer.size() << '\\n';
}`,
      code: `#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool isPalindrome(const string& s, int left, int right) {
    while (left < right) {
        if (s[left] != s[right]) return false;
        ++left;
        --right;
    }
    return true;
}

vector<vector<string>> partition(string s) {
    vector<vector<string>> answer;
    vector<string> path;

    function<void(int)> dfs = [&](int index) {
        if (index == (int)s.size()) {
            answer.push_back(path);
            return;
        }
        for (int end = index; end < (int)s.size(); ++end) {
            if (!isPalindrome(s, index, end)) continue;
            string piece = s.substr(index, end - index + 1);
            path.push_back(piece);
            dfs(end + 1);
            path.pop_back();
        }
    };

    dfs(0);
    return answer;
}

int main() {
    auto answer = partition("aabbaa");
    cout << '[';
    for (int r = 0; r < (int)answer.size(); ++r) {
        if (r) cout << ',';
        cout << '[';
        const auto& row = answer[r];
        for (int i = 0; i < (int)row.size(); ++i) {
            if (i) cout << ',';
            cout << '"' << row[i] << '"';
        }
        cout << ']';
    }
    cout << "]\\n";
}`,
      trace: (input) => withLines("131", tracePartition(input))
    },
    {
      id: "79",
      title: "LC79 单词搜索",
      stage: "进阶 09｜二维路径回溯",
      url: "https://leetcode.com/problems/word-search/",
      goal: "把 path 从一维数组升级为网格坐标，并用 visited 管住“当前路径不能重复使用同一个格子”。",
      statement: "给定字符网格 board 和字符串 word，判断 word 是否可以由相邻格子的字符依次组成。相邻指上下左右，同一个格子不能重复使用。",
      example: {
        input: "board = [[A,B,C,E],[S,F,C,S],[A,D,E,E]], word = \"ABCCED\"",
        output: "true",
        expected: "路径为 (0,0)A -> (0,1)B -> (0,2)C -> (1,2)C -> (2,2)E -> (2,1)D。"
      },
      concepts: [
        { name: "k", text: "当前要匹配 word[k]。当 k 到达最后一个字符且匹配成功，就可以返回 true。" },
        { name: "visited", text: "只表示当前递归路径里哪些格子被用过。递归返回时要恢复，给别的起点和分支使用。" },
        { name: "成功回传", text: "某个方向返回 true 后，上层不需要继续试其他方向，直接把 true 往外传。" }
      ],
      walkthrough: [
        "枚举每一个格子作为起点。",
        "进入 dfs(r,c,k) 后，先做越界、已访问、字符不匹配三类剪枝。",
        "匹配成功就标记 visited，并向四个方向寻找 word[k+1]。",
        "方向成功时一路返回 true；方向都失败时撤销当前格子并返回 false。"
      ],
      pitfalls: [
        "visited 不能是全局永久标记，它只属于当前 path。",
        "匹配最后一个字符后应立即成功，不必再走下一格。",
        "先判断越界再读 board[r][c]，否则会访问非法位置。"
      ],
      checks: [
        "为什么找到完整单词后要一路返回 true？",
        "撤销 visited 的时机是什么？",
        "如果 word=\"ABA\"，同一个 A 格子能不能重复使用？"
      ],
      hints: [
        "先只写 dfs(r,c,k) 的三类失败条件。",
        "把 visited[r][c] 的设置和恢复夹住四方向搜索。",
        "用四个方向数组减少重复代码。"
      ],
      starter: `#include <functional>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// TODO:
// 1. 枚举每个起点。
// 2. dfs(r, c, k) 判断 board[r][c] 是否匹配 word[k]。
// 3. 设置 visited，搜索四个方向，再恢复 visited。
bool exist([[maybe_unused]] vector<vector<char>> board, [[maybe_unused]] string word) {
    return false;
}

int main() {
    vector<vector<char>> board{{'A','B','C','E'}, {'S','F','C','S'}, {'A','D','E','E'}};
    cout << boolalpha << exist(board, "ABCCED") << '\\n';
}`,
      code: `#include <functional>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

bool exist(vector<vector<char>> board, string word) {
    int rows = board.size();
    int cols = board[0].size();
    vector<vector<int>> visited(rows, vector<int>(cols, 0));
    vector<pair<int, int>> dirs{{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    function<bool(int, int, int)> dfs = [&](int r, int c, int k) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
        if (visited[r][c]) return false;
        if (board[r][c] != word[k]) return false;

        visited[r][c] = 1;
        if (k == (int)word.size() - 1) {
            visited[r][c] = 0;
            return true;
        }

        for (auto [dr, dc] : dirs) {
            if (dfs(r + dr, c + dc, k + 1)) {
                visited[r][c] = 0;
                return true;
            }
        }

        visited[r][c] = 0;
        return false;
    };

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (dfs(r, c, 0)) return true;
        }
    }
    return false;
}

int main() {
    vector<vector<char>> board{{'A','B','C','E'}, {'S','F','C','S'}, {'A','D','E','E'}};
    cout << boolalpha << exist(board, "ABCCED") << '\\n';
}`,
      trace: (input) => withLines("79", traceWordSearch(input))
    },
    {
      id: "132",
      title: "LC132 分割回文串 II",
      stage: "终章 10｜从枚举切法到最小切数",
      url: "https://leetcode.com/problems/palindrome-partitioning-ii/",
      goal: "看清 LC132 不是把 LC131 的回溯继续写深，而是把“所有切法”压缩成“前缀最优”。",
      statement: "给定字符串 s，把 s 分割成若干回文子串，返回最少需要切几刀。",
      example: {
        input: "s = \"aabbaab\"",
        output: "1",
        expected: "切成 \"aabbaa\" | \"b\"，只需要 1 刀，同时 DP 表会经历多个前缀更新。"
      },
      concepts: [
        { name: "pal[left][right]", text: "预处理 s[left..right] 是否回文。它替代 LC131 中每次递归前的直接检查。" },
        { name: "cut[right]", text: "s[0..right] 最少切几刀。答案是 cut[n-1]。" },
        { name: "最后一段", text: "枚举 left，让 s[left..right] 作为最后一段。如果它是回文，则候选值是 left==0 ? 0 : cut[left-1]+1。" }
      ],
      walkthrough: [
        "先填 pal 表：长度从短到长，保证 pal[left+1][right-1] 已经知道。",
        "再计算 cut[right]，含义是前缀 s[0..right] 的最优答案。",
        "对每个 right，枚举最后一段的起点 left。",
        "只要 s[left..right] 是回文，就用前一段最优 cut[left-1] 加一刀更新。"
      ],
      pitfalls: [
        "这题不需要列出所有切法，回溯会爆炸。",
        "left==0 时候选切数是 0，不是 cut[-1]+1。",
        "pal 表要按区间长度从小到大填。"
      ],
      checks: [
        "为什么 LC131 的 path 在 LC132 里消失了？",
        "cut[right] 和 dp[i][j] 是同一种状态吗？",
        "当最后一段从 left 开始时，为什么只看 cut[left-1]？"
      ],
      hints: [
        "先把所有回文区间列出来。",
        "把问题问成：最后一段回文从哪里开始？",
        "不要在代码里保存切分方案，只保存最小切数。"
      ],
      starter: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// TODO:
// 1. 预处理 pal[left][right]。
// 2. cut[right] 表示 s[0..right] 的最少切数。
// 3. 枚举最后一段回文 s[left..right] 来更新 cut[right]。
int minCut([[maybe_unused]] string s) {
    return 0;
}

int main() {
    cout << minCut("aabbaab") << '\\n';
}`,
      code: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int minCut(string s) {
    int n = s.size();
    vector<vector<int>> pal(n, vector<int>(n, 0));
    vector<int> cut(n, 0);

    for (int len = 1; len <= n; ++len) {
        for (int left = 0; left + len - 1 < n; ++left) {
            int right = left + len - 1;
            if (s[left] == s[right] && (len <= 2 || pal[left + 1][right - 1])) {
                pal[left][right] = 1;
            }
        }
    }

    for (int right = 0; right < n; ++right) {
        cut[right] = right;
        for (int left = 0; left <= right; ++left) {
            if (!pal[left][right]) continue;
            if (left == 0) {
                cut[right] = 0;
            } else {
                cut[right] = min(cut[right], cut[left - 1] + 1);
            }
        }
    }
    return cut[n - 1];
}

int main() {
    cout << minCut("aabbaab") << '\\n';
}`,
      trace: (input) => withLines("132", traceMinCut(input))
    }
  ];

  function buildLineMaps() {
    const byId = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.code]));
    LINE_MAP["39"] = {
      enter: findLine(byId["39"], "function<void(int, int)> dfs"),
      answer: findLine(byId["39"], "answer.push_back(path);"),
      pruneLarge: findLine(byId["39"], "if (value > remain) break;"),
      choose: findLine(byId["39"], "path.push_back(value);"),
      undo: findLine(byId["39"], "path.pop_back();"),
      returnLine: findLine(byId["39"], "return;")
    };
    LINE_MAP["40"] = {
      enter: findLine(byId["40"], "function<void(int, int)> dfs"),
      answer: findLine(byId["40"], "answer.push_back(path);"),
      pruneDuplicate: findLine(byId["40"], "value == candidates[i - 1]"),
      pruneLarge: findLine(byId["40"], "if (value > remain) break;"),
      choose: findLine(byId["40"], "path.push_back(value);"),
      undo: findLine(byId["40"], "path.pop_back();"),
      returnLine: findLine(byId["40"], "return;")
    };
    LINE_MAP["131"] = {
      enter: findLine(byId["131"], "function<void(int)> dfs"),
      answer: findLine(byId["131"], "answer.push_back(path);"),
      prunePalindrome: findLine(byId["131"], "if (!isPalindrome"),
      choose: findLine(byId["131"], "path.push_back(piece);"),
      undo: findLine(byId["131"], "path.pop_back();"),
      returnLine: findLine(byId["131"], "return;")
    };
    LINE_MAP["79"] = {
      enter: findLine(byId["79"], "function<bool(int, int, int)> dfs"),
      pruneBounds: findLine(byId["79"], "if (r < 0 || r >= rows || c < 0 || c >= cols) return false;"),
      pruneVisited: findLine(byId["79"], "if (visited[r][c]) return false;"),
      pruneMismatch: findLine(byId["79"], "if (board[r][c] != word[k]) return false;"),
      choose: findLine(byId["79"], "visited[r][c] = 1;"),
      chooseNeighbor: findLine(byId["79"], "if (dfs(r + dr, c + dc, k + 1))"),
      resume: findLine(byId["79"], "if (dfs(r + dr, c + dc, k + 1))"),
      answer: findLine(byId["79"], "if (k == (int)word.size() - 1)"),
      undo: findLine(byId["79"], "visited[r][c] = 0;"),
      returnBounds: findLine(byId["79"], "if (r < 0 || r >= rows || c < 0 || c >= cols) return false;"),
      returnVisited: findLine(byId["79"], "if (visited[r][c]) return false;"),
      returnMismatch: findLine(byId["79"], "if (board[r][c] != word[k]) return false;"),
      returnFalse: findLineAfter(byId["79"], "visited[r][c] = 0;", "return false;"),
      returnTrue: findLine(byId["79"], "return true;"),
      returnTrueFromChild: findLineAfter(byId["79"], "if (dfs(r + dr, c + dc, k + 1))", "return true;")
    };
    LINE_MAP["132"] = {
      pal: findLine(byId["132"], "pal[left][right] = 1;"),
      enter: findLine(byId["132"], "for (int right = 0;"),
      prunePalindrome: findLine(byId["132"], "if (!pal[left][right]) continue;"),
      pruneNoImproveLeftZero: findLine(byId["132"], "if (left == 0)"),
      pruneNoImprove: findLine(byId["132"], "cut[right] = min(cut[right], cut[left - 1] + 1);"),
      choose: findLine(byId["132"], "if (left == 0)"),
      answerLeftZero: findLine(byId["132"], "cut[right] = 0;"),
      answerMin: findLine(byId["132"], "cut[right] = min(cut[right], cut[left - 1] + 1);"),
      returnLine: findLine(byId["132"], "return cut[n - 1];")
    };
  }

  buildLineMaps();
  window.BT_ADVANCED = lessons;
}());
