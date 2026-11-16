// Java Cheatsheet: TreeSet. Sorted unique values: nearest value, smallest/largest, ranges, and
// custom-ordered sets of int[]. Same layout as hashmap.js.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'treeset',
  title: 'TreeSet',
  summary: 'Sorted unique values. Nearest value to x, smallest/largest, pop from both ends, ranges.',
  tags: ['treeset', 'sorted set', 'floor', 'ceiling', 'higher', 'lower', 'first', 'last', 'pollfirst', 'closest', 'comparator', 'nearby almost duplicate'],
  blocks: [
    t("A TreeSet holds **unique values kept in sorted order**. Every call is O(log n). Reach for it when you need \"the closest value to x\", \"the smallest value still available\", or a set you can pop from both ends. It is a TreeMap with only keys. If you need duplicates, use a TreeMap of counts instead."),
    key("Two ideas cover most problems: `floor(x)` / `ceiling(x)` for the nearest value at or below / at or above x (they return **null** when there is none), and `first()` / `last()` / `pollFirst()` for the smallest and largest."),
    recipes('Create', [
      r('Make an empty sorted set', `
TreeSet<Integer> sorted = new TreeSet<>();      // smallest first
TreeSet<String> words2 = new TreeSet<>();       // A-Z`, 'O(1)', 'Declare as `TreeSet<T>`, not `Set<T>`, or you lose floor, ceiling, first and the rest.'),
      r('Make a sorted set from an array or list', `
TreeSet<Integer> fromList = new TreeSet<>(list);     // duplicates dropped, sorted
TreeSet<Integer> fromArr = new TreeSet<>();
for (int num : nums) fromArr.add(num);`, 'O(n log n)'),
      r('Make a set sorted from largest to smallest', `
TreeSet<Integer> desc = new TreeSet<>(Comparator.reverseOrder());
desc.addAll(List.of(1, 5, 3));
int biggest = desc.first();              // 5`, 'O(1)', 'With a reversed comparator, `floor` and `ceiling` flip meaning. Often simpler: normal order plus `last()`.'),
    ]),
    recipes('Add, check and remove', [
      r('Add a value and see if it was new', `
TreeSet<Integer> sorted = new TreeSet<>();
boolean added = sorted.add(4);    // true
boolean again = sorted.add(4);    // false: already there, set unchanged`, 'O(log n)'),
      r('Check if a value is in the set', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(1, 4, 9));
if (sorted.contains(4)) {
    // 4 is in
}`, 'O(log n)'),
      r('Remove a value', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(1, 4, 9));
sorted.remove(4);                   // returns true if it was there`, 'O(log n)'),
    ]),
    recipes('Smallest and largest', [
      r('Get the smallest and largest value', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(3, 8, 1));
int smallest = sorted.first();      // 1, throws if empty
int largest = sorted.last();        // 8, throws if empty`, 'O(log n)', '`first()` / `last()` throw NoSuchElementException on an empty set. Check `isEmpty()` first.'),
      r('Remove and return the smallest or largest', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(3, 8, 1));
Integer low = sorted.pollFirst();   // 1, removed. null if empty (no throw)
Integer high = sorted.pollLast();   // 8, removed`, 'O(log n)', 'A priority queue that also lets you pop the largest and search. Values must be unique though.'),
      r('Smallest free number (seat reservation)', `
class SeatManager {
    private final TreeSet<Integer> free = new TreeSet<>();

    SeatManager(int n) {
        for (int seat = 1; seat <= n; seat++) free.add(seat);
    }

    int reserve() {
        return free.pollFirst();           // lowest free seat
    }

    void unreserve(int seat) {
        free.add(seat);
    }
}`, 'O(log n) per call', 'Any "hand out the smallest available id" problem. A min-heap works too when ids are unique.'),
    ]),
    recipes('Find the nearest value', [
      r('Get the largest value that is <= x', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(10, 20, 30));
Integer atMost = sorted.floor(25);       // 20. null if everything is bigger
if (atMost != null) {
    // use atMost
}`, 'O(log n)', 'Store in `Integer`, not `int`: a null result crashes when unboxed.'),
      r('Get the smallest value that is >= x', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(10, 20, 30));
Integer atLeast = sorted.ceiling(25);    // 30. null if everything is smaller
if (atLeast != null) {
    // use atLeast
}`, 'O(log n)'),
      r('Get the value strictly below or strictly above x', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(10, 20, 30));
Integer below = sorted.lower(20);        // 10 (skips 20 itself)
Integer above = sorted.higher(20);       // 30
Integer none = sorted.higher(30);        // null`, 'O(log n)', 'floor/ceiling include x; lower/higher never return x.'),
      r('Find the value closest to x', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(2, 9, 15));
Integer lo = sorted.floor(x), hi = sorted.ceiling(x);
int closest;
if (lo == null) closest = hi;                    // set must not be empty
else if (hi == null) closest = lo;
else closest = (x - lo <= hi - x) ? lo : hi;     // tie goes to the smaller`, 'O(log n)', 'Check both sides: the closest value can be just below or just above.'),
      r('Smallest gap between x and anything in the set', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(2, 9, 15));
int gap = Integer.MAX_VALUE;
Integer lo = sorted.floor(x), hi = sorted.ceiling(x);
if (lo != null) gap = Math.min(gap, x - lo);
if (hi != null) gap = Math.min(gap, hi - x);`, 'O(log n)', 'Build the set as you go and query before adding: minimum difference between an element and any earlier one.'),
    ]),
    recipes('Ranges and loops', [
      r('Loop in sorted order', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(3, 1, 2));
for (int v : sorted) {
    // 1, 2, 3
}`, 'O(n)'),
      r('Loop from largest to smallest', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(3, 1, 2));
