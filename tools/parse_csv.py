import csv
import json
import re
import os

CSV_FILE = r"C:\Users\prati\.gemini\antigravity-ide\brain\deb4cf2c-9a24-492d-8341-f06602e3ea66\.system_generated\steps\99\content.md"
JSON_OUT = r"C:\Users\prati\Downloads\ANTIGRAVITY\Leetcode tracker\app\src\data\questions.json"

def clean_title(text):
    return text.strip()

def generate_url(title):
    # E.g., "Container With Most Water" -> "container-with-most-water"
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', title)
    return f"https://leetcode.com/problems/{clean.strip().lower().replace(' ', '-')}/"

def main():
    questions = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Find start of CSV
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("Pattern,Problems"):
            start_idx = i
            break
            
    csv_content = lines[start_idx:]
    reader = csv.reader(csv_content)
    next(reader) # skip header
    
    current_pattern = "Uncategorized"
    
    for row in reader:
        if not row:
            continue
            
        col1 = row[0].strip()
        col2 = row[1].strip() if len(row) > 1 else ""
        
        if not col2:
            # It's a pattern family
            # E.g., "I. Two Pointer Patterns" -> "Two Pointer Patterns"
            match = re.match(r'^(?:[IVX]+\.)?\s*(.*)', col1)
            if match:
                current_pattern = match.group(1).strip()
            else:
                current_pattern = col1
        else:
            # It's a subpattern
            # E.g., "Pattern 1: Converging : video" -> "Converging"
            subpattern = col1
            # Remove "Pattern X: "
            sub_match = re.match(r'^Pattern\s*\d+:\s*(.*?)(?:\s*:\s*video)?$', col1, re.IGNORECASE)
            if sub_match:
                subpattern = sub_match.group(1).strip()
            
            # Problems string: " 11. Container With Most Water, 15. 3Sum, ..."
            problems = col2.split(',')
            for p in problems:
                p = p.strip()
                if not p:
                    continue
                # E.g., "11. Container With Most Water"
                prob_match = re.match(r'^(\d+)\.\s*(.*)$', p)
                if prob_match:
                    prob_id = int(prob_match.group(1))
                    prob_title = prob_match.group(2).strip()
                    
                    # check if the problem is already in the list
                    if not any(q['id'] == prob_id for q in questions):
                        questions.append({
                            "id": prob_id,
                            "title": prob_title,
                            "url": generate_url(prob_title),
                            "pattern": current_pattern,
                            "subpattern": subpattern,
                            "difficulty": "Medium", # Default
                            "companies": [] # Default
                        })

    # Ensure output directory exists
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    
    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)

    print(f"Parsed {len(questions)} questions. Output written to {JSON_OUT}")

if __name__ == "__main__":
    main()
