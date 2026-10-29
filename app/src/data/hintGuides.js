/*
 * Hint ladder for every topic in questions.json, revealed one rung at a time:
 *   nudge     a question that points at the key observation without naming the technique
 *   approach  the pattern + data structure, and why it fits
 *   steps     the algorithm as numbered pseudocode steps (no real code)
 *   edges     traps to test before you submit
 *   big       target time / space complexity
 * Keyed by question.topic. Problems that work differently from their topic use hintSpecific.js. Written for this app; problem-specific detail comes from the
 * question's own pattern and linker fields, which the ladder shows alongside.
 */
import { GENERIC_EDGES, SPECIFIC_HINTS } from './hintSpecific.js';

export const HINT_GUIDES = {
  // ---------------------------------------------------------------- Arrays
  'Two Pointers': {
    nudge: 'Is the input sorted (or can you sort it)? If you look at the smallest and largest element together, what does their sum tell you about which one to move?',
    approach: 'Two pointers: one at each end (or both from the start for in-place rewrites). Each comparison lets you discard one element for good, so one pass is enough instead of checking every pair.',
    steps: [
      'Sort the input if order does not matter for the answer.',
      'Set left = 0, right = n - 1.',
      'While left < right: compute the value for the pair (sum, area, …).',
      'If it matches the goal, record it (and skip duplicates if the answer must be unique).',
      'If it is too small, move left forward; if too big, move right back.',
      'For 3Sum / 4Sum: fix one element in an outer loop and run this on the rest.',
    ],
    edges: ['Fewer than 2 elements', 'All duplicates (skip equal neighbours after a match)', 'Negative numbers', 'Pointers crossing'],
    big: 'O(n) after an O(n log n) sort; O(1) extra space. 3Sum is O(n²).',
  },
  'Sliding Window': {
    nudge: 'You need the best contiguous subarray / substring. If you already know the answer for window [L..R], what changes when R moves one step right?',
    approach: 'Sliding window: grow R every step, and shrink L only while the window breaks the rule. Keep a running sum or a frequency map so each step is O(1).',
    steps: [
      'L = 0, state = empty (sum / counter map), best = initial value.',
      'For R from 0 to n - 1: add nums[R] to the state.',
      'While the window is invalid: remove nums[L] from the state, L += 1.',
      'The window [L..R] is now valid: update best with R - L + 1 (or the state).',
      'Fixed size k? Instead of the while loop, drop nums[R - k] once R >= k.',
    ],
    edges: ['k larger than n', 'Empty input', 'Every element valid / none valid', 'Negative numbers break "shrink when sum too big"'],
    big: 'O(n) time (each index enters and leaves once); O(k) or O(alphabet) space.',
  },
  "Kadane's / Greedy on Arrays": {
    nudge: 'At index i, is it better to extend what you had so far, or to start fresh from i? What single number do you need to remember to decide?',
    approach: "Kadane's / running state: carry the best value ending here plus the global best. A negative running total can only hurt the future, so drop it.",
    steps: [
      'cur = nums[0], best = nums[0].',
      'For each next x: cur = max(x, cur + x).',
      'best = max(best, cur).',
      'Products? Track both curMax and curMin (a negative flips them).',
      'Reach / jump problems: track farthest reachable index instead.',
    ],
    edges: ['All negative numbers', 'Single element', 'Zeros (reset for products)', 'Circular array: answer is max(normal, total - minSubarray)'],
    big: 'O(n) time, O(1) space.',
  },
  'Prefix Sum / Difference Array': {
    nudge: 'Do you keep re-adding the same ranges? If you knew the total of everything before i and before j, how would you get the sum between them instantly?',
    approach: 'Prefix sums: prefix[j] - prefix[i] is the sum of (i, j]. To count subarrays with sum k, store how many times each prefix has appeared in a HashMap.',
    steps: [
      'seen = {0: 1}, running = 0, count = 0.',
      'For each x: running += x.',
      'count += seen.get(running - k, 0)  (subarrays ending here with sum k).',
      'seen[running] += 1.',
      'Range updates? Use a difference array: diff[l] += v, diff[r + 1] -= v, then prefix-sum it.',
    ],
    edges: ['Seed the map with prefix 0 (subarray starting at index 0)', 'Negative numbers (sliding window fails, prefix works)', 'Overflow on large sums', 'k = 0'],
    big: 'O(n) time, O(n) space for the map.',
  },
  'Sorting & Searching in Arrays': {
    nudge: 'Would the problem become easy if the items were in order (by value, by start time)? What can you compare between neighbours once sorted?',
    approach: 'Sort first, then one linear pass comparing each item with the last one you kept (merge intervals) or binary search inside the sorted data.',
    steps: [
      'Sort by the key that matters (interval start, value, …).',
      'Walk the sorted list keeping a "current" result.',
      'If the next item overlaps / continues the current one, merge it in.',
      'Otherwise push the current result and start a new one.',
      'Need lookups? Binary search the sorted array instead of scanning.',
    ],
    edges: ['Touching intervals ([1,2] and [2,3])', 'One interval inside another', 'Empty list', 'Already sorted / reverse sorted'],
    big: 'O(n log n) for the sort, then O(n); O(n) for the output.',
  },

  // ---------------------------------------------------------------- Strings
  'String Manipulation & Hashing': {
    nudge: 'Does the order of characters matter, or only how many of each there are? What would a "fingerprint" of a string look like?',
    approach: 'Count characters with a 26-slot array or a HashMap. Equal counts = same multiset (anagrams). Use the count tuple or the sorted string as a map key to group.',
    steps: [
      'Build a frequency array / map for the string(s).',
      'Compare or combine the counts (equal? difference? missing?).',
      'For grouping: key = tuple(counts) or sorted(word); map key -> list.',
      'Build output with a list / string builder, not repeated string concatenation.',
    ],
    edges: ['Empty string', 'Uppercase / unicode vs 26 lowercase letters', 'Different lengths (early exit)', 'Spaces and punctuation'],
    big: 'O(n) time (O(n·k log k) if you sort each word); O(1) or O(n) space.',
  },
  'Sliding Window on Strings': {
    nudge: 'You want the shortest / longest substring that contains (or avoids) something. When is the window "good enough" to start shrinking from the left?',
    approach: 'Variable window with a need-map and a matched counter: expand R until every needed char is covered, then shrink L as far as possible while still covered.',
    steps: [
      'need = counts of the target; missing = number of distinct chars still needed.',
      'For R in s: decrease need[s[R]]; if it hits 0, missing -= 1.',
      'While missing == 0: record the window, then give back s[L] (if need[s[L]] becomes > 0, missing += 1), L += 1.',
      'Longest-without-repeats variant: on a repeat, jump L past the last index of that char.',
    ],
    edges: ['Target longer than s', 'Repeated chars in the target', 'Case sensitivity', 'No valid window -> return ""'],
    big: 'O(n + m) time, O(alphabet) space.',
  },
  'Stack-based String Problems': {
    nudge: 'Does something you read now get "closed" or "cancelled" by something later? What is the most recent unfinished thing at any moment?',
    approach: 'Stack: push openers / partial results, pop when the matching closer arrives. Nested structure (brackets, decode k[...]) always means LIFO.',
    steps: [
      'Create an empty stack.',
      'Scan characters left to right.',
      'Opener / number / partial string: push it (with any state you need to restore).',
      'Closer: pop, check it matches, combine with the top (e.g. repeat the inner string k times).',
      'At the end the stack should be empty (or holds the answer pieces).',
    ],
    edges: ['Closer with an empty stack', 'Leftover openers at the end', 'Multi-digit numbers', 'Nested inside nested'],
    big: 'O(n) time, O(n) space.',
  },
  'Pattern Matching': {
    nudge: 'When a match fails half-way, do you really need to restart from the next character? What did the part you already matched tell you?',
    approach: 'KMP (LPS array) or a rolling hash to avoid re-scanning; for word-break style problems, DP over prefixes with a word set.',
    steps: [
      'KMP: build lps[i] = longest proper prefix of pattern[0..i] that is also a suffix.',
      'Scan the text; on mismatch fall back j = lps[j - 1] instead of restarting.',
      'Rabin-Karp: hash the window, slide it with one subtract + one add, verify on hash hits.',
      'Word break: dp[i] = true if some dp[j] is true and s[j:i] is a word.',
    ],
    edges: ['Empty pattern', 'Pattern longer than text', 'Hash collisions (always verify)', 'Overlapping matches'],
    big: 'O(n + m) for KMP / rolling hash; O(n²) for word-break DP.',
  },

  // ---------------------------------------------------------------- Linked lists
  'Reversal & Merging': {
    nudge: 'If you change one node\'s next pointer, which node do you lose access to? What do you need to hold before you cut it?',
    approach: 'Pointer surgery with a dummy head: keep prev / curr / next so you never lose the rest of the list. Merging = always attach the smaller head.',
    steps: [
      'dummy = Node(0, head); work from dummy so the head is never a special case.',
      'Reverse: next = curr.next; curr.next = prev; prev = curr; curr = next.',
      'Merge two lists: tail.next = smaller head; advance that list; attach the remainder at the end.',
      'Merge k lists: put each head in a min-heap; pop smallest, push its next.',
      'Return dummy.next.',
    ],
    edges: ['Empty list / single node', 'Reversing the whole list vs a sub-range', 'Lists of different lengths', 'Losing the tail pointer'],
    big: 'O(n) time, O(1) space (O(n log k) with a heap for k lists).',
  },
  'Fast & Slow Pointers': {
    nudge: 'If one runner moves twice as fast as another, where is the slow one when the fast one finishes? What happens if the track is a loop?',
    approach: "Floyd's tortoise and hare: slow moves 1, fast moves 2. They meet only if there is a cycle; when fast reaches the end, slow is at the middle.",
    steps: [
      'slow = fast = head.',
      'While fast and fast.next: slow = slow.next; fast = fast.next.next.',
      'If slow == fast: there is a cycle.',
      'Cycle start: reset one pointer to head, move both 1 step until they meet.',
      'Middle: when the loop ends, slow is the middle node.',
    ],
    edges: ['Empty list', 'One node pointing to itself', 'Even length (which middle?)', 'Null checks on fast.next'],
    big: 'O(n) time, O(1) space.',
  },
  'Advanced Linked List': {
    nudge: 'You need O(1) lookup AND O(1) reordering. Which structure gives each, and how do you link them together?',
    approach: 'HashMap key -> node, plus a doubly linked list for order (LRU). LFU adds a map freq -> list of nodes. Sentinel head/tail nodes remove edge cases.',
    steps: [
      'Create head and tail sentinels linked to each other.',
      'get(key): look up the node, move it to the front, return its value.',
      'put(key, val): update + move to front, or insert a new node at the front.',
      'Over capacity: remove the node before tail and delete its key from the map.',
      'Write small helpers: remove(node) and addFront(node).',
    ],
    edges: ['Capacity 1', 'Updating an existing key (no eviction)', 'Ties in frequency (LFU uses recency)', 'Forgetting to delete from the map'],
    big: 'O(1) per operation; O(capacity) space.',
  },

  // ---------------------------------------------------------------- Stacks & queues
  'Monotonic Stack': {
    nudge: 'For each element you need the next greater (or smaller) one. Once a bigger element arrives, will the smaller ones before it ever be the answer for anyone else?',
    approach: 'Monotonic stack of indices: pop everything the new element "beats" — the new element is their answer. Each index is pushed and popped once.',
    steps: [
      'stack = [] (holds indices), answer = default values.',
      'For i, x in enumerate(nums):',
      '  while stack and nums[stack[-1]] < x: answer[stack.pop()] = x (or i - index).',
      '  push i.',
      'Histogram area: when popping height h, width = i - (new top) - 1.',
      'Circular array: loop over 2n indices with i % n.',
    ],
    edges: ['Equal values (< vs <=)', 'Strictly increasing / decreasing input', 'Leftover indices have no answer', 'Sentinel 0 at the end for histograms'],
    big: 'O(n) time, O(n) space.',
  },
  'Queue / Deque Patterns': {
    nudge: 'You need the max / min of a moving window. If a newer element is bigger than an older one, will the older one ever be the maximum again?',
    approach: 'Monotonic deque of indices: pop from the back while the new value is bigger, pop from the front when the index leaves the window. Front = current max.',
    steps: [
      'dq = deque() of indices.',
      'For i, x: while dq and nums[dq[-1]] <= x: pop back.',
      'Append i.',
      'If dq[0] <= i - k: pop front (left the window).',
      'Once i >= k - 1: record nums[dq[0]].',
      'Plain BFS / task queues: process in arrival order with a regular queue.',
    ],
    edges: ['k = 1', 'k = n', 'Duplicates in the window', 'Negative numbers'],
    big: 'O(n) time, O(k) space.',
  },

  // ---------------------------------------------------------------- Hashing, math & bits
  'HashMap / HashSet Patterns': {
    nudge: 'Are you searching the array again for every element? What could you remember about what you have already seen to answer in O(1)?',
    approach: 'HashMap / HashSet: store what you have seen (value -> index or count) and look up the complement or the neighbour directly.',
    steps: [
      'seen = {} (or set()).',
      'For each element: compute what you need to have seen (target - x, x - 1, …).',
      'If it is in seen: you found an answer.',
      'Store the current element.',
      'Longest run: only start counting from x when x - 1 is not in the set.',
    ],
    edges: ['Using the same element twice', 'Duplicates', 'Negative numbers / zero', 'Answer not found'],
    big: 'O(n) time, O(n) space.',
  },
  'Math & Number Theory': {
    nudge: 'Is there a formula or property (digits, divisibility, primes, modulo) that skips the brute force? Try a few small numbers by hand and look for the pattern.',
    approach: 'Use number properties: digit extraction with % 10 and // 10, gcd, sieve for primes, fast power by squaring, modulo arithmetic to avoid overflow.',
    steps: [
      'Work 3–4 small examples by hand and write down the pattern.',
      'Digits: while n: d = n % 10; n //= 10.',
      'Primes up to n: sieve — mark multiples of each prime starting at p * p.',
      'Power: square the base and halve the exponent each step.',
      'Apply % MOD after every multiply if the answer must be modded.',
    ],
    edges: ['0 and 1', 'Negative numbers', 'Integer overflow', 'Very large n (needs O(log n) or O(sqrt n))'],
    big: 'Often O(log n) or O(sqrt n); sieve is O(n log log n).',
  },
  'Bit Manipulation': {
    nudge: 'What happens when you XOR a number with itself? What does n & (n - 1) remove? Think about each bit position on its own.',
    approach: 'Bit tricks: XOR cancels pairs, n & (n - 1) drops the lowest set bit, shifting and masking reads bit i. For max XOR, a binary trie picks the opposite bit greedily.',
    steps: [
      'Single number: XOR everything together.',
      'Count bits: while n: n &= n - 1; count += 1.',
      'Bit i is set: (n >> i) & 1.',
      'Missing number: XOR all indices and all values.',
      'Max XOR pair: insert numbers in a bit trie from the top bit; for each number walk the opposite bit when possible.',
    ],
    edges: ['Negative numbers (two\'s complement, 32-bit masks)', 'Zero', 'Python ints are unbounded: mask with 0xFFFFFFFF', 'Operator precedence (wrap in brackets)'],
    big: 'O(n) or O(n · bits); O(1) extra space (trie is O(n · bits)).',
  },

  // ---------------------------------------------------------------- Binary search
  'Classic Binary Search': {
    nudge: 'Can you throw away half of the remaining range after one comparison? Which half is guaranteed not to contain the answer?',
    approach: 'Binary search on a sorted (or rotated / mountain) array: compare mid with the target or with a neighbour, keep the half that can still hold the answer.',
    steps: [
      'lo = 0, hi = n - 1.',
      'While lo <= hi: mid = lo + (hi - lo) // 2.',
      'Found it? return mid.',
      'Rotated array: check which half [lo..mid] or [mid..hi] is sorted, and whether the target lies inside it.',
      'Otherwise move lo = mid + 1 or hi = mid - 1.',
      'Not found: return -1 (or lo as the insert position).',
    ],
    edges: ['Empty array / one element', 'Target smaller or larger than everything', 'Duplicates', 'Infinite loop from lo = mid'],
    big: 'O(log n) time, O(1) space.',
  },
  'Binary Search on Answer': {
    nudge: 'Instead of finding the answer directly, can you check "is X good enough?" quickly? If X works, does every bigger X also work?',
    approach: 'Binary search on the answer range: the check is monotonic (false … false, true … true), so search for the first value where a greedy check passes.',
    steps: [
      'lo = smallest possible answer, hi = largest possible answer.',
      'Write can(x): a greedy O(n) pass that says whether x is feasible.',
      'While lo < hi: mid = (lo + hi) // 2.',
      'If can(mid): hi = mid (try smaller); else lo = mid + 1.',
      'Return lo.',
    ],
    edges: ['lo / hi bounds wrong by one', 'Maximising instead of minimising (flip the logic)', 'Overflow in the check', 'Answer equals a bound'],
    big: 'O(n log(range)) time, O(1) space.',
  },
  'Bisect Tricks': {
    nudge: 'You want the longest increasing sequence. If two sequences have the same length, which ending value is more useful to keep?',
    approach: 'Patience sorting: tails[k] = smallest possible ending of an increasing subsequence of length k+1. Binary search where each new number goes.',
    steps: [
      'tails = [].',
      'For x in nums: i = bisect_left(tails, x).',
      'If i == len(tails): append x; else tails[i] = x.',
      'Answer = len(tails).',
      '2-D version (envelopes): sort width ascending, height descending, then run this on heights.',
    ],
    edges: ['Equal values (bisect_left vs bisect_right)', 'Strictly vs non-strictly increasing', 'tails is not the actual subsequence'],
    big: 'O(n log n) time, O(n) space.',
  },

  // ---------------------------------------------------------------- Trees
  'Tree Traversals': {
    nudge: 'Does the answer depend on depth / level, or on the path from the root? Which order (level by level, or deep first) visits nodes the way you need?',
    approach: 'BFS with a queue for anything per level (snapshot level_size first); DFS (recursive or explicit stack) for pre / in / post order.',
    steps: [
      'Level order: queue = [root].',
      'While queue: size = len(queue); process exactly size nodes.',
      'For each: record it, push its children.',
      'After the level: append the level result (right-side view = last node, zigzag = reverse every other level).',
      'Iterative inorder: push left children, pop, visit, go right.',
    ],
    edges: ['Empty tree', 'Single node', 'Skewed tree (recursion depth)', 'Null children'],
    big: 'O(n) time; O(width) space for BFS, O(height) for DFS.',
  },
  'Binary Tree Properties': {
    nudge: 'If both subtrees already gave you their answer, could you build the answer for this node from those two results?',
    approach: 'Post-order DFS: solve left, solve right, combine. Return one thing to the parent (e.g. a height) and update a global for the real answer (e.g. a diameter).',
    steps: [
      'def dfs(node): if not node: return base value (0, None, …).',
      'left = dfs(node.left); right = dfs(node.right).',
      'Update the global answer using left, node and right together.',
      'Return what the parent needs: a single branch (1 + max(left, right)).',
      'Call dfs(root); return the global answer.',
    ],
    edges: ['Empty tree', 'Negative node values (path sum)', 'Answer not passing through the root', 'Returning the global vs the branch value'],
    big: 'O(n) time, O(h) recursion space.',
  },
  'Binary Search Trees (BST)': {
    nudge: 'What does a BST guarantee about every node on the left versus the right? What order do you get if you read it in-order?',
    approach: 'Use the BST property: in-order traversal gives sorted values; or pass (min, max) bounds down; or walk left/right like a binary search.',
    steps: [
      'Validate: dfs(node, lo, hi) — node.val must be strictly between lo and hi.',
      'Kth smallest: in-order traversal, count down k.',
      'Search / insert / LCA: go left if the value is smaller, right if larger.',
      'Delete: replace with the in-order successor (leftmost of the right subtree).',
    ],
    edges: ['Duplicate values', 'Int min / max as node values (use None bounds)', 'Only checking the direct children', 'Empty tree'],
    big: 'O(h) for search / insert; O(n) for full traversals.',
  },
  Tries: {
    nudge: 'Many words share the same starting letters. How could you store them so that checking a prefix costs the length of the prefix, not the number of words?',
    approach: 'Trie: each node has children by character and an is_word flag. Walk it character by character; for word-search grids, DFS the grid while walking the trie.',
    steps: [
      'class Node: children = {}, is_word = False.',
      'insert(word): walk / create a node per char, set is_word at the end.',
      'search(word): walk; fail if a char is missing; check is_word.',
      'startsWith(prefix): walk; true if every char exists.',
      'Grid search: DFS from each cell, follow trie children, prune when no child matches.',
    ],
    edges: ['Empty string', 'Word that is a prefix of another', 'Removing found words to avoid duplicates', 'Wildcard "." needs DFS over all children'],
    big: 'O(L) per operation (L = word length); O(total chars) space.',
  },
  'Segment Trees & BITs (Advanced)': {
    nudge: 'You get many range-sum (or range-min) queries mixed with point updates. Recomputing the range each time is O(n) — what if each node stored the answer for a block?',
    approach: 'Fenwick tree (BIT) for prefix sums with updates, or a segment tree for any associative range query. Coordinate-compress large values first.',
    steps: [
      'Compress values to ranks 1..m if they are large or negative.',
      'BIT update(i, delta): while i <= m: tree[i] += delta; i += i & -i.',
      'BIT query(i): sum while i > 0: total += tree[i]; i -= i & -i.',
      'Range sum = query(r) - query(l - 1).',
      'Counting smaller elements after self: scan right to left, query(rank - 1), then update(rank, 1).',
    ],
    edges: ['1-indexed vs 0-indexed', 'Duplicates during compression', 'Off-by-one in ranges', 'Large values without compression'],
    big: 'O(log n) per update / query; O(n) space.',
  },

  // ---------------------------------------------------------------- Heaps
  'Top-K Pattern': {
    nudge: 'You only need the best K, not a full sort. If you keep a small bucket of size K, which element is the first to leave when something better arrives?',
    approach: 'Min-heap of size K: push each item, pop when the heap grows past K. The heap holds the K largest. Count frequencies first if needed.',
    steps: [
      'Count frequencies with a HashMap if the ranking is by count.',
      'heap = [].',
      'For each item: push (key, item).',
      'If len(heap) > k: pop the smallest.',
      'The heap now holds the top K (sort it if order matters).',
      'Alternative O(n): bucket sort by frequency.',
    ],
    edges: ['k equals the number of distinct items', 'Ties', 'k = 0', 'Max-heap in Python = push negatives'],
    big: 'O(n log k) time, O(n + k) space.',
  },
  'Two-Heap Pattern': {
    nudge: 'You need the median as numbers stream in. What if you kept the smaller half and the larger half separately, each giving you its edge value instantly?',
    approach: 'Two heaps: a max-heap for the lower half and a min-heap for the upper half, sizes within 1. The median is at the top(s).',
    steps: [
      'low = max-heap (store negatives), high = min-heap.',
      'Add x: push to low, then move low\'s top to high.',
      'If high is bigger than low: move high\'s top back to low.',
      'Median: top of low if odd count, else the average of both tops.',
      'Sliding-window median: add lazy deletion for elements leaving the window.',
    ],
    edges: ['Even vs odd count', 'Negating values for the max-heap', 'Integer vs float average', 'Duplicates'],
    big: 'O(log n) per insert, O(1) median; O(n) space.',
  },

  // ---------------------------------------------------------------- Graphs
  'BFS (Shortest Path / Level-order)': {
    nudge: 'Every move costs the same (one step). If you explore everything 1 step away, then 2 steps away, when do you first reach the target?',
    approach: 'BFS with a queue and a visited set gives the shortest path in an unweighted graph or grid. Several starting points? Push them all at step 0 (multi-source).',
    steps: [
      'queue = all start cells; mark them visited; steps = 0.',
      'While queue: process exactly len(queue) nodes (one level).',
      'For each neighbour inside bounds and not visited: mark visited, push.',
      'If you reach the target, return steps.',
      'After the level: steps += 1.',
    ],
    edges: ['Start equals target', 'Target unreachable (return -1)', 'Mark visited when pushing, not when popping', 'Grid bounds and walls'],
    big: 'O(V + E) — O(rows · cols) for grids; O(V) space.',
  },
  'DFS / Backtracking on Graphs': {
    nudge: 'You need to explore everything connected to a starting point, or detect a loop. How do you avoid walking in circles?',
    approach: 'DFS with a visited set (or 3 colours: unvisited / visiting / done for cycle detection) over an adjacency list or grid.',
    steps: [
      'Build the adjacency list (or treat grid neighbours as edges).',
      'def dfs(node): mark visiting / visited.',
      'For each neighbour: if visiting -> cycle; if unvisited -> dfs(neighbour).',
      'Mark done after all neighbours.',
      'Count components / islands: run dfs from every unvisited node, count += 1.',
    ],
    edges: ['Disconnected graph', 'Self-loops', 'Recursion depth on large grids', 'Directed vs undirected cycle rules'],
    big: 'O(V + E) time, O(V) space.',
  },
  'Topological Sort': {
    nudge: 'Some tasks must happen before others. Which tasks can you start right now, and what changes once you finish one?',
    approach: "Kahn's algorithm: count in-degrees, start with every node at 0, remove it and decrement its neighbours. If not every node gets processed, there is a cycle.",
    steps: [
      'Build adjacency list and indegree array.',
      'queue = all nodes with indegree 0.',
      'While queue: pop u, append to order.',
      'For each v in adj[u]: indegree[v] -= 1; if 0, push v.',
      'If len(order) < n: cycle -> impossible. Else return order.',
    ],
    edges: ['Edge direction (prereq -> course)', 'Isolated nodes', 'Cycles', 'Multiple valid orders'],
    big: 'O(V + E) time and space.',
  },
  'Union-Find (Disjoint Set Union)': {
    nudge: 'Edges keep arriving and you keep asking "are these two already connected?". How could each group have one representative you can find fast?',
    approach: 'Union-Find with path compression and union by rank: find(x) returns the root, union(a, b) links roots. A union that finds the same root means a cycle.',
    steps: [
      'parent[i] = i, rank[i] = 0.',
      'find(x): if parent[x] != x: parent[x] = find(parent[x]); return parent[x].',
      'union(a, b): ra, rb = find(a), find(b); if equal return False (already connected).',
      'Attach the smaller rank under the larger; return True.',
      'Components = number of successful unions subtracted from n.',
    ],
    edges: ['Redundant edge = union returns False', 'Mapping strings / coordinates to ids', '1-indexed nodes', 'Forgetting path compression'],
    big: 'Almost O(1) per operation (inverse Ackermann); O(n) space.',
  },
  'Shortest Path Algorithms': {
    nudge: 'Edges have different costs, so fewest steps is no longer cheapest. Which unfinished node should you settle next?',
    approach: "Dijkstra: a min-heap of (distance, node); always expand the cheapest. With a limit on stops (k), use Bellman-Ford rounds or BFS on (node, stops).",
    steps: [
      'dist = {start: 0}; heap = [(0, start)].',
      'Pop (d, u); skip if d > dist[u] (stale entry).',
      'For each (v, w): if d + w < dist.get(v, inf): update and push.',
      'The answer is dist[target] (or the max over all nodes for network delay).',
      'K stops: run k + 1 rounds relaxing every edge from a copy of the previous round.',
    ],
    edges: ['Unreachable nodes', 'Negative weights (Dijkstra fails)', 'Stale heap entries', 'Copy the array each Bellman-Ford round'],
    big: 'O((V + E) log V) for Dijkstra; O(k · E) for Bellman-Ford with k rounds.',
  },
  'Minimum Spanning Tree': {
    nudge: 'You must connect everything as cheaply as possible. If you always take the cheapest edge that does not create a loop, can you ever regret it?',
    approach: "Kruskal's: sort edges by cost and add each one with Union-Find unless it joins nodes that are already connected. Prim's grows from one node with a min-heap.",
    steps: [
      'List all edges (cost, u, v) — for points, cost = Manhattan distance.',
      'Sort by cost.',
      'For each edge: if union(u, v) succeeds, add the cost; count edges.',
      'Stop at n - 1 edges.',
      "Prim's: heap = [(0, start)]; pop the cheapest unvisited node, push its edges.",
    ],
    edges: ['Graph not connected', 'n = 1 (cost 0)', 'Dense point sets (Prim\'s is faster than listing all edges)', 'Duplicate edges'],
    big: "O(E log E) for Kruskal's; O(V²) or O(E log V) for Prim's.",
  },

  // ---------------------------------------------------------------- Dynamic programming
  '1-D DP (Linear Recurrences)': {
    nudge: 'If you already knew the answer for the first i - 1 (or i - 2) positions, how would you get the answer for i? What choice do you make at i?',
    approach: '1-D DP: dp[i] is built from a few earlier entries (take / skip, or try each coin). Usually only the last two values are needed.',
    steps: [
      'Define dp[i] in one sentence (e.g. "best money from houses 0..i").',
      'Write the choice at i: dp[i] = max(dp[i-1], dp[i-2] + nums[i]).',
      'Set base cases (dp[0], dp[1]).',
      'Fill i from left to right.',
      'Space: keep only prev2, prev1.',
    ],
    edges: ['n = 0 or 1', 'Base cases that do not fit the formula', 'Impossible states (use inf / -1)', 'Circular input: solve twice, excluding first or last'],
    big: 'O(n) time (O(n · k) with k choices); O(1)–O(n) space.',
  },
  '2-D DP (Grid / Two Sequences)': {
    nudge: 'Compare the two strings (or the grid) one prefix at a time. If the last characters match, what smaller problem is left? If not, which options do you have?',
    approach: '2-D DP: dp[i][j] = answer for prefixes s1[:i] and s2[:j] (or grid cell r, c), built from the cell above, left and diagonal.',
    steps: [
      'Define dp[i][j] in one sentence.',
      'Row 0 and column 0 = empty-prefix base cases.',
      'If s1[i-1] == s2[j-1]: use dp[i-1][j-1].',
      'Else: combine dp[i-1][j], dp[i][j-1], dp[i-1][j-1] (insert / delete / replace, or skip one).',
      'Answer at dp[m][n]. Space: keep just the previous row.',
    ],
    edges: ['Empty strings', 'Off-by-one between dp index and string index', 'Grid obstacles', 'Initialising the first row / column'],
    big: 'O(m · n) time; O(n) space with a rolling row.',
  },
  'Knapsack Variants': {
    nudge: 'Each item is "take it or leave it" (or "take it any number of times"). What capacity is left after you take it, and what was the best for that capacity?',
    approach: 'Knapsack DP over capacity: dp[c] = best (or ways / possible) for capacity c. 0/1 items: loop capacity backwards. Unlimited items: loop forwards.',
    steps: [
      'dp = [base] * (target + 1); dp[0] = start value.',
      'For each item:',
      '  0/1: for c from target down to item: dp[c] = combine(dp[c], dp[c - item]).',
      '  Unbounded: for c from item up to target: same update.',
      'Answer: dp[target].',
      'Subset-sum "partition": target = total / 2 (odd total -> impossible).',
    ],
    edges: ['Loop direction decides 0/1 vs unbounded', 'Target 0', 'Counting combinations vs permutations (loop order)', 'Negative numbers'],
    big: 'O(n · target) time, O(target) space.',
  },
  'State-Machine DP (Stocks & Transactions)': {
    nudge: 'On any day you are in one state: holding, not holding, or cooling down. Which states can you move between, and what does each move cost or earn?',
    approach: 'State-machine DP: keep the best profit for each state per day and update them together from yesterday\'s values.',
    steps: [
      'hold = -inf, cash = 0 (add cooldown / k-transaction states as needed).',
      'For each price p: newHold = max(hold, cash - p).',
      'newCash = max(cash, hold + p - fee).',
      'Cooldown: buy from "rested" state instead of cash.',
      'Assign together; answer = cash at the end.',
    ],
    edges: ['Prices only falling (answer 0)', 'Updating states with today\'s values by accident', 'k larger than n / 2 (unlimited)', 'One day of prices'],
    big: 'O(n · states) time, O(states) space.',
  },
  'Interval / Range DP': {
    nudge: 'The answer for a range [l..r] depends on how you split it. If you pick the last (or first) action inside the range, what two smaller ranges remain?',
    approach: 'Interval DP: dp[l][r] over increasing lengths; try every split k in between and combine dp[l][k] and dp[k][r].',
    steps: [
      'Define dp[l][r] for the sub-range.',
      'Base: length 1 (or 0) ranges.',
      'For length from 2 to n: for l: r = l + length - 1.',
      '  dp[l][r] = best over k in (l..r) of dp[l][k] + dp[k][r] + cost(l, k, r).',
      'Answer: dp[0][n-1]. Pad the ends (e.g. balloons with 1s) if it simplifies the cost.',
    ],
    edges: ['Choosing the LAST action, not the first, often makes it work', 'Inclusive vs exclusive bounds', 'Length-1 ranges', 'O(n³) limits n to ~500'],
    big: 'O(n³) time, O(n²) space.',
  },
  'DP on Trees & Graphs': {
    nudge: 'Do you keep recomputing the same (node, state) pair? What is the smallest description of "where I am" that decides the rest?',
    approach: 'DFS + memoisation: cache results by state (cell, node, or extra parameters). On trees, return a small tuple from each child (e.g. robbed / not robbed).',
    steps: [
      'Define the state tuple that fully describes a subproblem.',
      'def solve(state): if cached, return it.',
      'Base case (out of bounds, leaf, end).',
      'Try every move from this state, combine the sub-answers.',
      'Cache and return. For trees: return (with, without) from each child.',
    ],
    edges: ['Cycles in the state graph (memoisation needs a DAG)', 'Recursion depth', 'Forgetting a parameter in the cache key', 'Out-of-bounds cells'],
    big: 'O(number of states × moves per state).',
  },
  'Bitmask DP': {
    nudge: 'n is tiny (about 20 or less). Could "which items are already used" be stored as a single number?',
    approach: 'Bitmask DP: dp[mask] (or dp[mask][last]) where bit i of mask means item i is used. Try adding each unused item.',
    steps: [
      'Check n is small (2^n states must fit).',
      'dp[0] = base; others = inf / -inf.',
      'For mask in range(1 << n): skip unreachable masks.',
      '  For each i not in mask: newMask = mask | (1 << i); update dp[newMask].',
      'Answer: dp[(1 << n) - 1] (all used).',
    ],
    edges: ['Bit operator precedence', 'n too big for 2^n', 'Needing the last item in the state', 'Starting state'],
    big: 'O(2^n · n) (or · n²) time, O(2^n · n) space.',
  },

  // ---------------------------------------------------------------- Greedy
  'Interval & Scheduling Greedy': {
    nudge: 'To fit the most non-overlapping meetings, which meeting should you commit to first — the one that starts earliest, or the one that ends earliest?',
    approach: 'Sort intervals by end time and keep each one that starts after the last kept end. Minimum rooms: sort by start and use a min-heap of end times.',
    steps: [
      'Sort by end (max non-overlapping / min arrows) or by start (rooms).',
      'end = -inf, kept = 0.',
      'For each interval: if start >= end: keep it, end = its end.',
      'Rooms: for each meeting, pop the heap while the earliest end <= start, push this end; answer = max heap size.',
    ],
    edges: ['Touching intervals ([1,2],[2,3]) — overlap or not?', 'Identical intervals', 'Empty list', 'Removing = total - kept'],
    big: 'O(n log n) time; O(n) for the heap.',
  },
  'String & Array Greedy': {
    nudge: 'Is there a choice that is always safe to make right now (take the largest, pair biggest with smallest, cover the farthest)? Can you argue it never hurts later?',
    approach: 'Greedy with sorting, two pointers or a heap: make the locally best move and prove it by exchange ("swapping in my choice never makes it worse").',
    steps: [
      'Find the rule: what is the safe choice at each step?',
      'Sort, or count with a map, to make that choice easy to read.',
      'Apply it in one pass (two pointers for pairing, heap for "always take the best").',
      'Check it against a counter-example before coding.',
    ],
    edges: ['Ties in the greedy choice', 'Counter-examples where greedy fails (then it is DP)', 'Empty input', 'Large counts / overflow'],
    big: 'Usually O(n log n) for sorting, O(n) otherwise.',
  },

  // ---------------------------------------------------------------- Backtracking
  'Subsets & Combinations': {
    nudge: 'For each element you either take it or skip it. How do you make sure you never build the same combination twice in a different order?',
    approach: 'Backtracking with a start index: choose an element, recurse from i + 1 (or i if reuse is allowed), then undo the choice.',
    steps: [
      'def backtrack(start, path): record a copy of path if it is valid.',
      'For i from start to n - 1:',
      '  Skip duplicates: if i > start and nums[i] == nums[i-1]: continue (after sorting).',
      '  path.append(nums[i]); backtrack(i + 1, path); path.pop().',
      'Prune when the running sum exceeds the target.',
    ],
    edges: ['Duplicates in input', 'Saving path instead of a copy', 'Reuse allowed (recurse with i)', 'Empty set counts as a subset'],
    big: 'O(2^n · n) time, O(n) recursion depth.',
  },
  Permutations: {
    nudge: 'Every position can hold any unused element. How do you remember which elements are already placed in the current arrangement?',
    approach: 'Backtracking with a used[] array: place any unused element, recurse, then unmark it. With duplicates, sort and skip an equal element whose twin is unused.',
    steps: [
      'Sort nums if duplicates exist; used = [False] * n.',
      'def backtrack(path): if len(path) == n: save a copy.',
      'For i in range(n): skip if used[i].',
      '  Skip duplicates: if i > 0 and nums[i] == nums[i-1] and not used[i-1]: continue.',
      '  Mark, append, recurse, pop, unmark.',
    ],
    edges: ['Duplicates', 'Saving a copy of path', 'n = 1', 'Next-permutation variant is a pointer trick, not backtracking'],
    big: 'O(n! · n) time, O(n) space.',
  },
  'Advanced Backtracking': {
    nudge: 'The search space is huge. What is the earliest moment you can tell a partial answer is already doomed?',
    approach: 'Backtracking with aggressive pruning: keep sets / counters of what is already used (columns, diagonals, box digits) so each check is O(1), and abandon a branch the moment it breaks a rule.',
    steps: [
      'Pick the next decision (next row, next empty cell, next segment).',
      'For each candidate: check constraints with O(1) sets.',
      'If valid: apply it to the state, recurse, undo it.',
      'If the recursion returns success, stop early (when one answer is enough).',
      'Order candidates so failures show up early (most constrained first).',
    ],
    edges: ['Forgetting to undo state', 'Leading zeros (IP addresses, numbers)', 'Stopping after the first solution vs collecting all', 'Diagonal keys: r - c and r + c'],
    big: 'Exponential in the worst case; pruning is what makes it pass.',
  },

  // ---------------------------------------------------------------- Design
  'Classic Design Problems': {
    nudge: 'List each operation and the speed it needs. Which single structure gives each one, and how do you keep them in sync?',
    approach: 'Combine structures: HashMap for O(1) lookup + doubly linked list for order (LRU), a heap for top-K feeds, a trie for prefixes, two stacks for a queue.',
    steps: [
      'Write each method with its required complexity.',
      'Pick a structure per requirement.',
      'Decide what each structure stores (often the key or a node reference).',
      'Implement small private helpers first (add, remove, touch).',
      'Walk through the example calls by hand.',
    ],
    edges: ['Capacity 0 / 1', 'Updating an existing key', 'Calls on an empty structure', 'Keeping both structures in sync on delete'],
    big: 'Usually O(1) or O(log n) per call.',
  },
  'Advanced Design Challenges': {
    nudge: 'Which operation is the bottleneck? Is it OK to delete lazily (mark as dead and skip it later) instead of removing immediately?',
    approach: 'Combine a HashMap with an ordered structure (sorted set / balanced BST / heap with lazy deletion / frequency buckets) so every operation stays logarithmic or constant.',
    steps: [
      'List operations and target complexities.',
      'Choose the ordered structure for min / max / range needs.',
      'Store a map from key to current value / node for O(1) access.',
      'Lazy deletion: push updates to the heap, skip stale tops when reading.',
      'Test with repeated updates to the same key.',
    ],
    edges: ['Stale heap entries', 'Ties in ordering', 'Removing the last element', 'Timestamp ordering'],
    big: 'O(log n) per operation typically.',
  },
  'Stream / Online Algorithms': {
    nudge: 'Data arrives one value at a time and you cannot keep re-scanning it. What small summary must you maintain so each query is instant?',
    approach: 'Maintain a running summary: a queue for a time window, two heaps for a median, a stack of (value, current min) for min-stack, or per-key sorted timestamps + binary search.',
    steps: [
      'Decide what each query needs to read.',
      'Store exactly that summary, updated on every insert.',
      'Window by time: push to a queue, pop from the front while too old.',
      'Time-based key/value: append (time, value) per key; binary search on read.',
    ],
    edges: ['Query before any data', 'Equal timestamps', 'Very large streams (memory)', 'Window boundaries (inclusive / exclusive)'],
    big: 'O(1) or O(log n) per operation.',
  },
  'Randomized & Probabilistic Structures': {
    nudge: 'Picking a random element needs index access, but deleting from the middle of an array is slow. What if you swapped the element with the last one first?',
    approach: 'Array + HashMap value -> index: random pick from the array; delete by swapping with the last element and popping. Shuffle with Fisher–Yates; sample streams with reservoir sampling.',
    steps: [
      'vals = [], idx = {}.',
      'insert: if new, idx[x] = len(vals); vals.append(x).',
      'remove: swap x with vals[-1], fix idx of the moved value, pop, delete idx[x].',
      'getRandom: random.choice(vals).',
      'Reservoir: keep item i with probability 1 / i.',
    ],
    edges: ['Removing the last element itself', 'Duplicates allowed (map to a set of indices)', 'Empty structure', 'Uniform probability'],
    big: 'O(1) average per operation; O(n) space.',
  },
};

