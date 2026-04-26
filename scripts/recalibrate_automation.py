#!/usr/bin/env python3
"""
M6: LMIC Automation Recalibration Using O*NET Task Data

Recalibrates Frey & Osborne automation probabilities using task-level
composition from O*NET work activities, adjusted for LMIC contexts.
"""

import csv
import json
import os
from collections import defaultdict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Activity → Category mapping ──────────────────────────────────────────────
ACTIVITY_CATEGORIES = {
    # routine_manual
    "Controlling Machines and Processes": "routine_manual",
    "Operating Vehicles, Mechanized Devices, or Equipment": "routine_manual",
    "Handling and Moving Objects": "routine_manual",
    "Drafting, Laying Out, and Specifying Technical Devices, Parts, and Equipment": "routine_manual",

    # routine_cognitive
    "Processing Information": "routine_cognitive",
    "Documenting/Recording Information": "routine_cognitive",
    "Evaluating Information to Determine Compliance with Standards": "routine_cognitive",
    "Getting Information": "routine_cognitive",
    "Monitoring Processes, Materials, or Surroundings": "routine_cognitive",
    "Working with Computers": "routine_cognitive",
    "Performing Administrative Activities": "routine_cognitive",
    "Estimating the Quantifiable Characteristics of Products, Events, or Information": "routine_cognitive",
    "Scheduling Work and Activities": "routine_cognitive",
    "Monitoring and Controlling Resources": "routine_cognitive",
    "Identifying Objects, Actions, and Events": "routine_cognitive",
    "Updating and Using Relevant Knowledge": "routine_cognitive",

    # nonroutine_manual
    "Performing General Physical Activities": "nonroutine_manual",
    "Repairing and Maintaining Mechanical Equipment": "nonroutine_manual",
    "Repairing and Maintaining Electronic Equipment": "nonroutine_manual",
    "Inspecting Equipment, Structures, or Materials": "nonroutine_manual",

    # nonroutine_cognitive
    "Analyzing Data or Information": "nonroutine_cognitive",
    "Making Decisions and Solving Problems": "nonroutine_cognitive",
    "Thinking Creatively": "nonroutine_cognitive",
    "Developing Objectives and Strategies": "nonroutine_cognitive",
    "Organizing, Planning, and Prioritizing Work": "nonroutine_cognitive",
    "Interpreting the Meaning of Information for Others": "nonroutine_cognitive",
    "Judging the Qualities of Objects, Services, or People": "nonroutine_cognitive",
    "Providing Consultation and Advice to Others": "nonroutine_cognitive",

    # social
    "Communicating with People Outside the Organization": "social",
    "Communicating with Supervisors, Peers, or Subordinates": "social",
    "Establishing and Maintaining Interpersonal Relationships": "social",
    "Assisting and Caring for Others": "social",
    "Resolving Conflicts and Negotiating with Others": "social",
    "Training and Teaching Others": "social",
    "Coaching and Developing Others": "social",
    "Performing for or Working Directly with the Public": "social",
    "Selling or Influencing Others": "social",
    "Coordinating the Work and Activities of Others": "social",
    "Guiding, Directing, and Motivating Subordinates": "social",
    "Developing and Building Teams": "social",
    "Staffing Organizational Units": "social",
}

CATEGORIES = ["routine_manual", "routine_cognitive", "nonroutine_manual", "nonroutine_cognitive", "social"]

CATEGORY_LABELS = {
    "routine_manual": "routine manual",
    "routine_cognitive": "routine cognitive",
    "nonroutine_manual": "non-routine manual",
    "nonroutine_cognitive": "non-routine cognitive",
    "social": "social/interpersonal",
}

# Country calibration factors
COUNTRIES = {
    "NGA": {"name": "Nigeria", "calibration": 0.67},
    "GHA": {"name": "Ghana", "calibration": 0.65},
    "KEN": {"name": "Kenya", "calibration": 0.63},
    "IND": {"name": "India", "calibration": 0.60},
    "RWA": {"name": "Rwanda", "calibration": 0.62},
}

# LMIC task risk multipliers (applied to original F&O probability)
def get_task_risk_multipliers(country_cal):
    return {
        "routine_manual": country_cal * 0.85,
        "routine_cognitive": 0.95,
        "nonroutine_manual": country_cal * 0.5,
        "nonroutine_cognitive": 0.3,
        "social": 0.15,
    }


