/**
 * Randomized three-way quickselect. Keep the region containing index k - 1
 * in descending order; equal values are settled together.
 * Expected time: O(n); worst case: O(n^2). Auxiliary space: O(1).
 * Mutates nums. Assumes 1 <= k <= nums.length.
 *
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findKthLargest = function (nums, k) {
  const target = k - 1;
  let lo = 0;
  let hi = nums.length - 1;

  while (lo <= hi) {
    const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
    let greater = lo;
    let i = lo;
    let smaller = hi;

    while (i <= smaller) {
      if (nums[i] > pivot) {
        [nums[greater], nums[i]] = [nums[i], nums[greater]];
        greater++;
        i++;
      } else if (nums[i] < pivot) {
        [nums[i], nums[smaller]] = [nums[smaller], nums[i]];
        smaller--;
      } else {
        i++;
      }
    }

    if (target < greater) hi = greater - 1;
    else if (target > smaller) lo = smaller + 1;
    else return pivot;
  }
};
