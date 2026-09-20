import csv
import json
import os
import re

CSV_FILE = r"C:\Users\prati\.gemini\antigravity-ide\brain\deb4cf2c-9a24-492d-8341-f06602e3ea66\.system_generated\steps\202\content.md"
JSON_FILE = r"C:\Users\prati\Downloads\ANTIGRAVITY\Leetcode tracker\app\src\data\questions.json"

def normalize_url(url):
    return url.strip().rstrip('/')

def main():
    # 1. Read existing questions
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    # 2. Parse CSV and build mapping: normalized_url -> set(companies)
    url_to_companies = {}
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("problem_link,problem_name,company_name,num_occur"):
            start_idx = i
            break
            
    csv_content = lines[start_idx:]
    reader = csv.reader(csv_content)
    next(reader) # skip header
    
    for row in reader:
        if not row or len(row) < 3:
            continue
        link = normalize_url(row[0])
        company = row[2].strip()
        if company:
            if link not in url_to_companies:
                url_to_companies[link] = set()
            url_to_companies[link].add(company)
            
    # 3. Update questions
    updated_count = 0
    for q in questions:
        q_url = normalize_url(q['url'])
        if q_url in url_to_companies:
            q['companies'] = sorted(list(url_to_companies[q_url]))
            updated_count += 1
            
    # 4. Save back to questions.json
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)
        
    print(f"Updated {updated_count} questions with company tags.")

if __name__ == "__main__":
    main()
