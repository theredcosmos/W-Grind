// Java Cheatsheet: sorting and comparators (shape like hashmap.js).
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'sorting',
  title: 'Sorting and comparators',
  summary: 'Sort anything by any rule: arrays, lists, intervals, objects, ties. The comparator cheat codes.',
  tags: ['sort', 'comparator', 'comparing', 'thenComparing', 'reverse', 'descending', 'intervals', 'custom sort', 'record'],
  blocks: [
    t("A comparator answers one question: should `a` come before `b`? Return a **negative** number for \"a first\", **positive** for \"b first\", **0** for \"equal\". Write it with `Integer.compare(a, b)` or `Comparator.comparing(...)` and you never have to think about the sign again."),
    key("Ascending: `Integer.compare(a, b)`. Descending: swap them, `Integer.compare(b, a)`. Ties: chain `.thenComparing(...)`. `int[]` cannot be sorted descending directly; use `Integer[]`, a list, or sort then reverse."),
    recipes('Sort numbers', [
      r('Sort an int array (small to big)', `
Arrays.sort(nums);                          // in place`, 'O(n log n)'),
      r('Sort an int array big to small', `
// Option 1: sort, then reverse in place
Arrays.sort(nums);
for (int lo = 0, hi = nums.length - 1; lo < hi; lo++, hi--) {
    int tmp = nums[lo]; nums[lo] = nums[hi]; nums[hi] = tmp;
}

// Option 2: boxed copy
Integer[] boxed = Arrays.stream(nums).boxed().toArray(Integer[]::new);
Arrays.sort(boxed, Collections.reverseOrder());`, 'O(n log n)', '`Arrays.sort(int[], comparator)` does not exist: comparators only work on objects.'),
      r('Sort a list ascending and descending', `
Collections.sort(list);                      // small to big
list.sort(Collections.reverseOrder());       // big to small
list.sort(null);                             // natural order, same as Collections.sort`, 'O(n log n)'),
      r('Sort only part of an array', `
Arrays.sort(nums, 1, 3);                     // sorts index 1 and 2 (end is exclusive)`, 'O(k log k)'),
    ]),
    recipes('Sort arrays of arrays (intervals, points)', [
      r('Sort intervals by start', `
Arrays.sort(intervals, (p, q) -> Integer.compare(p[0], q[0]));
// same thing:
Arrays.sort(intervals, Comparator.comparingInt(iv -> iv[0]));`, 'O(n log n)'),
      r('Sort by end, then by start when ends tie', `
Arrays.sort(intervals, (p, q) -> p[1] != q[1]
        ? Integer.compare(p[1], q[1])
        : Integer.compare(p[0], q[0]));`, 'O(n log n)', 'Sort by end for "max non-overlapping intervals" / "min arrows" greedy problems.'),
      r('Sort by first value ascending, second descending', `
// Russian doll envelopes: width up, height down for equal widths
Arrays.sort(points, (p, q) -> p[0] != q[0]
        ? Integer.compare(p[0], q[0])
        : Integer.compare(q[1], p[1]));`, 'O(n log n)'),
      r('Sort points by distance to the origin', `
Arrays.sort(points, Comparator.comparingInt(pt -> pt[0] * pt[0] + pt[1] * pt[1]));`, 'O(n log n)'),
      r('Sort indices by their values (keep original positions)', `
Integer[] order = new Integer[nums.length];
for (int idx = 0; idx < nums.length; idx++) order[idx] = idx;
Arrays.sort(order, (p, q) -> Integer.compare(nums[p], nums[q]));
// order[0] is the index of the smallest value`, 'O(n log n)', 'Use when you must sort but still need each value\'s original index.'),
    ]),
    recipes('Sort strings and objects', [
      r('Sort strings by length, then alphabetically', `
List<String> ws = new ArrayList<>(List.of(words));
ws.sort(Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));`, 'O(n log n)'),
      r('Sort strings alphabetically, ignoring case', `
List<String> ws = new ArrayList<>(List.of(words));
ws.sort(String.CASE_INSENSITIVE_ORDER);`, 'O(n log n)'),
      r('Sort numbers as strings to form the largest number', `
String[] parts = Arrays.stream(nums).mapToObj(String::valueOf).toArray(String[]::new);
Arrays.sort(parts, (p, q) -> (q + p).compareTo(p + q));   // "9" + "34" beats "34" + "9"
String biggest = parts[0].equals("0") ? "0" : String.join("", parts);`, 'O(n log n)'),
      r('Sort your own objects by several fields', `
record Person(String name, int age) {}
List<Person> people = new ArrayList<>(List.of(new Person("ann", 30), new Person("bob", 25)));
people.sort(Comparator.comparingInt(Person::age)       // youngest first
        .thenComparing(Person::name));                  // then by name
people.sort(Comparator.comparingInt(Person::age).reversed());   // oldest first`, 'O(n log n)', 'A `record` is the quickest way to bundle fields for sorting or a heap.'),
      r('Sort map entries by value', `
List<Map.Entry<String, Integer>> entries = new ArrayList<>(scores.entrySet());
entries.sort(Map.Entry.comparingByValue(Comparator.reverseOrder()));   // highest value first`, 'O(n log n)'),
      r('Sort characters by how often they appear', `
Map<Character, Integer> cnt = new HashMap<>();
for (char ch : s.toCharArray()) cnt.merge(ch, 1, Integer::sum);
List<Character> letters = new ArrayList<>(cnt.keySet());
letters.sort((p, q) -> cnt.get(q) - cnt.get(p));      // most frequent first
StringBuilder sb = new StringBuilder();
for (char ch : letters) sb.append(String.valueOf(ch).repeat(cnt.get(ch)));`, 'O(n log n)'),
    ]),
    recipes('Write a comparator from scratch', [
      r('The four comparator shapes you need', `
Comparator<int[]> byFirst = (p, q) -> Integer.compare(p[0], q[0]);
Comparator<int[]> byFirstDesc = (p, q) -> Integer.compare(q[0], p[0]);
Comparator<int[]> withTie = byFirst.thenComparing((p, q) -> Integer.compare(p[1], q[1]));
Comparator<int[]> reversed = byFirst.reversed();`, null, 'Same comparators work for `Arrays.sort`, `list.sort`, `PriorityQueue` and `TreeMap`/`TreeSet`.'),
      r('Compare longs and doubles safely', `
Comparator<long[]> byLong = (p, q) -> Long.compare(p[0], q[0]);
Comparator<double[]> byDouble = (p, q) -> Double.compare(p[0], q[0]);`, null, 'Never `(int) (a - b)` on longs or doubles: it truncates and overflows.'),
    ]),
    warn("`(a, b) -> a - b` overflows when values are near `Integer.MIN_VALUE`/`MAX_VALUE` (e.g. -2^31 minus 1 wraps to positive) and sorts wrongly. `Integer.compare(a, b)` is always safe.", 'The subtraction trap'),
    warn("A comparator that returns 0 for two different items makes a `TreeSet`/`TreeMap` treat them as **the same** and silently drop one. Always add a tie-breaker there."),
    tip("Java sorts objects with a stable sort: items that compare equal keep their original order. Sort by the secondary key first, then by the primary key, and the result is ordered by both."),
    costs([
      ['Sort int[]', '`Arrays.sort(nums)`', 'O(n log n)'],
      ['Sort objects / list', '`Arrays.sort(arr, cmp)`, `list.sort(cmp)`', 'O(n log n)'],
      ['Reverse a list', '`Collections.reverse(list)`', 'O(n)'],
      ['Compare two ints', '`Integer.compare(a, b)`', 'O(1)'],
    ]),
    drill("From memory: sort `int[][] intervals` by start, merge overlaps, then sort the result by length descending. Then write a comparator for \"most frequent first, ties by smaller number\"."),
  ],
};
