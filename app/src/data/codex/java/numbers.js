// Java Cheatsheet: numbers, math and conversions (shape like hashmap.js).
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'numbers',
  title: 'Numbers, math and conversions',
  summary: 'Overflow, min/max starters, rounding, mod, digits, bits, and turning one type into another.',
  tags: ['integer', 'long', 'overflow', 'math', 'mod', 'digits', 'bits', 'convert', 'parse', 'boxing', 'max value'],
  blocks: [
    t("Most wrong answers that \"should work\" are number bugs: an `int` that overflowed, a division that rounded down, a `%` on a negative number. This card is the fix list, plus how to convert between `int`, `String`, `char`, arrays and lists without googling."),
    key("Sums and products that can pass ~2 billion go in `long`. Start a max at `Integer.MIN_VALUE` and a min at `Integer.MAX_VALUE`. Middle index: `lo + (hi - lo) / 2`."),
    recipes('Limits and starters', [
      r('Start a running max and min', `
int best = Integer.MIN_VALUE;                 // anything beats it
int least = Integer.MAX_VALUE;
for (int num : nums) {
    best = Math.max(best, num);
    least = Math.min(least, num);
}`, 'O(n)'),
      r('Use "infinity" in DP without overflow', `
int INF = Integer.MAX_VALUE / 2;             // INF + INF still fits
int[] dp = new int[amount + 1];
Arrays.fill(dp, INF);
dp[0] = 0;`, null, 'Plain `Integer.MAX_VALUE + 1` wraps to a huge negative number.'),
    ]),
    recipes('Avoid overflow', [
      r('Add or multiply big numbers safely', `
long sum = 0;
for (int num : nums) sum += num;              // long accumulator

long product = (long) nums[0] * nums[1];      // cast BEFORE multiplying
int mid = start + (end - start) / 2;          // not (start + end) / 2`, 'O(1)'),
      r('Keep answers small with mod 1_000_000_007', `
final int MOD = 1_000_000_007;
long ways = 1;
for (int num : nums) {
    ways = (ways * num) % MOD;                // reduce after every step
}
int answer = (int) ways;`, 'O(n)'),
      r('Reverse an integer and detect overflow', `
int num = 1534236469, rev = 0;
while (num != 0) {
    int digit = num % 10;
    if (rev > Integer.MAX_VALUE / 10 || rev < Integer.MIN_VALUE / 10) return 0;
    rev = rev * 10 + digit;
    num /= 10;
}
return rev;`, 'O(digits)'),
    ]),
    recipes('Division, rounding and mod', [
      r('Round a division up (ceiling)', `
int pages = 7, perDay = 3;
int days = (pages + perDay - 1) / perDay;     // 3
int days2 = (int) Math.ceil((double) pages / perDay);`, 'O(1)', 'Integer `/` always rounds toward zero: `7 / 3 == 2`.'),
      r('Get a positive mod for negative numbers', `
int idx = -3, size = 5;
int wrapped = ((idx % size) + size) % size;   // 2, never negative
int alsoWrapped = Math.floorMod(idx, size);    // same`, 'O(1)', 'In Java `-3 % 5 == -3`, not 2.'),
      r('Divide without losing the decimal part', `
int sumOfScores = 7, people = 2;
double avg = (double) sumOfScores / people;    // 3.5 (cast one side first)`, 'O(1)'),
    ]),
    recipes('Digits and bits', [
      r('Loop over the digits of a number', `
int num = 9045, digitSum = 0;
while (num > 0) {
    int digit = num % 10;                     // last digit
    digitSum += digit;
    num /= 10;                                // drop last digit
}`, 'O(digits)'),
      r('Build a number from digits', `
int built = 0;
for (char ch : "472".toCharArray()) {
    built = built * 10 + (ch - '0');
}`, 'O(digits)'),
      r('Common bit tricks', `
boolean isOdd = (x & 1) == 1;
int ones = Integer.bitCount(x);               // how many 1 bits
boolean powerOfTwo = x > 0 && (x & (x - 1)) == 0;
int lowestBit = x & -x;
int withBitSet = x | (1 << 3);                // turn bit 3 on
boolean bit3On = ((x >> 3) & 1) == 1;
int single = 0;
for (int num : nums) single ^= num;           // the number that appears once`, 'O(1)'),
      r('Loop over all subsets with a bitmask', `
int size = nums.length;
for (int mask = 0; mask < (1 << size); mask++) {
    List<Integer> subset = new ArrayList<>();
    for (int b = 0; b < size; b++) {
        if ((mask & (1 << b)) != 0) subset.add(nums[b]);
    }
    result.add(subset);
}`, 'O(2^n · n)', 'Only for n up to about 20.'),
    ]),
    recipes('Convert between types', [
      r('int ↔ String ↔ char', `
String str = String.valueOf(42);              // "42"   (or Integer.toString(42))
int parsed = Integer.parseInt("42");          // 42
long big = Long.parseLong("9000000000");
char digitChar = (char) ('0' + 7);            // '7'
int digitValue = '7' - '0';                   // 7
String binary = Integer.toBinaryString(10);   // "1010"
int fromBinary = Integer.parseInt("1010", 2); // 10`, 'O(digits)'),
      r('int[] ↔ List<Integer>', `
List<Integer> asList = Arrays.stream(nums).boxed().collect(Collectors.toList());
int[] back = asList.stream().mapToInt(Integer::intValue).toArray();

// Loop versions (no streams):
List<Integer> asList2 = new ArrayList<>();
for (int num : nums) asList2.add(num);
int[] back2 = new int[asList2.size()];
for (int idx = 0; idx < back2.length; idx++) back2[idx] = asList2.get(idx);`, 'O(n)', '`Arrays.asList(nums)` on an `int[]` gives a list with ONE item (the array). Use the stream.'),
      r('int[] or List ↔ Set', `
Set<Integer> fromArray = Arrays.stream(nums).boxed().collect(Collectors.toSet());
Set<Integer> fromList = new HashSet<>(list);
List<Integer> backToList = new ArrayList<>(fromList);
int[] backToArray = fromList.stream().mapToInt(Integer::intValue).toArray();`, 'O(n)'),
      r('List<int[]> ↔ int[][]', `
List<int[]> merged = new ArrayList<>();
merged.add(new int[]{1, 3});
int[][] asArray = merged.toArray(new int[0][]);`, 'O(n)'),
      r('String[] ↔ List<String>, and joining', `
List<String> wordList = new ArrayList<>(Arrays.asList(words));
String[] backToWords = wordList.toArray(new String[0]);
String sentence = String.join(" ", wordList);`, 'O(n)'),
    ]),
    warn("`Integer` objects compared with `==` are only equal for -128..127. From a list or map, compare with `.equals()` or unbox to `int` first.", 'Boxed == trap'),
    warn("`Math.abs(Integer.MIN_VALUE)` is still negative (it overflows). Convert to `long` first when the input can be -2^31."),
    tip("Look at the constraints: values up to 10^9 and you add two of them, or n up to 10^5 and you multiply, means **use long**."),
    costs([
      ['Parse / print a number', '`Integer.parseInt`, `String.valueOf`', 'O(digits)'],
      ['Count bits', '`Integer.bitCount(x)`', 'O(1)'],
      ['int[] → List', '`Arrays.stream(a).boxed()`', 'O(n)'],
      ['List → int[]', '`.mapToInt(Integer::intValue)`', 'O(n)'],
    ]),
    drill("Without looking: sum an `int[]` into a `long`, ceil-divide 17 by 5, convert `int[]` → `List<Integer>` → back, and count the 1 bits of 29."),
  ],
};
