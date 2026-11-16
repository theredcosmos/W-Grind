// Java Cheatsheet: String, StringBuilder and char. Same shape as hashmap.js: intro, recipe groups
// by job, traps, costs, drill.
import { t, key, warn, tip, drill, r, recipes, costs } from './h.js';

export default {
  id: 'strings',
  title: 'String, StringBuilder, char',
  summary: 'Read letters, char math, split and join, build a result fast, palindromes and anagram keys.',
  tags: ['string', 'stringbuilder', 'char', 'character', 'substring', 'split', 'join', 'palindrome', 'anagram', 'parse', 'reverse', 'tochararray', 'ascii'],
  blocks: [
    t("A `String` is read-only: every \"change\" makes a new string. That is fine for reading, slicing and comparing, but building an answer with `+=` in a loop is O(n^2). When you build or edit text, use a `StringBuilder` and call `toString()` at the end. A `char` is really a small number, so `c - 'a'` gives a letter's position and lets you use an `int[26]` instead of a map."),
    key("Three things cover most problems: `s.charAt(i)` (or `for (char ch : s.toCharArray())`) to read letters, `ch - 'a'` to turn a letter into 0..25, and `StringBuilder sb = new StringBuilder(); sb.append(x); sb.toString()` to build the answer. Compare strings with `.equals`, never `==`."),
    recipes('Read the letters', [
      r('Loop over each character', `
for (int idx = 0; idx < s.length(); idx++) {
    char ch = s.charAt(idx);        // when you need the index
}
for (char ch : s.toCharArray()) {
    // just the letters
}`, 'O(n)', '`length()` has brackets on a String; `length` has none on an array.'),
      r('Turn a letter into 0..25 and back', `
char ch = 'd';
int pos = ch - 'a';                  // 'a' -> 0, 'd' -> 3
char back = (char) ('a' + pos);      // 3 -> 'd'
int upperPos = 'D' - 'A';            // same idea for capitals`, 'O(1)', 'Without the `(char)` cast, `\'a\' + pos` is an `int` and prints as a number.'),
      r('Turn a digit char into a number and back', `
char digit = '7';
int value = digit - '0';             // '7' -> 7
char again = (char) ('0' + value);   // 7 -> '7'
int fromChar = Character.getNumericValue(digit);   // also 7`, 'O(1)', '`(int) \'7\'` is 55 (its ASCII code), not 7. Subtract `\'0\'`.'),
      r('Check what kind of character it is', `
char ch = s.charAt(0);
boolean letter = Character.isLetter(ch);
boolean digit = Character.isDigit(ch);
boolean alnum = Character.isLetterOrDigit(ch);   // letter or digit
boolean upper = Character.isUpperCase(ch);
boolean space = Character.isWhitespace(ch);
char lower = Character.toLowerCase(ch);          // returns a new char`, 'O(1)'),
      r('Count letters with an int[26]', `
int[] cnt = new int[26];
for (char ch : s.toCharArray()) cnt[ch - 'a']++;
for (int idx = 0; idx < 26; idx++) {
    if (cnt[idx] > 0) {
        char letter = (char) ('a' + idx);   // letter appears cnt[idx] times
    }
}`, 'O(n)', 'Only for lowercase a-z. Mixed text: use `int[128]` and index by the char itself.'),
    ]),
    recipes('Slice, search and compare', [
      r('Take part of a string', `
String word2 = "leetcode";
String firstFour = word2.substring(0, 4);   // "leet" (index 4 not included)
String rest = word2.substring(4);           // "code" (from 4 to the end)
char lastChar = word2.charAt(word2.length() - 1);`, 'O(len)', 'End is excluded, so `substring(i, i + len)` gives exactly `len` letters.'),
      r('Find text inside a string', `
int at = s.indexOf("bc");            // first index, or -1
int atChar = s.indexOf('b');
int fromIdx = s.indexOf('b', 2);     // search starting at index 2
boolean has = s.contains("bc");
boolean starts = s.startsWith("ab"), ends = s.endsWith("c");`, 'O(n * m)'),
      r('Check two strings are equal', `
boolean same = s.equals(t);                  // same letters
boolean sameIgnoreCase = s.equalsIgnoreCase(t);
int order = s.compareTo(t);                  // < 0 if s comes first alphabetically`, 'O(n)', '`s == t` checks if they are the same object, and can be false for equal text.'),
      r('Check if a string is empty or blank', `
boolean empty = s.isEmpty();       // length 0
boolean blank = s.isBlank();       // empty or only spaces (Java 11+)`, 'O(n)'),
    ]),
    recipes('Split, trim and join', [
      r('Split a sentence into words', `
String[] parts = text.split(" ");                 // one space between words
String[] clean = text.trim().split("\\\\s+");        // any number of spaces, no empty first word
String[] fields = "a,b,,c".split(",");            // ["a", "b", "", "c"]
String[] keepEnd = "a,b,,".split(",", -1);        // -1 keeps the empty strings at the end`, 'O(n)', 'Trim first: `" hi".split("\\\\s+")` starts with an empty string.'),
      r('Split on a special character', `
String[] dotParts = "1.2.3".split("\\\\.");         // . is regex for "any char", so escape it
String[] pipeParts = "a|b".split("\\\\|");
String[] pathParts = "/a/b".split("/");          // ["", "a", "b"]: leading empty string`, 'O(n)', '`split` takes a regex. Escape `. | * + ? ( ) [ ] $ ^` with `\\\\`.'),
      r('Remove spaces at the ends', `
String padded = "  hi there  ";
String trimmed = padded.trim();       // "hi there"
String stripped = padded.strip();     // same, also handles Unicode spaces
String noSpaces = padded.replace(" ", "");   // "hithere"`, 'O(n)'),
      r('Join words with a separator', `
String sentence = String.join(" ", words);          // String[] or List<String>
String csv = String.join(",", names);

List<String> reversedWords = new ArrayList<>(Arrays.asList(words));
Collections.reverse(reversedWords);
String back = String.join(" ", reversedWords);     // Reverse Words in a String`, 'O(n)'),
    ]),
    recipes('Convert between types', [
      r('Number to string and string to number', `
String fromInt = String.valueOf(42);          // "42"
String alsoFromInt = Integer.toString(42);
String lazy = "" + 42;                         // works, a bit slower
int parsed = Integer.parseInt("-17");          // -17
long bigParsed = Long.parseLong("9000000000");`, 'O(digits)', '`parseInt` throws NumberFormatException on "", "12a" or a number too big for int.'),
      r('Number to binary (and back)', `
String bits = Integer.toBinaryString(10);      // "1010"
int fromBits = Integer.parseInt("1010", 2);    // 10
int ones = Integer.bitCount(10);               // 2 (number of 1 bits)`, 'O(1)'),
      r('char[] or char to String', `
char[] letters = {'c', 'a', 't'};
String fromArray = new String(letters);         // "cat"
String fromPart = new String(letters, 1, 2);    // "at" (start, count)
String one = String.valueOf('x');               // "x"`, 'O(n)', '`letters.toString()` prints junk like `[C@1b6d3586`; use `new String(letters)`.'),
      r('Change upper and lower case', `
String low = s.toLowerCase();
String up = s.toUpperCase();
String shout = "ab".repeat(3);                 // "ababab"`, 'O(n)'),
    ]),
    recipes('Build and edit with StringBuilder', [
      r('Build a result in a loop', `
StringBuilder sb = new StringBuilder();
for (int num : nums) {
    sb.append(num).append(',');      // append takes int, char, String, ...
}
String built = sb.toString();`, 'O(n)', '`result += piece` in a loop copies the whole string each time: O(n^2).'),
      r('Remove the last character (trailing comma)', `
StringBuilder sb = new StringBuilder("1,2,3,");
if (sb.length() > 0) sb.deleteCharAt(sb.length() - 1);   // "1,2,3"
sb.setLength(sb.length() - 1);                           // also chops one: "1,2,"`, 'O(1)', 'In backtracking, `setLength(lenBefore)` undoes everything appended since `lenBefore`.'),
      r('Insert, change, delete inside the builder', `
StringBuilder sb = new StringBuilder("hello");
sb.insert(0, '>');            // ">hello"
sb.setCharAt(1, 'H');         // ">Hello"
sb.deleteCharAt(0);           // "Hello"
sb.delete(0, 2);              // "llo" (end excluded)
char first = sb.charAt(0);
int len = sb.length();`, 'O(n) insert/delete, O(1) set/get'),
      r('Reverse a string', `
String reversed = new StringBuilder(s).reverse().toString();`, 'O(n)'),
      r('Use a StringBuilder as a stack', `
// Remove adjacent duplicates: "abbaca" -> "ca"
StringBuilder st = new StringBuilder();
for (char ch : s.toCharArray()) {
    int last = st.length() - 1;
    if (last >= 0 && st.charAt(last) == ch) st.deleteCharAt(last);   // pop
    else st.append(ch);                                              // push
}
return st.toString();`, 'O(n)'),
    ]),
    recipes('Common string patterns', [
      r('Check a palindrome with two pointers', `
boolean isPalindrome(String str) {
    int lo = 0, hi = str.length() - 1;
    while (lo < hi) {
        if (str.charAt(lo++) != str.charAt(hi--)) return false;
    }
    return true;
}`, 'O(n)', 'No extra string needed, unlike comparing to the reversed copy.'),
      r('Palindrome ignoring case and punctuation', `
boolean isCleanPalindrome(String str) {
    int lo = 0, hi = str.length() - 1;
    while (lo < hi) {
        char left = str.charAt(lo), right = str.charAt(hi);
        if (!Character.isLetterOrDigit(left)) lo++;          // skip junk on the left
        else if (!Character.isLetterOrDigit(right)) hi--;    // skip junk on the right
        else if (Character.toLowerCase(left) != Character.toLowerCase(right)) return false;
        else { lo++; hi--; }
    }
    return true;
}`, 'O(n)'),
      r('Sort the letters (anagram key)', `
char[] letters = s.toCharArray();
Arrays.sort(letters);
String sortedKey = new String(letters);     // "eat", "tea" -> "aet"`, 'O(n log n)', 'Use it as a HashMap key to group anagrams.'),
      r('Count-based anagram key (faster for long words)', `
int[] cnt = new int[26];
for (char ch : s.toCharArray()) cnt[ch - 'a']++;
String countKey = Arrays.toString(cnt);     // "[1, 0, 0, ...]" same for all anagrams`, 'O(n)'),
      r('Check two strings are anagrams', `
if (s.length() != t.length()) return false;
int[] diff = new int[26];
for (int idx = 0; idx < s.length(); idx++) {
    diff[s.charAt(idx) - 'a']++;
    diff[t.charAt(idx) - 'a']--;
}
for (int d : diff) if (d != 0) return false;
return true;`, 'O(n)'),
      r('Work with the chars as a stream', `
long vowelCount = s.chars().filter(ch -> "aeiou".indexOf(ch) >= 0).count();
boolean allDigits = s.chars().allMatch(Character::isDigit);
String onlyLetters = s.chars()
        .filter(Character::isLetter)
        .mapToObj(ch -> String.valueOf((char) ch))
        .collect(Collectors.joining());`, 'O(n)', '`chars()` gives `int` values; cast back with `(char) ch` before turning them into text.'),
    ]),
    warn("`s == t` compares whether they are the **same object**, not the same text. Two equal strings built at runtime are often different objects. Always use `s.equals(t)`.", 'The == trap'),
    warn("Adding a char to an int gives an int: `'a' + 1` is 98, and `\"\" + 'a' + 1` is \"a1\". Cast with `(char) ('a' + 1)` to get `'b'`."),
    tip("Stuck on a string problem? Ask: \"do I only need counts?\" If yes, an `int[26]` is all you need. If you need to build text, open a `StringBuilder` before the loop."),
    costs([
      ['Read a char', '`charAt(i)`', 'O(1)'],
      ['Length', '`length()`', 'O(1)'],
      ['Slice', '`substring(a, b)`', 'O(b - a)'],
      ['Search', '`indexOf`, `contains`', 'O(n * m)'],
      ['Compare', '`equals`, `compareTo`', 'O(n)'],
      ['Split / join', '`split(regex)`, `String.join`', 'O(n)'],
      ['Append', '`sb.append(x)`', 'O(1) average'],
      ['Insert / delete middle', '`sb.insert`, `sb.deleteCharAt`', 'O(n)'],
      ['Reverse', '`sb.reverse()`', 'O(n)'],
    ]),
    drill("No notes, 10 minutes: count the letters of a word with `int[26]`, print each letter and count with `(char) ('a' + i)`, reverse the word with a `StringBuilder`, then split `\"  the sky  is blue \"` into words. Then do **Valid Palindrome** and **Group Anagrams**."),
  ],
};
