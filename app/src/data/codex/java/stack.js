// Java Cheatsheet: Stack (ArrayDeque). Last in, first out: brackets, "next greater", undo,
// and turning recursion into a loop.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'stack',
  title: 'Stack (ArrayDeque)',
  summary: 'Last in, first out. Matching brackets, next greater element, parsing, and DFS without recursion.',
  tags: ['stack', 'arraydeque', 'deque', 'lifo', 'push', 'pop', 'peek', 'monotonic', 'parentheses', 'next greater', 'iterative dfs', 'inorder'],
  blocks: [
    t("A stack hands back the **most recent** thing you put in. Reach for it when the newest open item must be closed first (brackets, tags, nested `3[ab]`), when each element waits for \"the next bigger one to the right\", or when recursion would go too deep. In Java use `Deque<Integer> stack = new ArrayDeque<>()`, not the old `Stack` class: `Stack` is slower (synchronized) and loops bottom to top."),
    key("Three moves cover almost everything: `stack.push(x)`, `stack.pop()` and `stack.peek()`, always behind a `!stack.isEmpty()` check. For \"next greater / smaller\" problems, push **indices**, not values: the index gives you both the value and the distance."),
    recipes('Create and basic moves', [
      r('Make an empty stack', `
Deque<Integer> stack = new ArrayDeque<>();      // numbers or indices
Deque<Character> open = new ArrayDeque<>();     // characters
Deque<TreeNode> nodes = new ArrayDeque<>();     // tree nodes for iterative DFS`, 'O(1)', 'Declare as `Deque<T>`, build as `new ArrayDeque<>()`. It cannot hold `null`.'),
      r('Push, look at the top, pop', `
Deque<Integer> stack = new ArrayDeque<>();
stack.push(5);
stack.push(8);                  // top is now 8
int top = stack.peek();         // 8, stays on the stack
int removed = stack.pop();      // 8, now gone; top is 5 again
boolean empty = stack.isEmpty();
int size = stack.size();`, 'O(1)'),
      r('Pop or peek without crashing on an empty stack', `
Deque<Integer> stack = new ArrayDeque<>();
if (!stack.isEmpty()) {
    int last = stack.pop();
}
Integer maybeTop = stack.peek();     // null when empty
int safeTop = stack.isEmpty() ? -1 : stack.peek();`, 'O(1)', '`pop()` on an empty stack throws NoSuchElementException; `int v = stack.peek()` on empty throws NullPointerException.'),
      r('Keep pairs on the stack (index and value)', `
Deque<int[]> stack = new ArrayDeque<>();
stack.push(new int[]{3, 70});            // {index, temperature}
int[] topPair = stack.peek();
int topIndex = topPair[0], topTemp = topPair[1];
stack.pop();`, 'O(1)', 'Write the meaning of each slot in a comment right where you push it.'),
    ]),
    recipes('Loop through it', [
      r('Look at every item from top to bottom (no removing)', `
Deque<Integer> stack = new ArrayDeque<>(List.of(3, 2, 1));   // 3 is on top
for (int item : stack) {
    // 3, then 2, then 1
}`, 'O(n)', 'ArrayDeque iterates top first. The old `Stack` class iterates bottom first.'),
      r('Look at items from bottom to top', `
Deque<String> dirs = new ArrayDeque<>();
Iterator<String> it = dirs.descendingIterator();   // oldest (bottom) first
StringBuilder path = new StringBuilder();
while (it.hasNext()) path.append('/').append(it.next());`, 'O(n)', 'Handy when the stack holds a path or a built-up answer in push order.'),
      r('Empty the stack one item at a time', `
Deque<Integer> stack = new ArrayDeque<>(List.of(3, 2, 1));
while (!stack.isEmpty()) {
    int cur = stack.pop();
    // handle cur
}`, 'O(n)'),
      r('Turn the stack into a list or a string', `
Deque<Character> stack = new ArrayDeque<>();
List<Character> topFirst = new ArrayList<>(stack);
List<Character> bottomFirst = new ArrayList<>(stack);
Collections.reverse(bottomFirst);

StringBuilder sb = new StringBuilder();
for (char ch : bottomFirst) sb.append(ch);
String built = sb.toString();`, 'O(n)'),
    ]),
    recipes('Match and parse', [
      r('Check that brackets are balanced', `
Deque<Character> expect = new ArrayDeque<>();     // the closer we still need
for (char ch : s.toCharArray()) {
    if (ch == '(') expect.push(')');
    else if (ch == '[') expect.push(']');
    else if (ch == '{') expect.push('}');
    else if (expect.isEmpty() || expect.pop() != ch) return false;
}
return expect.isEmpty();                            // nothing left open`, 'O(n)', 'Pushing the expected closer saves a lookup table. Do not forget the final `isEmpty()` check for "(((".'),
      r('Evaluate Reverse Polish Notation', `
Deque<Integer> st = new ArrayDeque<>();
for (String tok : tokens) {
    switch (tok) {
        case "+" -> st.push(st.pop() + st.pop());
        case "*" -> st.push(st.pop() * st.pop());
        case "-" -> { int right = st.pop(), left = st.pop(); st.push(left - right); }
        case "/" -> { int right = st.pop(), left = st.pop(); st.push(left / right); }
        default -> st.push(Integer.parseInt(tok));
    }
}
return st.pop();`, 'O(n)', 'For `-` and `/` the first pop is the **right** operand.'),
      r('Decode a string like 3[a2[c]]', `
Deque<Integer> counts = new ArrayDeque<>();
Deque<StringBuilder> outer = new ArrayDeque<>();   // text built before each '['
StringBuilder cur = new StringBuilder();
int num = 0;
for (char ch : s.toCharArray()) {
    if (Character.isDigit(ch)) {
        num = num * 10 + (ch - '0');                 // numbers can have many digits
    } else if (ch == '[') {
        counts.push(num);
        outer.push(cur);
        cur = new StringBuilder();
        num = 0;
    } else if (ch == ']') {
        StringBuilder prev = outer.pop();
        prev.append(cur.toString().repeat(counts.pop()));
        cur = prev;
    } else {
        cur.append(ch);
    }
}
return cur.toString();`, 'O(output)'),
      r('Simplify a Unix path', `
String path = "/a/./b/../../c/";
Deque<String> dirs = new ArrayDeque<>();
for (String part : path.split("/")) {
    if (part.isEmpty() || part.equals(".")) continue;
    if (part.equals("..")) {
        if (!dirs.isEmpty()) dirs.pop();     // go up one, never above root
    } else {
        dirs.push(part);
    }
}
StringBuilder out = new StringBuilder();
Iterator<String> it = dirs.descendingIterator();   // root side first
while (it.hasNext()) out.append('/').append(it.next());
return out.length() == 0 ? "/" : out.toString();`, 'O(n)'),
      r('Use a StringBuilder as a char stack (backspace, remove duplicates)', `
StringBuilder typed = new StringBuilder();
for (char ch : s.toCharArray()) {
    if (ch == '#') {
        if (typed.length() > 0) typed.deleteCharAt(typed.length() - 1);   // pop
    } else {
        typed.append(ch);                                                    // push
    }
}
String finalText = typed.toString();`, 'O(n)', 'When you only push and pop chars and need a String at the end, this skips the reverse step.'),
    ]),
    recipes('Next greater / smaller (monotonic stack)', [
      r('Get the next greater element for every index', `
int[] nextGreater = new int[nums.length];
Arrays.fill(nextGreater, -1);                       // -1 = nothing bigger to the right
Deque<Integer> waiting = new ArrayDeque<>();         // indices still waiting for a bigger value
for (int idx = 0; idx < nums.length; idx++) {
    while (!waiting.isEmpty() && nums[waiting.peek()] < nums[idx]) {
        nextGreater[waiting.pop()] = nums[idx];      // idx is the answer for everyone smaller
    }
    waiting.push(idx);
}`, 'O(n)', 'Each index is pushed once and popped once, so the inner while is O(n) in total.'),
      r('Count days until a warmer temperature', `
int[] temperatures = {73, 74, 75, 71, 69, 72, 76};
int[] wait = new int[temperatures.length];           // 0 if never warmer
Deque<Integer> colder = new ArrayDeque<>();           // day indices
for (int day = 0; day < temperatures.length; day++) {
    while (!colder.isEmpty() && temperatures[colder.peek()] < temperatures[day]) {
        int prev = colder.pop();
        wait[prev] = day - prev;                      // distance, that is why we store indices
    }
    colder.push(day);
}
return wait;`, 'O(n)'),
      r('Get the previous smaller element for every index', `
int[] prevSmaller = new int[nums.length];
Deque<Integer> st = new ArrayDeque<>();
for (int idx = 0; idx < nums.length; idx++) {
    while (!st.isEmpty() && nums[st.peek()] >= nums[idx]) st.pop();
    prevSmaller[idx] = st.isEmpty() ? -1 : st.peek();    // index of it, or -1
    st.push(idx);
}`, 'O(n)', 'Flip the comparison for previous greater. "Previous" = read the top after popping; "next" = fill in while popping.'),
      r('Next greater element in a circular array', `
int len = nums.length;
int[] ans = new int[len];
Arrays.fill(ans, -1);
Deque<Integer> st = new ArrayDeque<>();
for (int step = 0; step < 2 * len; step++) {          // walk the array twice
    int idx = step % len;
    while (!st.isEmpty() && nums[st.peek()] < nums[idx]) ans[st.pop()] = nums[idx];
    if (step < len) st.push(idx);                      // push only in the first pass
}`, 'O(n)'),
      r('Largest rectangle in a histogram', `
int best = 0;
Deque<Integer> st = new ArrayDeque<>();               // indices, heights rising bottom to top
for (int idx = 0; idx <= heights.length; idx++) {
    int h = idx == heights.length ? 0 : heights[idx];  // a 0-height bar at the end flushes all
    while (!st.isEmpty() && heights[st.peek()] >= h) {
        int height = heights[st.pop()];
        int left = st.isEmpty() ? -1 : st.peek();       // first lower bar on the left
        best = Math.max(best, height * (idx - left - 1)); // idx is the first lower bar on the right
    }
    st.push(idx);
}
return best;`, 'O(n)', 'Popped bar = the shortest bar of its rectangle; width runs between the lower bars on each side.'),
    ]),
    recipes('Design a stack', [
      r('Min stack: get the minimum in O(1)', `
class MinStack {
    private final Deque<int[]> st = new ArrayDeque<>();   // {value, min so far}

    void push(int v) {
        int min = st.isEmpty() ? v : Math.min(v, st.peek()[1]);
        st.push(new int[]{v, min});
    }
    void pop() { st.pop(); }
    int top() { return st.peek()[0]; }
    int getMin() { return st.peek()[1]; }
}`, 'O(1) each', 'Each entry remembers the min at the time it was pushed, so popping restores the old min for free.'),
      r('Queue built from two stacks', `
class MyQueue {
    private final Deque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();

    void push(int v) { in.push(v); }
    int pop() { move(); return out.pop(); }
    int peek() { move(); return out.peek(); }
    boolean empty() { return in.isEmpty() && out.isEmpty(); }

    private void move() {
        if (out.isEmpty()) {                       // only refill when out is empty
            while (!in.isEmpty()) out.push(in.pop());
        }
    }
}`, 'O(1) amortized'),
    ]),
    recipes('Replace recursion with a stack', [
      r('DFS over a graph without recursion', `
boolean[] visited = new boolean[n];
Deque<Integer> todo = new ArrayDeque<>();
todo.push(0);
while (!todo.isEmpty()) {
    int node = todo.pop();
    if (visited[node]) continue;              // may be pushed twice; skip repeats
    visited[node] = true;
    for (int nb : adj.get(node)) {
        if (!visited[nb]) todo.push(nb);
    }
}`, 'O(V + E)', 'Use this when the graph can be 10^5 deep: recursion would hit StackOverflowError.'),
      r('Inorder traversal of a tree without recursion', `
List<Integer> order = new ArrayList<>();
Deque<TreeNode> st = new ArrayDeque<>();
TreeNode cur = root;
while (cur != null || !st.isEmpty()) {
    while (cur != null) {              // go all the way left
        st.push(cur);
        cur = cur.left;
    }
    cur = st.pop();                    // visit
    order.add(cur.val);
    cur = cur.right;                   // then the right subtree
}`, 'O(n)', 'Gives sorted order on a BST; stop early for "kth smallest".'),
      r('Preorder traversal of a tree without recursion', `
List<Integer> pre = new ArrayList<>();
Deque<TreeNode> st = new ArrayDeque<>();
if (root != null) st.push(root);
while (!st.isEmpty()) {
    TreeNode node = st.pop();
    pre.add(node.val);
    if (node.right != null) st.push(node.right);   // right first, so left pops first
    if (node.left != null) st.push(node.left);
}`, 'O(n)'),
      r('Carry extra state with each node (node + depth)', `
record Frame(TreeNode node, int depth) {}
int deepest = 0;
Deque<Frame> st = new ArrayDeque<>();
if (root != null) st.push(new Frame(root, 1));
while (!st.isEmpty()) {
    Frame f = st.pop();
    deepest = Math.max(deepest, f.depth());
    if (f.node().left != null) st.push(new Frame(f.node().left, f.depth() + 1));
    if (f.node().right != null) st.push(new Frame(f.node().right, f.depth() + 1));
}
return deepest;`, 'O(n)', 'Whatever the recursive call took as parameters goes into the frame.'),
    ]),
    warn("On an `ArrayDeque`, `push` / `pop` / `peek` work on the **front**, but `add` / `offer` put things at the **back**. Mixing `push` with `add` silently breaks the order. For a stack, only ever use `push`, `pop`, `peek`.", 'push vs add'),
    warn("`Stack<Integer>` from old tutorials still works, but it loops **bottom to top** and `new ArrayList<>(stack)` gives bottom first, while ArrayDeque gives top first. Pick ArrayDeque and stay with it."),
    tip("Stuck on a monotonic stack? Ask: \"what am I waiting for?\" The stack holds the indices still waiting; the current element is the answer for every one it pops."),
    costs([
      ['Push', '`push(x)`', 'O(1)'],
      ['Pop (removes)', '`pop()`', 'O(1)'],
      ['Look at top', '`peek()`', 'O(1)'],
      ['Is empty / size', '`isEmpty()`, `size()`', 'O(1)'],
      ['Contains', '`contains(x)`', 'O(n)'],
      ['Loop top to bottom', '`for (int v : stack)`', 'O(n)'],
      ['Loop bottom to top', '`descendingIterator()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: write **Valid Parentheses** with a `Deque<Character>`, then **Daily Temperatures** pushing indices. Then try **Min Stack** and **Largest Rectangle in Histogram**."),
  ],
};
