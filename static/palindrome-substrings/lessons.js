window.PAL_TOPIC = {
  lessonOrder: ["125", "680", "647", "5", "131", "132", "2472", "214", "1960"],
  problems: [
    { phase: "热身 01", id: "125", title: "Valid Palindrome", difficulty: "Easy", url: "https://leetcode.com/problems/valid-palindrome/", method: "相向双指针", summary: "跳过无关字符，只比较字母数字。", demo: "left/right 一起往中间走。" },
    { phase: "热身 02", id: "680", title: "Valid Palindrome II", difficulty: "Easy", url: "https://leetcode.com/problems/valid-palindrome-ii/", method: "双指针 + 一次补救", summary: "第一次失配时，试删左或删右。", demo: "失配后拆成两条检查路线。" },
    { phase: "基础 03", id: "647", title: "Palindromic Substrings", difficulty: "Medium", url: "https://leetcode.com/problems/palindromic-substrings/", method: "中心扩展", summary: "每扩成功一次，就多一个回文子串。", demo: "奇数中心和偶数中心统一处理。" },
    { phase: "基础 04", id: "5", title: "Longest Palindromic Substring", difficulty: "Medium", url: "https://leetcode.com/problems/longest-palindromic-substring/", method: "中心扩展", summary: "从计数变成记录最长区间。", demo: "扩出更长回文时更新 start/len。" },
    { phase: "组合 05", id: "131", title: "Palindrome Partitioning", difficulty: "Medium", url: "https://leetcode.com/problems/palindrome-partitioning/", method: "回文表 + 回溯", summary: "每次选一段回文，继续切后面。", demo: "aab 的选择、递归、撤销。" },
    { phase: "最小化 06", id: "132", title: "Palindrome Partitioning II", difficulty: "Hard", url: "https://leetcode.com/problems/palindrome-partitioning-ii/", method: "回文表 + 前缀 DP", summary: "只求最少切几刀，不列出所有方案。", demo: "枚举最后一段回文的起点。" },
    { phase: "拓展 07", id: "2472", title: "Maximum Number of Non-overlapping Palindrome Substrings", difficulty: "Hard", url: "https://leetcode.com/problems/maximum-number-of-non-overlapping-palindrome-substrings/", method: "回文判定 + 区间选择", summary: "选尽量多的不重叠回文段。", demo: "选一段后跳到下一段。" },
    { phase: "高阶 08", id: "214", title: "Shortest Palindrome", difficulty: "Hard", url: "https://leetcode.com/problems/shortest-palindrome/", method: "KMP 前缀函数", summary: "找最长回文前缀，再把剩余部分补到前面。", demo: "s + # + reverse(s) 的前缀函数。" },
    { phase: "高阶 09", id: "1960", title: "Maximum Product of the Length of Two Palindromic Substrings", difficulty: "Hard", url: "https://leetcode.com/problems/maximum-product-of-the-length-of-two-palindromic-substrings/", method: "Manacher + 前后缀最值", summary: "线性记录分割点两边最优回文。", demo: "回文半径和左右最值。" }
  ]
};

