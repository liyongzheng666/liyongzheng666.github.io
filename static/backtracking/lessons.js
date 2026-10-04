window.BT_TOPIC = {
  lessonOrder: ["binary", "78", "77", "46", "90", "47", "39", "40", "131", "79", "132"],
  lessons: [
    { stage: "第 0 课", id: "binary", title: "生成长度 3 的 01 串", difficulty: "Warmup", url: "#", method: "递归 + 状态恢复", summary: "先把 choose / dfs / undo 看清楚。" },
    { stage: "第 1 课", id: "78", title: "Subsets", difficulty: "Medium", url: "https://leetcode.com/problems/subsets/", method: "子集树", summary: "每个节点都是一个答案，继续向后选择。" },
    { stage: "第 2 课", id: "77", title: "Combinations", difficulty: "Medium", url: "https://leetcode.com/problems/combinations/", method: "组合 + start", summary: "只取长度 k 的节点，start 防止逆序重复。" },
    { stage: "第 3 课", id: "46", title: "Permutations", difficulty: "Medium", url: "https://leetcode.com/problems/permutations/", method: "排列 + used", summary: "顺序重要，用 used 标记当前路径已经拿过谁。" },
    { stage: "第 4 课", id: "90", title: "Subsets II", difficulty: "Medium", url: "https://leetcode.com/problems/subsets-ii/", method: "子集 + 同层去重", summary: "重复元素只跳过同一层的第二条相同分支。" },
    { stage: "第 5 课", id: "47", title: "Permutations II", difficulty: "Medium", url: "https://leetcode.com/problems/permutations-ii/", method: "排列 + 去重 used", summary: "先排序，同层相同数字只让第一个未使用副本开分支。" },
    { stage: "第 6 课", id: "39", title: "Combination Sum", difficulty: "Medium", url: "https://leetcode.com/problems/combination-sum/", method: "复用选择 + 剪枝", summary: "下一层仍从 i 开始，表示当前数可以重复用。" },
    { stage: "第 7 课", id: "40", title: "Combination Sum II", difficulty: "Medium", url: "https://leetcode.com/problems/combination-sum-ii/", method: "不可复用 + 去重", summary: "下一层从 i+1 开始，同层重复值跳过。" },
    { stage: "第 8 课", id: "131", title: "Palindrome Partitioning", difficulty: "Medium", url: "https://leetcode.com/problems/palindrome-partitioning/", method: "字符串切分回溯", summary: "每次选一段回文，递归处理剩余后缀。" },
    { stage: "第 9 课", id: "79", title: "Word Search", difficulty: "Medium", url: "https://leetcode.com/problems/word-search/", method: "网格 DFS + visited", summary: "沿路径占用格子，返回时恢复 visited。" },
    { stage: "第 10 课", id: "132", title: "Palindrome Partitioning II", difficulty: "Hard", url: "https://leetcode.com/problems/palindrome-partitioning-ii/", method: "回文表 + 前缀 DP", summary: "目标从列出全部切法变成求最少切几刀。" }
  ]
};

