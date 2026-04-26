#!/usr/bin/env python3
"""
Build Unified Crosswalk Database (M5)
Combines all crosswalk data into a single queryable SQLite database.
"""

import csv
import json
import os
import sqlite3
import sys
from pathlib import Path

# Paths
BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
CROSSWALKS = DATA / "crosswalks"
ONET = DATA / "onet"
SOB = BASE.parent / "son-of-a-bridge" / "data"
DB_PATH = CROSSWALKS / "unified_crosswalk.db"


def create_tables(cur):
    cur.executescript("""
        DROP TABLE IF EXISTS isco_occupations;
        DROP TABLE IF EXISTS soc_isco_map;
        DROP TABLE IF EXISTS automation_scores;
        DROP TABLE IF EXISTS esco_skills;
        DROP TABLE IF EXISTS onet_tasks;
        DROP TABLE IF EXISTS onet_skills;
        DROP TABLE IF EXISTS onet_work_activities;
        DROP VIEW IF EXISTS v_occupation_full;
        DROP VIEW IF EXISTS v_occupation_skills;
        DROP VIEW IF EXISTS v_task_composition;

        CREATE TABLE isco_occupations (
            isco08_code TEXT PRIMARY KEY,
            title TEXT,
            level INTEGER,
            parent_code TEXT
        );

        CREATE TABLE soc_isco_map (
            soc_code TEXT,
            soc_title TEXT,
            isco08_code TEXT,
            mapping_type TEXT
        );

        CREATE TABLE automation_scores (
            isco08_code TEXT PRIMARY KEY,
            automation_probability REAL,
            source_soc_codes TEXT,
            mapping_confidence TEXT
        );

        CREATE TABLE esco_skills (
            isco08_code TEXT,
            skill_uri TEXT,
            skill_label TEXT,
            skill_type TEXT
        );

        CREATE TABLE onet_tasks (
            soc_code TEXT,
            isco08_code TEXT,
            task_id TEXT,
            task_description TEXT,
            task_type TEXT
        );

        CREATE TABLE onet_skills (
            soc_code TEXT,
            isco08_code TEXT,
            skill_name TEXT,
            importance REAL,
            level REAL
        );

        CREATE TABLE onet_work_activities (
            soc_code TEXT,
            isco08_code TEXT,
            activity_name TEXT,
            importance REAL,
            level REAL
        );
    """)


def create_indexes(cur):
    cur.executescript("""
        CREATE INDEX idx_soc_isco_map_isco ON soc_isco_map(isco08_code);
        CREATE INDEX idx_soc_isco_map_soc ON soc_isco_map(soc_code);
        CREATE INDEX idx_esco_skills_isco ON esco_skills(isco08_code);
        CREATE INDEX idx_onet_tasks_isco ON onet_tasks(isco08_code);
        CREATE INDEX idx_onet_tasks_soc ON onet_tasks(soc_code);
        CREATE INDEX idx_onet_skills_isco ON onet_skills(isco08_code);
        CREATE INDEX idx_onet_skills_soc ON onet_skills(soc_code);
        CREATE INDEX idx_onet_wa_isco ON onet_work_activities(isco08_code);
        CREATE INDEX idx_onet_wa_soc ON onet_work_activities(soc_code);
    """)


