// Codex tab: Data Structures. Shape defined in ./schema.js.
// Text strings use double quotes so apostrophes are safe; code blocks use template literals.

export default {
  key: "structures",
  label: "Data Structures",
  intro: "Your weapon rack. Each structure is fast at a few moves and slow at the rest; pick the one whose fast moves match what the problem keeps asking for.",
  sections: [
    // ------------------------------------------------------------------ overview
    {
      id: "overview",
      title: "Pick Your Weapon",
      summary: "Which structure for which operation, on one screen.",
      tags: ["overview", "cheat sheet", "complexity", "choose"],
      blocks: [
        {
          type: "text",
          text: "Read the problem. Find the operation it repeats most (lookup? min? order? range sum?). Pick the structure that makes that operation cheap.",
        },
        {
          type: "table",
          title: "Which structure for which operation",
          head: ["Structure", "Fast at", "Slow at", "Java class"],
          rows: [
            ["Array", "Index access O(1)", "Insert/delete in middle O(n)", "`int[]`"],
            ["Dynamic array", "Append amortized O(1), index O(1)", "Search O(n), insert front O(n)", "`ArrayList`"],
            ["String builder", "Append O(1) amortized", "Insert at front O(n)", "`StringBuilder`"],
            ["HashMap", "Get/put by key O(1) avg", "Ordered iteration, min/max", "`HashMap`"],
            ["HashSet", "Contains/add O(1) avg", "Order, min/max", "`HashSet`"],
            ["Linked list", "Insert/delete at known node O(1)", "Index access O(n)", "`ListNode` (own class)"],
            ["Stack", "Push/pop top O(1)", "Anything below the top", "`ArrayDeque`"],
            ["Queue / Deque", "Add/remove at both ends O(1)", "Middle access", "`ArrayDeque`"],
            ["Monotonic stack/deque", "Next greater / window max, O(n) total", "Arbitrary queries", "`ArrayDeque<Integer>`"],
            ["Heap", "Peek min O(1), push/pop O(log n)", "Search O(n), sorted iteration", "`PriorityQueue`"],
            ["BST / TreeMap", "Floor/ceiling/order O(log n)", "Constant factor vs HashMap", "`TreeMap`, `TreeSet`"],
            ["Trie", "Prefix lookup O(L)", "Memory", "`TrieNode` (own class)"],
            ["Graph (adj list)", "Neighbor iteration O(deg)", "Edge check O(deg)", "`List<List<Integer>>`"],
            ["Union-Find", "Union/connected ~O(1)", "Splitting sets, listing members", "`int[] parent` (own)"],
            ["Segment tree", "Range query + point update O(log n)", "Code size", "own class"],
            ["Fenwick tree", "Prefix sum + point update O(log n)", "Range min/max", "`int[] bit` (own)"],
            ["Bitmask", "Set ops on <=32/64 items O(1)", "More than 64 items", "`int`, `long`, `BitSet`"],
          ],
        },
        {
          type: "callout",
          tone: "key",
          title: "Clue to structure",
          text: "\"Seen before?\" -> HashSet. \"How many times?\" -> HashMap. \"K largest\" -> heap. \"Next greater\" -> monotonic stack. \"Connected?\" -> Union-Find or BFS. \"Prefix\" -> Trie. \"Range sum with updates\" -> Fenwick.",
        },
      ],
    },

    // ------------------------------------------------------------------ array
    {
      id: "array",
      title: "Array & Dynamic Array",
      summary: "Contiguous memory: instant index access, slow middle edits.",
      tags: ["array", "arraylist", "list", "index", "prefix sum"],
      blocks: [
        {
          type: "text",
          text: "A fixed block of slots you reach by index in O(1). Superpower: random access and cache-friendly scans. Weakness: inserting or deleting in the middle shifts everything. `ArrayList` grows itself when full.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Access by index", "O(1)", "`a[i]`, `list.get(i)`"],
            ["Update by index", "O(1)", "`a[i] = x`, `list.set(i, x)`"],
            ["Append", "O(1) amortized", "`list.add(x)`"],
            ["Insert/remove middle", "O(n)", "`list.add(i, x)`, `list.remove(i)`"],
            ["Search (unsorted)", "O(n)", "loop / `list.contains(x)`"],
            ["Search (sorted)", "O(log n)", "`Arrays.binarySearch(a, x)`"],
            ["Sort", "O(n log n)", "`Arrays.sort(a)`, `list.sort(null)`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Input is already an array and you need two pointers or a sliding window.",
            "Values are small ints (e.g. 0..10^5) -> use `int[] count` instead of a HashMap.",
            "You need range sums repeatedly -> build a prefix-sum array.",
            "You need the answer list of unknown size -> `ArrayList`.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int[] a = new int[n];                 // all zeros
Arrays.fill(a, -1);                   // fill with a sentinel
int[] copy = Arrays.copyOf(a, n);     // or a.clone()

// prefix sums: sum of a[l..r] = pre[r + 1] - pre[l]
int[] pre = new int[n + 1];
for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];

List<Integer> list = new ArrayList<>();
list.add(5);
list.get(0);
list.remove(list.size() - 1);         // pop from end: O(1)

// sort 2D array by first column
int[][] pairs = new int[m][2];
Arrays.sort(pairs, (x, y) -> Integer.compare(x[0], y[0]));

// List<Integer> -> int[]
int[] out = list.stream().mapToInt(Integer::intValue).toArray();`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "`list.remove(1)` removes index 1, not value 1; use `list.remove(Integer.valueOf(1))`. `Arrays.asList(intArray)` gives a list of one `int[]`. Comparator `(x, y) -> x[0] - y[0]` can overflow; use `Integer.compare`. Prefix sums of big values need `long`.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Running Sum of 1d Array**, then **Range Sum Query - Immutable** with a prefix array, then **Product of Array Except Self** without division.",
        },
      ],
    },

    // ------------------------------------------------------------------ string
    {
      id: "string",
      title: "String & StringBuilder",
      summary: "Immutable text vs a mutable buffer you build answers in.",
      tags: ["string", "stringbuilder", "char", "text", "palindrome"],
      blocks: [
        {
          type: "text",
          text: "A Java `String` is immutable: every `+` in a loop makes a new copy. `StringBuilder` is a growable char buffer for building output. For char-level work, convert to `char[]` once.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Char at index", "O(1)", "`s.charAt(i)`"],
            ["Length", "O(1)", "`s.length()` (method, not field)"],
            ["Substring", "O(k)", "`s.substring(i, j)` (j exclusive)"],
            ["Equals", "O(n)", "`s.equals(t)`"],
            ["Append to builder", "O(1) amortized", "`sb.append(x)`"],
            ["Reverse builder", "O(n)", "`sb.reverse()`"],
            ["Delete last char", "O(1)", "`sb.deleteCharAt(sb.length() - 1)`"],
            ["Find substring", "O(n*m) worst", "`s.indexOf(t)`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Anagram / letter count -> `int[26]` indexed by `c - 'a'`.",
            "Building an answer char by char, or backtracking a path -> `StringBuilder` with append + deleteCharAt.",
            "In-place edits like reverse or swap -> `char[] cs = s.toCharArray()`.",
            "Splitting words -> `s.trim().split(\"\\\\s+\")`.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `char[] cs = s.toCharArray();
int[] freq = new int[26];
for (char c : cs) freq[c - 'a']++;

StringBuilder sb = new StringBuilder();
sb.append('x').append(42).append("ab");
sb.setLength(sb.length() - 1);       // undo last char (backtracking)
String out = sb.reverse().toString();

// char helpers
Character.isDigit(c);
Character.isLetterOrDigit(c);
Character.toLowerCase(c);
int digit = c - '0';
char next = (char) ('a' + 1);        // cast back to char

String key = new String(cs);         // char[] -> String (e.g. sorted anagram key)
String joined = String.join(",", words);`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Never compare strings with `==`; use `.equals`. `s += c` in a loop is O(n^2). `'a' + 1` is an `int` (98), not a char. `sb.reverse()` mutates the builder in place. `split` takes a regex, so `split(\".\")` splits on everything.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Do **Valid Anagram** with `int[26]`, **Reverse Words in a String** with split + StringBuilder, and **Valid Palindrome** with two pointers on `char[]`.",
        },
      ],
    },

    // ------------------------------------------------------------------ hashmap
    {
      id: "hashmap",
      title: "HashMap",
      summary: "Key -> value in O(1) average. The most used tool in the gym.",
      tags: ["hashmap", "map", "dictionary", "counting", "lookup", "two sum"],
      blocks: [
        {
          type: "text",
          text: "Stores key/value pairs in buckets by hash. Superpower: O(1) average get/put/contains, which turns many O(n^2) brute forces into O(n). Weakness: no order, no min/max, extra memory.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Get", "O(1) avg", "`map.get(k)` (null if absent)"],
            ["Get with default", "O(1) avg", "`map.getOrDefault(k, 0)`"],
            ["Put / overwrite", "O(1) avg", "`map.put(k, v)`"],
            ["Count up", "O(1) avg", "`map.merge(k, 1, Integer::sum)`"],
            ["Contains key", "O(1) avg", "`map.containsKey(k)`"],
            ["Remove", "O(1) avg", "`map.remove(k)`"],
            ["Group into lists", "O(1) avg", "`map.computeIfAbsent(k, x -> new ArrayList<>()).add(v)`"],
            ["Iterate", "O(n)", "`for (var e : map.entrySet())`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "\"Have I seen the complement before?\" (Two Sum).",
            "Count frequencies of anything.",
            "Group items by a computed key (anagrams, same pattern).",
            "Prefix sum + \"how many earlier prefixes equal sum - k\".",
            "Memoization with a composite key.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `Map<Integer, Integer> idx = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    Integer j = idx.get(target - nums[i]);
    if (j != null) return new int[]{j, i};
    idx.put(nums[i], i);
}

Map<Character, Integer> count = new HashMap<>();
for (char c : s.toCharArray()) count.merge(c, 1, Integer::sum);

Map<String, List<String>> groups = new HashMap<>();
groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);

// subarray sum equals k
Map<Integer, Integer> seen = new HashMap<>(Map.of(0, 1));
int sum = 0, ans = 0;
for (int x : nums) {
    sum += x;
    ans += seen.getOrDefault(sum - k, 0);
    seen.merge(sum, 1, Integer::sum);
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Comparing two `Integer` values from maps with `==` works only for -128..127 (Integer cache); use `.equals` or unbox to `int`. Unboxing a missing key (`int v = map.get(k)`) throws NullPointerException. Removing while looping over `keySet()` throws ConcurrentModificationException; use `iterator.remove()` or `removeIf`. Arrays as keys hash by identity; use `Arrays.toString(a)` or a String key.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Back to back: **Two Sum**, **Group Anagrams**, **Subarray Sum Equals K**. Say out loud what the key and the value mean before typing.",
        },
      ],
    },

    // ------------------------------------------------------------------ hashset
    {
      id: "hashset",
      title: "HashSet",
      summary: "Membership test in O(1). A HashMap without values.",
      tags: ["hashset", "set", "unique", "duplicate", "visited"],
      blocks: [
        {
          type: "text",
          text: "A set of unique items with O(1) average add/contains/remove. Superpower: dedupe and \"seen it?\" checks. Weakness: no order, no counts.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Add", "O(1) avg", "`set.add(x)` (returns false if already there)"],
            ["Contains", "O(1) avg", "`set.contains(x)`"],
            ["Remove", "O(1) avg", "`set.remove(x)`"],
            ["Size", "O(1)", "`set.size()`"],
            ["Intersection", "O(min)", "`a.retainAll(b)`"],
            ["Union", "O(n)", "`a.addAll(b)`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Detect duplicates.",
            "Visited set for BFS/DFS on non-grid graphs.",
            "Sliding window of distinct elements.",
            "Longest consecutive sequence: only start counting at x where x-1 is missing.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `Set<Integer> seen = new HashSet<>();
for (int x : nums) {
    if (!seen.add(x)) return true;      // add() == false means duplicate
}

// longest consecutive sequence, O(n)
Set<Integer> all = new HashSet<>();
for (int x : nums) all.add(x);
int best = 0;
for (int x : all) {
    if (all.contains(x - 1)) continue;  // not a run start
    int len = 1;
    while (all.contains(x + len)) len++;
    best = Math.max(best, len);
}

// grid cell as one key
Set<Integer> visited = new HashSet<>();
visited.add(r * cols + c);`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "A `Set<int[]>` will not find equal arrays (identity hash); encode as `r * cols + c` or a `List<Integer>`. Do not mutate an object after putting it in a set. On a grid, a `boolean[][]` is faster than a HashSet.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (12 min)",
          text: "Solve **Contains Duplicate**, **Longest Consecutive Sequence**, and **Intersection of Two Arrays**.",
        },
      ],
    },

    // ------------------------------------------------------------------ linked list
    {
      id: "linked-list",
      title: "Linked List",
      summary: "Nodes chained by pointers: cheap splicing, no indexing.",
      tags: ["linked list", "listnode", "dummy", "fast slow", "reverse", "pointer"],
      blocks: [
        {
          type: "text",
          text: "Each node holds a value and a `next` pointer (doubly: also `prev`). Superpower: insert or delete at a node you already hold in O(1). Weakness: reaching the k-th node is O(k).",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Access k-th", "O(k)", "walk `cur = cur.next`"],
            ["Insert after node", "O(1)", "`n.next = cur.next; cur.next = n;`"],
            ["Delete next node", "O(1)", "`cur.next = cur.next.next;`"],
            ["Find middle", "O(n)", "slow/fast pointers"],
            ["Reverse", "O(n)", "prev/cur/next loop"],
            ["Built-in deque", "O(1) ends", "`LinkedList` (rarely needed; prefer `ArrayDeque`)"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "The problem hands you a `ListNode head`.",
            "Head might change -> start with a dummy node.",
            "Cycle, middle, or k-th from end -> fast/slow pointers.",
            "O(1) removal of arbitrary items (LRU) -> doubly linked list + map.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `ListNode dummy = new ListNode(0, head); // dummy before head
ListNode cur = dummy;

// reverse
ListNode prev = null, node = head;
while (node != null) {
    ListNode next = node.next;
    node.next = prev;
    prev = node;
    node = next;
}                                       // prev is the new head

// middle / cycle
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) break;            // cycle found
}

return dummy.next;                      // not head: head may have moved`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Save `next` before you overwrite `node.next`, or you lose the rest of the list. Always check `fast != null && fast.next != null` in that order. Returning `head` instead of `dummy.next` after removing the first node. Draw 3 boxes on paper before coding pointer swaps.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Write **Reverse Linked List** from memory, then **Remove Nth Node From End of List** (dummy + gap pointers), then **Linked List Cycle**.",
        },
      ],
    },

    // ------------------------------------------------------------------ stack
    {
      id: "stack",
      title: "Stack",
      summary: "Last in, first out. Matching, undo, and nested structure.",
      tags: ["stack", "lifo", "parentheses", "arraydeque", "dfs"],
      blocks: [
        {
          type: "text",
          text: "Only the top is visible. Superpower: remembers the most recent unfinished thing, perfect for nesting. Weakness: you cannot look below the top cheaply.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java (`Deque<Integer> st = new ArrayDeque<>()`)"],
          rows: [
            ["Push", "O(1)", "`st.push(x)`"],
            ["Pop", "O(1)", "`st.pop()` (throws if empty)"],
            ["Peek top", "O(1)", "`st.peek()` (null if empty)"],
            ["Empty?", "O(1)", "`st.isEmpty()`"],
            ["Size", "O(1)", "`st.size()`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Brackets, tags, or anything that opens and closes.",
            "Evaluate expressions (RPN, calculator).",
            "Simplify paths (`..` pops).",
            "Iterative DFS or iterative inorder traversal.",
            "\"Undo\" the last action, or decode nested strings like `3[a2[c]]`.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `Deque<Character> st = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if (c == '(' || c == '[' || c == '{') {
        st.push(c);
    } else {
        if (st.isEmpty()) return false;
        char open = st.pop();
        if (c == ')' && open != '(') return false;
        if (c == ']' && open != '[') return false;
        if (c == '}' && open != '{') return false;
    }
}
return st.isEmpty();`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Do not use the old `Stack` class (synchronized, slow). `ArrayDeque` rejects `null`. Iterating an `ArrayDeque` used as a stack goes top to bottom. Forgetting the final `isEmpty()` check leaves unclosed brackets.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Valid Parentheses**, **Evaluate Reverse Polish Notation**, and **Min Stack** (keep a second stack of running minimums).",
        },
      ],
    },

    // ------------------------------------------------------------------ queue / deque
    {
      id: "queue-deque",
      title: "Queue & Deque",
      summary: "First in, first out; a deque works at both ends. Powers BFS.",
      tags: ["queue", "deque", "fifo", "bfs", "arraydeque"],
      blocks: [
        {
          type: "text",
          text: "A queue serves items in arrival order. A deque (double-ended queue) adds and removes at both ends in O(1). Superpower: level-by-level processing. Weakness: no random access.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java (`ArrayDeque`)"],
          rows: [
            ["Enqueue back", "O(1)", "`q.offer(x)` / `offerLast`"],
            ["Dequeue front", "O(1)", "`q.poll()` (null if empty) / `pollFirst`"],
            ["Peek front", "O(1)", "`q.peek()` / `peekFirst`"],
            ["Add front", "O(1)", "`dq.offerFirst(x)`"],
            ["Remove back", "O(1)", "`dq.pollLast()`"],
            ["Peek back", "O(1)", "`dq.peekLast()`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Shortest path in an unweighted graph or grid -> BFS with a queue.",
            "Level order traversal of a tree.",
            "Multi-source spread (rotting oranges, walls and gates): enqueue all sources first.",
            "0-1 BFS: weight-0 edges go to the front, weight-1 to the back.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `// level order BFS
Queue<TreeNode> q = new ArrayDeque<>();
q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();               // freeze level size first
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < size; i++) {
        TreeNode n = q.poll();
        level.add(n.val);
        if (n.left != null) q.offer(n.left);
        if (n.right != null) q.offer(n.right);
    }
    res.add(level);
}

