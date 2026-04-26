#!/usr/bin/env python3
"""
Pull O*NET Database files, extract key datasets, and convert to clean CSVs.
O*NET 30.2 Database - Creative Commons licensed.
"""

import csv
import io
import os
import sys
import urllib.request
import zipfile
from pathlib import Path

# Configuration
ONET_VERSION = "30_2"
ONET_URL = f"https://www.onetcenter.org/dl_files/database/db_{ONET_VERSION}_text.zip"
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "onet"
ORCH_DIR = BASE_DIR / "orchestration" / "agent_m1"

# Key files we want from the zip
KEY_FILES = {
    "Task Statements.txt": "task_statements.csv",
    "Skills.txt": "skills.csv",
    "Work Activities.txt": "work_activities.csv",
    "Technology Skills.txt": "technology_skills.csv",
    "Occupation Data.txt": "occupation_data.csv",
}


def update_heartbeat(msg: str):
    """Write heartbeat status."""
    hb = ORCH_DIR / "heartbeat.txt"
    hb.parent.mkdir(parents=True, exist_ok=True)
    hb.write_text(msg)


def log(msg: str):
    """Append to log file."""
    log_file = ORCH_DIR / "log.md"
    with open(log_file, "a") as f:
        f.write(f"- {msg}\n")


def download_zip(url: str) -> bytes:
    """Download the O*NET database zip file."""
    print(f"Downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ONETDownloader/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    print(f"Downloaded {len(data) / 1024 / 1024:.1f} MB")
    return data


def tsv_to_csv(tsv_content: str) -> tuple[str, int]:
    """Convert tab-delimited text to CSV. Returns (csv_string, row_count)."""
    reader = csv.reader(io.StringIO(tsv_content), delimiter="\t")
    output = io.StringIO()
    writer = csv.writer(output)
    row_count = 0
    for row in reader:
        writer.writerow(row)
        row_count += 1
    return output.getvalue(), max(0, row_count - 1)  # subtract header


def extract_and_convert(zip_data: bytes) -> dict:
    """Extract key files from zip and convert to CSV."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    stats = {}

    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        # List all files to find the right paths (they're usually in a subdirectory)
        all_names = zf.namelist()
        print(f"Zip contains {len(all_names)} files")

        for onet_name, csv_name in KEY_FILES.items():
            # Find the file in the zip (may be in a subdirectory)
            matches = [n for n in all_names if n.endswith("/" + onet_name) or n == onet_name]
            if not matches:
                print(f"WARNING: {onet_name} not found in zip")
                log(f"WARNING: {onet_name} not found")
                continue

            zip_path = matches[0]
            print(f"Extracting {zip_path} -> {csv_name}")

            # Read and convert
            raw = zf.read(zip_path).decode("utf-8-sig")
            csv_content, row_count = tsv_to_csv(raw)

            # Also save the raw TSV
            raw_path = DATA_DIR / onet_name
            raw_path.write_text(raw)

            # Save CSV
            csv_path = DATA_DIR / csv_name
            csv_path.write_text(csv_content)

            stats[csv_name] = row_count
            print(f"  -> {row_count} rows")
            update_heartbeat(f"Extracted {csv_name}: {row_count} rows")
            log(f"Extracted {csv_name}: {row_count} rows")

    return stats


def compute_summary(stats: dict) -> str:
    """Generate a summary of the downloaded data."""
    # Count unique occupations from occupation_data.csv
    occ_file = DATA_DIR / "occupation_data.csv"
    occ_count = 0
    if occ_file.exists():
        with open(occ_file) as f:
            reader = csv.DictReader(f)
            occ_codes = set()
            for row in reader:
                code_col = next((k for k in row.keys() if "SOC" in k.upper() or "Code" in k), None)
                if code_col:
                    occ_codes.add(row[code_col])
            occ_count = len(occ_codes)

    # Count unique occupations in skills
    skills_file = DATA_DIR / "skills.csv"
    skills_occ_count = 0
    if skills_file.exists():
        with open(skills_file) as f:
            reader = csv.DictReader(f)
            occ_codes = set()
            for row in reader:
                code_col = next((k for k in row.keys() if "SOC" in k.upper() or "Code" in k), None)
                if code_col:
                    occ_codes.add(row[code_col])
            skills_occ_count = len(occ_codes)

    summary = f"""# O*NET Database Summary (v{ONET_VERSION.replace('_', '.')})

## Files Downloaded & Converted

| File | Rows |
|------|------|
"""
    for name, count in stats.items():
        summary += f"| {name} | {count:,} |\n"

    summary += f"""
## Key Statistics

- **Total occupations (Occupation Data):** {occ_count:,}
- **Occupations with skill ratings:** {skills_occ_count:,}
- **Task statements:** {stats.get('task_statements.csv', 0):,}
- **Skill ratings:** {stats.get('skills.csv', 0):,}
- **Work activity ratings:** {stats.get('work_activities.csv', 0):,}
- **Technology skill entries:** {stats.get('technology_skills.csv', 0):,}

## Data Location

All files saved to `data/onet/`
- Raw TSV files (original O*NET format)
- Clean CSV files (converted)
"""
    return summary


def main():
    update_heartbeat("DOWNLOADING")
    log("Starting O*NET download...")

    try:
        zip_data = download_zip(ONET_URL)
        log(f"Downloaded {len(zip_data) / 1024 / 1024:.1f} MB zip file")
        update_heartbeat("EXTRACTING")
    except Exception as e:
        log(f"ERROR downloading: {e}")
        print(f"Error downloading: {e}")
        # Try alternate version numbers
        for ver in ["30_1", "29_2", "29_1"]:
            alt_url = f"https://www.onetcenter.org/dl_files/database/db_{ver}_text.zip"
            print(f"Trying {alt_url} ...")
            try:
                zip_data = download_zip(alt_url)
                log(f"Downloaded {len(zip_data) / 1024 / 1024:.1f} MB zip from v{ver}")
                update_heartbeat("EXTRACTING")
                break
            except Exception as e2:
                log(f"Also failed v{ver}: {e2}")
                continue
        else:
            log("FATAL: Could not download any O*NET version")
            update_heartbeat("FAILED")
            sys.exit(1)

    stats = extract_and_convert(zip_data)
    log(f"Extraction complete. {len(stats)} files converted.")

    summary = compute_summary(stats)
    summary_path = DATA_DIR / "SUMMARY.md"
    summary_path.write_text(summary)
    print(summary)
    log("Summary written to data/onet/SUMMARY.md")

    update_heartbeat("DONE")
    log("All done!")


if __name__ == "__main__":
    main()