// The first rung that costs XP (Approach); everything before it is free.
export const PAID_RUNG = 2;
// Interview mode only: when each rung unlocks (seconds into the 45 minutes).
export const INTERVIEW_GATES = [0, 10 * 60, 20 * 60, 30 * 60];

// Pattern labels in questions.json that were cut off at a "/" or "-" and say nothing on their own.
const USABLE_PATTERN = (p) => p && p.length > 3 && !/^\d+$/.test(p);

// A problem's own linker read as numbered steps ("a; b + c, then d" -> [a, b, c, d]).
const stepsFrom = (linker) => linker
  .split(/;\s+|\s\+\s|,\s*then\s+|\.\s+(?=Step\s)|\.\s+(?=Pass\s)/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s[0].toUpperCase() + s.slice(1));

/** The full ladder for one question: the topic guide plus that problem's own pattern and linker. */
export const hintLadderFor = (q) => {
  const own = SPECIFIC_HINTS[q.id];
  if (own) {
    // This problem works differently from the rest of its topic: build every rung from its own data.
    return {
      nudge: own.nudge,
      approach: q.linker,
      pattern: USABLE_PATTERN(q.pattern) ? q.pattern : q.topic,
      linker: null,
      trigger: q.trigger,
      steps: stepsFrom(q.linker),
      edges: GENERIC_EDGES,
      big: own.big,
    };
  }
  const guide = HINT_GUIDES[q.topic];
  return {
    nudge: guide?.nudge || 'Strip the costume: write the input type, the size of N and the goal verb. Which of your tools fits those three?',
    approach: guide?.approach || q.linker,
    pattern: USABLE_PATTERN(q.pattern) ? q.pattern : q.topic,
    linker: q.linker,
    trigger: q.trigger,
    steps: guide?.steps || stepsFrom(q.linker),
    edges: guide?.edges || GENERIC_EDGES,
    big: guide?.big || '',
  };
};