(function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function json(value) {
    return JSON.stringify(value);
  }

  function traceBuilder() {
    const frames = [];
    const nodes = [];
    let nextNode = 1;

    function node(parentId, edgeLabel, label) {
      const item = { id: nextNode++, parentId, edgeLabel, label };
      nodes.push(item);
      return item.id;
    }

    function tree(currentId) {
      return nodes.map((item) => {
        const prefix = item.id === currentId ? "*" : " ";
        const parent = item.parentId ? `p${item.parentId}` : "root";
        return `${prefix}#${item.id} ${parent} ${item.edgeLabel}: ${item.label}`;
      });
    }

    function push(frame) {
      frames.push({
        board: null,
        dp: null,
        nodeId: frame.nodeId || 1,
        parentId: frame.parentId || null,
        edgeLabel: frame.edgeLabel || "root",
        action: frame.action,
        message: frame.message,
        line: frame.line,
        path: clone(frame.path || []),
        depth: frame.depth || 0,
        variables: clone(frame.variables || {}),
        answers: clone(frame.answers || []),
        tree: tree(frame.nodeId || 1)
      });
    }

    return { frames, node, push };
  }

  function resultFrame(frames, answer, line) {
    const last = frames[frames.length - 1];
    frames.push({ ...last, action: "done", message: "整棵搜索树处理完毕，最终输出与 C++ main 的 JSON 一致。", line, answers: clone(answer) });
  }

  function binaryTrace() {
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const root = b.node(null, "root", "dfs(pos=0)");

    function dfs(pos, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 17, message: `进入 dfs(pos=${pos})，当前 path 长度为 ${path.length}。`, path, depth, variables: { pos, n: 3 }, answers: ans });
      if (pos === 3) {
        ans.push(path.join(""));
        b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 19, message: `长度达到 3，复制 path 得到 ${path.join("")}。`, path, depth, variables: { pos }, answers: ans });
        b.push({ nodeId, parentId, edgeLabel, action: "return", line: 20, message: "叶子节点返回给上一层，上一层会撤销最后一次选择。", path, depth, variables: { pos }, answers: ans });
        return;
      }
      for (const ch of ["0", "1"]) {
        path.push(ch);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 23, message: `在 pos=${pos} 选择 ${ch}，准备进入下一层。`, path, depth, variables: { pos, choose: ch }, answers: ans });
        const child = b.node(nodeId, `choose ${ch}`, `dfs(pos=${pos + 1})`);
        dfs(pos + 1, child, nodeId, `choose ${ch}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 25, message: `子调用返回，撤销 ${ch}。同一层接着尝试下一个兄弟选择。`, path, depth, variables: { pos, undo: ch }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 27, message: `dfs(pos=${pos}) 的两个分支都结束，返回上一层。`, path, depth, variables: { pos }, answers: ans });
    }

    dfs(0, root, null, "root", 0);
    resultFrame(b.frames, ans, 35);
    return b.frames;
  }

  function subsetsTrace() {
    const nums = [1, 2, 3, 4];
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const root = b.node(null, "root", "dfs(start=0)");

    function dfs(start, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 19, message: `进入 dfs(start=${start})。子集题在每个节点都先收集一次答案。`, path, depth, variables: { start }, answers: ans });
      ans.push([...path]);
      b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 20, message: `复制当前 path：${json(path)}。注意不是等到叶子才收集。`, path, depth, variables: { start }, answers: ans });
      for (let i = start; i < nums.length; i += 1) {
        path.push(nums[i]);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 23, message: `选择 nums[${i}]=${nums[i]}，下一层只能从 ${i + 1} 往后选。`, path, depth, variables: { start, i, value: nums[i] }, answers: ans });
        const child = b.node(nodeId, `take ${nums[i]}`, `dfs(start=${i + 1})`);
        dfs(i + 1, child, nodeId, `take ${nums[i]}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 25, message: `撤销 ${nums[i]}，回到 dfs(start=${start})，同层继续尝试下一个 i。`, path, depth, variables: { start, nextSibling: i + 1 }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 27, message: `dfs(start=${start}) 没有更多候选，返回父调用。`, path, depth, variables: { start }, answers: ans });
    }

    dfs(0, root, null, "root", 0);
    resultFrame(b.frames, ans, 35);
    return b.frames;
  }

  function combineTrace() {
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const n = 5;
    const k = 3;
    const root = b.node(null, "root", "dfs(start=1)");

    function dfs(start, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 19, message: `进入 dfs(start=${start})，还需要 ${k - path.length} 个数。`, path, depth, variables: { start, remaining: k - path.length }, answers: ans });
      if (path.length === k) {
        ans.push([...path]);
        b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 21, message: `path 长度到 k，记录组合 ${json(path)}。`, path, depth, variables: { start }, answers: ans });
        b.push({ nodeId, parentId, edgeLabel, action: "return", line: 22, message: "这一条组合结束，返回后撤销最后一个数。", path, depth, variables: { start }, answers: ans });
        return;
      }
      const limit = n - (k - path.length) + 1;
      for (let x = start; x <= limit; x += 1) {
        path.push(x);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 26, message: `选择 ${x}。剪枝后的本层最大起点是 ${limit}，保证后面还够选。`, path, depth, variables: { start, x, limit }, answers: ans });
        const child = b.node(nodeId, `take ${x}`, `dfs(start=${x + 1})`);
        dfs(x + 1, child, nodeId, `take ${x}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 28, message: `撤销 ${x}，同一层尝试下一个兄弟 ${x + 1}。`, path, depth, variables: { start, nextSibling: x + 1 }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 30, message: `dfs(start=${start}) 返回。`, path, depth, variables: { start }, answers: ans });
    }

    dfs(1, root, null, "root", 0);
    resultFrame(b.frames, ans, 38);
    return b.frames;
  }

  function permuteTrace(unique) {
    const nums = unique ? [1, 1, 2, 2] : [1, 2, 3];
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const used = Array(nums.length).fill(false);
    const root = b.node(null, "root", "dfs()");

    function dfs(nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 21, message: "进入排列递归。本题没有 start，因为每一层都能从全部下标里挑一个未使用元素。", path, depth, variables: { used }, answers: ans });
      if (path.length === nums.length) {
        ans.push([...path]);
        b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 23, message: `所有位置填满，记录排列 ${json(path)}。`, path, depth, variables: { used }, answers: ans });
        b.push({ nodeId, parentId, edgeLabel, action: "return", line: 24, message: "完整排列返回，父调用撤销最后一个位置。", path, depth, variables: { used }, answers: ans });
        return;
      }
      for (let i = 0; i < nums.length; i += 1) {
        if (used[i]) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: 28, message: `nums[${i}]=${nums[i]} 已在当前 path 中，跳过。`, path, depth, variables: { i, used }, answers: ans });
          continue;
        }
        if (unique && i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: 29, message: `同层前一个 ${nums[i]} 没用过，说明这一层已经由它开过分支，跳过 nums[${i}]。`, path, depth, variables: { i, used }, answers: ans });
          continue;
        }
        used[i] = true;
        path.push(nums[i]);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 31, message: `选择下标 ${i} 的 ${nums[i]}，标记 used[${i}]=true。`, path, depth, variables: { i, used }, answers: ans });
        const child = b.node(nodeId, `take ${nums[i]}@${i}`, "dfs()");
        dfs(child, nodeId, `take ${nums[i]}@${i}`, depth + 1);
        path.pop();
        used[i] = false;
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 34, message: `撤销下标 ${i}。现在父调用可以尝试下一个兄弟下标。`, path, depth, variables: { i, used }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 36, message: "本层所有下标尝试完毕，返回父调用。", path, depth, variables: { used }, answers: ans });
    }

    dfs(root, null, "root", 0);
    resultFrame(b.frames, ans, 44);
    return b.frames;
  }

  function subsetsDupTrace() {
    const nums = [1, 2, 2, 3];
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const root = b.node(null, "root", "dfs(start=0)");

    function dfs(start, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 20, message: `进入 dfs(start=${start})，先收集当前 path。`, path, depth, variables: { start }, answers: ans });
      ans.push([...path]);
      b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 21, message: `记录 ${json(path)}。`, path, depth, variables: { start }, answers: ans });
      for (let i = start; i < nums.length; i += 1) {
        if (i > start && nums[i] === nums[i - 1]) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: 24, message: `nums[${i}] 和同层前一个相同，跳过，避免重复子集。`, path, depth, variables: { start, i, value: nums[i] }, answers: ans });
          continue;
        }
        path.push(nums[i]);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 25, message: `选择 nums[${i}]=${nums[i]}。如果进入下一层，重复的 2 仍可作为“路径内第二个 2”使用。`, path, depth, variables: { start, i }, answers: ans });
        const child = b.node(nodeId, `take ${nums[i]}@${i}`, `dfs(start=${i + 1})`);
        dfs(i + 1, child, nodeId, `take ${nums[i]}@${i}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 27, message: `撤销 nums[${i}]，同层继续找下一个不同的候选。`, path, depth, variables: { start, i }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 29, message: `dfs(start=${start}) 返回。`, path, depth, variables: { start }, answers: ans });
    }

    dfs(0, root, null, "root", 0);
    resultFrame(b.frames, ans, 37);
    return b.frames;
  }

  function combinationTrace(reuse) {
    const nums = reuse ? [2, 3, 6, 7] : [1, 1, 2, 5];
    const target = reuse ? 7 : 3;
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const root = b.node(null, "root", "dfs(start=0,sum=0)");

    function dfs(start, sum, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 21, message: `进入 dfs(start=${start}, sum=${sum})。`, path, depth, variables: { start, sum, target }, answers: ans });
      if (sum === target) {
        ans.push([...path]);
        b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 23, message: `sum 到 target，记录 ${json(path)}。`, path, depth, variables: { sum }, answers: ans });
        b.push({ nodeId, parentId, edgeLabel, action: "return", line: 24, message: "找到一条组合，返回并撤销最后一次选择。", path, depth, variables: { sum }, answers: ans });
        return;
      }
      for (let i = start; i < nums.length; i += 1) {
        if (!reuse && i > start && nums[i] === nums[i - 1]) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: 28, message: `同层重复值 ${nums[i]} 跳过。`, path, depth, variables: { start, i, sum }, answers: ans });
          continue;
        }
        if (sum + nums[i] > target) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: reuse ? 27 : 29, message: `已排序且 ${sum}+${nums[i]}>${target}，后面更大，直接 break。`, path, depth, variables: { start, i, sum }, answers: ans });
          break;
        }
        path.push(nums[i]);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: reuse ? 28 : 31, message: reuse ? `选择 ${nums[i]}，下一层仍从 i=${i} 开始，所以它可以复用。` : `选择 ${nums[i]}，下一层从 i+1=${i + 1} 开始，所以每个下标只用一次。`, path, depth, variables: { start, i, sum: sum + nums[i] }, answers: ans });
        const childStart = reuse ? i : i + 1;
        const child = b.node(nodeId, `take ${nums[i]}@${i}`, `dfs(start=${childStart},sum=${sum + nums[i]})`);
        dfs(childStart, sum + nums[i], child, nodeId, `take ${nums[i]}@${i}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: reuse ? 30 : 33, message: `撤销 ${nums[i]}，回到 sum=${sum}，同层尝试下一个候选。`, path, depth, variables: { start, i, sum }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: reuse ? 32 : 35, message: "本层候选处理完，返回父调用。", path, depth, variables: { start, sum }, answers: ans });
    }

    dfs(0, 0, root, null, "root", 0);
    resultFrame(b.frames, ans, 43);
    return b.frames;
  }

  function partitionTrace() {
    const s = "aab";
    const b = traceBuilder();
    const ans = [];
    const path = [];
    const root = b.node(null, "root", "dfs(start=0)");

    function isPal(l, r) {
      while (l < r) {
        if (s[l++] !== s[r--]) return false;
      }
      return true;
    }

    function dfs(start, nodeId, parentId, edgeLabel, depth) {
      b.push({ nodeId, parentId, edgeLabel, action: "enter", line: 28, message: `进入 dfs(start=${start})，准备从这里切下一段。`, path, depth, variables: { start }, answers: ans });
      if (start === s.length) {
        ans.push([...path]);
        b.push({ nodeId, parentId, edgeLabel, action: "answer", line: 30, message: `start 到末尾，记录切法 ${json(path)}。`, path, depth, variables: { start }, answers: ans });
        b.push({ nodeId, parentId, edgeLabel, action: "return", line: 31, message: "完整切法返回，父调用会撤销最后一段。", path, depth, variables: { start }, answers: ans });
        return;
      }
      for (let end = start; end < s.length; end += 1) {
        const piece = s.slice(start, end + 1);
        if (!isPal(start, end)) {
          b.push({ nodeId, parentId, edgeLabel, action: "skip", line: 34, message: `${piece} 不是回文，不能作为一段。`, path, depth, variables: { start, end, piece }, answers: ans });
          continue;
        }
        path.push(piece);
        b.push({ nodeId, parentId, edgeLabel, action: "choose", line: 35, message: `选择回文段 ${piece}，下一层从 ${end + 1} 开始切。`, path, depth, variables: { start, end, piece }, answers: ans });
        const child = b.node(nodeId, `take ${piece}`, `dfs(start=${end + 1})`);
        dfs(end + 1, child, nodeId, `take ${piece}`, depth + 1);
        path.pop();
        b.push({ nodeId, parentId, edgeLabel, action: "undo", line: 37, message: `撤销 ${piece}，回到 start=${start} 尝试更长的一段。`, path, depth, variables: { start, end }, answers: ans });
      }
      b.push({ nodeId, parentId, edgeLabel, action: "return", line: 39, message: `dfs(start=${start}) 返回。`, path, depth, variables: { start }, answers: ans });
    }

    dfs(0, root, null, "root", 0);
    resultFrame(b.frames, ans, 58);
    return b.frames;
  }

  function wordTrace() {
    const board = [["A", "B"], ["C", "D"]];
    const word = "ABD";
    const b = traceBuilder();
    const path = [];
    const ans = [];
    const visited = [[false, false], [false, false]];
    const root = b.node(null, "root", "search all cells");

    function snap(extra) {
      b.push({ ...extra, variables: { ...(extra.variables || {}), visited: clone(visited), word }, board: clone(board) });
      b.frames[b.frames.length - 1].board = clone(board);
    }

    function dfs(r, c, index, nodeId, parentId, edgeLabel, depth) {
      snap({ nodeId, parentId, edgeLabel, action: "enter", line: 25, message: `进入 dfs(r=${r}, c=${c}, index=${index})，要匹配 ${word[index]}。`, path, depth, variables: { r, c, index }, answers: ans });
      if (r < 0 || r >= 2 || c < 0 || c >= 2 || visited[r][c] || board[r][c] !== word[index]) {
        snap({ nodeId, parentId, edgeLabel, action: "return", line: 27, message: "越界、已访问或字符不相等，直接失败返回。", path, depth, variables: { r, c, index }, answers: ans });
        return false;
      }
      path.push(`${board[r][c]}(${r},${c})`);
      visited[r][c] = true;
      snap({ nodeId, parentId, edgeLabel, action: "choose", line: 30, message: `占用格子 (${r},${c})=${board[r][c]}。`, path, depth, variables: { r, c, index }, answers: ans });
      if (index === word.length - 1) {
        ans.push(true);
        snap({ nodeId, parentId, edgeLabel, action: "answer", line: 32, message: "最后一个字符匹配成功，整词找到。", path, depth, variables: { r, c, index }, answers: ans });
        visited[r][c] = false;
        path.pop();
        snap({ nodeId, parentId, edgeLabel, action: "undo", line: 33, message: "即使已经成功，函数返回前也恢复 visited，避免污染其他入口。", path, depth, variables: { r, c, index }, answers: ans });
        return true;
      }
      for (const [dr, dc, label] of [[1, 0, "down"], [-1, 0, "up"], [0, 1, "right"], [0, -1, "left"]]) {
        const child = b.node(nodeId, label, `dfs(${r + dr},${c + dc},${index + 1})`);
        if (dfs(r + dr, c + dc, index + 1, child, nodeId, label, depth + 1)) {
          visited[r][c] = false;
          path.pop();
          snap({ nodeId, parentId, edgeLabel, action: "return", line: 38, message: "子路径已找到答案，本层恢复后把 true 往上传。", path, depth, variables: { r, c, index }, answers: ans });
          return true;
        }
      }
      visited[r][c] = false;
      path.pop();
      snap({ nodeId, parentId, edgeLabel, action: "undo", line: 42, message: "四个方向都失败，恢复当前格子并返回 false。", path, depth, variables: { r, c, index }, answers: ans });
      return false;
    }

    snap({ nodeId: root, parentId: null, edgeLabel: "root", action: "enter", line: 50, message: "从每个格子尝试作为起点；示例从 A 开始即可找到 ABD。", path, depth: 0, variables: {}, answers: ans });
    const child = b.node(root, "start A(0,0)", "dfs(0,0,0)");
    dfs(0, 0, 0, child, root, "start A(0,0)", 1);
    resultFrame(b.frames, [true], 64);
    return b.frames;
  }

  function minCutTrace() {
    const s = "aab";
    const frames = [];
    const pal = [[true, true, false], [false, true, false], [false, false, true]];
    const dp = [0, 0, 1];
    frames.push({ board: null, dp: [0, null, null], nodeId: 1, parentId: null, edgeLabel: "root", action: "enter", message: "LC132 不列出所有切法；它把问题改成前缀最优值。", line: 28, path: [], depth: 0, variables: { i: 0, s: "aab" }, answers: [], tree: ["*#1 root dp prefix"] });
    frames.push({ board: null, dp: [0, null, null], nodeId: 1, parentId: null, edgeLabel: "root", action: "answer", message: "前缀 a 本身是回文，所以 dp[0]=0，不需要切。", line: 33, path: ["a"], depth: 0, variables: { i: 0, pal: pal[0][0] }, answers: [0], tree: ["*#1 root dp prefix"] });
    frames.push({ board: null, dp: [0, 0, null], nodeId: 1, parentId: null, edgeLabel: "root", action: "answer", message: "前缀 aa 也是回文，dp[1]=0。这里和 LC131 的 aa|b 会在下一步连接。", line: 33, path: ["aa"], depth: 0, variables: { i: 1, pal: pal[0][1] }, answers: [0, 0], tree: ["*#1 root dp prefix"] });
    frames.push({ board: null, dp: [0, 0, 2], nodeId: 1, parentId: null, edgeLabel: "root", action: "choose", message: "处理 aab，先设最坏 dp[2]=2，即 a|a|b。", line: 35, path: ["a", "a", "b"], depth: 0, variables: { i: 2, best: 2 }, answers: [0, 0], tree: ["*#1 root dp prefix"] });
    frames.push({ board: null, dp: [0, 0, 1], nodeId: 1, parentId: null, edgeLabel: "root", action: "choose", message: "最后一段 b 是回文，从 j=2 转移：dp[1]+1=1，因此最少切一次。", line: 38, path: ["aa", "b"], depth: 0, variables: { i: 2, j: 2, candidate: "dp[1]+1" }, answers: [0, 0, 1], tree: ["*#1 root dp prefix"] });
    frames.push({ board: null, dp, nodeId: 1, parentId: null, edgeLabel: "root", action: "done", message: "最终 dp[2]=1。它没有枚举返回所有方案，只保留最优切割次数。", line: 47, path: ["aa", "b"], depth: 0, variables: { answer: 1 }, answers: [1], tree: ["*#1 root dp prefix"] });
    return frames;
  }

  const code = {};
  code.binary = String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;

void printJson(const vector<string>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "\"" << values[i] << "\"";
    }
    cout << "]\n";
}

void dfs(int pos, int n, string& path, vector<string>& ans) {
    if (pos == n) {
        ans.push_back(path);
        return;
    }
    for (char ch : string("01")) {
        path.push_back(ch);
        dfs(pos + 1, n, path, ans);
        path.pop_back();
    }
}

int main() {
    vector<string> ans;
    string path;
    dfs(0, 3, path, ans);
    printJson(ans);
}`;

  code.subsets = String.raw`#include <iostream>
#include <vector>
using namespace std;

void printJson(const vector<vector<int>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]\n";
}

void dfs(int start, const vector<int>& nums, vector<int>& path, vector<vector<int>>& ans) {
    ans.push_back(path);
    for (int i = start; i < (int)nums.size(); ++i) {
        path.push_back(nums[i]);
        dfs(i + 1, nums, path, ans);
        path.pop_back();
    }
}

int main() {
    vector<int> nums{1, 2, 3, 4};
    vector<int> path;
    vector<vector<int>> ans;
    dfs(0, nums, path, ans);
    printJson(ans);
}`;

  code.combine = String.raw`#include <iostream>
#include <vector>
using namespace std;

void printJson(const vector<vector<int>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]\n";
}

void dfs(int start, int n, int k, vector<int>& path, vector<vector<int>>& ans) {
    if ((int)path.size() == k) {
        ans.push_back(path);
        return;
    }
    int limit = n - (k - (int)path.size()) + 1;
    for (int x = start; x <= limit; ++x) {
        path.push_back(x);
        dfs(x + 1, n, k, path, ans);
        path.pop_back();
    }
}

int main() {
    vector<int> path;
    vector<vector<int>> ans;
    dfs(1, 5, 3, path, ans);
    printJson(ans);
}`;

  code.permute = String.raw`#include <iostream>
#include <vector>
using namespace std;

void printJson(const vector<vector<int>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]\n";
}

void dfs(const vector<int>& nums, vector<int>& path, vector<int>& used, vector<vector<int>>& ans) {
    if ((int)path.size() == (int)nums.size()) {
        ans.push_back(path);
        return;
    }
    for (int i = 0; i < (int)nums.size(); ++i) {
        if (used[i]) continue;
        used[i] = 1;
        path.push_back(nums[i]);
        dfs(nums, path, used, ans);
        path.pop_back();
        used[i] = 0;
    }
}

int main() {
    vector<int> nums{1, 2, 3};
    vector<int> path, used(nums.size(), 0);
    vector<vector<int>> ans;
    dfs(nums, path, used, ans);
    printJson(ans);
}`;

  code.subsetsDup = code.subsets.replace("vector<int> nums{1, 2, 3, 4};", "vector<int> nums{1, 2, 2, 3};").replace(
    "for (int i = start; i < (int)nums.size(); ++i) {\n        path.push_back(nums[i]);",
    "for (int i = start; i < (int)nums.size(); ++i) {\n        if (i > start && nums[i] == nums[i - 1]) continue;\n        path.push_back(nums[i]);"
  );

  code.permuteDup = String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void printJson(const vector<vector<int>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]\n";
}

