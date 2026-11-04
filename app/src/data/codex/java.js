// Codex tab: Java Collections cheat sheet (Java 17) for LeetCode.
// Shape: see ./schema.js. Small helpers below only build plain block objects.

const MH = ['Method', 'What it does', 'Time'];
const methods = (rows, title = 'Methods') => ({ type: 'table', title, head: MH, rows });
const code = (src, title = 'Idioms') => ({ type: 'code', title, lang: 'java', code: src.trim() });
const warn = (text, title = 'Gotchas') => ({ type: 'callout', tone: 'warn', title, text });
const drill = (text) => ({ type: 'callout', tone: 'drill', title: 'Drill it', text });
const tip = (text, title) => ({ type: 'callout', tone: 'tip', title, text });

export default {
  key: 'java',
  label: 'Java Collections',
  intro:
    'Your weapon rack. The Java 17 APIs you actually swing in LeetCode fights, with costs, idioms and the traps that cost you a submission.',
  sections: [
    {
      id: 'overview',
      title: 'Collections overview',
      summary: 'Pick the interface first, then the implementation that matches your access pattern.',
      tags: ['overview', 'interface', 'implementation', 'choose'],
      blocks: [
        { type: 'text', text: 'Declare by interface (`List`, `Map`, `Deque`), build with the implementation. Choose by the operation you do most.' },
        {
          type: 'table',
          title: 'Interface → implementation → when',
          head: ['Interface', 'Implementation', 'Use when'],
          rows: [
            ['List', '`ArrayList`', 'Default list. Index access, append at end.'],
            ['List / Deque', '`LinkedList`', 'Rarely. Only if you need a nullable queue or ListIterator splicing.'],
            ['Deque', '`ArrayDeque`', 'Stack, queue, monotonic deque, BFS. Fastest choice.'],
            ['Queue', '`PriorityQueue`', 'Top-k, Dijkstra, merge k sorted, scheduling.'],
            ['Map', '`HashMap`', 'O(1) lookup / counting. Order does not matter.'],
            ['Map', '`LinkedHashMap`', 'Need insertion order or LRU (access order).'],
            ['NavigableMap', '`TreeMap`', 'Sorted keys, floor/ceiling queries, range views.'],
            ['Set', '`HashSet`', 'Seen-before checks, dedupe.'],
            ['Set', '`LinkedHashSet`', 'Dedupe but keep first-seen order.'],
            ['NavigableSet', '`TreeSet`', 'Sorted unique values, nearest-value queries.'],
            ['(array)', '`int[]`, `boolean[]`', 'Small dense key range (letters, 0..n). Beats any map.'],
          ],
        },
        {
          type: 'table',
          title: 'Cost cheat sheet',
          head: ['Structure', 'Get / contains', 'Add / remove', 'Ordered?'],
          rows: [
            ['ArrayList', 'O(1) by index, O(n) contains', 'O(1) amortized end, O(n) middle', 'Insertion'],
            ['ArrayDeque', 'O(1) ends', 'O(1) ends', 'Insertion'],
            ['PriorityQueue', 'O(1) peek', 'O(log n) offer/poll, O(n) remove(obj)', 'Heap only'],
            ['HashMap / HashSet', 'O(1) avg', 'O(1) avg', 'No'],
            ['TreeMap / TreeSet', 'O(log n)', 'O(log n)', 'Sorted'],
          ],
        },
        warn('`Stack`, `Vector` and `Hashtable` are legacy and synchronized. Do not use them. `List.of(...)` and `Map.of(...)` are immutable and reject `null`.'),
      ],
    },
    {
      id: 'arraylist',
      title: 'ArrayList / List',
      summary: 'Resizable array. Your default list.',
      tags: ['list', 'arraylist', 'dynamic array'],
      blocks: [
        methods([
          ['`add(x)`', 'Append to end', 'O(1) amortized'],
          ['`add(i, x)`', 'Insert at index, shifts right', 'O(n)'],
          ['`get(i)` / `set(i, x)`', 'Read / overwrite by index', 'O(1)'],
          ['`remove(int i)`', 'Remove by index', 'O(n)'],
          ['`remove(Integer.valueOf(x))`', 'Remove first matching value', 'O(n)'],
          ['`contains(x)` / `indexOf(x)`', 'Linear search', 'O(n)'],
          ['`size()` / `isEmpty()`', 'Length checks', 'O(1)'],
          ['`subList(a, b)`', 'View of [a, b), not a copy', 'O(1)'],
          ['`new ArrayList<>(other)`', 'Copy (shallow)', 'O(n)'],
          ['`List.of(a, b)`', 'Immutable small list', 'O(n)'],
        ]),
        code(`
List<Integer> list = new ArrayList<>();
list.add(5);
list.add(0, 1);                      // insert at front (O(n))
int last = list.get(list.size() - 1);
list.set(0, 9);
list.remove(list.size() - 1);        // pop from end: O(1)

// Backtracking: snapshot the path, not the reference
List<List<Integer>> res = new ArrayList<>();
List<Integer> path = new ArrayList<>();
res.add(new ArrayList<>(path));

// Grow a list of lists lazily
List<List<Integer>> buckets = new ArrayList<>();
for (int i = 0; i < n; i++) buckets.add(new ArrayList<>());
`),
        warn('`list.remove(3)` on a `List<Integer>` removes **index** 3, not the value 3. Use `remove(Integer.valueOf(3))`. In backtracking, `res.add(path)` stores one shared list that you later empty; always copy. `subList` is a live view: changing the parent breaks it.'),
        drill('Subsets, Permutations, Combination Sum, Pascal\'s Triangle, Generate Parentheses.'),
      ],
    },
    {
      id: 'linkedlist',
      title: 'LinkedList',
      summary: 'Doubly linked list. Almost always lose to ArrayList or ArrayDeque.',
      tags: ['linkedlist', 'list', 'deque'],
      blocks: [
        methods([
          ['`addFirst(x)` / `addLast(x)`', 'Insert at ends', 'O(1)'],
          ['`pollFirst()` / `pollLast()`', 'Remove ends, null if empty', 'O(1)'],
          ['`get(i)`', 'Walks from nearest end', 'O(n)'],
          ['`add(null)`', 'Allowed (ArrayDeque forbids null)', 'O(1)'],
          ['`listIterator()`', 'Insert/remove while walking', 'O(1) per op'],
        ]),
        code(`
// Works as a Queue, but ArrayDeque is faster
Queue<Integer> q = new LinkedList<>();
q.offer(1);
int head = q.poll();

// The one real reason: you need null in a queue
Queue<TreeNode> level = new LinkedList<>();
level.offer(null);                   // ArrayDeque would throw NPE
`),
        warn('Calling `get(i)` in a loop turns O(n) into O(n²). Java\'s `LinkedList` is not the same as LeetCode\'s `ListNode` problems; those use your own node class.'),
        tip('In LeetCode linked-list problems you never use this class. You manipulate `ListNode next` pointers with a dummy head.', 'Not for ListNode problems'),
      ],
    },
    {
      id: 'arraydeque',
      title: 'ArrayDeque (stack and queue)',
      summary: 'One class for stack, queue and monotonic deque. Use it instead of Stack.',
      tags: ['stack', 'queue', 'deque', 'bfs', 'monotonic'],
      blocks: [
        methods([
          ['`push(x)` / `pop()` / `peek()`', 'Stack ops at the head', 'O(1)'],
          ['`offer(x)` / `poll()` / `peek()`', 'Queue: add tail, remove head', 'O(1)'],
          ['`offerFirst` / `offerLast`', 'Add at either end', 'O(1)'],
          ['`pollFirst` / `pollLast`', 'Remove either end, null if empty', 'O(1)'],
          ['`peekFirst` / `peekLast`', 'Look at either end', 'O(1)'],
          ['`isEmpty()` / `size()`', 'Checks', 'O(1)'],
          ['`contains(x)`', 'Linear scan', 'O(n)'],
        ]),
        code(`
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.push(2);
int top = stack.pop();               // 2 (LIFO)

Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[]{0, 0});
while (!queue.isEmpty()) {
    int size = queue.size();         // freeze level size for BFS
    for (int i = 0; i < size; i++) {
        int[] cur = queue.poll();
        // expand neighbors...
    }
}

// Monotonic deque of indices (sliding window max)
Deque<Integer> dq = new ArrayDeque<>();
for (int i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
    dq.offerLast(i);
    if (dq.peekFirst() <= i - k) dq.pollFirst();
}
`),
        warn('`ArrayDeque` throws on `null`. `pop()` / `remove()` throw on empty; `poll()` returns null, which then NPEs when unboxed to `int`. Do not mix `push` and `offer` on the same deque unless you mean it: `push` adds to the head, `offer` adds to the tail.'),
        { type: 'callout', tone: 'key', title: 'Why not Stack?', text: '`Stack` extends `Vector`: synchronized (slow), and iteration order is bottom-to-top, which surprises people. `ArrayDeque` is faster and is what the JDK docs recommend.' },
        drill('Valid Parentheses, Daily Temperatures, Sliding Window Maximum, Binary Tree Level Order Traversal, Rotting Oranges.'),
      ],
    },
    {
      id: 'priorityqueue',
      title: 'PriorityQueue (heap)',
      summary: 'Binary heap. Min-heap by default; pass a comparator for anything else.',
      tags: ['heap', 'priority queue', 'top k', 'dijkstra', 'comparator'],
      blocks: [
        methods([
          ['`offer(x)` / `add(x)`', 'Insert', 'O(log n)'],
          ['`poll()`', 'Remove smallest (by comparator)', 'O(log n)'],
          ['`peek()`', 'Look at smallest', 'O(1)'],
          ['`remove(obj)`', 'Remove arbitrary element', 'O(n)'],
          ['`contains(obj)`', 'Linear scan', 'O(n)'],
          ['`new PriorityQueue<>(collection)`', 'Heapify existing data', 'O(n)'],
          ['`size()`', 'Count', 'O(1)'],
        ]),
        code(`
PriorityQueue<Integer> min = new PriorityQueue<>();
PriorityQueue<Integer> max = new PriorityQueue<>(Collections.reverseOrder());

// int[] {node, dist}: order by dist
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));

// Ties: higher count first, then smaller word
PriorityQueue<String> words = new PriorityQueue<>(
    Comparator.comparingInt((String w) -> -count.get(w))
              .thenComparing(Comparator.naturalOrder()));

// Top-k largest: keep a min-heap of size k
PriorityQueue<Integer> heap = new PriorityQueue<>();
for (int x : nums) {
    heap.offer(x);
    if (heap.size() > k) heap.poll();
}
int kthLargest = heap.peek();
`),
        warn('Iterating or printing a heap is **not** sorted; only `poll()` gives order. Never write `(a, b) -> a - b` on values that can be large or negative: it overflows. Use `Integer.compare(a, b)` or `comparingInt`. Changing a field of an object already inside the heap does not re-sort it; remove and re-add, or push a new entry and skip stale ones.'),
        drill('Kth Largest Element in an Array, Top K Frequent Elements, Merge k Sorted Lists, Find Median from Data Stream, Network Delay Time, Task Scheduler.'),
      ],
    },
    {
      id: 'hashmap',
      title: 'HashMap',
      summary: 'O(1) average key → value lookup. The workhorse of counting and memo.',
      tags: ['map', 'hashmap', 'counting', 'frequency', 'memo'],
      blocks: [
        methods([
          ['`put(k, v)` / `get(k)`', 'Write / read (null if missing)', 'O(1) avg'],
          ['`getOrDefault(k, d)`', 'Read with fallback', 'O(1) avg'],
          ['`containsKey(k)`', 'Key check', 'O(1) avg'],
          ['`containsValue(v)`', 'Scans all values', 'O(n)'],
          ['`merge(k, 1, Integer::sum)`', 'Add to count, insert if missing', 'O(1) avg'],
          ['`computeIfAbsent(k, x -> new ArrayList<>())`', 'Get or create bucket', 'O(1) avg'],
          ['`putIfAbsent(k, v)`', 'Insert only if missing', 'O(1) avg'],
          ['`remove(k)`', 'Delete key', 'O(1) avg'],
          ['`entrySet()` / `keySet()` / `values()`', 'Views to iterate', 'O(n) to walk'],
        ]),
        code(`
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

// Decrement and drop at zero (sliding window)
freq.merge(c, -1, Integer::sum);
if (freq.get(c) == 0) freq.remove(c);

// Group anagrams: key -> bucket
Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {
    char[] cs = w.toCharArray();
    Arrays.sort(cs);
    groups.computeIfAbsent(new String(cs), x -> new ArrayList<>()).add(w);
}

// Two Sum: value -> index
Map<Integer, Integer> seen = new HashMap<>();
seen.put(0, -1);                      // prefix-sum base case

for (Map.Entry<Character, Integer> e : freq.entrySet()) {
    char key = e.getKey(); int val = e.getValue();
}
`),
        warn('`get` returns `null` for a missing key; `int x = map.get(k)` then NPEs. Iteration order is not defined; do not rely on it. Arrays as keys (`int[]`) use identity, not contents: convert to `String` or `List<Integer>` first. Mutating a key object after inserting it loses the entry.'),
        drill('Two Sum, Group Anagrams, Subarray Sum Equals K, Longest Consecutive Sequence, Top K Frequent Elements, Isomorphic Strings.'),
      ],
    },
    {
      id: 'linkedhashmap',
      title: 'LinkedHashMap',
      summary: 'HashMap that remembers order: insertion order or access order (LRU).',
      tags: ['linkedhashmap', 'lru', 'ordered map', 'cache'],
      blocks: [
        methods([
          ['`new LinkedHashMap<>()`', 'Insertion order', 'O(1)'],
          ['`new LinkedHashMap<>(cap, 0.75f, true)`', 'Access order (get moves to end)', 'O(1)'],
          ['`removeEldestEntry(e)`', 'Override: return true to evict oldest after put', 'O(1)'],
          ['`keySet().iterator().next()`', 'Oldest key', 'O(1)'],
          ['get / put / remove', 'Same as HashMap', 'O(1) avg'],
        ]),
        code(`
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    LRUCache(int capacity) {
        super(capacity, 0.75f, true);    // true = access order
        this.cap = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}

// First unique character: insertion order counts
Map<Character, Integer> cnt = new LinkedHashMap<>();
`),
        warn('In access-order mode, `getOrDefault` and `get` both count as access, which is what LRU wants. Re-`put` of an existing key does not change insertion order in insertion mode. Interviewers often want the hand-built version (HashMap + doubly linked list); know both.'),
        drill('LRU Cache, First Unique Character in a String, Design Twitter (ordering ideas).'),
      ],
    },
    {
      id: 'treemap',
      title: 'TreeMap',
      summary: 'Red-black tree map. Sorted keys plus nearest-key and range queries in O(log n).',
      tags: ['treemap', 'sorted map', 'floor', 'ceiling', 'range', 'navigablemap'],
      blocks: [
        methods([
          ['`floorKey(k)`', 'Largest key ≤ k, or null', 'O(log n)'],
          ['`ceilingKey(k)`', 'Smallest key ≥ k, or null', 'O(log n)'],
          ['`lowerKey(k)` / `higherKey(k)`', 'Strictly < k / strictly > k', 'O(log n)'],
          ['`floorEntry(k)` etc.', 'Same, returns key + value', 'O(log n)'],
          ['`firstKey()` / `lastKey()`', 'Min / max key (throws if empty)', 'O(log n)'],
          ['`pollFirstEntry()` / `pollLastEntry()`', 'Remove and return min / max', 'O(log n)'],
          ['`headMap(k)`', 'View of keys < k', 'O(log n) to create'],
          ['`tailMap(k)`', 'View of keys ≥ k', 'O(log n) to create'],
          ['`subMap(a, b)`', 'View of keys in [a, b)', 'O(log n) to create'],
          ['`descendingMap()`', 'Reverse-order view', 'O(1)'],
        ]),
        code(`
TreeMap<Integer, Integer> tm = new TreeMap<>();
tm.put(10, 1); tm.put(20, 2); tm.put(30, 3);
Integer f = tm.floorKey(25);          // 20
Integer c = tm.ceilingKey(25);        // 30
Integer h = tm.higherKey(30);         // null -> check before unboxing!

// Time-based key-value store: latest value at or before t
Map.Entry<Integer, String> e = byTime.floorEntry(t);
String ans = e == null ? "" : e.getValue();

// Sweep line / My Calendar: count events at each point
TreeMap<Integer, Integer> delta = new TreeMap<>();
delta.merge(start, 1, Integer::sum);
delta.merge(end, -1, Integer::sum);
int active = 0;
for (int d : delta.values()) active += d;   // walks keys in sorted order

// Multiset: count of each value, sorted
tm.merge(x, 1, Integer::sum);
if (tm.merge(x, -1, Integer::sum) == 0) tm.remove(x);
`),
        warn('`floorKey` and friends return `null` when nothing qualifies; unboxing that to `int` crashes. `firstKey()` throws on an empty map, while `firstEntry()` returns null. Range views are live; `headMap(k, true)` makes the bound inclusive.'),
        drill('Time Based Key-Value Store, My Calendar I, Stock Price Fluctuation, Sliding Window Median (multiset), Car Pooling.'),
      ],
    },
    {
      id: 'hashset',
      title: 'HashSet / LinkedHashSet',
      summary: 'Unique values with O(1) membership. LinkedHashSet keeps first-seen order.',
      tags: ['set', 'hashset', 'dedupe', 'visited'],
      blocks: [
        methods([
          ['`add(x)`', 'Insert; returns false if already present', 'O(1) avg'],
          ['`contains(x)`', 'Membership', 'O(1) avg'],
          ['`remove(x)`', 'Delete; returns false if absent', 'O(1) avg'],
          ['`size()`', 'Count unique', 'O(1)'],
          ['`retainAll(other)`', 'Intersection in place', 'O(n)'],
          ['`addAll(other)`', 'Union in place', 'O(m)'],
          ['`new HashSet<>(list)`', 'Dedupe a list', 'O(n)'],
        ]),
        code(`
Set<Integer> seen = new HashSet<>();
for (int x : nums) {
    if (!seen.add(x)) return true;    // add() == false means duplicate
}

// Visited for grids: encode the cell
Set<Integer> visited = new HashSet<>();
visited.add(r * cols + c);

// Keep first-seen order while removing duplicates
Set<Character> ordered = new LinkedHashSet<>();
`),
        warn('`Set<int[]>` compares arrays by identity, so duplicates slip in. Encode as `r * cols + c` or a `String`, or use `List.of(r, c)`. For grids, a `boolean[][] visited` is faster than any set.'),
        drill('Contains Duplicate, Longest Consecutive Sequence, Happy Number, Intersection of Two Arrays, Valid Sudoku.'),
      ],
    },
    {
      id: 'treeset',
      title: 'TreeSet',
      summary: 'Sorted unique values with nearest-value lookups in O(log n).',
      tags: ['treeset', 'sorted set', 'floor', 'ceiling', 'navigableset'],
      blocks: [
        methods([
          ['`floor(x)` / `ceiling(x)`', 'Largest ≤ x / smallest ≥ x, or null', 'O(log n)'],
          ['`lower(x)` / `higher(x)`', 'Strictly < x / strictly > x', 'O(log n)'],
          ['`first()` / `last()`', 'Min / max (throws if empty)', 'O(log n)'],
          ['`pollFirst()` / `pollLast()`', 'Remove min / max (null if empty)', 'O(log n)'],
          ['`add` / `remove` / `contains`', 'Standard set ops', 'O(log n)'],
          ['`headSet(x)` / `tailSet(x)` / `subSet(a, b)`', 'Range views', 'O(log n) to create'],
          ['`descendingSet()`', 'Reverse view', 'O(1)'],
        ]),
        code(`
TreeSet<Integer> ts = new TreeSet<>();
// Contains Duplicate III: any value within t in the last k items?
for (int i = 0; i < nums.length; i++) {
    Integer lo = ts.ceiling(nums[i] - t);
    if (lo != null && (long) lo - nums[i] <= t) return true;
    ts.add(nums[i]);
    if (i >= k) ts.remove(nums[i - k]);
}

// Duplicates allowed? Store {value, index} pairs
TreeSet<int[]> multi = new TreeSet<>(
    (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
`),
        warn('A `TreeSet` decides equality by the comparator. If two elements compare as 0, the second is silently dropped. That is why comparing only by value loses duplicates; add a tiebreaker like the index.'),
        drill('Contains Duplicate III, Sliding Window Median, Exam Room, Seat Reservation Manager.'),
      ],
    },
    {
      id: 'arrays',
      title: 'Arrays utility',
      summary: 'Static helpers for sorting, filling, copying and searching arrays.',
      tags: ['arrays', 'sort', 'fill', 'copy', 'binary search'],
      blocks: [
        methods([
          ['`Arrays.sort(int[])`', 'Dual-pivot quicksort on primitives', 'O(n log n)'],
          ['`Arrays.sort(a, from, to)`', 'Sort range [from, to)', 'O(k log k)'],
          ['`Arrays.sort(T[], cmp)`', 'Sort objects (Integer[], int[][]) with comparator', 'O(n log n), stable'],
          ['`Arrays.fill(a, v)`', 'Set every slot', 'O(n)'],
          ['`Arrays.copyOf(a, len)`', 'Copy and pad/truncate', 'O(len)'],
          ['`Arrays.copyOfRange(a, from, to)`', 'Copy [from, to)', 'O(to - from)'],
          ['`Arrays.binarySearch(a, x)`', 'Index, or `-(insertion) - 1`', 'O(log n)'],
          ['`Arrays.equals(a, b)`', 'Element-wise compare', 'O(n)'],
          ['`Arrays.toString(a)` / `deepToString`', 'Debug print', 'O(n)'],
          ['`Arrays.asList(...)`', 'Fixed-size List view over an object array', 'O(1)'],
          ['`Arrays.stream(a)`', 'IntStream over int[]', 'O(n)'],
        ]),
        code(`
int[] a = {5, 2, 9};
Arrays.sort(a);
Arrays.sort(a, 1, 3);                         // only indices 1..2

int[][] intervals = {{1, 3}, {0, 2}};
Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));

Integer[] boxed = {3, 1, 2};
Arrays.sort(boxed, Collections.reverseOrder()); // descending needs Integer[]

int[] dp = new int[n + 1];
Arrays.fill(dp, Integer.MAX_VALUE);
int[][] memo = new int[m][n];
for (int[] row : memo) Arrays.fill(row, -1);   // fill is 1D only

int idx = Arrays.binarySearch(a, 7);
int insertAt = idx >= 0 ? idx : -idx - 1;
int sum = Arrays.stream(a).sum();
`),
        warn('No comparator overload for `int[]`: to sort descending, sort ascending and read backwards, or box to `Integer[]`. `Arrays.asList(intArray)` gives a `List<int[]>` of size 1, not a list of ints. `Arrays.asList` lists cannot `add`/`remove`. `Arrays.fill` on a 2D array fills rows with the same reference. `binarySearch` on duplicates returns any matching index, not the first.'),
        drill('Merge Intervals, Non-overlapping Intervals, Meeting Rooms II, Coin Change (fill), 3Sum (sort first).'),
      ],
    },
    {
      id: 'collections-util',
      title: 'Collections utility',
      summary: 'Static helpers that operate on Lists and other collections.',
      tags: ['collections', 'sort', 'reverse', 'swap', 'unmodifiable'],
      blocks: [
        methods([
          ['`Collections.sort(list)`', 'Stable sort (same as `list.sort(null)`)', 'O(n log n)'],
          ['`Collections.reverse(list)`', 'Reverse in place', 'O(n)'],
          ['`Collections.swap(list, i, j)`', 'Swap two indices', 'O(1)'],
          ['`Collections.max(c)` / `min(c)`', 'Scan for max / min (optional comparator)', 'O(n)'],
          ['`Collections.frequency(c, x)`', 'Count occurrences', 'O(n)'],
          ['`Collections.reverseOrder()`', 'Descending comparator', 'O(1)'],
          ['`Collections.nCopies(n, x)`', 'Immutable list of n copies', 'O(1) view'],
          ['`Collections.unmodifiableList(l)`', 'Read-only view', 'O(1)'],
          ['`Collections.emptyList()`', 'Shared empty immutable list', 'O(1)'],
        ]),
        code(`
List<Integer> list = new ArrayList<>(List.of(3, 1, 2));
Collections.sort(list);
Collections.reverse(list);                 // level order zigzag, path building
Collections.swap(list, 0, 2);
int biggest = Collections.max(list);
int ones = Collections.frequency(list, 1);

// Mutable list of n zeros
List<Integer> zeros = new ArrayList<>(Collections.nCopies(n, 0));

// Hand out internal state safely
return Collections.unmodifiableList(result);
`),
        warn('`nCopies` and `unmodifiableList` throw on `set`/`add`; wrap in `new ArrayList<>(...)` to mutate. Building a list by `add(0, x)` in a loop is O(n²); append then `Collections.reverse` instead.'),
        drill('Binary Tree Zigzag Level Order Traversal, Next Permutation (with a list), Path Sum II.'),
      ],
    },
    {
      id: 'string',
      title: 'String',
      summary: 'Immutable text. Every "change" makes a new String.',
      tags: ['string', 'substring', 'split', 'chars'],
      blocks: [
        methods([
          ['`charAt(i)`', 'Char at index', 'O(1)'],
          ['`length()`', 'Length (method, not field)', 'O(1)'],
          ['`substring(a, b)`', 'New string [a, b)', 'O(b - a) copy'],
          ['`toCharArray()`', 'Mutable char[] copy', 'O(n)'],
          ['`indexOf(s)` / `contains(s)`', 'Search', 'O(n·m) worst'],
          ['`split(regex)`', 'Split by REGEX', 'O(n)'],
          ['`String.join(sep, parts)`', 'Join with separator', 'O(total)'],
          ['`String.valueOf(x)`', 'Any value / char[] to String', 'O(n)'],
          ['`equals(s)` / `compareTo(s)`', 'Content equality / lexicographic order', 'O(n)'],
          ['`trim()` / `strip()`', 'Remove outer whitespace', 'O(n)'],
          ['`chars()`', 'IntStream of chars', 'O(n)'],
          ['`repeat(k)`', 'Repeat k times', 'O(n·k)'],
        ]),
        code(`
String s = "a good   example";
String[] words = s.trim().split("\\\\s+");   // one or more spaces
String back = String.join(" ", words);

String[] parts = "1.2.3".split("\\\\.");    // dot is regex: escape it
String[] pipes = "a|b".split("\\\\|");

char[] cs = s.toCharArray();
Arrays.sort(cs);
String key = new String(cs);               // or String.valueOf(cs)

if (a.equals(b)) { }                       // never a == b
int order = a.compareTo(b);                // < 0 means a first
long vowels = s.chars().filter(ch -> "aeiou".indexOf(ch) >= 0).count();
`),
        warn('`==` compares references, not content. `split` takes a regex: `.` `|` `*` `+` `$` need escaping. `split` drops trailing empty strings (use `split(",", -1)` to keep them) and a leading separator yields a leading empty string. `s += x` in a loop is O(n²); use `StringBuilder`. `substring` copies, so calling it inside a loop adds a hidden factor of n.'),
        drill('Valid Anagram, Reverse Words in a String, Longest Common Prefix, Simplify Path, Compare Version Numbers.'),
      ],
    },
    {
      id: 'stringbuilder',
      title: 'StringBuilder',
      summary: 'Mutable string buffer. Build output in O(n) total instead of O(n²).',
      tags: ['stringbuilder', 'string', 'build', 'reverse'],
      blocks: [
        methods([
          ['`append(x)`', 'Add to end (any type)', 'O(1) amortized'],
          ['`insert(i, x)`', 'Insert at index', 'O(n)'],
          ['`deleteCharAt(i)`', 'Remove one char', 'O(n), O(1) at end'],
          ['`setCharAt(i, c)`', 'Overwrite char', 'O(1)'],
          ['`charAt(i)` / `length()`', 'Read', 'O(1)'],
          ['`reverse()`', 'Reverse in place', 'O(n)'],
          ['`setLength(k)`', 'Truncate to k (fast undo)', 'O(1)'],
          ['`toString()`', 'Snapshot as String', 'O(n)'],
        ]),
        code(`
StringBuilder sb = new StringBuilder();
for (String w : words) sb.append(w).append(' ');
if (sb.length() > 0) sb.setLength(sb.length() - 1);   // drop trailing space

// Backtracking with a builder: append, recurse, undo
void dfs(StringBuilder path, int i) {
    int len = path.length();
    path.append(letters[i]);
    dfs(path, i + 1);
    path.setLength(len);                  // undo in O(1)
}

// Stack-like use: remove adjacent duplicates
for (char c : s.toCharArray()) {
    int n = sb.length();
    if (n > 0 && sb.charAt(n - 1) == c) sb.deleteCharAt(n - 1);
    else sb.append(c);
}
String palCheck = new StringBuilder(s).reverse().toString();
`),
        warn('`StringBuilder` does not override `equals`; compare with `sb.toString().equals(...)` or `sb.compareTo(other)` (Java 11+). `insert(0, x)` in a loop is O(n²); append and reverse once. `sb.append(c + 1)` appends a number, not a char; cast: `(char) (c + 1)`.'),
        drill('Remove All Adjacent Duplicates In String, Letter Combinations of a Phone Number, Decode String, Add Binary, Zigzag Conversion.'),
      ],
    },
    {
      id: 'character',
      title: 'Character and char arithmetic',
      summary: 'Classify and convert chars; map letters to array indices.',
      tags: ['character', 'char', 'ascii', 'digit', 'letter'],
      blocks: [
        methods([
          ['`Character.isDigit(c)`', '0-9 (and other Unicode digits)', 'O(1)'],
          ['`Character.isLetter(c)`', 'Any letter', 'O(1)'],
          ['`Character.isLetterOrDigit(c)`', 'Alphanumeric', 'O(1)'],
          ['`Character.isUpperCase` / `isLowerCase`', 'Case test', 'O(1)'],
          ['`Character.toLowerCase(c)` / `toUpperCase`', 'Case convert', 'O(1)'],
          ['`Character.isWhitespace(c)`', 'Space, tab, newline', 'O(1)'],
          ['`Character.getNumericValue(c)`', `'7' → 7 (also 'a' → 10!)`, 'O(1)'],
          ['`c - \'a\'`', 'Letter to 0..25 index', 'O(1)'],
          ['`c - \'0\'`', 'Digit char to int', 'O(1)'],
          ['`(char) (\'a\' + i)`', 'Index back to letter', 'O(1)'],
        ]),
        code(`
int[] count = new int[26];
for (char c : s.toCharArray()) count[c - 'a']++;

int num = 0;
for (char c : digits.toCharArray()) num = num * 10 + (c - '0');

char next = (char) ('a' + 3);           // 'd'

// Valid Palindrome: skip non-alphanumeric, ignore case
while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;

int[] ascii = new int[128];              // when input is any ASCII
`),
        warn("`c - 'a'` assumes lowercase only; mixed case or digits give negative indices. `char + int` is an `int`, so `String s = c + 1` will not compile and `\"\" + c + 1` gives \"a1\". `getNumericValue('a')` returns 10, not -1, so it is not a digit check."),
        drill('Valid Palindrome, Valid Anagram, String to Integer (atoi), Ransom Note, Find All Anagrams in a String.'),
      ],
    },
    {
      id: 'integer-math',
      title: 'Integer, Long and Math',
      summary: 'Limits, overflow, bit helpers and the math functions that actually matter.',
      tags: ['integer', 'long', 'math', 'overflow', 'modulo', 'bits'],
      blocks: [
        methods([
          ['`Integer.MAX_VALUE` / `MIN_VALUE`', '2^31 - 1 / -2^31', 'O(1)'],
          ['`Long.MAX_VALUE`', '2^63 - 1', 'O(1)'],
          ['`Integer.parseInt(s, radix)`', 'Parse text in base radix', 'O(n)'],
          ['`Integer.toBinaryString(x)`', 'Bits as text (no leading zeros)', 'O(32)'],
          ['`Integer.bitCount(x)`', 'Number of 1 bits', 'O(1)'],
          ['`Integer.highestOneBit(x)`', 'Top set bit as a value', 'O(1)'],
          ['`Integer.numberOfTrailingZeros(x)`', 'Index of lowest set bit', 'O(1)'],
          ['`Math.floorMod(a, m)`', 'Modulo that is never negative', 'O(1)'],
          ['`Math.abs(x)`', 'Absolute value (see trap)', 'O(1)'],
          ['`Math.addExact(a, b)`', 'Throws on overflow', 'O(1)'],
          ['`Math.max` / `min` / `pow` / `sqrt`', 'Basics (`pow` returns double)', 'O(1)'],
        ]),
        code(`
int mid = lo + (hi - lo) / 2;              // not (lo + hi) / 2
long prod = (long) a * b;                  // cast BEFORE multiplying
final int MOD = 1_000_000_007;
long ways = (ways * 2) % MOD;

int r = Math.floorMod(-7, 3);              // 2  (while -7 % 3 == -1)
int ones = Integer.bitCount(n);
String bits = Integer.toBinaryString(5);   // "101"
int fromBin = Integer.parseInt("101", 2);  // 5

// Reverse Integer: detect overflow before it happens
if (res > Integer.MAX_VALUE / 10 || res < Integer.MIN_VALUE / 10) return 0;

int best = Integer.MAX_VALUE;              // "infinity" for min problems
if (best == Integer.MAX_VALUE) return -1;
`),
        warn('`Math.abs(Integer.MIN_VALUE)` is still negative (it overflows). `(long) (a * b)` is too late: the int multiply already overflowed. `dist + w` with `dist = MAX_VALUE` wraps to negative; guard it. `Math.pow(10, 9)` is a double; cast and beware precision for big values. `%` keeps the sign of the left operand.'),
        drill('Reverse Integer, Pow(x, n), Number of 1 Bits, Counting Bits, Sqrt(x), Climbing Stairs (with MOD variants).'),
      ],
    },
    {
      id: 'comparators',
      title: 'Comparators and sorting objects',
      summary: 'Lambdas, records, thenComparing and reversed for any custom order.',
      tags: ['comparator', 'sort', 'record', 'lambda', 'thencomparing'],
      blocks: [
        methods([
          ['`Comparator.comparingInt(f)`', 'Order by an int key, no boxing', 'O(1) per compare'],
          ['`.thenComparing(f)` / `thenComparingInt`', 'Tiebreaker', 'O(1)'],
          ['`.reversed()`', 'Flip the whole chain so far', 'O(1)'],
          ['`Comparator.naturalOrder()` / `reverseOrder()`', 'Default / descending', 'O(1)'],
          ['`Integer.compare(a, b)`', 'Safe -1/0/1 compare', 'O(1)'],
          ['`list.sort(cmp)`', 'Sort a List in place, stable', 'O(n log n)'],
        ]),
        code(`
record Job(String name, int start, int profit) {}
List<Job> jobs = new ArrayList<>();
jobs.sort(Comparator.comparingInt(Job::start)
                    .thenComparing(Job::profit, Comparator.reverseOrder()));

// 2D array by column 1 ascending, then column 0 descending
Arrays.sort(pts, (a, b) -> a[1] != b[1]
        ? Integer.compare(a[1], b[1])
        : Integer.compare(b[0], a[0]));

// Largest Number: custom string order
String[] arr = {"3", "30", "34"};
Arrays.sort(arr, (x, y) -> (y + x).compareTo(x + y));

// Lambda type hint needed before .reversed()
Comparator<int[]> byEnd = Comparator.comparingInt((int[] a) -> a[1]).reversed();
`),
        warn('`(a, b) -> a - b` overflows for values near the int limits (e.g. intervals with -2^31). `.reversed()` reverses everything chained before it, not just the last key. Lambdas chained with `.reversed()` often lose type inference; add the parameter type `(int[] a)`. A comparator must be consistent: never return random or asymmetric results.'),
        drill('Largest Number, Merge Intervals, Minimum Number of Arrows to Burst Balloons, Queue Reconstruction by Height, K Closest Points to Origin.'),
      ],
    },
    {
      id: 'iterators',
      title: 'Iterators and safe removal',
      summary: 'Remove while looping without ConcurrentModificationException.',
      tags: ['iterator', 'remove', 'removeif', 'concurrentmodification'],
      blocks: [
        methods([
          ['`coll.removeIf(pred)`', 'Remove all matching, safely', 'O(n)'],
          ['`it.hasNext()` / `it.next()`', 'Walk manually', 'O(1)'],
          ['`it.remove()`', 'Remove the element just returned', 'O(1) hash, O(n) ArrayList'],
          ['`map.entrySet().removeIf(...)`', 'Drop map entries by condition', 'O(n)'],
          ['`map.values().removeIf(v -> v == 0)`', 'Drop entries by value', 'O(n)'],
        ]),
        code(`
// WRONG: throws ConcurrentModificationException
// for (int x : list) if (x % 2 == 0) list.remove(Integer.valueOf(x));

list.removeIf(x -> x % 2 == 0);

Iterator<Map.Entry<String, Integer>> it = map.entrySet().iterator();
while (it.hasNext()) {
    Map.Entry<String, Integer> e = it.next();
    if (e.getValue() == 0) it.remove();
}

// Removing by index? Loop backwards
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i) < 0) list.remove(i);
}

// Collect keys first, then modify
List<String> toDrop = new ArrayList<>();
`),
        warn('Any structural change (add/remove) through the collection itself during a for-each throws `ConcurrentModificationException`. Changing a value with `map.put(existingKey, v)` is fine. Forward index loops with `remove(i)` skip the next element.'),
        drill('Design a Leaderboard, Insert Delete GetRandom O(1) (swap-with-last removal), Snapshot Array.'),
      ],
    },
    {
      id: 'streams',
      title: 'Streams (use sparingly)',
      summary: 'Handy one-liners for setup and output; too slow for hot loops.',
      tags: ['streams', 'lambda', 'intstream', 'collectors'],
      blocks: [
        methods([
          ['`Arrays.stream(a).sum()` / `.max().getAsInt()`', 'Aggregate an int[]', 'O(n)'],
          ['`IntStream.range(0, n)`', 'Index stream [0, n)', 'O(n)'],
          ['`list.stream().mapToInt(i -> i).toArray()`', 'List<Integer> → int[]', 'O(n)'],
          ['`Arrays.stream(a).boxed().collect(Collectors.toList())`', 'int[] → List<Integer>', 'O(n)'],
          ['`Collectors.groupingBy(f)`', 'Group into Map<K, List<V>>', 'O(n)'],
          ['`Collectors.counting()`', 'Count per group', 'O(n)'],
          ['`.sorted()` / `.distinct()` / `.filter()` / `.map()`', 'Pipeline steps', 'O(n log n) / O(n)'],
        ]),
        code(`
int total = Arrays.stream(nums).sum();
int maxVal = Arrays.stream(nums).max().getAsInt();
int[] arr = list.stream().mapToInt(Integer::intValue).toArray();

Map<String, List<String>> groups = Arrays.stream(words)
    .collect(Collectors.groupingBy(w -> {
        char[] c = w.toCharArray(); Arrays.sort(c); return new String(c);
    }));

Map<Integer, Long> freq = Arrays.stream(nums).boxed()
    .collect(Collectors.groupingBy(x -> x, Collectors.counting()));
`),
        warn('Streams can be 2-5x slower than a plain loop and box values. Never put a stream inside a loop that runs n times. `Arrays.stream(a).sum()` returns `int` and can overflow; use `.asLongStream().sum()` when needed. `getAsInt()` throws on an empty array.'),
        tip('Use streams for setup and final formatting. Use loops for the algorithm itself. In interviews, a clear loop reads better than a clever chain.', 'Rule of thumb'),
      ],
    },
    {
      id: 'conversions',
      title: 'Common conversions',
      summary: 'Moving data between arrays, lists, strings and maps.',
      tags: ['convert', 'toarray', 'list', 'array', 'string'],
      blocks: [
        {
          type: 'table',
          title: 'From → to',
          head: ['From → To', 'How', 'Time'],
          rows: [
            ['int[] → List<Integer>', '`Arrays.stream(a).boxed().toList()` or a loop', 'O(n)'],
            ['List<Integer> → int[]', '`list.stream().mapToInt(i -> i).toArray()`', 'O(n)'],
            ['List<String> → String[]', '`list.toArray(new String[0])`', 'O(n)'],
            ['List<int[]> → int[][]', '`list.toArray(new int[0][])`', 'O(n)'],
            ['char[] → String', '`new String(cs)` or `String.valueOf(cs)`', 'O(n)'],
            ['String → char[]', '`s.toCharArray()`', 'O(n)'],
            ['char → String', '`String.valueOf(c)`', 'O(1)'],
            ['int → String', '`String.valueOf(x)` or `Integer.toString(x)`', 'O(digits)'],
            ['String → int', '`Integer.parseInt(s)`', 'O(n)'],
            ['Map → sorted entry list', '`new ArrayList<>(map.entrySet())` then `sort`', 'O(n log n)'],
            ['Set → List', '`new ArrayList<>(set)`', 'O(n)'],
          ],
        },
        code(`
int[] a = {1, 2, 3};
List<Integer> list = new ArrayList<>();
for (int x : a) list.add(x);                    // simplest, fastest

int[] back = list.stream().mapToInt(i -> i).toArray();

List<int[]> merged = new ArrayList<>();
return merged.toArray(new int[0][]);            // Merge Intervals return

List<Map.Entry<Integer, Integer>> entries = new ArrayList<>(count.entrySet());
entries.sort((x, y) -> y.getValue() - x.getValue());   // by count desc

String s = new String(chars);                   // NOT chars.toString()
`),
        warn('`chars.toString()` prints something like `[C@1b6d3586`, not the text. `Stream.toList()` (Java 16+) returns an immutable list. `List.toArray()` with no argument returns `Object[]`, which you cannot cast to `Integer[]`.'),
        drill('Merge Intervals (List<int[]> → int[][]), Top K Frequent Elements (map → sorted), Intersection of Two Arrays (set → int[]).'),
      ],
    },
    {
      id: 'generics-boxing',
      title: 'Generics and boxing traps',
      summary: 'Integer is not int. The bugs that pass small tests and fail big ones.',
      tags: ['boxing', 'integer cache', 'generics', 'autoboxing', 'equals'],
      blocks: [
        {
          type: 'table',
          title: 'Traps',
          head: ['Trap', 'What goes wrong', 'Fix'],
          rows: [
            ['`Integer a == Integer b`', 'True for -128..127 (cached), false above', '`a.equals(b)` or unbox to `int`'],
            ['`map.get(x) == map.get(y)`', 'Same cache bug with map values', '`.equals` or `(int)` cast'],
            ['`int v = map.get(k)`', 'NPE when key is missing', '`getOrDefault(k, 0)`'],
            ['`List<int>`', 'Does not compile: generics need objects', '`List<Integer>` or `List<int[]>`'],
            ['Boxing in hot loops', 'Allocations and cache misses, slower', 'Use `int[]` for counts'],
            ['`new T[n]`', 'Generic array creation not allowed', 'Use `List<T>` or cast `Object[]`'],
            ['`List<Integer>[] adj = new List[n]`', 'Works with an unchecked warning', 'Or `List<List<Integer>>`'],
          ],
        },
        code(`
Integer a = 1000, b = 1000;
System.out.println(a == b);           // false!
System.out.println(a.equals(b));      // true

// Classic failing line in sliding window problems
if (window.get(c).intValue() == need.get(c).intValue()) formed++;

// Pairs without a class: List<int[]>
List<int[]> edges = new ArrayList<>();
edges.add(new int[]{u, v});

// Adjacency list
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
`),
        warn('This bug hides until a test case has counts above 127. If your solution passes small tests but fails a big one, search for `==` between two boxed values first.'),
        drill('Minimum Window Substring (the classic boxed `==` bug), Course Schedule (adjacency list), Find the Town Judge.'),
      ],
    },
    {
      id: 'performance',
      title: 'Performance tips for LeetCode Java',
      summary: 'Small habits that turn TLE into Accepted.',
      tags: ['performance', 'tle', 'recursion', 'speed', 'memory'],
      blocks: [
        {
          type: 'list',
          title: 'Do',
          items: [
            'Use `int[26]` / `int[128]` / `boolean[n]` when keys are small dense ints or chars.',
            'Use `ArrayDeque` over `LinkedList` and `Stack`.',
            'Use `StringBuilder` for building strings in loops.',
            'Cast to `long` before multiplying or summing large values.',
            'Use `int[][] memo` filled with -1 over `HashMap<String, Integer>` memo keys.',
            'Encode 2D cells as `r * cols + c` instead of strings like `r + "," + c`.',
            'Pre-size big collections: `new ArrayList<>(n)`, `new HashMap<>(2 * n)`.',
          ],
        },
        {
          type: 'list',
          title: 'Do not',
          items: [
            'Do not add fast I/O (`BufferedReader`): LeetCode calls your method directly.',
            'Do not recurse 10^5 deep: Java stack overflows around 10^4 frames. Go iterative or bottom-up DP.',
            'Do not use streams or `String.format` inside tight loops.',
            'Do not call `list.contains` or `list.remove(Object)` in a loop: that is hidden O(n²).',
            'Do not print debug output in the final submission; it is slow.',
          ],
        },
        code(`
// Memo with an array instead of a map
int[][] memo = new int[m][n];
for (int[] row : memo) Arrays.fill(row, -1);

// Iterative DFS to dodge stack overflow on deep inputs
Deque<Integer> stack = new ArrayDeque<>();
stack.push(start);
while (!stack.isEmpty()) {
    int node = stack.pop();
    if (seen[node]) continue;
    seen[node] = true;
    for (int nb : adj.get(node)) if (!seen[nb]) stack.push(nb);
}
`, 'Speed idioms'),
        warn('Runtime percentile on LeetCode is noisy; the same code can vary 2x. Focus on the Big-O and on removing boxing, not on chasing the beats-% number.'),
        drill('Number of Islands (iterative vs recursive), Longest Increasing Path in a Matrix (int[][] memo), Course Schedule II.'),
      ],
    },
  ],
};
