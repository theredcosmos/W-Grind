// Codex tab: Unfreeze. What to do when your mind goes blank, and how to keep focus while training.
export default {
  key: "focus",
  label: "Unfreeze",
  intro: "Your brain froze. That is normal, not a verdict. This tab is the playbook: small, physical actions that restart thinking, in practice and in interviews.",
  sections: [
    {
      id: "why-blank",
      title: "Why your mind goes blank",
      summary: "Two causes, both fixable: too much held in your head, and a threat response.",
      tags: ["blank", "freeze", "anxiety", "working memory", "why"],
      blocks: [
        {
          type: "list",
          items: [
            "**Working memory is tiny.** You can juggle about 4 things at once. A problem story + constraints + an idea + Java syntax overflows it.",
            "**Threat response.** A timer, an interviewer or a red `Wrong Answer` reads as danger. Attention narrows onto the danger, not the problem.",
            "**Blank is not empty.** The knowledge is still there. It is just not reachable while you are overloaded.",
            "**The fix is mechanical:** move things out of your head onto paper, and calm the body a little. Then thinking comes back.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "When you freeze, do not try to think harder. Do something with your hands: write, draw, type examples.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (5 min)",
          text: "Open any Easy you have not seen, start a 5-minute timer, and only write things down: input, output, one example. No code. Notice how much calmer it feels once the problem is on paper.",
        },
      ],
    },
    {
      id: "unfreeze-90",
      title: "The 90-second unfreeze ritual",
      summary: "Four steps that turn a scary story into a small, solvable thing.",
      tags: ["ritual", "start", "blank", "examples", "brute force"],
      blocks: [
        {
          type: "steps",
          title: "Do these in order. Out loud or in comments.",
          items: [
            "**Strip the story (20s).** Write three lines: `Input:` what you get. `N:` the biggest size. `Goal:` what you return. Ignore the flavour text.",
            "**Tiny examples (30s).** Write 2-3 examples by hand. One normal, one tiny (empty or single element), one tricky (duplicates, negatives, all same).",
            "**Brute force out loud (20s).** Say the dumbest correct way. 'Try every pair.' 'Try every substring.' It does not need to be fast.",
            "**Name the bottleneck (20s).** Point at the slow part. 'The inner loop rescans.' 'I recompute the sum every time.' That spot is where the pattern lives.",
          ],
        },
        {
          type: "table",
          title: "Example: Two Sum",
          head: ["Step", "What you write"],
          rows: [
            ["Strip", "Input: int[] nums, int target. N up to 10^4. Goal: indices i, j with nums[i] + nums[j] == target."],
            ["Examples", "[2,7,11,15], 9 → [0,1]. [3,3], 6 → [0,1]. [1,2], 10 → none (problem says one always exists)."],
            ["Brute", "Check every pair: O(n^2)."],
            ["Bottleneck", "Inner loop searches for `target - nums[i]`. Searching fast → HashMap."],
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "The bottleneck sentence almost always names the fix. 'I keep searching' → hash it. 'I keep summing' → prefix sums. 'I keep finding the max' → heap.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "Run the ritual on 3 problems without solving them: Contains Duplicate, Best Time to Buy and Sell Stock, Valid Anagram. Only the four steps. Check your bottleneck sentence against the real solution.",
        },
      ],
    },
    {
      id: "say-out-loud",
      title: "Scripts for when you're stuck",
      summary: "Exact sentences to say in an interview so silence never builds up.",
      tags: ["interview", "communication", "scripts", "stuck", "talk"],
      blocks: [
        {
          type: "text",
          text: "Silence feels worse than it is, but it also hides your thinking. Interviewers grade the process. These lines keep the process visible while you recover.",
        },
        {
          type: "table",
          head: ["Moment", "Say this"],
          rows: [
            ["Just read it, mind blank", "'Let me restate it to make sure I have it: I get ___ and I need to return ___.'"],
            ["Need time", "'I'm going to take 30 seconds to work through a small example on paper.'"],
            ["No idea yet", "'Let me start with a brute force so we have something correct, then improve it.'"],
            ["Have brute force", "'This is O(n^2) because of the inner loop. The repeated work is ___, so I'll try to avoid that.'"],
            ["Choosing between ideas", "'I see two options: ___ and ___. I'll go with ___ because the input is sorted / N is 10^5.'"],
            ["Unsure of an edge case", "'Can the array be empty? Can values be negative? I'll assume ___ unless you say otherwise.'"],
            ["Bug appears", "'Something is off. Let me trace this example line by line.'"],
            ["Totally stuck", "'I'm stuck on how to make ___ fast. Am I on a reasonable track?'"],
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Narrate what you are doing, not what you are feeling. 'I'm checking the loop bounds' beats 'sorry, I'm nervous'.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "Solve Valid Parentheses while talking out loud the whole time, using at least four lines from the table. Record yourself on your phone and listen to one minute of it.",
        },
      ],
    },
    {
      id: "ask-for-hint",
      title: "Asking for a hint without losing points",
      summary: "A good hint request shows progress. A bad one hands over the problem.",
      tags: ["interview", "hint", "help", "communication"],
      blocks: [
        {
          type: "steps",
          title: "The shape of a good hint request",
          items: [
            "Say what you have: 'I have an O(n^2) brute force that works.'",
            "Say exactly where it breaks: 'The slow part is finding the previous larger element.'",
            "Offer a guess: 'I think a stack could help but I can't see what to keep in it.'",
            "Ask a narrow question: 'Is a stack the right direction?'",
          ],
        },
        {
          type: "table",
          head: ["Avoid", "Use instead"],
          rows: [
            ["'I don't know how to do this.'", "'I can do it in O(n^2). I'm looking for the O(n) idea.'"],
            ["'Can you give me a hint?'", "'Would sorting first be allowed, or does order matter?'"],
            ["Long silence then giving up", "Ask at the 10-minute mark of real stuckness, with your progress stated."],
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "Taking a hint well (using it fast, saying how it changes your plan) often scores better than struggling silently for 15 minutes.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (5 min)",
          text: "Pick Daily Temperatures. Without solving it, write a 4-line hint request in the shape above. Then open one W-Grind hint and see if it answered your question.",
        },
      ],
    },
    {
      id: "stuck-ladder",
      title: "The stuck ladder",
      summary: "What to try at minute 2, 5, 10, 15 and 20, so being stuck has a plan.",
      tags: ["stuck", "timer", "hints", "20 minute rule", "ladder"],
      blocks: [
        {
          type: "table",
          head: ["Minute", "Rung", "Action"],
          rows: [
            ["2", "Unfreeze", "Run the 90-second ritual. Input, N, goal, examples, brute force."],
            ["4", "Hint 1 opens", "Do not open yet if you are moving. Open it if you have nothing on paper."],
            ["5", "Constraints", "Read N again. Look up the target complexity on the Pick the Pattern tab."],
            ["8", "Hint 2 opens", "Open if your brute force exists but you cannot see the bottleneck fix."],
            ["10", "Pattern sweep", "Go through the keyword table. Ask: sorted? contiguous? top k? graph hidden?"],
            ["12", "Hint 3 opens", "Open it. Code whatever idea you have, even if not optimal."],
            ["15", "Last hint", "Open the last hint. Aim to finish an accepted solution, any complexity."],
            ["20", "Stop", "Stop. Read a solution, understand it, close it, then re-type it from memory."],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "Grinding past 20 minutes with no new idea is not discipline. It burns focus you need for the next problem and teaches your brain that practice hurts.",
        },
        {
          type: "callout",
          tone: "tip",
          text: "Opening a hint early costs 10 XP in W-Grind. That is cheap if it saves you 10 minutes of spinning. Spend it.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (20 min)",
          text: "Pick a Medium you have never seen (try Product of Array Except Self). Start the timer and follow the ladder exactly, writing the minute next to each thing you tried. Review the log after.",
        },
      ],
    },
    {
      id: "externalise",
      title: "Get it out of your head",
      summary: "Paper is extra working memory. Use skeletons, tables and drawings.",
      tags: ["working memory", "skeleton", "dry run", "pointers", "comments"],
      blocks: [
        {
          type: "list",
          items: [
            "**Comment skeleton first.** Write the plan as comments, then fill in code under each one.",
            "**State table.** For DP or sliding window, write a table of the variables and how they change.",
            "**Draw pointers.** Write the array, put `L` and `R` arrows under it. Move them by hand.",
            "**Dry-run table.** One row per loop iteration, one column per variable. Bugs jump out.",
          ],
        },
        {
          type: "code",
          title: "Skeleton before code: Longest Substring Without Repeating Characters",
          lang: "java",
          code: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // 1. Map from char -> last index seen
        // 2. left = start of current window, best = 0
        // 3. For right from 0 to n-1:
        //    a. If char seen inside window, jump left past it
        //    b. Record this char's index
        //    c. best = max(best, right - left + 1)
        // 4. Return best
        return 0;
    }
}`,
        },
        {
          type: "table",
          title: "Dry-run table for s = \"abba\"",
          head: ["right", "char", "left", "window", "best"],
          rows: [
            ["0", "a", "0", "a", "1"],
            ["1", "b", "0", "ab", "2"],
            ["2", "b", "2", "b", "2"],
            ["3", "a", "2", "ba", "2"],
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "If you cannot write the skeleton in plain words, you are not ready to code. Go back to examples.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "For Merge Two Sorted Lists, write only the comment skeleton and a dry-run table for [1,3] and [2,4]. Then code it from the comments without looking anything up.",
        },
      ],
    },
    {
      id: "body-reset",
      title: "Desk resets for attention",
      summary: "Small physical moves that take the edge off and bring focus back.",
      tags: ["breathing", "reset", "body", "grounding", "calm"],
      blocks: [
        {
          type: "table",
          head: ["Reset", "How", "Time"],
          rows: [
            ["Long exhale", "Breathe in for 4, out for 6-8. Repeat 4 times. Slow exhales help many people settle.", "40s"],
            ["Stand up", "Stand, roll shoulders, look at something far away.", "30s"],
            ["Water", "Drink a full glass. It is a built-in pause.", "30s"],
            ["3-point grounding", "Name 3 things you see, feel your feet on the floor, press palms together.", "30s"],
            ["Hands busy", "Rewrite the problem input on paper by hand.", "60s"],
            ["Reset the screen", "Close every tab except the problem and your editor.", "20s"],
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "In an interview, a slow exhale and 'let me write an example' looks like a strong candidate thinking, not someone panicking.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (5 min)",
          text: "Next time you see `Wrong Answer`, do one long-exhale round and drink water before touching the code. Note whether the fix came faster than usual.",
        },
      ],
    },
    {
      id: "practice-routines",
      title: "ADHD-friendly practice routines",
      summary: "Make starting easy and stopping clear. Consistency beats marathon sessions.",
      tags: ["adhd", "routine", "timebox", "habit", "streak", "body doubling"],
      blocks: [
        {
          type: "table",
          head: ["Routine", "How it works"],
          rows: [
            ["Timebox", "25 minutes on, 5 off. One problem per box. The timer decides, not your mood."],
            ["One-problem session", "On low days, the goal is one problem. Done is done. Anything extra is bonus."],
            ["Warm-up", "Start with an Easy you already solved. Re-type it in 3 minutes. It loads the Java into your fingers."],
            ["Body doubling", "Work next to someone, a call, or a study-with-me video. Another person present helps you stay on task."],
            ["Reduce friction", "Leave the app open on tomorrow's problem. Template file ready. Phone in another room."],
            ["Pick before you sit", "Choose tomorrow's problem tonight. Deciding is the hardest step; do it while fresh."],
            ["Same time, same place", "Attach practice to something you already do, like after coffee."],
          ],
        },
        {
          type: "list",
          title: "Streak rules that do not break you",
          items: [
            "The minimum counts. One Easy, or one review, keeps the streak.",
            "Missed a day? The rule is never miss two in a row. No guilt spiral.",
            "Track problems understood, not hours sat at the desk.",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "Hyperfocus nights of 6 hours feel great and then cost you a week. Cap sessions and stop while it still feels good.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "Set up tomorrow now: pick one problem (for example Maximum Subarray), open it in a tab, write the 25-minute timer time on a sticky note. Tomorrow you only have to sit down.",
        },
      ],
    },
    {
      id: "bad-session",
      title: "After a bad session",
      summary: "How to turn a session that went badly into progress instead of avoidance.",
      tags: ["bad day", "recovery", "motivation", "failure"],
      blocks: [
        {
          type: "steps",
          items: [
            "Stop. Do not add one more problem to 'make up for it'.",
            "Write one line: what exactly blocked you? (Did not know the pattern / knew it but bugs / could not focus.)",
            "Turn that into one tiny task for next time. 'Read the monotonic stack section.' Nothing bigger.",
            "Make tomorrow's session smaller than usual. One warm-up Easy only.",
            "Close the laptop and do something physical.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "A failed problem with a one-line note is worth more than a solved problem you forget. You did not waste the session; you found the gap.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (5 min)",
          text: "Look at your last failed problem in W-Grind. Write the one-line blocker and the one tiny task. Schedule the tiny task as your next session.",
        },
      ],
    },
    {
      id: "debug-calm",
      title: "Debugging calmly",
      summary: "A checklist to run when code fails, instead of random edits.",
      tags: ["debug", "wrong answer", "bugs", "checklist", "edge cases"],
      blocks: [
        {
          type: "steps",
          title: "When the result is wrong",
          items: [
            "Read the failing input. Copy it. Shrink it to the smallest version that still fails.",
            "Predict the right answer by hand before running anything.",
            "Dry-run your code on that small input with a table.",
            "Find the first row where your table differs from your prediction. The bug is right there.",
          ],
        },
        {
          type: "table",
          title: "Usual suspects",
          head: ["Bug", "Check", "Typical fix"],
          rows: [
            ["Off-by-one", "`<` vs `<=`, `n` vs `n - 1`, window size `r - l + 1`", "Test with N = 1 and N = 2."],
            ["Empty input", "`nums.length == 0`, `head == null`, empty string", "Guard at the top and return early."],
            ["Overflow", "Sums or products of ints near 10^9", "Use `long`. Use `l + (r - l) / 2` for mids."],
            ["Mutation while iterating", "Removing from a list or map inside a for-each", "Iterate over a copy, or use an `Iterator`."],
            ["Wrong loop bounds", "Inner loop starts at 0 instead of `i + 1`", "Write the range in a comment first."],
            ["Stale state", "Variable not reset between test cases or loop rounds", "Declare it inside the loop or reset it."],
            ["Comparing objects", "`Integer a == b` above 127", "Use `.equals()` or unbox to `int`."],
            ["Wrong return", "Returned index instead of value, or vice versa", "Re-read the Goal line."],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          text: "Never change two things at once. One edit, one run. Otherwise you cannot tell what fixed it.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (10 min)",
          text: "Solve Binary Search, then deliberately break it three ways (`<=` to `<`, `mid + 1` to `mid`, int overflow on mid). Find each bug using only the checklist and a dry-run table.",
        },
      ],
    },
    {
      id: "review-memory",
      title: "Make it stick",
      summary: "One-line aha notes, spaced reviews and re-solving from scratch.",
      tags: ["review", "spaced repetition", "notes", "memory", "aha"],
      blocks: [
        {
          type: "text",
          text: "Solving once is not learning it. You learn it when you can rebuild it days later from a single cue.",
        },
        {
          type: "table",
          title: "The 1-line aha note",
          head: ["Bad note", "Good note"],
          rows: [
            ["Used a HashMap.", "Store `target - x` → index; one pass finds the partner."],
            ["Sliding window.", "Window grows right; shrink left when a char repeats; answer = max width."],
            ["Hard DP.", "`dp[i]` = best ending at i; either extend previous or start fresh."],
          ],
        },
        {
          type: "list",
          title: "W-Grind review rhythm",
          items: [
            "Solve today. Write the aha note.",
            "+4 days: review. Re-solve from a blank editor. Read the note only if stuck past 5 minutes.",
            "+7 days after that: review again. If it flowed, it is yours. If not, it goes back in the queue.",
            "Re-solve means a blank file. Reading old code is not a review.",
          ],
        },
        {
          type: "callout",
          tone: "key",
          text: "The aha note should be the trigger, not the solution. If you can rebuild the code from the note alone, the note is good.",
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Pick two problems you solved over a week ago (for example Two Sum and Valid Anagram). Re-solve each from a blank file with no peeking. Then rewrite their aha notes so they are one line each.",
        },
      ],
    },
    {
      id: "interview-day",
      title: "Interview-day checklist",
      summary: "Before, during and after. Fewer decisions on the day means more brain for the problem.",
      tags: ["interview", "checklist", "preparation", "day of"],
      blocks: [
        {
          type: "list",
          title: "Before (day before and morning)",
          items: [
            "No new topics the night before. Re-solve 2-3 favourite problems for confidence.",
            "Test camera, mic, editor, internet. Have paper and pen ready.",
            "Sleep, eat, water bottle on the desk. Take any usual medication as normal.",
            "Write the ritual on a sticky note: Input / N / Goal / Examples / Brute / Bottleneck.",
            "Join 5 minutes early. Do one long-exhale round.",
          ],
        },
        {
          type: "list",
          title: "During",
          items: [
            "Restate the problem and ask about edge cases before coding.",
            "Say the brute force and its complexity, then improve.",
            "Agree the approach with the interviewer before writing code.",
            "Code with clear names. Talk while you type.",
            "Test with your small examples, out loud, line by line.",
            "State the final time and space complexity.",
          ],
        },
        {
          type: "list",
          title: "After",
          items: [
            "Within an hour, write down the problems you got and where you stalled.",
            "Add them to W-Grind as new problems to train on.",
            "Do something kind for yourself. The result is out of your hands now.",
          ],
        },
        {
          type: "callout",
          tone: "drill",
          title: "Drill (15 min)",
          text: "Run a mock: pick Group Anagrams, set a 15-minute timer, and follow the During list in order out loud, ticking each item as you go.",
        },
      ],
    },
  ],
};