def create_views(cur):
    cur.executescript("""
        CREATE VIEW v_occupation_full AS
        SELECT o.isco08_code, o.title, o.level, o.parent_code,
               a.automation_probability, a.source_soc_codes, a.mapping_confidence
        FROM isco_occupations o
        LEFT JOIN automation_scores a ON o.isco08_code = a.isco08_code;

        CREATE VIEW v_occupation_skills AS
        SELECT o.isco08_code, o.title, o.level,
               a.automation_probability,
               e.skill_uri, e.skill_label, e.skill_type
        FROM isco_occupations o
        LEFT JOIN automation_scores a ON o.isco08_code = a.isco08_code
        LEFT JOIN esco_skills e ON o.isco08_code = e.isco08_code;

        CREATE VIEW v_task_composition AS
        SELECT
            wa.isco08_code,
            ROUND(AVG(CASE WHEN wa.activity_name IN (
                'Controlling Machines and Processes',
                'Operating Vehicles, Mechanized Devices, or Equipment',
                'Handling and Moving Objects',
                'Performing General Physical Activities',
                'Inspecting Equipment, Structures, or Materials'
            ) THEN wa.importance END), 2) AS routine_manual,
            ROUND(AVG(CASE WHEN wa.activity_name IN (
                'Getting Information',
                'Processing Information',
                'Evaluating Information to Determine Compliance with Standards',
                'Documenting/Recording Information',
                'Estimating the Quantifiable Characteristics of Products, Events, or Information'
            ) THEN wa.importance END), 2) AS routine_cognitive,
            ROUND(AVG(CASE WHEN wa.activity_name IN (
                'Repairing and Maintaining Mechanical Equipment',
                'Repairing and Maintaining Electronic Equipment',
                'Drafting, Laying Out, and Specifying Technical Devices, Parts, and Equipment',
                'Monitor Processes, Materials, or Surroundings'
            ) THEN wa.importance END), 2) AS nonroutine_manual,
            ROUND(AVG(CASE WHEN wa.activity_name IN (
                'Thinking Creatively',
                'Developing Objectives and Strategies',
                'Making Decisions and Solving Problems',
                'Analyzing Data or Information',
                'Interpreting the Meaning of Information for Others',
                'Updating and Using Relevant Knowledge',
                'Judging the Qualities of Objects, Services, or People'
            ) THEN wa.importance END), 2) AS nonroutine_cognitive,
            ROUND(AVG(CASE WHEN wa.activity_name IN (
                'Communicating with Supervisors, Peers, or Subordinates',
                'Communicating with People Outside the Organization',
                'Establishing and Maintaining Interpersonal Relationships',
                'Assisting and Caring for Others',
                'Selling or Influencing Others',
                'Resolving Conflicts and Negotiating with Others',
                'Coordinating the Work and Activities of Others',
                'Training and Teaching Others',
                'Coaching and Developing Others',
                'Guiding, Directing, and Motivating Subordinates'
            ) THEN wa.importance END), 2) AS social
        FROM onet_work_activities wa
        GROUP BY wa.isco08_code;
    """)


def build_soc_to_isco_lookup(cur):
    """Build a dict: soc_code (6-digit) -> list of isco08_codes from loaded soc_isco_map."""
    cur.execute("SELECT soc_code, isco08_code FROM soc_isco_map")
    lookup = {}
    for soc, isco in cur.fetchall():
        lookup.setdefault(soc, []).append(isco)
    return lookup


def load_isco_occupations(cur):
    path = SOB / "ilo_isco08" / "isco08_occupations.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            code = r["code"].strip()
            level = int(r.get("level", len(code)))
            parent = code[:-1] if len(code) > 1 else None
            rows.append((code, r["title"].strip(), level, parent))
    cur.executemany("INSERT INTO isco_occupations VALUES (?,?,?,?)", rows)
    print(f"  isco_occupations: {len(rows)} rows")
    return len(rows)


def load_soc_isco_map(cur):
    path = CROSSWALKS / "soc_isco_crosswalk.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append((
                r["soc_code"].strip(),
                r["soc_title"].strip(),
                r["isco08_code"].strip(),
                r.get("mapping_type", "").strip()
            ))
    cur.executemany("INSERT INTO soc_isco_map VALUES (?,?,?,?)", rows)
    print(f"  soc_isco_map: {len(rows)} rows")
    return len(rows)


def load_automation_scores(cur):
    path = CROSSWALKS / "frey_osborne_isco.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append((
                r["isco08_code"].strip(),
                float(r["automation_probability"]),
                r.get("source_soc_codes", "").strip(),
                r.get("mapping_confidence", "").strip()
            ))
    cur.executemany("INSERT OR REPLACE INTO automation_scores VALUES (?,?,?,?)", rows)
    print(f"  automation_scores: {len(rows)} rows")
    return len(rows)