def load_work_activities():
    """Load O*NET work activities, filtering to Importance (IM) scale only."""
    soc_activities = defaultdict(list)
    path = BASE_DIR / "data" / "onet" / "work_activities.csv"
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["Scale ID"] != "IM":
                continue
            soc = row["O*NET-SOC Code"].split(".")[0]  # strip detailed suffix → base SOC
            name = row["Element Name"]
            try:
                importance = float(row["Data Value"])
            except (ValueError, KeyError):
                continue
            category = ACTIVITY_CATEGORIES.get(name)
            if category:
                soc_activities[soc].append({
                    "name": name,
                    "category": category,
                    "importance": importance,
                })
    return soc_activities


def load_task_statements():
    """Load top task statements per SOC for display purposes."""
    soc_tasks = defaultdict(list)
    path = BASE_DIR / "data" / "onet" / "task_statements.csv"
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            soc = row["O*NET-SOC Code"].split(".")[0]
            task_type = row.get("Task Type", "")
            soc_tasks[soc].append({
                "task": row["Task"],
                "type": task_type,
            })
    return soc_tasks


def load_crosswalk():
    """Load SOC → ISCO crosswalk. Returns dict: isco_code → list of SOC codes + title."""
    isco_to_soc = defaultdict(lambda: {"soc_codes": [], "title": ""})
    path = BASE_DIR / "data" / "crosswalks" / "soc_isco_crosswalk.csv"
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            isco = row["isco08_code"].strip()
            soc = row["soc_code"].strip()
            title = row["isco08_title"].strip()
            entry = isco_to_soc[isco]
            if soc not in entry["soc_codes"]:
                entry["soc_codes"].append(soc)
            entry["title"] = title
    return dict(isco_to_soc)


def load_frey_osborne():
    """Load Frey & Osborne automation probabilities by ISCO code."""
    fo = {}
    path = BASE_DIR / "data" / "crosswalks" / "frey_osborne_isco.csv"
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            isco = row["isco08_code"].strip()
            try:
                prob = float(row["automation_probability"])
            except (ValueError, KeyError):
                continue
            fo[isco] = {
                "probability": prob,
                "title": row["isco08_title"].strip(),
            }
    return fo


def load_priority_occupations():
    """Load the 19 priority ISCO codes from NGA occupation_lookup.json."""
    path = BASE_DIR / "data" / "nga" / "occupation_lookup.json"
    with open(path) as f:
        data = json.load(f)
    return {str(occ["isco08"]): occ for occ in data["occupation_lookup"]}


def compute_task_composition(soc_activities, isco_to_soc, soc_tasks):
    """Compute normalized task composition per ISCO code."""
    task_comp = {}

    for isco, mapping in isco_to_soc.items():
        soc_codes = mapping["soc_codes"]
        title = mapping["title"]

        # Aggregate activities across all mapped SOC codes
        cat_weights = defaultdict(float)
        cat_counts = defaultdict(int)

        for soc in soc_codes:
            # Try exact match first, then try stripping detailed codes
            activities = soc_activities.get(soc, [])
            if not activities:
                # Try variations: some SOC codes might have different formats
                for key in soc_activities:
                    if key.startswith(soc[:5]):
                        activities = soc_activities[key]
                        break

            for act in activities:
                cat_weights[act["category"]] += act["importance"]
                cat_counts[act["category"]] += 1

        if not cat_weights:
            continue

        # Average importance across SOC codes, then normalize
        cat_avg = {}
        for cat in CATEGORIES:
            if cat_counts[cat] > 0:
                cat_avg[cat] = cat_weights[cat] / cat_counts[cat]
            else:
                cat_avg[cat] = 0.0

        total = sum(cat_avg.values())
        if total == 0:
            continue

        composition = {cat: round(cat_avg[cat] / total, 4) for cat in CATEGORIES}

        # Get top tasks
        top_tasks = []
        for soc in soc_codes:
            tasks = soc_tasks.get(soc, [])
            if not tasks:
                for key in soc_tasks:
                    if key.startswith(soc[:5]):
                        tasks = soc_tasks[key]
                        break
            for t in tasks:
                if t["type"] == "Core" and t["task"] not in top_tasks:
                    top_tasks.append(t["task"])
                    if len(top_tasks) >= 5:
                        break
            if len(top_tasks) >= 5:
                break

        # If no core tasks, take any
        if not top_tasks:
            for soc in soc_codes:
                for t in soc_tasks.get(soc, []):
                    if t["task"] not in top_tasks:
                        top_tasks.append(t["task"])
                        if len(top_tasks) >= 5:
                            break
                if len(top_tasks) >= 5:
                    break

        task_comp[isco] = {
            "isco_title": title,
            "task_composition": composition,
            "top_tasks": top_tasks[:5],
        }

    return task_comp


