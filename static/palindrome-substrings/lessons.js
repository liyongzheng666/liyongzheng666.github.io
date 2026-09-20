window.PAL_TOPIC = {
  problems: [
    {
      phase: "热身",
      id: "125",
      title: "Valid Palindrome",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-palindrome/",
      method: "相向双指针",
      summary: "先学会从两端往中间看，并跳过无关字符。",
      demo: "left/right 跳过非字母数字，再比较。"
    },
    {
      phase: "热身进阶",
      id: "680",
      title: "Valid Palindrome II",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-palindrome-ii/",
      method: "双指针 + 一次分支",
      summary: "第一次不相等时，只试删左或删右一次。",
      demo: "失配后拆成两条路，任何一路成功即可。"
    },
    {
      phase: "核心 1",
      id: "647",
      title: "Palindromic Substrings",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/palindromic-substrings/",
      method: "中心扩展",
      summary: "从每个中心向外扩，每扩成功一次就计数。",
      demo: "奇数中心和偶数中心如何统一计数。"
    },
    {
      phase: "核心 2",
      id: "5",
      title: "Longest Palindromic Substring",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-palindromic-substring/",
      method: "中心扩展 / 区间 DP",
      summary: "从“数所有”变成“记录最长区间”。",
      demo: "更新 start/end，保留目前最长的一段。"
    },
    {
      phase: "组合",
      id: "131",
      title: "Palindrome Partitioning",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/palindrome-partitioning/",
      method: "回文表 + 回溯",
      summary: "每次切一段回文，继续处理后面的字符。",
      demo: "在 aab 上画选择树：选取、递归、撤销。"
    },
    {
      phase: "最小化",
      id: "132",
      title: "Palindrome Partitioning II",
      difficulty: "Hard",
      url: "https://leetcode.com/problems/palindrome-partitioning-ii/",
      method: "回文表 + 前缀 DP",
      summary: "不列出所有切法，只求最少切几刀。",
      demo: "cuts[i] 由最后一段 s[j..i] 推出来。"
    },
    {
      phase: "拓展",
      id: "2472",
      title: "Maximum Number of Non-overlapping Palindrome Substrings",
      difficulty: "Hard",
      url: "https://leetcode.com/problems/maximum-number-of-non-overlapping-palindrome-substrings/",
      method: "回文判定 + 区间选择",
      summary: "回文段不能重叠，要在“选”和“不选”之间取最优。",
      demo: "在时间轴上看选一段后如何跳到下一段。"
    },
    {
      phase: "高阶",
      id: "214",
      title: "Shortest Palindrome",
      difficulty: "Hard",
      url: "https://leetcode.com/problems/shortest-palindrome/",
      method: "KMP 前缀函数",
      summary: "找最长回文前缀，然后把剩余部分反过来补到前面。",
      demo: "在 s + # + reverse(s) 上看前缀函数。"
    },
    {
      phase: "高阶挑战",
      id: "1960",
      title: "Maximum Product of the Length of Two Palindromic Substrings",
      difficulty: "Hard",
      url: "https://leetcode.com/problems/maximum-product-of-the-length-of-two-palindromic-substrings/",
      method: "Manacher + 前后缀最值",
      summary: "长度到 1e5 时，要用线性算法记录每个位置的最优回文。",
      demo: "回文半径、右边界复用，以及分割点两边乘积。"
    }
  ],
  sample: {
    value: "aaa",
    frames: [
      {
        center: "准备",
        range: "-",
        count: 0,
        left: -1,
        right: -1,
        note: "我们从 s = \"aaa\" 开始。每个字符本身都可能是回文，两个字符中间也可能是回文中心。"
      },
      {
        center: "0（奇数）",
        range: "[0,0] = a",
        count: 1,
        left: 0,
        right: 0,
        note: "以 0 号字符为中心，左右都是 a，找到第 1 个回文子串。再往外会越界，所以这个中心结束。"
      },
      {
        center: "0 和 1 中间（偶数）",
        range: "[0,1] = aa",
        count: 2,
        left: 0,
        right: 1,
        note: "偶数长度没有单独的中间字符，所以从 left=0、right=1 开始。两个 a 相等，答案加一。"
      },
      {
        center: "1（奇数）",
        range: "[1,1] = a",
        count: 3,
        left: 1,
        right: 1,
        note: "换到 1 号字符做中心，单个 a 先算一个回文。"
      },
      {
        center: "1（继续扩）",
        range: "[0,2] = aaa",
        count: 4,
        left: 0,
        right: 2,
        note: "继续向外扩，0 号和 2 号也相等，于是 aaa 又是一个新的回文子串。"
      },
      {
        center: "1 和 2 中间（偶数）",
        range: "[1,2] = aa",
        count: 5,
        left: 1,
        right: 2,
        note: "再看 1 和 2 中间的偶数中心，得到右边这个 aa。"
      },
      {
        center: "2（奇数）",
        range: "[2,2] = a",
        count: 6,
        left: 2,
        right: 2,
        note: "最后一个字符自己也是回文。到这里，3 个单字符、2 个 aa、1 个 aaa，全都数到了。"
      },
      {
        center: "完成",
        range: "全部中心已检查",
        count: 6,
        left: -1,
        right: -1,
        note: "最终答案是 6。代码里 expand 每成功一次 while 循环，就对应这里的一次计数。"
      }
    ]
  },
  tests: [
    ["a", 1, "最小长度"],
    ["ab", 2, "只有两个单字符"],
    ["aa", 3, "两个单字符 + aa"],
    ["aaa", 6, "本章手算例子"],
    ["abc", 3, "全不相同"],
    ["abba", 6, "偶数回文：bb 和 abba"],
    ["ababa", 9, "多层奇数回文"],
    ["aaaa", 10, "所有子串都是回文"],
    ["racecar", 10, "长奇数回文"]
  ]
};
