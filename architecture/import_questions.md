# SOP: Import questions from the DSA workbook

## Goal
Regenerate the app's static question data from the master Excel workbook
(`DSA_500_LeetCode_Tracker_and_ADHD_Manual-*.xlsx`).

## Tool
`tools/import_xlsx.py` (needs `openpyxl`: `pip install openpyxl`)

```
python tools/import_xlsx.py "C:/path/to/DSA_500_LeetCode_Tracker_and_ADHD_Manual-v2.xlsx"
```

## Inputs (sheet names the tool expects)
- `1_Master_562_Tracker` — every problem; columns A–U (Q#, list flags, week, section, sub-topic, pattern, name, link, difficulty, …, trigger, linker)
- `3_Blind_75_Sheet`, `4_NeetCode_150_Sheet`, `5_Striver_SDE_180_Sheet` — curated lists; column E is the group/day, H the link
- `6_ADHD_Anti_Blank_Manual`, `7_Pattern_Recognition_Decoder`, `8_DSA_Element_Linker_Guide` — the Codex page

If a sheet is renamed, update the constants at the top of the tool first.

## Outputs
`app/src/data/questions.json`, `lists.json`, `manual.json`, `legacyIds.json` — schema in `gemini.md`.

## Rules & edge cases (learned)
- **Natural key = LeetCode slug** from the URL. The master sheet lists 41 problems twice (e.g. LRU Cache under two sections); they are stored once, with the extra sub-topic kept in `also`. 562 rows → 519 unique problems.
- The Striver tab has 191 rows but repeats problems across days → 171 unique items.
- List membership comes from the list tabs, not the master's Yes/No flags.
- Missing title, non-LeetCode URL, or unknown difficulty → the tool raises. Never write blank rows.
- Re-running is idempotent. `legacyIds.json` (old numeric id → slug) is computed only from the pre-2026 numeric-id `questions.json`; later runs keep the existing map.
- Do not hand-edit the generated JSON. Fix the workbook or the tool and re-run.
