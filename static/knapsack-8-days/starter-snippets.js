const starterStyles = document.createElement("link");
starterStyles.rel = "stylesheet";
starterStyles.href = "starter-snippets.css";
document.head.append(starterStyles);

const starterLessons = [
  {
    day: 1,
    filename: "day01.cpp",
    note: "w[i] 和 v[i] 共同描述第 i 件物品：w 是重量，v 是价值，W 是总容量。下面的文件已经准备好输入和输出，你只需要完成 knapsack 函数。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

// w[i]：第 i 件物品的重量
// v[i]：第 i 件物品的价值
// W：背包容量；每件物品最多选择一次
// 返回：总重量不超过 W 时的最大总价值
int knapsack([[maybe_unused]] const vector<int>& w,
             [[maybe_unused]] const vector<int>& v,
             [[maybe_unused]] int W) {
    // TODO：先写二维 DP。今天不用急着压缩成一维。
    throw logic_error("TODO: implement knapsack");
}

int main() {
    vector<int> w{1, 3, 4};
    vector<int> v{15, 20, 30};
    int W = 4;

    cout << "实际结果：" << knapsack(w, v, W) << '\\n';
    cout << "预期结果：35\\n"; // 选择重量 1 和 3 的两件物品
}`
  },
  {
    day: 2,
    filename: "day02.cpp",
    note: "nums 中的每个数字只能使用一次。函数只回答能否分成和相等的两组；main 已经准备了一组可以划分和一组不能划分的输入。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

bool canPartition([[maybe_unused]] const vector<int>& nums) {
    // TODO：先求总和，再把问题转成“能否恰好凑出 sum / 2”。
    throw logic_error("TODO: implement canPartition");
}

int main() {
    cout << boolalpha;
    cout << "实际结果：" << canPartition({1, 5, 11, 5})
         << "，预期：true\\n";
    cout << "实际结果：" << canPartition({1, 2, 5})
         << "，预期：false\\n";
}`
  },
  {
    day: 3,
    filename: "day03.cpp",
    note: "stones 是每块石头的重量。先完成函数，不必模拟每次碰撞；把它转换为两组石头的重量差问题。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

int lastStoneWeightII([[maybe_unused]] const vector<int>& stones) {
    // TODO：在不超过总和一半的范围内，找最大的可达子集和。
    throw logic_error("TODO: implement lastStoneWeightII");
}

int main() {
    cout << "实际结果：" << lastStoneWeightII({2, 7, 4, 1, 8, 1})
         << "，预期：1\\n";
    cout << "实际结果：" << lastStoneWeightII({7})
         << "，预期：7\\n";
}`
  },
  {
    day: 4,
    filename: "day04.cpp",
    note: "nums 中每个位置都要添加 + 或 -，返回得到 target 的方法数。相同数值但不同下标仍是不同选择，0 也有正负两种写法。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

int findTargetSumWays([[maybe_unused]] const vector<int>& nums,
                      [[maybe_unused]] int target) {
    // TODO：推导 P = (sum + target) / 2，再做 01 计数背包。
    throw logic_error("TODO: implement findTargetSumWays");
}

int main() {
    cout << "实际结果：" << findTargetSumWays({1, 1, 1, 1, 1}, 3)
         << "，预期：5\\n";
    cout << "实际结果：" << findTargetSumWays({0, 0, 1}, 1)
         << "，预期：4\\n";
}`
  },
  {
    day: 5,
    filename: "day05.cpp",
    note: "coins 是可无限使用的硬币面值，amount 是目标金额。无法恰好凑出时返回 -1；金额为 0 时返回 0。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

int coinChange([[maybe_unused]] const vector<int>& coins,
               [[maybe_unused]] int amount) {
    // TODO：dp[c] 表示恰好凑出 c 所需的最少硬币数。
    throw logic_error("TODO: implement coinChange");
}

int main() {
    cout << "实际结果：" << coinChange({1, 3, 4}, 6)
         << "，预期：2\\n";
    cout << "实际结果：" << coinChange({2}, 3)
         << "，预期：-1\\n";
}`
  },
  {
    day: 6,
    filename: "day06.cpp",
    note: "amount 是目标金额，coins 中每种硬币可以无限使用。LC 518 不区分硬币排列顺序，所以 1+2 和 2+1 只算一种组合。",
    code: `#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

int change([[maybe_unused]] int amount,
           [[maybe_unused]] const vector<int>& coins) {
    // TODO：统计不考虑顺序的组合数；先确定哪一层遍历硬币。
    throw logic_error("TODO: implement change");
}

int main() {
    cout << "实际结果：" << change(5, {1, 2, 5})
         << "，预期：4\\n";
    cout << "实际结果：" << change(3, {2})
         << "，预期：0\\n";
}`
  },
  {
    day: 7,
    filename: "day07.cpp",
    note: "每个字符串是一件只能选择一次的物品。m 是可用的 0 的数量，n 是可用的 1 的数量；返回最多能选择多少个字符串。",
    code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
using namespace std;

int findMaxForm([[maybe_unused]] const vector<string>& strs,
                [[maybe_unused]] int m,
                [[maybe_unused]] int n) {
    // TODO：dp[z][o] 表示两种预算不超过 z、o 时的最多件数。
    throw logic_error("TODO: implement findMaxForm");
}

int main() {
    cout << "实际结果：" << findMaxForm({"10", "0", "1"}, 1, 1)
         << "，预期：2\\n";
    cout << "实际结果：" << findMaxForm({"0"}, 2, 0)
         << "，预期：1\\n";
}`
  },
  {
    day: 8,
    filename: "day08.cpp",
    note: "今天是闭卷重写。先选择 LC 416、322 或之前最弱的一题，把对应函数签名写进 TODO 区；main 中先放一个正常样例和两个边界样例。",
    code: `#include <iostream>
#include <vector>
using namespace std;

// 题目：____________________
// dp 状态：_________________
// 初始值：__________________
// 转移：____________________
// 遍历方向：________________

// TODO：在这里写今天闭卷重做的函数。

int main() {
    // TODO：写 1 个题目样例和 2 个边界样例。
    // 先写清预期结果，再运行你的函数。
    return 0;
}`
  }
];

