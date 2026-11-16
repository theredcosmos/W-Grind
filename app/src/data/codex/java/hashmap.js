// Java Cheatsheet: HashMap. The template every other structure follows: short intro, recipe
// groups by job ("read and update", "loop", "find", ...), then traps, costs and a drill.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'hashmap',
  title: 'HashMap',
  summary: 'Key → value in O(1). Counting, "seen before?", grouping, lookups. The one you use most.',
  tags: ['hashmap', 'map', 'dictionary', 'frequency', 'count', 'group', 'two sum', 'entryset', 'loop', 'update'],
  blocks: [
    t("A HashMap stores **key → value** pairs and finds any key in O(1). Use it when the problem keeps asking \"how many times did I see X?\", \"have I seen X before?\", or \"which things share the same Y?\". It has **no order**: if you need sorted keys use `TreeMap`, insertion order use `LinkedHashMap`."),
    key("Three lines cover 80% of problems: `map.merge(k, 1, Integer::sum)` to count, `map.getOrDefault(k, 0)` to read safely, and `for (var e : map.entrySet())` to loop key and value together."),
    recipes('Create', [
      r('Make an empty map', `
Map<String, Integer> stock = new HashMap<>();          // item -> how many
Map<Integer, List<Integer>> groups = new HashMap<>();   // value can be a list
Map<Character, Integer> count = new HashMap<>();`, 'O(1)', 'Declare as `Map<K, V>`, build as `new HashMap<>()`. Keys and values must be objects: `Integer`, not `int`.'),
      r('Make a map with starting values', `
Map<String, Integer> price = new HashMap<>(Map.of("apple", 3, "pear", 5));
Map<Integer, Integer> prefix = new HashMap<>();
prefix.put(0, 1);            // "sum 0 seen once" before the loop (subarray sum = k)`, null, '`Map.of(...)` alone is read-only; wrap it in `new HashMap<>(...)` if you will change it.'),
    ]),
    recipes('Read and update', [
      r('Add or overwrite a value', `
stock.put("apple", 3);         // adds, or replaces the old value
Integer old = stock.put("apple", 7);   // put returns the previous value (or null)`, 'O(1)'),
      r('Read a value safely (no null crash)', `
int qty = stock.getOrDefault("apple", 0);   // 0 if missing

Integer v = stock.get("apple");             // null if missing
if (v != null) {
    // use v
}`, 'O(1)', 'Never write `int v = map.get(k)` on a key that may be missing: unboxing null throws NullPointerException.'),
      r('Check if a key exists', `
if (stock.containsKey("apple")) {
    // key is there (value may still be null if you put null)
}
boolean hasValue = stock.containsValue(3);  // O(n): scans every value`, 'O(1)'),
      r('Update the value only if the key exists', `
// Option 1: plain and readable
if (map.containsKey(key)) {
    map.put(key, map.get(key) + 10);
}

// Option 2: one call. Returning null from the lambda removes the key.
map.computeIfPresent(key, (k, v) -> v + 10);`, 'O(1)'),
      r('Count how often each thing appears', `
Map<Integer, Integer> freq = new HashMap<>();
for (int num : nums) {
    freq.merge(num, 1, Integer::sum);            // +1, starting at 1
}

// Same thing, longer form you may see in solutions:
// freq.put(num, freq.getOrDefault(num, 0) + 1);

Map<Character, Integer> letters = new HashMap<>();
for (char ch : s.toCharArray()) letters.merge(ch, 1, Integer::sum);`, 'O(n)', 'Lowercase letters only? An `int[26]` with `cnt[ch - \'a\']++` is faster and simpler.'),
      r('Decrease a count and remove it at zero', `
// Sliding window: the character leaves the window
freq.merge(x, -1, Integer::sum);
if (freq.get(x) == 0) freq.remove(x);

// One call: merge removes the key when the result is null
freq.computeIfPresent(x, (k, v) -> v == 1 ? null : v - 1);`, 'O(1)', 'Removing at zero keeps `freq.size()` equal to "number of distinct items in the window".'),
      r('Add only if the key is missing', `
stock.putIfAbsent("apple", 0);              // keeps the existing value if there is one

// Remember the FIRST index where each value appears
Map<Integer, Integer> firstIndex = new HashMap<>();
for (int idx = 0; idx < nums.length; idx++) {
    firstIndex.putIfAbsent(nums[idx], idx);
}`, 'O(1)'),
      r('Keep the max (or min) value per key', `
Map<String, Integer> best = new HashMap<>();
best.merge("alice", 90, Math::max);       // keeps the larger score
best.merge("alice", 75, Math::max);       // still 90

Map<String, Integer> earliest = new HashMap<>();
earliest.merge("job", 5, Math::min);`, 'O(1)'),
      r('Remove a key', `
stock.remove("apple");                       // returns the removed value, or null
stock.remove("apple", 3);                    // removes only if the value is 3`, 'O(1)'),
    ]),
    recipes('Group things (value is a list or set)', [
      r('Group items under a key', `
// Group anagrams: same sorted letters -> same list
Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {
    char[] arr = w.toCharArray();
    Arrays.sort(arr);
    String sortedKey = new String(arr);
    groups.computeIfAbsent(sortedKey, kk -> new ArrayList<>()).add(w);
}
List<List<String>> answer = new ArrayList<>(groups.values());`, 'O(1) per add', '`computeIfAbsent` creates the list the first time, then always returns the same list to `.add` to.'),
      r('Build a graph (adjacency list) from edges', `
Map<Integer, List<Integer>> g = new HashMap<>();
for (int[] e : edges) {
    g.computeIfAbsent(e[0], kk -> new ArrayList<>()).add(e[1]);
    g.computeIfAbsent(e[1], kk -> new ArrayList<>()).add(e[0]);   // undirected: both ways
}
for (int nb : g.getOrDefault(0, List.of())) {
    // visit neighbours of node 0 (empty list if 0 has none)
}`, 'O(E)'),
      r('Store a set of values per key (no duplicates)', `
Map<String, Set<String>> follows = new HashMap<>();
follows.computeIfAbsent("ann", kk -> new HashSet<>()).add("bob");
boolean annFollowsBob = follows.getOrDefault("ann", Set.of()).contains("bob");`, 'O(1)'),
    ]),
    recipes('Loop through it', [
      r('Loop over key AND value together (most common)', `
for (Map.Entry<String, Integer> e : scores.entrySet()) {
    String name = e.getKey();
    int score = e.getValue();
    System.out.println(name + " -> " + score);
}

// Shorter with var (Java 10+):
for (var e : scores.entrySet()) {
    if (e.getValue() > 50) names.add(e.getKey());   // use key and value
}`, 'O(n)', 'Use `entrySet()` when you need both. Looping `keySet()` and calling `get(k)` works but does two lookups.'),
      r('Loop over keys only, or values only', `
for (String name : scores.keySet()) {
    // name
}
for (int score : scores.values()) {
    total += score;
}
int sum = scores.values().stream().mapToInt(Integer::intValue).sum();`, 'O(n)'),
      r('Collect the keys whose value matches a condition', `
// Every number that appears more than n/3 times
List<Integer> out = new ArrayList<>();
for (var e : freq.entrySet()) {
    if (e.getValue() > nums.length / 3) out.add(e.getKey());
}`, 'O(n)'),
      r('Change every value in place', `
for (var e : scores.entrySet()) {
    e.setValue(e.getValue() * 2);          // allowed while looping
}
scores.replaceAll((name, sc) -> sc + 1);  // same idea in one call`, 'O(n)'),
      r('Remove entries while looping (without crashing)', `
// Remove all keys with count 0 or less
freq.entrySet().removeIf(e -> e.getValue() <= 0);

// Or with an explicit iterator
Iterator<Map.Entry<Integer, Integer>> it = freq.entrySet().iterator();
while (it.hasNext()) {
    if (it.next().getValue() <= 0) it.remove();
}`, 'O(n)', 'Calling `map.remove(k)` inside a for-each over the map throws ConcurrentModificationException.'),
    ]),
    recipes('Find something', [
      r('Find the key with the biggest value', `
int bestKey = -1, bestCount = 0;
for (var e : freq.entrySet()) {
    if (e.getValue() > bestCount) {
        bestCount = e.getValue();
        bestKey = e.getKey();
    }
}

// One-liner (fine when the map is not empty):
int mostCommon = Collections.max(freq.entrySet(), Map.Entry.comparingByValue()).getKey();`, 'O(n)'),
      r('Two Sum: have I seen the partner before?', `
Map<Integer, Integer> indexOf = new HashMap<>();     // value -> index
for (int idx = 0; idx < nums.length; idx++) {
    int need = target - nums[idx];
    if (indexOf.containsKey(need)) {
        return new int[]{indexOf.get(need), idx};
    }
    indexOf.put(nums[idx], idx);                      // store AFTER checking
}`, 'O(n)', 'Check before you put, so a number never pairs with itself.'),
      r('Count subarrays with sum = k (prefix sums)', `
Map<Integer, Integer> prefixCount = new HashMap<>();
prefixCount.put(0, 1);                    // empty prefix
int sum = 0, ans = 0;
for (int num : nums) {
    sum += num;
    ans += prefixCount.getOrDefault(sum - k, 0);
    prefixCount.merge(sum, 1, Integer::sum);
}
return ans;`, 'O(n)'),
      r('First character that appears only once', `
Map<Character, Integer> cnt = new LinkedHashMap<>();   // keeps insertion order
for (char ch : s.toCharArray()) cnt.merge(ch, 1, Integer::sum);
for (var e : cnt.entrySet()) {
    if (e.getValue() == 1) return e.getKey();
}
return '_';`, 'O(n)', 'Plain HashMap has no order; use `LinkedHashMap` (or loop the string again) when "first" matters.'),
      r('Check two strings are anagrams', `
if (s.length() != t.length()) return false;
Map<Character, Integer> diff = new HashMap<>();
for (int idx = 0; idx < s.length(); idx++) {
    diff.merge(s.charAt(idx), 1, Integer::sum);
    diff.merge(t.charAt(idx), -1, Integer::sum);
}
for (int d : diff.values()) if (d != 0) return false;
return true;`, 'O(n)'),
    ]),
    recipes('Sort or rank by value', [
      r('Sort the entries by value (high to low)', `
List<Map.Entry<String, Integer>> entries = new ArrayList<>(scores.entrySet());
entries.sort((e1, e2) -> e2.getValue() - e1.getValue());       // high first
for (var e : entries) {
    System.out.println(e.getKey() + " " + e.getValue());
}

// Tie-break by key when values are equal:
entries.sort(Map.Entry.<String, Integer>comparingByValue().reversed()
        .thenComparing(Map.Entry.comparingByKey()));`, 'O(n log n)'),
      r('Top k most frequent keys (heap)', `
PriorityQueue<Map.Entry<Integer, Integer>> heap =
        new PriorityQueue<>((e1, e2) -> e1.getValue() - e2.getValue());   // min-heap by count
for (var e : freq.entrySet()) {
    heap.offer(e);
    if (heap.size() > k) heap.poll();     // drop the smallest, keep the top k
}
int[] topK = new int[k];
for (int idx = k - 1; idx >= 0; idx--) topK[idx] = heap.poll().getKey();`, 'O(n log k)'),
      r('Top k most frequent keys (bucket sort, O(n))', `
List<Integer>[] bucket = new List[nums.length + 1];   // index = how many times
for (var e : freq.entrySet()) {
    int times = e.getValue();
    if (bucket[times] == null) bucket[times] = new ArrayList<>();
    bucket[times].add(e.getKey());
}
List<Integer> top = new ArrayList<>();
for (int times = bucket.length - 1; times >= 0 && top.size() < k; times--) {
    if (bucket[times] != null) top.addAll(bucket[times]);
}`, 'O(n)'),
    ]),
    recipes('Turn it into something else', [
      r('Keys, values or entries as a list', `
List<String> keyList = new ArrayList<>(scores.keySet());
List<Integer> valueList = new ArrayList<>(scores.values());
List<Map.Entry<String, Integer>> entryList = new ArrayList<>(scores.entrySet());`, 'O(n)'),
      r('Use a pair or array as a key', `
// Arrays compare by identity, so convert to a String or a List first
Map<String, Integer> memo = new HashMap<>();
String memoKey = i + "," + j;              // row,col
memo.put(memoKey, 42);

Map<List<Integer>, Integer> byPair = new HashMap<>();
byPair.put(List.of(i, j), 1);

// Fast for two ints: pack into one long
Map<Long, Integer> packed = new HashMap<>();
packed.put((long) i * 100_000 + j, 1);`, 'O(1)', 'An `int[]` key never matches a new `int[]` with the same numbers.'),
      r('Compare two maps', `
Map<Character, Integer> need = new HashMap<>(), have = new HashMap<>();
boolean same = need.equals(have);          // same keys with equal values`, 'O(n)'),
    ]),
    warn("Comparing two `Integer` values from a map with `==` breaks above 127 (it compares objects). Use `.equals()` or unbox first: `int a = map.get(x); int b = map.get(y); a == b`.", 'The == trap'),
    warn("`map.get(k)` returns **null** for a missing key. `map.get(k) + 1` or `int v = map.get(k)` then crashes with NullPointerException. Reach for `getOrDefault` or `merge`."),
    tip("Say the meaning of key and value out loud before you type: \"key = number, value = index where I saw it\". Half of HashMap bugs are mixing those two up."),
    costs([
      ['Add / overwrite', '`put(k, v)`', 'O(1)'],
      ['Read', '`get(k)`, `getOrDefault(k, d)`', 'O(1)'],
      ['Has key', '`containsKey(k)`', 'O(1)'],
      ['Has value', '`containsValue(v)`', 'O(n)'],
      ['Count / combine', '`merge(k, v, fn)`', 'O(1)'],
      ['Group', '`computeIfAbsent(k, f)`', 'O(1)'],
      ['Remove', '`remove(k)`', 'O(1)'],
      ['Loop', '`entrySet()`, `keySet()`, `values()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: count letters of a word with `merge`, print each letter and count with `entrySet`, then return the letter with the highest count. Then do **Two Sum** and **Top K Frequent Elements**."),
  ],
};
