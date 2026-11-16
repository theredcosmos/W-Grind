// Compile-checks every Java recipe snippet in a Codex tab with javac, so the cheatsheet never
// shows code that would not compile.
//
//   node scripts/check-recipes.mjs src/data/codex/java/index.js [more files: a tab, a section or an array of sections]
//
// Each snippet is tried as method-body statements first; if that fails, as class members
// (helper methods, small classes). Snippets can use the shared context below (nums, s, map,
// ListNode, TreeNode, ...) without declaring it; their own locals shadow those names.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONTEXT = `
    int[] nums = {1, 2, 3}, arr = nums, a = nums, b = nums, prices = nums, heights = nums, coins = nums;
    int[][] grid = {{1}}, matrix = grid, edges = {{0, 1}}, intervals = {{1, 2}}, points = grid, queries = grid;
    char[][] board = {{'a'}};
    String s = "abc", t = "abc", word = "abc", text = "abc", p = "a";
    String[] words = {"a"}, strs = words, tokens = words;
    char[] chars = s.toCharArray();
    List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
    List<String> names = new ArrayList<>(List.of("a"));
    List<List<Integer>> graph = new ArrayList<>(), adj = graph, result = new ArrayList<>();
    Map<Integer, Integer> map = new HashMap<>(), freq = map, count = map;
    Map<String, Integer> scores = new HashMap<>(), stock = scores;
    Map<Character, Integer> charCount = new HashMap<>();
    Set<Integer> set = new HashSet<>(), seen = set;
    int n = 3, m = 3, k = 1, target = 3, x = 1, key = 1, val = 1, value = 1, i = 0, j = 0, r = 0, start = 0, end = 0, amount = 3;
    long total = 0;
    char c = 'a';
    ListNode head = new ListNode(1), l1 = head, l2 = head;
    TreeNode root = new TreeNode(1);
`;

const PRELUDE = `import java.util.*;
import java.util.function.*;
import java.util.stream.*;

@SuppressWarnings("all")
public class Recipes {
    static class ListNode { int val; ListNode next; ListNode() {} ListNode(int v) { val = v; } ListNode(int v, ListNode n) { val = v; next = n; } }
    static class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int v) { val = v; } TreeNode(int v, TreeNode l, TreeNode r) { val = v; left = l; right = r; } }
    static class Node { int val; List<Node> neighbors = new ArrayList<>(); Node next, random; Node(int v) { val = v; } }
    static class Base {${CONTEXT}    }
`;

const wrap = (id, code, shape) => (shape === 'statements'
  ? `    static class R${id} extends Base {\n        Object run() throws Exception {\n            if (true) {\n${code}\n            }\n            return null;\n        }\n    }\n`
  : `    static class R${id} extends Base {\n${code}\n    }\n`);

function compile(recipes) {
  // Returns the set of recipe ids whose lines javac complained about, plus raw messages per id.
  const dir = mkdtempSync(join(tmpdir(), 'recipes-'));
  let src = PRELUDE;
  const spans = [];
  for (const r of recipes) {
    const startLine = src.split('\n').length;
    src += wrap(r.id, r.code, r.shape);
    spans.push({ id: r.id, from: startLine, to: src.split('\n').length });
  }
  src += '}\n';
  writeFileSync(join(dir, 'Recipes.java'), src);
  const bad = new Map();
  try {
    execFileSync('javac', ['-Xmaxerrs', '10000', '-nowarn', '-d', dir, join(dir, 'Recipes.java')], { stdio: 'pipe' });
  } catch (e) {
    const out = String(e.stderr || e.stdout || e);
    for (const m of out.matchAll(/Recipes\.java:(\d+): error: (.*)/g)) {
      const line = Number(m[1]);
      const span = spans.find((sp) => line >= sp.from && line < sp.to);
      const id = span ? span.id : -1;
      if (!bad.has(id)) bad.set(id, []);
      bad.get(id).push(m[2]);
    }
    if (!bad.size) bad.set(-1, [out.slice(0, 2000)]);
  }
  rmSync(dir, { recursive: true, force: true });
  return bad;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.log('usage: node scripts/check-recipes.mjs <tab module> [...]');
  process.exit(2);
}

const all = [];
for (const f of files) {
  // A tab ({ sections }), one section ({ blocks }) or an array of sections.
  const mod = (await import(pathToFileURL(resolve(f)).href)).default;
  const sections = Array.isArray(mod) ? mod : mod.sections || [mod];
  for (const s of sections) {
    for (const b of s.blocks) {
      if (b.type !== 'recipes') continue;
      for (const item of b.items) all.push({ id: all.length, where: `${s.id} › ${item.task}`, code: item.code });
    }
  }
}

// Pass 1: everything as statements. Pass 2: the failures as members. Pass 3: report what still fails.
let failing = compile(all.map((r) => ({ ...r, shape: 'statements' })));
if (failing.has(-1)) {
  console.log('Could not map javac errors to recipes:\n', failing.get(-1).join('\n'));
  process.exit(1);
}
const retry = all.filter((r) => failing.has(r.id));
// Each retry compiles on its own: a syntax error in one snippet would otherwise stop javac before
// it checks the others, and they would look like they pass.
const asMembers = new Map();
for (const r of retry) {
  const errs = compile([{ ...r, shape: 'members' }]);
  if (errs.size) asMembers.set(r.id, [...errs.values()].flat());
}
const stillBad = retry.filter((r) => asMembers.has(r.id));

console.log(`${all.length} recipes: ${all.length - stillBad.length} compile, ${stillBad.length} fail.`);
for (const r of stillBad) {
  console.log(`\n✗ ${r.where}`);
  console.log('  as statements:', failing.get(r.id).slice(0, 2).join(' | '));
  console.log('  as members:   ', asMembers.get(r.id).slice(0, 2).join(' | '));
}
process.exitCode = stillBad.length ? 1 : 0;
