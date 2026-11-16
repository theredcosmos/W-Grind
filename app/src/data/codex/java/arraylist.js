// Java Cheatsheet: ArrayList. Same shape as hashmap.js: intro, recipe groups by job, traps,
// costs, drill.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'arraylist',
  title: 'ArrayList',
  summary: 'An array that grows. Collect answers, build paths, lists of lists, graphs. Converting to and from int[].',
  tags: ['arraylist', 'list', 'dynamic array', 'add', 'remove', 'sort', 'toarray', 'list of lists', 'backtracking', 'sublist', 'collections', 'graph'],
  blocks: [
    t("An `ArrayList` is an array that grows by itself. Reach for it when you do not know the answer size up front: collecting results, building a path in backtracking, or one neighbour list per node in a graph. Reading and writing by index is O(1) and adding at the end is O(1) on average; inserting or removing in the middle shifts everything after it, so that is O(n). It only holds objects, so numbers are `Integer`, not `int`."),
    key("Three lines cover most problems: `list.add(x)` to collect, `list.get(i)` to read, and `result.add(new ArrayList<>(path))` to save a copy of the current path. When the problem wants `int[]` back, finish with `list.stream().mapToInt(Integer::intValue).toArray()`."),
    recipes('Create', [
      r('Make an empty list', `
List<Integer> picks = new ArrayList<>();
List<String> lines = new ArrayList<>();
List<int[]> pairs = new ArrayList<>();          // each item is an int[]`, 'O(1)', 'Declare as `List<T>`, build as `new ArrayList<>()`. `List<int>` does not compile: use `Integer`.'),
      r('Make a list with starting values', `
List<Integer> primes = new ArrayList<>(List.of(2, 3, 5, 7));
List<String> colors = new ArrayList<>(Arrays.asList("red", "blue"));`, 'O(n)', '`List.of(...)` alone is read-only and `Arrays.asList(...)` cannot grow; wrap either in `new ArrayList<>(...)` if you will add or remove.'),
      r('Make a list from an int[]', `
List<Integer> fromNums = new ArrayList<>();
for (int num : nums) fromNums.add(num);

// One line with streams:
List<Integer> boxed = Arrays.stream(nums).boxed().collect(Collectors.toList());`, 'O(n)', '`Arrays.asList(nums)` on an `int[]` gives a `List<int[]>` with ONE item, not a list of numbers.'),
      r('Make a list with a known capacity', `
List<Integer> big = new ArrayList<>(n);    // room for n, but size() is still 0
List<Integer> zeros = new ArrayList<>(Collections.nCopies(n, 0));   // n zeros, size() == n`, 'O(n)', 'Capacity is not size: `big.get(0)` still throws. Use `nCopies` when you need n real slots.'),
    ]),
    recipes('Add, read and change', [
      r('Add to the end or at a position', `
list.add(4);              // at the end
list.add(0, 9);           // at index 0, everything else shifts right (O(n))
list.addAll(List.of(7, 8));`, 'O(1) end, O(n) middle'),
      r('Read and overwrite by index', `
int first = list.get(0);
int last = list.get(list.size() - 1);
list.set(0, 42);           // replace the value at index 0
int len = list.size();     // size(), not length`, 'O(1)'),
      r('Remove by index vs remove by value', `
List<Integer> vals = new ArrayList<>(List.of(10, 20, 30));
vals.remove(0);                      // removes INDEX 0 -> [20, 30]
vals.remove(Integer.valueOf(30));    // removes the VALUE 30 -> [20]

// Remove the last item (backtracking undo):
if (!vals.isEmpty()) vals.remove(vals.size() - 1);`, 'O(n), O(1) at the end', 'On a `List<Integer>`, `remove(int)` means index. Box the value to remove by value.'),
      r('Check if a value is there, and where', `
boolean has = list.contains(3);      // O(n): scans the list
int at = list.indexOf(3);            // first index, or -1
int lastAt = list.lastIndexOf(3);`, 'O(n)', 'Doing `contains` inside a loop is O(n^2). Keep a `HashSet` beside the list if you check often.'),
      r('Empty check and clear', `
if (list.isEmpty()) {
    // nothing collected
}
list.clear();               // size becomes 0`, 'O(1) check, O(n) clear'),
    ]),
    recipes('Loop through it', [
      r('Loop over every item', `
for (int num : list) {
    // num
}
for (int idx = 0; idx < list.size(); idx++) {
    int num = list.get(idx);         // when you also need the index
}`, 'O(n)'),
      r('Loop backwards', `
for (int idx = list.size() - 1; idx >= 0; idx--) {
    int num = list.get(idx);
}`, 'O(n)'),
      r('Remove items while looping (without crashing)', `
list.removeIf(num -> num % 2 == 0);       // drop all even numbers

// Or with an explicit iterator
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() < 0) it.remove();
}`, 'O(n)', 'Calling `list.remove(...)` inside a for-each throws ConcurrentModificationException.'),
    ]),
    recipes('Sort and rearrange', [
      r('Sort small to large, or large to small', `
Collections.sort(list);                         // ascending
list.sort(Collections.reverseOrder());          // descending
Collections.reverse(list);                      // just flip the current order`, 'O(n log n)'),
      r('Sort with your own rule', `
names.sort((p, q) -> p.length() - q.length());              // shortest first
names.sort(Comparator.comparing(String::length)
        .thenComparing(Comparator.naturalOrder()));         // tie: alphabetical

List<int[]> spans = new ArrayList<>();
spans.sort((p, q) -> Integer.compare(p[0], q[0]));          // by first number`, 'O(n log n)'),
      r('Biggest, smallest, count, swap', `
int biggest = Collections.max(list);
int smallest = Collections.min(list);
int howMany = Collections.frequency(list, 3);   // times 3 appears
Collections.swap(list, 0, list.size() - 1);`, 'O(n), swap O(1)', '`max` and `min` throw on an empty list; check `isEmpty()` first.'),
      r('Take a slice of the list', `
List<Integer> middle = new ArrayList<>(list.subList(1, 3));   // indexes 1, 2
list.subList(0, 2).clear();     // removes indexes 0 and 1 from the original`, 'O(len)', '`subList` is a view: changes go through to the original. Wrap it in `new ArrayList<>(...)` to keep a copy.'),
    ]),
    recipes('Convert to and from arrays and strings', [
      r('List<Integer> to int[]', `
int[] out = list.stream().mapToInt(Integer::intValue).toArray();

// Plain loop, same result:
int[] out2 = new int[list.size()];
for (int idx = 0; idx < list.size(); idx++) out2[idx] = list.get(idx);`, 'O(n)', '`list.toArray(new int[0])` does not compile; `toArray` only makes object arrays.'),
      r('List<int[]> to int[][]', `
List<int[]> merged = new ArrayList<>();
merged.add(new int[]{1, 4});
int[][] answer = merged.toArray(new int[0][]);`, 'O(n)', 'The usual last line of Merge Intervals and similar problems.'),
      r('List<String> to String[]', `
String[] arrOut = names.toArray(new String[0]);`, 'O(n)'),
      r('Join a list into one string', `
String csv = String.join(",", names);          // works for List<String>
String nums2 = list.stream()
        .map(String::valueOf)
        .collect(Collectors.joining(" "));      // List<Integer> -> "1 2 3"`, 'O(n)'),
    ]),
    recipes('Lists of lists (results, graphs, grids)', [
      r('Save a copy of the path in backtracking', `
void backtrack(int[] nums, int from, List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path));     // COPY, not path itself
    for (int idx = from; idx < nums.length; idx++) {
        path.add(nums[idx]);               // choose
        backtrack(nums, idx + 1, path, result);
        path.remove(path.size() - 1);      // undo
    }
}`, 'O(len) per copy', '`result.add(path)` saves the same list every time; at the end every entry is empty.'),
      r('Make n empty lists for a graph', `
List<List<Integer>> g = new ArrayList<>();
for (int node = 0; node < n; node++) {
    g.add(new ArrayList<>());               // one neighbour list per node
}
for (int[] e : edges) {
    g.get(e[0]).add(e[1]);
    g.get(e[1]).add(e[0]);                  // undirected: both ways
}`, 'O(n + E)', '`Collections.nCopies(n, new ArrayList<>())` shares ONE list n times. Use the loop.'),
      r('Read and write a cell in a list of lists', `
List<List<Integer>> rows = new ArrayList<>();
rows.add(new ArrayList<>(List.of(1)));
int cell = rows.get(0).get(0);          // row 0, column 0
rows.get(0).set(0, 5);                  // overwrite it
rows.get(0).add(7);                     // grow row 0`, 'O(1)'),
      r("Build Pascal's triangle row by row", `
List<List<Integer>> tri = new ArrayList<>();
for (int row = 0; row < n; row++) {
    List<Integer> line = new ArrayList<>();
    for (int col = 0; col <= row; col++) {
        if (col == 0 || col == row) line.add(1);
        else line.add(tri.get(row - 1).get(col - 1) + tri.get(row - 1).get(col));
    }
    tri.add(line);
}
return tri;`, 'O(n^2)'),
      r('Compare two lists', `
List<Integer> one = List.of(1, 2), two = new ArrayList<>(List.of(1, 2));
boolean same = one.equals(two);         // same size, equal items in the same order
// one == two is false: different objects`, 'O(n)'),
    ]),
    warn("`list.remove(3)` on a `List<Integer>` removes the item at **index 3**, not the value 3. Write `list.remove(Integer.valueOf(3))` to remove by value.", 'The remove trap'),
    warn("Comparing two items with `list.get(a) == list.get(b)` compares `Integer` objects and breaks above 127. Use `.equals()` or store them in `int` variables first."),
    tip("In backtracking, every `add` before the recursive call needs a matching `remove(path.size() - 1)` after it. Write both lines first, then fill in the call between them."),
    costs([
      ['Add at end', '`add(x)`', 'O(1) average'],
      ['Add / remove in the middle', '`add(i, x)`, `remove(i)`', 'O(n)'],
      ['Read / write', '`get(i)`, `set(i, x)`', 'O(1)'],
      ['Search', '`contains(x)`, `indexOf(x)`', 'O(n)'],
      ['Sort', '`Collections.sort(list)`, `list.sort(cmp)`', 'O(n log n)'],
      ['Size', '`size()`, `isEmpty()`', 'O(1)'],
      ['To int[]', '`stream().mapToInt(Integer::intValue).toArray()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: add 5 numbers, remove the value 3 (not index 3), sort descending, convert to `int[]`. Then do **Subsets** (copy the path!) and **Pascal's Triangle**."),
  ],
};
