"""
Karnataka CET PDF Cutoff Parser
Usage: python3 scripts/parse_pdf.py <pdf_path> <year> <round> <course> [seat_type]
Example: python3 scripts/parse_pdf.py PDF/Engineering/round2.pdf 2025 2 engineering ROK

course:    engineering | bsc | veterinary | pharmacy (must match folder name in public/data/)
seat_type: ROK (Rest of Karnataka), HK (Hyderabad-Karnataka), etc. Default: ROK
"""

import pdfplumber
import json
import re
import sys
import os

CATEGORIES = [
    '1G', '1K', '1R',
    '2AG', '2AK', '2AR',
    '2BG', '2BK', '2BR',
    '3AG', '3AK', '3AR',
    '3BG', '3BK', '3BR',
    'GM', 'GMK', 'GMP', 'GMR',
    'NRI', 'OPN', 'OTH',
    'SCG', 'SCK', 'SCR',
    'STG', 'STK', 'STR',
]

# 2025 format: "College: (E001)Name" or "College: E001 Name"
COLLEGE_RE_2025 = re.compile(r'College:\s*\(?(E\d+)\)?\s*(.*)', re.IGNORECASE)
# 2022-2024 format: "1 E001 Name" (serial number then code then name)
COLLEGE_RE_OLD  = re.compile(r'^\s*\d+\s+(E\d+)\s+(.*)')

# Branch abbreviation prefix in 2022-2024 format (e.g. "AI Artificial Intelligence" → "Artificial Intelligence")
BRANCH_ABBREV_RE = re.compile(r'^[A-Z]{2,3}\s+')


def parse_rank(val):
    if not val:
        return None
    s = str(val).strip()
    if s in ('--', '-', '—', '', 'N/A', 'NA'):
        return None
    try:
        f = float(s.replace(',', ''))
        return int(f) if f == int(f) else f
    except (ValueError, TypeError):
        return None


def extract_colleges_from_text(text):
    """Return list of {code, name} dicts found in page text (handles 2022-2025 formats)."""
    colleges = []
    for line in text.split('\n'):
        line = line.strip()
        m = COLLEGE_RE_2025.match(line)
        if m:
            colleges.append({'code': m.group(1).strip(), 'name': m.group(2).strip()})
            continue
        m = COLLEGE_RE_OLD.match(line)
        if m:
            colleges.append({'code': m.group(1).strip(), 'name': m.group(2).strip()})
    return colleges


def clean_branch(raw):
    """Normalise branch name: remove 2-3 letter abbreviation prefix used in 2022-2024 PDFs."""
    branch = str(raw).strip().replace('\n', ' ')
    branch = BRANCH_ABBREV_RE.sub('', branch).strip()
    return branch.upper()


def parse_pdf(pdf_path, year, round_num, seat_type='ROK'):
    records = []

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f'  Pages: {total}')

        for page_num, page in enumerate(pdf.pages, 1):
            if page_num % 20 == 0:
                print(f'  Page {page_num}/{total}...')

            text = page.extract_text() or ''
            colleges = extract_colleges_from_text(text)
            tables = page.extract_tables()

            for table_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue

                college = colleges[table_idx] if table_idx < len(colleges) else {
                    'code': f'UNK_P{page_num}T{table_idx}',
                    'name': 'Unknown',
                }

                header = table[0]

                # Map category name → column index
                col_map = {}
                for j, cell in enumerate(header):
                    if cell and str(cell).strip() in CATEGORIES:
                        col_map[str(cell).strip()] = j

                if not col_map:
                    continue  # not a data table

                for row in table[1:]:
                    if not row or not row[0]:
                        continue
                    course = clean_branch(row[0])
                    if not course or course.lower() in ('course name', 'course\nname'):
                        continue

                    record = {
                        'year': year,
                        'round': round_num,
                        'seat_type': seat_type,
                        'college_code': college['code'],
                        'college_name': college['name'],
                        'branch': course,
                    }
                    for cat in CATEGORIES:
                        if cat in col_map:
                            idx = col_map[cat]
                            record[cat] = parse_rank(row[idx] if idx < len(row) else None)
                        else:
                            record[cat] = None

                    records.append(record)

    return records


def update_manifest(data_dir, entry):
    path = os.path.join(data_dir, 'manifest.json')
    manifest = []
    if os.path.exists(path):
        with open(path) as f:
            manifest = json.load(f)
    manifest = [m for m in manifest if m['file'] != entry['file']]
    manifest.append(entry)
    manifest.sort(key=lambda x: (x['year'], x['round']))
    with open(path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f'  Manifest updated → {path}')


if __name__ == '__main__':
    if len(sys.argv) < 5:
        print(__doc__)
        sys.exit(1)

    pdf_path  = os.path.expanduser(sys.argv[1])
    year      = int(sys.argv[2])
    round_num = int(sys.argv[3])
    course    = sys.argv[4].lower()
    seat_type = sys.argv[5] if len(sys.argv) > 5 else 'ROK'

    if not os.path.exists(pdf_path):
        print(f'Error: file not found: {pdf_path}')
        sys.exit(1)

    print(f'Parsing: {os.path.basename(pdf_path)}')
    print(f'  Year: {year}  Round: {round_num}  Course: {course}  Seat type: {seat_type}')

    records = parse_pdf(pdf_path, year, round_num, seat_type)

    file_name  = f'{year}_round{round_num}_{seat_type.lower()}.json'
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir   = os.path.join(script_dir, '..', 'public', 'data', course)
    os.makedirs(data_dir, exist_ok=True)

    out_path = os.path.join(data_dir, file_name)
    with open(out_path, 'w') as f:
        json.dump(records, f)

    print(f'Done! {len(records)} records → {out_path}')

    update_manifest(data_dir, {
        'file': file_name,
        'year': year,
        'round': round_num,
        'seat_type': seat_type,
        'label': f'{year} Round {round_num} — {seat_type}',
        'record_count': len(records),
    })