Deque<Integer> dq = new ArrayDeque<>();
dq.offerFirst(1);
dq.offerLast(2);
int front = dq.pollFirst(), back = dq.pollLast();`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Using `q.size()` in the for-condition while adding children breaks level boundaries; store it first. `ArrayDeque` throws on `null`, so check children before offering. `add`/`remove` throw on failure, `offer`/`poll` return false/null. Mark visited when you **enqueue**, not when you dequeue, or nodes get added many times.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Binary Tree Level Order Traversal**, **Rotting Oranges** (multi-source), and **Design Circular Deque**.",
        },
      ],
    },

    // ------------------------------------------------------------------ monotonic
    {
      id: "monotonic",
      title: "Monotonic Stack / Deque",
      summary: "A stack or deque kept sorted by popping losers. Next-greater and window max in O(n).",
      tags: ["monotonic stack", "monotonic queue", "next greater", "sliding window maximum", "histogram"],
      blocks: [
        {
          type: "text",
          text: "A stack (or deque) whose values stay increasing or decreasing. Before pushing, pop everything the new item beats. Each index is pushed and popped once, so the total is O(n).",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Push with pops", "O(1) amortized", "`while (!st.isEmpty() && a[st.peek()] < a[i]) st.pop(); st.push(i);`"],
            ["Next greater for all i", "O(n) total", "answer set when an index is popped"],
            ["Window max (deque)", "O(1) amortized per step", "`dq.peekFirst()` is the max index"],
            ["Expire old index", "O(1)", "`if (dq.peekFirst() <= i - k) dq.pollFirst();`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "\"Next greater/smaller element\" or \"how many days until warmer\".",
            "Largest rectangle in a histogram, trapping rain water.",
            "Max or min of every window of size k.",
            "Remove k digits to make the smallest number.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `// next greater element to the right (decreasing stack of indices)