void dfs(const vector<int>& nums, vector<int>& path, vector<int>& used, vector<vector<int>>& ans) {
    if ((int)path.size() == (int)nums.size()) {
        ans.push_back(path);
        return;
    }
    for (int i = 0; i < (int)nums.size(); ++i) {
        if (used[i]) continue;
        if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
        used[i] = 1;
        path.push_back(nums[i]);
        dfs(nums, path, used, ans);
        path.pop_back();
        used[i] = 0;
    }
}

int main() {
    vector<int> nums{1, 1, 2, 2};
    vector<int> path, used(nums.size(), 0);
    vector<vector<int>> ans;
    sort(nums.begin(), nums.end());
    dfs(nums, path, used, ans);
    printJson(ans);
}`;

  code.combinationSum = String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void printJson(const vector<vector<int>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << values[i][j];
        }
        cout << "]";
    }
    cout << "]\n";
}

void dfs(int start, int sum, int target, const vector<int>& nums, vector<int>& path, vector<vector<int>>& ans) {
    if (sum == target) {
        ans.push_back(path);
        return;
    }
    for (int i = start; i < (int)nums.size(); ++i) {
        if (sum + nums[i] > target) break;
        path.push_back(nums[i]);
        dfs(i, sum + nums[i], target, nums, path, ans);
        path.pop_back();
    }
}

int main() {
    vector<int> nums{2, 3, 6, 7};
    vector<int> path;
    vector<vector<int>> ans;
    sort(nums.begin(), nums.end());
    dfs(0, 0, 7, nums, path, ans);
    printJson(ans);
}`;

  code.combinationSum2 = code.combinationSum
    .replace("vector<int> nums{2, 3, 6, 7};", "vector<int> nums{1, 1, 2, 5};")
    .replace("dfs(i, sum + nums[i], target, nums, path, ans);", "dfs(i + 1, sum + nums[i], target, nums, path, ans);")
    .replace("if (sum + nums[i] > target) break;", "if (i > start && nums[i] == nums[i - 1]) continue;\n        if (sum + nums[i] > target) break;")
    .replace("dfs(0, 0, 7, nums, path, ans);", "dfs(0, 0, 3, nums, path, ans);");

  code.partition = String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;

