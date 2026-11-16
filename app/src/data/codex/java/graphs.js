// Java Cheatsheet: Graphs and Union-Find. Build the adjacency list, walk it (DFS/BFS), find
// cycles and an order (topological sort), shortest paths (Dijkstra), and group nodes (DSU).
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'graphs',
  title: 'Graphs and Union-Find',
  summary: 'Adjacency lists from edges, DFS, components, cycles, topological sort, Dijkstra, Union-Find, grids as graphs.',
  tags: ['graph', 'adjacency list', 'edges', 'dfs', 'bfs', 'visited', 'connected components', 'cycle', 'topological sort', 'kahn', 'indegree', 'course schedule', 'dijkstra', 'shortest path', 'union find', 'dsu', 'disjoint set', 'islands', 'grid'],
  blocks: [
    t("A graph is nodes plus edges. LeetCode usually hands you `n` and an `edges` array, or a grid where each cell is a node next to its 4 neighbours. Step one is always the same: turn the edges into an **adjacency list** so you can ask \"who are my neighbours?\" in O(1). Then pick the walk: DFS to explore or count, BFS for fewest steps, Dijkstra for cheapest weighted path, Union-Find when edges arrive one by one and you only care which nodes are connected."),
    key("Two things cover most problems: building `List<List<Integer>> g` from `edges` (both directions when undirected), and a `boolean[] visited` that you set **before** you go into a node so nothing is processed twice."),
    recipes('Build the graph', [
      r('Adjacency list from undirected edges', `
List<List<Integer>> g = new ArrayList<>();
for (int node = 0; node < n; node++) g.add(new ArrayList<>());
for (int[] e : edges) {
    g.get(e[0]).add(e[1]);
    g.get(e[1]).add(e[0]);          // undirected: add both ways
}`, 'O(V + E)', 'Create all n empty lists first, so nodes with no edges still exist.'),
      r('Adjacency list from directed edges, with indegree', `
List<List<Integer>> g = new ArrayList<>();
for (int node = 0; node < n; node++) g.add(new ArrayList<>());
int[] indegree = new int[n];
for (int[] e : edges) {
    g.get(e[0]).add(e[1]);          // e[0] -> e[1] only
    indegree[e[1]]++;               // how many arrows point INTO e[1]
}`, 'O(V + E)', 'Course schedule gives `[course, prereq]`: the arrow is prereq -> course, so it is `g.get(e[1]).add(e[0])`.'),
      r('Weighted edges as int arrays', `
int[][] times = {{0, 1, 4}, {1, 2, 1}};       // {from, to, weight}
List<List<int[]>> g = new ArrayList<>();
for (int node = 0; node < n; node++) g.add(new ArrayList<>());
for (int[] e : times) {
    g.get(e[0]).add(new int[]{e[1], e[2]});  // {neighbour, weight}
}
for (int[] nb : g.get(0)) {
    int to = nb[0], w = nb[1];
}`, 'O(V + E)'),
      r('Adjacency map when nodes are not 0..n-1', `
List<List<String>> pairs = List.of(List.of("JFK", "SFO"), List.of("SFO", "ATL"));
Map<String, List<String>> g = new HashMap<>();
for (List<String> pair : pairs) {
    g.computeIfAbsent(pair.get(0), kk -> new ArrayList<>()).add(pair.get(1));
}
for (String nb : g.getOrDefault("JFK", List.of())) {
    // neighbours of JFK (empty list if it has none)
}`, 'O(V + E)', 'Use a map for string labels or huge sparse ids; use lists of lists when ids are 0..n-1.'),
    ]),
    recipes('Walk the graph', [
      r('DFS with recursion', `
boolean[] visited;
List<List<Integer>> g;

void dfs(int node) {
    visited[node] = true;
    for (int nb : g.get(node)) {
        if (!visited[nb]) dfs(nb);
    }
}`, 'O(V + E)', 'Keep `visited` and `g` as fields so the helper takes only the node.'),
      r('DFS with your own stack', `
boolean[] visited = new boolean[n];
Deque<Integer> st = new ArrayDeque<>();
st.push(0);
visited[0] = true;
while (!st.isEmpty()) {
    int node = st.pop();
    for (int nb : adj.get(node)) {
        if (!visited[nb]) {
            visited[nb] = true;
            st.push(nb);
        }
    }
}`, 'O(V + E)', 'Use this when the graph can be very deep (10^4+ nodes in a line) and recursion would overflow.'),
      r('Count connected components', `
int countComponents(int n, int[][] edges) {
    List<List<Integer>> g = new ArrayList<>();
    for (int node = 0; node < n; node++) g.add(new ArrayList<>());
    for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }

    boolean[] visited = new boolean[n];
    int components = 0;
    for (int node = 0; node < n; node++) {
        if (visited[node]) continue;
        components++;                       // a new, untouched group
        Deque<Integer> st = new ArrayDeque<>(List.of(node));
        visited[node] = true;
        while (!st.isEmpty()) {
            int cur = st.pop();
            for (int nb : g.get(cur)) {
                if (!visited[nb]) { visited[nb] = true; st.push(nb); }
            }
        }
    }
    return components;
}`, 'O(V + E)', 'The outer loop over every node is what catches the separate groups.'),
      r('Count islands in a grid (DFS that sinks land)', `
int numIslands(char[][] board) {
    int islands = 0;
    for (int row = 0; row < board.length; row++) {
        for (int col = 0; col < board[0].length; col++) {
            if (board[row][col] == '1') {
                islands++;
                sink(board, row, col);
            }
        }
    }
    return islands;
}

void sink(char[][] board, int row, int col) {
    if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) return;
    if (board[row][col] != '1') return;       // water or already visited
    board[row][col] = '0';                    // mark visited by sinking it
    sink(board, row + 1, col);
    sink(board, row - 1, col);
    sink(board, row, col + 1);
    sink(board, row, col - 1);
}`, 'O(rows * cols)', 'Changing the grid is the visited set. If you must not modify it, use a `boolean[][]`.'),
    ]),
    recipes('Cycles and order', [
      r('Detect a cycle in an undirected graph', `
boolean hasCycle(List<List<Integer>> g, int node, int parent, boolean[] visited) {
    visited[node] = true;
    for (int nb : g.get(node)) {
        if (nb == parent) continue;            // the edge we came in on is not a cycle
        if (visited[nb]) return true;          // reached a seen node another way
        if (hasCycle(g, nb, node, visited)) return true;
    }
    return false;
}
// call for every unvisited node: hasCycle(g, node, -1, visited)`, 'O(V + E)', 'Union-Find is often simpler here: an edge whose two ends already share a root closes a cycle.'),
      r('Detect a cycle in a directed graph (three colours)', `
int[] state;                    // 0 = not seen, 1 = on the current path, 2 = finished

boolean hasCycle(List<List<Integer>> g, int node) {
    state[node] = 1;
    for (int nb : g.get(node)) {
        if (state[nb] == 1) return true;                    // back to our own path: cycle
        if (state[nb] == 0 && hasCycle(g, nb)) return true;
    }
    state[node] = 2;                                        // fully explored, safe
    return false;
}`, 'O(V + E)', 'A plain visited flag is not enough in directed graphs: reaching a **finished** node is fine, only the current path counts.'),
      r('Topological order with indegree (Kahn)', `
List<List<Integer>> g = new ArrayList<>();
for (int node = 0; node < n; node++) g.add(new ArrayList<>());
int[] indegree = new int[n];
for (int[] e : edges) { g.get(e[0]).add(e[1]); indegree[e[1]]++; }

Queue<Integer> q = new ArrayDeque<>();
for (int node = 0; node < n; node++) {
    if (indegree[node] == 0) q.offer(node);      // nothing has to come before these
}
List<Integer> order = new ArrayList<>();
while (!q.isEmpty()) {
    int node = q.poll();
    order.add(node);
    for (int nb : g.get(node)) {
        if (--indegree[nb] == 0) q.offer(nb);    // its last requirement is done
    }
}
return order.size() == n ? order : List.of();    // shorter = there was a cycle`, 'O(V + E)'),
      r('Can all courses be finished? (course schedule)', `
boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> g = new ArrayList<>();
    for (int c = 0; c < numCourses; c++) g.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] pr : prerequisites) {
        g.get(pr[1]).add(pr[0]);        // take pr[1] first, then pr[0]
        indegree[pr[0]]++;
    }
    Queue<Integer> q = new ArrayDeque<>();
    for (int c = 0; c < numCourses; c++) if (indegree[c] == 0) q.offer(c);
    int taken = 0;
    while (!q.isEmpty()) {
        int course = q.poll();
        taken++;
        for (int next : g.get(course)) {
            if (--indegree[next] == 0) q.offer(next);
        }
    }
    return taken == numCourses;          // anything left is stuck in a cycle
}`, 'O(V + E)', 'Course Schedule II: return the order list instead of the count.'),
    ]),
    recipes('Shortest paths', [
      r('Cheapest path from one source (Dijkstra)', `
List<List<int[]>> g = new ArrayList<>();                 // g.get(u) holds {v, weight}
for (int node = 0; node < n; node++) g.add(new ArrayList<>());
int source = 0;

int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[source] = 0;
PriorityQueue<int[]> pq = new PriorityQueue<>((p, q) -> Integer.compare(p[1], q[1]));   // {node, dist}
pq.offer(new int[]{source, 0});
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    int node = cur[0], d = cur[1];
    if (d > dist[node]) continue;                        // stale entry, a shorter one won
    for (int[] edge : g.get(node)) {
        int nb = edge[0], nd = d + edge[1];
        if (nd < dist[nb]) {
            dist[nb] = nd;
            pq.offer(new int[]{nb, nd});
        }
    }
}
// dist[x] == Integer.MAX_VALUE means x is unreachable`, 'O(E log V)', 'Only for weights >= 0. All weights equal? Plain BFS is enough.'),
      r('Cheapest path across a grid (Dijkstra on cells)', `
int rows = grid.length, cols = grid[0].length;
int[][] best = new int[rows][cols];
for (int[] row : best) Arrays.fill(row, Integer.MAX_VALUE);
best[0][0] = grid[0][0];
PriorityQueue<int[]> pq = new PriorityQueue<>((p, q) -> Integer.compare(p[2], q[2]));   // {row, col, cost}
pq.offer(new int[]{0, 0, grid[0][0]});
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    if (cur[2] > best[cur[0]][cur[1]]) continue;
    if (cur[0] == rows - 1 && cur[1] == cols - 1) return cur[2];   // first pop of target = cheapest
    for (int[] d : dirs) {
        int nr = cur[0] + d[0], nc = cur[1] + d[1];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        int cost = cur[2] + grid[nr][nc];
        if (cost < best[nr][nc]) {
            best[nr][nc] = cost;
            pq.offer(new int[]{nr, nc, cost});
        }
    }
}
return -1;`, 'O(rows * cols * log)', 'For "minimum effort" swap `cur[2] + grid[nr][nc]` for `Math.max(cur[2], Math.abs(height difference))`.'),
    ]),
    recipes('Union-Find (disjoint sets)', [
      r('Union-Find class with path compression and rank', `
class UnionFind {
    private final int[] parent, rank;
    int count;                                   // number of separate groups

    UnionFind(int size) {
        parent = new int[size];
        rank = new int[size];
        count = size;
        for (int node = 0; node < size; node++) parent[node] = node;   // everyone is their own root
    }

    int find(int node) {
        if (parent[node] != node) parent[node] = find(parent[node]);   // path compression
        return parent[node];
    }

    boolean union(int p, int q) {
        int rootP = find(p), rootQ = find(q);
        if (rootP == rootQ) return false;        // already together: this edge makes a cycle
        if (rank[rootP] < rank[rootQ]) { int tmp = rootP; rootP = rootQ; rootQ = tmp; }
        parent[rootQ] = rootP;                   // hang the shorter tree under the taller
        if (rank[rootP] == rank[rootQ]) rank[rootP]++;
        count--;
        return true;
    }

    boolean connected(int p, int q) { return find(p) == find(q); }
}
// use: UnionFind uf = new UnionFind(n); for (int[] e : edges) uf.union(e[0], e[1]); return uf.count;`, 'almost O(1) each', 'Use it when edges arrive over time, or the question is "are these connected?" / "how many groups?".'),
      r('Find the edge that creates a cycle (array-only Union-Find)', `
int[] parent;

int find(int node) {
    while (parent[node] != node) {
        parent[node] = parent[parent[node]];     // halve the path as you go
        node = parent[node];
    }
    return node;
}

int[] redundantConnection(int[][] edges) {
    parent = new int[edges.length + 1];          // nodes are 1..n here
    for (int node = 0; node < parent.length; node++) parent[node] = node;
    for (int[] e : edges) {
        int rootA = find(e[0]), rootB = find(e[1]);
        if (rootA == rootB) return e;            // already connected: this edge is extra
        parent[rootA] = rootB;
    }
    return new int[0];
}`, 'almost O(1) each', 'The short version for interviews when you need only `find` and a quick union.'),
      r('Group grid cells with Union-Find (row, col to one id)', `
int countIslandsDsu(char[][] board) {
    int rows = board.length, cols = board[0].length;
    int[] parent = new int[rows * cols];
    int groups = 0;
    for (int id = 0; id < parent.length; id++) parent[id] = id;
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < cols; col++) {
            if (board[row][col] != '1') continue;
            groups++;                                     // every land cell starts alone
            int id = row * cols + col;                    // 2D -> 1D id
            if (row > 0 && board[row - 1][col] == '1') groups -= join(parent, id, id - cols);
            if (col > 0 && board[row][col - 1] == '1') groups -= join(parent, id, id - 1);
        }
    }
    return groups;
}

int join(int[] parent, int p, int q) {                // 1 if two groups merged, else 0
    int rootP = root(parent, p), rootQ = root(parent, q);
    if (rootP == rootQ) return 0;
    parent[rootP] = rootQ;
    return 1;
}

int root(int[] parent, int node) {
    while (parent[node] != node) node = parent[node] = parent[parent[node]];
    return node;
}`, 'O(rows * cols)', 'Only look up and left: right and down neighbours will look back at you later.'),
    ]),
    warn("Recursive DFS on a graph or grid with 10^5 nodes in a line can throw StackOverflowError. Switch to an explicit `Deque` stack or BFS when the input can be that deep.", 'Deep recursion'),
    warn("In Dijkstra, a node can sit in the heap several times with old distances. Always skip with `if (d > dist[node]) continue;` or you redo work and may get wrong answers in variants."),
    tip("Read the edge format twice: `[a, b]` meaning a -> b, b -> a, or both? `[course, prereq]` is the classic trap. Write the arrow in a comment before building the list."),
    costs([
      ['Build adjacency list', 'loop over `edges`', 'O(V + E)'],
      ['DFS / BFS', 'visited + stack / queue', 'O(V + E)'],
      ['Topological sort', 'indegree + queue', 'O(V + E)'],
      ['Dijkstra', '`PriorityQueue<int[]>` + `dist`', 'O(E log V)'],
      ['Union-Find find / union', '`find(x)`, `union(a, b)`', 'about O(1)'],
      ['Grid neighbours', '`dirs` array', 'O(1) per cell'],
    ]),
    drill("No notes, 10 minutes: build an adjacency list from `edges`, count components with DFS, then **Number of Islands**. Then **Course Schedule** with indegree and **Network Delay Time** with Dijkstra. Finally write the Union-Find class from memory."),
  ],
};
