/**
 * Search the shorter sorted array for a partition. The left half has
 * ceil((m + n) / 2) elements and both cross-array boundaries must be ordered.
 * Time: O(log(min(m, n) + 1)) search steps (constant time if one is empty).
 * Auxiliary space: O(1). At least one array is nonempty.
 *
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function (nums1, nums2) {
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1);
  }

  const m = nums1.length;
  const n = nums2.length;
  const leftSize = Math.floor((m + n + 1) / 2);
  let low = 0;
  let high = m;

  while (low <= high) {
    const i = low + Math.floor((high - low) / 2);
    const j = leftSize - i;
    const aLeft = i === 0 ? -Infinity : nums1[i - 1];
    const aRight = i === m ? Infinity : nums1[i];
    const bLeft = j === 0 ? -Infinity : nums2[j - 1];
    const bRight = j === n ? Infinity : nums2[j];

    if (aLeft > bRight) {
      high = i - 1;
    } else if (bLeft > aRight) {
      low = i + 1;
    } else {
      const leftMax = Math.max(aLeft, bLeft);
      if ((m + n) % 2 === 1) return leftMax;
      return (leftMax + Math.min(aRight, bRight)) / 2;
    }
  }
};
