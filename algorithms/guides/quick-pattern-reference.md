# 🧠 Quick Pattern Recognition Guide

| If the problem says... | Think about... |
|---|---|
| Sorted array | Binary Search for a monotone boundary; Two Pointers when one side can be safely discarded |
| All permutations/subsets | Backtracking |
| Tree | DFS, BFS |
| Graph | BFS/DFS for traversal; Union-Find for undirected connectivity; topological sort for dependencies |
| Linked list | Two Pointers, Fast/Slow |
| Recursion banned | Stack |
| In-place | Two pointers or index-based writes, if mutation is allowed |
| Contiguous range | Sliding Window when the condition is maintainable; Prefix Sum for range/subarray queries |
| Optimization over choices | Dynamic Programming or Greedy only after defining state/proving the choice |
| Top/least K items | Heap, QuickSelect |
| Common strings | HashMap, Trie |
| Next greater/smaller | Monotonic Stack |
| Repeated prefix lookup | Trie or HashMap, depending on the query |

These are starting clues, not rules: prove the invariant and check that the input constraints satisfy the pattern's assumptions.

## Complexity Guide (rough screening heuristics)
There is no exact cutoff from `n` alone. Account for language, memory, test-case count, constants, and the work inside each operation.

| n | Target Complexity |
|---|---|
| n ≤ 10 | Exponential search may fit with strong pruning |
| n ≤ 20 | O(2ⁿ) may fit for compact bitmask DP |
| n ≤ 300 | O(n³) may be plausible; estimate actual operations |
| n ≤ 2,000 | O(n²) may be plausible with small constants |
| n ≤ 10⁵ | Usually target O(n log n) or better |
| n ≤ 10⁶ | Usually target linear or near-linear time |
