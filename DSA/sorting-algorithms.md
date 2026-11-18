# Sorting & Searching Algorithms — Complete Reference

## Comparison of Sorting Algorithms

| Algorithm | Best | Average | Worst | Space | Stable? | In-Place? |
|-----------|------|---------|-------|-------|---------|-----------|
| **Bubble Sort** | O(n) | O(n²) | O(n²) | O(1) | ✅ | ✅ |
| **Selection Sort** | O(n²) | O(n²) | O(n²) | O(1) | ❌ | ✅ |
| **Insertion Sort** | O(n) | O(n²) | O(n²) | O(1) | ✅ | ✅ |
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | ❌ |
| **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) average, O(n) worst stack | ❌ | ✅ |
| **Heap Sort** | O(n) on all-equal input | O(n log n) | O(n log n) | O(1) | ❌ | ✅ |
| **Counting Sort** | O(n+k) | O(n+k) | O(n+k) | O(n+k) stable / O(k) variants | Implementation-dependent | ❌ |
| **Radix Sort** | O(d(n+b)) | O(d(n+b)) | O(d(n+b)) | O(n+b) | Yes, with a stable digit sort | ❌ |

`n` is the number of items; `k` is the key range for counting sort; `d` is
the number of digits/passes and `b` is the radix/base. Counting and radix
sorts are non-comparison sorts and need assumptions about key representation.
The heap sort example stops sifting when neither child is larger. On all-equal
input, heap construction and each extraction take O(1) sift work, so total time
is O(n); worst-case time remains O(n log n). The table describes common
implementations, not every variant.

---

## 1. Bubble Sort
```javascript
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // optimization: already sorted
  }
  return arr;
}
```

## 2. Selection Sort
```javascript
function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}
```

## 3. Insertion Sort
```javascript
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // shift right
      j--;
    }
    arr[j + 1] = key; // insert in correct position
  }
  return arr;
}
```

## 4. Merge Sort ⭐ (Most asked)
```javascript
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

```python
def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: result.append(left[i]); i += 1
        else: result.append(right[j]); j += 1
    return result + left[i:] + right[j:]
```

## 5. Quick Sort ⭐ (Most asked)
```javascript
function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const pivotIdx = partition(arr, lo, hi);
  quickSort(arr, lo, pivotIdx - 1);
  quickSort(arr, pivotIdx + 1, hi);
  return arr;
}

function partition(arr, lo, hi) {
  const pivot = arr[hi]; // choose last element as pivot
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}
```

This implementation always picks the last element as pivot, so sorted or
adversarial input can cause O(n²) time and O(n) recursion depth. Randomized
pivots reduce predictable bad cases but do not change the worst-case bound.

```python
def quick_sort(arr, lo=0, hi=None):
    if hi is None: hi = len(arr) - 1
    if lo >= hi: return
    pivot_idx = partition(arr, lo, hi)
    quick_sort(arr, lo, pivot_idx - 1)
    quick_sort(arr, pivot_idx + 1, hi)

def partition(arr, lo, hi):
    pivot, i = arr[hi], lo - 1
    for j in range(lo, hi):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i+1], arr[hi] = arr[hi], arr[i+1]
    return i + 1
```

## 6. Heap Sort
```javascript
function heapSort(arr) {
  const n = arr.length;
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
  // Extract elements one by one
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]]; // move root to end
    heapify(arr, i, 0); // heapify reduced heap
  }
  return arr;
}

function heapify(arr, n, i) {
  while (true) {
    let largest = i;
    const left = 2 * i + 1;
    const right = left + 1;
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest === i) return;
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    i = largest;
  }
}
```

---

## Binary Search ⭐

```javascript
// Standard binary search
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2); // avoid overflow
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1; // not found
}

// Lower bound: first index whose value is at least target
function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Upper bound: first index whose value is greater than target
function upperBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Last occurrence; upperBound alone may point past all equal values.
function lastIndexOfSorted(arr, target) {
  const index = upperBound(arr, target) - 1;
  return index >= 0 && arr[index] === target ? index : -1;
}
```

`lowerBound` returns the first index with value `>= target`; `upperBound`
returns the first index with value `> target`. Both return an insertion point
in `[0, arr.length]`, including when the target is absent.

```python
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        elif arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

# Python built-in: bisect.bisect_left(), bisect.bisect_right()
```

---

## When to Use Which Sort?
| Scenario | Best Sort |
|----------|-----------|
| Small arrays (n < 50) | Insertion Sort |
| Nearly sorted data | Insertion Sort |
| General application code | Use the language's built-in sort with an explicit comparator when needed |
| Memory constrained | Heap Sort (O(1) space) |
| Known, small integer range | Counting Sort |
| Linked lists | Merge Sort (no random access needed) |
| Need stable sort | Merge Sort |

In JavaScript, `Array.prototype.sort()` is stable in modern ECMAScript, but its
time/space complexity is implementation-defined. For numbers, pass a numeric
comparator such as `(a, b) => a - b`; the default comparator sorts string
representations. In interviews, state the assumptions behind the algorithm
you choose rather than claiming one sort is universally fastest.
