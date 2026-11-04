// Codex tab: clarifying questions to ask, and follow-ups to expect, per problem type.
// Shape: see ./schema.js. Helpers below only build plain block objects.

const ask = (items) => ({ type: 'qa', title: 'Ask before coding', items: items.map(([q, a]) => ({ q, a })) });
const follow = (items) => ({ type: 'qa', title: 'Follow-ups they may ask', items: items.map(([q, a]) => ({ q, a })) });
const key = (text, title = 'Remember') => ({ type: 'callout', tone: 'key', title, text });

export default {
  key: 'followups',
  label: 'Follow-ups',
  intro:
    'The fight does not end at Accepted. What to ask before you swing, and how to parry the follow-ups interviewers throw after your first solution.',
  sections: [
    {
      id: 'universal-checklist',
      title: 'Universal clarifying checklist',
      summary: 'Ten questions that fit almost any problem. Ask 3-5 that matter, not all ten.',
      tags: ['clarify', 'checklist', 'constraints', 'edge cases'],
      blocks: [
        { type: 'text', text: 'Spend 2-3 minutes here. Each answer can delete a bug or unlock a faster approach. Restate the problem in your own words first.' },
        {
          type: 'table',
          title: 'The checklist',
          head: ['Ask', 'Why it matters'],
          rows: [
            ['How big is n?', 'Sets the target: 10^3 allows O(n²), 10^5 needs O(n log n), 10^9 needs O(log n) or math.'],
            ['What are the value ranges?', 'Overflow risk (use `long`), and whether a counting array works.'],
            ['Can values be negative or zero?', 'Breaks sliding window on sums, changes max-product logic.'],
            ['Can there be duplicates?', 'Affects sets, binary search bounds, and dedupe in backtracking.'],
            ['Can input be empty or null?', 'Decide the return value now so you guard early.'],
            ['Is the input sorted?', 'Sorted means two pointers or binary search are on the table.'],
            ['What exactly do I return?', 'Index vs value, count vs list, any order vs sorted.'],
            ['Can I modify the input in place?', 'Allows O(1) extra space tricks (marking, in-place sort).'],
            ['If multiple answers exist, which one?', 'Any valid one is usually fine; sometimes first or smallest.'],
            ['Is there a time or space target?', 'Tells you whether brute force is a stepping stone or the end.'],
          ],
        },
        { type: 'steps', title: 'Flow', items: ['Restate the problem.', 'Ask the 3-5 questions that change the approach.', 'Walk one small example by hand.', 'State brute force and its cost.', 'Then optimize and code.'] },
        key('Write the answers as a comment at the top of your code. It shows rigor and saves you from re-asking.'),
      ],
    },
    {
      id: 'arrays',
      title: 'Arrays',
      summary: 'Sizes, ranges, sortedness, and whether you may mutate.',
      tags: ['arrays', 'prefix sum', 'in-place'],
      blocks: [
        ask([
          ['Can the array be empty or have one element?', 'Decides early returns. Many off-by-one bugs live here.'],
          ['Are numbers negative? Can sums overflow int?', 'Negatives kill sliding-window-on-sum; switch to prefix sum + hashmap. Big sums mean `long`.'],
          ['Can I modify the array?', 'Yes allows in-place marking (negate values, cyclic sort) for O(1) space.'],
          ['Is it sorted, or can I sort it?', 'Sorting costs O(n log n) but unlocks two pointers; it also loses original indices.'],
          ['Do you want indices or values?', 'If indices, sorting needs you to carry the original index along.'],
        ]),
        follow([
          ['Can you do it in O(1) extra space?', 'Look for in-place tricks: two pointers, swap into position (cyclic sort), or reuse the output array.'],
          ['What if the array is a stream?', 'Keep running state only: running sum, running min/max, a fixed-size heap, or a reservoir sample.'],
          ['What if there are many range-sum queries?', 'Prefix sums for static data (O(1) per query). If values update, a Fenwick tree or segment tree (O(log n)).'],
          ['What if the array is too big for memory?', 'Process in chunks, keep aggregates, or external sort then merge.'],
          ['What if k is larger than n (rotate, kth)?', 'Normalize with `k % n`, or define the error case.'],
        ]),
        key('Classic chain: brute force O(n²) → sort O(n log n) → hashmap O(n) → in-place O(1) space. Say each step out loud.'),
      ],
    },
    {
      id: 'strings',
      title: 'Strings',
      summary: 'Charset, case, whitespace and the cost of building strings.',
      tags: ['strings', 'charset', 'unicode', 'palindrome'],
      blocks: [
        ask([
          ['What characters can appear? Lowercase only, ASCII, Unicode?', 'Lowercase means `int[26]`; ASCII means `int[128]`; Unicode means a HashMap.'],
          ['Is it case-sensitive?', 'Decides whether to normalize with `toLowerCase`.'],
          ['Do spaces and punctuation count?', 'Valid Palindrome style problems skip them.'],
          ['Can the string be empty?', 'Empty is often a palindrome or a valid answer; agree first.'],
          ['How long can it be?', '10^5 chars rules out O(n²) substring comparisons.'],
        ]),
        follow([
          ['What if the input is Unicode?', 'Swap the fixed array for a `HashMap<Integer, Integer>` over code points (`s.codePoints()`).'],
          ['What if the string is huge or streamed?', 'Process char by char with counters; avoid `substring` and full copies.'],
          ['Why not `s += c` in the loop?', 'Strings are immutable, so each `+=` copies: O(n²) total. `StringBuilder` is O(n).'],
          ['Many pattern queries against one text?', 'Preprocess: a trie, suffix structure, or rolling hash. KMP handles one pattern in O(n + m).'],
          ['Can you do it without extra space?', 'Two pointers from both ends, or work on a `char[]` in place.'],
        ]),
      ],
    },
    {
      id: 'hashing',
      title: 'Hashing and counting',
      summary: 'Key choice, collisions and memory are the usual follow-ups.',
      tags: ['hashing', 'hashmap', 'counting', 'frequency'],
      blocks: [
        ask([
          ['What is the key range?', 'Small dense range means an array beats a HashMap in speed and memory.'],
          ['Do duplicates matter for the answer?', 'Decides between a Set (presence) and a Map (counts).'],
          ['Is order of output important?', 'If yes, `LinkedHashMap` or a sort at the end.'],
          ['Is memory tight?', 'A hash map costs extra memory; a sort-based approach might be preferred.'],
        ]),
        follow([
          ['What is the worst case of a HashMap?', 'O(n) per op with many collisions. Java 8+ turns long buckets into trees, so O(log n) worst per bucket.'],
          ['Can you avoid the extra O(n) space?', 'Sort first and use two pointers: O(n log n) time, O(1) extra space.'],
          ['What if data does not fit in memory?', 'Hash-partition into files by `hash(key) % k`, then count each file separately.'],
          ['What if many threads update counts?', '`ConcurrentHashMap` with `merge`, or `LongAdder` values for hot keys.'],
          ['Approximate counts are OK, memory is tiny?', 'Count-Min Sketch for frequencies, HyperLogLog for distinct counts.'],
        ]),
      ],
    },
    {
      id: 'two-pointers-window',
      title: 'Two pointers and sliding window',
      summary: 'Confirm the window is monotonic before you commit.',
      tags: ['two pointers', 'sliding window', 'subarray', 'substring'],
      blocks: [
        ask([
          ['Is the array sorted?', 'Two pointers from both ends needs sorted input (or sort first).'],
          ['Can values be negative?', 'Negative numbers break "shrink when sum too big". Use prefix sum + hashmap instead.'],
          ['Subarray (contiguous) or subsequence?', 'Contiguous → window. Subsequence → DP or greedy.'],
          ['Is the window size fixed or variable?', 'Fixed k is simpler: slide and update in O(1).'],
          ['Exactly k, at most k, or at least k?', '"Exactly k" is often `atMost(k) - atMost(k - 1)`.'],
        ]),
        follow([
          ['Why is this O(n) if there is a nested loop?', 'Each pointer only moves forward, so each element enters and leaves the window once: 2n moves total.'],
          ['What if the input is a stream?', 'Keep the window in a deque or counters; evict from the left as items age out.'],
          ['What about 3Sum / 4Sum generalization?', 'Sort, fix k-2 elements in loops, two-pointer the rest: O(n^(k-1)). Skip duplicates at each level.'],
          ['What if negatives are allowed now?', 'Window no longer monotonic: switch to prefix sums with a hashmap, or a monotonic deque of prefix sums.'],
          ['Return the window itself, not its length?', 'Track best start index and length, then substring once at the end.'],
        ]),
      ],
    },
    {
      id: 'linked-lists',
      title: 'Linked lists',
      summary: 'Pointer rewiring, cycles and whether you may destroy the input.',
      tags: ['linked list', 'pointers', 'cycle', 'dummy node'],
      blocks: [
        ask([
          ['Singly or doubly linked?', 'Doubly gives O(1) removal with a node handle.'],
          ['Can the list be empty or have one node?', 'A dummy head node removes most of these special cases.'],
          ['Can I modify the list?', 'Yes allows in-place reversal; no means copy or restore after.'],
          ['Could there be a cycle?', 'If yes, plain traversal never ends; use Floyd fast/slow pointers.'],
        ]),
        follow([
          ['Can you do it in O(1) space?', 'Fast/slow pointers and in-place reversal instead of a HashSet or array copy.'],
          ['Recursive solution: what is the space cost?', 'O(n) call stack. Long lists can overflow; offer the iterative version.'],
          ['Find where the cycle starts?', 'After fast and slow meet, reset one to head and move both one step; they meet at the start.'],
          ['Can you restore the list afterwards?', 'Reverse the second half for the check, then reverse it back before returning.'],
          ['Make it thread-safe?', 'Lock per operation, or hand-over-hand locking for concurrent traversal.'],
        ]),
      ],
    },
    {
      id: 'stacks-queues',
      title: 'Stacks and queues',
      summary: 'Monotonic stacks, nesting and design-a-stack variants.',
      tags: ['stack', 'queue', 'monotonic stack', 'parentheses'],
      blocks: [
        ask([
          ['What bracket or token types appear?', 'Defines the matching map and invalid-character handling.'],
          ['What should pop or top do when empty?', 'Throw, return -1, or guaranteed never empty: agree first.'],
          ['Next greater: circular array or not?', 'Circular means loop `2n` times with `i % n`.'],
          ['Strictly greater or greater-or-equal?', 'Decides `<` vs `<=` in the pop condition; duplicates break the wrong one.'],
        ]),
        follow([
          ['Get min in O(1)?', 'Keep a second stack of current minimums, or push pairs (value, minSoFar).'],
          ['Implement a queue with stacks?', 'Two stacks: push to `in`, pop from `out`, refill `out` only when empty. Amortized O(1).'],
          ['Why is the monotonic stack O(n)?', 'Each index is pushed once and popped at most once.'],
          ['What if there are many kinds of nesting and errors to report?', 'Push index with the token so you can report the exact position.'],
          ['Make it thread-safe / bounded?', '`ArrayBlockingQueue` or a lock with two conditions (notFull, notEmpty).'],
        ]),
      ],
    },
    {
      id: 'binary-search',
      title: 'Binary search',
      summary: 'Bounds, duplicates and searching on the answer.',
      tags: ['binary search', 'sorted', 'bounds', 'search on answer'],
      blocks: [
        ask([
          ['Is the array sorted, and ascending or descending?', 'Sets the comparison direction.'],
          ['Duplicates allowed? First, last, or any match?', 'First/last need lower-bound or upper-bound style search.'],
          ['If not found, return -1 or the insert position?', 'Changes the final `return lo` vs `-1`.'],
          ['Is the answer monotonic in some parameter?', 'If "can we do it with X?" flips once, binary search on X.'],
        ]),
        follow([
          ['Rotated array with duplicates?', 'When `nums[lo] == nums[mid] == nums[hi]`, shrink both ends; worst case becomes O(n).'],
          ['Unknown size (infinite array)?', 'Double the high bound until it passes the target, then binary search: O(log n).'],
          ['Why `lo + (hi - lo) / 2`?', 'Avoids int overflow of `lo + hi` for large indices.'],
          ['Search a 2D sorted matrix?', 'Fully sorted: treat as 1D with `idx / cols`, `idx % cols`. Rows and cols sorted: start top-right, O(m + n).'],
          ['Many queries on the same data?', 'Sort once O(n log n), then each query is O(log n).'],
        ]),
        key('Pick one template (`while (lo < hi)` with `hi = mid`) and use it everywhere. Consistency beats cleverness.'),
      ],
    },
    {
      id: 'trees',
      title: 'Trees',
      summary: 'Shape, depth and traversal order drive most follow-ups.',
      tags: ['trees', 'binary tree', 'dfs', 'bfs', 'recursion'],
      blocks: [
        ask([
          ['Binary tree or BST?', 'BST order lets you prune half the tree.'],
          ['Can the tree be empty? Node values negative?', 'Negatives matter for max path sum and path-sum pruning.'],
          ['Is it balanced, or can it be a long chain?', 'A chain of 10^5 nodes overflows recursion; plan iterative.'],
          ['Do nodes have parent pointers?', 'Parent pointers turn LCA into a linked-list intersection.'],
          ['Path from root to leaf, or any node to any node?', 'Changes what the recursion returns vs what it records globally.'],
        ]),
        follow([
          ['Do it iteratively?', 'Explicit `ArrayDeque` stack for DFS orders; a queue for level order.'],
          ['What is the space complexity?', 'O(h): O(log n) when balanced, O(n) when skewed.'],
          ['O(1) space traversal?', 'Morris traversal: temporarily thread right pointers to the inorder successor, then undo.'],
          ['Serialize and deserialize it?', 'Preorder with null markers, split by commas; rebuild with a queue or index pointer.'],
          ['Many LCA queries?', 'Precompute depth and binary lifting tables: O(n log n) build, O(log n) per query.'],
        ]),
      ],
    },
    {
      id: 'bst',
      title: 'BST',
      summary: 'Use the ordering: inorder is sorted, and you can prune.',
      tags: ['bst', 'binary search tree', 'inorder', 'balanced'],
      blocks: [
        ask([
          ['Are duplicates allowed? Which side do they go?', 'Affects validation (`<` vs `<=`) and insertion.'],
          ['Is the BST balanced?', 'Balanced: O(log n) ops. Skewed: O(n).'],
          ['Do I return a node or its value?', 'Matters for delete and successor problems.'],
        ]),
        follow([
          ['Kth smallest when the tree changes often?', 'Store subtree size in each node; walk down in O(h) per query.'],
          ['Validate without recursion bounds bugs?', 'Pass `long` min/max bounds, or check that inorder is strictly increasing.'],
          ['Keep it balanced under inserts?', 'AVL or red-black trees; in Java, `TreeMap` gives you one.'],
          ['Find the inorder successor without parent pointers?', 'If right child exists, go right then leftmost. Else walk from root, remembering the last left turn.'],
          ['Iterator with O(h) memory?', 'Stack of the left spine; `next()` pops and pushes the left spine of the right child. Amortized O(1).'],
        ]),
      ],
    },
    {
      id: 'heaps-topk',
      title: 'Heaps and top-k',
      summary: 'k vs n, streaming data and ties.',
      tags: ['heap', 'top k', 'priority queue', 'median', 'streaming'],
      blocks: [
        ask([
          ['How does k compare to n?', 'Small k: size-k heap O(n log k). k near n: sort or quickselect.'],
          ['How are ties broken?', 'Defines the comparator, e.g. same frequency then alphabetical.'],
          ['Does output need to be sorted?', 'A heap gives the set; sorting it costs an extra O(k log k).'],
          ['Is the data static or arriving over time?', 'Streaming means a heap you keep, not a one-time sort.'],
        ]),
        follow([
          ['Can you beat O(n log k)?', 'Quickselect: average O(n), worst O(n²). Bucket sort by frequency: O(n) when counts are bounded by n.'],
          ['Data is a stream: find the median any time?', 'Two heaps: max-heap for the lower half, min-heap for the upper half; rebalance so sizes differ by at most 1.'],
          ['Most values are in a small range (0-100)?', 'Use a counting array instead of a heap: O(1) updates.'],
          ['Top k across many machines?', 'Each machine computes local top k; merge the candidates. Exact for top-k by value; for counts, aggregate counts first.'],
          ['Need to remove arbitrary elements?', 'Lazy deletion: mark removed in a map and skip when it reaches the top. Or use a `TreeMap` multiset.'],
        ]),
      ],
    },
    {
      id: 'graphs-grids',
      title: 'Graphs and grids',
      summary: 'Directed or not, weighted or not, connected or not.',
      tags: ['graph', 'grid', 'bfs', 'dfs', 'dijkstra', 'topological sort', 'union find'],
      blocks: [
        ask([
          ['Directed or undirected?', 'Changes cycle detection and how you build adjacency.'],
          ['Weighted? Negative weights?', 'Unweighted: BFS. Non-negative: Dijkstra. Negative: Bellman-Ford.'],
          ['Can there be cycles or self-loops? Is it connected?', 'Need a visited set; disconnected means loop over all start nodes.'],
          ['Grid: 4 or 8 directions? Can I mutate the grid?', 'Mutation lets you mark visited in place and skip a visited array.'],
          ['How many nodes and edges?', 'Dense graphs may prefer a matrix; sparse ones an adjacency list.'],
        ]),
        follow([
          ['Shortest path instead of any path?', 'BFS on unweighted, Dijkstra on weighted. DFS does not give shortest paths.'],
          ['The grid is huge or infinite?', 'Bidirectional BFS, A* with a heuristic, or bound the search area.'],
          ['Edges are added over time, and you get connectivity queries?', 'Union-Find with path compression and union by rank: near O(1) per op.'],
          ['Detect a cycle in a directed graph?', 'DFS with three colors (unvisited, in stack, done), or Kahn topo sort leaving nodes unprocessed.'],
          ['Recursion depth too large?', 'Switch DFS to an explicit stack, or use BFS.'],
          ['Return the actual path, not just the length?', 'Store a parent array during BFS/Dijkstra, then walk back from the target.'],
        ]),
      ],
    },
    {
      id: 'intervals',
      title: 'Intervals',
      summary: 'Open or closed ends, sorting key and overlap rules.',
      tags: ['intervals', 'merge', 'sweep line', 'meeting rooms'],
      blocks: [
        ask([
          ['Are endpoints inclusive? Do [1,2] and [2,3] overlap?', 'Decides `<` vs `<=` in the overlap check.'],
          ['Is the input already sorted?', 'Saves the O(n log n) sort.'],
          ['Can intervals be empty or have start > end?', 'Validate or normalize first.'],
          ['Return merged intervals, a count, or a boolean?', 'Count problems often need only a sweep, not a merged list.'],
        ]),
        follow([
          ['Intervals arrive one at a time (a stream)?', 'Keep them in a `TreeMap` keyed by start; merge with floor and ceiling neighbors: O(log n) per insert.'],
          ['Max overlap at any point (rooms needed)?', 'Sweep line: +1 at start, -1 at end, sorted; or a min-heap of end times.'],
          ['Sort by start or by end?', 'Merge: by start. Max non-overlapping set (greedy): by end.'],
          ['Many "is point x covered?" queries?', 'Merge once, then binary search the sorted merged list.'],
          ['Coordinates are huge (10^9)?', 'Coordinate compression, or a `TreeMap` diff map instead of an array.'],
        ]),
      ],
    },
    {
      id: 'backtracking',
      title: 'Backtracking',
      summary: 'Duplicates, ordering and pruning are what they probe.',
      tags: ['backtracking', 'permutations', 'subsets', 'combinations', 'pruning'],
      blocks: [
        ask([
          ['Does the input have duplicates? Must output be unique?', 'Sort and skip `i > start && a[i] == a[i-1]`.'],
          ['Can an element be reused?', 'Reuse: recurse with `i`. No reuse: recurse with `i + 1`.'],
          ['Does order matter in an answer?', 'Order matters → permutations (used[] array). Not → combinations (start index).'],
          ['All answers, or just count, or just one?', 'Count may allow DP. One answer lets you return early.'],
        ]),
        follow([
          ['What is the time complexity?', 'Roughly branches^depth times the cost to copy each answer, e.g. O(n · 2^n) for subsets, O(n · n!) for permutations.'],
          ['How do you prune?', 'Sort, then break when the running sum exceeds the target; check constraints before recursing, not after.'],
          ['Only the count is needed?', 'Look for overlapping subproblems and memoize: it becomes DP.'],
          ['N-Queens: faster validity checks?', 'Boolean arrays for columns and both diagonals (`r + c`, `r - c + n`), or bitmasks.'],
          ['Avoid recursion?', 'Iterative subsets: for each number, copy every existing subset and add it. Or bitmask over 0..2^n - 1.'],
        ]),
      ],
    },
    {
      id: 'dynamic-programming',
      title: 'Dynamic programming',
      summary: 'State, transitions, space optimization and rebuilding the answer.',
      tags: ['dp', 'dynamic programming', 'memoization', 'tabulation'],
      blocks: [
        ask([
          ['Value only, or the actual sequence/path too?', 'Reconstruction needs a parent table or a backward walk over dp.'],
          ['Can values be negative or zero?', 'Changes base cases and whether "impossible" is -1 or -infinity.'],
          ['Is the answer modulo something?', 'Apply `% MOD` at every addition, using `long`.'],
          ['What are the bounds on n and the target?', 'Tells you if an O(n · target) table fits in time and memory.'],
        ]),
        follow([
          ['Can you reduce space?', 'If row i depends only on row i-1, keep two rows or one row. 0/1 knapsack: iterate capacity backwards.'],
          ['Top-down or bottom-up: which and why?', 'Top-down is easier to derive and skips unreachable states. Bottom-up avoids recursion depth and is faster.'],
          ['Print one optimal solution?', 'Store the choice per state, or walk back comparing dp values.'],
          ['What if the constraint grows to 10^9?', 'Look for matrix exponentiation, a math formula, or a greedy property.'],
          ['Explain the state in one sentence.', 'Practice: "dp[i] is the best answer for the first i items, given ..." Clear state wins the round.'],
        ]),
        key('Say the 4 parts out loud: state, transition, base case, answer location. Then code.'),
      ],
    },
    {
      id: 'greedy',
      title: 'Greedy',
      summary: 'They will ask you to justify why greedy is safe.',
      tags: ['greedy', 'proof', 'exchange argument', 'scheduling'],
      blocks: [
        ask([
          ['Is any valid answer fine, or the optimal one?', 'Optimal needs a proof that greedy works; any valid may be easier.'],
          ['Can I sort the input?', 'Most greedy solutions start with the right sort key.'],
          ['Are there ties? How should they break?', 'Ties can change correctness, e.g. sort by end then start.'],
        ]),
        follow([
          ['Why does greedy work here?', 'Exchange argument: take any optimal solution, swap its first choice for the greedy one, and show it stays valid and no worse.'],
          ['Give a counterexample where greedy fails.', 'Coin change with coins {1, 3, 4} and amount 6: greedy picks 4+1+1 (3 coins), optimal is 3+3 (2 coins). Then DP.'],
          ['What if items arrive online?', 'Keep a heap of current choices and swap out the worst when a better item arrives (e.g. course schedule III).'],
          ['Prove the jump game greedy.', 'Track the farthest reachable index; if i ever exceeds it, nothing beyond i is reachable.'],
        ]),
      ],
    },
    {
      id: 'bits-math',
      title: 'Bit manipulation and math',
      summary: 'Overflow, sign, and the precise integer width.',
      tags: ['bits', 'bit manipulation', 'math', 'overflow', 'modulo', 'primes'],
      blocks: [
        ask([
          ['Signed or unsigned? 32 or 64 bit?', 'Java has no unsigned int; use `>>>` and `long` where needed.'],
          ['What should happen on overflow?', 'Clamp, return 0, or use `long` / `BigInteger`.'],
          ['Are negative inputs possible?', 'Negative modulo and right shift behave differently; use `Math.floorMod`.'],
          ['Is a modulus required for the result?', 'Usually 10^9 + 7; apply at each step.'],
        ]),
        follow([
          ['Can you avoid the extra space (find the single number)?', 'XOR all values: pairs cancel, the single one remains. O(1) space.'],
          ['Count bits for all numbers 0..n fast?', '`bits[i] = bits[i >> 1] + (i & 1)`: O(n).'],
          ['Compute pow(x, n) fast?', 'Fast exponentiation by squaring: O(log n). Handle negative n and `Integer.MIN_VALUE` with `long`.'],
          ['Many primality queries up to N?', 'Sieve of Eratosthenes once: O(N log log N), then O(1) per query.'],
          ['Add two numbers without `+`?', 'Loop: `sum = a ^ b`, `carry = (a & b) << 1`, until carry is 0.'],
        ]),
      ],
    },
    {
      id: 'design-lld',
      title: 'Design / LLD-style coding',
      summary: 'LRU, rate limiters, iterators: API first, then complexity, then concurrency.',
      tags: ['design', 'lld', 'lru', 'cache', 'oop', 'thread-safe'],
      blocks: [
        ask([
          ['What operations and signatures are required?', 'Pin the API before choosing data structures.'],
          ['What are the expected complexities per operation?', 'LRU wants O(1) get and put: HashMap + doubly linked list.'],
          ['What is the capacity, and what on invalid input?', 'Capacity 0, missing keys, duplicate puts: agree on behavior.'],
          ['Single-threaded or concurrent?', 'Concurrency changes the design; ask early, not at the end.'],
          ['Which operation is most frequent?', 'Optimize the hot path; reads vs writes changes trade-offs.'],
        ]),
        follow([
          ['Make it thread-safe.', 'Start simple: one `ReentrantLock` or `synchronized` on each public method. Then improve: `ReadWriteLock`, or striped locks by key hash.'],
          ['LFU instead of LRU?', 'Map key → node, map freq → LinkedHashSet of keys, and track minFreq. All ops O(1).'],
          ['Add TTL / expiry to the cache?', 'Store expiry time per entry; lazy check on get, plus a periodic sweep or a min-heap of expiry times.'],
          ['Why not just use LinkedHashMap?', 'It is fine in practice; the interview usually wants you to show the linked list mechanics.'],
          ['How would you test it?', 'Capacity 1, update existing key, get refreshes recency, evict order, and concurrency stress tests.'],
        ]),
        key('Explain trade-offs out loud: "I chose X for O(1) here, and the cost is extra memory for the pointers."'),
      ],
    },
    {
      id: 'system-design',
      title: 'System design rounds',
      summary: 'Requirements and scale first; then a simple design you deepen on request.',
      tags: ['system design', 'scale', 'requirements', 'hld'],
      blocks: [
        ask([
          ['Who are the users and what are the core features?', 'Scopes the problem to 2-3 features you can cover well.'],
          ['How many users, requests per second, and data size?', 'Back-of-envelope numbers decide caching, sharding and storage.'],
          ['Read-heavy or write-heavy?', 'Read-heavy: caches and replicas. Write-heavy: queues, partitioning, append-only logs.'],
          ['Consistency vs availability: which matters more?', 'Payments need strong consistency; feeds can be eventually consistent.'],
          ['Latency targets and regions?', 'Global users push you toward CDNs and multi-region replication.'],
        ]),
        follow([
          ['What happens when this component fails?', 'Replicas, health checks and failover; idempotent retries so duplicate requests are safe.'],
          ['Traffic grows 10x. What breaks first?', 'Name the bottleneck (usually the database), then add cache, read replicas, then shard by a good key.'],
          ['How do you avoid hot keys?', 'Add a random suffix to spread writes, cache hot reads, or route hot keys to dedicated shards.'],
          ['How do you keep cache and DB consistent?', 'Cache-aside with invalidate on write and a TTL as a safety net; accept short staleness if allowed.'],
          ['How would you monitor it?', 'Golden signals: latency, traffic, errors, saturation. Alerts on SLOs, plus tracing across services.'],
        ]),
        { type: 'steps', title: 'Round flow', items: ['Requirements (functional + non-functional).', 'Estimates.', 'API and data model.', 'High-level diagram.', 'Deep dive on 1-2 parts.', 'Bottlenecks and trade-offs.'] },
      ],
    },
    {
      id: 'unknown-followup',
      title: 'When you do not know the follow-up',
      summary: 'Scripts to stay calm, think aloud and still score points.',
      tags: ['soft skills', 'stuck', 'communication', 'scripts'],
      blocks: [
        { type: 'text', text: 'Interviewers grade your reasoning, not just the final answer. Silence is the real fail. Narrate.' },
        {
          type: 'qa',
          title: 'Scripts to say',
          items: [
            { q: 'You need a moment.', a: '"Good question. Let me think for 30 seconds and talk through it."' },
            { q: 'You only know a slower approach.', a: '"I can do it in O(n log n) with a heap. Let me start there, then see if the heap is really needed."' },
            { q: 'You have never seen the concept.', a: '"I have not used that directly. Here is how I would reason about it from first principles..."' },
            { q: 'The follow-up is ambiguous.', a: '"Just to check: do you mean the data no longer fits in memory, or that it arrives over time?"' },
            { q: 'You think of a trade-off but not a full answer.', a: '"One direction is to trade memory for speed with a cache. The risk is staleness. Should I go deeper there?"' },
            { q: 'You realize your earlier code has a bug.', a: '"Actually, I see an issue with the empty case. Let me fix that first." Owning it scores points.' },
          ],
        },
        {
          type: 'list',
          title: 'Fallback moves',
          items: [
            'Shrink the problem: solve n = 1, 2, 3 out loud and look for a pattern.',
            'Name the constraint that changed (memory, time, stream, concurrency) and the tool that usually fits it.',
            'Offer brute force with its cost, then point at the bottleneck.',
            'Ask for a hint politely; using a hint well is still a positive signal.',
          ],
        },
        {
          type: 'table',
          title: 'Constraint changed → reach for',
          head: ['If they say...', 'Think about'],
          rows: [
            ['"It is a stream"', 'Running state, heap of size k, two heaps, reservoir sampling'],
            ['"It does not fit in memory"', 'Chunking, external sort, hash partitioning, MapReduce'],
            ['"Many queries"', 'Preprocess: prefix sums, sorting + binary search, indexes, caching'],
            ['"O(1) space"', 'Two pointers, in-place marking, bit tricks, reuse output'],
            ['"Make it thread-safe"', 'Locks, ConcurrentHashMap, atomic ops, immutability'],
            ['"Values can be negative / huge"', '`long`, prefix sums + hashmap, coordinate compression'],
          ],
        },
        key('Calm, structured thinking out loud beats a silent perfect answer.', 'The real win'),
      ],
    },
  ],
};
