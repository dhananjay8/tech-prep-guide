# DSA Interview Cheat Sheet — Pattern and Complexity Reference

Use the templates as starting points, not proofs. Always confirm that the input
constraints and required output satisfy the pattern's assumptions.

## 📦 Data Structure Operations Complexity

| Structure | Access / peek | Search | Insert / delete | Important assumption |
|-----------|---------------|--------|-----------------|----------------------|
| Dynamic array | Index O(1) | O(n) | Append amortized O(1); middle O(n) | Resizing copies elements |
| Stack | Top O(1) | O(n) | Push/pop O(1) | Arbitrary access is not supported |
| Queue | Front O(1) | O(n) | Enqueue/dequeue O(1) | Use a deque or head index, not front-removal from an array |
| Singly linked list | O(n) | O(n) | O(1) at head or with the predecessor/node already known | Finding a position is O(n) |
| Hash table / map | N/A | Average O(1) | Average O(1) | Worst case O(n); resizing is amortized; key/order semantics vary by language |
| Balanced BST | O(log n) | O(log n) | O(log n) | An unbalanced BST can degrade to O(n) |
| Binary heap | Peek O(1) | O(n) | Push/pop O(log n) | Efficient for min/max, not arbitrary lookup |
| Trie | N/A | O(L) | O(L) | L is key length; memory depends on stored prefixes and representation |

For hash tables, heap operations, and dynamic arrays, state whether a bound is
average, worst-case, or amortized. Complexity tables are model-dependent.

---

## ⚡ 60-Second Pattern Identification

Before coding, answer 3 questions:
1. **Core DS?** — Array / LinkedList / Tree / Graph / Heap / Stack
2. **Core Op?** — Find / Optimize / Count / Generate / Detect
3. **Core Constraint?** — Sorted / Limited space / Real-time stream / Unknown length

Also state the output contract (one result, all results, count, or in-place
mutation). It often rules out an otherwise plausible pattern.

These answers narrow the candidate patterns below; more than one technique
may be needed, and the input properties still need to justify the choice.

---

## 🏷️ Pattern Trigger Sections

### [1] Arrays and Hashing
- **Problems**: Two Sum, Product Except Self, Contains Duplicate, Majority Element, Sort Colors
- **Keywords**: hash map, frequency, prefix product, counting, in-place
- **Trigger**: question talks about counts, presence, or rearranging array values

### [2] Two Pointers
- **Problems**: 3Sum, Container With Most Water, Move Zeroes, Remove Duplicates, Valid Palindrome
- **Keywords**: left/right pointers, shrinking range, swapping, partitioning
- **Trigger**: sorted data + need pairs, ranges, or in-place cleanup

### [3] Sliding Window
- **Problems**: Longest Substring Without Repeating, Minimum Window Substring, Sliding Window Maximum
- **Keywords**: window start/end, expand/shrink, running count, best window
- **Trigger**: contiguous range with a condition that can be maintained while expanding/shrinking
- **Caution**: a variable-size sum window usually needs non-negative values; with negative values, use prefix sums or another invariant.

### Prefix Sum and Difference
- **Problems**: Subarray Sum Equals K, Range Sum Query, Product Except Self
- **Trigger**: many range queries, subarray counts, or cumulative contributions
- **Caution**: for subarray sum `k` with negative values, count prior prefix sums in a map; a sliding window is not generally valid.

### [4] Binary Search on Sorted or Answer Space
- **Problems**: Search Rotated Array, Find First/Last Position, Median of Two Sorted, Find Peak, Koko Bananas
- **Keywords**: mid index, sorted property, search space, monotonic answer
- **Trigger**: sorted/monotonic input OR answer space is monotonic + tight time

### [5] Matrix and Grid Traversal
- **Problems**: Number of Islands, Rotting Oranges, Spiral Matrix, Rotate Image, Valid Sudoku
- **Keywords**: 2D grid, visited set, boundaries, 4 directions
- **Trigger**: board/grid — explore neighbors or process layers

### [6] Intervals and Timeline Scans
- **Problems**: Merge Intervals, Meeting Rooms II, Insert Interval, Minimum Number of Arrows to Burst Balloons
- **Keywords**: sort by start, sweep line, prefix max, monotonic structure
- **Trigger**: time ranges, bookings, or prices evolving over a timeline

---

## 🧩 Core Patterns

