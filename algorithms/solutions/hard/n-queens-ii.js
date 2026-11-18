/**
 * Problem: N-Queens II
 * Link: https://leetcode.com/problems/n-queens-ii/
 * Count arrangements of n queens on an n x n board with no attacks.
 * Constraints: 1 <= n <= 9.
 * Time: O(n!) — at most one queen per column, with constant work per placement.
 * Space: O(n) for the recursion stack.
 */
function totalNQueens(n) {
  const boardMask = (1 << n) - 1;

  function count(cols, leftDiagonals, rightDiagonals) {
    if (cols === boardMask) return 1;

    let available = boardMask & ~(cols | leftDiagonals | rightDiagonals);
    let total = 0;
    while (available) {
      const bit = available & -available;
      available -= bit;
      total += count(
        cols | bit,
        ((leftDiagonals | bit) << 1) & boardMask,
        (rightDiagonals | bit) >>> 1
      );
    }
    return total;
  }

  return count(0, 0, 0);
}

module.exports = totalNQueens;
