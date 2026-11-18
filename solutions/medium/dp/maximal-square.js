/**
 * Problem: Maximal Square
 * Link: https://leetcode.com/problems/maximal-square/
 * Difficulty: Medium
 *
 * Find the largest square containing only 1's and return its area.
 *
 * Time Complexity: O(m * n)
 * Space Complexity: O(n)
 */

// JavaScript Solution - DP
function maximalSquare(matrix) {
  if (!matrix.length || !matrix[0].length) return 0;

  const rows = matrix.length;
  const columns = matrix[0].length;
  const dp = new Array(columns + 1).fill(0);
  let maxSide = 0;

  for (let r = 1; r <= rows; r += 1) {
    let diagonal = 0;

    for (let c = 1; c <= columns; c += 1) {
      const above = dp[c];
      if (matrix[r - 1][c - 1] === '1') {
        // min of top, left, top-left diagonal + 1
        dp[c] = Math.min(dp[c], dp[c - 1], diagonal) + 1;
        maxSide = Math.max(maxSide, dp[c]);
      } else {
        dp[c] = 0;
      }
      diagonal = above;
    }
  }

  return maxSide * maxSide;
}

module.exports = maximalSquare;

/* Python Solution:

def maximalSquare(matrix):
    if not matrix or not matrix[0]:
        return 0

    m, n = len(matrix), len(matrix[0])
    dp = [0] * (n + 1)
    max_side = 0
    prev = 0
    
    for r in range(1, m + 1):
        for c in range(1, n + 1):
            temp = dp[c]
            if matrix[r-1][c-1] == '1':
                dp[c] = min(dp[c], dp[c-1], prev) + 1
                max_side = max(max_side, dp[c])
            else:
                dp[c] = 0
            prev = temp
        prev = 0
    
    return max_side ** 2

*/