### 1. Two Pointers
- **Use when**: Sorted arrays, pair finding, palindromes
- **Template**: `left = 0, right = n-1; while (left < right)`
- **Examples**: Two Sum II, 3Sum, Container With Most Water, Valid Palindrome

### 2. Sliding Window
- **Use when**: Contiguous subarray/substring with a condition
- **Template**: Expand `right`, shrink `left` when condition violated
- **Examples**: Max Subarray Sum of size K, Longest Substring Without Repeating, Minimum Window Substring

### 3. Binary Search
- **Use when**: Sorted array, search space with monotonic property
- **Template**: `lo, hi; while (lo <= hi) { mid = (lo+hi)/2; }`
- **Variants**: Find first/last occurrence, search in rotated array, search on answer

### 4. BFS (Breadth-First Search)
- **Use when**: Shortest path in unweighted graph, level-order traversal
- **Template**: Queue, visited set, process level by level
- **Examples**: Shortest path, Rotting Oranges, Word Ladder, Level Order Traversal

### 5. DFS (Depth-First Search)
- **Use when**: Reachability, connected components, or as a basis for cycle detection and backtracking
- **Template**: Mark visited for reachability; use path-local state for enumerating simple paths. For directed cycles, distinguish nodes on the active DFS path from finished nodes.
- **Examples**: Number of Islands, Path Sum, Clone Graph, Flood Fill

### 6. Backtracking
- **Use when**: Generate all combinations/permutations, constraint satisfaction
- **Template**: Choose → Explore → Unchoose (backtrack)
- **Examples**: N-Queens, Subsets, Permutations, Combination Sum, Sudoku Solver

### 7. Dynamic Programming
- **Use when**: Optimal substructure + overlapping subproblems
- **Approach**: Top-down (memoization) or Bottom-up (tabulation)
- **Common patterns**: 0/1 Knapsack, LCS, LIS, Grid paths, String DP
- **Examples**: Coin Change, House Robber, Edit Distance, Longest Common Subsequence

### 8. Greedy
- **Use when**: Local optimal choice leads to global optimal
- **Key**: Prove greedy choice property before using
- **Examples**: Jump Game, Gas Station, Activity Selection, Huffman Coding

### 9. Monotonic Stack
- **Use when**: Next greater/smaller element, histogram problems
- **Template**: Stack maintains increasing/decreasing order
- **Examples**: Daily Temperatures, Largest Rectangle in Histogram, Trapping Rain Water

### 10. Union-Find (Disjoint Set)
- **Use when**: Connected components, cycle detection in undirected graphs
- **Template**: `find(x)` with path compression, `union(x,y)` with rank
- **Examples**: Redundant Connection, Number of Connected Components, Accounts Merge

### 11. Topological Sort
- **Use when**: Ordering with dependencies, DAG processing
- **Template**: Kahn's (BFS + in-degree) or DFS with post-order
- **Examples**: Course Schedule, Alien Dictionary, Task Scheduling

### 12. Trie (Prefix Tree)
- **Use when**: Prefix matching, autocomplete, word search
- **Template**: Node with children map + isEnd flag
- **Examples**: Implement Trie, Word Search II, Autocomplete

### 13. Heap / Priority Queue
- **Use when**: Top K, median, merge K sorted, scheduling
- **Template**: Min-heap or max-heap (negate for max in min-heap)
- **Examples**: Kth Largest, Merge K Lists, Find Median, Task Scheduler

### 14. Bit Manipulation
- **Use when**: XOR tricks, power of 2, count bits, single number
- **Key formulas**: for positive `x`, `x & (x-1)` removes its lowest set bit; `x ^ x = 0`, `x ^ 0 = x`
- **Examples**: Single Number, Counting Bits, Reverse Bits
- **JavaScript caveat**: `Number` bitwise operators coerce operands to signed 32-bit integers. Use `BigInt` consistently for larger integers.

### 15. Hash Map and Frequency Counting
- **Use when**: Need fast membership, counts, grouping, or a complement lookup.
- **Examples**: Two Sum, Group Anagrams, Longest Consecutive Sequence.
- **Caution**: Hash operations are average O(1), not a guaranteed worst-case bound.

### 16. Prefix Sum
- **Use when**: A range can be answered by combining cumulative state, or count subarrays by prior prefixes.
- **Template**: `prefix[r] - prefix[l]` represents a half-open range `[l, r)`.
- **Caution**: Define whether the prefix includes the current element; off-by-one errors are common.

