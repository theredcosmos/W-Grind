// Java Cheatsheet: Linked lists and trees. The pointer moves for ListNode (dummy head, reverse,
// slow/fast) and the recursive and level-order moves for TreeNode.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'nodes',
  title: 'Linked lists and trees (ListNode, TreeNode)',
  summary: 'ListNode: dummy head, reverse, slow/fast, merge. TreeNode: DFS, level order, BST bounds, LCA, path sums.',
  tags: ['linked list', 'listnode', 'treenode', 'tree', 'binary tree', 'bst', 'dummy', 'reverse', 'slow fast', 'cycle', 'merge', 'dfs', 'inorder', 'level order', 'lca', 'path sum', 'validate bst', 'parent map'],
  blocks: [
    t("LeetCode gives you `ListNode` (a `val` and a `next`) and `TreeNode` (a `val`, a `left` and a `right`). A list is walked with a pointer that you move with `cur = cur.next`; a tree is almost always solved by a small recursive function that asks both children and combines their answers. When a level-by-level view matters (\"each row\", \"right side\", \"minimum depth\"), use a queue instead."),
    key("Lists: start with `ListNode dummy = new ListNode(0)` whenever the head might change, and use slow/fast pointers for middle and cycle. Trees: write the base case `if (node == null) return ...;` first, then trust the recursive call on `node.left` and `node.right`."),
    recipes('Linked list: walk and build', [
      r('Loop through a linked list', `
ListNode cur = head;
int length = 0;
while (cur != null) {
    // use cur.val
    length++;
    cur = cur.next;               // forget this line = infinite loop
}`, 'O(n)', 'Walk with a copy (`cur`) so you still have `head` afterwards.'),
      r('Build a new list with a dummy head', `
ListNode dummy = new ListNode(0);       // fake node before the real head
ListNode tail = dummy;
for (int num : nums) {
    tail.next = new ListNode(num);
    tail = tail.next;
}
return dummy.next;                       // the real head (null if nums is empty)`, 'O(n)', 'The dummy removes every "is this the first node?" special case.'),
      r('Copy a list into an ArrayList and back', `
List<Integer> values = new ArrayList<>();
for (ListNode cur = head; cur != null; cur = cur.next) values.add(cur.val);

ListNode dummy = new ListNode(0), tail = dummy;
for (int v : values) {
    tail.next = new ListNode(v);
    tail = tail.next;
}
ListNode rebuilt = dummy.next;`, 'O(n)', 'Fine for a palindrome check or when stuck; interviewers may ask for O(1) space after.'),
      r('Delete every node with a given value', `
ListNode dummy = new ListNode(0, head);
ListNode prev = dummy;
while (prev.next != null) {
    if (prev.next.val == val) prev.next = prev.next.next;   // skip it, stay put
    else prev = prev.next;                                  // move only when you keep it
}
return dummy.next;`, 'O(n)', 'Stand on the node **before** the one you may delete.'),
    ]),
    recipes('Linked list: classic moves', [
      r('Reverse a linked list', `
ListNode prev = null, cur = head;
while (cur != null) {
    ListNode nextNode = cur.next;    // 1. save the rest
    cur.next = prev;                 // 2. point backwards
    prev = cur;                      // 3. step prev
    cur = nextNode;                  // 4. step cur
}
return prev;                         // new head`, 'O(n)', 'Say it as "save, flip, step, step". The new head is `prev`, not `cur`.'),
      r('Find the middle node (slow and fast)', `
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
return slow;        // even length: the SECOND of the two middles`, 'O(n)', 'Start `fast = head.next` to get the first middle instead (needed to split for merge sort).'),
      r('Detect a cycle and find where it starts', `
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) {                      // they met: there is a cycle
        ListNode from = head;
        while (from != slow) {               // walk both one step at a time
            from = from.next;
            slow = slow.next;
        }
        return from;                         // cycle start
    }
}
return null;                                 // no cycle`, 'O(n)', 'Compare nodes with `==` (same object), never by `val`.'),
      r('Merge two sorted lists', `
ListNode dummy = new ListNode(0), tail = dummy;
ListNode p1 = l1, p2 = l2;
while (p1 != null && p2 != null) {
    if (p1.val <= p2.val) { tail.next = p1; p1 = p1.next; }
    else { tail.next = p2; p2 = p2.next; }
    tail = tail.next;
}
tail.next = (p1 != null) ? p1 : p2;      // attach whatever is left
return dummy.next;`, 'O(n + m)'),
      r('Remove the nth node from the end', `
ListNode dummy = new ListNode(0, head);
ListNode fast = dummy, slow = dummy;
for (int step = 0; step <= n; step++) fast = fast.next;   // gap of n + 1
while (fast != null) {
    fast = fast.next;
    slow = slow.next;
}
slow.next = slow.next.next;              // slow sits just before the one to delete
return dummy.next;`, 'O(n)', 'The dummy handles "remove the head" (n = length) without a special case.'),
    ]),
    recipes('Tree: recursive DFS', [
      r('Visit nodes in preorder, inorder, postorder', `
void walk(TreeNode node, List<Integer> out) {
    if (node == null) return;
    out.add(node.val);            // PRE: before children
    walk(node.left, out);
    // IN: put out.add(node.val) here for sorted order on a BST
    walk(node.right, out);
    // POST: put it here when you need the children's answers first
}`, 'O(n)', 'Same function three ways; only the line that handles `node` moves.'),
      r('Maximum depth of a tree', `
int maxDepth(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}`, 'O(n)', 'The pattern for most tree questions: answer for null, then combine left and right.'),
      r('Track a best answer while returning something else (diameter)', `
int best = 0;

int height(TreeNode node) {
    if (node == null) return 0;
    int left = height(node.left), right = height(node.right);
    best = Math.max(best, left + right);     // path through this node, in edges
    return 1 + Math.max(left, right);        // what the PARENT needs
}`, 'O(n)', 'The return value feeds the parent; the field holds the global answer. Max path sum works the same way.'),
      r('Collect every root-to-leaf path with a given sum', `
List<List<Integer>> paths = new ArrayList<>();

void findPaths(TreeNode node, int remaining, List<Integer> path) {
    if (node == null) return;
    path.add(node.val);
    if (node.left == null && node.right == null && remaining == node.val) {
        paths.add(new ArrayList<>(path));            // COPY, the path keeps changing
    }
    findPaths(node.left, remaining - node.val, path);
    findPaths(node.right, remaining - node.val, path);
    path.remove(path.size() - 1);                    // undo before going back up
}`, 'O(n^2) worst', '`path.remove(int index)` removes by position; that is what you want here.'),
      r('Lowest common ancestor in a binary tree', `
TreeNode lca(TreeNode node, TreeNode p, TreeNode q) {
    if (node == null || node == p || node == q) return node;
    TreeNode left = lca(node.left, p, q);
    TreeNode right = lca(node.right, p, q);
    if (left != null && right != null) return node;   // one on each side: this is it
    return left != null ? left : right;
}`, 'O(n)', 'On a BST it is simpler: walk left if both are smaller, right if both are bigger, else stop.'),
      r('Check two trees are the same (or mirror)', `
boolean same(TreeNode p, TreeNode q) {
    if (p == null || q == null) return p == q;           // both null = true
    return p.val == q.val && same(p.left, q.left) && same(p.right, q.right);
}

boolean mirror(TreeNode p, TreeNode q) {
    if (p == null || q == null) return p == q;
    return p.val == q.val && mirror(p.left, q.right) && mirror(p.right, q.left);
}`, 'O(n)', '`mirror(root.left, root.right)` answers **Symmetric Tree**.'),
    ]),
    recipes('Tree: level order and iterative', [
      r('Level order into a list of rows', `
List<List<Integer>> levels = new ArrayList<>();
Queue<TreeNode> q = new ArrayDeque<>();
if (root != null) q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();                         // nodes on this level
    List<Integer> row = new ArrayList<>();
    for (int idx = 0; idx < size; idx++) {
        TreeNode node = q.poll();
        row.add(node.val);
        if (node.left != null) q.offer(node.left);
        if (node.right != null) q.offer(node.right);
    }
    levels.add(row);
}
return levels;`, 'O(n)', 'Right side view = last item of each row. Zigzag = reverse every other row.'),
      r('Inorder with a stack (no recursion)', `
List<Integer> order = new ArrayList<>();
Deque<TreeNode> st = new ArrayDeque<>();
TreeNode cur = root;
while (cur != null || !st.isEmpty()) {
    while (cur != null) { st.push(cur); cur = cur.left; }   // dive left
    cur = st.pop();
    order.add(cur.val);                                       // visit
    cur = cur.right;
}`, 'O(n)', 'Stop when `order.size() == k` for **Kth Smallest Element in a BST**.'),
    ]),
    recipes('Binary search tree', [
      r('Search a BST', `
TreeNode search(TreeNode node, int goal) {
    while (node != null && node.val != goal) {
        node = goal < node.val ? node.left : node.right;
    }
    return node;                  // null if not found
}`, 'O(h)', 'h is the height: log n when balanced, n when it is a line.'),
      r('Insert into a BST', `
TreeNode insert(TreeNode node, int v) {
    if (node == null) return new TreeNode(v);
    if (v < node.val) node.left = insert(node.left, v);
    else node.right = insert(node.right, v);
    return node;                  // reattach on the way back up
}`, 'O(h)'),
      r('Check a tree is a valid BST (bounds)', `
boolean valid(TreeNode node, Integer low, Integer high) {
    if (node == null) return true;
    if (low != null && node.val <= low) return false;
    if (high != null && node.val >= high) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
}
// call: valid(root, null, null)       null = no bound yet

// Same idea with long bounds, so Integer.MIN_VALUE / MAX_VALUE nodes still fit
boolean validLong(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return validLong(node.left, low, node.val) && validLong(node.right, node.val, high);
}
// call: validLong(root, Long.MIN_VALUE, Long.MAX_VALUE)`, 'O(n)', 'Checking only parent vs child is wrong: every node must fit the bounds of ALL its ancestors.'),
    ]),
    recipes('Tree as a graph', [
      r('Find all nodes at distance k (parent map + BFS)', `
TreeNode targetNode = root;
Map<TreeNode, TreeNode> parent = new HashMap<>();
Deque<TreeNode> walk = new ArrayDeque<>();
walk.push(root);
while (!walk.isEmpty()) {                       // 1. record each node's parent
    TreeNode node = walk.pop();
    if (node.left != null) { parent.put(node.left, node); walk.push(node.left); }
    if (node.right != null) { parent.put(node.right, node); walk.push(node.right); }
}
Set<TreeNode> visited = new HashSet<>(List.of(targetNode));
Queue<TreeNode> q = new ArrayDeque<>(List.of(targetNode));
for (int dist = 0; dist < k && !q.isEmpty(); dist++) {   // 2. BFS k levels out
    int size = q.size();
    for (int idx = 0; idx < size; idx++) {
        TreeNode node = q.poll();
        for (TreeNode nb : new TreeNode[]{node.left, node.right, parent.get(node)}) {
            if (nb != null && visited.add(nb)) q.offer(nb);
        }
    }
}
List<Integer> answer = new ArrayList<>();
for (TreeNode node : q) answer.add(node.val);
return answer;`, 'O(n)', 'Once each node knows its parent, the tree is an undirected graph with up to 3 neighbours.'),
    ]),
    warn("`cur = cur.next.next` crashes when `cur.next` is null. In slow/fast loops check `fast != null && fast.next != null`, in that order.", 'Null next'),
    warn("When you add a path list to the answers, add `new ArrayList<>(path)`. Adding `path` itself stores the same list every time, and it ends up empty after backtracking."),
    tip("Draw three boxes and arrows before touching pointers. For a tree, ask \"what does a leaf return, and how do I combine left and right?\" and the code usually writes itself."),
    costs([
      ['List: walk / length', '`cur = cur.next`', 'O(n)'],
      ['List: insert after a node', '`node.next = new ListNode(v, node.next)`', 'O(1)'],
      ['List: get index i', 'walk i steps', 'O(i)'],
      ['Tree: DFS / BFS', 'recursion or queue', 'O(n)'],
      ['BST: search / insert', 'go left or right', 'O(h)'],
      ['Recursion stack', 'depth of the tree', 'O(h) space'],
    ]),
    drill("No notes, 10 minutes: **Reverse Linked List** (save, flip, step, step), **Merge Two Sorted Lists** with a dummy, then **Maximum Depth of Binary Tree** and **Binary Tree Level Order Traversal**. Then **Validate Binary Search Tree** with bounds."),
  ],
};
