// Java Cheatsheet: Queue, Deque and BFS. First in, first out: breadth-first search, levels,
// shortest steps, and the both-ends Deque for sliding windows.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'queue',
  title: 'Queue, Deque and BFS',
  summary: 'First in, first out. BFS, level by level, shortest steps on a grid, multi-source, sliding window max.',
  tags: ['queue', 'deque', 'arraydeque', 'bfs', 'breadth first', 'level order', 'grid', 'shortest path', 'multi-source', 'rotting oranges', 'sliding window maximum', 'monotonic deque', '0-1 bfs', 'offer', 'poll'],
  blocks: [
    t("A queue hands things back in the order they came in. Its main job in LeetCode is **BFS**: explore everything 1 step away, then 2 steps, then 3, so the first time you reach a target is the shortest path (when every step costs the same). A `Deque` is a queue you can use from both ends, which gives you the sliding window maximum and 0-1 BFS."),
    key("Two things cover most problems: the BFS loop `while (!q.isEmpty()) { int size = q.size(); for (...size...) { q.poll(); ... } steps++; }`, and marking a cell **visited when you add it** to the queue, not when you take it out."),
    recipes('Create and basic moves', [
      r('Make an empty queue', `
Queue<Integer> q = new ArrayDeque<>();          // node ids
Queue<int[]> cells = new ArrayDeque<>();        // {row, col}
Queue<TreeNode> level = new LinkedList<>();     // LinkedList if you must store null`, 'O(1)', 'Use `ArrayDeque` by default. It is faster than `LinkedList` but cannot hold `null`.'),
      r('Add to the back, look at the front, take from the front', `
Queue<Integer> q = new ArrayDeque<>();
q.offer(4);
q.offer(7);                    // queue: 4, 7
int front = q.peek();          // 4, stays in the queue
int taken = q.poll();          // 4, removed; front is now 7
int size = q.size();
boolean empty = q.isEmpty();`, 'O(1)'),
      r('Take from the queue without crashing when empty', `
Queue<Integer> q = new ArrayDeque<>();
Integer next = q.poll();        // null when empty
if (next != null) {
    // use next
}
// add / remove / element do the same jobs but THROW when they fail`, 'O(1)', 'Stick to `offer` / `poll` / `peek` and check `isEmpty()` before unboxing to `int`.'),
      r('Keep a whole state in the queue (int array)', `
Queue<int[]> q = new ArrayDeque<>();
q.offer(new int[]{0, 0, 0});            // {row, col, steps}
int[] cur = q.poll();
int row = cur[0], col = cur[1], steps = cur[2];
q.offer(new int[]{row + 1, col, steps + 1});`, 'O(1)', 'Put the step count in the state when levels are awkward to track, or use the `size` loop instead.'),
    ]),
    recipes('BFS templates', [
      r('BFS over a graph from one start node', `
boolean[] visited = new boolean[n];
Queue<Integer> q = new ArrayDeque<>();
q.offer(0);
visited[0] = true;                        // mark when you ADD
while (!q.isEmpty()) {
    int node = q.poll();
    for (int nb : adj.get(node)) {
        if (!visited[nb]) {
            visited[nb] = true;
            q.offer(nb);
        }
    }
}`, 'O(V + E)', 'Marking on poll lets the same node be added many times and can blow up to O(V^2).'),
      r('BFS level by level (tree level order)', `
List<List<Integer>> levels = new ArrayList<>();
Queue<TreeNode> q = new ArrayDeque<>();
if (root != null) q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();                  // freeze the count: this is one level
    List<Integer> row = new ArrayList<>();
    for (int idx = 0; idx < size; idx++) {
        TreeNode node = q.poll();
        row.add(node.val);
        if (node.left != null) q.offer(node.left);
        if (node.right != null) q.offer(node.right);
    }
    levels.add(row);
}
return levels;`, 'O(n)', 'Writing `idx < q.size()` in the for loop is the classic bug: the size grows while you add children.'),
      r('Count the fewest steps from start to target', `
int[] dist = new int[n];
Arrays.fill(dist, -1);                    // -1 = not reached yet (doubles as visited)
Queue<Integer> q = new ArrayDeque<>();
dist[0] = 0;
q.offer(0);
while (!q.isEmpty()) {
    int node = q.poll();
    if (node == target) return dist[node];   // first arrival is the shortest
    for (int nb : adj.get(node)) {
        if (dist[nb] == -1) {
            dist[nb] = dist[node] + 1;
            q.offer(nb);
        }
    }
}
return -1;                                // unreachable`, 'O(V + E)', 'Only works when every edge costs the same. Weighted edges need Dijkstra.'),
      r('BFS on a grid (4 directions, visited, distance)', `
int rows = grid.length, cols = grid[0].length;
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
boolean[][] seen = new boolean[rows][cols];
Queue<int[]> q = new ArrayDeque<>();
q.offer(new int[]{0, 0});
seen[0][0] = true;
int steps = 0;
while (!q.isEmpty()) {
    int size = q.size();
    for (int idx = 0; idx < size; idx++) {
        int[] cur = q.poll();
        if (cur[0] == rows - 1 && cur[1] == cols - 1) return steps;
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;   // off the grid
            if (seen[nr][nc] || grid[nr][nc] == 1) continue;              // visited or wall
            seen[nr][nc] = true;
            q.offer(new int[]{nr, nc});
        }
    }
    steps++;
}
return -1;`, 'O(rows * cols)', 'For 8 directions add the four diagonals to `dirs`; nothing else changes.'),
      r('Spread from many starts at once (rotting oranges)', `
int rows = grid.length, cols = grid[0].length;
Queue<int[]> q = new ArrayDeque<>();
int fresh = 0;
for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
        if (grid[row][col] == 2) q.offer(new int[]{row, col});   // every source goes in first
        else if (grid[row][col] == 1) fresh++;
    }
}
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
int minutes = 0;
while (!q.isEmpty() && fresh > 0) {
    int size = q.size();
    for (int idx = 0; idx < size; idx++) {
        int[] cur = q.poll();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] != 1) continue;
            grid[nr][nc] = 2;                // rot it = mark visited
            fresh--;
            q.offer(new int[]{nr, nc});
        }
    }
    minutes++;
}
return fresh == 0 ? minutes : -1;`, 'O(rows * cols)', 'Same trick for "distance to nearest 0" and "walls and gates": start from all targets together.'),
      r('Shortest transformation sequence (BFS over strings)', `
String begin = "hit", goal = "cog";
Set<String> dict = new HashSet<>(List.of("hot", "dot", "dog", "lot", "log", "cog"));
Queue<String> q = new ArrayDeque<>();
q.offer(begin);
dict.remove(begin);
int length = 1;                                  // counts words, not moves
while (!q.isEmpty()) {
    int size = q.size();
    for (int idx = 0; idx < size; idx++) {
        char[] w = q.poll().toCharArray();
        if (new String(w).equals(goal)) return length;
        for (int pos = 0; pos < w.length; pos++) {
            char orig = w[pos];
            for (char ch = 'a'; ch <= 'z'; ch++) {
                w[pos] = ch;
                String nextWord = new String(w);
                if (dict.remove(nextWord)) q.offer(nextWord);   // remove = mark visited
            }
            w[pos] = orig;
        }
    }
    length++;
}
return 0;`, 'O(N * L * 26)', 'Any "fewest moves between states" puzzle is BFS where the nodes are states you generate on the fly.'),
      r('BFS where the state has extra info (obstacles you may still remove)', `
int rows = grid.length, cols = grid[0].length;
boolean[][][] seen = new boolean[rows][cols][k + 1];     // same cell, different budget = different state
Queue<int[]> q = new ArrayDeque<>();
q.offer(new int[]{0, 0, k});                              // {row, col, removals left}
seen[0][0][k] = true;
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
int steps = 0;
while (!q.isEmpty()) {
    int size = q.size();
    for (int idx = 0; idx < size; idx++) {
        int[] cur = q.poll();
        if (cur[0] == rows - 1 && cur[1] == cols - 1) return steps;
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
            int left = cur[2] - grid[nr][nc];                 // a wall (1) costs one removal
            if (left < 0 || seen[nr][nc][left]) continue;
            seen[nr][nc][left] = true;
            q.offer(new int[]{nr, nc, left});
        }
    }
    steps++;
}
return -1;`, 'O(rows * cols * k)', 'Visited must include every part of the state, or you skip paths that had more budget left.'),
    ]),
    recipes('Deque: both ends', [
      r('Add and remove at both ends', `
Deque<Integer> dq = new ArrayDeque<>();
dq.offerLast(2);               // back:  2
dq.offerFirst(1);              // front: 1, 2
dq.offerLast(3);               // 1, 2, 3
int first = dq.peekFirst();    // 1
int last = dq.peekLast();      // 3
dq.pollFirst();                // removes 1
dq.pollLast();                 // removes 3`, 'O(1)', 'The `First` / `Last` names say exactly which end you mean; use them instead of `push` / `offer` when both ends matter.'),
      r('Keep only the last k items seen', `
Deque<Integer> recent = new ArrayDeque<>();
for (int num : nums) {
    recent.offerLast(num);
    if (recent.size() > k) recent.pollFirst();   // drop the oldest
}`, 'O(1) per item', 'Also the shape for "requests in the last 3000 ms": pop from the front while it is too old.'),
      r('Maximum of every window of size k', `
int[] best = new int[nums.length - k + 1];
Deque<Integer> dq = new ArrayDeque<>();      // indices; their values decrease front to back
for (int idx = 0; idx < nums.length; idx++) {
    if (!dq.isEmpty() && dq.peekFirst() <= idx - k) dq.pollFirst();      // front slid out
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[idx]) dq.pollLast(); // smaller ones can never win
    dq.offerLast(idx);
    if (idx >= k - 1) best[idx - k + 1] = nums[dq.peekFirst()];          // front is the max
}
return best;`, 'O(n)', 'Store indices so you can tell when the front has left the window. Flip `<=` to `>=` for the window minimum.'),
      r('Check a string is a palindrome from both ends', `
Deque<Character> dq = new ArrayDeque<>();
for (char ch : s.toCharArray()) {
    if (Character.isLetterOrDigit(ch)) dq.offerLast(Character.toLowerCase(ch));
}
while (dq.size() > 1) {
    if (!dq.pollFirst().equals(dq.pollLast())) return false;
}
return true;`, 'O(n)', 'Two pointers on the string is lighter; the deque version shows the idea.'),
      r('Shortest path when moves cost 0 or 1 (0-1 BFS)', `
int rows = grid.length, cols = grid[0].length;
int[][] dist = new int[rows][cols];
for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
dist[0][0] = 0;
Deque<int[]> dq = new ArrayDeque<>();
dq.offerFirst(new int[]{0, 0});
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
while (!dq.isEmpty()) {
    int[] cur = dq.pollFirst();
    for (int[] d : dirs) {
        int nr = cur[0] + d[0], nc = cur[1] + d[1];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        int w = grid[nr][nc];                        // 0 = free move, 1 = costs one
        if (dist[cur[0]][cur[1]] + w < dist[nr][nc]) {
            dist[nr][nc] = dist[cur[0]][cur[1]] + w;
            if (w == 0) dq.offerFirst(new int[]{nr, nc});   // free: handle it next
            else dq.offerLast(new int[]{nr, nc});           // costly: handle it later
        }
    }
}
return dist[rows - 1][cols - 1];`, 'O(V + E)', 'Cheaper than Dijkstra when weights are only 0 and 1. "Minimum obstacles to remove" is this exact shape.'),
    ]),
    warn("Mark visited **when you add** a node to the queue, not when you poll it. Otherwise the same cell is queued by every neighbour and BFS gets slow or wrong.", 'Visited timing'),
    warn("`for (int idx = 0; idx < q.size(); idx++)` reads the size again on every pass while you keep adding children. Save `int size = q.size();` before the loop."),
    tip("BFS gives shortest paths only when every step costs the same. Costs of 0 or 1: use the deque (0-1 BFS). Any other weights: Dijkstra with a PriorityQueue."),
    costs([
      ['Add to back', '`offer(x)`, `offerLast(x)`', 'O(1)'],
      ['Add to front', '`offerFirst(x)`', 'O(1)'],
      ['Take from front', '`poll()`, `pollFirst()`', 'O(1)'],
      ['Take from back', '`pollLast()`', 'O(1)'],
      ['Look at either end', '`peek()`, `peekFirst()`, `peekLast()`', 'O(1)'],
      ['Size / empty', '`size()`, `isEmpty()`', 'O(1)'],
      ['Contains', '`contains(x)`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: write **Binary Tree Level Order Traversal** with the `size` loop, then **Rotting Oranges** (multi-source). Then **Sliding Window Maximum** with a deque of indices."),
  ],
};
