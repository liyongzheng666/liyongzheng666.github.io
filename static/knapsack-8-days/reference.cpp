#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <random>
#include <stdexcept>
#include <utility>
#include <vector>
using namespace std;

struct Job { int cpu, mem, reward; };

int maxValue01(const vector<int>& weights, const vector<int>& values, int capacity) {
    vector<int> dp(capacity + 1, 0);
    for (int i = 0; i < static_cast<int>(weights.size()); ++i)
        for (int j = capacity; j >= weights[i]; --j)
            dp[j] = max(dp[j], dp[j - weights[i]] + values[i]);
    return dp[capacity];
}

long long countSubsets(const vector<int>& nums, int target) {
    vector<long long> dp(target + 1, 0);
    dp[0] = 1;
    for (int x : nums)
        for (int j = target; j >= x; --j)
            dp[j] += dp[j - x];
    return dp[target];
}

int minUnits(const vector<int>& sizes, int target) {
    const int inf = target + 1;
    vector<int> dp(target + 1, inf);
    dp[0] = 0;
    for (int x : sizes)
        for (int j = x; j <= target; ++j)
            if (dp[j - x] != inf) dp[j] = min(dp[j], dp[j - x] + 1);
    return dp[target] == inf ? -1 : dp[target];
}

pair<long long, long long> countWays(const vector<int>& sizes, int target) {
    vector<long long> combinations(target + 1, 0), sequences(target + 1, 0);
    combinations[0] = sequences[0] = 1;
    for (int x : sizes)
        for (int j = x; j <= target; ++j)
            combinations[j] += combinations[j - x];
    for (int j = 1; j <= target; ++j)
        for (int x : sizes)
            if (j >= x) sequences[j] += sequences[j - x];
    return {combinations[target], sequences[target]};
}

int maxReward(const vector<Job>& jobs, int cpu, int mem) {
    vector<vector<int>> dp(cpu + 1, vector<int>(mem + 1, 0));
    for (auto job : jobs)
        for (int c = cpu; c >= job.cpu; --c)
            for (int m = mem; m >= job.mem; --m)
                dp[c][m] = max(dp[c][m], dp[c - job.cpu][m - job.mem] + job.reward);
    return dp[cpu][mem];
}

#include "tests.hpp"

// 独立 oracle：子集枚举、BFS、完整数量向量/序列枚举；不复用 DP 转移。
void verifyWithOracles() {
    mt19937 rng(20260913);
    auto random = [&](int upper) { return static_cast<int>(rng() % upper); };
    auto require = [](bool ok, const char* label) {
        if (!ok) throw runtime_error(label);
    };
    for (int trial = 0; trial < 500; ++trial) {
        const int n = random(9), cap = random(16), target = random(16);
        vector<int> weights(n), values(n), nums(n);
        vector<Job> jobs;
        for (int i = 0; i < n; ++i) {
            weights[i] = 1 + random(6); values[i] = random(15); nums[i] = random(6);
            int c = random(5), m = random(5);
            if (c == 0 && m == 0) c = 1;
            jobs.push_back({c, m, random(15)});
        }
        const int cpu = random(9), mem = random(9);
        int best = 0, reward = 0;
        long long subsets = 0;
        for (int mask = 0; mask < (1 << n); ++mask) {
            int w = 0, v = 0, s = 0, c = 0, m = 0, r = 0;
            for (int i = 0; i < n; ++i) if (mask & (1 << i)) {
                w += weights[i]; v += values[i]; s += nums[i];
                c += jobs[i].cpu; m += jobs[i].mem; r += jobs[i].reward;
            }
            if (w <= cap) best = max(best, v);
            if (s == target) ++subsets;
            if (c <= cpu && m <= mem) reward = max(reward, r);
        }
        require(maxValue01(weights, values, cap) == best, "Q1 oracle mismatch");
        require(countSubsets(nums, target) == subsets, "Q2 oracle mismatch");
        require(maxReward(jobs, cpu, mem) == reward, "Q5 oracle mismatch");

        vector<int> sizes;
        for (int x = 1; x <= 6; ++x) if (random(2)) sizes.push_back(x);
        if (sizes.empty()) sizes.push_back(7);
        vector<int> distance(target + 1, -1);
        queue<int> q; q.push(0); distance[0] = 0;
        while (!q.empty()) {
            int s = q.front(); q.pop();
            for (int x : sizes) if (s + x <= target && distance[s + x] < 0) {
                distance[s + x] = distance[s] + 1; q.push(s + x);
            }
        }
        require(minUnits(sizes, target) == distance[target], "Q3 oracle mismatch");
        const int smallTarget = random(11);
        long long unordered = 0, ordered = 0;
        function<void(int, int)> enumerateCounts = [&](int i, int left) {
            if (i == static_cast<int>(sizes.size())) { unordered += left == 0; return; }
            for (int k = 0; k * sizes[i] <= left; ++k)
                enumerateCounts(i + 1, left - k * sizes[i]);
        };
        function<void(int)> enumerateSequences = [&](int left) {
            if (left == 0) { ++ordered; return; }
            for (int x : sizes) if (x <= left) enumerateSequences(left - x);
        };
        enumerateCounts(0, smallTarget); enumerateSequences(smallTarget);
        require(countWays(sizes, smallTarget) == make_pair(unordered, ordered), "Q4 oracle mismatch");
    }
    cout << "Independent oracle comparisons: 2500/2500\n";
}

int main() {
    if (runFixedTests() != 0) return 1;
    verifyWithOracles();
    return 0;
}
