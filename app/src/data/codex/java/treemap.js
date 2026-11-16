// Java Cheatsheet: TreeMap. A map kept sorted by key: nearest-key lookups, first/last, ranges,
// and the "multiset" trick for sliding-window min/max. Same layout as hashmap.js.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'treemap',
  title: 'TreeMap',
  summary: 'A map with keys always sorted. Nearest key below/above x, smallest/largest, ranges, sorted counting.',
  tags: ['treemap', 'sorted map', 'floorkey', 'ceilingkey', 'floorentry', 'firstkey', 'lastkey', 'multiset', 'interval', 'calendar', 'range', 'submap', 'red-black'],
  blocks: [
    t("A TreeMap is a map whose keys are **always sorted**. Every call is O(log n) instead of O(1), and in return you can ask \"what is the closest key at or below x?\", \"what is the smallest key?\", or \"give me all keys between a and b\". Reach for it when a HashMap would work but you also need order: interval booking, sliding-window min/max with duplicates, or answering queries about the nearest value."),
    key("Three ideas cover most problems: `floorKey(x)` / `ceilingKey(x)` for the nearest key (always check for **null**), `firstKey()` / `lastKey()` for the smallest and largest, and `tree.merge(v, 1, Integer::sum)` with removal at zero to use it as a sorted multiset."),
    recipes('Create', [
      r('Make an empty sorted map', `
TreeMap<Integer, Integer> tree = new TreeMap<>();       // smallest key first
TreeMap<String, List<String>> byName = new TreeMap<>(); // strings sort A-Z`, 'O(1)', 'Declare as `TreeMap<K, V>`, not `Map<K, V>`, or you lose floorKey, firstKey and the rest.'),
      r('Make a map sorted from largest to smallest', `
TreeMap<Integer, Integer> desc = new TreeMap<>(Comparator.reverseOrder());
desc.put(1, 10);
desc.put(5, 50);
int biggest = desc.firstKey();          // 5: "first" now means largest`, 'O(1)', 'With a reversed comparator, floor/ceiling flip meaning too. Often simpler to keep normal order and use `lastKey()`.'),
      r('Sort the keys with a custom rule', `
// Sort strings by length, then alphabetically to break ties
TreeMap<String, Integer> byLen = new TreeMap<>(
        Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));
byLen.put("pear", 1);
byLen.put("fig", 2);                    // "fig" comes first (shorter)`, 'O(1)', 'If the comparator says two keys are equal (returns 0), the second one overwrites the first. Always add a tie-breaker.'),
      r('Turn a HashMap into a sorted one', `
TreeMap<Integer, Integer> sortedFreq = new TreeMap<>(freq);   // same entries, keys now sorted`, 'O(n log n)'),
    ]),
    recipes('Read and update', [
      r('Add, read and remove (same as HashMap)', `
TreeMap<String, Integer> price = new TreeMap<>();
price.put("apple", 3);
int p1 = price.getOrDefault("kiwi", 0);   // 0 if missing
price.remove("apple");
boolean has = price.containsKey("apple");`, 'O(log n)', 'Same calls as HashMap, each costs O(log n) instead of O(1).'),
      r('Count values and keep them sorted', `
TreeMap<Integer, Integer> cnt = new TreeMap<>();
for (int num : nums) cnt.merge(num, 1, Integer::sum);
// Looping cnt now gives values from smallest to largest with their counts`, 'O(n log n)'),
      r('Update the value only if the key exists', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(4, 1));
if (tree.containsKey(4)) tree.put(4, tree.get(4) + 1);
tree.computeIfPresent(4, (kk, v) -> v + 1);       // same, one call`, 'O(log n)'),
    ]),
    recipes('Find the nearest key', [
      r('Get the largest key that is <= x', `
TreeMap<Integer, String> tree = new TreeMap<>(Map.of(10, "a", 20, "b"));
Integer below = tree.floorKey(15);    // 10. null if every key is bigger than 15
if (below != null) {
    // use below
}`, 'O(log n)', 'Store the result in `Integer`, not `int`: null crashes when unboxed.'),
      r('Get the smallest key that is >= x', `
TreeMap<Integer, String> tree = new TreeMap<>(Map.of(10, "a", 20, "b"));
Integer above = tree.ceilingKey(15);  // 20. null if every key is smaller than 15
if (above != null) {
    // use above
}`, 'O(log n)'),
      r('Get the key strictly below or strictly above x', `
TreeMap<Integer, String> tree = new TreeMap<>(Map.of(10, "a", 20, "b"));
Integer strictlyBelow = tree.lowerKey(10);    // null: nothing < 10
Integer strictlyAbove = tree.higherKey(10);   // 20`, 'O(log n)', 'floor/ceiling include x itself; lower/higher skip it.'),
      r('Get the whole entry (key and value) nearest to x', `
TreeMap<Integer, String> tree = new TreeMap<>(Map.of(10, "a", 20, "b"));
Map.Entry<Integer, String> e = tree.floorEntry(15);    // also ceilingEntry, lowerEntry, higherEntry
if (e != null) {
    int atKey = e.getKey();
    String atVal = e.getValue();
}`, 'O(log n)', 'Use the Entry versions when you need the value too; it saves a second lookup.'),
      r('Find the key closest to x (either side)', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(3, 0, 9, 1));
Integer lo = tree.floorKey(x), hi = tree.ceilingKey(x);
int closest;
if (lo == null) closest = hi;                       // map must not be empty
else if (hi == null) closest = lo;
else closest = (x - lo <= hi - x) ? lo : hi;        // tie goes to the smaller`, 'O(log n)'),
      r('Look up a value by time (time-based key-value store)', `
// key -> (timestamp -> value). Answer: latest value at or before time t.
Map<String, TreeMap<Integer, String>> store = new HashMap<>();
store.computeIfAbsent("foo", kk -> new TreeMap<>()).put(1, "bar");

TreeMap<Integer, String> history = store.get("foo");
if (history == null) return "";
Map.Entry<Integer, String> at = history.floorEntry(3);   // time 3
return at == null ? "" : at.getValue();`, 'O(log n)', 'LeetCode 981. `floorEntry(time)` is the whole trick.'),
    ]),
    recipes('Smallest and largest', [
      r('Get the smallest and largest key', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(4, 1, 9, 2));
int smallest = tree.firstKey();      // throws if empty
int largest = tree.lastKey();        // throws if empty
if (!tree.isEmpty()) {
    int range = tree.lastKey() - tree.firstKey();
}`, 'O(log n)', '`firstKey()` / `lastKey()` throw NoSuchElementException on an empty map. `firstEntry()` returns null instead.'),
      r('Get the smallest or largest entry, null if empty', `
TreeMap<Integer, Integer> tree = new TreeMap<>();
Map.Entry<Integer, Integer> lowE = tree.firstEntry();   // null when empty
Map.Entry<Integer, Integer> highE = tree.lastEntry();
if (lowE != null) {
    int lowKey = lowE.getKey(), lowCount = lowE.getValue();
}`, 'O(log n)'),
      r('Remove and return the smallest or largest', `
TreeMap<Integer, String> tasks = new TreeMap<>(Map.of(1, "a", 5, "b"));
Map.Entry<Integer, String> first = tasks.pollFirstEntry();   // removes key 1, null if empty
Map.Entry<Integer, String> last = tasks.pollLastEntry();     // removes key 5`, 'O(log n)', 'Like a priority queue that can also be searched and can pop from both ends.'),
    ]),
    recipes('Ranges and loops', [
      r('Loop in sorted order', `
TreeMap<String, Integer> tree = new TreeMap<>(Map.of("b", 2, "a", 1));
for (var e : tree.entrySet()) {
    System.out.println(e.getKey() + " " + e.getValue());   // a 1, then b 2
}`, 'O(n)'),
      r('Loop from largest to smallest', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(1, 1, 2, 2));
for (var e : tree.descendingMap().entrySet()) {
    int kk = e.getKey();          // 2, then 1
}
for (int kk : tree.descendingKeySet()) {
    // keys only, largest first
}`, 'O(n)', '`descendingMap()` is a view, not a copy: no extra cost to create.'),
      r('Get all keys below x, or from x upward', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(1, 1, 5, 5, 9, 9));
SortedMap<Integer, Integer> below = tree.headMap(5);          // keys < 5
NavigableMap<Integer, Integer> upTo = tree.headMap(5, true);  // keys <= 5
NavigableMap<Integer, Integer> from = tree.tailMap(5, true);  // keys >= 5`, 'O(log n) + size', 'These are live views: changes to the view change the TreeMap.'),
      r('Get all keys between a and b', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(1, 1, 5, 5, 9, 9));
int lo = 2, hi = 9;
NavigableMap<Integer, Integer> mid = tree.subMap(lo, true, hi, true);   // lo <= key <= hi
int howMany = mid.size();
for (var e : mid.entrySet()) {
    // only keys in [lo, hi]
}`, 'O(log n) + size', 'The 2-argument `subMap(lo, hi)` is lo inclusive, hi **exclusive**. Use the 4-argument version to be explicit.'),
      r('Remove every key below a cutoff', `
TreeMap<Integer, Integer> tree = new TreeMap<>(Map.of(1, 1, 5, 5, 9, 9));
int cutoff = 5;
tree.headMap(cutoff).clear();   // removes keys < cutoff straight from the TreeMap`, 'O(k log n)', 'Clearing a view clears those keys from the real map.'),
    ]),
    recipes('Sorted multiset (count per value)', [
      r('Add a value to the multiset', `
TreeMap<Integer, Integer> bag = new TreeMap<>();   // value -> how many copies
bag.merge(x, 1, Integer::sum);`, 'O(log n)', 'Java has no built-in multiset. TreeMap of counts is the standard stand-in.'),
      r('Remove one copy, delete the key at zero', `
TreeMap<Integer, Integer> bag = new TreeMap<>(Map.of(4, 2));
int out = 4;
if (bag.merge(out, -1, Integer::sum) == 0) bag.remove(out);

// One call: returning null removes the key
bag.computeIfPresent(out, (kk, v) -> v == 1 ? null : v - 1);`, 'O(log n)', 'If you forget to remove zeros, `firstKey()` / `lastKey()` return values that are no longer in the window.'),
      r('Sliding window: max minus min within limit', `
// Longest subarray where max - min <= limit (LeetCode 1438)
int limit = 4, left = 0, best = 0;
TreeMap<Integer, Integer> window = new TreeMap<>();
for (int right = 0; right < nums.length; right++) {
    window.merge(nums[right], 1, Integer::sum);
    while (window.lastKey() - window.firstKey() > limit) {
        int gone = nums[left++];
        if (window.merge(gone, -1, Integer::sum) == 0) window.remove(gone);
    }
    best = Math.max(best, right - left + 1);
}
return best;`, 'O(n log n)', 'Min and max of the current window are just `firstKey()` and `lastKey()`.'),
      r('Find the median of a window by walking the counts', `
// Keep the window in one multiset and walk to the middle
TreeMap<Integer, Integer> window = new TreeMap<>();
for (int idx = 0; idx < k; idx++) window.merge(nums[idx], 1, Integer::sum);
int middle = (k - 1) / 2, seenSoFar = 0, median = 0;
for (var e : window.entrySet()) {
    seenSoFar += e.getValue();
    if (seenSoFar > middle) { median = e.getKey(); break; }
}`, 'O(k) per query', 'Fine for small k. For large k, use two heaps or two TreeMaps (low half, high half).'),
    ]),
    recipes('Intervals and booking', [
      r('Book an interval if it does not overlap (My Calendar I)', `
class MyCalendar {
    private final TreeMap<Integer, Integer> booked = new TreeMap<>();   // start -> end

    boolean book(int start, int end) {
        Integer prevStart = booked.floorKey(start);       // meeting starting at or before me
        Integer nextStart = booked.ceilingKey(start);     // meeting starting at or after me
        if (prevStart != null && booked.get(prevStart) > start) return false;  // it runs into me
        if (nextStart != null && nextStart < end) return false;               // I run into it
        booked.put(start, end);
        return true;
    }
}`, 'O(log n) per call', 'Half-open intervals [start, end): touching ends are allowed, so use `>` and `<`, not `>=`.'),
      r('Find which interval contains a point', `
TreeMap<Integer, Integer> spans = new TreeMap<>();   // start -> end (non-overlapping)
spans.put(1, 4);
spans.put(10, 12);
Map.Entry<Integer, Integer> e = spans.floorEntry(x);
boolean inside = e != null && x <= e.getValue();   // x is in [start, end]`, 'O(log n)'),
      r('Count how many events overlap at once (sweep line)', `
// Max rooms needed: +1 at start, -1 at end, then walk in time order
TreeMap<Integer, Integer> delta = new TreeMap<>();
for (int[] in : intervals) {
    delta.merge(in[0], 1, Integer::sum);
    delta.merge(in[1], -1, Integer::sum);
}
int running = 0, maxOverlap = 0;
for (int change : delta.values()) {
    running += change;
    maxOverlap = Math.max(maxOverlap, running);
}
return maxOverlap;`, 'O(n log n)', 'Same-time start and end cancel inside one key, which is right for half-open intervals.'),
      r('Merge a new interval into a set of ranges', `
TreeMap<Integer, Integer> ranges = new TreeMap<>();  // start -> end, non-overlapping
int lo = 3, hi = 7;
Map.Entry<Integer, Integer> left = ranges.floorEntry(lo);
if (left != null && left.getValue() >= lo) {        // overlaps the range on the left
    lo = left.getKey();
    hi = Math.max(hi, left.getValue());
}
Map.Entry<Integer, Integer> next = ranges.ceilingEntry(lo);
while (next != null && next.getKey() <= hi) {       // swallow ranges that start inside
    hi = Math.max(hi, next.getValue());
    ranges.remove(next.getKey());
    next = ranges.ceilingEntry(lo);
}
ranges.put(lo, hi);`, 'O(log n) amortized', 'Range Module / Summary Ranges style problems.'),
    ]),
    warn("`floorKey`, `ceilingKey`, `lowerKey`, `higherKey` and their Entry versions return **null** when nothing qualifies. `int k = tree.floorKey(x)` crashes with NullPointerException. Store in `Integer` and check.", 'The null trap'),
    warn("`firstKey()` and `lastKey()` **throw** on an empty map, while `firstEntry()` and `lastEntry()` return null. In a sliding window, check `isEmpty()` first or use the Entry versions."),
    warn("A comparator that returns 0 for two different keys makes TreeMap treat them as the **same key**: the second `put` overwrites the first. Add a tie-breaker."),
    tip("Say it as a question: \"biggest key **at most** x\" = `floorKey`, \"smallest key **at least** x\" = `ceilingKey`. Add \"strictly\" and it becomes `lowerKey` / `higherKey`."),
    costs([
      ['Add / overwrite', '`put(k, v)`, `merge(k, v, fn)`', 'O(log n)'],
      ['Read', '`get(k)`, `getOrDefault(k, d)`', 'O(log n)'],
      ['Has key', '`containsKey(k)`', 'O(log n)'],
      ['Remove', '`remove(k)`', 'O(log n)'],
      ['Nearest key', '`floorKey`, `ceilingKey`, `lowerKey`, `higherKey`', 'O(log n)'],
      ['Smallest / largest', '`firstKey()`, `lastKey()`, `firstEntry()`, `lastEntry()`', 'O(log n)'],
      ['Pop smallest / largest', '`pollFirstEntry()`, `pollLastEntry()`', 'O(log n)'],
      ['Range view', '`headMap`, `tailMap`, `subMap`', 'O(log n) to create'],
      ['Loop', '`entrySet()`, `descendingMap()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: put 5 numbers in a TreeMap, print the floor and ceiling of a number between them (with null checks), then pop the smallest. Then do **My Calendar I** and **Time Based Key-Value Store**."),
  ],
};