(function () {
  "use strict";

  function frame(title, message, states, stats, pointers, chips) {
    return {
      title,
      message,
      primaryStates: states,
      secondary: [],
      secondaryStates: states.map((state) => state === "best" ? "best" : "idle"),
      stats,
      pointers: pointers || [],
      chips: chips || []
    };
  }

  function demo(title, intro, primary, frames) {
    return {
      title,
      intro,
      primaryLabel: "字符串",
      primary,
      secondaryLabel: "状态",
      secondary: primary.map((_, index) => String(index)),
      frames
    };
  }

  function lesson(meta, question, sample, demoData, idea, codeIntro, code, practice, complexity, tests, deep) {
    return {
      ...meta,
      question,
      sample,
      demo: demoData,
      idea,
      codeIntro,
      code,
      practice,
      deepDives: deep || [],
      complexity,
      tests
    };
  }

  const commonDpDive = {
    title: "回文表怎么来",
    paragraphs: ["常用转移是：两端字符相等，并且中间也是回文。长度 1 和 2 可以直接判断。"],
    code: "pal[l][r] = s[l] == s[r] && (r - l <= 1 || pal[l + 1][r - 1])"
  };

  window.PAL_LESSONS = {
    "125": lesson(
      { id: "125", titleZh: "验证回文串", titleEn: "Valid Palindrome", difficulty: "Easy", stage: "热身 01", source: "https://leetcode.com/problems/valid-palindrome/", summary: "忽略大小写和非字母数字字符，判断整串是否回文。" },
      ["只看字母和数字，空格、标点都跳过。", "这题先练最基础的相向双指针。"],
      { input: "s = \"A man, a plan, a canal: Panama\"", output: "true", explanation: "清洗后左右对称。", rows: [{ label: "跳过", content: "空格和标点", result: "不比较" }, { label: "比较", content: "A 与 a", result: "相等" }, { label: "完成", content: "指针相遇", result: "true" }] },
      demo("双指针跳过无关字符", "遇到无关字符就移动指针，遇到有效字符才比较。", ["A", " ", "m", "a", ","], [
        frame("准备", "left 在左，right 在右。", ["active", "muted", "idle", "idle", "active"], [{ label: "动作", value: "找有效字符" }], [{ label: "L", index: 0 }, { label: "R", index: 4, position: "bottom" }]),
        frame("跳过逗号", "右边逗号不参与比较。", ["active", "muted", "idle", "active", "discarded"], [{ label: "动作", value: "R--" }]),
        frame("比较 A 和 a", "转小写后相等。", ["match", "muted", "idle", "match", "muted"], [{ label: "比较", value: "a == a" }], [], ["相等"]),
        frame("继续缩进", "空格也会被跳过。", ["muted", "discarded", "active", "muted", "muted"], [{ label: "下一步", value: "看 m" }]),
        frame("完成", "所有有效字符都配对成功。", ["best", "muted", "best", "best", "muted"], [{ label: "答案", value: "true" }], [], ["通过"])
      ]),
      "每次只比较当前两端的有效字符；符号跳过，字母统一成小写再比。",
      "提交区只需要这个 class Solution。",
      `class Solution {
public:
    bool isPalindrome(std::string s) {
        int left = 0;
        int right = static_cast<int>(s.size()) - 1;
        while (left < right) {
            while (left < right && !std::isalnum(static_cast<unsigned char>(s[left]))) ++left;
            while (left < right && !std::isalnum(static_cast<unsigned char>(s[right]))) --right;
            char a = static_cast<char>(std::tolower(static_cast<unsigned char>(s[left])));
            char b = static_cast<char>(std::tolower(static_cast<unsigned char>(s[right])));
            if (a != b) return false;
            ++left;
            --right;
        }
        return true;
    }
};`,
      { prompt: "s = \"race a car\" 是回文吗？", hint: "忽略空格后比较 raceacar。", answer: "不是，e 和 a 会失配。" },
      { time: "O(n)", space: "O(1)", explanation: "每个字符最多被左右指针扫过一次。", edgeCases: ["空格标点", "大小写混合", "只有一个有效字符", "数字"] },
      [{ input: "A man, a plan, a canal: Panama", expected: "true", note: "官方示例" }, { input: "race a car", expected: "false", note: "官方示例" }, { input: " ", expected: "true", note: "没有有效字符" }, { input: "0P", expected: "false", note: "数字参与比较" }, { input: ".,", expected: "true", note: "全是无关字符" }]
    ),

    "680": lesson(
      { id: "680", titleZh: "验证回文串 II", titleEn: "Valid Palindrome II", difficulty: "Easy", stage: "热身 02", source: "https://leetcode.com/problems/valid-palindrome-ii/", summary: "最多删一个字符，判断剩下的整串能不能成为回文。" },
      ["第一次失配之前，两端都已经匹配成功。", "失配后只有两条路：删左边，或者删右边。"],
      { input: "s = \"abca\"", output: "true", explanation: "删 b 或删 c 都能回文。", rows: [{ label: "先比较", content: "a 和 a", result: "相等" }, { label: "失配", content: "b 和 c", result: "分叉" }, { label: "补救", content: "删一边", result: "true" }] },
      demo("第一次失配处分叉", "只有第一次不相等时可以用删除机会。", ["a", "b", "c", "a"], [
        frame("准备", "两端开始比较。", ["active", "idle", "idle", "active"], [{ label: "删除", value: "0/1" }]),
        frame("a 和 a 相等", "正常缩进。", ["match", "idle", "idle", "match"], [{ label: "动作", value: "L++, R--" }]),
        frame("b 和 c 失配", "只能试删左或删右。", ["idle", "mismatch", "mismatch", "idle"], [{ label: "选择", value: "删左/删右" }]),
        frame("尝试删左", "跳过 b 后可行。", ["idle", "discarded", "best", "idle"], [{ label: "路径", value: "删 b" }], [], ["成功"]),
        frame("完成", "任一路成功即可。", ["best", "discarded", "best", "best"], [{ label: "答案", value: "true" }])
      ]),
      "正常双指针走；第一次失配时检查 s[left+1..right] 或 s[left..right-1]。",
      "check 用来判断一个闭区间是不是回文。",
      `class Solution {
    bool check(const std::string& s, int left, int right) {
        while (left < right) {
            if (s[left] != s[right]) return false;
            ++left;
            --right;
        }
        return true;
    }

public:
    bool validPalindrome(std::string s) {
        int left = 0;
        int right = static_cast<int>(s.size()) - 1;
        while (left < right) {
            if (s[left] != s[right]) {
                return check(s, left + 1, right) || check(s, left, right - 1);
            }
            ++left;
            --right;
        }
        return true;
    }
};`,
      { prompt: "s = \"abc\" 最多删一个字符可以吗？", hint: "删 a 剩 bc，删 c 剩 ab。", answer: "不可以，两条路都失败。" },
      { time: "O(n)", space: "O(1)", explanation: "主循环扫一遍，分叉检查最多再扫一个区间。", edgeCases: ["本来回文", "删左成功", "删右成功", "两边失败"] },
      [{ input: "aba", expected: "true", note: "官方示例" }, { input: "abca", expected: "true", note: "官方示例" }, { input: "abc", expected: "false", note: "官方示例" }, { input: "deeee", expected: "true", note: "删左端" }, { input: "ebcbbececabbacecbbcbe", expected: "true", note: "长串边界" }]
    ),

    "647": lesson(
      { id: "647", titleZh: "回文子串", titleEn: "Palindromic Substrings", difficulty: "Medium", stage: "基础 03", source: "https://leetcode.com/problems/palindromic-substrings/", summary: "统计字符串里有多少个连续回文区间，位置不同要分别计数。" },
      ["它问区间数量，不问不同字符串种类。", "中心扩展把枚举区间和判断回文合在一起。"],
      { input: "s = \"aaa\"", output: "6", explanation: "3 个单字符、2 个 aa、1 个 aaa。", rows: [{ label: "长度 1", content: "a, a, a", result: "3" }, { label: "长度 2", content: "aa, aa", result: "2" }, { label: "长度 3", content: "aaa", result: "1" }] },
      demo("从中心向两边扩", "每扩成功一次，答案加一。", ["a", "a", "a"], [
        frame("准备", "检查所有奇数和偶数中心。", ["idle", "idle", "idle"], [{ label: "答案", value: "0" }]),
        frame("中心 0", "单字符 a。", ["match", "idle", "idle"], [{ label: "答案", value: "1" }]),
        frame("偶数中心", "0 和 1 得到 aa。", ["match", "match", "idle"], [{ label: "答案", value: "2" }]),
        frame("中心 1 外扩", "得到 aaa。", ["match", "chosen", "match"], [{ label: "答案", value: "4" }]),
        frame("完成", "所有中心走完，总数为 6。", ["best", "best", "best"], [{ label: "最终", value: "6" }])
      ]),
      "把每个字符、每两个相邻字符中间都当中心，向两边扩。",
      "expand 返回从某个中心能扩出的回文数量。",
      `class Solution {
    int expand(const std::string& s, int left, int right) {
        int found = 0;
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
            ++found;
            --left;
            ++right;
        }
        return found;
    }

public:
    int countSubstrings(std::string s) {
        int answer = 0;
        for (int center = 0; center < static_cast<int>(s.size()); ++center) {
            answer += expand(s, center, center);
            answer += expand(s, center, center + 1);
        }
        return answer;
    }
};`,
      { prompt: "s = \"abba\" 有多少个回文子串？", hint: "先数 4 个单字符，再看 bb 和 abba。", answer: "6 个。" },
      { time: "O(n²)", space: "O(1)", explanation: "有 2n-1 个中心，每个中心最坏扩 O(n)。", edgeCases: ["单字符", "全不同", "全相同", "偶数回文"] },
      [{ input: "a", expected: "1", note: "最小长度" }, { input: "abc", expected: "3", note: "官方示例" }, { input: "aaa", expected: "6", note: "官方示例" }, { input: "abba", expected: "6", note: "偶数回文" }, { input: "ababa", expected: "9", note: "多层奇数回文" }]
    ),

    "5": lesson(
      { id: "5", titleZh: "最长回文子串", titleEn: "Longest Palindromic Substring", difficulty: "Medium", stage: "基础 04", source: "https://leetcode.com/problems/longest-palindromic-substring/", summary: "找到最长的一段回文子串，返回任意一个最长答案。" },
      ["它只要一段最长回文，不要求全部列出。", "和 LC647 的区别是：扩完以后更新最长区间。"],
      { input: "s = \"babad\"", output: "\"bab\" 或 \"aba\"", explanation: "两个都是合法最长答案。", rows: [{ label: "中心 b", content: "b", result: "长度 1" }, { label: "中心 a", content: "bab", result: "更新" }, { label: "中心 b", content: "aba", result: "并列" }] },
      demo("记录最长区间", "扩出更长回文时更新 best。", ["b", "a", "b", "a", "d"], [
        frame("准备", "best 先放第一个字符。", ["best", "idle", "idle", "idle", "idle"], [{ label: "best", value: "b" }]),
        frame("中心 1", "以 a 为中心外扩。", ["match", "chosen", "match", "idle", "idle"], [{ label: "best", value: "bab" }]),
        frame("中心 2", "aba 也是长度 3。", ["idle", "match", "chosen", "match", "idle"], [{ label: "并列", value: "aba" }]),
        frame("后续", "没有更长答案。", ["idle", "idle", "idle", "active", "active"], [{ label: "best", value: "bab" }]),
        frame("完成", "返回一个最长即可。", ["best", "best", "best", "idle", "idle"], [{ label: "答案", value: "bab" }])
      ]),
      "枚举中心，计算该中心的最长回文长度，超过 bestLen 就更新。",
      "最后用 substr(bestStart, bestLen) 返回答案。",
      `class Solution {
    int expand(const std::string& s, int left, int right) {
        while (left >= 0 && right < static_cast<int>(s.size()) && s[left] == s[right]) {
            --left;
            ++right;
        }
        return right - left - 1;
    }

public:
    std::string longestPalindrome(std::string s) {
        int bestStart = 0;
        int bestLen = 1;
        for (int center = 0; center < static_cast<int>(s.size()); ++center) {
            int len = std::max(expand(s, center, center), expand(s, center, center + 1));
            if (len > bestLen) {
                bestLen = len;
                bestStart = center - (len - 1) / 2;
            }
        }
        return s.substr(bestStart, bestLen);
    }
};`,
      { prompt: "s = \"cbbd\" 的答案是什么？", hint: "注意偶数中心。", answer: "\"bb\"。" },
      { time: "O(n²)", space: "O(1)", explanation: "枚举中心，每个中心最坏扩 O(n)。", edgeCases: ["奇数回文", "偶数回文", "并列最长", "单字符"] },
      [{ input: "babad", expected: "bab 或 aba", note: "官方示例" }, { input: "cbbd", expected: "bb", note: "偶数回文" }, { input: "a", expected: "a", note: "最小长度" }, { input: "ac", expected: "a 或 c", note: "并列单字符" }, { input: "forgeeksskeegfor", expected: "geeksskeeg", note: "长回文" }]
    ),

    "131": lesson(
      { id: "131", titleZh: "分割回文串", titleEn: "Palindrome Partitioning", difficulty: "Medium", stage: "组合 05", source: "https://leetcode.com/problems/palindrome-partitioning/", summary: "把字符串切成若干回文段，返回所有切法。" },
      ["它要所有切法，不是最少切法。", "先预处理回文表，再用回溯枚举每一刀。"],
      { input: "s = \"aab\"", output: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]", explanation: "a|a|b 和 aa|b 都合法。", rows: [{ label: "选 a", content: "再选 a、b", result: "[a,a,b]" }, { label: "选 aa", content: "再选 b", result: "[aa,b]" }, { label: "选 aab", content: "不是回文", result: "跳过" }] },
      demo("选择、递归、撤销", "每次只选择回文段。", ["a", "a", "b"], [
        frame("准备", "start = 0。", ["active", "idle", "idle"], [{ label: "path", value: "[]" }]),
        frame("选 a", "path = [a]。", ["chosen", "active", "idle"], [{ label: "path", value: "[a]" }]),
        frame("再选 a", "path = [a,a]。", ["chosen", "chosen", "active"], [{ label: "path", value: "[a,a]" }]),
        frame("选 b", "记录 [a,a,b]。", ["chosen", "chosen", "chosen"], [{ label: "答案数", value: "1" }]),
        frame("选 aa", "回到开头改走 aa。", ["chosen", "chosen", "active"], [{ label: "path", value: "[aa]" }]),
        frame("完成", "再选 b，得到第二条。", ["best", "best", "best"], [{ label: "答案数", value: "2" }])
      ]),
      "pal[start][end] 为 true 时，才能把 s[start..end] 放进 path。",
      "dfs(start) 枚举下一刀的终点。",
      `class Solution {
    std::string text;
    std::vector<std::vector<bool>> pal;
    std::vector<std::string> path;
    std::vector<std::vector<std::string>> ans;

    void dfs(int start) {
        if (start == static_cast<int>(text.size())) {
            ans.push_back(path);
            return;
        }
        for (int end = start; end < static_cast<int>(text.size()); ++end) {
            if (!pal[start][end]) continue;
            path.push_back(text.substr(start, end - start + 1));
            dfs(end + 1);
            path.pop_back();
        }
    }

public:
    std::vector<std::vector<std::string>> partition(std::string s) {
        text = s;
        int n = static_cast<int>(s.size());
        pal.assign(n, std::vector<bool>(n, false));
        for (int left = n - 1; left >= 0; --left) {
            for (int right = left; right < n; ++right) {
                pal[left][right] = s[left] == s[right] && (right - left <= 1 || pal[left + 1][right - 1]);
            }
        }
        path.clear();
        ans.clear();
        dfs(0);
        return ans;
    }
};`,
      { prompt: "s = \"efe\" 有哪些切法？", hint: "整串 efe 也是回文。", answer: "[e,f,e] 和 [efe]。" },
      { time: "O(n² + ans)", space: "O(n²)", explanation: "回文表 O(n²)，回溯输出所有合法方案。", edgeCases: ["只能单字符切", "整串回文", "重复字符", "多种切法"] },
      [{ input: "aab", expected: "[[a,a,b],[aa,b]]", note: "官方示例" }, { input: "a", expected: "[[a]]", note: "最小长度" }, { input: "efe", expected: "[[e,f,e],[efe]]", note: "整串回文" }, { input: "abc", expected: "[[a,b,c]]", note: "只能单字符切" }, { input: "aaa", expected: "4 种切法", note: "组合增长" }],
      [commonDpDive]
    ),

    "132": lesson(
      { id: "132", titleZh: "分割回文串 II", titleEn: "Palindrome Partitioning II", difficulty: "Hard", stage: "最小化 06", source: "https://leetcode.com/problems/palindrome-partitioning-ii/", summary: "把字符串切成回文段，求最少需要切几刀。" },
      ["它和 LC131 很像，但只问最少切数。", "核心是枚举最后一段回文从哪里开始。"],
      { input: "s = \"aab\"", output: "1", explanation: "aa|b 只需要一刀。", rows: [{ label: "a|a|b", content: "都回文", result: "2 刀" }, { label: "aa|b", content: "都回文", result: "1 刀" }, { label: "aab", content: "不是回文", result: "不能 0 刀" }] },
      demo("前缀 DP", "cut[i] 表示 s[0..i] 最少切几刀。", ["a", "a", "b"], [
        frame("准备", "先建回文表。", ["idle", "idle", "idle"], [{ label: "cut", value: "?" }]),
        frame("i = 0", "a 是回文。", ["chosen", "idle", "idle"], [{ label: "cut[0]", value: "0" }]),
        frame("i = 1", "aa 是回文。", ["chosen", "chosen", "idle"], [{ label: "cut[1]", value: "0" }]),
        frame("i = 2", "aab 不是回文。", ["active", "active", "active"], [{ label: "整段", value: "失败" }]),
        frame("最后一段 b", "cut[2] = cut[1] + 1。", ["muted", "muted", "chosen"], [{ label: "cut[2]", value: "1" }]),
        frame("完成", "答案 1。", ["best", "best", "best"], [{ label: "答案", value: "1" }])
      ]),
      "如果 pal[j][i] 为 true，最后一段可以是 s[j..i]，用 cut[j-1] + 1 更新。",
      "先建回文表，再做前缀最小切分。",
      `class Solution {
public:
    int minCut(std::string s) {
        int n = static_cast<int>(s.size());
        std::vector<std::vector<bool>> pal(n, std::vector<bool>(n, false));
        for (int left = n - 1; left >= 0; --left) {
            for (int right = left; right < n; ++right) {
                pal[left][right] = s[left] == s[right] && (right - left <= 1 || pal[left + 1][right - 1]);
            }
        }
        std::vector<int> cut(n, 0);
        for (int i = 0; i < n; ++i) {
            if (pal[0][i]) {
                cut[i] = 0;
                continue;
            }
            cut[i] = i;
            for (int j = 1; j <= i; ++j) {
                if (pal[j][i]) cut[i] = std::min(cut[i], cut[j - 1] + 1);
            }
        }
        return cut[n - 1];
    }
};`,
      { prompt: "s = \"aba\" 最少切几刀？", hint: "整段是不是回文？", answer: "0 刀。" },
      { time: "O(n²)", space: "O(n²)", explanation: "回文表和 DP 转移都枚举区间边界。", edgeCases: ["整串回文", "无长回文", "答案为 0", "答案接近 n-1"] },
      [{ input: "aab", expected: "1", note: "官方示例" }, { input: "a", expected: "0", note: "最小长度" }, { input: "ab", expected: "1", note: "官方示例" }, { input: "aabaa", expected: "0", note: "整串回文" }, { input: "banana", expected: "1", note: "b|anana" }],
      [commonDpDive]
    ),

    "2472": lesson(
      { id: "2472", titleZh: "最多不重叠回文子串", titleEn: "Maximum Number of Non-overlapping Palindrome Substrings", difficulty: "Hard", stage: "拓展 07", source: "https://leetcode.com/problems/maximum-number-of-non-overlapping-palindrome-substrings/", summary: "选尽量多的长度至少为 k 的不重叠回文段。" },
      ["把每个可用回文段看成时间轴上的一段预约。", "选了这段，下一段必须从它右边开始。"],
      { input: "s = \"abaccdbbd\", k = 3", output: "2", explanation: "可以选 aba 和 dbbd。", rows: [{ label: "第一段", content: "aba 覆盖 [0,2]", result: "1 段" }, { label: "第二段", content: "dbbd 覆盖 [5,8]", result: "2 段" }, { label: "限制", content: "两段不重叠", result: "合法" }] },
      demo("前缀最优选段", "dp[i] 表示前 i 个字符最多能选几段。", ["a", "b", "a", "c", "c", "d", "b", "b", "d"], [
        frame("准备", "先预处理哪些区间是回文。", ["idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle"], [{ label: "k", value: "3" }]),
        frame("找到 aba", "s[0..2] 是长度 3 的回文。", ["chosen", "chosen", "chosen", "idle", "idle", "idle", "idle", "idle", "idle"], [{ label: "dp[3]", value: "1" }], [], ["aba"]),
        frame("中间继承", "没有新回文段时沿用前面答案。", ["chosen", "chosen", "chosen", "active", "active", "idle", "idle", "idle", "idle"], [{ label: "动作", value: "继承" }]),
        frame("找到 dbbd", "它从 5 开始，不会碰到 aba。", ["chosen", "chosen", "chosen", "muted", "muted", "chosen", "chosen", "chosen", "chosen"], [{ label: "dp[9]", value: "2" }], [], ["aba", "dbbd"]),
        frame("完成", "最多能选 2 段。", ["best", "best", "best", "muted", "muted", "best", "best", "best", "best"], [{ label: "答案", value: "2" }])
      ]),
      "先知道每段是不是回文，再做前缀 DP：不选新段就继承，选最后一段就接 dp[start] + 1。",
      "二维 pal 表负责判定回文，dp[end] 负责前缀最优。",
      `class Solution {
public:
    int maxPalindromes(std::string s, int k) {
        int n = static_cast<int>(s.size());
        std::vector<std::vector<bool>> pal(n, std::vector<bool>(n, false));
        for (int left = n - 1; left >= 0; --left) {
            for (int right = left; right < n; ++right) {
                pal[left][right] = s[left] == s[right] && (right - left <= 1 || pal[left + 1][right - 1]);
            }
        }
        std::vector<int> dp(n + 1, 0);
        for (int end = 1; end <= n; ++end) {
            dp[end] = dp[end - 1];
            for (int start = 0; start + k <= end; ++start) {
                if (pal[start][end - 1]) dp[end] = std::max(dp[end], dp[start] + 1);
            }
        }
        return dp[n];
    }
};`,
      { prompt: "s = \"aaaaa\", k = 2 最多选几段？", hint: "目标是段数，不是总长度。", answer: "2 段，比如 aa + aa。" },
      { time: "O(n²)", space: "O(n²)", explanation: "回文表和前缀 DP 都枚举区间边界。", edgeCases: ["k=1", "无可选段", "全相同字符", "候选段大量重叠"] },
      [{ input: "abaccdbbd, k=3", expected: "2", note: "官方示例" }, { input: "adbcda, k=2", expected: "0", note: "官方示例" }, { input: "a, k=1", expected: "1", note: "最小长度" }, { input: "aaaaa, k=2", expected: "2", note: "短段更优" }, { input: "abbaabba, k=4", expected: "2", note: "两段 abba" }, { input: "abcddcxyzzyx, k=4", expected: "2", note: "两段长回文" }],
      [commonDpDive]
    ),

    "214": lesson(
      { id: "214", titleZh: "最短回文串", titleEn: "Shortest Palindrome", difficulty: "Hard", stage: "高阶 08", source: "https://leetcode.com/problems/shortest-palindrome/", summary: "只能在前面补字符，所以要找原串最长回文前缀。" },
      ["如果开头一段已经是回文，这段可以原样保留。", "剩下的尾巴反过来补到前面，就会得到最短答案。"],
      { input: "s = \"aacecaaa\"", output: "\"aaacecaaa\"", explanation: "最长回文前缀是 aacecaa，尾巴 a 补到前面。", rows: [{ label: "保留", content: "aacecaa", result: "回文前缀" }, { label: "尾巴", content: "a", result: "反转补前" }, { label: "结果", content: "a + aacecaaa", result: "aaacecaaa" }] },
      demo("KMP 找最长回文前缀", "先理解目标，再用 s + # + reverse(s) 的前缀函数加速。", ["a", "a", "c", "e", "c", "a", "a", "a"], [
        frame("准备", "只允许往前补，所以要保留最长回文前缀。", ["idle", "idle", "idle", "idle", "idle", "idle", "idle", "idle"], [{ label: "目标", value: "最长回文前缀" }]),
        frame("拼接", "构造 s + # + reverse(s)。", ["active", "active", "active", "active", "active", "active", "active", "active"], [{ label: "工具", value: "前缀函数" }]),
        frame("最后 pi", "前缀函数最后一个值表示可保留长度。", ["best", "best", "best", "best", "best", "best", "best", "muted"], [{ label: "keep", value: "7" }]),
        frame("补尾巴", "尾巴是最后一个 a，反过来补到前面。", ["best", "best", "best", "best", "best", "best", "best", "chosen"], [{ label: "补", value: "a" }]),
        frame("完成", "得到 aaacecaaa。", ["best", "best", "best", "best", "best", "best", "best", "best"], [{ label: "答案", value: "aaacecaaa" }])
      ]),
      "找最长回文前缀；把剩下的后缀反转后接到原串前面。",
      "KMP 前缀函数在线性时间求出这个最长前缀长度。",
      `class Solution {
public:
    std::string shortestPalindrome(std::string s) {
        std::string reversed = s;
        std::reverse(reversed.begin(), reversed.end());
        std::string combined = s + "#" + reversed;
        std::vector<int> pi(combined.size(), 0);
        for (int i = 1; i < static_cast<int>(combined.size()); ++i) {
            int j = pi[i - 1];
            while (j > 0 && combined[i] != combined[j]) j = pi[j - 1];
            if (combined[i] == combined[j]) ++j;
            pi[i] = j;
        }
        int keep = pi.back();
        std::string add = s.substr(keep);
        std::reverse(add.begin(), add.end());
        return add + s;
    }
};`,
      { prompt: "s = \"abcd\" 的答案是什么？", hint: "最长回文前缀只有 a。", answer: "dcbabcd。" },
      { time: "O(n)", space: "O(n)", explanation: "反转、拼接和前缀函数都是线性。", edgeCases: ["空串", "单字符", "本身回文", "没有长回文前缀"] },
      [{ input: "aacecaaa", expected: "aaacecaaa", note: "官方示例" }, { input: "abcd", expected: "dcbabcd", note: "官方示例" }, { input: "", expected: "", note: "空串" }, { input: "a", expected: "a", note: "单字符" }, { input: "aba", expected: "aba", note: "本来回文" }, { input: "aaab", expected: "baaab", note: "长回文前缀" }]
    ),

    "1960": lesson(
      { id: "1960", titleZh: "两个回文子串长度乘积最大值", titleEn: "Maximum Product of the Length of Two Palindromic Substrings", difficulty: "Hard", stage: "高阶 09", source: "https://leetcode.com/problems/maximum-product-of-the-length-of-two-palindromic-substrings/", summary: "选两个不重叠的奇数长度回文子串，让长度乘积最大。" },
      ["题目只允许选奇数长度回文。", "n 很大时，要用 Manacher 在线性时间得到每个中心的回文半径。"],
      { input: "s = \"ababbb\"", output: "9", explanation: "选 aba 和 bbb，长度都是 3，乘积是 9。", rows: [{ label: "左边", content: "aba 覆盖 [0,2]", result: "长度 3" }, { label: "右边", content: "bbb 覆盖 [3,5]", result: "长度 3" }, { label: "乘积", content: "3 * 3", result: "9" }] },
      demo("切分点左右最优", "先算奇数半径，再整理每个切分点左边和右边的最长回文。", ["a", "b", "a", "b", "b", "b"], [
        frame("准备", "两个回文不能重叠，所以一定存在切分点。", ["idle", "idle", "idle", "idle", "idle", "idle"], [{ label: "目标", value: "left * right" }]),
        frame("左边 aba", "中心 1 可扩出 aba。", ["match", "chosen", "match", "idle", "idle", "idle"], [{ label: "左长", value: "3" }], [], ["aba"]),
        frame("右边 bbb", "中心 4 可扩出 bbb。", ["idle", "idle", "idle", "match", "chosen", "match"], [{ label: "右长", value: "3" }], [], ["bbb"]),
        frame("枚举切分", "在 2 和 3 之间切，互不重叠。", ["best", "best", "best", "best", "best", "best"], [{ label: "乘积", value: "3*3" }]),
        frame("完成", "最大乘积为 9。", ["best", "best", "best", "best", "best", "best"], [{ label: "答案", value: "9" }])
      ]),
      "用 Manacher 算奇数回文半径，再预处理 leftBest[i] 和 rightBest[i]，枚举切分点相乘。",
      "endBest/startBest 用来把一个大回文向内缩短，得到不同结尾或起点的可用长度。",
      `class Solution {
public:
    long long maxProduct(std::string s) {
        int n = static_cast<int>(s.size());
        std::vector<int> radius(n, 0);
        int left = 0;
        int right = -1;
        for (int i = 0; i < n; ++i) {
            int k = (i > right) ? 1 : std::min(radius[left + right - i], right - i + 1);
            while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) ++k;
            radius[i] = k;
            if (i + k - 1 > right) {
                left = i - k + 1;
                right = i + k - 1;
            }
        }
        std::vector<int> endBest(n, 1), startBest(n, 1);
        for (int center = 0; center < n; ++center) {
            int len = radius[center] * 2 - 1;
            int start = center - radius[center] + 1;
            int end = center + radius[center] - 1;
            endBest[end] = std::max(endBest[end], len);
            startBest[start] = std::max(startBest[start], len);
        }
        for (int i = n - 2; i >= 0; --i) endBest[i] = std::max(endBest[i], endBest[i + 1] - 2);
        for (int i = 1; i < n; ++i) startBest[i] = std::max(startBest[i], startBest[i - 1] - 2);

        std::vector<int> leftBest(n, 1), rightBest(n, 1);
        leftBest[0] = endBest[0];
        for (int i = 1; i < n; ++i) leftBest[i] = std::max(leftBest[i - 1], endBest[i]);
        rightBest[n - 1] = startBest[n - 1];
        for (int i = n - 2; i >= 0; --i) rightBest[i] = std::max(rightBest[i + 1], startBest[i]);

        long long answer = 1;
        for (int split = 0; split + 1 < n; ++split) {
            answer = std::max(answer, 1LL * leftBest[split] * rightBest[split + 1]);
        }
        return answer;
    }
};`,
      { prompt: "s = \"zaaaxbbby\" 为什么答案是 9？", hint: "左边 aaa，右边 bbb。", answer: "两段长度都是 3，乘积 9。" },
      { time: "O(n)", space: "O(n)", explanation: "Manacher、左右最值传播、切分点枚举都是线性。", edgeCases: ["长度为 2", "全相同", "只有单字符回文", "最佳回文贴着切分点"] },
      [{ input: "ababbb", expected: "9", note: "官方示例" }, { input: "zaaaxbbby", expected: "9", note: "官方示例" }, { input: "aa", expected: "1", note: "只能两个单字符" }, { input: "abc", expected: "1", note: "没有更长奇回文" }, { input: "aaaa", expected: "3", note: "3 和 1 最优" }, { input: "abacdc", expected: "9", note: "aba 和 cdc" }]
    )
  };
}());
