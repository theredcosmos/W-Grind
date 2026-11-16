// Java Cheatsheet: HashSet. Unique values with O(1) "is it in here?". Same layout as hashmap.js.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'hashset',
  title: 'HashSet',
  summary: 'Unique values, O(1) "have I seen this?". Duplicates, visited cells, set math, longest consecutive.',
  tags: ['hashset', 'set', 'unique', 'duplicate', 'contains', 'visited', 'seen', 'intersection', 'union', 'consecutive', 'sliding window'],
  blocks: [
    t("A HashSet holds **unique values** and answers \"is x in here?\" in O(1). It is a HashMap with only keys. Reach for it when the problem asks about duplicates, \"have I visited this cell?\", \"does the partner exist?\", or set math like intersection. It has **no order**: use `LinkedHashSet` for insertion order and `TreeSet` for sorted order."),
    key("Three calls cover most problems: `set.add(x)` (returns **false** if x was already there, which is your duplicate check), `set.contains(x)` for O(1) lookup, and `set.remove(x)` when something leaves a window."),
    recipes('Create', [
      r('Make an empty set', `
Set<Integer> visited = new HashSet<>();
Set<String> names = new HashSet<>();
Set<Character> letters = new HashSet<>();`, 'O(1)', 'Declare as `Set<T>`, build as `new HashSet<>()`. Use `Integer`, not `int`.'),
      r('Make a set from a list', `
Set<Integer> fromList = new HashSet<>(list);           // duplicates collapse
Set<String> fixed = new HashSet<>(List.of("a", "e", "i", "o", "u"));`, 'O(n)', '`Set.of(...)` alone is read-only and throws on duplicate arguments; wrap it in `new HashSet<>(...)` to change it.'),
      r('Make a set from an int array', `
Set<Integer> fromArr = new HashSet<>();
for (int num : nums) fromArr.add(num);

// Stream one-liner:
Set<Integer> fromArr2 = Arrays.stream(nums).boxed().collect(Collectors.toSet());`, 'O(n)', '`new HashSet<>(Arrays.asList(nums))` does **not** work for `int[]`: you get a set holding one array.'),
      r('Make a set of the letters in a string', `
Set<Character> chars = new HashSet<>();
for (char ch : s.toCharArray()) chars.add(ch);
int distinctLetters = chars.size();`, 'O(n)', 'Lowercase letters only? A `boolean[26]` is faster and does the same job.'),
    ]),
    recipes('Add, check and remove', [
      r('Add a value', `
Set<Integer> bag = new HashSet<>();
bag.add(5);
bag.add(5);                  // ignored: already there
int size = bag.size();       // 1`, 'O(1)'),
      r('Add and find out if it was a duplicate', `
Set<Integer> bag = new HashSet<>();
for (int num : nums) {
    if (!bag.add(num)) {      // add returns false when num was already in
        return num;           // first repeated number
    }
}`, 'O(1)', 'One call does both the check and the insert. Cleaner than `contains` then `add`.'),
      r('Check if a value is in the set', `
if (set.contains(x)) {
    // x is in the set
}
boolean missing = !set.contains(target);`, 'O(1)'),
      r('Remove a value', `
set.remove(x);                         // no error if x is missing
boolean wasThere = set.remove(x);      // true only if it was removed`, 'O(1)', 'On a `Set<Integer>`, `remove(x)` removes the value. (On a `List<Integer>` it would remove by index.)'),
      r('Size, empty check, clear', `
int howMany = set.size();
boolean none = set.isEmpty();
set.clear();`, 'O(1) / O(n) for clear'),
    ]),
    recipes('Loop and convert', [
      r('Loop over every value', `
for (int v : set) {
    // order is random, do not rely on it
}`, 'O(n)', 'Need order? Copy to a list and sort, or use `TreeSet` / `LinkedHashSet`.'),
      r('Turn the set into a list or array', `
List<Integer> asList = new ArrayList<>(set);
Collections.sort(asList);                        // if you need it sorted
int[] asArray = set.stream().mapToInt(Integer::intValue).toArray();
String[] wordsArr = new HashSet<>(List.of("a", "b")).toArray(new String[0]);`, 'O(n)'),
      r('Remove values that match a condition', `
set.removeIf(v -> v % 2 == 0);          // drop every even number`, 'O(n)', 'Calling `set.remove(v)` inside a for-each over the set throws ConcurrentModificationException.'),
      r('Remove duplicates from a list', `
List<Integer> unique = new ArrayList<>(new HashSet<>(list));          // order lost
List<Integer> uniqueInOrder = new ArrayList<>(new LinkedHashSet<>(list)); // first-seen order kept`, 'O(n)'),
    ]),
    recipes('Set math', [
      r('Values in both sets (intersection)', `
Set<Integer> setA = new HashSet<>(List.of(1, 2, 3)), setB = new HashSet<>(List.of(2, 3, 4));
Set<Integer> both = new HashSet<>(setA);    // copy first, retainAll changes the set
both.retainAll(setB);                       // {2, 3}`, 'O(n)', 'Always copy first. `setA.retainAll(setB)` would destroy `setA`.'),
      r('Values in either set (union)', `
Set<Integer> setA = new HashSet<>(List.of(1, 2)), setB = new HashSet<>(List.of(2, 3));
Set<Integer> either = new HashSet<>(setA);
either.addAll(setB);                        // {1, 2, 3}`, 'O(n)'),
      r('Values in A but not in B (difference)', `
Set<Integer> setA = new HashSet<>(List.of(1, 2, 3)), setB = new HashSet<>(List.of(2));
Set<Integer> onlyA = new HashSet<>(setA);
onlyA.removeAll(setB);                      // {1, 3}`, 'O(n)'),
      r('Check if one set is inside another (subset)', `
Set<Integer> small = new HashSet<>(List.of(1, 2)), big = new HashSet<>(List.of(1, 2, 3));
boolean isSubset = big.containsAll(small);  // true
boolean sameValues = small.equals(big);     // false: equal means same values`, 'O(n)'),
      r('Intersection of two arrays', `
Set<Integer> first = new HashSet<>();
for (int num : nums) first.add(num);
Set<Integer> common = new HashSet<>();
for (int num : arr) {
    if (first.contains(num)) common.add(num);
}
return common.stream().mapToInt(Integer::intValue).toArray();`, 'O(n + m)', 'LeetCode 349. If counts matter (349 vs 350), use a HashMap of counts instead.'),
    ]),
    recipes('Visited sets for grids and graphs', [
      r('Visited cells on a grid as one int', `
int rows = grid.length, cols = grid[0].length;
Set<Integer> visitedCells = new HashSet<>();
int row = 0, col = 0;
visitedCells.add(row * cols + col);             // one number per cell
boolean done = visitedCells.contains(row * cols + col);
int backRow = 7 / cols, backCol = 7 % cols;     // decode id 7 back to (row, col)`, 'O(1)', 'Fastest set key for a grid. A `boolean[rows][cols]` is even simpler when the grid size is known.'),
      r('Visited cells on a grid as "r,c" strings', `
Set<String> visitedCells = new HashSet<>();
int row = 2, col = 3;
visitedCells.add(row + "," + col);
if (!visitedCells.contains((row + 1) + "," + col)) {
    // neighbour below not visited yet
}`, 'O(1)', 'Easy to read and works for unbounded coordinates (robot walking on an infinite plane). Slower than ints.'),
      r('BFS on a grid with a visited set', `
int rows = grid.length, cols = grid[0].length;
Set<Integer> visitedCells = new HashSet<>();
Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[]{0, 0});
visitedCells.add(0);                                // mark when you ADD to the queue
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
while (!queue.isEmpty()) {
    int[] cell = queue.poll();
    for (int[] d : dirs) {
        int nr = cell[0] + d[0], nc = cell[1] + d[1];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] == 0) continue;            // wall
        if (visitedCells.add(nr * cols + nc)) {     // true = first time here
            queue.offer(new int[]{nr, nc});
        }
    }
}`, 'O(rows * cols)', 'Mark visited when you enqueue, not when you poll, or the same cell gets queued many times.'),
      r('Visited nodes for DFS on a graph', `
Set<Integer> visitedNodes = new HashSet<>();
Deque<Integer> stack = new ArrayDeque<>();
stack.push(0);
while (!stack.isEmpty()) {
    int node = stack.pop();
    if (!visitedNodes.add(node)) continue;          // already handled
    for (int nb : graph.get(node)) {
        if (!visitedNodes.contains(nb)) stack.push(nb);
    }
}`, 'O(V + E)'),
      r('Store pairs in a set', `
// int[] does not work as a set value (compares by identity). Use one of these:
Set<List<Integer>> pairs = new HashSet<>();
pairs.add(List.of(1, 2));
boolean hasPair = pairs.contains(List.of(1, 2));       // true

Set<Long> packed = new HashSet<>();
packed.add(((long) 1 << 32) | 2);                      // two ints packed in one long

Set<String> asText = new HashSet<>();
asText.add(1 + "," + 2);`, 'O(1)', 'Pick `List.of(a, b)` for clarity, a packed `long` for speed. Never `int[]`.'),
    ]),
    recipes('Common problem patterns', [
      r('Contains duplicate', `
Set<Integer> bag = new HashSet<>();
for (int num : nums) {
    if (!bag.add(num)) return true;
}
return false;

// One-liner: duplicates exist if the set is smaller than the array
// return Arrays.stream(nums).distinct().count() < nums.length;`, 'O(n)'),
      r('Duplicate within k positions (sliding window set)', `
Set<Integer> window = new HashSet<>();
for (int idx = 0; idx < nums.length; idx++) {
    if (!window.add(nums[idx])) return true;        // same value within the last k
    if (window.size() > k) window.remove(nums[idx - k]);  // keep only the last k values
}
return false;`, 'O(n)', 'LeetCode 219. The set never holds more than k values.'),
      r('Two Sum style: does the partner exist?', `
Set<Integer> before = new HashSet<>();
for (int num : nums) {
    if (before.contains(target - num)) return true;   // partner seen earlier
    before.add(num);                                   // add AFTER the check
}
return false;`, 'O(n)', 'Need the index too? Switch to a HashMap of value to index.'),
      r('Longest consecutive sequence', `
Set<Integer> all = new HashSet<>();
for (int num : nums) all.add(num);
int best = 0;
for (int num : all) {
    if (all.contains(num - 1)) continue;   // not the start of a run, skip
    int len = 1;
    while (all.contains(num + len)) len++;  // walk up from the start
    best = Math.max(best, len);
}
return best;`, 'O(n)', 'Only start counting when `num - 1` is missing. Without that check it becomes O(n^2).'),
      r('Longest substring without repeating characters', `
Set<Character> window = new HashSet<>();
int left = 0, best = 0;
for (int right = 0; right < s.length(); right++) {
    char ch = s.charAt(right);
    while (window.contains(ch)) {           // shrink until ch is gone
        window.remove(s.charAt(left++));
    }
    window.add(ch);
    best = Math.max(best, right - left + 1);
}
return best;`, 'O(n)', 'LeetCode 3. Each character enters and leaves the set at most once.'),
      r('Check if every character is unique', `
Set<Character> used = new HashSet<>();
for (char ch : s.toCharArray()) {
    if (!used.add(ch)) return false;
}
return true;`, 'O(n)'),
      r('Find the missing or extra number', `
Set<Integer> present = new HashSet<>();
for (int num : nums) present.add(num);
for (int v = 0; v <= nums.length; v++) {
    if (!present.contains(v)) return v;     // first value from 0..n not present
}
return -1;`, 'O(n)', 'For "0..n with one missing", the sum or XOR trick uses O(1) space. The set version is the safe fallback.'),
      r('Happy number / detect a cycle in a sequence', `
Set<Integer> seenValues = new HashSet<>();
int cur = 19;
while (cur != 1 && seenValues.add(cur)) {     // add fails = we have been here = cycle
    int next = 0;
    for (int v = cur; v > 0; v /= 10) next += (v % 10) * (v % 10);
    cur = next;
}
return cur == 1;`, 'O(log n) per step', 'Any "does this process loop forever?" question: store each state, stop when `add` returns false.'),
    ]),
    warn("`int[]` (and any array) in a HashSet compares by **identity**, not by contents. `set.contains(new int[]{1, 2})` is always false. Use `List.of(a, b)`, a `\"a,b\"` string, or pack into a `long`.", 'The array trap'),
    warn("`retainAll`, `addAll` and `removeAll` **change the set you call them on**. Copy first: `Set<Integer> both = new HashSet<>(setA); both.retainAll(setB);`."),
    tip("When you write `if (!set.contains(x)) set.add(x);`, you can almost always write `if (set.add(x))` instead. Same meaning, one lookup."),
    costs([
      ['Add', '`add(x)` (returns false if already there)', 'O(1)'],
      ['Has value', '`contains(x)`', 'O(1)'],
      ['Remove', '`remove(x)`', 'O(1)'],
      ['Size / empty', '`size()`, `isEmpty()`', 'O(1)'],
      ['Intersection', '`copy.retainAll(other)`', 'O(n)'],
      ['Union', '`copy.addAll(other)`', 'O(m)'],
      ['Difference', '`copy.removeAll(other)`', 'O(n)'],
      ['Subset', '`big.containsAll(small)`', 'O(m)'],
      ['Loop / to list', '`for (x : set)`, `new ArrayList<>(set)`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: put an array into a set, detect the first duplicate with `if (!set.add(x))`, then build the intersection of two sets without changing either. Then do **Contains Duplicate**, **Longest Consecutive Sequence** and **Longest Substring Without Repeating Characters**."),
  ],
};
