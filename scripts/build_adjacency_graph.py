#!/usr/bin/env python3
"""
build_adjacency_graph.py — Compute skill-overlap adjacency graph from ESCO data.

Reads ESCO skills per ISCO occupation, computes pairwise Jaccard similarity,
merges with hand-curated adjacency pathways, and outputs:
  1. adjacency_graph.json  — full adjacency data per occupation
  2. adjacency_matrix.csv  — 19×19 Jaccard similarity matrix
  3. skill_gaps.csv         — per-transition missing skills
"""

import csv
import json
import os
import sys
from itertools import combinations
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent.parent
ESCO_SKILLS = BASE / "data" / "crosswalks" / "isco_esco_skills.json"
OCC_LOOKUP  = BASE / "data" / "nga" / "occupation_lookup.json"
OUT_GRAPH   = BASE / "data" / "crosswalks" / "adjacency_graph.json"
OUT_MATRIX  = BASE / "data" / "crosswalks" / "adjacency_matrix.csv"
OUT_GAPS    = BASE / "data" / "crosswalks" / "skill_gaps.csv"

# ---------------------------------------------------------------------------
# Hand-curated adjacency map (imported inline to avoid module-path issues)
# ---------------------------------------------------------------------------
CURATED_ADJACENCY_MAP = {
    "7422": [
        {"isco08": "3139", "label": "Solar Technician", "gap_level": "small",
         "gap_description": "3-month solar PV installation course (₦30-80k range in Lagos). Electrical fundamentals transfer directly.",
         "wage_uplift_pct": 79},
        {"isco08": "2522", "label": "IT Support Technician", "gap_level": "medium",
         "gap_description": "CompTIA A+ certification (self-study 6 months). Strong hardware knowledge transfers.",
         "wage_uplift_pct": 55},
        {"isco08": "3339", "label": "CCTV / Security Systems Installer", "gap_level": "small",
         "gap_description": "On-the-job training available. Wiring and device configuration skills transfer directly.",
         "wage_uplift_pct": 30},
    ],
    "5221": [
        {"isco08": "4215", "label": "POS / Mobile Money Agent", "gap_level": "minimal",
         "gap_description": "Platform registration and basic training (1-2 weeks). Customer trust skills transfer directly.",
         "wage_uplift_pct": 40},
        {"isco08": "2412", "label": "Digital Marketer / Social Commerce", "gap_level": "small",
         "gap_description": "Free/low-cost digital marketing courses (Google, Meta Blueprint). WhatsApp Business skills already present.",
         "wage_uplift_pct": 55},
        {"isco08": "5221", "label": "E-commerce / Platform Sales Agent", "gap_level": "small",
         "gap_description": "Jumia, Konga seller onboarding programme. Inventory management skills transfer.",
         "wage_uplift_pct": 45},
    ],
    "8322": [
        {"isco08": "4323", "label": "Logistics Coordinator", "gap_level": "medium",
         "gap_description": "Route planning and fleet management training (3 months). Local road knowledge is an asset.",
         "wage_uplift_pct": 35},
        {"isco08": "5221", "label": "Delivery Operations Supervisor", "gap_level": "small",
         "gap_description": "Gig platform promotion pathway. Customer service track record transfers.",
         "wage_uplift_pct": 50},
    ],
    "7531": [
        {"isco08": "7531", "label": "Export Fashion Producer", "gap_level": "medium",
         "gap_description": "Export quality standards training; Afrofashion market access. Sewing skills fully transfer.",
         "wage_uplift_pct": 120},
        {"isco08": "2356", "label": "TVET Tailoring Instructor", "gap_level": "medium",
         "gap_description": "NABTEB instructor certification. Teaching skills needed in addition to trade.",
         "wage_uplift_pct": 45},
    ],
    "9111": [
        {"isco08": "2221", "label": "Community Health Aide", "gap_level": "medium",
         "gap_description": "CHEW (Community Health Extension Worker) training (1 year). Care skills transfer.",
         "wage_uplift_pct": 65},
        {"isco08": "5141", "label": "Professional Caregiver (elderly/disability)", "gap_level": "small",
         "gap_description": "Caregiver certification programmes available through NGOs. Growing sector.",
         "wage_uplift_pct": 40},
    ],
    "5120": [
        {"isco08": "5120", "label": "Catering Business Owner", "gap_level": "small",
         "gap_description": "Small business registration and food safety certification. Cooking skills fully transfer.",
         "wage_uplift_pct": 80},
        {"isco08": "5120", "label": "Online Food Delivery Vendor", "gap_level": "minimal",
         "gap_description": "Chowdeck / Glovo vendor onboarding. Existing cooking skills sufficient.",
         "wage_uplift_pct": 50},
    ],
    "4132": [
        {"isco08": "2412", "label": "Digital Marketing Assistant", "gap_level": "small",
         "gap_description": "Google Digital Skills for Africa (free, 40 hours). Computer literacy already present.",
         "wage_uplift_pct": 35},
        {"isco08": "3339", "label": "IT Support / Helpdesk", "gap_level": "medium",
         "gap_description": "CompTIA A+ certification. Technical upskilling required but admin skills transfer.",
         "wage_uplift_pct": 45},
    ],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_esco_skills() -> dict:
    """Return {isco_code: {title, essential: set(uri), optional: set(uri), label_map: {uri: label}}}"""
    raw = json.loads(ESCO_SKILLS.read_text())
    result = {}
    for isco, data in raw.items():
        ess_uris = set()
        opt_uris = set()
        label_map = {}
        for s in data.get("essential_skills", []):
            ess_uris.add(s["uri"])
            label_map[s["uri"]] = s["label"]
        for s in data.get("optional_skills", []):
            opt_uris.add(s["uri"])
            label_map[s["uri"]] = s["label"]
        result[isco] = {
            "title": data["isco_title"],
            "essential": ess_uris,
            "optional": opt_uris,
            "all_skills": ess_uris | opt_uris,
            "label_map": label_map,
        }
    return result


def load_wages() -> dict:
    """Return {isco_code_str: wage_usd}"""
    raw = json.loads(OCC_LOOKUP.read_text())
    wages = {}
    for occ in raw.get("occupation_lookup", []):
        wages[str(occ["isco08"])] = occ.get("sector_median_wage_usd")
    return wages


def jaccard(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 0.0
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def compute_pairwise(skills_data: dict) -> dict:
    """
    Returns {(from_isco, to_isco): {jaccard, shared_uris, missing_essential_uris, ...}}
    Directional: what does FROM need to gain to transition TO?
    """
    codes = sorted(skills_data.keys())
    pairs = {}
    for a in codes:
        for b in codes:
            if a == b:
                continue
            a_all = skills_data[a]["all_skills"]
            b_all = skills_data[b]["all_skills"]

            # Jaccard over ALL skills (essential + optional)
            jac = jaccard(a_all, b_all)

            # Shared skills
            shared = a_all & b_all

            # Missing essential: skills B requires as essential that A doesn't have at all
            missing_ess = skills_data[b]["essential"] - a_all

            pairs[(a, b)] = {
                "jaccard": round(jac, 4),
                "shared_uris": shared,
                "shared_count": len(shared),
                "missing_essential_uris": missing_ess,
                "missing_essential_count": len(missing_ess),
            }
    return pairs


def build_adjacency_graph(
    skills_data: dict, pairs: dict, wages: dict, jaccard_threshold: float = 0.02
) -> dict:
    """
    Build the full adjacency graph, merging data-driven overlaps with curated pathways.
    """
    codes = sorted(skills_data.keys())
    graph = {}

    for src in codes:
        adjacencies = []
        # Collect all data-driven adjacencies above threshold
        data_driven = {}
        for tgt in codes:
            if tgt == src:
                continue
            pair = pairs.get((src, tgt))
            if not pair:
                continue
            if pair["jaccard"] >= jaccard_threshold or pair["shared_count"] > 0:
                shared_labels = sorted(
                    skills_data[src]["label_map"].get(u, skills_data[tgt]["label_map"].get(u, u))
                    for u in pair["shared_uris"]
                )
                missing_labels = sorted(
                    skills_data[tgt]["label_map"].get(u, u)
                    for u in pair["missing_essential_uris"]
                )
                src_wage = wages.get(src, 0) or 0
                tgt_wage = wages.get(tgt, 0) or 0
                wage_uplift = round((tgt_wage - src_wage) / src_wage * 100, 1) if src_wage else None

                data_driven[tgt] = {
                    "target_isco": tgt,
                    "target_title": skills_data[tgt]["title"],
                    "skill_overlap_jaccard": pair["jaccard"],
                    "shared_skills": shared_labels[:20],  # cap for readability
                    "shared_count": pair["shared_count"],
                    "missing_essential_skills": missing_labels[:20],
                    "missing_count": pair["missing_essential_count"],
                    "wage_uplift_pct": wage_uplift,
                    "data_source": "esco_overlap",
                }

        # Merge curated adjacencies
        curated_list = CURATED_ADJACENCY_MAP.get(src, [])
        curated_targets = set()
        for curated in curated_list:
            tgt_code = curated["isco08"]
            curated_targets.add(tgt_code)
            if tgt_code in data_driven:
                # Merge: keep data-driven numbers, add curated descriptions
                entry = data_driven.pop(tgt_code)
                entry["curated_gap_description"] = curated.get("gap_description", "")
                entry["curated_gap_level"] = curated.get("gap_level", "")
                entry["curated_wage_uplift_pct"] = curated.get("wage_uplift_pct")
                entry["curated_label"] = curated.get("label", "")
                entry["data_source"] = "esco_overlap + curated"
            else:
                # Curated target not in our 19 occupations — include anyway
                entry = {
                    "target_isco": tgt_code,
                    "target_title": curated.get("label", ""),
                    "skill_overlap_jaccard": None,
                    "shared_skills": [],
                    "shared_count": 0,
                    "missing_essential_skills": [],
                    "missing_count": None,
                    "wage_uplift_pct": curated.get("wage_uplift_pct"),
                    "curated_gap_description": curated.get("gap_description", ""),
                    "curated_gap_level": curated.get("gap_level", ""),
                    "curated_label": curated.get("label", ""),
                    "data_source": "curated_only",
                }
            adjacencies.append(entry)

        # Add remaining data-driven adjacencies (not curated) sorted by Jaccard desc
        for tgt_code in sorted(data_driven, key=lambda t: data_driven[t]["skill_overlap_jaccard"], reverse=True):
            adjacencies.append(data_driven[tgt_code])

        graph[src] = {
            "isco_title": skills_data[src]["title"],
            "adjacencies": adjacencies,
        }

    return graph


def write_adjacency_matrix(skills_data: dict, pairs: dict):
    """Write 19×19 Jaccard similarity matrix CSV."""
    codes = sorted(skills_data.keys())
    with open(OUT_MATRIX, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["isco_code"] + codes)
        for a in codes:
            row = [a]
            for b in codes:
                if a == b:
                    row.append(1.0)
                else:
                    row.append(pairs.get((a, b), {}).get("jaccard", 0.0))
            writer.writerow(row)
    print(f"  ✓ adjacency_matrix.csv — {len(codes)}×{len(codes)} matrix")


def write_skill_gaps(skills_data: dict, pairs: dict):
    """Write skill_gaps.csv with per-transition missing skills."""
    codes = sorted(skills_data.keys())
    row_count = 0
    with open(OUT_GAPS, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["from_isco", "to_isco", "missing_skill_uri", "missing_skill_label"])
        for a in codes:
            for b in codes:
                if a == b:
                    continue
                pair = pairs.get((a, b))
                if not pair:
                    continue
                for uri in sorted(pair["missing_essential_uris"]):
                    label = skills_data[b]["label_map"].get(uri, uri)
                    writer.writerow([a, b, uri, label])
                    row_count += 1
    print(f"  ✓ skill_gaps.csv — {row_count} rows")


def print_summary(graph: dict):
    """Print summary statistics."""
    print("\n" + "=" * 60)
    print("ADJACENCY GRAPH SUMMARY")
    print("=" * 60)
    counts = {code: len(data["adjacencies"]) for code, data in graph.items()}
    avg = sum(counts.values()) / len(counts) if counts else 0
    most_connected = max(counts, key=counts.get)
    most_isolated = min(counts, key=counts.get)
    print(f"  Total occupations:           {len(graph)}")
    print(f"  Average adjacencies/occ:     {avg:.1f}")
    print(f"  Most connected:              {most_connected} ({graph[most_connected]['isco_title']}) — {counts[most_connected]} adjacencies")
    print(f"  Most isolated:               {most_isolated} ({graph[most_isolated]['isco_title']}) — {counts[most_isolated]} adjacencies")

    # Top 5 strongest pairwise overlaps
    print("\n  Top 5 strongest skill overlaps:")
    all_pairs = []
    for code, data in graph.items():
        for adj in data["adjacencies"]:
            if adj.get("skill_overlap_jaccard") is not None:
                all_pairs.append((code, adj["target_isco"], adj["skill_overlap_jaccard"]))
    # Deduplicate (keep higher direction)
    seen = set()
    unique = []
    for a, b, j in sorted(all_pairs, key=lambda x: x[2], reverse=True):
        key = tuple(sorted([a, b]))
        if key not in seen:
            seen.add(key)
            unique.append((a, b, j))
    for a, b, j in unique[:5]:
        print(f"    {a} ↔ {b}: Jaccard {j:.3f} ({graph[a]['isco_title']} ↔ {graph[b]['isco_title']})")
    print("=" * 60)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Loading ESCO skills data...")
    skills_data = load_esco_skills()
    print(f"  Loaded {len(skills_data)} occupations")

    # Warn about occupations with no skills
    empty = [c for c, d in skills_data.items() if not d["essential"] and not d["optional"]]
    if empty:
        print(f"  ⚠ Occupations with NO skills: {empty}")

    print("\nLoading wage data...")
    wages = load_wages()
    print(f"  Loaded wages for {len(wages)} occupations")

    print("\nComputing pairwise skill overlaps...")
    pairs = compute_pairwise(skills_data)
    print(f"  Computed {len(pairs)} directional pairs")

    print("\nBuilding adjacency graph...")
    graph = build_adjacency_graph(skills_data, pairs, wages)

    print("\nWriting outputs...")
    OUT_GRAPH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_GRAPH, "w") as f:
        json.dump(graph, f, indent=2, default=str)
    print(f"  ✓ adjacency_graph.json — {len(graph)} occupations")

    write_adjacency_matrix(skills_data, pairs)
    write_skill_gaps(skills_data, pairs)

    print_summary(graph)


if __name__ == "__main__":
    main()
