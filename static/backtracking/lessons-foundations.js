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

  const foundations = {
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

  };
  window.BT_FOUNDATIONS = ["binary", "78", "77", "46", "90", "47"].map((id) => foundations[id]);
}());

// Keep the animation anchors tied to the displayed C++ source, including after header edits.
for (const lesson of window.BT_FOUNDATIONS) {
  if (lesson.id === '90') {
    lesson.code = '#include <algorithm>\n' + lesson.code.replace('    dfs(0, nums, path, ans);','    sort(nums.begin(), nums.end());\n    dfs(0, nums, path, ans);');
  }
  const trace = lesson.trace;
  const lines = lesson.code.split('\n');
  const find = needle => {const i=lines.findIndex(line=>line.includes(needle));if(i<0)throw new Error(`Missing ${lesson.id} code anchor: ${needle}`);return i+1;};
  const end = lines.findIndex(line=>line.includes('int main()'));
  let last = end-1;while(last>=0&&!lines[last].trim())last--;
  lesson.trace = input => trace(input).map((frame, index, all) => {
    const f={...frame};
    if(f.action==='enter')f.line=find('void dfs(');
    else if(f.action==='choose')f.line=find('path.push_back(');
    else if(f.action==='answer')f.line=find('ans.push_back(path)');
    else if(f.action==='undo')f.line=find(lines.some(s=>s.includes('used[i] = 0'))?'used[i] = 0':'path.pop_back()');
    else if(f.action==='skip')f.line=find(f.message.includes('同层')?'nums[i] == nums[i - 1]':'if (used[i])');
    else if(f.action==='prune')f.line=find('int limit');
    else if(f.action==='return')f.line=lines.some(s=>s.trim()==='return;')&&all[index-1]?.action==='answer'?find('return;'):last+1;
    else if(f.action==='done'){f.line=find('    printJson(ans);');f.nodeId=null;f.parentId=null;}
    return f;
  });
}