def load_esco_skills(cur):
    path = CROSSWALKS / "esco_skills_flat.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append((
                r["isco08_code"].strip(),
                r["skill_uri"].strip(),
                r["skill_label"].strip(),
                r["skill_type"].strip()
            ))
    cur.executemany("INSERT INTO esco_skills VALUES (?,?,?,?)", rows)
    print(f"  esco_skills: {len(rows)} rows")
    return len(rows)


def load_onet_tasks(cur, soc_to_isco):
    path = ONET / "task_statements.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            soc_full = r["O*NET-SOC Code"].strip()
            soc6 = soc_full[:7]  # e.g. "11-1011"
            task_id = r["Task ID"].strip()
            desc = r["Task"].strip()
            ttype = r.get("Task Type", "").strip()
            isco_codes = soc_to_isco.get(soc6, [None])
            for isco in isco_codes:
                rows.append((soc6, isco, task_id, desc, ttype))
    cur.executemany("INSERT INTO onet_tasks VALUES (?,?,?,?,?)", rows)
    print(f"  onet_tasks: {len(rows)} rows")
    return len(rows)


def load_onet_skills(cur, soc_to_isco):
    path = ONET / "skills.csv"
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("Scale ID", "").strip() != "IM":
                continue  # Only importance scale
            soc_full = r["O*NET-SOC Code"].strip()
            soc6 = soc_full[:7]
            skill_name = r["Element Name"].strip()
            importance = float(r["Data Value"])
            # Get level from next row — we'll handle it by collecting both scales
            isco_codes = soc_to_isco.get(soc6, [None])
            for isco in isco_codes:
                rows.append((soc6, isco, skill_name, importance, None))
    # Now update levels
    level_map = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("Scale ID", "").strip() != "LV":
                continue
            soc_full = r["O*NET-SOC Code"].strip()
            soc6 = soc_full[:7]
            skill_name = r["Element Name"].strip()
            level_map[(soc6, skill_name)] = float(r["Data Value"])

    # Rebuild with levels
    rows_with_level = []
    for soc, isco, skill, imp, _ in rows:
        lv = level_map.get((soc, skill))
        rows_with_level.append((soc, isco, skill, imp, lv))

    cur.executemany("INSERT INTO onet_skills VALUES (?,?,?,?,?)", rows_with_level)
    print(f"  onet_skills: {len(rows_with_level)} rows")
    return len(rows_with_level)


def load_onet_work_activities(cur, soc_to_isco):
    path = ONET / "work_activities.csv"
    # Collect importance and level per (soc, activity)
    importance_map = {}
    level_map = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            soc_full = r["O*NET-SOC Code"].strip()
            soc6 = soc_full[:7]
            name = r["Element Name"].strip()
            scale = r.get("Scale ID", "").strip()
            val = float(r["Data Value"])
            key = (soc6, name)
            if scale == "IM":
                importance_map[key] = val
            elif scale == "LV":
                level_map[key] = val

    rows = []
    for (soc6, name), imp in importance_map.items():
        lv = level_map.get((soc6, name))
        isco_codes = soc_to_isco.get(soc6, [None])
        for isco in isco_codes:
            rows.append((soc6, isco, name, imp, lv))

    cur.executemany("INSERT INTO onet_work_activities VALUES (?,?,?,?,?)", rows)
    print(f"  onet_work_activities: {len(rows)} rows")
    return len(rows)