function makeStarterBlock(lesson) {
  const details = document.createElement("details");
  details.className = "starter-code";
  details.open = lesson.day === 1;

  const summary = document.createElement("summary");
  summary.textContent = "起步代码 · 可直接编译，只填写 TODO";
  details.append(summary);

  const body = document.createElement("div");
  body.className = "starter-body";

  const note = document.createElement("p");
  note.className = "starter-note";
  note.innerHTML = `<strong>先弄清输入：</strong>${lesson.note}`;

  const toolbar = document.createElement("div");
  toolbar.className = "starter-toolbar";

  const filename = document.createElement("span");
  filename.className = "starter-filename";
  filename.textContent = lesson.filename;

  const repositoryLink = document.createElement("a");
  const directory = `day${String(lesson.day).padStart(2, "0")}`;
  repositoryLink.href = `https://github.com/liyongzheng666/knapsack-dp-cpp/tree/main/${directory}`;
  repositoryLink.target = "_blank";
  repositoryLink.rel = "noopener";
  repositoryLink.textContent = `打开完整工程 / ${directory} ↗`;

  const copy = document.createElement("button");
  copy.className = "copy-starter";
  copy.type = "button";
  copy.textContent = "复制起步代码";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lesson.code);
      copy.textContent = "已复制";
    } catch {
      copy.textContent = "请手动选择代码";
    }
    window.setTimeout(() => { copy.textContent = "复制起步代码"; }, 1500);
  });

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = lesson.code;
  pre.append(code);
  toolbar.append(filename, repositoryLink, copy);
  body.append(note, toolbar, pre);
  details.append(body);
  return details;
}

const intro = document.querySelector(".intro");
if (intro) {
  const guide = document.createElement("p");
  guide.className = "starter-guide";
  guide.innerHTML = "<strong>写代码时不用从空文件开始：</strong>每个实作区都提供能直接编译的起步文件。先读清输入和预期结果，只填写 <code>TODO</code>；写完后再与折叠的参考实现比较。";
  intro.querySelector("details")?.before(guide);
}

starterLessons.forEach((lesson) => {
  const day = document.querySelector(`#day${lesson.day}`);
  const practice = day?.querySelector(".callout");
  if (practice) practice.after(makeStarterBlock(lesson));
});
