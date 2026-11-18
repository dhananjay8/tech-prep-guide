# LeetCode Solutions — Study and Reference Guide

Solutions are grouped by difficulty, with topic subdirectories where useful.
JavaScript and Python solutions are stored as separate files rather than
language-specific directory trees.

The [Top Interview 150 guide](../study-plans/top-interview-150.md#leetcode-top-150-interview-problems) tracks the
official LeetCode Top Interview 150 plan and links each problem to its local
solution. It is the source of truth for numbering and coverage; do not create a
second, drifting Top 150 list here.

## Structure
- `easy/` — foundational problems
- `medium/` — core interview problems, including `dp/`, `trees/`, and linked-list topics
- `hard/` — advanced problems and edge-case intensive solutions
- `misc/` — curated pattern batches and frequently asked problem sets outside the difficulty-first Top 150 index

## Naming Convention
- Prefer kebab-case with clear problem title identity.
- Keep one canonical file per problem per language unless showcasing a different approach.
- Keep the LeetCode slug recognizable in the file name so it is easy to search.

## How to Practice a Solution

1. Read the prompt and constraints; clarify mutation, duplicates, ordering, and edge cases.
2. Derive a brute-force baseline and state its cost before optimizing.
3. Choose a data structure or pattern and write down its correctness invariant.
4. Implement without viewing the stored solution; test empty/minimum input, duplicates/ties, and a boundary case.
5. Explain time and auxiliary space precisely, then compare your reasoning with the reference.
6. Close the file and re-solve later from memory; record the root cause of any miss and schedule a revisit.

Reading a correct implementation is not evidence that you can derive it in an
interview. Practice retrieval, explanation, and testing as separate skills.

## Language Use
- Use the language expected in your interview loop.
- Re-solve at least 30-40 key medium problems in your primary language before interviews.
- Account for language-specific behavior: integer overflow, recursion depth, collection operation costs, equality/hash semantics, and sorting comparators.

## Top Interview 150 Conventions
- Keep solution filenames aligned with their LeetCode problem slugs.
- Put dynamic-programming solutions in `medium/dp/` when that matches the existing organization.
- For new JavaScript solutions, export the function/class when useful so examples can be verified with Node.
- Document the approach, invariant, time complexity, and auxiliary space for new or substantially revised solutions.
- Distinguish auxiliary space from output space and state assumptions such as average-case hash operations.
- Prefer a short correctness argument and edge-case checks over comments that merely restate each line.