def test_query_7422(cur):
    print("\n" + "=" * 60)
    print("TEST QUERY: ISCO 7422 (Printers)")
    print("=" * 60)

    # Automation score
    cur.execute("SELECT * FROM v_occupation_full WHERE isco08_code = '7422'")
    row = cur.fetchone()
    if row:
        cols = [d[0] for d in cur.description]
        print(f"\n--- Occupation & Automation ---")
        for c, v in zip(cols, row):
            print(f"  {c}: {v}")

    # ESCO skills
    cur.execute("SELECT skill_label, skill_type FROM esco_skills WHERE isco08_code = '7422'")
    skills = cur.fetchall()
    print(f"\n--- ESCO Skills ({len(skills)}) ---")
    for label, stype in skills[:10]:
        print(f"  [{stype}] {label}")
    if len(skills) > 10:
        print(f"  ... and {len(skills) - 10} more")

    # O*NET tasks (via linked SOC codes)
    cur.execute("SELECT DISTINCT task_description, task_type FROM onet_tasks WHERE isco08_code = '7422' LIMIT 10")
    tasks = cur.fetchall()
    print(f"\n--- O*NET Tasks (showing up to 10) ---")
    for desc, ttype in tasks:
        print(f"  [{ttype}] {desc[:80]}...")

    # Task composition
    cur.execute("SELECT * FROM v_task_composition WHERE isco08_code = '7422'")
    row = cur.fetchone()
    if row:
        cols = [d[0] for d in cur.description]
        print(f"\n--- Task Composition ---")
        for c, v in zip(cols, row):
            print(f"  {c}: {v}")

    print()


def print_summary(cur):
    print("\n" + "=" * 60)
    print("DATABASE SUMMARY")
    print("=" * 60)
    tables = [
        "isco_occupations", "soc_isco_map", "automation_scores",
        "esco_skills", "onet_tasks", "onet_skills", "onet_work_activities"
    ]
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t}: {cur.fetchone()[0]:,} rows")

    # Coverage
    cur.execute("SELECT COUNT(DISTINCT isco08_code) FROM isco_occupations")
    total_isco = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT isco08_code) FROM automation_scores")
    auto_isco = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT isco08_code) FROM esco_skills")
    esco_isco = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT isco08_code) FROM onet_tasks WHERE isco08_code IS NOT NULL")
    onet_isco = cur.fetchone()[0]

    print(f"\n  ISCO Coverage:")
    print(f"    Total ISCO codes: {total_isco}")
    print(f"    With automation scores: {auto_isco} ({100*auto_isco/total_isco:.1f}%)")
    print(f"    With ESCO skills: {esco_isco} ({100*esco_isco/total_isco:.1f}%)")
    print(f"    With O*NET tasks: {onet_isco} ({100*onet_isco/total_isco:.1f}%)")


def main():
    print(f"Building unified crosswalk database at {DB_PATH}")
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA synchronous=NORMAL")

    print("\n[1/9] Creating tables...")
    create_tables(cur)
    conn.commit()

    print("[2/9] Loading ISCO occupations...")
    load_isco_occupations(cur)
    conn.commit()

    print("[3/9] Loading SOC↔ISCO crosswalk...")
    load_soc_isco_map(cur)
    conn.commit()

    # Build lookup for O*NET linking
    soc_to_isco = build_soc_to_isco_lookup(cur)

    print("[4/9] Loading automation scores...")
    load_automation_scores(cur)
    conn.commit()

    print("[5/9] Loading ESCO skills...")
    load_esco_skills(cur)
    conn.commit()

    print("[6/9] Loading O*NET tasks...")
    load_onet_tasks(cur, soc_to_isco)
    conn.commit()

    print("[7/9] Loading O*NET skills...")
    load_onet_skills(cur, soc_to_isco)
    conn.commit()

    print("[8/9] Loading O*NET work activities...")
    load_onet_work_activities(cur, soc_to_isco)
    conn.commit()

    print("[9/9] Creating indexes and views...")
    create_indexes(cur)
    create_views(cur)
    conn.commit()

    print_summary(cur)
    test_query_7422(cur)

    conn.close()
    print(f"✅ Database written to {DB_PATH}")
    print(f"   Size: {DB_PATH.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