def classify_risk_tier(prob):
    if prob < 0.30:
        return "low"
    elif prob < 0.70:
        return "medium"
    else:
        return "high"


def generate_narrative(composition, task_risk_breakdown, country_name, title):
    """Generate human-readable narrative for an occupation."""
    # Find highest composition category
    highest_cat = max(composition, key=composition.get)
    highest_share = composition[highest_cat]

    # Find highest risk category
    highest_risk_cat = max(task_risk_breakdown, key=lambda c: task_risk_breakdown[c]["risk"])
    highest_risk = task_risk_breakdown[highest_risk_cat]["risk"]
    highest_risk_share = task_risk_breakdown[highest_risk_cat]["share"]

    # Determine durability of the dominant category
    durable_cats = {"nonroutine_manual", "nonroutine_cognitive", "social"}
    at_risk_cats = {"routine_manual", "routine_cognitive"}

    durability = "highly durable" if highest_cat in durable_cats else "at risk"

    narrative = (
        f"The {CATEGORY_LABELS[highest_cat]} work that dominates this role "
        f"({round(highest_share * 100)}%) is {durability} in the {country_name} context. "
        f"The main automation pressure comes from {CATEGORY_LABELS[highest_risk_cat]} tasks "
        f"({round(highest_risk * 100)}% risk, {round(highest_risk_share * 100)}% of the role)."
    )
    return narrative


def recalibrate_for_country(iso3, country_info, task_comp, frey_osborne, priority_iscos):
    """Compute recalibrated automation for a single country."""
    cal = country_info["calibration"]
    multipliers = get_task_risk_multipliers(cal)
    country_name = country_info["name"]

    occupations = []
    priority_set = set(priority_iscos.keys())

    # Process all ISCO codes that have both task composition and F&O scores
    for isco, fo_data in frey_osborne.items():
        if isco not in task_comp:
            continue

        comp = task_comp[isco]
        composition = comp["task_composition"]
        original_prob = fo_data["probability"]
        title = fo_data["title"]

        # Compute recalibrated probability as weighted sum
        task_risk_breakdown = {}
        recalibrated = 0.0

        for cat in CATEGORIES:
            share = composition.get(cat, 0.0)
            # Risk for this category = original probability * category multiplier
            cat_risk = original_prob * multipliers[cat]
            # Clamp to [0, 1]
            cat_risk = min(max(cat_risk, 0.0), 1.0)

            task_risk_breakdown[cat] = {
                "share": round(share, 4),
                "risk": round(cat_risk, 4),
            }

            # Weighted contribution to overall recalibrated probability
            recalibrated += share * cat_risk

        recalibrated = round(min(max(recalibrated, 0.0), 1.0), 4)
        risk_tier = classify_risk_tier(recalibrated)

        narrative = generate_narrative(composition, task_risk_breakdown, country_name, title)

        occ_entry = {
            "isco08": isco,
            "title": title,
            "original_frey_osborne": round(original_prob, 4),
            "recalibrated_probability": recalibrated,
            "risk_tier": risk_tier,
            "task_risk_breakdown": task_risk_breakdown,
            "narrative": narrative,
            "is_priority": isco in priority_set,
        }
        occupations.append(occ_entry)

    # Also handle priority occupations that might not have F&O scores
    for isco, prio_data in priority_iscos.items():
        if any(o["isco08"] == isco for o in occupations):
            continue
        if isco not in task_comp:
            continue

        comp = task_comp[isco]
        composition = comp["task_composition"]
        original_prob = prio_data.get("automation_prob")

        if original_prob is None:
            # Use sector median or skip
            continue

        title = prio_data["title"]
        task_risk_breakdown = {}
        recalibrated = 0.0

        for cat in CATEGORIES:
            share = composition.get(cat, 0.0)
            cat_risk = original_prob * multipliers[cat]
            cat_risk = min(max(cat_risk, 0.0), 1.0)
            task_risk_breakdown[cat] = {
                "share": round(share, 4),
                "risk": round(cat_risk, 4),
            }
            recalibrated += share * cat_risk

        recalibrated = round(min(max(recalibrated, 0.0), 1.0), 4)
        risk_tier = classify_risk_tier(recalibrated)
        narrative = generate_narrative(composition, task_risk_breakdown, country_name, title)

        occupations.append({
            "isco08": isco,
            "title": title,
            "original_frey_osborne": round(original_prob, 4),
            "recalibrated_probability": recalibrated,
            "risk_tier": risk_tier,
            "task_risk_breakdown": task_risk_breakdown,
            "narrative": narrative,
            "is_priority": True,
        })

    # Sort: priority occupations first, then by recalibrated probability descending
    occupations.sort(key=lambda x: (not x["is_priority"], -x["recalibrated_probability"]))

    return {
        "country": iso3,
        "country_name": country_name,
        "calibration_factor": cal,
        "methodology": (
            "Task-level recalibration of Frey & Osborne (2017) automation probabilities. "
            "O*NET work activities mapped to 5 task categories (routine manual, routine cognitive, "
            "non-routine manual, non-routine cognitive, social). Each category receives a "
            "context-adjusted risk multiplier reflecting LMIC automation adoption rates, "
            "capital investment levels, and informal economy prevalence."
        ),
        "total_occupations": len(occupations),
        "risk_distribution": {
            "low": sum(1 for o in occupations if o["risk_tier"] == "low"),
            "medium": sum(1 for o in occupations if o["risk_tier"] == "medium"),
            "high": sum(1 for o in occupations if o["risk_tier"] == "high"),
        },
        "occupations": occupations,
    }


