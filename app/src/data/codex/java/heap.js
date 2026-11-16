// Java Cheatsheet: PriorityQueue (heap). Always hands back the smallest (or largest) item:
// top k, kth largest, merging sorted lists, scheduling, running median.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'heap',
  title: 'PriorityQueue (heap)',
  summary: 'Smallest (or largest) item out first in O(log n). Top k, kth largest, merge k lists, meeting rooms, median.',
  tags: ['heap', 'priorityqueue', 'priority queue', 'min-heap', 'max-heap', 'comparator', 'top k', 'kth largest', 'k closest', 'merge k', 'meeting rooms', 'median', 'two heaps', 'lazy deletion'],
  blocks: [
    t("A `PriorityQueue` always gives you the **smallest** item first (or the largest, with a reversed comparator), and adding or removing costs O(log n). Reach for it when the problem says \"k largest / smallest / closest / most frequent\", when you keep picking \"the earliest finishing\" or \"the cheapest\" thing, or when you merge many sorted lists. It is **not** a sorted list: only the top is guaranteed."),
    key("Three lines cover most problems: `new PriorityQueue<>()` (min-heap), `new PriorityQueue<>((p, q) -> Integer.compare(q[1], p[1]))` (max-heap of arrays by index 1), and the size-k trick `heap.offer(x); if (heap.size() > k) heap.poll();`."),
    recipes('Create', [
      r('Make a min-heap of numbers', `
PriorityQueue<Integer> minHeap = new PriorityQueue<>();    // smallest on top
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
int smallest = minHeap.peek();                            // 1`, 'O(log n) per add'),
      r('Make a max-heap of numbers', `
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> maxHeap2 = new PriorityQueue<>((p, q) -> Integer.compare(q, p));
PriorityQueue<Integer> maxHeap3 = new PriorityQueue<>((p, q) -> q - p);   // only if values are small`, 'O(1)', '`q - p` overflows when values can be near `Integer.MIN_VALUE` / `MAX_VALUE`. `Integer.compare` never does.'),
      r('Build a heap from numbers you already have', `
List<Integer> values = new ArrayList<>(List.of(4, 1, 7));
PriorityQueue<Integer> heap = new PriorityQueue<>(values);   // O(n) heapify

PriorityQueue<Integer> fromArray = new PriorityQueue<>();
for (int num : nums) fromArray.offer(num);                    // O(n log n), fine too`, 'O(n)'),
    ]),
    recipes('Heap of arrays, entries and objects', [
      r('Heap of int arrays, smallest first value on top', `
PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) -> Integer.compare(p[0], q[0]));
heap.offer(new int[]{3, 100});        // {cost, node}
heap.offer(new int[]{1, 200});
int[] cheapest = heap.poll();         // {1, 200}`, 'O(log n)', 'An `int[]` heap with no comparator compiles but throws ClassCastException on the second `offer`.'),
      r('Max-heap of int arrays sorted by the second value', `
PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) -> Integer.compare(q[1], p[1]));   // q before p = max
heap.offer(new int[]{7, 2});          // {id, score}
heap.offer(new int[]{9, 5});
int[] best = heap.peek();             // {9, 5}`, 'O(log n)', 'Swap `p` and `q` to flip between min and max. Say "p first = small first" in your head.'),
      r('Break ties with a second rule', `
// Highest score first; on equal score, smaller id first
PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) ->
        p[1] != q[1] ? Integer.compare(q[1], p[1]) : Integer.compare(p[0], q[0]));

// Same rule with Comparator helpers
PriorityQueue<int[]> heap2 = new PriorityQueue<>(
        Comparator.<int[]>comparingInt(e -> -e[1]).thenComparingInt(e -> e[0]));`, 'O(log n)', 'With `comparingInt(...).reversed()` the `<int[]>` type hint is needed, or Java cannot infer the type.'),
      r('Heap of map entries by value', `
PriorityQueue<Map.Entry<Integer, Integer>> heap =
        new PriorityQueue<>((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()));   // max by count
heap.addAll(freq.entrySet());
while (!heap.isEmpty()) {
    var e = heap.poll();
    int number = e.getKey(), times = e.getValue();
}`, 'O(n log n)'),
      r('Heap of your own record or class', `
record Task(String name, int priority, int arrival) {}
PriorityQueue<Task> tasks = new PriorityQueue<>(
        Comparator.comparingInt(Task::priority).thenComparingInt(Task::arrival));
tasks.offer(new Task("write", 2, 0));
tasks.offer(new Task("read", 1, 1));
Task next = tasks.poll();             // "read": lower priority number first`, 'O(log n)', 'A record keeps fields named, which beats remembering what `arr[2]` meant.'),
      r('Heap of strings by length, then alphabetically', `
PriorityQueue<String> heap = new PriorityQueue<>(
        Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder()));
heap.offer("pear");
heap.offer("fig");
String shortest = heap.poll();        // "fig"`, 'O(log n)'),
    ]),
    recipes('Use it', [
      r('Look at the top vs take it out', `
PriorityQueue<Integer> heap = new PriorityQueue<>(List.of(4, 1, 7));
int top = heap.peek();          // 1, still in the heap
int removed = heap.poll();      // 1, gone; top is now 4
Integer none = new PriorityQueue<Integer>().peek();   // null when empty (poll too)`, 'peek O(1), poll O(log n)', 'Check `!heap.isEmpty()` before `int v = heap.peek()`, or unboxing null crashes.'),
      r('Get every item out in sorted order', `
PriorityQueue<Integer> heap = new PriorityQueue<>(List.of(4, 1, 7));
List<Integer> sorted = new ArrayList<>();
while (!heap.isEmpty()) {
    sorted.add(heap.poll());          // 1, 4, 7
}`, 'O(n log n)', 'A for-each over the heap or `new ArrayList<>(heap)` is NOT sorted. Only polling is.'),
      r('Remove a specific item', `
PriorityQueue<Integer> heap = new PriorityQueue<>(List.of(4, 1, 7));
heap.remove(7);                       // removes one copy of 7, by value`, 'O(n)', 'Slow. If you remove a lot, use lazy deletion (below) or a `TreeMap` instead.'),
    ]),
    recipes('Top k and kth', [
      r('Find the kth largest number', `
PriorityQueue<Integer> heap = new PriorityQueue<>();    // MIN-heap of the k biggest so far
for (int num : nums) {
    heap.offer(num);
    if (heap.size() > k) heap.poll();                   // kick out the smallest
}
return heap.peek();                                     // smallest of the top k = kth largest`, 'O(n log k)', 'Kth largest uses a **min**-heap; kth smallest uses a **max**-heap. The heap kicks out what you do not want.'),
      r('Top k most frequent numbers', `
Map<Integer, Integer> cnt = new HashMap<>();
for (int num : nums) cnt.merge(num, 1, Integer::sum);
PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) -> Integer.compare(p[1], q[1]));   // min by count
for (var e : cnt.entrySet()) {
    heap.offer(new int[]{e.getKey(), e.getValue()});      // {number, count}
    if (heap.size() > k) heap.poll();
}
int[] top = new int[heap.size()];
for (int idx = top.length - 1; idx >= 0; idx--) top[idx] = heap.poll()[0];   // most frequent first
return top;`, 'O(n log k)'),
      r('k closest points to the origin', `
PriorityQueue<int[]> heap = new PriorityQueue<>(               // MAX-heap by distance
        (p, q) -> Long.compare((long) q[0] * q[0] + (long) q[1] * q[1],
                               (long) p[0] * p[0] + (long) p[1] * p[1]));
for (int[] pt : points) {
    heap.offer(pt);
    if (heap.size() > k) heap.poll();                           // drop the farthest
}
int[][] closest = heap.toArray(new int[0][]);`, 'O(n log k)', 'Compare squared distances; no `Math.sqrt` needed. Use `long` if coordinates can be large.'),
      r('Keep combining the two smallest (connect sticks)', `
PriorityQueue<Integer> heap = new PriorityQueue<>();
for (int num : nums) heap.offer(num);
int cost = 0;
while (heap.size() > 1) {
    int first = heap.poll(), second = heap.poll();
    cost += first + second;
    heap.offer(first + second);           // the combined item goes back in
}
return cost;`, 'O(n log n)', 'Same loop with a max-heap and `first - second` solves **Last Stone Weight**.'),
    ]),
    recipes('Merge and schedule', [
      r('Merge k sorted linked lists', `
ListNode[] lists = {l1, l2};
PriorityQueue<ListNode> heap = new PriorityQueue<>((p, q) -> Integer.compare(p.val, q.val));
for (ListNode node : lists) {
    if (node != null) heap.offer(node);     // head of each list
}
ListNode dummy = new ListNode(0), tail = dummy;
while (!heap.isEmpty()) {
    ListNode smallest = heap.poll();
    tail.next = smallest;
    tail = smallest;
    if (smallest.next != null) heap.offer(smallest.next);   // its follower takes its place
}
return dummy.next;`, 'O(N log k)', 'The heap only ever holds one node per list, so it stays size k.'),
      r('Minimum meeting rooms (heap of end times)', `
Arrays.sort(intervals, (p, q) -> Integer.compare(p[0], q[0]));   // by start time
PriorityQueue<Integer> ends = new PriorityQueue<>();               // end time of each busy room
for (int[] meet : intervals) {
    if (!ends.isEmpty() && ends.peek() <= meet[0]) {
        ends.poll();                       // earliest room is free again: reuse it
    }
    ends.offer(meet[1]);
}
return ends.size();                        // rooms ever needed at once`, 'O(n log n)', 'Use `<=` if a meeting may start exactly when another ends; check the problem.'),
      r('Running median with two heaps', `
class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder()); // smaller half, max on top
    private final PriorityQueue<Integer> high = new PriorityQueue<>();                          // bigger half, min on top

    void addNum(int num) {
        low.offer(num);
        high.offer(low.poll());                              // biggest of low moves up
        if (high.size() > low.size()) low.offer(high.poll()); // keep low the same size or one bigger
    }

    double findMedian() {
        if (low.size() > high.size()) return low.peek();
        return (low.peek() + (long) high.peek()) / 2.0;      // long: no overflow on the sum
    }
}`, 'O(log n) add, O(1) median'),
      r('Skip stale items instead of removing them (lazy deletion)', `
Map<Integer, Integer> priceAt = new HashMap<>();              // timestamp -> latest price
PriorityQueue<int[]> maxHeap = new PriorityQueue<>((p, q) -> Integer.compare(q[0], p[0]));   // {price, timestamp}

// update(time, price): just add; the old entry for that time stays inside
int time = 3, price = 50;
priceAt.put(time, price);
maxHeap.offer(new int[]{price, time});

// maximum(): throw away tops that no longer match the real data
while (maxHeap.peek()[0] != priceAt.get(maxHeap.peek()[1])) {
    maxHeap.poll();
}
int maximum = maxHeap.peek()[0];`, 'O(log n) amortized', 'Keep the truth in a map; the heap may hold outdated copies that you discard when they reach the top.'),
      r('Process jobs in time order, cheapest available first', `
int[][] jobs = {{0, 3}, {1, 9}, {2, 6}};                         // {arrival, duration}
Arrays.sort(jobs, (p, q) -> Integer.compare(p[0], q[0]));
PriorityQueue<int[]> ready = new PriorityQueue<>((p, q) -> Integer.compare(p[1], q[1]));  // shortest job first
long clock = 0;
int nextJob = 0, done = 0;
while (done < jobs.length) {
    while (nextJob < jobs.length && jobs[nextJob][0] <= clock) ready.offer(jobs[nextJob++]);  // everything arrived
    if (ready.isEmpty()) {
        clock = jobs[nextJob][0];                                  // idle: jump to the next arrival
        continue;
    }
    int[] job = ready.poll();
    clock += job[1];
    done++;
}`, 'O(n log n)', 'Sorted array for "what has arrived", heap for "which ready one goes next". Single-Threaded CPU and IPO use this.'),
    ]),
    warn("Looping over a PriorityQueue (`for (int v : heap)`, `heap.toString()`, `new ArrayList<>(heap)`) gives **heap order, not sorted order**. Only repeated `poll()` comes out sorted.", 'Not sorted inside'),
    warn("`(p, q) -> p - q` overflows when values are huge or negative, and the heap then orders wrongly with no error. Use `Integer.compare(p, q)` (or `Long.compare`) in comparators."),
    tip("Which heap for top k? Keep the k you want and kick out the rest: you kick out the **smallest** to keep the largest, so use a **min**-heap. Saying it out loud fixes most mix-ups."),
    costs([
      ['Add', '`offer(x)`', 'O(log n)'],
      ['Take top', '`poll()`', 'O(log n)'],
      ['Look at top', '`peek()`', 'O(1)'],
      ['Size / empty', '`size()`, `isEmpty()`', 'O(1)'],
      ['Build from collection', '`new PriorityQueue<>(list)`', 'O(n)'],
      ['Remove a given item', '`remove(x)`', 'O(n)'],
      ['Contains', '`contains(x)`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: write **Kth Largest Element in an Array** with a size-k min-heap, then a max-heap of `int[]` by index 1 using `Integer.compare`. Then **K Closest Points to Origin** and **Find Median from Data Stream**."),
  ],
};
