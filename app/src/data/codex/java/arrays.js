// Java Cheatsheet: arrays (int[] and int[][]). Same shape as hashmap.js: intro, recipe groups by
// job, traps, costs, drill.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'arrays',
  title: 'Arrays (int[] and 2D)',
  summary: 'Fixed-size rows of numbers. Sort, search, prefix sums, two pointers, grids. Where most problems start.',
  tags: ['array', 'int[]', '2d', 'grid', 'matrix', 'sort', 'binary search', 'prefix sum', 'intervals', 'fill', 'copy', 'two pointers', 'directions'],
  blocks: [
    t("An array is a fixed-size row of values you reach by index in O(1). Most LeetCode inputs arrive as `int[]` or `int[][]`, and most answers go back out the same way. The size never changes after `new`: if you need to grow, use an `ArrayList`. The helper class `Arrays` (with an s) does the sorting, filling, copying and printing for you."),
    key("Three calls cover most problems: `Arrays.sort(arr)` to sort, `Arrays.sort(intervals, (p, q) -> p[0] - q[0])` to sort rows by a column, and `Arrays.fill(row, -1)` to set every slot (for memo tables). Print while debugging with `Arrays.toString(arr)`."),
    recipes('Create and fill', [
      r('Make an array of size n (starts at zeros)', `
int[] counts = new int[n];          // all 0
boolean[] visited = new boolean[n]; // all false
String[] labels = new String[n];    // all null
long[] big = new long[n];           // all 0L`, 'O(n)', 'Numbers start at 0, booleans at false, objects at null. No need to fill with 0 yourself.'),
      r('Make an array with values already in it', `
int[] primes = {2, 3, 5, 7};                  // only at the declaration line
int[] pair = new int[]{4, 9};                 // works anywhere, e.g. return new int[]{lo, hi};
char[] vowels = {'a', 'e', 'i', 'o', 'u'};`, 'O(n)'),
      r('Fill every slot with one value', `
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);   // "not reached yet"
Arrays.fill(dist, 0, 2, -1);            // only indexes 0 and 1 (end is exclusive)`, 'O(n)'),
      r('Make a 2D grid (rows x cols)', `
int rows = 3, cols = 4;
int[][] cells = new int[rows][cols];   // all 0
cells[1][2] = 7;                       // row 1, column 2
int[][] jagged = new int[rows][];      // rows can have different lengths
jagged[0] = new int[]{1, 2};`, 'O(rows * cols)'),
      r('Fill a 2D memo table with -1', `
int[][] memo = new int[m][n];
for (int[] row : memo) {
    Arrays.fill(row, -1);              // -1 = "not computed yet"
}`, 'O(m * n)', '`Arrays.fill(memo, -1)` does not compile on a 2D array: fill each row.'),
    ]),
    recipes('Copy', [
      r('Copy a whole array', `
int[] backup = nums.clone();                  // new array, same values
int[] longer = Arrays.copyOf(nums, nums.length * 2);  // extra slots are 0`, 'O(n)', '`int[] other = nums;` is NOT a copy: both names point to the same array.'),
      r('Copy part of an array', `
int[] firstThree = Arrays.copyOfRange(nums, 0, 3);   // indexes 0, 1, 2
int[] tail = Arrays.copyOfRange(nums, 1, nums.length);`, 'O(len)', 'Start is included, end is excluded, same as `substring`.'),
      r('Copy a 2D grid (deep copy)', `
int[][] copy = new int[grid.length][];
for (int row = 0; row < grid.length; row++) {
    copy[row] = grid[row].clone();      // clone each row
}`, 'O(m * n)', '`grid.clone()` copies only the outer array; the rows are still shared.'),
    ]),
    recipes('Sort', [
      r('Sort numbers small to large', `
Arrays.sort(nums);                       // in place, nothing returned
Arrays.sort(nums, 1, 4);                 // only indexes 1, 2, 3`, 'O(n log n)'),
      r('Sort numbers large to small', `
// Comparators need objects, so box to Integer[] first
Integer[] boxed = Arrays.stream(nums).boxed().toArray(Integer[]::new);
Arrays.sort(boxed, Collections.reverseOrder());

// Or: sort ascending, then read from the back
Arrays.sort(nums);
for (int idx = nums.length - 1; idx >= 0; idx--) {
    // nums[idx] from largest to smallest
}`, 'O(n log n)', '`Arrays.sort(int[], comparator)` does not exist. Comparators only work on `Integer[]`, `int[][]`, objects.'),
      r('Sort intervals by start time', `
Arrays.sort(intervals, (p, q) -> Integer.compare(p[0], q[0]));

// Short form, safe when values are small (no overflow):
Arrays.sort(intervals, (p, q) -> p[0] - q[0]);`, 'O(n log n)', '`p[0] - q[0]` can overflow with values near `Integer.MIN_VALUE`/`MAX_VALUE`; `Integer.compare` never does.'),
      r('Sort rows by one column, then by another', `
// By start ascending; if starts tie, by end descending
Arrays.sort(intervals, (p, q) -> p[0] != q[0]
        ? Integer.compare(p[0], q[0])
        : Integer.compare(q[1], p[1]));

// Same idea with comparator chaining
Arrays.sort(points, Comparator.<int[]>comparingInt(pt -> pt[0])
        .thenComparingInt(pt -> pt[1]));`, 'O(n log n)'),
      r('Sort indexes by their values (keep original positions)', `
Integer[] order = new Integer[nums.length];
for (int idx = 0; idx < nums.length; idx++) order[idx] = idx;
Arrays.sort(order, (p, q) -> Integer.compare(nums[p], nums[q]));
// order[0] is the index of the smallest value`, 'O(n log n)'),
    ]),
    recipes('Search and measure', [
      r('Find a value in a sorted array', `
int pos = Arrays.binarySearch(nums, target);
if (pos >= 0) {
    // found at index pos
} else {
    int insertAt = -pos - 1;   // where it would go to keep the array sorted
}`, 'O(log n)', 'Only works on a sorted array. With duplicates it returns any one match, not the first.'),
      r('First index with value >= target (lower bound)', `
int lowerBound(int[] sorted, int goal) {
    int lo = 0, hi = sorted.length;          // hi = length: "not found" answer
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;        // no overflow
        if (sorted[mid] < goal) lo = mid + 1;
        else hi = mid;
    }
    return lo;                               // sorted.length if every value < goal
}`, 'O(log n)', 'Change `<` to `<=` for upper bound: first index with value > goal.'),
      r('Sum, max and min', `
int sum = 0, max = Integer.MIN_VALUE, min = Integer.MAX_VALUE;
for (int num : nums) {
    sum += num;
    max = Math.max(max, num);
    min = Math.min(min, num);
}

// One-liners with streams (slower, fine for setup code):
int total2 = Arrays.stream(nums).sum();
int biggest = Arrays.stream(nums).max().getAsInt();
long bigSum = Arrays.stream(nums).asLongStream().sum();   // avoids overflow`, 'O(n)', 'Start max at `Integer.MIN_VALUE`, not 0, or all-negative arrays break.'),
      r('Check two arrays hold the same values', `
boolean same = Arrays.equals(a, b);            // same length, same values in order
boolean sameGrid = Arrays.deepEquals(grid, matrix);  // for 2D
// a == b only checks if they are the same array object`, 'O(n)'),
      r('Print an array while debugging', `
System.out.println(Arrays.toString(nums));        // [1, 2, 3]
System.out.println(Arrays.deepToString(grid));    // [[1, 2], [3, 4]]`, 'O(n)', 'Printing `nums` directly shows junk like `[I@1b6d3586`.'),
    ]),
    recipes('Change in place', [
      r('Swap two elements', `
void swap(int[] arr, int p, int q) {
    int tmp = arr[p];
    arr[p] = arr[q];
    arr[q] = tmp;
}`, 'O(1)', 'Java has no built-in swap for arrays; keep this helper ready.'),
      r('Reverse an array in place', `
int lo = 0, hi = nums.length - 1;
while (lo < hi) {
    int tmp = nums[lo];
    nums[lo++] = nums[hi];
    nums[hi--] = tmp;
}`, 'O(n)'),
      r('Rotate right by k steps', `
// Reverse all, then reverse the first k, then the rest
void rotate(int[] nums, int k) {
    int len = nums.length;
    k %= len;                       // k can be bigger than the length
    reverse(nums, 0, len - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, len - 1);
}
void reverse(int[] nums, int lo, int hi) {
    while (lo < hi) {
        int tmp = nums[lo];
        nums[lo++] = nums[hi];
        nums[hi--] = tmp;
    }
}`, 'O(n)', 'O(1) extra space. Rotate left by k = rotate right by `len - k`.'),
      r('Move all zeros to the end (keep order)', `
int write = 0;
for (int num : nums) {
    if (num != 0) nums[write++] = num;   // pack non-zeros to the front
}
while (write < nums.length) nums[write++] = 0;`, 'O(n)', 'The same "write pointer" removes duplicates or a value in place.'),
    ]),
    recipes('Patterns that use arrays', [
      r('Build a prefix sum array', `
int[] prefix = new int[nums.length + 1];       // prefix[0] = 0
for (int idx = 0; idx < nums.length; idx++) {
    prefix[idx + 1] = prefix[idx] + nums[idx];
}
// Sum of nums[from..to], both included:
int from = 1, to = 2;
int rangeSum = prefix[to + 1] - prefix[from];`, 'O(n) build, O(1) query', 'The extra slot at the front removes every "if from == 0" special case.'),
      r('Count letters with an int[26]', `
int[] cnt = new int[26];
for (char ch : s.toCharArray()) {
    cnt[ch - 'a']++;                 // 'a' -> 0, 'z' -> 25
}
int[] any = new int[128];            // any ASCII char: use the char itself as index
for (char ch : s.toCharArray()) any[ch]++;`, 'O(n)', 'Two strings are anagrams when their two count arrays are `Arrays.equals`.'),
      r('Two pointers from both ends (sorted array)', `
int lo = 0, hi = nums.length - 1;
while (lo < hi) {
    int sum = nums[lo] + nums[hi];
    if (sum == target) return new int[]{lo, hi};
    else if (sum < target) lo++;     // need bigger: move left pointer right
    else hi--;                       // need smaller: move right pointer left
}
return new int[0];`, 'O(n)'),
      r('Merge overlapping intervals', `
Arrays.sort(intervals, (p, q) -> Integer.compare(p[0], q[0]));
List<int[]> merged = new ArrayList<>();
for (int[] cur : intervals) {
    if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
        merged.add(cur);                                // no overlap: start new
    } else {
        int[] last = merged.get(merged.size() - 1);
        last[1] = Math.max(last[1], cur[1]);            // overlap: stretch the end
    }
}
return merged.toArray(new int[0][]);`, 'O(n log n)', 'Use `<` for "touching counts as overlap" ([1,2],[2,3] merge); use `<=` if touching should stay separate.'),
      r('Return an empty answer', `
int[] none = new int[0];          // empty int[]
int[][] noRows = new int[0][];    // empty int[][]
int[][] alsoNone = new int[][]{};
return none;`, 'O(1)', 'Return an empty array, not `null`, when the problem says "return an empty array".'),
    ]),
    recipes('Grids (2D arrays)', [
      r('Loop every cell of a grid', `
int rows = grid.length, cols = grid[0].length;
for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
        int cell = grid[row][col];
    }
}`, 'O(m * n)', '`grid.length` is the number of rows; `grid[0].length` is the number of columns.'),
      r('Visit the 4 neighbours with a bounds check', `
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};   // down, up, right, left
int row = 0, col = 0;
for (int[] d : dirs) {
    int nr = row + d[0], nc = col + d[1];
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;  // off the grid
    // visit grid[nr][nc]
}`, 'O(1) per cell', 'Check bounds BEFORE reading `grid[nr][nc]`, or it throws ArrayIndexOutOfBoundsException.'),
      r('Flood fill an island (DFS)', `
void sink(int[][] grid, int row, int col) {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return;
    if (grid[row][col] != 1) return;          // water or already visited
    grid[row][col] = 0;                       // mark visited by sinking it
    sink(grid, row + 1, col);
    sink(grid, row - 1, col);
    sink(grid, row, col + 1);
    sink(grid, row, col - 1);
}`, 'O(m * n)', 'Changing the grid saves a `visited` array; copy the grid first if you must keep it.'),
      r('Transpose a square matrix (rows become columns)', `
for (int row = 0; row < matrix.length; row++) {
    for (int col = row + 1; col < matrix.length; col++) {   // upper triangle only
        int tmp = matrix[row][col];
        matrix[row][col] = matrix[col][row];
        matrix[col][row] = tmp;
    }
}`, 'O(n^2)', 'Start `col` at `row + 1`, or every pair swaps twice and nothing changes.'),
      r('Rotate a square matrix 90 degrees clockwise', `
int size = matrix.length;
// 1) transpose
for (int row = 0; row < size; row++) {
    for (int col = row + 1; col < size; col++) {
        int tmp = matrix[row][col];
        matrix[row][col] = matrix[col][row];
        matrix[col][row] = tmp;
    }
}
// 2) reverse each row
for (int[] line : matrix) {
    for (int lo = 0, hi = size - 1; lo < hi; lo++, hi--) {
        int tmp = line[lo];
        line[lo] = line[hi];
        line[hi] = tmp;
    }
}`, 'O(n^2)', 'Counter-clockwise: transpose, then reverse each column (or reverse rows first, then transpose).'),
      r('Turn a cell into one number and back', `
int cols = grid[0].length;
int row = 2, col = 3;
int id = row * cols + col;        // unique number per cell (for sets, union-find)
int backRow = id / cols, backCol = id % cols;`, 'O(1)'),
    ]),
    warn("Arrays are passed by reference. A helper that changes `nums[0]` changes the caller's array too, and `int[] copy = nums;` copies nothing. Use `nums.clone()` or `Arrays.copyOf` for a real copy.", 'Not a copy'),
    warn("`Arrays.sort(nums, Collections.reverseOrder())` does not compile on an `int[]`. Reverse order and custom comparators need `Integer[]` or a 2D array."),
    tip("Before writing any grid loop, say out loud: \"rows = grid.length, cols = grid[0].length, row goes down, col goes right\". Mixing those two is the most common grid bug."),
    costs([
      ['Read / write by index', '`arr[i]`, `arr[i] = x`', 'O(1)'],
      ['Length', '`arr.length` (no brackets)', 'O(1)'],
      ['Fill', '`Arrays.fill(arr, v)`', 'O(n)'],
      ['Copy', '`clone()`, `Arrays.copyOf`, `copyOfRange`', 'O(n)'],
      ['Sort', '`Arrays.sort(arr)`, `Arrays.sort(rows, cmp)`', 'O(n log n)'],
      ['Search sorted', '`Arrays.binarySearch(arr, x)`', 'O(log n)'],
      ['Compare', '`Arrays.equals(a, b)`', 'O(n)'],
      ['Print', '`Arrays.toString`, `Arrays.deepToString`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: make a 3x4 grid filled with -1, sort `{{5,6},{1,3},{2,4}}` by start, then write lower bound from memory. Then do **Merge Intervals**, **Rotate Image** and **Number of Islands**."),
  ],
};