int[] ans = new int[n];
Arrays.fill(ans, -1);
Deque<Integer> st = new ArrayDeque<>();
for (int i = 0; i < n; i++) {
    while (!st.isEmpty() && a[st.peek()] < a[i]) ans[st.pop()] = a[i];
    st.push(i);
}

// sliding window maximum (deque of indices, values decreasing)
Deque<Integer> dq = new ArrayDeque<>();
for (int i = 0; i < n; i++) {
    if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
    while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
    dq.offerLast(i);
    if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Store **indices**, not values, so you can compute distances and expire old items. `<` vs `<=` decides how duplicates behave; pick deliberately. Circular arrays: loop `2n` times with `i % n`. Leftover stack items at the end still need a default answer.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Daily Temperatures**, **Sliding Window Maximum**, then **Largest Rectangle in Histogram**.",
        },
      ],
    },

    // ------------------------------------------------------------------ heap
    {
      id: "heap",
      title: "Heap / PriorityQueue",
      summary: "Always hands you the smallest (or largest) in O(log n).",
      tags: ["heap", "priority queue", "top k", "kth largest", "dijkstra", "merge k"],
      blocks: [
        {
          type: "text",
          text: "A binary tree packed in an array where each parent beats its children. Superpower: O(1) peek and O(log n) push/pop of the best item. Weakness: search and sorted iteration are not supported.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java (`PriorityQueue`)"],
          rows: [
            ["Peek min/max", "O(1)", "`pq.peek()`"],
            ["Push", "O(log n)", "`pq.offer(x)`"],
            ["Pop best", "O(log n)", "`pq.poll()`"],
            ["Build from list", "O(n)", "`new PriorityQueue<>(list)`"],
            ["Remove arbitrary", "O(n)", "`pq.remove(x)` (avoid)"],
            ["Contains", "O(n)", "`pq.contains(x)` (avoid)"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "\"K largest / K smallest / K closest\" -> heap of size k.",
            "Merge k sorted lists or arrays.",
            "Dijkstra or any \"always expand the cheapest next\".",
            "Running median -> two heaps.",
            "Scheduling: earliest ending meeting, task cooldowns.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// k largest: keep a min-heap of size k
for (int x : nums) {
    minHeap.offer(x);
    if (minHeap.size() > k) minHeap.poll();
}
int kth = minHeap.peek();

// arrays: sort by distance, then by id
PriorityQueue<int[]> pq = new PriorityQueue<>(
    (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
pq.offer(new int[]{dist, node});
int[] top = pq.poll();`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Iterating or printing a PriorityQueue is **not** in sorted order; only `poll()` gives order. Comparator `a - b` overflows on large or negative values. `pq.remove(x)` is O(n); for Dijkstra, push duplicates and skip stale entries instead. Changing an object's priority after inserting it corrupts the heap.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Kth Largest Element in an Array**, **Top K Frequent Elements**, and **Merge k Sorted Lists**.",
        },
      ],
    },

    // ------------------------------------------------------------------ binary tree
    {
      id: "binary-tree",
      title: "Binary Tree",
      summary: "Nodes with left and right children. Recursion's home turf.",
      tags: ["tree", "binary tree", "dfs", "recursion", "traversal", "treenode"],
      blocks: [
        {
          type: "text",
          text: "Each node has up to two children. Superpower: most problems split into \"solve left, solve right, combine\". Weakness: no ordering, so search is O(n), and skewed trees get deep.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Visit all nodes (DFS)", "O(n)", "recursion: pre/in/post order"],
            ["Level order (BFS)", "O(n)", "`ArrayDeque` queue"],
            ["Height", "O(n)", "`1 + max(h(left), h(right))`"],
            ["Search value", "O(n)", "DFS"],
            ["Space (recursion)", "O(h)", "h = log n balanced, n skewed"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Input is a `TreeNode root`.",
            "Answer for a node depends on answers of its children -> post-order, return a value up.",
            "Need info from ancestors -> pass parameters down (pre-order).",
            "Anything \"per level\" or \"right side view\" -> BFS.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int maxDepth(TreeNode root) {
    if (root == null) return 0;              // base case first
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// global answer + return value (diameter pattern)
int best = 0;
int depth(TreeNode n) {
    if (n == null) return 0;
    int l = depth(n.left), r = depth(n.right);
    best = Math.max(best, l + r);            // answer through this node
    return 1 + Math.max(l, r);               // what the parent needs
}

// iterative inorder
Deque<TreeNode> st = new ArrayDeque<>();
TreeNode cur = root;
while (cur != null || !st.isEmpty()) {
    while (cur != null) { st.push(cur); cur = cur.left; }
    cur = st.pop();
    visit(cur);
    cur = cur.right;
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Missing the `null` base case. A skewed tree of 10^5 nodes can overflow the call stack; go iterative if depth may be huge. Mixing up \"what I return to my parent\" and \"the global answer\". Leaf check is `left == null && right == null`, not just one side.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Maximum Depth of Binary Tree**, **Diameter of Binary Tree**, and **Binary Tree Right Side View**.",
        },
      ],
    },

    // ------------------------------------------------------------------ bst / treemap
    {
      id: "bst-treemap",
      title: "BST, TreeMap & TreeSet",
      summary: "Sorted keys with O(log n) floor, ceiling, and ordered walks.",
      tags: ["bst", "binary search tree", "treemap", "treeset", "floor", "ceiling", "ordered"],
      blocks: [
        {
          type: "text",
          text: "In a BST, left < node < right, so inorder traversal is sorted. Java's `TreeMap`/`TreeSet` are balanced (red-black) BSTs: guaranteed O(log n). Superpower: nearest-key queries. Weakness: slower than hashing for plain lookup.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java (`TreeMap` / `TreeSet`)"],
          rows: [
            ["Get / put / remove", "O(log n)", "`map.get`, `map.put`, `map.remove`"],
            ["Min / max", "O(log n)", "`firstKey()`, `lastKey()` / `first()`, `last()`"],
            ["Largest <= x", "O(log n)", "`floorKey(x)` / `floor(x)`"],
            ["Smallest >= x", "O(log n)", "`ceilingKey(x)` / `ceiling(x)`"],
            ["Strictly < / >", "O(log n)", "`lowerKey`, `higherKey`"],
            ["Pop min", "O(log n)", "`pollFirstEntry()` / `pollFirst()`"],
            ["Range view", "O(log n + k)", "`subMap(a, true, b, false)`, `headMap`, `tailMap`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "\"Closest value to x\" or \"next booking after time t\".",
            "Calendar / interval booking with overlap checks.",
            "Need a heap that also supports delete of any element.",
            "Input is a BST: use inorder for sorted order, or prune with `val` comparisons.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `TreeMap<Integer, Integer> tm = new TreeMap<>();
tm.put(10, 20);                       // start -> end
Integer prev = tm.floorKey(15);       // 10, or null
Integer next = tm.ceilingKey(15);     // null here
Map.Entry<Integer, Integer> lo = tm.firstEntry();

TreeSet<Integer> ts = new TreeSet<>(List.of(1, 5, 9));
ts.ceiling(6);                        // 9
ts.pollFirst();                       // removes 1

// validate BST with bounds
boolean valid(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "`floorKey` returns `null` when nothing qualifies; unboxing it to `int` crashes. A TreeSet drops duplicates (see Ordered Multiset). Validating a BST by comparing only parent and child is wrong; pass min/max bounds, using `long` for edge values.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Validate Binary Search Tree**, **Kth Smallest Element in a BST**, and **My Calendar I** with a TreeMap.",
        },
      ],
    },

    // ------------------------------------------------------------------ ordered multiset
    {
      id: "ordered-multiset",
      title: "Ordered Multiset (TreeMap counts)",
      summary: "Java has no multiset; fake one with TreeMap<value, count>.",
      tags: ["multiset", "treemap", "duplicates", "sliding window", "median"],
      blocks: [
        {
          type: "text",
          text: "A sorted bag that allows duplicates, built as `TreeMap<Integer, Integer>` from value to count. Gives min, max, and removal of any one copy in O(log n).",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Add x", "O(log n)", "`tm.merge(x, 1, Integer::sum)`"],
            ["Remove one x", "O(log n)", "decrement, remove key at 0"],
            ["Min / max", "O(log n)", "`tm.firstKey()`, `tm.lastKey()`"],
            ["Distinct count", "O(1)", "`tm.size()`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Sliding window that needs current max minus min.",
            "Heap that must delete arbitrary elements.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `TreeMap<Integer, Integer> bag = new TreeMap<>();
void add(int x) { bag.merge(x, 1, Integer::sum); }
void removeOne(int x) {
    if (bag.merge(x, -1, Integer::sum) == 0) bag.remove(x);
}
int spread() { return bag.lastKey() - bag.firstKey(); }`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Forgetting to delete keys whose count hits 0, so `firstKey()` returns a ghost. Keep a separate `int size` if you need the total element count.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit** with a TreeMap bag, then redo it with two monotonic deques and compare.",
        },
      ],
    },

    // ------------------------------------------------------------------ trie
    {
      id: "trie",
      title: "Trie (Prefix Tree)",
      summary: "Tree of characters: prefix lookups in O(word length).",
      tags: ["trie", "prefix tree", "autocomplete", "word search", "xor"],
      blocks: [
        {
          type: "text",
          text: "Each edge is a character; a path from the root spells a prefix. Superpower: \"does any word start with this?\" in O(L), shared across many words. Weakness: memory hungry.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Insert word", "O(L)", "walk/create `children[c - 'a']`"],
            ["Search word", "O(L)", "walk, then check `isEnd`"],
            ["Starts with prefix", "O(L)", "walk only"],
            ["Space", "O(total chars * 26)", "`TrieNode[26]` per node"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Many words + prefix queries (autocomplete, search suggestions).",
            "Word Search II: search a grid for many words at once.",
            "Wildcard `.` matching in a dictionary.",
            "Max XOR of two numbers -> binary trie on bits.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `class TrieNode {
    TrieNode[] next = new TrieNode[26];
    String word;                     // non-null at word end (handy for grids)
}

TrieNode root = new TrieNode();

void insert(String w) {
    TrieNode cur = root;
    for (char c : w.toCharArray()) {
        int i = c - 'a';
        if (cur.next[i] == null) cur.next[i] = new TrieNode();
        cur = cur.next[i];
    }
    cur.word = w;
}

boolean startsWith(String p) {
    TrieNode cur = root;
    for (char c : p.toCharArray()) {
        cur = cur.next[c - 'a'];
        if (cur == null) return false;
    }
    return true;
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Mixing up `search` (needs end marker) and `startsWith` (does not). `c - 'a'` breaks on uppercase or digits; use a `HashMap<Character, TrieNode>` for wide alphabets. In Word Search II, set `word = null` after finding it to avoid duplicates.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Write **Implement Trie (Prefix Tree)** from scratch, then **Design Add and Search Words Data Structure**, then attempt **Word Search II**.",
        },
      ],
    },

    // ------------------------------------------------------------------ graph
    {
      id: "graph",
      title: "Graph",
      summary: "Nodes and edges. Store as adjacency list, matrix, or edge list.",
      tags: ["graph", "adjacency list", "bfs", "dfs", "topological sort", "grid"],
      blocks: [
        {
          type: "text",
          text: "A graph is nodes plus edges (directed or not, weighted or not). Pick a storage format by what you do most. Most LeetCode graphs want an adjacency list.",
        },
        {
          type: "table",
          title: "Storage formats",
          head: ["Format", "Edge check", "Neighbors", "Space", "Use for"],
          rows: [
            ["Adjacency list", "O(deg)", "O(deg)", "O(V + E)", "BFS/DFS, topo sort, Dijkstra"],
            ["Adjacency matrix", "O(1)", "O(V)", "O(V^2)", "Dense graphs, Floyd-Warshall, V <= ~500"],
            ["Edge list", "O(E)", "O(E)", "O(E)", "Kruskal (sort edges), Bellman-Ford"],
            ["Implicit grid", "O(1)", "O(4)", "none extra", "Islands, mazes, flood fill"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Input is `edges[][]`, `prerequisites`, or `n` cities with roads.",
            "Dependencies / ordering -> topological sort (Kahn's BFS with in-degrees).",
            "Shortest path, unweighted -> BFS; weighted non-negative -> Dijkstra.",
            "A 2D grid where you move between cells -> grid is a graph.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int[] e : edges) {
    adj.get(e[0]).add(e[1]);
    adj.get(e[1]).add(e[0]);          // drop this line if directed
}

// BFS on a grid
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
Queue<int[]> q = new ArrayDeque<>();
boolean[][] seen = new boolean[R][C];
q.offer(new int[]{sr, sc});
seen[sr][sc] = true;
while (!q.isEmpty()) {
    int[] cur = q.poll();
    for (int[] d : dirs) {
        int r = cur[0] + d[0], c = cur[1] + d[1];
        if (r < 0 || c < 0 || r >= R || c >= C || seen[r][c] || grid[r][c] == '0') continue;
        seen[r][c] = true;
        q.offer(new int[]{r, c});
    }
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Forgetting the reverse edge in an undirected graph. Disconnected graphs: loop over all nodes as start points. `new ArrayList[n]` gives generic-array warnings; prefer `List<List<Integer>>`. Recursive DFS on a 10^5-node chain can overflow the stack. Bounds check before indexing the grid.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Number of Islands** (grid BFS), **Course Schedule** (topo sort), and **Find if Path Exists in Graph** (adjacency list).",
        },
      ],
    },

    // ------------------------------------------------------------------ union find
    {
      id: "union-find",
      title: "Union-Find (DSU)",
      summary: "Merge groups and ask \"same group?\" in near O(1).",
      tags: ["union find", "dsu", "disjoint set", "connected components", "kruskal", "cycle"],
      blocks: [
        {
          type: "text",
          text: "Each element points to a parent; the root names its group. With path compression and union by size, operations are almost O(1). Weakness: cannot split groups or list members cheaply.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Find root", "~O(1) amortized", "`find(x)`"],
            ["Union", "~O(1) amortized", "`union(a, b)` returns false if already joined"],
            ["Same group?", "~O(1)", "`find(a) == find(b)`"],
            ["Count groups", "O(1)", "keep a `components` counter"],
            ["Group size", "O(1)", "`size[find(x)]`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Edges arrive one by one and you track connectivity.",
            "Count connected components, or detect a redundant edge (cycle).",
            "Kruskal's minimum spanning tree.",
            "Merge accounts / equivalence groups (map strings to ids first).",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int[] parent, size;
int components;
void init(int n) {
    parent = new int[n];
    size = new int[n];
    components = n;
    for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
}

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];   // path halving
        x = parent[x];
    }
    return x;
}
boolean union(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;           // already connected: cycle edge
    if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
    parent[rb] = ra;
    size[ra] += size[rb];
    components--;
    return true;
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`. Linking `a` to `b` directly instead of root to root. Grid cells need an id: `r * cols + c`. 1-indexed nodes need size `n + 1`.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Type the DSU above from memory, then solve **Redundant Connection**, **Number of Provinces**, and **Accounts Merge**.",
        },
      ],
    },

    // ------------------------------------------------------------------ segment tree
    {
      id: "segment-tree",
      title: "Segment Tree",
      summary: "Range queries (sum, min, max) with point updates in O(log n).",
      tags: ["segment tree", "range query", "range min", "range sum", "update"],
      blocks: [
        {
          type: "text",
          text: "A tree where each node stores an answer (sum, min, max, gcd) for a range of the array. Superpower: any associative range query plus updates in O(log n). Weakness: more code than a Fenwick tree; rare in interviews.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Build", "O(n)", "fill leaves, then parents"],
            ["Point update", "O(log n)", "`update(i, val)`"],
            ["Range query", "O(log n)", "`query(l, r)`"],
            ["Range update (lazy)", "O(log n)", "lazy propagation (advanced)"],
            ["Space", "O(2n) iterative / O(4n) recursive", "`int[] tree`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Range min/max with updates (Fenwick cannot do this easily).",
            "Range sum with updates and you already know segment trees.",
            "Counting things in value ranges after coordinate compression.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `// iterative segment tree for range sum, query on [l, r)
int n;
int[] t;

void build(int[] a) {
    n = a.length;
    t = new int[2 * n];
    for (int i = 0; i < n; i++) t[n + i] = a[i];
    for (int i = n - 1; i > 0; i--) t[i] = t[2 * i] + t[2 * i + 1];
}

void update(int i, int val) {
    for (t[i += n] = val; i > 1; i >>= 1) t[i >> 1] = t[i] + t[i ^ 1];
}

int query(int l, int r) {               // sum of a[l..r-1]
    int res = 0;
    for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
        if ((l & 1) == 1) res += t[l++];
        if ((r & 1) == 1) res += t[--r];
    }
    return res;
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Inclusive vs exclusive right bound: decide once and comment it. For min queries, start `res` at `Integer.MAX_VALUE`, not 0. Recursive versions need `4n` space.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Range Sum Query - Mutable** with this tree. Then change it to range minimum and test on paper with 5 numbers.",
        },
      ],
    },

    // ------------------------------------------------------------------ fenwick
    {
      id: "fenwick",
      title: "Fenwick Tree (BIT)",
      summary: "Prefix sums with point updates in O(log n), in 10 lines.",
      tags: ["fenwick", "binary indexed tree", "bit", "prefix sum", "count smaller", "inversions"],
      blocks: [
        {
          type: "text",
          text: "An array where index `i` stores the sum of a block whose size is the lowest set bit of `i`. Superpower: tiny code for prefix sums with updates. Weakness: only invertible ops (sum, count), not min/max.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Add delta at i", "O(log n)", "`add(i, delta)`"],
            ["Prefix sum 1..i", "O(log n)", "`sum(i)`"],
            ["Range sum l..r", "O(log n)", "`sum(r) - sum(l - 1)`"],
            ["Lowest set bit", "O(1)", "`i & -i`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "\"Count of smaller numbers after self\" or counting inversions.",
            "Prefix/range sums on an array that keeps changing.",
            "Rank queries over values after coordinate compression.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int[] bit;                            // 1-indexed, size n + 1

void add(int i, int delta) {
    for (; i < bit.length; i += i & -i) bit[i] += delta;
}

int sum(int i) {                      // sum of positions 1..i
    int s = 0;
    for (; i > 0; i -= i & -i) s += bit[i];
    return s;
}

// count smaller to the right: walk from the end
// for (int i = n - 1; i >= 0; i--) {
//     res[i] = sum(rank[i] - 1);
//     add(rank[i], 1);
// }`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Index 0 loops forever in `add` (0 & -0 is 0); shift to 1-indexed. Negative or huge values must be compressed to ranks 1..m first. To set a value (not add), add `newVal - oldVal` and track old values.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Range Sum Query - Mutable** with a BIT, then **Count of Smaller Numbers After Self** with coordinate compression.",
        },
      ],
    },

    // ------------------------------------------------------------------ sparse table
    {
      id: "sparse-table",
      title: "Sparse Table (optional)",
      summary: "Static range min/max in O(1) after O(n log n) prep.",
      tags: ["sparse table", "rmq", "range minimum", "static"],
      blocks: [
        {
          type: "text",
          text: "`st[k][i]` holds the min of the `2^k` items starting at `i`. Any range is covered by two overlapping power-of-two blocks. Only for arrays that never change.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Build", "O(n log n)", "`st[k][i] = min(st[k-1][i], st[k-1][i + half])`"],
            ["Range min/max", "O(1)", "two lookups"],
            ["Update", "not supported", "rebuild or use segment tree"],
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int LOG = 32 - Integer.numberOfLeadingZeros(n);
int[][] st = new int[LOG][n];
st[0] = a.clone();
for (int k = 1; k < LOG; k++)
    for (int i = 0; i + (1 << k) <= n; i++)
        st[k][i] = Math.min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);

int query(int l, int r) {             // inclusive
    int k = 31 - Integer.numberOfLeadingZeros(r - l + 1);
    return Math.min(st[k][l], st[k][r - (1 << k) + 1]);
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Works for idempotent ops only (min, max, gcd), not sum. Off-by-one in `i + (1 << k) <= n`.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "Build a sparse table on 8 numbers by hand. Then answer 3 random range-min queries and check against a loop. Optional stretch: **Sliding Window Maximum** using it.",
        },
      ],
    },

    // ------------------------------------------------------------------ matrix
    {
      id: "matrix",
      title: "Matrix / 2D Grid",
      summary: "Rows and columns: traversal, rotation, and grid DP.",
      tags: ["matrix", "grid", "2d array", "rotate", "spiral", "dp"],
      blocks: [
        {
          type: "text",
          text: "A 2D array `int[rows][cols]`. Superpower: O(1) access by (r, c), natural for boards, images, and DP tables. Weakness: easy to swap rows and cols or go out of bounds.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Access cell", "O(1)", "`g[r][c]`"],
            ["Dimensions", "O(1)", "`g.length` rows, `g[0].length` cols"],
            ["Full scan", "O(R*C)", "nested loops"],
            ["Transpose (square)", "O(n^2)", "swap `g[i][j]` and `g[j][i]` for j > i"],
            ["Rotate 90 clockwise", "O(n^2)", "transpose, then reverse each row"],
            ["2D prefix sum query", "O(1) after O(R*C)", "`P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Board problems: islands, game of life, sudoku, word search.",
            "Grid paths -> DP table `dp[r][c]` from top/left.",
            "Rotate / spiral / diagonal traversal.",
            "Sum of any sub-rectangle repeatedly -> 2D prefix sums.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `int R = g.length, C = g[0].length;
int[][] dirs = {{0, 1}, {1, 0}, {0, -1}, {-1, 0}};   // right, down, left, up
boolean inside(int r, int c) { return r >= 0 && c >= 0 && r < R && c < C; }

// 2D prefix sums
int[][] P = new int[R + 1][C + 1];
for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++)
        P[r + 1][c + 1] = g[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];

// rotate n x n clockwise in place
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) {
        int t = g[i][j]; g[i][j] = g[j][i]; g[j][i] = t;
    }
for (int[] row : g) {
    for (int l = 0, r = n - 1; l < r; l++, r--) {
        int t = row[l]; row[l] = row[r]; row[r] = t;
    }
}`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "`g[r][c]` is row first: r is y, c is x. `int[][] copy = g.clone()` is shallow (rows are shared); clone each row. Empty grid: check `g.length == 0` before `g[0].length`. Marking visited by overwriting input is fine only if allowed.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Rotate Image**, **Spiral Matrix**, and **Range Sum Query 2D - Immutable**.",
        },
      ],
    },

    // ------------------------------------------------------------------ bitmask
    {
      id: "bitmask",
      title: "Bit Set / Bitmask",
      summary: "Pack up to 32/64 yes-or-no flags into one number.",
      tags: ["bitmask", "bits", "bitset", "subsets", "xor", "dp"],
      blocks: [
        {
          type: "text",
          text: "Bit `i` of an `int` says whether item `i` is in the set. Superpower: set operations in one CPU instruction, and a whole subset as a HashMap or DP key. Weakness: limited to 32 (`int`) or 64 (`long`) items; use `BitSet` beyond.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Has item i", "O(1)", "`(mask >> i & 1) == 1`"],
            ["Add item i", "O(1)", "`mask | (1 << i)`"],
            ["Remove item i", "O(1)", "`mask & ~(1 << i)`"],
            ["Toggle item i", "O(1)", "`mask ^ (1 << i)`"],
            ["Count items", "O(1)", "`Integer.bitCount(mask)`"],
            ["Lowest set bit", "O(1)", "`mask & -mask`"],
            ["All subsets of n", "O(2^n)", "`for (int m = 0; m < 1 << n; m++)`"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "n <= 20 and you need all subsets or a DP over subsets.",
            "Track which letters a word uses (26 bits).",
            "Single Number: XOR cancels pairs.",
            "Visited set in BFS over states (node + mask).",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `// all subsets
List<List<Integer>> res = new ArrayList<>();
for (int m = 0; m < (1 << n); m++) {
    List<Integer> sub = new ArrayList<>();
    for (int i = 0; i < n; i++) if ((m >> i & 1) == 1) sub.add(nums[i]);
    res.add(sub);
}

// letters used by a word
int mask = 0;
for (char c : w.toCharArray()) mask |= 1 << (c - 'a');
boolean shareLetter = (maskA & maskB) != 0;

// XOR trick: find the one unpaired number
int x = 0;
for (int v : nums) x ^= v;

BitSet bs = new BitSet(1000);       // for more than 64 flags
bs.set(5);
bs.get(5);`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Operator precedence: `mask & 1 << i == 0` parses wrong; always parenthesize. `1 << 31` is negative and `1 << 32` equals 1 in int; use `1L << i` for long masks. `>>` keeps the sign, `>>>` fills with zeros.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Solve **Single Number**, **Subsets** with a bitmask loop, and **Maximum Product of Word Lengths** with letter masks.",
        },
      ],
    },

    // ------------------------------------------------------------------ intervals
    {
      id: "intervals",
      title: "Interval Lists",
      summary: "Arrays of [start, end] pairs: sort first, then sweep.",
      tags: ["intervals", "merge", "meeting rooms", "sweep line", "overlap"],
      blocks: [
        {
          type: "text",
          text: "Intervals usually come as `int[][]` of `[start, end]`. Sorting by start makes overlaps adjacent. Pair with a heap for \"how many at once\" or a TreeMap for live inserts.",
        },
        {
          type: "table",
          head: ["Operation", "Time", "Java"],
          rows: [
            ["Sort by start", "O(n log n)", "`Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]))`"],
            ["Overlap test", "O(1)", "`a[0] <= b[1] && b[0] <= a[1]`"],
            ["Merge sorted list", "O(n)", "extend last if overlaps"],
            ["Max concurrent", "O(n log n)", "min-heap of end times, or sweep line"],
            ["Insert into sorted set", "O(log n)", "`TreeMap` floor/ceiling"],
          ],
        },
        {
          type: "list",
          title: "Reach for it when",
          items: [
            "Merge, insert, or remove overlapping ranges.",
            "Minimum meeting rooms / max overlapping events.",
            "Minimum arrows or non-overlapping intervals -> sort by **end**, greedy.",
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
List<int[]> merged = new ArrayList<>();
for (int[] cur : iv) {
    if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
        merged.add(cur);
    } else {
        int[] last = merged.get(merged.size() - 1);
        last[1] = Math.max(last[1], cur[1]);
    }
}
int[][] out = merged.toArray(new int[0][]);

// meeting rooms: heap of end times
PriorityQueue<Integer> ends = new PriorityQueue<>();
for (int[] m : iv) {
    if (!ends.isEmpty() && ends.peek() <= m[0]) ends.poll();
    ends.offer(m[1]);
}
int rooms = ends.size();`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Do touching intervals like [1,2] and [2,3] overlap? Read the problem; it flips `<` vs `<=`. When merging, take `max` of ends, not the new end (a long interval can contain a short one). Sorting by start vs by end gives different greedy results.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Solve **Merge Intervals**, **Insert Interval**, and **Non-overlapping Intervals**. Bonus: **Meeting Rooms II** if you have premium.",
        },
      ],
    },

    // ------------------------------------------------------------------ lru combo
    {
      id: "lru-combo",
      title: "Combos: HashMap + Doubly Linked List (LRU)",
      summary: "Combine structures to get O(1) lookup and O(1) ordering.",
      tags: ["lru", "cache", "design", "linkedhashmap", "doubly linked list", "combo"],
      blocks: [
        {
          type: "text",
          text: "Design problems often need two fast moves no single structure has. LRU cache: the map finds a node in O(1); the doubly linked list moves it to the front and evicts the tail in O(1).",
        },
        {
          type: "table",
          head: ["Need", "Combo", "Example problem"],
          rows: [
            ["Lookup + recency order", "HashMap + DLL (or `LinkedHashMap`)", "LRU Cache"],
            ["Lookup + frequency buckets", "HashMap + map of DLLs", "LFU Cache"],
            ["O(1) insert/delete/random", "HashMap value->index + ArrayList", "Insert Delete GetRandom O(1)"],
            ["Stack + current min", "two stacks", "Min Stack"],
          ],
        },
        {
          type: "code",
          lang: "java",
          code: `class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    LRUCache(int capacity) {
        super(capacity, 0.75f, true);        // true = access order
        cap = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> e) {
        return size() > cap;
    }
}
// Interviewers may ask for the manual version: Node{key, val, prev, next},
// dummy head and tail, plus remove(node) and addFront(node) helpers.`,
        },
        {
          type: "callout",
          tone: "warn",
          title: "Traps",
          text: "Store the **key** inside each node, or you cannot delete the evicted node from the map. Use dummy head and tail so you never null-check neighbors. On `get`, move the node to the front too.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Write **LRU Cache** manually with a DLL (no LinkedHashMap), then **Insert Delete GetRandom O(1)** (swap with last before removing).",
        },
      ],
    },
  ],
};