### 17. Intervals and Sweep Line
- **Use when**: Ranges overlap, merge, or events change an active count.
- **Approach**: Sort by a well-defined endpoint; for sweep lines, specify how equal-time starts and ends are ordered.
- **Examples**: Merge Intervals, Meeting Rooms, Minimum Arrows.

### 18. Monotonic Queue
- **Use when**: Need the min/max of each sliding window in amortized O(1) per element.
- **Invariant**: Store indices in monotone value order and evict indices outside the window.
- **Examples**: Sliding Window Maximum.

---

## 🔑 Common Code Templates

### Sliding Window (Variable Size)
```
left = 0
for right in range(n):
    # expand: add arr[right] to window
    while window_invalid:
        # shrink: remove arr[left] from window
        left += 1
    # update answer
```

### BFS Template
```
queue = [start]
head = 0
visited = {start}
while head < len(queue):
    node = queue[head]
    head += 1
    for neighbor in graph.get(node, ()):
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
```
In Python, `collections.deque.popleft()` is also O(1); repeated `list.pop(0)` is O(n).
This visits the component reachable from `start`; use `graph.get(node, ())` for
vertices without outgoing edges when the adjacency map omits them.

### DFS Template
```
def dfs(node, visited):
    if node in visited: return
    visited.add(node)
    for neighbor in graph[node]:
        dfs(neighbor, visited)
```

### Backtracking Template
```
def backtrack(candidates, start, current, result):
    if goal_reached:
        result.append(current[:])
        return
    for i in range(start, len(candidates)):
        current.append(candidates[i])
        backtrack(candidates, i + 1, current, result)  # or i for reuse
        current.pop()  # undo choice
```

### Binary Search Template
```
lo, hi = 0, n
while lo < hi:                   # first index where monotone predicate is true
    mid = (lo + hi) // 2
    if predicate(mid):
        hi = mid
    else:
        lo = mid + 1
return lo                         # may equal n when no index satisfies it
```
For exact-match search on a sorted array, use the inclusive `lo <= hi`
template shown in `sorting-algorithms.md`; do not mix its updates with the
first-true boundary template.

### Union-Find Template
```
parent = list(range(n))
rank = [0] * n

def find(x):
    if parent[x] != x: parent[x] = find(parent[x])  # path compression
    return parent[x]

def union(x, y):
    px, py = find(x), find(y)
    if px == py: return False
    if rank[px] < rank[py]: parent[px] = py
    elif rank[px] > rank[py]: parent[py] = px
    else: parent[py] = px; rank[px] += 1
    return True
```

---

## 🧮 Math Formulas for Interviews

| Formula | Value |
|---------|-------|
| Sum 1 to n | n × (n+1) / 2 |
| Sum of squares | n(n+1)(2n+1) / 6 |
| Power of 2 check | For positive `n`: `(n & (n-1)) == 0` |
| GCD (Euclidean) | `gcd(a, b) = gcd(b, a % b)` |
| Catalan number | C(n) = C(2n, n) / (n+1) |
| Permutations | n! / (n-r)! |
| Combinations | n! / (r! × (n-r)!) |
| Number of ordered binary-tree shapes with n nodes | Catalan(n) (left and right child positions are distinct) |

The closed-form Catalan calculation can overflow fixed-width integers; use
appropriate big-integer or modular arithmetic when constraints require it.

---

## ⏱️ How to Estimate Time Limit

These are rough screening heuristics, not guarantees. Runtime depends on the
language, constant factors, number of test cases, memory limit, and operation
count inside each loop.

| Constraint (`n`) | Complexity that may be practical |
|------------------|----------------------------------|
| `n <= 10` | Exponential/backtracking may fit if pruning is strong |
| `n <= 20` | `O(2^n)` may fit for compact bitmask DP |
| `n <= 300` | `O(n^3)` may be plausible; measure the actual work |
| `n <= 2,000` | `O(n^2)` may be plausible with small constants |
| `n <= 10^5` | Usually target `O(n log n)` or better |
| `n <= 10^6` | Usually target `O(n)` or near-linear |

Never infer that an `O(log n)` solution is required just because `n` is large;
look for a sorted structure, a monotone predicate, or a mathematical invariant.