void printJson(const vector<vector<string>>& values) {
    cout << "[";
    for (int i = 0; i < (int)values.size(); ++i) {
        if (i) cout << ",";
        cout << "[";
        for (int j = 0; j < (int)values[i].size(); ++j) {
            if (j) cout << ",";
            cout << "\"" << values[i][j] << "\"";
        }
        cout << "]";
    }
    cout << "]\n";
}

bool isPalindrome(const string& s, int left, int right) {
    while (left < right) {
        if (s[left++] != s[right--]) return false;
    }
    return true;
}

void dfs(int start, const string& s, vector<string>& path, vector<vector<string>>& ans) {
    if (start == (int)s.size()) {
        ans.push_back(path);
        return;
    }
    for (int end = start; end < (int)s.size(); ++end) {
        if (!isPalindrome(s, start, end)) continue;
        path.push_back(s.substr(start, end - start + 1));
        dfs(end + 1, s, path, ans);
        path.pop_back();
    }
}

int main() {
    string s = "aab";
    vector<string> path;
    vector<vector<string>> ans;
    dfs(0, s, path, ans);
    printJson(ans);
}`;

  code.word = String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool dfs(int r, int c, int index, vector<vector<char>>& board, const string& word, vector<vector<int>>& visited) {
    int rows = (int)board.size();
    int cols = (int)board[0].size();
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (visited[r][c]) return false;
    if (board[r][c] != word[index]) return false;
    visited[r][c] = 1;
    if (index == (int)word.size() - 1) {
        visited[r][c] = 0;
        return true;
    }
    int dr[4] = {1, -1, 0, 0};
    int dc[4] = {0, 0, 1, -1};
    for (int dir = 0; dir < 4; ++dir) {
        if (dfs(r + dr[dir], c + dc[dir], index + 1, board, word, visited)) {
            visited[r][c] = 0;
            return true;
        }
    }
    visited[r][c] = 0;
    return false;
}

bool exist(vector<vector<char>> board, string word) {
    vector<vector<int>> visited(board.size(), vector<int>(board[0].size(), 0));
    for (int r = 0; r < (int)board.size(); ++r) {
        for (int c = 0; c < (int)board[0].size(); ++c) {
            if (dfs(r, c, 0, board, word, visited)) return true;
        }
    }
    return false;
}

int main() {
    vector<vector<char>> board{{'A', 'B'}, {'C', 'D'}};
    cout << (exist(board, "ABD") ? "true" : "false") << "\n";
}`;

  code.minCut = String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int minCut(string s) {
    int n = (int)s.size();
    vector<vector<int>> pal(n, vector<int>(n, 0));
    for (int len = 1; len <= n; ++len) {
        for (int left = 0; left + len - 1 < n; ++left) {
            int right = left + len - 1;
            pal[left][right] = s[left] == s[right] && (len <= 2 || pal[left + 1][right - 1]);
        }
    }
    vector<int> dp(n, 0);
    for (int i = 0; i < n; ++i) {
        if (pal[0][i]) {
            dp[i] = 0;
            continue;
        }
        dp[i] = i;
        for (int j = 1; j <= i; ++j) {
            if (pal[j][i]) dp[i] = min(dp[i], dp[j - 1] + 1);
        }
    }
    return dp[n - 1];
}