for (int v : sorted.descendingSet()) {
    // 3, 2, 1
}
Iterator<Integer> it = sorted.descendingIterator();
while (it.hasNext()) {
    int v = it.next();
}`, 'O(n)', '`descendingSet()` is a view, not a copy.'),
      r('Get all values below x, or from x upward', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(1, 5, 9));
SortedSet<Integer> under = sorted.headSet(5);               // < 5
NavigableSet<Integer> upTo = sorted.headSet(5, true);       // <= 5
NavigableSet<Integer> fromFive = sorted.tailSet(5, true);   // >= 5`, 'O(log n) + size', 'Views are live: removing from the view removes from the set.'),
      r('Get all values between a and b', `
TreeSet<Integer> sorted = new TreeSet<>(List.of(1, 5, 9));
int lo = 2, hi = 9;
NavigableSet<Integer> between = sorted.subSet(lo, true, hi, true);   // lo <= v <= hi
int howMany = between.size();`, 'O(log n) + size', '`subSet(lo, hi)` with 2 arguments excludes hi. Use the 4-argument version to say what you mean.'),
    ]),
    recipes('Custom order (int[] and objects)', [
      r('Sorted set of pairs with a tie-breaker', `
// Sort by score, then by id so two players with the same score both stay
TreeSet<int[]> board = new TreeSet<>((e1, e2) ->
        e1[0] != e2[0] ? Integer.compare(e1[0], e2[0]) : Integer.compare(e1[1], e2[1]));
board.add(new int[]{50, 7});   // {score, id}
board.add(new int[]{50, 3});   // kept: same score, different id
int[] lowest = board.first();  // {50, 3}`, 'O(log n)', 'Without the id tie-breaker the second player with score 50 is silently dropped.'),
      r('Remove or find a pair by its contents', `
TreeSet<int[]> board = new TreeSet<>((e1, e2) ->
        e1[0] != e2[0] ? Integer.compare(e1[0], e2[0]) : Integer.compare(e1[1], e2[1]));
board.add(new int[]{50, 7});
board.remove(new int[]{50, 7});              // works: TreeSet compares with YOUR comparator
boolean has = board.contains(new int[]{50, 7});   // false now`, 'O(log n)', 'Unlike HashSet, a TreeSet with a comparator matches `int[]` by contents. Handy for "update a score": remove old pair, add new pair.'),
      r('Sorted set with a comparator built from fields', `
TreeSet<int[]> events = new TreeSet<>(
        Comparator.<int[]>comparingInt(e -> e[0])     // by time
                  .thenComparingInt(e -> e[1]));      // then by id
events.add(new int[]{3, 1});
int[] next = events.ceiling(new int[]{2, Integer.MIN_VALUE});   // first event at time >= 2`, 'O(log n)', 'To search by one field, build a probe array with `MIN_VALUE` / `MAX_VALUE` in the tie-breaker slot.'),
    ]),
    recipes('Common problem patterns', [
      r('Contains nearby almost duplicate (window TreeSet)', `
// Is there i != j with |i - j| <= indexDiff and |nums[i] - nums[j]| <= valueDiff?
int indexDiff = k, valueDiff = 2;
TreeSet<Long> window = new TreeSet<>();             // long: avoids overflow on +/-
for (int idx = 0; idx < nums.length; idx++) {
    long v = nums[idx];
    Long near = window.ceiling(v - valueDiff);       // smallest value >= v - valueDiff
    if (near != null && near <= v + valueDiff) return true;
    window.add(v);
    if (idx >= indexDiff) window.remove((long) nums[idx - indexDiff]);   // slide the window
}
return false;`, 'O(n log k)', 'LeetCode 220. One `ceiling` call checks the whole value range [v - d, v + d].'),
      r('Third maximum distinct number', `
TreeSet<Integer> top = new TreeSet<>();
for (int num : nums) {
    top.add(num);
    if (top.size() > 3) top.pollFirst();     // keep only the 3 largest distinct
}
return top.size() == 3 ? top.first() : top.last();`, 'O(n)', 'Set size never passes 3, so each step is O(1) in practice.'),
      r('Count values smaller than x seen so far', `
TreeSet<Integer> before = new TreeSet<>();
before.addAll(List.of(1, 4, 6));
int smallerCount = before.headSet(x, false).size();   // values < x`, 'O(log n + answer)', '`size()` on a view walks it, so this is not O(log n). For many queries use a Fenwick tree.'),
      r('Distinct values in sorted order', `
TreeSet<Integer> distinct = new TreeSet<>();
for (int num : nums) distinct.add(num);
List<Integer> ascending = new ArrayList<>(distinct);   // sorted, no duplicates
int[] asArray = distinct.stream().mapToInt(Integer::intValue).toArray();`, 'O(n log n)'),
    ]),
    warn("If your comparator returns **0** for two different items, TreeSet treats them as the same item and **drops the second one** (`add` returns false). Sorting `int[]` by score alone loses every player with a tied score. Always add a tie-breaker, such as the id or index.", 'The comparator-0 trap'),
    warn("`floor`, `ceiling`, `lower`, `higher`, `pollFirst` and `pollLast` return **null** when there is nothing to return; `first()` and `last()` **throw** on an empty set. Store results in `Integer` and check."),
    tip("Need duplicates? TreeSet cannot hold them. Use a `TreeMap<Integer, Integer>` of counts, or put `{value, index}` pairs in a TreeSet so each entry is unique."),
    costs([
      ['Add', '`add(x)`', 'O(log n)'],
      ['Has value', '`contains(x)`', 'O(log n)'],
      ['Remove', '`remove(x)`', 'O(log n)'],
      ['Nearest value', '`floor`, `ceiling`, `lower`, `higher`', 'O(log n)'],
      ['Smallest / largest', '`first()`, `last()`', 'O(log n)'],
      ['Pop smallest / largest', '`pollFirst()`, `pollLast()`', 'O(log n)'],
      ['Range view', '`headSet`, `tailSet`, `subSet`', 'O(log n) to create'],
      ['Loop', '`for (x : set)`, `descendingSet()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: put 5 numbers in a TreeSet, find the closest value to some x with `floor` and `ceiling` (null checks!), then build a `TreeSet<int[]>` sorted by score with an id tie-breaker. Then do **Contains Duplicate III** and **Seat Reservation Manager**."),
  ],
};
