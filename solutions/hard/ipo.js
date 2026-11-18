/**
 * Sort projects by required capital, then greedily choose the largest
 * available profit using a max heap.
 * Time: O(n log n + min(k, n) log n). Space: O(n).
 *
 * @param {number} k
 * @param {number} w
 * @param {number[]} profits
 * @param {number[]} capital
 * @return {number}
 */
var findMaximizedCapital = function (k, w, profits, capital) {
  const projects = profits
    .map((profit, index) => ({ profit, capital: capital[index] }))
    .sort((a, b) => a.capital - b.capital);
  const maxHeap = [];

  function push(profit) {
    let index = maxHeap.length;
    maxHeap.push(profit);

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (maxHeap[parent] >= profit) break;
      maxHeap[index] = maxHeap[parent];
      index = parent;
    }
    maxHeap[index] = profit;
  }

  function popMax() {
    const maximum = maxHeap[0];
    const last = maxHeap.pop();
    if (maxHeap.length === 0) return maximum;

    let index = 0;
    while (true) {
      const left = 2 * index + 1;
      const right = left + 1;
      if (left >= maxHeap.length) break;

      const child =
        right < maxHeap.length && maxHeap[right] > maxHeap[left] ? right : left;
      if (maxHeap[child] <= last) break;
      maxHeap[index] = maxHeap[child];
      index = child;
    }
    maxHeap[index] = last;
    return maximum;
  }

  let projectIndex = 0;
  for (let completed = 0; completed < k; completed++) {
    while (projectIndex < projects.length && projects[projectIndex].capital <= w) {
      push(projects[projectIndex].profit);
      projectIndex++;
    }
    if (maxHeap.length === 0) break;
    w += popMax();
  }

  return w;
};
