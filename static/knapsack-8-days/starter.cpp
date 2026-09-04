#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
using namespace std;

struct Job { int cpu, mem, reward; };

// Q1：故意保留错误。修复后解释：为什么当前循环会重复使用物品？
int maxValue01(const vector<int>& weights, const vector<int>& values, int capacity) {
    vector<int> dp(capacity + 1, 0);
    for (int i = 0; i < static_cast<int>(weights.size()); ++i)
        for (int j = weights[i]; j <= capacity; ++j)
            dp[j] = max(dp[j], dp[j - weights[i]] + values[i]);
    return dp[capacity];
}

long long countSubsets([[maybe_unused]] const vector<int>& nums, [[maybe_unused]] int target) {
    throw logic_error("TODO Q2");
}

int minUnits([[maybe_unused]] const vector<int>& sizes, [[maybe_unused]] int target) {
    throw logic_error("TODO Q3");
}

pair<long long, long long> countWays([[maybe_unused]] const vector<int>& sizes, [[maybe_unused]] int target) {
    throw logic_error("TODO Q4");
}

int maxReward([[maybe_unused]] const vector<Job>& jobs, [[maybe_unused]] int cpu, [[maybe_unused]] int mem) {
    throw logic_error("TODO Q5");
}

#include "tests.hpp"
int main() { return runFixedTests() == 0 ? 0 : 1; }