int main() {
    cout << minCut("aab") << "\n";
}`;

  function starterFrom(full) {
    let starter = full
      .replace(/void dfs\(([^)]*)\) \{[\s\S]*?\n\}/m, "void dfs($1) {\n    // TODO: 写终止条件、选择、递归和撤销。\n}\n")
      .replace(/bool dfs\(([^)]*)\) \{[\s\S]*?\n\}/m, "bool dfs($1) {\n    // TODO: 检查边界、选择当前格子、递归四个方向、恢复 visited。\n    return false;\n}\n")
      .replace(/int minCut\(string s\) \{[\s\S]*?\n\}/m, "int minCut(string s) {\n    // TODO: 先求 pal，再求 dp[i]。\n    return -1;\n}\n");
    starter = starter.replace(
      "void dfs(int pos, int n, string& path, vector<string>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] int pos, [[maybe_unused]] int n,\n         [[maybe_unused]] string& path, [[maybe_unused]] vector<string>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "void dfs(int start, const vector<int>& nums, vector<int>& path, vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] int start, [[maybe_unused]] const vector<int>& nums,\n         [[maybe_unused]] vector<int>& path, [[maybe_unused]] vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "void dfs(int start, int n, int k, vector<int>& path, vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] int start, [[maybe_unused]] int n, [[maybe_unused]] int k,\n         [[maybe_unused]] vector<int>& path, [[maybe_unused]] vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "void dfs(const vector<int>& nums, vector<int>& path, vector<int>& used, vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] const vector<int>& nums, [[maybe_unused]] vector<int>& path,\n         [[maybe_unused]] vector<int>& used, [[maybe_unused]] vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "void dfs(int start, int sum, int target, const vector<int>& nums, vector<int>& path, vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] int start, [[maybe_unused]] int sum, [[maybe_unused]] int target,\n         [[maybe_unused]] const vector<int>& nums, [[maybe_unused]] vector<int>& path,\n         [[maybe_unused]] vector<vector<int>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "void dfs(int start, const string& s, vector<string>& path, vector<vector<string>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。",
      "void dfs([[maybe_unused]] int start, [[maybe_unused]] const string& s,\n         [[maybe_unused]] vector<string>& path, [[maybe_unused]] vector<vector<string>>& ans) {\n    // TODO: 写终止条件、选择、递归和撤销。"
    );
    starter = starter.replace(
      "bool dfs(int r, int c, int index, vector<vector<char>>& board, const string& word, vector<vector<int>>& visited) {\n    // TODO: 检查边界、选择当前格子、递归四个方向、恢复 visited。",
      "bool dfs([[maybe_unused]] int r, [[maybe_unused]] int c, [[maybe_unused]] int index,\n         [[maybe_unused]] vector<vector<char>>& board, [[maybe_unused]] const string& word,\n         [[maybe_unused]] vector<vector<int>>& visited) {\n    // TODO: 检查边界、选择当前格子、递归四个方向、恢复 visited。"
    );
    starter = starter.replace(
      "int minCut(string s) {\n    // TODO: 先求 pal，再求 dp[i]。",
      "int minCut([[maybe_unused]] string s) {\n    // TODO: 先求 pal，再求 dp[i]。"
    );
    return starter;
  }

  function lesson(id, title, stage, url, goal, statement, example, concepts, walkthrough, pitfalls, checks, hints, starter, fullCode, trace) {
    return { id, title, stage, url, goal, statement, example, concepts, walkthrough, pitfalls, checks, hints, starter, code: fullCode, trace };
  }

  const commonBacktrackChecks = [
    "能说清楚这一层的候选从哪里来。",
    "能指出 answer 是复制 path，而不是保存 path 的引用。",
    "能解释某一次 return 后，父调用为什么必须 undo。"
  ];

  window.BT_LESSONS = {
    binary: lesson(
      "binary", "生成长度 3 的 01 串", "第 0 课 · 递归热身", "#",
      "建立回溯最小模型：path 记录已选前缀，pos 表示正在填第几个位置。",
      "生成所有长度为 3、每位只能是 0 或 1 的字符串。它没有 LeetCode 包袱，专门用来观察递归调用、叶子收集和返回后的撤销。",
      { input: "n = 3", output: "[\"000\",\"001\",\"010\",\"011\",\"100\",\"101\",\"110\",\"111\"]", explain: "每一层有 0 和 1 两个选择，深度为 3。" },
      [
        { name: "状态", text: "pos 表示下一个要填写的位置，path 是已经填写好的前缀。" },
        { name: "选择", text: "当前位置只能放 0 或 1，所以每个非叶子调用都有两个孩子。" },
        { name: "恢复", text: "递归返回后 pop 掉刚才放入的字符，父调用才能继续尝试兄弟分支。" }
      ],
      [
        "先进入 dfs(0)，path 为空。",
        "选择 0 后进入 dfs(1)，这是一条新的递归调用节点，不是简单移动指针。",
        "当 path 长度到 3，复制出一个答案；随后返回父节点，父节点撤销最后一个字符。",
        "例如从 000 返回后，父节点撤销最后的 0，再尝试兄弟选择 1，才得到 001。"
      ],
      ["忘记 pop 会让兄弟分支继承上一个分支的尾巴。", "把叶子答案直接引用 path，在 C++ 里通常表现为后续修改污染结果。"],
      commonBacktrackChecks,
      ["画出 dfs(0) 的两个孩子。", "只跟踪 000 到 001 这一段返回过程。", "确认每次 push 都有对应 pop。"],
      starterFrom(code.binary), code.binary, binaryTrace
    ),
    "78": lesson(
      "78", "LC78 · 子集", "第 1 课 · 子集树", "https://leetcode.com/problems/subsets/",
      "理解子集题为什么每个节点都能成为答案，而不只在叶子收集。",
      "给定互不相同的数组，返回所有可能子集。示例用 [1,2,3,4]，完整搜索有 16 个答案。",
      { input: "nums = [1,2,3,4]", output: "[[],[1],[1,2],...,[4]]", explain: "每个元素选或不选，答案数量为 2^4。" },
      [
        { name: "状态", text: "start 表示下一次只能从哪个下标之后选择。" },
        { name: "收集位置", text: "进入 dfs 后立即收集 path；因为任何长度的 path 都是合法子集。" },
        { name: "兄弟分支", text: "从 [1,2,3,4] 返回到 [1,2,3] 后，撤销 4，随后返回更上层继续尝试 [1,2,4]。" }
      ],
      ["[] 是根节点答案。", "选择 1 后进入只含 1 的子树。", "每次返回都撤销最近选择，父节点继续枚举更右侧的下标。", "start 让 [2,1] 这种逆序重复不会出现。"],
      ["只在叶子收集会漏掉 [1]、[1,2] 这类中间节点。", "递归下一层写成 i 而不是 i+1，会重复使用当前下标。"],
      commonBacktrackChecks,
      ["答案个数应为 16。", "先说清楚 dfs(start=2) 的候选下标。", "把收集答案写在 for 循环前面。"],
      starterFrom(code.subsets), code.subsets, subsetsTrace
    ),
    "77": lesson(
      "77", "LC77 · 组合", "第 2 课 · 固定长度", "https://leetcode.com/problems/combinations/",
      "从子集题过渡到固定长度 k：只有 path.size()==k 时才收集答案。",
      "从 1..n 中选 k 个数，返回全部组合。示例用 n=5,k=3，答案有 10 个。",
      { input: "n = 5, k = 3", output: "[[1,2,3],[1,2,4],...,[3,4,5]]", explain: "组合不关心顺序，所以 [1,2,3] 和 [3,2,1] 是同一个。" },
      [
        { name: "状态", text: "start 是这一层最小可选数字，path 保存已经选的数。" },
        { name: "剪枝", text: "若剩余数字不够填满 k，就不再开分支。" },
        { name: "返回", text: "记录 [1,2,3] 后返回到 [1,2]，撤销 3，再尝试兄弟 4。" }
      ],
      ["根节点不是答案，因为长度还不到 k。", "选择 1、2、3 后收集第一条。", "从 [1,2,3] 返回，父节点撤销 3，立刻尝试 [1,2,4]。", "limit 保证这一层不会选择一个导致后面不够凑 k 的起点。"],
      ["把组合当排列，会输出大量顺序重复。", "没有剪枝也能对，但更容易在大输入上浪费时间。"],
      commonBacktrackChecks,
      ["先算出 n=5,k=3 应有 C(5,3)=10 个答案。", "想清楚为什么第一层不能从 4 开始。", "检查 for 上界是否允许选到 3。"],
      starterFrom(code.combine), code.combine, combineTrace
    ),
    "46": lesson(
      "46", "LC46 · 全排列", "第 3 课 · 顺序重要", "https://leetcode.com/problems/permutations/",
      "理解排列为什么不能用 start，而要用 used 表示当前路径占用了哪些下标。",
      "给定互不相同的数组，返回所有排列。示例 [1,2,3] 有 6 个答案。",
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],...]", explain: "顺序不同就是不同答案。" },
      [
        { name: "状态", text: "path 表示已经填好的前缀位置，used[i] 表示 nums[i] 是否在当前 path 中。" },
        { name: "选择", text: "每一层都从全部下标扫描，跳过 used=true 的下标。" },
        { name: "恢复", text: "pop path 后还要 used[i]=false，否则兄弟排列拿不到这个数。" }
      ],
      ["第一层选择 1 后，第二层仍要从下标 0 扫起，但会因为 used[0] 跳过 1。", "得到 [1,2,3] 后返回到 [1,2]，撤销 3。", "再返回到 [1] 后撤销 2，兄弟分支选择 3，得到 [1,3,2]。"],
      ["用 start 会只能得到递增序列，漏掉 [2,1,3]。", "只恢复 path 不恢复 used，会让数字永久不可选。"],
      commonBacktrackChecks,
      ["答案个数应为 3! = 6。", "解释 used 和 start 的差别。", "跟踪 [1,2,3] 返回到 [1,3,2] 的过程。"],
      starterFrom(code.permute), code.permute, () => permuteTrace(false)
    ),
    "90": lesson(
      "90", "LC90 · 子集 II", "第 4 课 · 子集去重", "https://leetcode.com/problems/subsets-ii/",
      "学会区分同层去重和同路径复用：重复元素可以都选，但不能在同一层重复开等价分支。",
      "数组可能有重复元素，返回不重复的子集。示例 [1,2,2,3] 有 12 个唯一子集。",
      { input: "nums = [1,2,2,3]", output: "12 个唯一子集", explain: "第二个 2 可作为路径内的第二个 2，但不能在同一层重新代表第一个 2。" },
      [
        { name: "排序", text: "先排序，让相同元素相邻，才容易判断同层重复。" },
        { name: "同层", text: "条件 i > start && nums[i] == nums[i-1] 只拦住同一层的重复分支。" },
        { name: "同路径", text: "进入下一层后 start 变大，第二个 2 仍可以被选择，得到 [2,2]。" }
      ],
      ["和 LC78 一样，进入节点先收集 path。", "在根层选择第一个 2 后，会探索所有以 2 开头的子集。", "回到根层时，第二个 2 是同层重复，跳过。", "但在 [2] 的下一层，第二个 2 不会被跳过，因为 i==start。"],
      ["把所有相同值都跳过会漏掉 [2,2]。", "不排序时相邻比较没有意义。"],
      commonBacktrackChecks,
      ["先排序再 dfs。", "用 [2,2] 检查是否允许路径内复用重复副本。", "用根层两个 2 检查是否去掉重复分支。"],
      starterFrom(code.subsetsDup), code.subsetsDup, subsetsDupTrace
    ),
    "47": lesson(
      "47", "LC47 · 全排列 II", "第 5 课 · 排列去重", "https://leetcode.com/problems/permutations-ii/",
      "在排列题中去重：相同数字在同一层只允许左边那个未使用副本先开分支。",
      "数组可能有重复元素，返回不重复排列。示例 [1,1,2,2] 有 6 个答案。",
      { input: "nums = [1,1,2,2]", output: "6 个唯一排列", explain: "相同数字的位置不同，但输出不能重复。" },
      [
        { name: "used", text: "仍然用 used 表示某个下标是否在当前路径里。" },
        { name: "去重条件", text: "i>0 && nums[i]==nums[i-1] && !used[i-1] 时跳过当前副本。" },
        { name: "含义", text: "若前一个相同值没有被本路径使用，说明当前层已经可以由前一个副本代表。" }
      ],
      ["根层选择第一个 1 后探索完整子树。", "回到根层时，第二个 1 因为前一个 1 没被使用而跳过。", "在路径 [1] 内，第二个 1 可以使用，因为前一个 1 已在路径中。"],
      ["把 !used[i-1] 写成 used[i-1] 会跳错层级。", "只按值建立 set 容易看似简单，但不利于理解路径内副本关系。"],
      commonBacktrackChecks,
      ["答案个数应为 6。", "解释为什么 [1,1,2,2] 合法。", "解释根层第二个 1 为什么跳过。"],
      starterFrom(code.permuteDup), code.permuteDup, () => permuteTrace(true)
    ),
    "39": lesson(
      "39", "LC39 · 组合总和", "第 6 课 · 可复用选择", "https://leetcode.com/problems/combination-sum/",
      "理解下一层从 i 还是 i+1 开始的语义：能不能重复使用当前候选。",
      "给定无重复正整数 candidates 和 target，数字可以无限次使用，返回所有和为 target 的组合。",
      { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]", explain: "2 可以重复取，所以会出现 [2,2,3]。" },
      [
        { name: "状态", text: "start 控制组合顺序，sum 表示当前路径总和。" },
        { name: "复用", text: "选择 candidates[i] 后，下一层仍传 i。" },
        { name: "剪枝", text: "正数且已排序，sum + candidates[i] > target 时可以 break。" }
      ],
      ["选择 2 后仍从 2 开始，可继续选择 2。", "当路径 [2,2,3] 达到 target，记录答案。", "返回到 [2,2] 后撤销 3，发现后续 6、7 会超 target，剪掉。", "回到根层尝试 7，得到第二个答案。"],
      ["下一层误传 i+1 会漏掉 [2,2,3]。", "没有正数和排序前提时，不能随便 break。"],
      commonBacktrackChecks,
      ["比较 LC39 和 LC40 的 childStart。", "用 target=7 手算 [2,2,3] 的来源。", "说明 break 的前提是已排序且数字为正。"],
      starterFrom(code.combinationSum), code.combinationSum, () => combinationTrace(true)
    ),
    "40": lesson(
      "40", "LC40 · 组合总和 II", "第 7 课 · 不可复用去重", "https://leetcode.com/problems/combination-sum-ii/",
      "同一题型下切换语义：每个下标只能用一次，但输入可能有重复值。",
      "给定 candidates 和 target，每个下标最多使用一次，返回不重复组合。示例使用 [1,1,2,5], target=3。",
      { input: "candidates = [1,1,2,5], target = 3", output: "[[1,2]]", explain: "第一个 1 和第二个 1 不能在同一层重复开等价分支。" },
      [
        { name: "不可复用", text: "选择 i 后下一层从 i+1 开始。" },
        { name: "去重", text: "同层相同值跳过，防止同一组合被不同副本重复生成。" },
        { name: "剪枝", text: "排序后超 target 直接停止当前层。" }
      ],
      ["根层选第一个 1，下一层可以选 2，得到 [1,2]。", "回到根层后，第二个 1 是同层重复，跳过。", "再选 2 时无法凑到 3，后面的 5 超出后 break。"],
      ["误传 i 会重复使用同一个下标。", "不做同层去重会得到两个 [1,2]。"],
      commonBacktrackChecks,
      ["答案只有一个 [1,2]。", "解释第二个 1 在根层为什么跳过。", "解释第二个 1 在路径 [1] 后面是否能用。"],
      starterFrom(code.combinationSum2), code.combinationSum2, () => combinationTrace(false)
    ),
    "131": lesson(
      "131", "LC131 · 分割回文串", "第 8 课 · 字符串切分", "https://leetcode.com/problems/palindrome-partitioning/",
      "把选择从“选数字”换成“选一段字符串”，并理解 start/end 的含义。",
      "把字符串切成若干段，每一段都必须是回文，返回所有切法。示例 aab 有两种。",
      { input: "s = \"aab\"", output: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]", explain: "a|a|b 和 aa|b 都合法。" },
      [
        { name: "状态", text: "start 表示下一段必须从哪个下标开始。" },
        { name: "选择", text: "end 从 start 往右枚举，若 s[start..end] 是回文就加入 path。" },
        { name: "恢复", text: "递归后 pop 掉刚加入的整段字符串，不是只弹一个字符。" }
      ],
      ["从 start=0 可以选 a，也可以选 aa。", "选 a 后进入 start=1，再选 a、b 得到第一条。", "返回到 start=0 后撤销 a，兄弟分支选 aa，再接 b 得到第二条。", "aab 不是回文，所以作为整段会被剪掉。"],
      ["把 LC132 的最小切分和 LC131 的全部枚举混为一谈。", "path 存的是段，不是字符下标。"],
      commonBacktrackChecks,
      ["手写 aab 的两条答案。", "说明 start=end+1 为什么能保证段连续。", "先用 isPalindrome 写对，再考虑 DP 预处理。"],
      starterFrom(code.partition), code.partition, partitionTrace
    ),
    "79": lesson(
      "79", "LC79 · 单词搜索", "第 9 课 · 网格路径", "https://leetcode.com/problems/word-search/",
      "把 path 从一维选择扩展到二维格子路径，重点理解 visited 恢复。",
      "在字符网格中寻找一个单词，相邻格子可上下左右移动，同一条路径不能重复使用同一个格子。",
      { input: "board = [[A,B],[C,D]], word = \"ABD\"", output: "true", explain: "A -> B -> D 是一条合法路径。" },
      [
        { name: "状态", text: "r、c 是当前位置，index 是正在匹配 word 的第几个字符。" },
        { name: "选择", text: "当前格子匹配后，标记 visited，再尝试四个方向。" },
        { name: "恢复", text: "无论成功还是失败，返回前都恢复 visited[r][c]。" }
      ],
      ["从 A(0,0) 开始匹配 A。", "占用 A 后尝试方向，向右到 B 成功。", "占用 B 后向下到 D 成功，单词匹配完毕。", "true 往上传时每一层仍会恢复自己的 visited。"],
      ["只恢复失败路径，不恢复成功路径，会污染其他入口或测试。", "把 visited 设成全局但忘记按路径撤销。"],
      commonBacktrackChecks,
      ["解释为什么不能重复使用同一格。", "说明找到一个解就可以提前返回。", "在返回 true 的路径上也要恢复 visited。"],
      starterFrom(code.word), code.word, wordTrace
    ),
    "132": lesson(
      "132", "LC132 · 分割回文串 II", "第 10 课 · DP 对照", "https://leetcode.com/problems/palindrome-partitioning-ii/",
      "理解为什么 LC132 不适合用“列出所有切法”作为正式解：它只要最少切割次数。",
      "把字符串切成若干回文段，求最少切几刀。示例 aab 的答案是 1，因为 aa|b。",
      { input: "s = \"aab\"", output: "1", explain: "aa 和 b 都是回文，只切一次。" },
      [
        { name: "状态", text: "dp[i] 表示 s[0..i] 切成回文段的最少切割次数。" },
        { name: "转移", text: "若 s[j..i] 是回文，则候选是 dp[j-1]+1；j=0 时为 0。" },
        { name: "对照", text: "LC131 保存所有 path；LC132 只保存前缀最优值。" }
      ],
      ["先求回文表，知道 a、aa、b 是回文。", "dp[0]=0，因为 a 不用切。", "dp[1]=0，因为 aa 不用切。", "处理 aab 时，最后一段 b 从 j=2 开始，候选 dp[1]+1=1。"],
      ["把段数当切割次数，aa|b 有 2 段但只切 1 刀。", "用回溯列出所有切法会指数爆炸，只能作为小输入理解工具。"],
      ["能说清 dp[i] 的含义。", "能解释 j=0 为什么是 0。", "能把 LC131 的两条切法和 LC132 的最优值对应起来。"],
      ["先写 pal 表。", "对每个 i 枚举最后一段起点 j。", "答案是 dp[n-1]，不是段数。"],
      starterFrom(code.minCut), code.minCut, minCutTrace
    )
  };
  window.BT_FOUNDATIONS = ["binary", "78", "77", "46", "90", "47"].map((id) => window.BT_LESSONS[id]);
}());
