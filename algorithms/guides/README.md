# DSA Study Hub

Use this folder as the pattern-first reference for coding interviews. Learn the
invariant behind a technique, then practice it on problems rather than
memorizing a code template.

## Start here

1. Read `cheat-sheet.md` (pattern triggers + templates)
2. Review `sorting-algorithms.md`
3. Use `pattern-identification.md` for 60-second pattern selection
4. Use the [Top Interview 150 index](../study-plans/top-interview-150.md#leetcode-top-150-interview-problems) to select a problem and open its solution only after attempting it.
5. Use `pattern-links.md` for optional external references; prefer the local notes and problems when revising.
6. Review legacy notes only when you need additional examples: `DSA - NOTES.txt`, `DSA - Patterns.txt`.
7. For object-oriented design rounds, see the [Design Patterns interview guide](../../software-design/design-patterns/interview-guide.md).

## Interview practice loop (60–90 minutes)

1. **Review (10 min):** Recall a pattern and its invariant without reading the template.
2. **Solve (35 min):** Attempt one problem cold; state a brute-force baseline first.
3. **Explain (10 min):** Present the chosen data structure, correctness argument, and complexity.
4. **Test (10 min):** Trace a normal case, boundary case, and adversarial case.
5. **Record (5 min):** Note the mistake, its root cause, and a specific re-solve date.

If stuck, spend a bounded period deriving an approach before reading a hint. After
reviewing a solution, close it and re-implement from memory; recognition is not
the same as retrieval.

## Pattern-first progression

- **Arrays, hashing, two pointers:** counting, deduplication, in-place updates.
- **Prefix sums, sliding windows, binary search:** distinguish fixed/variable windows from prefix-sum queries; use binary search only with a monotone predicate.
- **Stacks, queues, intervals:** nested structure, next-greater elements, event ordering, and overlap rules.
- **Linked lists and trees:** pointer invariants, recursion/iteration, traversal order, and BST bounds.
- **Graphs:** BFS/DFS, topological sort, union-find, and shortest paths (BFS for unweighted graphs; Dijkstra for non-negative weights).
- **Heaps, greedy, backtracking:** explain the selection rule, pruning condition, and why it is safe.
- **Dynamic programming:** define the state, transition, base case, evaluation order, and whether state compression is valid.
- **Mixed review:** revisit missed patterns and solve timed problems without topic labels.

## Interview answer checklist

Before coding:
- Restate the task, input/output contract, constraints, and ambiguous cases.
- Ask whether mutation is allowed and whether results must be unique, ordered, or stable.
- Give a simple baseline and its time/space cost.
- Name the invariant that makes the optimized approach correct.

After coding:
- Trace at least one boundary case and one case that breaks a tempting but invalid approach.
- State time and auxiliary-space complexity; clarify whether output space is excluded.
- Mention trade-offs only after a correct solution is established.

## Interview readiness checklist

- Can derive a correct baseline and justify the optimization.
- Can explain why each pointer/state update preserves the invariant.
- Can identify when a familiar pattern does **not** apply.
- Can test edge cases and state complexity with precise assumptions.
- Can re-solve previously missed problems without notes.
