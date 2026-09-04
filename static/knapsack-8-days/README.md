# 2026-09-13 背包闭卷测试

90 分钟，5 题，每题 20 分。Q1 修错 10 分钟，Q2 编码 20 分钟，Q3 编码 15 分钟，Q4 编码 20 分钟，Q5 编码 25 分钟。允许编译和运行公开用例；不看笔记、搜索、AI 或 reference.cpp。看提示后记为“辅助完成”，不计入独立通过题数。先写状态定义、初值、转移和循环方向，再编码。

下载 starter.cpp 和 tests.hpp 到同一目录，只修改 starter.cpp。reference.cpp 是考后答案，开考前不要打开。此公开静态资源没有保密或定时解锁保证。

```sh
clang++ -std=c++17 -Wall -Wextra -pedantic starter.cpp -o knapsack-exam
./knapsack-exam
```

starter 中的 Q1 有意保留循环错误，Q2–Q5 会抛出 TODO 异常；初始用例失败属于预期。

## Q1：同一部署包只能选一次（20 分 / 10 分钟）

函数 `int maxValue01(const vector<int>& weights, const vector<int>& values, int capacity)`。

给出 n 个包的容量消耗与收益，各最多选一次，允许不选或不装满；求容量不超过 capacity 的最大收益。0≤n≤50，weights 与 values 等长，1≤weights[i]≤100，0≤values[i]≤1000，0≤capacity≤1000。

starter 中的循环有错误。修复；写出最小或简洁反例；说明为什么修复后不会重复使用当前包。

公开例：weights=[3,4]，values=[4,5]，capacity=6，答案 5；错误代码得到 8。空数组/预算 0 返回 0；weights=[5]，values=[9]，capacity=3 返回 0。

评分：找准原因 5 分，正确修复 5 分，反例与手算 5 分，说明读取上一物品层 5 分。

## Q2：精确内存组合（20 分 / 20 分钟）

函数 `long long countSubsets(const vector<int>& nums, int target)`。

每个下标表示一个独立包，最多选一次，问所选数字总和恰好等于 target 的下标子集有多少。相同大小的不同下标算不同选择；零大小包也可以选或不选。0≤n≤20，0≤nums[i]≤50，0≤target≤1000。

公开例：[0,1,2,2,3],4 → 4；[0,0,2],0 → 4；[2,2],2 → 2；[],0 → 1；[2,4],3 → 0。

## Q3：最少分配块（20 分 / 15 分钟）

函数 `int minUnits(const vector<int>& sizes, int target)`。

有若干不同的正整数块规格，每种无限供应。恰好组成 target 所需最少块数，不能组成返回 -1。1≤sizes.size()≤20，1≤sizes[i]≤10000，0≤target≤10000。

公开例：[4,7,9],18 → 2；[4,7],9 → -1；[4,7],0 → 0；[1,3,4],6 → 2。

## Q4：配置数量与执行序列（20 分 / 20 分钟）

函数 `pair<long long,long long> countWays(const vector<int>& sizes, int target)`。

sizes 是不同的正整数操作时长，每种可使用任意次，总时长恰好为 target。返回 `{不考虑顺序的组合数, 考虑顺序的序列数}`。1≤sizes.size()≤10，1≤sizes[i]≤30，0≤target≤30。target=0 时空组合、空序列各算一种。

公开例：[2,3,5],8 → {3,6}；[1,3,4],5 → {3,6}；[2,4],0 → {1,1}；[4,6],5 → {0,0}。

## Q5：双预算任务收益（20 分 / 25 分钟）

类型 `struct Job { int cpu, mem, reward; };`；函数 `int maxReward(const vector<Job>& jobs, int cpu, int mem)`。

每个任务至多选一次，消耗 CPU 和内存，获得 reward；两项消耗均不能超过预算，求最大总收益。可不选任务。0≤jobs.size()≤50，0≤cpu,mem≤30；每项消耗 0..20，但两项不同时为 0；0≤reward≤1000。

公开例：jobs={{2,1,6},{1,2,5},{2,2,14},{1,1,3}}，预算 3,3 → 17；jobs={{0,2,5},{2,0,6},{1,1,4}}，预算 2,2 → 11；空任务、预算 0,0 → 0；单任务{{1,1,7}}，预算3,3 → 7。

## 编码题评分与判定

Q2–Q5 每题：状态定义 4 分，初值与方向 4 分，正确实现 8 分，边界测试 2 分，时空复杂度解释 2 分。公开用例通过仅是功能证据，不自动等于 20 分。

80 分以上且 4 道编码中至少 3 道无需提示完成：达到本周基础目标；60–79 分：按错因补练两天；60 分以下：先重做 D1/D2/D5 核心。记录看提示次数和首次通过时间，不用“看懂答案”替代独立完成。

## 考后参考与 C++ 检查

```sh
clang++ -std=c++17 -O1 -Wall -Wextra -pedantic -fsanitize=address,undefined -fno-omit-frame-pointer reference.cpp -o knapsack-reference
./knapsack-reference
```

参考程序包含 20 个公开用例，以及固定随机种子生成的 2500 次小规模独立 oracle 比较。oracle 使用子集穷举、BFS、数量向量和完整序列枚举，没有直接重复 DP 转移。

Q1：dp[j] 为容量至多 j 的最大收益，全零，容量倒序；O(nC) 时间/O(C) 空间。

Q2：dp[j] 为前若干下标凑出 j 的方案数，dp[0]=1，其余 0，容量倒序（含 j=0）；x=0 会使各状态翻倍。O(nT)/O(T)。倒序循环用有符号 int，避免 size_t 在 0 下溢。最多 2^20 个子集，long long 充足。

Q3：dp[j] 为恰好 j 的最少块数，dp[0]=0，其余 INF=T+1；正序允许重复取；只从可达状态转移。O(kT)/O(T)。正整数规格使可达答案最多 T，不能把不可达状态初始化为 0。

Q4：均 dp[0]=1，其余 0。无序：规格外层/总量正序内层；有序：总量正序外层/规格内层。O(kT)/O(T)。本题 target≤30，任意正整数序列数至多 2^(target-1)（target>0），因此 long long 安全；不能将这个保证直接推广到无限范围的其他计数题。

Q5：dp[c][m] 为不超过两个预算的最大收益，全零；遍历任务，两个预算均倒序。O(nCM)/O(CM)。价值最多 50000，int 充足；单项资源可能为 0，仍需有符号索引和防重复复用。
