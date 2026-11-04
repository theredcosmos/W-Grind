// Codex tab: Methods. One section per core technique, shape defined in ./schema.js.
// Code templates are Java 17 and live in template literals (no tabs, no `${`).

export default {
  key: 'methods',
  label: 'Methods',
  intro: 'The moves you train in the gym. Each method has the idea, the clues that call for it, a Java template, the classic bugs, and a short drill set.',
  sections: [
    // ───────────────────────────── Complexity ─────────────────────────────
    {
      id: 'complexity',
      title: 'Complexity & Big-O',
      summary: 'Read the constraints first. They tell you which method the problem wants.',
      tags: ['big-o', 'time', 'space', 'constraints', 'complexity'],
      blocks: [
        { type: 'text', text: 'Big-O counts how work grows as input grows. Drop constants and small terms. A judge does roughly 10^8 simple operations per second, so `n` in the constraints hints at the target complexity.' },
        {
          type: 'table',
          title: 'Constraint → target complexity',
          head: ['Max n', 'Target', 'Usual methods'],
          rows: [
            ['≤ 12', 'O(n!)', 'Permutations, brute force'],
            ['≤ 20', 'O(2^n · n)', 'Subsets, bitmask DP'],
            ['≤ 500', 'O(n^3)', 'Interval DP, Floyd-Warshall'],
            ['≤ 5,000', 'O(n^2)', '2-D DP, nested loops'],
            ['≤ 10^5 – 10^6', 'O(n log n) or O(n)', 'Sort, heap, binary search, two pointers, hashing'],
            ['≥ 10^9', 'O(log n) or O(1)', 'Binary search on answer, math'],
          ],
        },
        {
          type: 'table',
          title: 'Common costs',
          head: ['Operation', 'Cost'],
          rows: [
            ['HashMap get/put', 'O(1) average'],
            ['TreeMap / PriorityQueue add/remove', 'O(log n)'],
            ['Arrays.sort / Collections.sort', 'O(n log n)'],
            ['String concat in a loop', 'O(n^2) total, use StringBuilder'],
            ['list.remove(0) on ArrayList', 'O(n), use ArrayDeque'],
            ['Recursion depth d', 'O(d) stack space'],
          ],
        },
        {
          type: 'list',
          title: 'Quick rules',
          items: [
            'Loop inside a loop over the same input: O(n^2).',
            'Halving each step: O(log n).',
            'Recursion: (number of calls) × (work per call).',
            'Memoized DP: (number of states) × (work per state).',
            'Amortized: each element pushed and popped once is O(n) total, even with a while loop inside.',
          ],
        },
        { type: 'callout', tone: 'warn', title: 'Classic traps', text: 'Hidden O(n) calls inside loops: `list.contains`, `substring`, `String +=`, `new ArrayList<>(big)`. Forgetting the recursion stack in space. Sorting is O(n log n), not O(n).' },
        { type: 'callout', tone: 'drill', title: 'Drill (10 min)', text: 'Before coding anything, write the target Big-O from the constraints for: Two Sum, Subsets, Longest Increasing Subsequence, Koko Eating Bananas. Then check against the accepted solutions.' },
      ],
    },

    // ───────────────────────────── Recursion ─────────────────────────────
    {
      id: 'recursion',
      title: 'Recursion',
      summary: 'Solve a smaller copy of the same problem and trust it.',
      tags: ['recursion', 'base case', 'divide and conquer'],
      blocks: [
        { type: 'text', text: 'A recursive function solves the problem for input X by calling itself on smaller inputs. You do not trace every call. You define what the function returns, handle the base case, and **trust** the smaller call.' },
        {
          type: 'steps',
          title: 'How to think',
          items: [
            'Write one sentence: "`f(x)` returns ...". Be exact.',
            'Base case: the smallest input you can answer directly (null node, empty range, n == 0).',
            'Trust: assume `f(smaller)` already returns the right thing.',
            'Combine: build the answer for `x` from the smaller answers.',
            'Check: every call moves toward the base case.',
          ],
        },
        { type: 'list', title: 'Use it when', items: ['Trees and nested structures.', 'The problem says "for each choice, solve the rest".', 'Divide and conquer: split in halves, merge results.', 'You can describe the answer in terms of a smaller answer.'] },
        {
          type: 'code',
          title: 'Template: max depth of a tree',
          lang: 'java',
          code: `// f(node) returns the depth of the subtree rooted at node
int maxDepth(TreeNode node) {
    if (node == null) return 0;              // base case
    int left = maxDepth(node.left);          // trust
    int right = maxDepth(node.right);        // trust
    return 1 + Math.max(left, right);        // combine
}

// Power with divide and conquer: O(log n)
double pow(double x, long n) {
    if (n == 0) return 1;
    if (n < 0) return 1 / pow(x, -n);
    double half = pow(x, n / 2);
    return n % 2 == 0 ? half * half : half * half * x;
}`,
        },
        { type: 'table', head: ['Shape', 'Time', 'Space'], rows: [['One call per level (linear)', 'O(n)', 'O(n) stack'], ['Two calls, halves (merge sort)', 'O(n log n)', 'O(log n) + buffer'], ['Two calls, n-1 each (naive fib)', 'O(2^n)', 'O(n)'], ['Tree visit', 'O(n)', 'O(height)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Missing base case → StackOverflowError. Calling twice on the same subproblem (`f(n-1) + f(n-1)`) doubles the work. Ignoring the return value of the recursive call. Deep recursion (10^5 levels) can overflow the Java stack: switch to iteration.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Maximum Depth of Binary Tree → Reverse Linked List (recursive) → Pow(x, n) → Merge Two Sorted Lists (recursive). For each, write the "f(x) returns..." sentence first.' },
      ],
    },

    // ───────────────────────────── Two pointers ─────────────────────────────
    {
      id: 'two-pointers',
      title: 'Two Pointers',
      summary: 'Two indexes walk the array so you never need a nested loop.',
      tags: ['two pointers', 'array', 'string', 'in-place', 'sorted'],
      blocks: [
        { type: 'text', text: 'Two indexes move with a rule, each only forward (or inward). Total moves are O(n). Two flavours: **opposite ends** moving inward, and **same direction** as read/write (fast/slow) indexes.' },
        { type: 'list', title: 'Use it when', items: ['Sorted array plus pair/triple target sum.', 'Palindrome check, reverse in place.', '"Remove/move elements in place, O(1) extra space".', 'Container/area between two walls.', 'Merging two sorted arrays.'] },
        {
          type: 'code',
          title: 'Opposite ends (sorted pair sum)',
          lang: 'java',
          code: `int[] twoSumSorted(int[] a, int target) {
    int l = 0, r = a.length - 1;
    while (l < r) {
        int sum = a[l] + a[r];
        if (sum == target) return new int[]{l, r};
        if (sum < target) l++;     // need bigger
        else r--;                  // need smaller
    }
    return new int[]{-1, -1};
}`,
        },
        {
          type: 'code',
          title: 'Same direction (read/write, remove duplicates)',
          lang: 'java',
          code: `int removeDuplicates(int[] a) {
    if (a.length == 0) return 0;
    int write = 1;                         // next slot to fill
    for (int read = 1; read < a.length; read++) {
        if (a[read] != a[write - 1]) {
            a[write++] = a[read];
        }
    }
    return write;                          // new length
}`,
        },
        { type: 'table', head: ['Variant', 'Time', 'Space'], rows: [['Opposite ends', 'O(n)', 'O(1)'], ['Read/write', 'O(n)', 'O(1)'], ['3Sum (sort + fix one + two pointers)', 'O(n^2)', 'O(1) extra'], ['Merge two sorted arrays', 'O(n + m)', 'O(1) if from the back']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: '`l <= r` vs `l < r`: pairs need two distinct indexes, so use `<`. In 3Sum, skip duplicates after a match or you output repeats. Opposite-ends needs sorted input (or a monotone rule like Container With Most Water). Merge in place from the back to avoid overwriting.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Valid Palindrome → Move Zeroes → Container With Most Water → 3Sum.' },
      ],
    },

    // ───────────────────────────── Sliding window ─────────────────────────────
    {
      id: 'sliding-window',
      title: 'Sliding Window',
      summary: 'Keep a running window over a contiguous range and update it in O(1) per step.',
      tags: ['sliding window', 'substring', 'subarray', 'two pointers'],
      blocks: [
        { type: 'text', text: 'A window is a contiguous range `[left, right]`. Add the new right element, remove the left element when needed, and keep the window state (sum, counts) up to date. **Fixed** windows have size k. **Variable** windows grow and shrink to stay valid.' },
        { type: 'list', title: 'Use it when', items: ['"Longest / shortest substring or subarray such that ..."', '"Every window of size k".', 'Condition is monotone: shrinking a valid window keeps it valid (or growing breaks it).', 'All numbers non-negative (for sum-based windows).'] },
        {
          type: 'code',
          title: 'Variable window: longest substring without repeats',
          lang: 'java',
          code: `int lengthOfLongestSubstring(String s) {
    int[] count = new int[128];
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        count[c]++;                                  // 1. add right
        while (count[c] > 1) {                       // 2. shrink while invalid
            count[s.charAt(left)]--;
            left++;
        }
        best = Math.max(best, right - left + 1);     // 3. record
    }
    return best;
}`,
        },
        {
          type: 'code',
          title: 'Fixed window of size k: max sum',
          lang: 'java',
          code: `long maxSumK(int[] a, int k) {
    long sum = 0, best = Long.MIN_VALUE;
    for (int i = 0; i < a.length; i++) {
        sum += a[i];
        if (i >= k) sum -= a[i - k];       // drop the element leaving
        if (i >= k - 1) best = Math.max(best, sum);
    }
    return best;
}`,
        },
        { type: 'table', head: ['Variant', 'Record answer', 'Time'], rows: [['Longest valid', 'After shrinking, window is valid', 'O(n)'], ['Shortest valid', 'Inside the shrink loop, while still valid', 'O(n)'], ['Fixed k', 'Once i >= k - 1', 'O(n)'], ['"Exactly K"', 'atMost(K) - atMost(K - 1)', 'O(n)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Negative numbers break sum windows (shrinking no longer helps): use prefix sums + HashMap instead. Window length is `right - left + 1`. For "shortest", record inside the while loop, not after it. Forgetting to decrement counts when `left` moves.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Maximum Average Subarray I → Longest Substring Without Repeating Characters → Longest Repeating Character Replacement → Minimum Window Substring.' },
      ],
    },

    // ───────────────────────────── Prefix sum ─────────────────────────────
    {
      id: 'prefix-sum',
      title: 'Prefix Sum & Difference Array',
      summary: 'Precompute running totals so any range sum is one subtraction.',
      tags: ['prefix sum', 'difference array', 'range query', 'subarray sum'],
      blocks: [
        { type: 'text', text: '`pre[i]` = sum of the first i elements. Then sum of `a[l..r]` = `pre[r+1] - pre[l]`. A **difference array** is the reverse trick: apply many range updates in O(1) each, then rebuild with one prefix pass.' },
        { type: 'list', title: 'Use it when', items: ['Many range-sum queries on a static array.', '"Count subarrays with sum = k" (works with negatives).', 'Many "+v to range [l, r]" updates, then read the final array.', '2-D: sum of a sub-rectangle.'] },
        {
          type: 'code',
          title: 'Prefix sum + HashMap: subarrays summing to k',
          lang: 'java',
          code: `int subarraySum(int[] a, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);                       // empty prefix
    int sum = 0, count = 0;
    for (int x : a) {
        sum += x;
        count += seen.getOrDefault(sum - k, 0);
        seen.merge(sum, 1, Integer::sum);
    }
    return count;
}`,
        },
        {
          type: 'code',
          title: 'Difference array: range add',
          lang: 'java',
          code: `int[] applyUpdates(int n, int[][] updates) {   // each: {l, r, v}
    int[] diff = new int[n + 1];
    for (int[] u : updates) {
        diff[u[0]] += u[2];
        diff[u[1] + 1] -= u[2];
    }
    int[] res = new int[n];
    int run = 0;
    for (int i = 0; i < n; i++) {
        run += diff[i];
        res[i] = run;
    }
    return res;
}`,
        },
        { type: 'table', head: ['Variant', 'Build', 'Query/update'], rows: [['1-D prefix', 'O(n)', 'O(1) query'], ['2-D prefix', 'O(rows·cols)', 'O(1) rectangle'], ['Difference array', 'O(n) rebuild', 'O(1) update'], ['Prefix + HashMap', 'O(n)', 'counts in one pass']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Off-by-one: use size `n + 1` with `pre[0] = 0`. Forgetting `seen.put(0, 1)` misses subarrays starting at index 0. Sums can overflow `int`: use `long`. In the HashMap pattern, query before inserting the current sum.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Range Sum Query - Immutable → Subarray Sum Equals K → Corporate Flight Bookings → Range Sum Query 2D - Immutable.' },
      ],
    },

    // ───────────────────────────── Binary search ─────────────────────────────
    {
      id: 'binary-search',
      title: 'Binary Search',
      summary: 'Halve the search space each step, on an index or on the answer itself.',
      tags: ['binary search', 'lower bound', 'upper bound', 'rotated', 'search on answer'],
      blocks: [
        { type: 'text', text: 'Binary search needs a **monotone yes/no question**: false false false true true. You look for the first true. This works on sorted arrays, rotated arrays, and on a range of possible answers.' },
        { type: 'list', title: 'Use it when', items: ['Sorted input and O(log n) required.', '"Minimum X such that ..." or "maximum X such that ..." (search on answer).', 'Huge value ranges (10^9) with a cheap feasibility check.', 'Rotated sorted array, peak element.'] },
        {
          type: 'code',
          title: 'One template for everything: first index where ok(i) is true',
          lang: 'java',
          code: `// lower bound: first index with a[i] >= target (a.length if none)
int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;            // hi is exclusive
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= target) hi = mid;   // mid could be the answer
        else lo = mid + 1;
    }
    return lo;
}
// upper bound: change the test to a[mid] > target

// Search on the answer: smallest speed that finishes in h hours
int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 1_000_000_000;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + mid - 1) / mid;   // ceil
        if (hours <= h) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
        },
        {
          type: 'code',
          title: 'Rotated sorted array',
          lang: 'java',
          code: `int searchRotated(int[] a, int t) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[lo] <= a[mid]) {                       // left half sorted
            if (a[lo] <= t && t < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                     // right half sorted
            if (a[mid] < t && t <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
        },
        { type: 'table', head: ['Variant', 'Loop', 'Update'], rows: [['Exact match', 'lo <= hi', 'lo = mid+1 / hi = mid-1'], ['Lower/upper bound', 'lo < hi, hi exclusive', 'hi = mid / lo = mid+1'], ['On answer (min)', 'lo < hi', 'ok(mid) → hi = mid'], ['On answer (max)', 'lo < hi, mid = lo + (hi-lo+1)/2', 'ok(mid) → lo = mid']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Infinite loop: with `lo = mid` you must round mid **up**. `(lo + hi) / 2` overflows: use `lo + (hi - lo) / 2`. Mixing templates (`lo <= hi` with `hi = mid`). Feasibility sums overflow `int`: use `long`. Wrong search bounds for the answer range.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Binary Search → Find First and Last Position of Element in Sorted Array → Search in Rotated Sorted Array → Koko Eating Bananas.' },
      ],
    },

    // ───────────────────────────── Sorting ─────────────────────────────
    {
      id: 'sorting',
      title: 'Sorting',
      summary: 'Sort first to create order you can exploit, or sort by a custom rule.',
      tags: ['sort', 'comparator', 'counting sort', 'bucket sort', 'quickselect'],
      blocks: [
        { type: 'text', text: 'Sorting costs O(n log n) and often unlocks two pointers, greedy, or binary search. Know the built-ins, how to write comparators, and the linear-time tricks for small value ranges.' },
        { type: 'list', title: 'Use it when', items: ['Order does not matter in the output, so you may reorder.', 'Intervals, meetings, events (sort by start or end).', 'Grouping anagrams (sort letters as a key).', '"k-th largest" (quickselect) or "top k frequent" (bucket sort).', 'Values in a small range (counting sort).'] },
        {
          type: 'code',
          title: 'Built-ins and comparators',
          lang: 'java',
          code: `int[] nums = {3, 1, 2};
Arrays.sort(nums);                                   // primitives: ascending only

Integer[] boxed = {3, 1, 2};
Arrays.sort(boxed, Collections.reverseOrder());      // descending needs boxed

int[][] intervals = {{1, 3}, {0, 2}};
Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));

List<String> words = new ArrayList<>(List.of("bb", "a", "ccc"));
words.sort(Comparator.comparingInt(String::length)
                     .thenComparing(Comparator.naturalOrder()));

// Largest Number: custom order on concatenation
String[] s = {"3", "30", "34"};
Arrays.sort(s, (x, y) -> (y + x).compareTo(x + y));`,
        },
        {
          type: 'code',
          title: 'Quickselect: k-th largest in average O(n)',
          lang: 'java',
          code: `int findKthLargest(int[] a, int k) {
    int target = a.length - k, lo = 0, hi = a.length - 1;
    Random rnd = new Random();
    while (true) {
        int p = lo + rnd.nextInt(hi - lo + 1);
        swap(a, p, hi);
        int store = lo;
        for (int i = lo; i < hi; i++) if (a[i] < a[hi]) swap(a, i, store++);
        swap(a, store, hi);                  // pivot in final place
        if (store == target) return a[store];
        if (store < target) lo = store + 1; else hi = store - 1;
    }
}
void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }`,
        },
        { type: 'table', head: ['Method', 'Time', 'Space', 'Note'], rows: [['Arrays.sort(int[])', 'O(n log n)', 'O(log n)', 'Dual-pivot quicksort, not stable'], ['Arrays.sort(Object[])', 'O(n log n)', 'O(n)', 'TimSort, stable'], ['Counting sort', 'O(n + range)', 'O(range)', 'Small value range'], ['Bucket sort', 'O(n) average', 'O(n)', 'Top k frequent: bucket by count'], ['Quickselect', 'O(n) avg, O(n^2) worst', 'O(1)', 'Randomize the pivot']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Comparator `(a, b) -> a - b` overflows for large or negative values: use `Integer.compare`. `Arrays.sort(int[], comparator)` does not compile: box to `Integer[]` or sort `int[][]`. Comparators must be consistent (transitive) or TimSort throws. Unrandomized quickselect is O(n^2) on sorted input.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Sort Colors → Largest Number → Top K Frequent Elements (bucket sort) → Kth Largest Element in an Array (quickselect).' },
      ],
    },

    // ───────────────────────────── Hashing ─────────────────────────────
    {
      id: 'hashing',
      title: 'Hashing Patterns',
      summary: 'Trade memory for O(1) lookup: frequency, complement, grouping.',
      tags: ['hashmap', 'hashset', 'frequency', 'complement', 'grouping'],
      blocks: [
        { type: 'text', text: 'Most "have I seen this?" questions become O(1) with a HashMap or HashSet. Three patterns cover most problems: **count** things, look up the **complement**, and **group** by a canonical key.' },
        { type: 'list', title: 'Use it when', items: ['"Find a pair that sums to target" in unsorted input.', '"Count occurrences", "most frequent", "anagram".', '"Group items that are equivalent".', 'Duplicate detection, first unique element.', 'You need O(n) and a nested loop would be O(n^2).'] },
        {
          type: 'code',
          title: 'Three core patterns',
          lang: 'java',
          code: `// 1. Complement: Two Sum
int[] twoSum(int[] a, int target) {
    Map<Integer, Integer> idx = new HashMap<>();
    for (int i = 0; i < a.length; i++) {
        Integer j = idx.get(target - a[i]);
        if (j != null) return new int[]{j, i};
        idx.put(a[i], i);                  // insert after the check
    }
    return new int[0];
}

// 2. Frequency
Map<Character, Integer> freq = new HashMap<>();
for (char c : "banana".toCharArray()) freq.merge(c, 1, Integer::sum);

// 3. Grouping by canonical key: Group Anagrams
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] k = s.toCharArray();
        Arrays.sort(k);
        groups.computeIfAbsent(new String(k), x -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}`,
        },
        { type: 'table', head: ['Pattern', 'Time', 'Space'], rows: [['Frequency map', 'O(n)', 'O(distinct)'], ['Complement lookup', 'O(n)', 'O(n)'], ['Group by sorted key', 'O(n · k log k)', 'O(n · k)'], ['Group by count key (26 ints)', 'O(n · k)', 'O(n · k)'], ['int[26] instead of map', 'O(n)', 'O(1)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Inserting before checking lets an element pair with itself. Comparing `Integer` values with `==` fails above 127: use `.equals` or unbox. Using `int[]` as a map key hashes by identity: convert to a `String` or `List`. Mutating a key object after inserting it breaks lookups.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Contains Duplicate → Two Sum → Group Anagrams → Longest Consecutive Sequence.' },
      ],
    },

    // ───────────────────────────── Fast & slow ─────────────────────────────
    {
      id: 'fast-slow',
      title: 'Fast & Slow Pointers',
      summary: 'One pointer moves 2 steps, one moves 1. They find middles and cycles.',
      tags: ['fast slow', 'floyd', 'cycle', 'linked list', 'middle'],
      blocks: [
        { type: 'text', text: 'Fast moves two steps, slow moves one. If there is a cycle they meet inside it. If there is no cycle, when fast hits the end, slow is at the middle. This is Floyd\'s cycle detection.' },
        { type: 'list', title: 'Use it when', items: ['"Detect a cycle" in a linked list with O(1) space.', '"Find the middle" of a linked list.', 'A function `next(x)` defines an implicit list (Happy Number, Find the Duplicate Number).', 'Palindrome linked list (find middle, reverse second half).'] },
        {
          type: 'code',
          title: 'Middle, cycle, and cycle start',
          lang: 'java',
          code: `ListNode middle(ListNode head) {            // second middle for even length
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

ListNode cycleStart(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {                    // met inside the cycle
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;                          // entrance of the cycle
        }
    }
    return null;
}`,
        },
        { type: 'table', head: ['Task', 'Time', 'Space'], rows: [['Find middle', 'O(n)', 'O(1)'], ['Detect cycle', 'O(n)', 'O(1)'], ['Cycle entrance', 'O(n)', 'O(1)'], ['Implicit list (Find the Duplicate Number)', 'O(n)', 'O(1)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Check `fast != null && fast.next != null` in that order, or you get a NullPointerException. Starting fast at `head.next` changes which middle you get for even lengths. Compare nodes with `==` (identity), not values.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Middle of the Linked List → Linked List Cycle → Happy Number → Linked List Cycle II → Find the Duplicate Number.' },
      ],
    },

    // ───────────────────────────── Linked list ─────────────────────────────
    {
      id: 'linked-list-ops',
      title: 'Linked List Reversal & Merge',
      summary: 'Rewire next pointers with prev/curr/next and a dummy head.',
      tags: ['linked list', 'reverse', 'merge', 'dummy node'],
      blocks: [
        { type: 'text', text: 'Most linked list problems are pointer rewiring. Two moves cover a lot: **reverse** with three pointers, and **merge** by stitching onto a dummy head. Draw boxes and arrows before you code.' },
        { type: 'list', title: 'Use it when', items: ['"Reverse the list" or "reverse a sublist / every k nodes".', '"Merge sorted lists".', 'Removing nodes where the head itself might be removed (dummy node).', 'Reorder List (middle + reverse + merge).'] },
        {
          type: 'code',
          title: 'Reverse and merge',
          lang: 'java',
          code: `ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;   // save
        curr.next = prev;            // flip
        prev = curr;                 // advance prev
        curr = next;                 // advance curr
    }
    return prev;                     // new head
}

ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;  // attach the rest
    return dummy.next;
}`,
        },
        { type: 'table', head: ['Operation', 'Time', 'Space'], rows: [['Reverse (iterative)', 'O(n)', 'O(1)'], ['Reverse (recursive)', 'O(n)', 'O(n) stack'], ['Merge two', 'O(n + m)', 'O(1)'], ['Remove nth from end (two pointers, gap n)', 'O(n)', 'O(1)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Losing the rest of the list: save `next` before flipping. Returning `head` instead of `prev` after reversing. Forgetting the dummy node makes "remove the head" a special case. Creating a cycle when reconnecting a reversed sublist.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Reverse Linked List → Merge Two Sorted Lists → Remove Nth Node From End of List → Reverse Linked List II → Reverse Nodes in k-Group.' },
      ],
    },

    // ───────────────────────────── Monotonic stack ─────────────────────────────
    {
      id: 'monotonic-stack',
      title: 'Monotonic Stack',
      summary: 'A stack kept sorted finds the next greater / smaller element for all items in O(n).',
      tags: ['stack', 'monotonic', 'next greater', 'histogram'],
      blocks: [
        { type: 'text', text: 'Keep a stack of indexes whose values stay increasing (or decreasing). When a new value breaks the order, pop. Each popped item has just found its "next greater/smaller" element: the new one.' },
        { type: 'list', title: 'Use it when', items: ['"Next greater element", "next warmer day", "previous smaller".', '"How many days until ..."', 'Largest rectangle in histogram, trapping rain water.', 'Removing digits/letters to get the smallest result.'] },
        {
          type: 'code',
          title: 'Next greater element (daily temperatures)',
          lang: 'java',
          code: `int[] dailyTemperatures(int[] t) {
    int n = t.length;
    int[] ans = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();     // indexes, temps decreasing
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && t[stack.peek()] < t[i]) {
            int j = stack.pop();
            ans[j] = i - j;                        // i is j's next warmer day
        }
        stack.push(i);
    }
    return ans;                                    // leftovers stay 0
}`,
        },
        { type: 'table', head: ['Goal', 'Stack order (bottom → top)', 'Pop when'], rows: [['Next greater', 'Decreasing', 'a[top] < a[i]'], ['Next smaller', 'Increasing', 'a[top] > a[i]'], ['Previous greater', 'Decreasing', 'read top after popping'], ['Largest rectangle', 'Increasing heights', 'height[top] > height[i]']] },
        { type: 'callout', tone: 'tip', text: 'Time is O(n) because each index is pushed once and popped once. Space O(n).' },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Storing values instead of indexes (you lose distance and width). Using `Stack` class (slow, synchronized): use `ArrayDeque`. Forgetting to flush the stack at the end (histogram: append a 0 height sentinel). `<` vs `<=` decides how duplicates are handled.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Next Greater Element I → Daily Temperatures → Online Stock Span → Largest Rectangle in Histogram.' },
      ],
    },

    // ───────────────────────────── Monotonic deque ─────────────────────────────
    {
      id: 'monotonic-deque',
      title: 'Monotonic Deque',
      summary: 'Sliding window max/min in O(n) with a deque of indexes.',
      tags: ['deque', 'monotonic', 'sliding window maximum'],
      blocks: [
        { type: 'text', text: 'A deque holds indexes with decreasing values. The front is always the window max. Pop from the back when a bigger value arrives, and pop from the front when the index leaves the window.' },
        { type: 'list', title: 'Use it when', items: ['"Maximum/minimum of every window of size k".', 'Variable window that needs its max and min fast.', 'DP where `dp[i]` depends on the max of `dp` over the last k positions.'] },
        {
          type: 'code',
          title: 'Sliding window maximum',
          lang: 'java',
          code: `int[] maxSlidingWindow(int[] a, int k) {
    int n = a.length;
    int[] res = new int[n - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();          // indexes, values decreasing
    for (int i = 0; i < n; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();   // out of window
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast(); // useless now
        dq.offerLast(i);
        if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
    }
    return res;
}`,
        },
        { type: 'table', head: ['Variant', 'Deque order', 'Time'], rows: [['Window max', 'Decreasing values', 'O(n)'], ['Window min', 'Increasing values', 'O(n)'], ['Max and min together', 'Two deques', 'O(n)'], ['DP + deque (Constrained Subsequence Sum)', 'Decreasing dp values', 'O(n)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Storing values: you cannot tell when they leave the window. Expiry check is `peekFirst() <= i - k`. Mixing `push/pop` (front) with `offerLast/pollLast` (back): pick the explicit First/Last methods.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Sliding Window Maximum → Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit → Constrained Subsequence Sum.' },
      ],
    },

    // ───────────────────────────── Heap ─────────────────────────────
    {
      id: 'heap-patterns',
      title: 'Heap Patterns',
      summary: 'Top-k, k-way merge, and two heaps for a running median.',
      tags: ['heap', 'priority queue', 'top k', 'k-way merge', 'median'],
      blocks: [
        { type: 'text', text: 'A heap gives the min (or max) in O(1) and add/remove in O(log n). Three patterns: keep a size-k heap for **top-k**, merge k sorted sources with a heap of heads, and balance **two heaps** around the median.' },
        { type: 'list', title: 'Use it when', items: ['"k largest / smallest / closest / most frequent".', '"Merge k sorted lists/arrays".', '"Median of a stream".', 'Always process the cheapest/earliest next item (scheduling, Dijkstra).'] },
        {
          type: 'code',
          title: 'Top-k and two heaps',
          lang: 'java',
          code: `// Top k largest: keep a MIN-heap of size k
int[] topK(int[] a, int k) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();
    for (int x : a) {
        pq.offer(x);
        if (pq.size() > k) pq.poll();         // drop the smallest
    }
    return pq.stream().mapToInt(Integer::intValue).toArray();
}

// Running median
class MedianFinder {
    PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
    PriorityQueue<Integer> high = new PriorityQueue<>();                          // min-heap
    void addNum(int x) {
        low.offer(x);
        high.offer(low.poll());               // move the largest low to high
        if (high.size() > low.size()) low.offer(high.poll());
    }
    double findMedian() {
        return low.size() > high.size() ? low.peek() : (low.peek() + (long) high.peek()) / 2.0;
    }
}`,
        },
        {
          type: 'code',
          title: 'K-way merge',
          lang: 'java',
          code: `ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq = new PriorityQueue<>((x, y) -> Integer.compare(x.val, y.val));
    for (ListNode l : lists) if (l != null) pq.offer(l);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!pq.isEmpty()) {
        ListNode n = pq.poll();
        tail.next = n;
        tail = n;
        if (n.next != null) pq.offer(n.next);
    }
    return dummy.next;
}`,
        },
        { type: 'table', head: ['Pattern', 'Time', 'Space'], rows: [['Top-k (size-k heap)', 'O(n log k)', 'O(k)'], ['Heapify all then poll k', 'O(n + k log n)', 'O(n)'], ['K-way merge, N total items', 'O(N log k)', 'O(k)'], ['Two heaps median', 'O(log n) add, O(1) query', 'O(n)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Top-k largest needs a **min**-heap (counterintuitive). `PriorityQueue` iteration order is not sorted: poll to get sorted output. Comparator `a - b` overflows. Adding two large ints for the median overflows: cast to `long`.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Kth Largest Element in a Stream → K Closest Points to Origin → Merge k Sorted Lists → Find Median from Data Stream.' },
      ],
    },

    // ───────────────────────────── Tree DFS ─────────────────────────────
    {
      id: 'tree-dfs',
      title: 'Tree DFS',
      summary: 'Pre/in/post order. Return values up, pass state down.',
      tags: ['tree', 'dfs', 'preorder', 'inorder', 'postorder', 'recursion'],
      blocks: [
        { type: 'text', text: 'Tree DFS is recursion with two directions of information. **Pass state down** as parameters (path sum so far, depth, bounds). **Return values up** (height, subtree sum) and combine them in post-order.' },
        { type: 'list', title: 'Use it when', items: ['Any binary tree question that is not "by level".', '"Path sum", "diameter", "balanced", "lowest common ancestor".', 'Answer at a node depends on its children: post-order.', 'Answer depends on ancestors: pass it down (pre-order).'] },
        {
          type: 'table',
          head: ['Order', 'Visit node', 'Typical use'],
          rows: [['Pre-order', 'before children', 'Copy/serialize tree, pass state down'], ['In-order', 'between children', 'BST gives sorted order'], ['Post-order', 'after children', 'Heights, sums, diameter, delete tree']],
        },
        {
          type: 'code',
          title: 'Return up + global answer (diameter), pass down (path sum)',
          lang: 'java',
          code: `int best = 0;
int diameterOfBinaryTree(TreeNode root) {
    height(root);
    return best;
}
int height(TreeNode n) {                  // returns height, updates best
    if (n == null) return 0;
    int l = height(n.left), r = height(n.right);
    best = Math.max(best, l + r);         // path through n
    return 1 + Math.max(l, r);            // what the parent needs
}

boolean hasPathSum(TreeNode n, int remaining) {     // state passed down
    if (n == null) return false;
    remaining -= n.val;
    if (n.left == null && n.right == null) return remaining == 0;
    return hasPathSum(n.left, remaining) || hasPathSum(n.right, remaining);
}`,
        },
        { type: 'table', head: ['Measure', 'Cost'], rows: [['Time', 'O(n), each node once'], ['Space', 'O(h): O(log n) balanced, O(n) skewed'], ['Iterative version', 'Explicit Deque as stack']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Mixing "what I return" with "the global answer" (diameter returns height, not diameter). Leaf check must be `left == null && right == null`, not just `n == null`. Path problems with negative values: do not prune early. Skewed trees with 10^5 nodes can overflow the stack.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Invert Binary Tree → Path Sum → Diameter of Binary Tree → Lowest Common Ancestor of a Binary Tree → Binary Tree Maximum Path Sum.' },
      ],
    },

    // ───────────────────────────── Tree BFS ─────────────────────────────
    {
      id: 'tree-bfs',
      title: 'Tree BFS (Level Order)',
      summary: 'Process the tree one level at a time with a queue.',
      tags: ['tree', 'bfs', 'level order', 'queue'],
      blocks: [
        { type: 'text', text: 'Put the root in a queue. Each round, read the current queue size: that is exactly one level. Poll that many nodes and enqueue their children.' },
        { type: 'list', title: 'Use it when', items: ['"Level by level", "each depth", "zigzag".', '"Right side view", "largest value in each row".', '"Minimum depth" (BFS stops at the first leaf).', 'Connect next pointers on the same level.'] },
        {
          type: 'code',
          title: 'Level order template',
          lang: 'java',
          code: `List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();                    // freeze this level
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        res.add(level);
    }
    return res;
}`,
        },
        { type: 'table', head: ['Variant', 'Change'], rows: [['Right side view', 'Record the last node of each level'], ['Zigzag', 'Reverse level list on odd levels (or addFirst)'], ['Min depth', 'Return depth at the first leaf'], ['Time / space', 'O(n) / O(max width)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Using `q.size()` in the for condition: it changes while you add children. `ArrayDeque` does not allow `null`: check children before offering. Forgetting the empty-root case.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Binary Tree Level Order Traversal → Binary Tree Right Side View → Binary Tree Zigzag Level Order Traversal → Maximum Width of Binary Tree.' },
      ],
    },

    // ───────────────────────────── BST ─────────────────────────────
    {
      id: 'bst-tricks',
      title: 'BST Tricks',
      summary: 'Left < node < right. In-order is sorted. Search goes one way.',
      tags: ['bst', 'binary search tree', 'inorder', 'validate'],
      blocks: [
        { type: 'text', text: 'A BST lets you discard half the tree at each step, like binary search. Two facts solve most problems: in-order traversal is sorted, and every node has a valid (low, high) range from its ancestors.' },
        { type: 'list', title: 'Use it when', items: ['"Validate BST".', '"k-th smallest", "two sum in BST" (in-order is sorted).', '"Insert / delete / search" in O(h).', 'LCA in a BST (split point of p and q).', 'Floor/ceiling queries in Java: `TreeMap` / `TreeSet`.'] },
        {
          type: 'code',
          title: 'Validate with bounds, k-th smallest with iterative in-order',
          lang: 'java',
          code: `boolean isValidBST(TreeNode n) { return valid(n, Long.MIN_VALUE, Long.MAX_VALUE); }
boolean valid(TreeNode n, long low, long high) {
    if (n == null) return true;
    if (n.val <= low || n.val >= high) return false;
    return valid(n.left, low, n.val) && valid(n.right, n.val, high);
}

int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> st = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }
        cur = st.pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}

TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;                  // split point
    }
    return null;
}`,
        },
        { type: 'table', head: ['Operation', 'Balanced', 'Skewed'], rows: [['Search/insert/delete', 'O(log n)', 'O(n)'], ['In-order traversal', 'O(n)', 'O(n)'], ['TreeMap floorKey / ceilingKey', 'O(log n)', 'always balanced']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Checking only direct children (`left.val < n.val`) misses deeper violations: pass bounds. Bounds as `int` fail when node values are `Integer.MIN_VALUE`: use `long` or nullable bounds. Delete with two children: replace with the in-order successor, then delete that successor.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Search in a Binary Search Tree → Lowest Common Ancestor of a Binary Search Tree → Validate Binary Search Tree → Kth Smallest Element in a BST → Delete Node in a BST.' },
      ],
    },

    // ───────────────────────────── Graph BFS ─────────────────────────────
    {
      id: 'graph-bfs',
      title: 'Graph BFS',
      summary: 'Shortest path in unweighted graphs and grids, single or multi-source.',
      tags: ['graph', 'bfs', 'shortest path', 'grid', 'multi-source'],
      blocks: [
        { type: 'text', text: 'BFS explores in rings of equal distance. The first time you reach a node is the shortest path, if every edge costs 1. **Multi-source BFS** starts with all sources in the queue at distance 0.' },
        { type: 'list', title: 'Use it when', items: ['"Minimum number of steps / moves / transformations".', 'Grid with unit moves (up/down/left/right).', '"Distance to nearest X" for every cell (multi-source).', '"Rotting oranges", "walls and gates", spreading fire.', 'Word Ladder: words are nodes, one-letter changes are edges.'] },
        {
          type: 'code',
          title: 'Grid BFS, multi-source (Rotting Oranges)',
          lang: 'java',
          code: `int orangesRotting(int[][] g) {
    int rows = g.length, cols = g[0].length, fresh = 0, minutes = 0;
    Deque<int[]> q = new ArrayDeque<>();
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (g[r][c] == 2) q.offer(new int[]{r, c});   // all sources
            else if (g[r][c] == 1) fresh++;
        }
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty() && fresh > 0) {
        for (int i = q.size(); i > 0; i--) {
            int[] cur = q.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || g[nr][nc] != 1) continue;
                g[nr][nc] = 2;                 // mark when ENQUEUED
                fresh--;
                q.offer(new int[]{nr, nc});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}`,
        },
        { type: 'table', head: ['Variant', 'Time', 'Space'], rows: [['Adjacency list BFS', 'O(V + E)', 'O(V)'], ['Grid BFS', 'O(rows · cols)', 'O(rows · cols)'], ['Multi-source', 'Same as single', 'Same'], ['0-1 BFS (edges 0 or 1)', 'O(V + E) with deque', 'O(V)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Marking visited when **polling** instead of when **enqueuing** adds the same node many times (TLE). Bounds check before reading `g[nr][nc]`. Counting levels wrong: snapshot `q.size()` per level. BFS on weighted graphs is wrong: use Dijkstra.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Flood Fill → Rotting Oranges → 01 Matrix → Shortest Path in Binary Matrix → Word Ladder.' },
      ],
    },

    // ───────────────────────────── Graph DFS ─────────────────────────────
    {
      id: 'graph-dfs',
      title: 'Graph DFS',
      summary: 'Explore deep: count components, flood islands, detect cycles with colors.',
      tags: ['graph', 'dfs', 'components', 'cycle detection', 'islands'],
      blocks: [
        { type: 'text', text: 'DFS goes as deep as possible before backtracking. Start a new DFS from every unvisited node to count **connected components**. For cycles in a directed graph, use three colors: unvisited, on the current path, done.' },
        { type: 'list', title: 'Use it when', items: ['"Number of islands / provinces / connected groups".', '"Can you reach X from Y".', '"Is there a cycle" / "can all courses be finished".', 'Clone a graph, area of an island.'] },
        {
          type: 'code',
          title: 'Components and 3-color cycle detection',
          lang: 'java',
          code: `// Count islands: sink visited land
int numIslands(char[][] g) {
    int count = 0;
    for (int r = 0; r < g.length; r++)
        for (int c = 0; c < g[0].length; c++)
            if (g[r][c] == '1') { count++; sink(g, r, c); }
    return count;
}
void sink(char[][] g, int r, int c) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';
    sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}

// Directed cycle: 0 = white, 1 = gray (on path), 2 = black (done)
boolean hasCycle(List<List<Integer>> adj, int u, int[] color) {
    color[u] = 1;
    for (int v : adj.get(u)) {
        if (color[v] == 1) return true;                    // back edge
        if (color[v] == 0 && hasCycle(adj, v, color)) return true;
    }
    color[u] = 2;
    return false;
}`,
        },
        { type: 'table', head: ['Task', 'Time', 'Note'], rows: [['Components', 'O(V + E)', 'Loop over all nodes'], ['Undirected cycle', 'O(V + E)', 'Track parent, or Union-Find'], ['Directed cycle', 'O(V + E)', 'Three colors'], ['Grid DFS', 'O(rows · cols)', 'Recursion depth up to rows · cols']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'A plain `visited` boolean cannot detect directed cycles: you need the gray "on path" state. In undirected graphs, the edge back to the parent is not a cycle. Forgetting disconnected parts: start DFS from every node. Big grids may overflow the stack: switch to BFS or an explicit stack.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Number of Islands → Max Area of Island → Number of Provinces → Course Schedule → Pacific Atlantic Water Flow.' },
      ],
    },

    // ───────────────────────────── Topo sort ─────────────────────────────
    {
      id: 'topological-sort',
      title: 'Topological Sort',
      summary: 'Order tasks so every prerequisite comes first (DAGs only).',
      tags: ['graph', 'topological sort', 'kahn', 'dag', 'prerequisites'],
      blocks: [
        { type: 'text', text: 'Topological order lists nodes so every edge `u → v` has `u` before `v`. **Kahn\'s algorithm**: repeatedly take nodes with in-degree 0. **DFS**: add a node after all its descendants, then reverse. If not every node gets output, there is a cycle.' },
        { type: 'list', title: 'Use it when', items: ['"Prerequisites", "dependencies", "build order".', '"Can all tasks be finished".', 'Order letters from a sorted alien dictionary.', 'DP on a DAG (longest path) needs a processing order.'] },
        {
          type: 'code',
          title: 'Kahn (BFS)',
          lang: 'java',
          code: `int[] findOrder(int n, int[][] prereq) {          // pair = {course, before}
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] p : prereq) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[n];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return idx == n ? order : new int[0];         // short = cycle
}`,
        },
        {
          type: 'code',
          title: 'DFS version (post-order, then reverse)',
          lang: 'java',
          code: `boolean dfs(int u, List<List<Integer>> adj, int[] color, Deque<Integer> out) {
    color[u] = 1;
    for (int v : adj.get(u)) {
        if (color[v] == 1) return false;                      // cycle
        if (color[v] == 0 && !dfs(v, adj, color, out)) return false;
    }
    color[u] = 2;
    out.push(u);                // push to front: stack gives reversed post-order
    return true;
}`,
        },
        { type: 'table', head: ['Method', 'Time', 'Space', 'Cycle check'], rows: [['Kahn', 'O(V + E)', 'O(V + E)', 'output size < V'], ['DFS', 'O(V + E)', 'O(V + E)', 'gray node found']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Edge direction backwards: `[a, b]` in Course Schedule means b → a. Forgetting nodes with no edges (they still need in-degree 0 entries). Alien Dictionary: a longer word before its own prefix is invalid input.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Course Schedule → Course Schedule II → Minimum Height Trees → Alien Dictionary.' },
      ],
    },

    // ───────────────────────────── Union-Find ─────────────────────────────
    {
      id: 'union-find',
      title: 'Union-Find (DSU)',
      summary: 'Merge groups and ask "same group?" in near O(1).',
      tags: ['union find', 'dsu', 'disjoint set', 'components', 'connectivity'],
      blocks: [
        { type: 'text', text: 'Each element points to a parent. The root names the group. `find` follows parents to the root (with path compression). `union` links two roots (by rank or size). Both are almost O(1).' },
        { type: 'list', title: 'Use it when', items: ['Edges arrive one at a time and you ask about connectivity.', '"Number of connected components" with edge list input.', '"Redundant connection": the first edge that joins already-connected nodes.', 'Grouping by shared attribute (Accounts Merge).', 'Kruskal\'s MST.'] },
        {
          type: 'code',
          title: 'DSU with path compression and union by size',
          lang: 'java',
          code: `class DSU {
    int[] parent, size;
    int groups;
    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        groups = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];    // path halving
            x = parent[x];
        }
        return x;
    }
    boolean union(int a, int b) {             // false if already joined
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        groups--;
        return true;
    }
}`,
        },
        { type: 'table', head: ['Operation', 'Time'], rows: [['find / union', 'O(α(n)), practically constant'], ['Build', 'O(n)'], ['Space', 'O(n)'], ['Grid cell id', 'r * cols + c']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`. Linking `a` to `b` instead of root to root. Forgetting to initialise `parent[i] = i`. DSU cannot "un-union": if edges get removed, process in reverse or use another method.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Number of Provinces → Redundant Connection → Accounts Merge → Number of Islands II (or Satisfiability of Equality Equations).' },
      ],
    },

    // ───────────────────────────── Dijkstra ─────────────────────────────
    {
      id: 'dijkstra',
      title: 'Dijkstra',
      summary: 'Shortest paths from one source with non-negative weights.',
      tags: ['graph', 'dijkstra', 'shortest path', 'weighted', 'priority queue'],
      blocks: [
        { type: 'text', text: 'Always expand the closest unfinished node, using a min-heap of (distance, node). When a node is polled with its best distance, it is final. Works only with **non-negative** edge weights.' },
        { type: 'list', title: 'Use it when', items: ['Weighted graph, "minimum cost / time / effort".', '"Network delay time", "cheapest path".', 'Grid where moves have different costs (or cost = max along path).', 'Probability paths (maximize product: use a max-heap).'] },
        {
          type: 'code',
          title: 'Dijkstra with lazy deletion',
          lang: 'java',
          code: `int[] dijkstra(int n, List<List<int[]>> adj, int src) {   // adj: {to, w}
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, src});
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], u = top[1];
        if (d > dist[u]) continue;                   // stale entry, skip
        for (int[] e : adj.get(u)) {
            int v = e[0], nd = d + e[1];
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.offer(new int[]{nd, v});
            }
        }
    }
    return dist;
}`,
        },
        { type: 'table', head: ['Variant', 'Time'], rows: [['Binary heap (Java PQ)', 'O((V + E) log V)'], ['Grid', 'O(R·C log(R·C))'], ['Min-max path (Path With Minimum Effort)', 'nd = max(d, w)'], ['Negative weights', 'Not allowed: use Bellman-Ford']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Missing the stale check `d > dist[u]` makes it slow. `dist + w` overflows when dist is `MAX_VALUE`: only relax from finalized nodes, or use `long`. Marking visited on push instead of on pop gives wrong answers. Negative edges silently break it.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Network Delay Time → Path With Minimum Effort → Path with Maximum Probability → Swim in Rising Water.' },
      ],
    },

    // ───────────────────────────── Bellman-Ford ─────────────────────────────
    {
      id: 'bellman-ford',
      title: 'Bellman-Ford & BFS with K Stops',
      summary: 'Shortest path with a limit on edges, or with negative weights.',
      tags: ['graph', 'bellman-ford', 'k stops', 'negative weights', 'shortest path'],
      blocks: [
        { type: 'text', text: 'Bellman-Ford relaxes every edge, V-1 times. After round i, `dist` holds the best paths using at most i edges. That makes it perfect for "at most K stops". A further round that still improves means a negative cycle.' },
        { type: 'list', title: 'Use it when', items: ['"At most K stops / edges / flights".', 'Negative edge weights (no negative cycles).', 'Detect a negative cycle (arbitrage).', 'Small V·E (≈ 10^6 or less).'] },
        {
          type: 'code',
          title: 'Cheapest flights within K stops',
          lang: 'java',
          code: `int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int INF = Integer.MAX_VALUE;
    int[] dist = new int[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {        // k stops = k+1 edges
        int[] next = dist.clone();                    // use LAST round's values
        for (int[] f : flights) {
            int u = f[0], v = f[1], w = f[2];
            if (dist[u] != INF && dist[u] + w < next[v]) next[v] = dist[u] + w;
        }
        dist = next;
    }
    return dist[dst] == INF ? -1 : dist[dst];
}`,
        },
        { type: 'table', head: ['Method', 'Time', 'Use'], rows: [['Bellman-Ford', 'O(V · E)', 'Negative weights, K-edge limit'], ['BFS by levels with cost array', 'O(K · E)', 'K stops, simple to reason'], ['Dijkstra with (cost, node, stops)', 'O(E·K log(E·K))', 'Works if state includes stops'], ['SPFA', 'O(V · E) worst', 'Queue-based Bellman-Ford']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Updating `dist` in place within a round lets a path use more edges than allowed: copy to `next`. K stops means K+1 edges. Adding to `INF` overflows: skip unreachable `u`. Plain Dijkstra on node alone ignores the stop limit and fails.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Network Delay Time (solve again with Bellman-Ford) → Cheapest Flights Within K Stops.' },
      ],
    },

    // ───────────────────────────── MST ─────────────────────────────
    {
      id: 'mst',
      title: 'Minimum Spanning Tree',
      summary: 'Connect all nodes with minimum total edge weight: Kruskal or Prim.',
      tags: ['graph', 'mst', 'kruskal', 'prim', 'union find'],
      blocks: [
        { type: 'text', text: '**Kruskal**: sort edges by weight, add each edge that joins two different components (Union-Find). **Prim**: grow one tree from a start node, always adding the cheapest edge leaving it (heap). Both give the same total.' },
        { type: 'list', title: 'Use it when', items: ['"Connect all points/cities with minimum cost".', '"Minimum cost to make the network connected".', 'Any "cheapest set of edges that connects everything" (no path between two specific nodes).'] },
        {
          type: 'code',
          title: 'Kruskal (with the DSU from Union-Find)',
          lang: 'java',
          code: `int kruskal(int n, int[][] edges) {                // edge: {u, v, w}
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));
    DSU dsu = new DSU(n);
    int total = 0, used = 0;
    for (int[] e : edges) {
        if (dsu.union(e[0], e[1])) {
            total += e[2];
            if (++used == n - 1) break;
        }
    }
    return used == n - 1 ? total : -1;              // -1: not connected
}`,
        },
        {
          type: 'code',
          title: 'Prim on a dense graph (Min Cost to Connect All Points)',
          lang: 'java',
          code: `int minCostConnectPoints(int[][] p) {
    int n = p.length, total = 0;
    int[] best = new int[n];
    boolean[] in = new boolean[n];
    Arrays.fill(best, Integer.MAX_VALUE);
    best[0] = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;
        for (int i = 0; i < n; i++) if (!in[i] && (u == -1 || best[i] < best[u])) u = i;
        in[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++) {
            int d = Math.abs(p[u][0] - p[v][0]) + Math.abs(p[u][1] - p[v][1]);
            if (!in[v] && d < best[v]) best[v] = d;
        }
    }
    return total;
}`,
        },
        { type: 'table', head: ['Method', 'Time', 'Best for'], rows: [['Kruskal', 'O(E log E)', 'Edge lists, sparse graphs'], ['Prim + heap', 'O(E log V)', 'Adjacency lists'], ['Prim O(V^2) array', 'O(V^2)', 'Dense / complete graphs (points)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'MST is not shortest path: Dijkstra minimizes distance to one source, MST minimizes total edges. For complete graphs, building all E = V^2 edges then sorting is slower than O(V^2) Prim. Check the graph is connected (used == n - 1).' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Min Cost to Connect All Points (both Kruskal and Prim) → Connecting Cities With Minimum Cost → Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree.' },
      ],
    },

    // ───────────────────────────── Backtracking ─────────────────────────────
    {
      id: 'backtracking',
      title: 'Backtracking',
      summary: 'Build answers one choice at a time, undo, and try the next choice.',
      tags: ['backtracking', 'subsets', 'permutations', 'combinations', 'pruning', 'dfs'],
      blocks: [
        { type: 'text', text: 'Backtracking is DFS over a tree of choices. At each step: choose, recurse, un-choose. Prune branches that cannot lead to a valid answer. It explores exponential space, so small `n` is the clue.' },
        { type: 'list', title: 'Use it when', items: ['"Return all subsets / permutations / combinations".', '"All valid ways", "generate all", N-Queens, Sudoku.', 'n ≤ 20 or so.', 'Word search on a grid.'] },
        {
          type: 'code',
          title: 'Subsets, permutations, combination sum',
          lang: 'java',
          code: `void subsets(int[] a, int start, List<Integer> path, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));                  // COPY the path
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue; // skip dups (sorted input)
        path.add(a[i]);                              // choose
        subsets(a, i + 1, path, res);                // explore
        path.remove(path.size() - 1);                // un-choose
    }
}

void permute(int[] a, boolean[] used, List<Integer> path, List<List<Integer>> res) {
    if (path.size() == a.length) { res.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < a.length; i++) {
        if (used[i]) continue;
        used[i] = true; path.add(a[i]);
        permute(a, used, path, res);
        used[i] = false; path.remove(path.size() - 1);
    }
}

void combSum(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length && c[i] <= remain; i++) {   // prune (sorted c)
        path.add(c[i]);
        combSum(c, i, remain - c[i], path, res);     // i, not i+1: reuse allowed
        path.remove(path.size() - 1);
    }
}`,
        },
        { type: 'table', head: ['Shape', 'Next start', 'Count of results'], rows: [['Subsets', 'i + 1', '2^n'], ['Combinations of size k', 'i + 1, stop at size k', 'C(n, k)'], ['Combination Sum (reuse)', 'i', 'depends on target'], ['Permutations', '0 with used[]', 'n!']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Adding `path` itself instead of `new ArrayList<>(path)`: every result ends up as the same (empty) list. Forgetting to undo the choice. `path.remove(x)` with an `Integer` removes by value, not index: use `path.remove(path.size() - 1)`. Duplicate skipping needs sorted input and `i > start`.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Subsets → Permutations → Combination Sum → Subsets II → Word Search → N-Queens.' },
      ],
    },

    // ───────────────────────────── Greedy ─────────────────────────────
    {
      id: 'greedy',
      title: 'Greedy',
      summary: 'Take the locally best choice and prove it never hurts.',
      tags: ['greedy', 'exchange argument', 'intervals', 'scheduling'],
      blocks: [
        { type: 'text', text: 'Greedy makes one choice per step and never revisits it. It is fast and short, but only correct when you can argue the choice is safe. If you cannot justify it, try a small counterexample, then consider DP.' },
        {
          type: 'list',
          title: 'How to justify a greedy choice',
          items: [
            '**Exchange argument**: take any optimal answer; swap in the greedy choice; it is no worse.',
            '**Stays ahead**: after each step, greedy is at least as good as any other solution.',
            'Quick test: try 3-4 tiny inputs by hand, including tricky ones.',
          ],
        },
        { type: 'list', title: 'Use it when', items: ['"Maximum number of non-overlapping intervals" (sort by end).', '"Can you reach the end" (track farthest reach).', '"Minimum number of X to cover Y".', 'Sorting by one key makes the choice obvious.', 'Gas station, task scheduling, assigning cookies.'] },
        {
          type: 'code',
          title: 'Two classic greedies',
          lang: 'java',
          code: `// Jump Game: track farthest reachable index
boolean canJump(int[] a) {
    int far = 0;
    for (int i = 0; i < a.length; i++) {
        if (i > far) return false;            // stuck
        far = Math.max(far, i + a[i]);
    }
    return true;
}

// Non-overlapping intervals: keep the one that ends first
int eraseOverlapIntervals(int[][] iv) {
    Arrays.sort(iv, (x, y) -> Integer.compare(x[1], y[1]));
    int kept = 0, end = Integer.MIN_VALUE;
    for (int[] cur : iv) {
        if (cur[0] >= end) { kept++; end = cur[1]; }
    }
    return iv.length - kept;                  // removed
}`,
        },
        { type: 'table', head: ['Problem type', 'Greedy rule'], rows: [['Max non-overlapping intervals', 'Sort by end, take earliest end'], ['Min arrows / points to cover', 'Sort by end, shoot at end'], ['Jump Game II', 'BFS-like levels: farthest in current range'], ['Gas Station', 'Reset start when tank goes negative']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Sorting by start when the proof needs end. Greedy on coin change with arbitrary coins is wrong (use DP). Not testing a counterexample before coding. Touching vs overlapping intervals: read whether `[1,2]` and `[2,3]` overlap.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Assign Cookies → Jump Game → Gas Station → Non-overlapping Intervals → Jump Game II.' },
      ],
    },

    // ───────────────────────────── Intervals ─────────────────────────────
    {
      id: 'intervals',
      title: 'Intervals & Sweep Line',
      summary: 'Sort by start, then merge, insert, or count overlaps with a sweep.',
      tags: ['intervals', 'merge', 'sweep line', 'meeting rooms', 'sorting'],
      blocks: [
        { type: 'text', text: 'Sort intervals by start. Then a single pass can merge overlaps. For "how many overlap at once", turn each interval into two events (+1 at start, -1 at end) and sweep in time order.' },
        { type: 'list', title: 'Use it when', items: ['Input is a list of `[start, end]` pairs.', '"Merge overlapping", "insert interval".', '"Minimum meeting rooms", "maximum overlap", "busy times".', 'Calendar booking problems.'] },
        {
          type: 'code',
          title: 'Merge and meeting rooms',
          lang: 'java',
          code: `int[][] merge(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> res = new ArrayList<>();
    for (int[] cur : iv) {
        if (res.isEmpty() || res.get(res.size() - 1)[1] < cur[0]) res.add(cur);
        else res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], cur[1]);
    }
    return res.toArray(new int[0][]);
}

// Min meeting rooms: sweep with separate sorted starts and ends
int minMeetingRooms(int[][] iv) {
    int n = iv.length;
    int[] s = new int[n], e = new int[n];
    for (int i = 0; i < n; i++) { s[i] = iv[i][0]; e[i] = iv[i][1]; }
    Arrays.sort(s);
    Arrays.sort(e);
    int rooms = 0, best = 0, j = 0;
    for (int i = 0; i < n; i++) {
        while (e[j] <= s[i]) { j++; rooms--; }   // free rooms that ended
        rooms++;
        best = Math.max(best, rooms);
    }
    return best;
}`,
        },
        { type: 'table', head: ['Task', 'Method', 'Time'], rows: [['Merge', 'Sort by start, extend last', 'O(n log n)'], ['Insert into sorted', 'Before / overlap / after, 3 phases', 'O(n)'], ['Meeting rooms', 'Min-heap of end times, or sweep', 'O(n log n)'], ['Max overlap with updates', 'TreeMap<time, delta>', 'O(log n) per add']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Forgetting to sort first. `<` vs `<=` decides whether touching intervals merge. Sweep ties: process ends before starts when touching does not overlap. Mutating input intervals while merging can surprise callers (fine on LeetCode).' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Meeting Rooms → Merge Intervals → Insert Interval → Meeting Rooms II → My Calendar II.' },
      ],
    },

    // ───────────────────────────── DP overview ─────────────────────────────
    {
      id: 'dp',
      title: 'Dynamic Programming: The Method',
      summary: 'Define a state, write the recurrence, set the base, pick the order.',
      tags: ['dp', 'dynamic programming', 'memoization', 'tabulation', 'state'],
      blocks: [
        { type: 'text', text: 'DP is recursion plus a cache. If the same subproblem shows up many times, store its answer. The hard part is choosing the **state**: the smallest set of facts that fully describes a subproblem.' },
        {
          type: 'steps',
          title: 'The 5-step recipe',
          items: [
            'State: "`dp[i]` = the answer for the first i items / ending at i / starting at i". Write it in words.',
            'Recurrence: how `dp[i]` is built from smaller states. Think about the last choice made.',
            'Base cases: the smallest states you know directly.',
            'Order: compute states so every dependency is ready (or let memoization handle it).',
            'Answer: which state (or max over states) is the final answer. Then squeeze space if rows only use the previous row.',
          ],
        },
        { type: 'list', title: 'Use it when', items: ['"Number of ways", "minimum cost", "maximum value", "is it possible".', 'Choices at each step and future depends only on a small summary of the past.', 'Brute-force recursion repeats subproblems.', 'Greedy fails on a counterexample.'] },
        {
          type: 'code',
          title: 'Top-down vs bottom-up (Climbing Stairs / House Robber style)',
          lang: 'java',
          code: `// Top-down: write the recursion, then cache
Integer[] memo;
int ways(int i) {                       // ways to reach step i
    if (i <= 1) return 1;
    if (memo[i] != null) return memo[i];
    return memo[i] = ways(i - 1) + ways(i - 2);
}

// Bottom-up with O(1) space: House Robber
int rob(int[] a) {
    int prev2 = 0, prev1 = 0;           // dp[i-2], dp[i-1]
    for (int x : a) {
        int cur = Math.max(prev1, prev2 + x);   // skip or take
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}`,
        },
        { type: 'table', head: ['Style', 'Pros', 'Cons'], rows: [['Top-down (memo)', 'Easy to write from recursion, skips unused states', 'Stack depth, object overhead'], ['Bottom-up (table)', 'No recursion, easy space optimisation', 'Must get the order right'], ['Space optimised', 'O(1) or O(row)', 'Harder to rebuild the path']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'State too small (missing a fact the future needs). Memo with `int[]` default 0 when 0 is a valid answer: use `Integer[]` or fill with -1. Wrong loop order in bottom-up. Overflow in counting problems: apply `% MOD` at every add.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Climbing Stairs → House Robber → Coin Change → Decode Ways. For each, write the state sentence before any code.' },
      ],
    },
    {
      id: 'dp-1d',
      title: 'DP: 1-D',
      summary: 'dp[i] depends on a few earlier positions.',
      tags: ['dp', '1d', 'linear', 'kadane'],
      blocks: [
        { type: 'text', text: 'One index describes the subproblem: a prefix, or "ending at i". The recurrence looks back a fixed number of steps, or over all earlier j (O(n^2)).' },
        { type: 'list', title: 'Use it when', items: ['Sequence of steps, houses, days, characters.', '"Max subarray" (Kadane: best ending here).', '"Ways to decode / climb / split".', 'Word Break: `dp[i]` = prefix of length i is breakable.'] },
        {
          type: 'code',
          title: 'Kadane and Word Break',
          lang: 'java',
          code: `int maxSubArray(int[] a) {
    int cur = a[0], best = a[0];            // best sum ending here
    for (int i = 1; i < a.length; i++) {
        cur = Math.max(a[i], cur + a[i]);   // start fresh or extend
        best = Math.max(best, cur);
    }
    return best;
}

boolean wordBreak(String s, List<String> words) {
    Set<String> dict = new HashSet<>(words);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;                           // empty prefix
    for (int i = 1; i <= s.length(); i++)
        for (int j = 0; j < i && !dp[i]; j++)
            dp[i] = dp[j] && dict.contains(s.substring(j, i));
    return dp[s.length()];
}`,
        },
        { type: 'table', head: ['Problem', 'State', 'Time'], rows: [['Climbing Stairs', 'ways to reach i', 'O(n)'], ['House Robber', 'best using first i houses', 'O(n)'], ['Max Subarray', 'best ending at i', 'O(n)'], ['Word Break', 'prefix i breakable', 'O(n^2 · L)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Kadane with all negatives: initialize with `a[0]`, not 0. Off-by-one between "length i" and "index i": choose one and size arrays `n + 1`. Decode Ways: "0" alone is invalid.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Min Cost Climbing Stairs → Maximum Subarray → Decode Ways → Word Break → Maximum Product Subarray.' },
      ],
    },
    {
      id: 'dp-2d',
      title: 'DP: Grid & Two Strings',
      summary: 'dp[i][j] for grid cells or prefixes of two strings.',
      tags: ['dp', '2d', 'grid', 'lcs', 'edit distance', 'strings'],
      blocks: [
        { type: 'text', text: 'Grid DP: `dp[r][c]` uses the cell above and the cell to the left. Two-string DP: `dp[i][j]` is the answer for the first i chars of A and first j chars of B. Look at the last characters: equal or not.' },
        { type: 'list', title: 'Use it when', items: ['"Unique paths", "min path sum" in a grid moving right/down.', '"Longest common subsequence", "edit distance", "interleaving".', 'Two sequences compared position by position.', '"Largest square of 1s".'] },
        {
          type: 'code',
          title: 'LCS and Edit Distance',
          lang: 'java',
          code: `int lcs(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];          // row/col 0 = empty prefix
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}

int minDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;   // delete all
    for (int j = 0; j <= m; j++) dp[0][j] = j;   // insert all
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[n][m];
}`,
        },
        { type: 'table', head: ['Problem', 'Transition', 'Time / space'], rows: [['Unique Paths', 'up + left', 'O(RC) / O(C)'], ['Min Path Sum', 'cell + min(up, left)', 'O(RC) / O(C)'], ['LCS', 'match: diag+1, else max(up, left)', 'O(nm) / O(m)'], ['Edit Distance', 'match: diag, else 1 + min(3)', 'O(nm) / O(m)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Index shift: `dp[i][j]` uses `charAt(i - 1)`. Forgetting first row/column base cases. When squeezing to 1-D, the diagonal value gets overwritten: save it in a temp before updating.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Unique Paths → Minimum Path Sum → Longest Common Subsequence → Edit Distance.' },
      ],
    },
    {
      id: 'dp-knapsack',
      title: 'DP: Knapsack (0/1 vs Unbounded)',
      summary: 'Pick items under a capacity. Loop direction decides reuse.',
      tags: ['dp', 'knapsack', 'coin change', 'subset sum', 'partition'],
      blocks: [
        { type: 'text', text: 'Knapsack: `dp[c]` = best result with capacity (or target sum) c. **0/1**: each item once, loop capacity **downward**. **Unbounded**: items reusable, loop capacity **upward**.' },
        { type: 'list', title: 'Use it when', items: ['"Can you pick a subset that sums to T".', '"Partition into two equal sums".', '"Minimum coins / number of ways to make amount".', '"Target sum with + and -" (reduces to subset sum).', 'Two capacities (Ones and Zeroes): 2-D knapsack.'] },
        {
          type: 'code',
          title: '0/1 subset sum and unbounded coin change',
          lang: 'java',
          code: `boolean canPartition(int[] a) {             // 0/1
    int sum = 0;
    for (int x : a) sum += x;
    if (sum % 2 == 1) return false;
    int t = sum / 2;
    boolean[] dp = new boolean[t + 1];
    dp[0] = true;
    for (int x : a)
        for (int c = t; c >= x; c--)          // DOWN: each item once
            dp[c] = dp[c] || dp[c - x];
    return dp[t];
}

int coinChange(int[] coins, int amount) {   // unbounded, min count
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);            // "infinity"
    dp[0] = 0;
    for (int coin : coins)
        for (int c = coin; c <= amount; c++)  // UP: reuse allowed
            dp[c] = Math.min(dp[c], dp[c - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
        },
        { type: 'table', head: ['Type', 'Inner loop', 'Time', 'Example'], rows: [['0/1', 'capacity high → low', 'O(n · T)', 'Partition Equal Subset Sum'], ['Unbounded', 'capacity low → high', 'O(n · T)', 'Coin Change'], ['Count combinations', 'items outer, capacity inner', 'O(n · T)', 'Coin Change II'], ['Count permutations', 'capacity outer, items inner', 'O(n · T)', 'Combination Sum IV']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Wrong loop direction silently turns 0/1 into unbounded (or back). Swapping loops in "count ways" counts orderings instead of combinations. Using `Integer.MAX_VALUE` as infinity then adding 1 overflows: use `amount + 1`.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Coin Change → Partition Equal Subset Sum → Coin Change II → Target Sum → Ones and Zeroes.' },
      ],
    },
    {
      id: 'dp-lis',
      title: 'DP: Longest Increasing Subsequence',
      summary: 'O(n^2) DP, or O(n log n) with patience sorting tails.',
      tags: ['dp', 'lis', 'binary search', 'subsequence'],
      blocks: [
        { type: 'text', text: 'O(n^2): `dp[i]` = LIS ending at i = 1 + max `dp[j]` for `j < i` with smaller value. O(n log n): keep `tails[k]` = smallest tail of an increasing subsequence of length k+1, and binary search where each new value goes.' },
        { type: 'list', title: 'Use it when', items: ['"Longest increasing / non-decreasing subsequence".', '"Russian doll envelopes" (sort, then LIS).', '"Number of LIS", "largest divisible subset" (O(n^2) version tracks more).', 'Chains of pairs that must increase.'] },
        {
          type: 'code',
          title: 'LIS in O(n log n)',
          lang: 'java',
          code: `int lengthOfLIS(int[] a) {
    int[] tails = new int[a.length];
    int size = 0;
    for (int x : a) {
        int lo = 0, hi = size;                 // first tail >= x
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] >= x) hi = mid;
            else lo = mid + 1;
        }
        tails[lo] = x;                         // replace or extend
        if (lo == size) size++;
    }
    return size;
}`,
        },
        { type: 'table', head: ['Version', 'Time', 'Gives'], rows: [['dp[i] over all j < i', 'O(n^2)', 'Length, counts, reconstruction'], ['tails + binary search', 'O(n log n)', 'Length only (tails is not the LIS)'], ['Non-decreasing variant', 'O(n log n)', 'search first tail > x']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: '`tails` is not the actual subsequence. Strict vs non-strict changes `>=` to `>`. Russian Doll Envelopes: sort width ascending and height **descending** for equal widths, or equal widths chain wrongly.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Longest Increasing Subsequence (both versions) → Number of Longest Increasing Subsequence → Russian Doll Envelopes.' },
      ],
    },
    {
      id: 'dp-interval',
      title: 'DP: Interval',
      summary: 'dp[l][r] solves a subarray/substring by splitting or shrinking it.',
      tags: ['dp', 'interval dp', 'palindrome', 'burst balloons'],
      blocks: [
        { type: 'text', text: 'The state is a range `[l, r]`. Either shrink it from the ends, or try every split point `k` inside it. Fill by increasing length so smaller ranges are ready first.' },
        { type: 'list', title: 'Use it when', items: ['"Longest palindromic subsequence", "minimum cuts for palindromes".', '"Burst balloons", "merge stones", "remove boxes".', 'The cost of combining depends on the whole range.', 'n ≤ 500 (O(n^3) is OK).'] },
        {
          type: 'code',
          title: 'Longest Palindromic Subsequence, filled by length',
          lang: 'java',
          code: `int longestPalindromeSubseq(String s) {
    int n = s.length();
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = 1;            // length 1
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            if (s.charAt(l) == s.charAt(r)) dp[l][r] = dp[l + 1][r - 1] + 2;
            else dp[l][r] = Math.max(dp[l + 1][r], dp[l][r - 1]);
        }
    }
    return dp[0][n - 1];
}
// Split form: dp[l][r] = best over k in [l, r] of dp[l][k-1] + dp[k+1][r] + cost(l, k, r)`,
        },
        { type: 'table', head: ['Form', 'Time', 'Example'], rows: [['Shrink ends', 'O(n^2)', 'Longest Palindromic Subsequence'], ['Split at k', 'O(n^3)', 'Burst Balloons, Matrix chain'], ['Last item chosen in range', 'O(n^3)', 'Burst Balloons (k bursts last)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Iterating `l` from 0 upward with `r` outer in the wrong order reads unfilled cells: loop by length, or `l` from n-1 down. Burst Balloons: think of `k` as the **last** balloon burst, and pad the array with 1s.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Longest Palindromic Subsequence → Palindrome Partitioning II → Minimum Cost Tree From Leaf Values → Burst Balloons.' },
      ],
    },
    {
      id: 'dp-state-machine',
      title: 'DP: State Machine',
      summary: 'Track a small set of modes per day (holding, sold, cooldown).',
      tags: ['dp', 'state machine', 'stocks', 'buy sell'],
      blocks: [
        { type: 'text', text: 'At each step you are in one of a few modes. Keep one variable per mode and write transitions between them. The stock problems are the classic family.' },
        { type: 'list', title: 'Use it when', items: ['"Buy and sell stock" with cooldown, fee, or at most k transactions.', 'Rules like "cannot do X twice in a row".', 'Each step changes a small status flag.', 'Paint house with "different from previous" (state = last colour).'] },
        {
          type: 'code',
          title: 'Stock with cooldown',
          lang: 'java',
          code: `int maxProfit(int[] prices) {
    int hold = Integer.MIN_VALUE / 2;   // own a stock
    int sold = 0;                       // just sold today (cooldown next)
    int rest = 0;                       // free to buy
    for (int p : prices) {
        int prevHold = hold, prevSold = sold, prevRest = rest;
        hold = Math.max(prevHold, prevRest - p);   // keep or buy
        sold = prevHold + p;                        // sell
        rest = Math.max(prevRest, prevSold);        // wait
    }
    return Math.max(sold, rest);
}`,
        },
        { type: 'table', head: ['Variant', 'States'], rows: [['Unlimited trades', 'hold, free'], ['With fee', 'hold, free (subtract fee on sell)'], ['Cooldown', 'hold, sold, rest'], ['At most k trades', 'hold[j], free[j] for j = 1..k']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Updating states in place so today\'s buy feeds today\'s sell: copy previous values first. `Integer.MIN_VALUE + p` overflows: start at `MIN_VALUE / 2` or `-prices[0]`. Draw the state diagram before coding.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Best Time to Buy and Sell Stock II → Best Time to Buy and Sell Stock with Transaction Fee → Best Time to Buy and Sell Stock with Cooldown → Best Time to Buy and Sell Stock IV.' },
      ],
    },
    {
      id: 'dp-bitmask',
      title: 'DP: Bitmask',
      summary: 'State includes a set of used items, stored as bits of an int.',
      tags: ['dp', 'bitmask', 'subsets', 'tsp', 'assignment'],
      blocks: [
        { type: 'text', text: 'When n ≤ 20, a set of chosen items fits in an int `mask`. `dp[mask]` (or `dp[mask][last]`) is the best result having used exactly those items. Transitions add one unused item.' },
        { type: 'list', title: 'Use it when', items: ['n ≤ 16-20 and order or assignment matters.', '"Visit all nodes" (shortest path visiting every node, TSP).', '"Partition into k equal subsets", "assign tasks to workers".', 'Brute force over permutations (n!) is too slow but 2^n · n fits.'] },
        {
          type: 'code',
          title: 'Assign n tasks to n people: dp[mask] = min cost',
          lang: 'java',
          code: `int minCost(int[][] cost) {             // cost[person][task]
    int n = cost.length, full = 1 << n;
    int[] dp = new int[full];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int mask = 0; mask < full; mask++) {
        if (dp[mask] == Integer.MAX_VALUE) continue;
        int person = Integer.bitCount(mask);   // next person to assign
        if (person == n) continue;
        for (int t = 0; t < n; t++) {
            if ((mask & (1 << t)) != 0) continue;   // task used
            int next = mask | (1 << t);
            dp[next] = Math.min(dp[next], dp[mask] + cost[person][t]);
        }
    }
    return dp[full - 1];
}`,
        },
        { type: 'table', head: ['Bit op', 'Meaning'], rows: [['mask & (1 << i)', 'is i in the set'], ['mask | (1 << i)', 'add i'], ['mask & ~(1 << i)', 'remove i'], ['Integer.bitCount(mask)', 'set size'], ['Time', 'O(2^n · n) or O(2^n · n^2)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Operator precedence: `mask & 1 << i == 0` parses wrongly: add parentheses. `1 << 31` is negative; use `1L` for 32+ bits. Memory: `dp[1 << 20][20]` ints is about 80 MB, check limits.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Partition to K Equal Sum Subsets → Shortest Path Visiting All Nodes → Find the Shortest Superstring (hard).' },
      ],
    },
    {
      id: 'dp-tree',
      title: 'DP: On Trees',
      summary: 'Each node returns a small array of answers for its subtree.',
      tags: ['dp', 'tree dp', 'post-order', 'house robber iii'],
      blocks: [
        { type: 'text', text: 'Tree DP is post-order DFS where each node returns a few values, one per state (for example "best if I take this node" and "best if I skip it"). The parent combines the children\'s arrays.' },
        { type: 'list', title: 'Use it when', items: ['"Choose nodes with no two adjacent" (House Robber III).', '"Maximum path sum", "longest path" in a tree.', '"Minimum cameras to cover the tree".', 'Answer at a node depends on choices in its subtree.'] },
        {
          type: 'code',
          title: 'House Robber III',
          lang: 'java',
          code: `int rob(TreeNode root) {
    int[] r = dfs(root);
    return Math.max(r[0], r[1]);
}
// returns {best if node skipped, best if node taken}
int[] dfs(TreeNode n) {
    if (n == null) return new int[]{0, 0};
    int[] l = dfs(n.left), r = dfs(n.right);
    int skip = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);
    int take = n.val + l[0] + r[0];       // children must be skipped
    return new int[]{skip, take};
}`,
        },
        { type: 'table', head: ['Problem', 'States per node', 'Time'], rows: [['House Robber III', 'take / skip', 'O(n)'], ['Binary Tree Cameras', 'covered / has camera / not covered', 'O(n)'], ['Max Path Sum', 'best downward path + global', 'O(n)'], ['General tree (adj list)', 'pass parent to avoid going back', 'O(n)']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Memoizing by node with a HashMap works but is slower than returning arrays. On general trees from edge lists, forgetting the parent check causes infinite recursion. Defining states that overlap or miss a case (cameras).' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'House Robber III → Binary Tree Maximum Path Sum → Binary Tree Cameras.' },
      ],
    },

    // ───────────────────────────── Bit manipulation ─────────────────────────────
    {
      id: 'bit-manipulation',
      title: 'Bit Manipulation',
      summary: 'XOR cancels pairs, masks test and set bits, n & (n-1) drops the lowest 1.',
      tags: ['bits', 'xor', 'mask', 'bitwise'],
      blocks: [
        { type: 'text', text: 'Integers are arrays of 32 bits. A few identities solve most bit problems: `x ^ x = 0`, `x ^ 0 = x`, `n & (n - 1)` clears the lowest set bit, `n & -n` isolates it.' },
        { type: 'list', title: 'Use it when', items: ['"Every element appears twice except one".', '"Count set bits", "power of two".', '"O(1) extra space" with a missing/duplicate number.', 'Enumerate all subsets of a small set.', 'Add without `+`, swap without temp.'] },
        {
          type: 'code',
          title: 'Core tricks',
          lang: 'java',
          code: `int singleNumber(int[] a) {
    int x = 0;
    for (int v : a) x ^= v;              // pairs cancel
    return x;
}

int countBits(int n) {
    int c = 0;
    while (n != 0) { n &= n - 1; c++; }  // drop lowest 1 each time
    return c;                            // or Integer.bitCount(n)
}

boolean isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }

int[] countBitsUpTo(int n) {             // dp on bits
    int[] res = new int[n + 1];
    for (int i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
    return res;
}

// All subsets of n items
// for (int mask = 0; mask < (1 << n); mask++) { ... (mask >> i) & 1 ... }`,
        },
        { type: 'table', head: ['Expression', 'Effect'], rows: [['x & 1', 'is odd'], ['x >> 1', 'divide by 2 (floor for positive)'], ['x >>> 1', 'unsigned shift (fills 0)'], ['(x >> i) & 1', 'read bit i'], ['x | (1 << i)', 'set bit i'], ['x ^ (1 << i)', 'flip bit i'], ['x & -x', 'lowest set bit']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Precedence: `==` binds tighter than `&`, so write `(n & 1) == 0`. Java has no unsigned int: use `>>>` for Reverse Bits / Number of 1 Bits. `1 << 32` equals 1 for ints. Negative numbers have a leading 1 bit.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Single Number → Number of 1 Bits → Counting Bits → Missing Number → Single Number II.' },
      ],
    },

    // ───────────────────────────── Math ─────────────────────────────
    {
      id: 'math-tricks',
      title: 'Math Tricks',
      summary: 'GCD, sieve, fast power, and modulo arithmetic without overflow.',
      tags: ['math', 'gcd', 'sieve', 'fast power', 'modulo', 'primes'],
      blocks: [
        { type: 'text', text: 'A short toolbox comes up again and again. Euclid\'s GCD, the Sieve of Eratosthenes for primes, fast exponentiation by squaring, and taking `% MOD` after every operation.' },
        { type: 'list', title: 'Use it when', items: ['"Return the answer modulo 10^9 + 7".', '"Count primes less than n".', '"x to the power n" with huge n.', 'Fractions, ratios, LCM, "greatest common divisor".', 'Digit manipulation (reverse integer, palindrome number).'] },
        {
          type: 'code',
          title: 'Toolbox',
          lang: 'java',
          code: `static final int MOD = 1_000_000_007;

long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
long lcm(long a, long b) { return a / gcd(a, b) * b; }     // divide first

long modPow(long base, long exp, long mod) {   // O(log exp)
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

int countPrimes(int n) {                       // sieve, O(n log log n)
    if (n < 3) return 0;
    boolean[] composite = new boolean[n];
    int count = 0;
    for (int i = 2; i < n; i++) {
        if (composite[i]) continue;
        count++;
        for (long j = (long) i * i; j < n; j += i) composite[(int) j] = true;
    }
    return count;
}`,
        },
        { type: 'table', head: ['Tool', 'Time', 'Note'], rows: [['GCD (Euclid)', 'O(log min(a, b))', 'lcm = a / gcd * b'], ['Sieve', 'O(n log log n)', 'start crossing at i*i'], ['Fast power', 'O(log n)', 'modular inverse: a^(MOD-2)'], ['(a - b) mod', 'O(1)', '((a - b) % M + M) % M']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: '`a * b` of two ints overflows before `% MOD`: cast to `long` first. Negative `%` in Java stays negative: add MOD. `i * i` overflows in the sieve for large i: use `long`. `Math.abs(Integer.MIN_VALUE)` is still negative.' },
        { type: 'callout', tone: 'drill', title: 'Drill (15 min)', text: 'Reverse Integer → Count Primes → Pow(x, n) → Super Pow.' },
      ],
    },

    // ───────────────────────────── Strings ─────────────────────────────
    {
      id: 'string-algorithms',
      title: 'String Algorithms',
      summary: 'Expand around center, KMP prefix function, rolling hash.',
      tags: ['string', 'kmp', 'rolling hash', 'rabin-karp', 'palindrome'],
      blocks: [
        { type: 'text', text: '**Expand around center** finds palindromes in O(n^2) with O(1) space. **KMP** finds a pattern in O(n + m) using a prefix table. **Rolling hash** compares substrings in O(1) after O(n) setup.' },
        { type: 'list', title: 'Use it when', items: ['"Longest palindromic substring", "count palindromic substrings".', '"Find pattern in text" with big inputs, "shortest palindrome".', '"Repeated substring", "longest duplicate substring" (hash + binary search).', 'Comparing many substrings for equality.'] },
        {
          type: 'code',
          title: 'Expand around center and KMP',
          lang: 'java',
          code: `String longestPalindrome(String s) {
    int start = 0, best = 0;
    for (int c = 0; c < s.length(); c++) {
        for (int odd = 0; odd < 2; odd++) {        // center at c, or between c and c+1
            int l = c, r = c + odd;
            while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
            if (r - l - 1 > best) { best = r - l - 1; start = l + 1; }
        }
    }
    return s.substring(start, start + best);
}

int kmpSearch(String text, String pat) {          // first index or -1
    int m = pat.length();
    int[] lps = new int[m];                       // longest proper prefix = suffix
    for (int i = 1, len = 0; i < m; ) {
        if (pat.charAt(i) == pat.charAt(len)) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    for (int i = 0, j = 0; i < text.length(); ) {
        if (text.charAt(i) == pat.charAt(j)) { i++; j++; if (j == m) return i - m; }
        else if (j > 0) j = lps[j - 1];
        else i++;
    }
    return -1;
}`,
        },
        { type: 'table', head: ['Method', 'Time', 'Space'], rows: [['Expand around center', 'O(n^2)', 'O(1)'], ['KMP', 'O(n + m)', 'O(m)'], ['Rolling hash (Rabin-Karp)', 'O(n + m) average', 'O(1) or O(n) prefix hashes'], ['Manacher', 'O(n)', 'O(n), rarely needed']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Forgetting even-length centers. `substring` is O(len) in Java, so calling it in a hot loop is slow. Rolling hash collisions: compare actual strings on match, or use two moduli. Keep hashes non-negative after subtraction (add MOD).' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Palindromic Substrings → Longest Palindromic Substring → Find the Index of the First Occurrence in a String (KMP) → Shortest Palindrome.' },
      ],
    },

    // ───────────────────────────── Trie ─────────────────────────────
    {
      id: 'trie',
      title: 'Trie Usage',
      summary: 'Prefix tree for fast word and prefix lookups.',
      tags: ['trie', 'prefix tree', 'strings', 'word search', 'autocomplete'],
      blocks: [
        { type: 'text', text: 'A trie stores words letter by letter along a path from the root. Shared prefixes share nodes. Insert and search cost O(word length), independent of how many words are stored.' },
        { type: 'list', title: 'Use it when', items: ['"Starts with prefix", autocomplete, search suggestions.', 'Many words searched on a grid at once (Word Search II).', 'Wildcard search like `b.d`.', '"Maximum XOR of two numbers" (binary trie over bits).'] },
        {
          type: 'code',
          title: 'Trie with array children',
          lang: 'java',
          code: `class Trie {
    private static class Node {
        Node[] next = new Node[26];
        boolean end;
    }
    private final Node root = new Node();

    void insert(String w) {
        Node cur = root;
        for (char ch : w.toCharArray()) {
            int i = ch - 'a';
            if (cur.next[i] == null) cur.next[i] = new Node();
            cur = cur.next[i];
        }
        cur.end = true;
    }
    boolean search(String w) { Node n = walk(w); return n != null && n.end; }
    boolean startsWith(String p) { return walk(p) != null; }

    private Node walk(String s) {
        Node cur = root;
        for (char ch : s.toCharArray()) {
            cur = cur.next[ch - 'a'];
            if (cur == null) return null;
        }
        return cur;
    }
}`,
        },
        { type: 'table', head: ['Operation', 'Time', 'Space'], rows: [['Insert / search / prefix', 'O(L)', 'O(total chars · 26) worst'], ['Wildcard search', 'O(26^dots · L) worst', 'DFS on `.`'], ['Word Search II', 'O(cells · 4^L) pruned', 'store word at end node']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: '`search` must check the `end` flag, not just that the path exists. Word Search II: remove found words (set word to null) to avoid duplicates and speed up. Use `HashMap<Character, Node>` if the alphabet is not lowercase a-z.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Implement Trie (Prefix Tree) → Design Add and Search Words Data Structure → Search Suggestions System → Word Search II.' },
      ],
    },

    // ───────────────────────────── Matrix ─────────────────────────────
    {
      id: 'matrix-tricks',
      title: 'Matrix Tricks',
      summary: 'Rotate, transpose, spiral walk, and in-place markers.',
      tags: ['matrix', 'grid', 'rotate', 'spiral', 'transpose', 'in-place'],
      blocks: [
        { type: 'text', text: 'Many matrix problems are index bookkeeping. **Rotate 90° clockwise** = transpose then reverse each row. **Spiral** = shrink four boundaries. **In-place markers** reuse the first row/column or spare bits to store flags.' },
        { type: 'list', title: 'Use it when', items: ['"Rotate the image in place".', '"Return elements in spiral order".', '"Set matrix zeroes with O(1) extra space".', '"Game of Life" (encode old and new state in one cell).', 'Search a sorted matrix (start at top-right).'] },
        {
          type: 'code',
          title: 'Rotate and spiral',
          lang: 'java',
          code: `void rotate(int[][] m) {                       // 90° clockwise, n x n
    int n = m.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {         // transpose
            int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;
        }
    for (int[] row : m)                           // reverse each row
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
}

List<Integer> spiralOrder(int[][] m) {
    List<Integer> res = new ArrayList<>();
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) res.add(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) res.add(m[r][right]);
        right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) res.add(m[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) res.add(m[r][left]); left++; }
    }
    return res;
}`,
        },
        { type: 'table', head: ['Trick', 'Recipe'], rows: [['Rotate clockwise', 'transpose + reverse rows'], ['Rotate counter-clockwise', 'transpose + reverse columns'], ['Set Matrix Zeroes O(1)', 'first row/col as flags + 2 booleans'], ['Game of Life in place', 'bit 1 = next state, shift at the end'], ['Search sorted matrix', 'start top-right, go left or down']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Transpose loop must start at `j = i + 1`, or you swap twice and undo it. Spiral: missing the `top <= bottom` / `left <= right` re-checks duplicates the middle row or column. Set Matrix Zeroes: process the first row/column last.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Transpose Matrix → Rotate Image → Spiral Matrix → Set Matrix Zeroes → Game of Life.' },
      ],
    },

    // ───────────────────────────── Design ─────────────────────────────
    {
      id: 'design-problems',
      title: 'Design-Style Problems',
      summary: 'Build a class whose methods hit a target complexity by combining structures.',
      tags: ['design', 'class', 'lru cache', 'data structure design'],
      blocks: [
        { type: 'text', text: 'You implement a class with a few methods. Start from each method\'s required complexity, then pick structures that give it. Usually it is two structures glued together (HashMap + list, HashMap + heap, stack + min-stack).' },
        {
          type: 'steps',
          title: 'Approach',
          items: [
            'List every method and its target time (often O(1) or O(log n)).',
            'For each method, ask which structure makes it fast.',
            'Combine them and decide what each one stores (index, node, count).',
            'Write the fields first, then each method. Keep both structures in sync.',
            'Walk through the example calls by hand.',
          ],
        },
        { type: 'list', title: 'Use it when', items: ['"Implement the class X with methods ..."', 'LRU / LFU cache, min stack, time-based key-value store.', 'Insert / delete / getRandom in O(1).', 'Hit counter, stock price tracker, browser history.'] },
        {
          type: 'code',
          title: 'LRU Cache with LinkedHashMap',
          lang: 'java',
          code: `class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;
    LRUCache(int capacity) {
        super(capacity, 0.75f, true);         // true = access order
        this.capacity = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}
// Interviewers may ask for the manual version:
// HashMap<key, Node> + doubly linked list with dummy head and tail.`,
        },
        { type: 'table', head: ['Problem', 'Structures', 'Key ops'], rows: [['LRU Cache', 'HashMap + doubly linked list', 'O(1) get/put'], ['Min Stack', 'Stack of {val, minSoFar}', 'O(1) getMin'], ['Insert Delete GetRandom O(1)', 'ArrayList + HashMap<val, index>', 'swap with last on delete'], ['Time Based Key-Value Store', 'HashMap<key, TreeMap<time, val>>', 'floorKey'], ['LFU Cache', 'HashMap + freq → LinkedHashSet', 'track minFreq']] },
        { type: 'callout', tone: 'warn', title: 'Classic bugs', text: 'Updating one structure and forgetting the other. RandomizedSet delete: update the moved element\'s index before removing the last slot. LRU: `get` must also mark as recently used. Method signatures must match exactly, including `public`.' },
        { type: 'callout', tone: 'drill', title: 'Drill (20 min)', text: 'Min Stack → Insert Delete GetRandom O(1) → Time Based Key-Value Store → LRU Cache (write the manual linked list version).' },
      ],
    },
  ],
};
