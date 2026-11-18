# 60-Second Pattern Identification Framework

Use this before writing any code.

Pattern recognition is a hypothesis, not a substitute for proving correctness.
The output contract, constraints, and input properties determine which
techniques are valid.

## Step 1: Ask 3 questions
1. **Core data structure?** Array / Linked List / Tree / Graph / Heap / Stack
2. **Core operation?** Find / Optimize / Count / Generate / Detect
3. **Core constraint?** Sorted input / Limited memory / Stream / Unknown length

If you cannot name the pattern in 60 seconds, pause and reason from constraints.

---

## Pattern trigger map

### Sorted input
- Binary search when you need a position or a monotone boundary.
- Two pointers when you need a pair/range or can discard one side safely.
- Do not binary-search an arbitrary predicate; prove it is monotone.

### Generate all permutations/subsets/combinations
- Backtracking

### Tree problems
- DFS
- BFS / Level Order

### Graph problems
- DFS / BFS
- Topological Sort (if dependencies)
- Union-Find (if connectivity)

### Linked list operations
- Two pointers
- Fast/slow pointer

### Contiguous subarray/substring optimization
- Sliding window when the window condition can be updated as either endpoint moves.
- Prefix sums for range queries and many subarray-count problems.
- With negative values, a sum window generally cannot be shrunk greedily; use prefix sums, a deque, or DP as appropriate.

### Top K / priority ordering
- Heap
- Quickselect

### Dependency/order constraints
- Topological Sort

### Need best possible value from subproblems
- Dynamic Programming

### Next greater/smaller value or window extremum
- Monotonic stack for nearest greater/smaller boundaries.
- Monotonic deque for a moving-window minimum/maximum.

### Connectivity or shortest path
- BFS for shortest paths in unweighted graphs.
- Dijkstra for non-negative edge weights; Bellman-Ford for negative edges when no reachable negative cycle makes shortest paths undefined.
- Union-Find for incremental undirected connectivity, not for producing paths.

---

## Complexity guide from constraints

Use this only as an initial estimate. There is no universal cutoff: language,
constant factors, memory, test-case count, and the work per operation matter.

| Constraint (`n`) | Usually acceptable |
|---|---|
| `n <= 10` | Exponential search may fit with effective pruning |
| `n <= 20` | `O(2^n)` may fit for compact bitmask DP |
| `n <= 300` | `O(n^3)` may be plausible; estimate actual operations |
| `n <= 2,000` | `O(n^2)` may be plausible with small constants |
| `n <= 10^5` | Usually target `O(n log n)` or better |
| `n <= 10^6` | Usually target linear or near-linear time |

---

## Fast pre-coding checklist
- Restate problem in one line.
- Clarify constraints, mutation, duplicates, ordering, and what counts as a valid result.
- Define brute force first.
- Pick pattern and justify it from constraints.
- State the invariant or monotonic property that makes the optimization correct.
- Write edge cases before code.
- Track time/space complexity while coding.

## Interview explanation in five sentences

1. "The input allows ___, and the required output is ___."
2. "A direct approach is ___, which costs ___."
3. "I can improve it by maintaining ___; the invariant is ___."
4. "Each item is processed ___ times, so time is ___ and auxiliary space is ___."
5. "I will verify empty/minimum input, duplicates or ties, and the boundary case ___."
