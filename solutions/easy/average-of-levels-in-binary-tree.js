/**
 * Problem: Average of Levels in Binary Tree
 * Link: https://leetcode.com/problems/average-of-levels-in-binary-tree/
 * Difficulty: Easy
 *
 * Return the average value of nodes on each level.
 *
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

// JavaScript Solution — BFS
function averageOfLevels(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  let head = 0;

  while (head < queue.length) {
    const size = queue.length - head;
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      sum += node.val;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(sum / size);
  }

  return result;
}

module.exports = averageOfLevels;

/* Python Solution:

from collections import deque

def averageOfLevels(root):
    result = []
    queue = deque([root])
    while queue:
        size = len(queue)
        level_sum = 0
        for _ in range(size):
            node = queue.popleft()
            level_sum += node.val
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level_sum / size)
    return result

*/
