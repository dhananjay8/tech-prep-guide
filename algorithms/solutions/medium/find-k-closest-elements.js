/**
 * Binary-search the start of the best length-k window in the sorted array.
 * On equal distances, keep the left window so the result favors smaller values.
 * Time: O(log(n - k + 1) + k), including the returned slice. Space: O(k) output.
 *
 * @param {number[]} arr
 * @param {number} k
 * @param {number} x
 * @return {number[]}
 */
var findClosestElements = function (arr, k, x) {
  let left = 0;
  let right = arr.length - k;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (x - arr[mid] > arr[mid + k] - x) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return arr.slice(left, left + k);
};
