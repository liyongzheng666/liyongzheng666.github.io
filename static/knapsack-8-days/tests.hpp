#pragma once
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

// 公开用例只做功能检查；不能替代人工评估建模、解释与独立程度。
inline int runFixedTests() {
    int passed = 0, total = 0;
    auto check = [&](const std::string& label, auto test) {
        ++total;
        try {
            if (test()) { ++passed; std::cout << "PASS " << label << '\n'; }
            else std::cout << "FAIL " << label << '\n';
        } catch (const std::exception& e) {
            std::cout << "FAIL " << label << ": " << e.what() << '\n';
        }
    };
    check("Q1 reuse trap", [] { return maxValue01({3,4}, {4,5}, 6) == 5; });
    check("Q1 empty", [] { return maxValue01({}, {}, 0) == 0; });
    check("Q1 unused capacity", [] { return maxValue01({5}, {9}, 3) == 0; });
    check("Q2 zeros", [] { return countSubsets({0,1,2,2,3}, 4) == 4; });
    check("Q2 target zero", [] { return countSubsets({0,0,2}, 0) == 4; });
    check("Q2 duplicate indices", [] { return countSubsets({2,2}, 2) == 2; });
    check("Q2 empty subset", [] { return countSubsets({}, 0) == 1; });
    check("Q2 impossible", [] { return countSubsets({2,4}, 3) == 0; });
    check("Q3 exact sum", [] { return minUnits({4,7,9}, 18) == 2; });
    check("Q3 impossible", [] { return minUnits({4,7}, 9) == -1; });
    check("Q3 zero", [] { return minUnits({4,7}, 0) == 0; });
    check("Q3 greedy trap", [] { return minUnits({1,3,4}, 6) == 2; });
    check("Q4 order", [] { return countWays({2,3,5}, 8) == std::make_pair(3LL, 6LL); });
    check("Q4 alternate", [] { return countWays({1,3,4}, 5) == std::make_pair(3LL, 6LL); });
    check("Q4 empty way", [] { return countWays({2,4}, 0) == std::make_pair(1LL, 1LL); });
    check("Q4 impossible", [] { return countWays({4,6}, 5) == std::make_pair(0LL, 0LL); });
    check("Q5 weighted", [] { return maxReward({{2,1,6},{1,2,5},{2,2,14},{1,1,3}}, 3, 3) == 17; });
    check("Q5 zero resource", [] { return maxReward({{0,2,5},{2,0,6},{1,1,4}}, 2, 2) == 11; });
    check("Q5 empty", [] { return maxReward({}, 0, 0) == 0; });
    check("Q5 reuse trap", [] { return maxReward({{1,1,7}}, 3, 3) == 7; });
    std::cout << "Public cases: " << passed << '/' << total << '\n';
    return total - passed;
}
