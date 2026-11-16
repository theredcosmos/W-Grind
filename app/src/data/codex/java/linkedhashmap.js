// Java Cheatsheet: LinkedHashMap. A HashMap that remembers order: insertion order by default,
// or access order for an LRU cache. Same layout as hashmap.js.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'linkedhashmap',
  title: 'LinkedHashMap',
  summary: 'A HashMap that remembers order. First unique, ordered counting, and the LRU cache.',
  tags: ['linkedhashmap', 'map', 'order', 'insertion order', 'lru', 'cache', 'first unique', 'removeeldestentry', 'access order'],
  blocks: [
    t("A LinkedHashMap is a HashMap with a list running through its entries, so it loops in **the order keys were first added**. Everything is still O(1). Reach for it when the problem says \"first\" (first unique character, first to reach k) or when you need an **LRU cache**: build it with access order on, and the least recently used key sits at the front, ready to be evicted."),
    key("Two things cover most problems: `new LinkedHashMap<>()` when you need the loop to come out in insertion order, and `new LinkedHashMap<>(cap, 0.75f, true)` + `removeEldestEntry` for an LRU cache. Every other call is the same as HashMap."),
    recipes('Create', [
      r('Make a map that keeps insertion order', `
Map<String, Integer> seenOrder = new LinkedHashMap<>();
seenOrder.put("pear", 2);
seenOrder.put("apple", 5);
seenOrder.put("fig", 1);
System.out.println(seenOrder);     // {pear=2, apple=5, fig=1}: the order you added them`, 'O(1)', 'Declare as `Map<K, V>` unless you need the Java 21 first/last methods; then declare as `LinkedHashMap<K, V>`.'),
      r('Make a map that keeps access order (for LRU)', `
// (initial capacity, load factor, accessOrder)
LinkedHashMap<Integer, Integer> lru = new LinkedHashMap<>(16, 0.75f, true);
lru.put(1, 10);
lru.put(2, 20);
lru.get(1);                        // touching 1 moves it to the END
// order is now 2, 1: the front is the least recently used`, 'O(1)', 'The third argument `true` is the whole trick. `false` (the default) means insertion order.'),
      r('Copy a HashMap but keep a fixed order', `
Map<Integer, Integer> ordered = new LinkedHashMap<>();
for (int num : nums) ordered.put(num, freq.getOrDefault(num, 0));   // order follows nums`, 'O(n)', 'Copying a plain HashMap with `new LinkedHashMap<>(hashMap)` keeps the HashMap\'s random order, not the order you want.'),
    ]),
    recipes('Read and update', [
      r('Count things and keep the order they first appeared', `
Map<Character, Integer> cnt = new LinkedHashMap<>();
for (char ch : s.toCharArray()) {
    cnt.merge(ch, 1, Integer::sum);
}
// Looping cnt now goes in first-seen order: a, b, c ...`, 'O(n)', 'Updating an existing key does **not** move it; it keeps its first position.'),
      r('Move a key to the end on purpose', `
Map<String, Integer> seenOrder = new LinkedHashMap<>(Map.of("apple", 1, "fig", 0));
// In insertion-order mode, re-adding does NOT move a key. Remove it first:
Integer v = seenOrder.remove("apple");
if (v != null) seenOrder.put("apple", v);   // now "apple" is last`, 'O(1)', 'In access-order mode, a plain `get` or `put` already moves the key to the end.'),
      r('Read without changing the LRU order', `
LinkedHashMap<Integer, Integer> lru = new LinkedHashMap<>(16, 0.75f, true);
// In access-order mode get/put/getOrDefault all count as "use".
boolean present = lru.containsKey(1);    // does NOT move the key
// Looping keySet()/entrySet() also does not move anything`, 'O(1)', '`containsKey` is the safe peek when you must not refresh a key.'),
      r('Update the value only if the key exists', `
Map<String, Integer> seenOrder = new LinkedHashMap<>(Map.of("apple", 1, "fig", 0));
if (seenOrder.containsKey("fig")) {
    seenOrder.put("fig", seenOrder.get("fig") + 1);   // position unchanged
}
seenOrder.computeIfPresent("fig", (kk, v) -> v + 1);  // same, one call`, 'O(1)'),
    ]),
    recipes('Get the first or last entry', [
      r('Get the oldest (first) entry', `
LinkedHashMap<String, Integer> byTime = new LinkedHashMap<>();
byTime.put("a", 1);
byTime.put("b", 2);

Map.Entry<String, Integer> first = byTime.firstEntry();   // Java 21+, null if empty
if (first != null) {
    String oldestKey = first.getKey();
}

// Works on any Java version (map must not be empty):
String firstKey = byTime.keySet().iterator().next();`, 'O(1)', '`firstEntry()` exists from Java 21 (SequencedMap). On older Java use the iterator line.'),
      r('Get the newest (last) entry', `
LinkedHashMap<String, Integer> byTime = new LinkedHashMap<>(Map.of("a", 1));
Map.Entry<String, Integer> last = byTime.lastEntry();     // Java 21+, null if empty

// Older Java: no fast way, you have to walk to the end
String lastKey = null;
for (String kk : byTime.keySet()) lastKey = kk;`, 'O(1)', 'Before Java 21 "last" costs O(n). If you need it often on old Java, keep a separate variable.'),
      r('Remove and return the oldest entry', `
LinkedHashMap<Integer, Integer> window = new LinkedHashMap<>();
window.put(7, 1);
Map.Entry<Integer, Integer> oldest = window.pollFirstEntry();   // Java 21+, null if empty

// Older Java:
if (!window.isEmpty()) {
    Iterator<Integer> it = window.keySet().iterator();
    int eldestKey = it.next();
    it.remove();
}`, 'O(1)'),
      r('Loop from newest to oldest', `
LinkedHashMap<String, Integer> byTime = new LinkedHashMap<>(Map.of("a", 1));
for (var e : byTime.reversed().entrySet()) {     // Java 21+
    System.out.println(e.getKey() + " " + e.getValue());
}

// Older Java: copy the keys and walk backwards
List<String> keysInOrder = new ArrayList<>(byTime.keySet());
for (int idx = keysInOrder.size() - 1; idx >= 0; idx--) {
    String kk = keysInOrder.get(idx);
}`, 'O(n)'),
    ]),
    recipes('Loop through it', [
      r('Loop key and value in insertion order', `
Map<String, Integer> seenOrder = new LinkedHashMap<>(Map.of("apple", 1, "fig", 0));
for (var e : seenOrder.entrySet()) {
    String name = e.getKey();
    int qty = e.getValue();
    // comes out in the order the keys were first put
}`, 'O(n)', 'Same as HashMap; the only difference is the order is predictable.'),
      r('Collect the keys into a list, in order', `
Map<String, Integer> seenOrder = new LinkedHashMap<>(Map.of("apple", 1, "fig", 0));
List<String> inOrder = new ArrayList<>(seenOrder.keySet());
List<Integer> valuesInOrder = new ArrayList<>(seenOrder.values());`, 'O(n)'),
      r('Remove entries while looping (order kept)', `
Map<String, Integer> seenOrder = new LinkedHashMap<>(Map.of("apple", 1, "fig", 0));
seenOrder.entrySet().removeIf(e -> e.getValue() == 0);   // the rest keep their order`, 'O(n)', 'Calling `seenOrder.remove(k)` inside a for-each throws ConcurrentModificationException.'),
    ]),
    recipes('LRU cache', [
      r('LRU cache: the short version (extend LinkedHashMap)', `
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true);           // true = access order
        this.capacity = capacity;
    }

    public int get(int key) {
        return getOrDefault(key, -1);           // counts as a use: moves key to the end
    }

    public void put(int key, int value) {
        super.put(key, value);                  // add or refresh, then maybe evict
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;               // Java removes the eldest when this is true
    }
}`, 'O(1) per call', 'This is the LeetCode 146 answer. `removeEldestEntry` runs after every `put`; you never remove by hand.'),
      r('LRU cache: wrap a map instead of extending it', `
class LRU {
    private final int cap;
    private final LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(16, 0.75f, true);

    LRU(int cap) { this.cap = cap; }

    int get(int key) {
        Integer v = cache.get(key);             // refreshes the key
        return v == null ? -1 : v;
    }

    void put(int key, int value) {
        cache.put(key, value);
        if (cache.size() > cap) {
            int eldest = cache.keySet().iterator().next();   // front = least recently used
            cache.remove(eldest);
        }
    }
}`, 'O(1) per call', 'Use this when an interviewer asks "without overriding". Same idea, eviction done by hand.'),
      r('LRU cache with insertion-order map (manual refresh)', `
class LRUManual {
    private final int cap;
    private final Map<Integer, Integer> cache = new LinkedHashMap<>();   // insertion order

    LRUManual(int cap) { this.cap = cap; }

    int get(int key) {
        if (!cache.containsKey(key)) return -1;
        int v = cache.remove(key);              // take it out...
        cache.put(key, v);                      // ...and put it back at the end
        return v;
    }

    void put(int key, int value) {
        cache.remove(key);                      // so it re-enters at the end
        cache.put(key, value);
        if (cache.size() > cap) cache.remove(cache.keySet().iterator().next());
    }
}`, 'O(1) per call', 'Handy if you forget the 3-argument constructor: remove + put moves a key to the end.'),
    ]),
    recipes('Common problem patterns', [
      r('First unique character in a string', `
Map<Character, Integer> cnt = new LinkedHashMap<>();
for (char ch : s.toCharArray()) cnt.merge(ch, 1, Integer::sum);
for (var e : cnt.entrySet()) {
    if (e.getValue() == 1) return s.indexOf(e.getKey());   // first one with count 1
}
return -1;`, 'O(n)', 'The second loop is over at most 26 (or alphabet size) keys, not the whole string.'),
      r('First unique number in a stream', `
class FirstUnique {
    private final Map<Integer, Boolean> unique = new LinkedHashMap<>();   // value -> still unique?
    private final Set<Integer> dup = new HashSet<>();

    void add(int value) {
        if (dup.contains(value)) return;
        if (unique.containsKey(value)) {        // second time: no longer unique
            unique.remove(value);
            dup.add(value);
        } else {
            unique.put(value, true);
        }
    }

    int showFirstUnique() {
        return unique.isEmpty() ? -1 : unique.keySet().iterator().next();
    }
}`, 'O(1) per call', 'The front of the map is always the oldest number that is still unique.'),
      r('Remove duplicates but keep the first occurrence order', `
Map<Integer, Boolean> keep = new LinkedHashMap<>();
for (int num : nums) keep.putIfAbsent(num, true);
List<Integer> deduped = new ArrayList<>(keep.keySet());   // [first-seen order]

// Same thing with a LinkedHashSet:
List<Integer> deduped2 = new ArrayList<>(new LinkedHashSet<>(list));`, 'O(n)', '`LinkedHashSet` is the set version: unique values, insertion order.'),
      r('Group words, groups in order of first appearance', `
Map<String, List<String>> groups = new LinkedHashMap<>();
for (String w : words) {
    char[] arr = w.toCharArray();
    Arrays.sort(arr);
    groups.computeIfAbsent(new String(arr), kk -> new ArrayList<>()).add(w);
}
List<List<String>> answer = new ArrayList<>(groups.values());   // stable, predictable order`, 'O(n * L log L)', 'Useful when the expected output order matches input order, or just to make debugging less confusing.'),
    ]),
    warn("In the default (insertion-order) mode, `put` on a key that already exists does **not** move it. In access-order mode (`true`), even `get` and `getOrDefault` move the key to the end. Know which mode you built.", 'Which order am I in?'),
    warn("`firstEntry()`, `lastEntry()`, `pollFirstEntry()` and `reversed()` are Java 21+. If the judge runs an older Java, use `keySet().iterator().next()` for the first key."),
    tip("LRU in one breath: **access order true, evict when size > capacity**. The front of the map is the victim."),
    costs([
      ['Add / overwrite', '`put(k, v)`', 'O(1)'],
      ['Read', '`get(k)`, `getOrDefault(k, d)`', 'O(1)'],
      ['Has key', '`containsKey(k)`', 'O(1)'],
      ['Remove', '`remove(k)`', 'O(1)'],
      ['First / last entry (Java 21)', '`firstEntry()`, `lastEntry()`', 'O(1)'],
      ['Remove oldest (Java 21)', '`pollFirstEntry()`', 'O(1)'],
      ['First key (any Java)', '`keySet().iterator().next()`', 'O(1)'],
      ['Loop in order', '`entrySet()`, `keySet()`, `values()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: write the LRU cache by extending LinkedHashMap (constructor with `true`, `get`, `put`, `removeEldestEntry`). Then do **LRU Cache** and **First Unique Character in a String**."),
  ],
};