def main():
    print("Loading O*NET work activities...")
    soc_activities = load_work_activities()
    print(f"  Loaded activities for {len(soc_activities)} SOC codes")

    print("Loading task statements...")
    soc_tasks = load_task_statements()
    print(f"  Loaded tasks for {len(soc_tasks)} SOC codes")

    print("Loading SOC→ISCO crosswalk...")
    isco_to_soc = load_crosswalk()
    print(f"  Loaded {len(isco_to_soc)} ISCO mappings")

    print("Loading Frey & Osborne probabilities...")
    frey_osborne = load_frey_osborne()
    print(f"  Loaded {len(frey_osborne)} ISCO codes with F&O scores")

    print("Loading priority occupations...")
    priority = load_priority_occupations()
    print(f"  Loaded {len(priority)} priority ISCO codes")

    # Step 1: Compute task composition
    print("\nComputing task composition per ISCO code...")
    task_comp = compute_task_composition(soc_activities, isco_to_soc, soc_tasks)
    print(f"  Computed composition for {len(task_comp)} ISCO codes")

    # Save task composition
    tc_path = BASE_DIR / "data" / "crosswalks" / "task_composition.json"
    with open(tc_path, "w") as f:
        json.dump(task_comp, f, indent=2)
    print(f"  Saved to {tc_path}")

    # Step 2: Recalibrate for each country
    for iso3, country_info in COUNTRIES.items():
        print(f"\nRecalibrating for {country_info['name']} ({iso3})...")
        result = recalibrate_for_country(iso3, country_info, task_comp, frey_osborne, priority)

        # Ensure country directory exists
        country_dir = BASE_DIR / "data" / iso3.lower()
        country_dir.mkdir(parents=True, exist_ok=True)

        out_path = country_dir / "recalibrated_automation.json"
        with open(out_path, "w") as f:
            json.dump(result, f, indent=2)
        print(f"  Saved {result['total_occupations']} occupations to {out_path}")
        print(f"  Risk distribution: {result['risk_distribution']}")

        # Show priority occupations
        priority_occs = [o for o in result["occupations"] if o.get("is_priority")]
        if priority_occs:
            print(f"  Priority occupations covered: {len(priority_occs)}")
            for o in priority_occs[:3]:
                print(f"    {o['isco08']} {o['title']}: {o['original_frey_osborne']:.2f} → {o['recalibrated_probability']:.2f} ({o['risk_tier']})")

    print("\n✅ Recalibration complete!")


if __name__ == "__main__":
    main()
