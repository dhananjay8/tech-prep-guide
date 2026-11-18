/**
 * Problem: Minimum Genetic Mutation
 * Link: https://leetcode.com/problems/minimum-genetic-mutation/
 * Difficulty: Medium
 *
 * Gene string is 8 chars of 'A','C','G','T'. Find min mutations from startGene to endGene.
 * Each mutation changes one char and must be in the gene bank.
 *
 * Let N be bank size and L = 8 be gene length.
 * Time Complexity: O(N * L^2 * 4) = O(N) for this fixed-length problem.
 * Space Complexity: O(N * L) = O(N) for fixed-length stored strings.
 */

// JavaScript Solution — BFS (same as Word Ladder)
function minMutation(startGene, endGene, bank) {
  if (startGene === endGene) return 0;
  const bankSet = new Set(bank);
  if (!bankSet.has(endGene)) return -1;

  const queue = [[startGene, 0]];
  const visited = new Set([startGene]);

  for (let head = 0; head < queue.length; head++) {
    const [gene, steps] = queue[head];
    for (let i = 0; i < 8; i++) {
      for (const ch of 'ACGT') {
        const mutated = gene.slice(0, i) + ch + gene.slice(i + 1);
        if (mutated === endGene) return steps + 1;
        if (bankSet.has(mutated) && !visited.has(mutated)) {
          visited.add(mutated);
          queue.push([mutated, steps + 1]);
        }
      }
    }
  }

  return -1;
}

module.exports = minMutation;

/* Python Solution:

from collections import deque

def minMutation(startGene, endGene, bank):
    if startGene == endGene: return 0
    bank_set = set(bank)
    if endGene not in bank_set: return -1
    
    queue = deque([(startGene, 0)])
    visited = {startGene}
    
    while queue:
        gene, steps = queue.popleft()
        for i in range(8):
            for ch in 'ACGT':
                mutated = gene[:i] + ch + gene[i+1:]
                if mutated == endGene: return steps + 1
                if mutated in bank_set and mutated not in visited:
                    visited.add(mutated)
                    queue.append((mutated, steps + 1))
    return -1

*/
