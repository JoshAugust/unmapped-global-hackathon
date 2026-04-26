#!/usr/bin/env python3
"""
Country Config Generator for UNMAPPED Global Hackathon.

Usage:
    python scripts/generate_country.py KEN
    python scripts/generate_country.py IND
    python scripts/generate_country.py RWA

Reads from son-of-a-bridge datasets and generates:
  - data/config/country_config_{iso3}.json
  - data/{iso3_lower}/wdi_labour.json

Requires: the son-of-a-bridge/data/ directory to be adjacent to the hackathon root.
"""

import csv
import json
import os
import sys
from pathlib import Path

# ─── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOB_DATA = PROJECT_ROOT.parent / "son-of-a-bridge" / "data"

WDI_CSV = SOB_DATA / "world_bank_wdi" / "wdi_all_indicators.csv"
HCI_CSV = SOB_DATA / "world_bank_hci" / "hci_all_indicators.csv"
WITT_CSV = SOB_DATA / "wittgenstein" / "wittgenstein_pop_edattain_ssp123.csv"
ILO_DIR = SOB_DATA / "ilo_ilostat"
UN_POP_CSV = SOB_DATA / "un_population" / "un_population_total.csv"

# ─── Country metadata (manually curated — extend as needed) ────────────────
COUNTRY_META = {
    "KEN": {
        "name": "Kenya",
        "iso2": "KE",
        "region": "Sub-Saharan Africa",
        "subregion": "East Africa",
        "income_group": "Lower Middle Income",
        "economy_type": "mixed_formal_informal",
        "primary_language": "en",
        "supported_languages": ["en", "sw"],
        "currency": "KES",
        "currency_symbol": "KSh",
        "usd_exchange_rate_approx": 155,
        "usd_exchange_rate_year": 2024,
        "education_taxonomy": [
            {"code": "L0", "label": "No formal education", "isco_skill_level": 1},
            {"code": "L1", "label": "Primary (incomplete)", "isco_skill_level": 1},
            {"code": "L2", "label": "Kenya Certificate of Primary Education (KCPE)", "isco_skill_level": 1},
            {"code": "L3", "label": "Kenya Certificate of Secondary Education (KCSE)", "isco_skill_level": 2},
            {"code": "L4", "label": "Craft / Artisan certificate (TVET)", "isco_skill_level": 2},
            {"code": "L5", "label": "Diploma (college / polytechnic)", "isco_skill_level": 3},
            {"code": "L6", "label": "Higher National Diploma", "isco_skill_level": 3},
            {"code": "L7", "label": "University degree (B.Sc / B.A)", "isco_skill_level": 4},
            {"code": "L8", "label": "Postgraduate (Masters / PhD)", "isco_skill_level": 4},
        ],
        "informal_recognition": {
            "enabled": True,
            "categories": ["jua_kali_apprenticeship", "self_taught", "community_training", "on_job_experience"],
            "note": "Kenya's Jua Kali informal sector is a major skills pathway. CBC (Competency-Based Curriculum) transition underway since 2017.",
        },
        "opportunity_types": {
            "formal_employment": {"enabled": True, "label": "Formal job"},
            "self_employment": {"enabled": True, "label": "Start or grow a business"},
            "gig_platform": {"enabled": True, "label": "Platform work (Bolt, Glovo, Uber)"},
            "training_pathway": {"enabled": True, "label": "Training or upskilling"},
            "apprenticeship": {"enabled": True, "label": "Jua Kali apprenticeship or formal TVET"},
            "fintech_agent": {"enabled": True, "label": "M-Pesa / mobile money agent"},
            "cooperative": {"enabled": True, "label": "SACCO or cooperative (strong in Kenya)"},
        },
        "automation_calibration_factor": 0.63,
        "automation_calibration_rationale": "Kenya mixed formal/informal. Lower formal sector share than Nigeria but strong mobile money infrastructure and growing tech scene (Silicon Savannah).",
        "ui_locale": "en-KE",
        "accent_color": "#006600",
        "primary_color": "#BB0000",
        "onboarding_tone": "warm_direct",
        "sector_growth_outlook": {
            "_source": "World Bank Kenya Economic Update 2023; ILO Kenya; McKinsey Africa report",
            "sectors_growing": [
                {"sector": "Financial Services & Mobile Money", "growth_tag": "Very High", "rationale": "M-Pesa ecosystem, fintech innovation hub. Kenya leads Africa in mobile money."},
                {"sector": "Information & Communication Technology", "growth_tag": "Very High", "rationale": "Silicon Savannah — iHub, Konza Technopolis. Growing BPO and software development sector."},
                {"sector": "Agriculture & Agritech", "growth_tag": "High", "rationale": "Tea, coffee, horticulture export growth. Agritech startups (Twiga Foods, Apollo Agriculture)."},
                {"sector": "Renewable Energy", "growth_tag": "High", "rationale": "Geothermal leader in Africa, solar expansion, off-grid solutions."},
                {"sector": "Tourism & Hospitality", "growth_tag": "Medium", "rationale": "Safari tourism recovering post-COVID, MICE (meetings/conferences) growing."},
            ],
            "sectors_at_risk": [
                {"sector": "Routine Clerical & Admin", "growth_tag": "Declining", "rationale": "Automation of routine office tasks."},
                {"sector": "Traditional Banking Counter Services", "growth_tag": "Declining", "rationale": "M-Pesa and digital banking reducing branch teller demand"},
                {"sector": "Subsistence Agriculture", "growth_tag": "Stagnant", "rationale": "Climate risk, low productivity, youth exodus to urban areas"},
            ],
        },
        "wages_note": "Formal sector wage data only. Informal sector (Jua Kali) wages not systematically tracked.",
        "mean_monthly_earnings_usd": {
            "all_sectors": {"value": 195, "year": 2022, "source": "KNBS Integrated Household Budget Survey; ILO estimates"},
            "agriculture": {"value": 72, "year": 2022, "source": "KNBS estimate"},
            "industry_manufacturing": {"value": 168, "year": 2022, "source": "KNBS"},
            "wholesale_retail_trade": {"value": 145, "year": 2022, "source": "KNBS"},
            "information_communication": {"value": 580, "year": 2022, "source": "KNBS; tech sector premium"},
            "construction": {"value": 132, "year": 2022, "source": "KNBS"},
            "health_social_work": {"value": 275, "year": 2022, "source": "KNBS"},
            "education": {"value": 245, "year": 2022, "source": "KNBS; TSC pay scales"},
            "public_admin": {"value": 310, "year": 2022, "source": "KNBS"},
        },
        "minimum_wage_usd_monthly": {"value": 85, "year": 2024, "source": "Kenya minimum wage KES 13,572/month (lowest) at 155 KES/USD"},
        "digital_mobile_money_pct": 79.0,
        "digital_mobile_money_note": "M-Pesa penetration among adults. Kenya is the global leader in mobile money.",
        "mean_years_schooling": 6.6,
        "skill_questions_languages": ["en", "sw"],
    },
    "IND": {
        "name": "India",
        "iso2": "IN",
        "region": "South Asia",
        "subregion": "South Asia",
        "income_group": "Lower Middle Income",
        "economy_type": "services_heavy_mixed",
        "primary_language": "en",
        "supported_languages": ["en", "hi"],
        "currency": "INR",
        "currency_symbol": "₹",
        "usd_exchange_rate_approx": 83,
        "usd_exchange_rate_year": 2024,
        "education_taxonomy": [
            {"code": "L0", "label": "No formal education", "isco_skill_level": 1},
            {"code": "L1", "label": "Primary (incomplete, up to Class 5)", "isco_skill_level": 1},
            {"code": "L2", "label": "Upper Primary / Middle School (Class 8)", "isco_skill_level": 1},
            {"code": "L3", "label": "Secondary School Certificate (Class 10)", "isco_skill_level": 2},
            {"code": "L4", "label": "Higher Secondary Certificate (Class 12 / +2)", "isco_skill_level": 2},
            {"code": "L5", "label": "ITI / Polytechnic Diploma", "isco_skill_level": 2},
            {"code": "L6", "label": "University degree (B.A / B.Sc / B.Tech / B.Com)", "isco_skill_level": 3},
            {"code": "L7", "label": "Postgraduate (M.A / M.Tech / MBA)", "isco_skill_level": 4},
            {"code": "L8", "label": "Doctorate (Ph.D)", "isco_skill_level": 4},
        ],
        "informal_recognition": {
            "enabled": True,
            "categories": ["traditional_apprenticeship", "self_taught", "community_training", "on_job_experience", "naps_apprenticeship"],
            "note": "India's National Apprenticeship Promotion Scheme (NAPS) and Skill India Mission. Large informal apprenticeship system alongside ITI/TVET pathways.",
        },
        "opportunity_types": {
            "formal_employment": {"enabled": True, "label": "Formal job"},
            "self_employment": {"enabled": True, "label": "Start or grow a business"},
            "gig_platform": {"enabled": True, "label": "Platform work (Swiggy, Zomato, Urban Company, Ola)"},
            "training_pathway": {"enabled": True, "label": "Training or upskilling (Skill India)"},
            "apprenticeship": {"enabled": True, "label": "ITI / NAPS apprenticeship"},
            "fintech_agent": {"enabled": True, "label": "UPI / digital payment agent"},
            "cooperative": {"enabled": True, "label": "Self-Help Group (SHG) or cooperative"},
        },
        "automation_calibration_factor": 0.72,
        "automation_calibration_rationale": "India has large formal IT/services sector alongside massive informal economy. Higher automation exposure in IT/BPO but lower in agriculture. Weighted blend.",
        "ui_locale": "en-IN",
        "accent_color": "#FF9933",
        "primary_color": "#138808",
        "onboarding_tone": "warm_direct",
        "sector_growth_outlook": {
            "_source": "World Bank India Development Update 2023; NASSCOM; McKinsey Global Institute India at a turning point",
            "sectors_growing": [
                {"sector": "Information Technology & BPO", "growth_tag": "Very High", "rationale": "India's IT services industry ($250B+). AI/ML, cloud services, GCCs expansion."},
                {"sector": "E-commerce & Digital Services", "growth_tag": "Very High", "rationale": "Flipkart, Amazon India, Jio Platforms. UPI payments revolution."},
                {"sector": "Renewable Energy & EV", "growth_tag": "High", "rationale": "Massive solar expansion, EV manufacturing push, green hydrogen targets."},
                {"sector": "Healthcare & Pharma", "growth_tag": "High", "rationale": "Generic pharma global leader, Ayushman Bharat expanding coverage."},
                {"sector": "Financial Services & Fintech", "growth_tag": "High", "rationale": "UPI, Paytm, PhonePe. India Stack digital infrastructure."},
            ],
            "sectors_at_risk": [
                {"sector": "Routine IT Services & Testing", "growth_tag": "Declining", "rationale": "AI/automation displacing low-complexity IT tasks and manual testing"},
                {"sector": "Traditional Retail", "growth_tag": "Declining", "rationale": "E-commerce and quick-commerce disruption"},
                {"sector": "Agricultural Labouring", "growth_tag": "Stagnant", "rationale": "Low productivity, fragmented holdings, climate stress"},
            ],
        },
        "wages_note": "Formal sector estimates. India's massive informal sector (80%+ of employment) has lower wages. Regional variation extreme.",
        "mean_monthly_earnings_usd": {
            "all_sectors": {"value": 220, "year": 2022, "source": "PLFS 2022-23; ILO estimates"},
            "agriculture": {"value": 68, "year": 2022, "source": "PLFS estimate"},
            "industry_manufacturing": {"value": 175, "year": 2022, "source": "PLFS"},
            "wholesale_retail_trade": {"value": 155, "year": 2022, "source": "PLFS"},
            "information_communication": {"value": 850, "year": 2022, "source": "NASSCOM; PLFS; IT sector premium"},
            "construction": {"value": 125, "year": 2022, "source": "PLFS"},
            "health_social_work": {"value": 290, "year": 2022, "source": "PLFS"},
            "education": {"value": 265, "year": 2022, "source": "PLFS"},
            "public_admin": {"value": 420, "year": 2022, "source": "7th Pay Commission rates; PLFS"},
        },
        "minimum_wage_usd_monthly": {"value": 80, "year": 2024, "source": "National floor wage ~INR 178/day; varies hugely by state. Delhi minimum wage higher."},
        "digital_mobile_money_pct": 40.0,
        "digital_mobile_money_note": "UPI adoption. 300M+ active UPI users. Digital payments growing exponentially post-demonetisation.",
        "mean_years_schooling": 6.7,
        "skill_questions_languages": ["en", "hi"],
    },
    "RWA": {
        "name": "Rwanda",
        "iso2": "RW",
        "region": "Sub-Saharan Africa",
        "subregion": "East Africa",
        "income_group": "Low Income",
        "economy_type": "rapidly_digitalising_agrarian",
        "primary_language": "en",
        "supported_languages": ["en", "fr", "rw"],
        "currency": "RWF",
        "currency_symbol": "FRw",
        "usd_exchange_rate_approx": 1280,
        "usd_exchange_rate_year": 2024,
        "education_taxonomy": [
            {"code": "L0", "label": "No formal education", "isco_skill_level": 1},
            {"code": "L1", "label": "Primary (incomplete)", "isco_skill_level": 1},
            {"code": "L2", "label": "Primary leaving certificate (P6)", "isco_skill_level": 1},
            {"code": "L3", "label": "Lower Secondary / Ordinary Level (S3)", "isco_skill_level": 1},
            {"code": "L4", "label": "Upper Secondary / Advanced Level (S6)", "isco_skill_level": 2},
            {"code": "L5", "label": "TVET certificate / Diploma", "isco_skill_level": 2},
            {"code": "L6", "label": "Advanced Diploma / Higher National Diploma", "isco_skill_level": 3},
            {"code": "L7", "label": "University degree (Bachelor's)", "isco_skill_level": 4},
            {"code": "L8", "label": "Postgraduate (Masters / PhD)", "isco_skill_level": 4},
        ],
        "informal_recognition": {
            "enabled": True,
            "categories": ["apprenticeship", "self_taught", "community_training", "umuganda_skills"],
            "note": "Rwanda's 6-3-3 education system. Strong government push for TVET and digital literacy. Umuganda (community work) builds practical skills.",
        },
        "opportunity_types": {
            "formal_employment": {"enabled": True, "label": "Formal job"},
            "self_employment": {"enabled": True, "label": "Start or grow a business"},
            "gig_platform": {"enabled": True, "label": "Platform work (Yego Moto, Bolt)"},
            "training_pathway": {"enabled": True, "label": "Training or upskilling"},
            "apprenticeship": {"enabled": True, "label": "TVET apprenticeship"},
            "fintech_agent": {"enabled": True, "label": "Mobile money agent (MTN MoMo, Airtel Money)"},
            "cooperative": {"enabled": True, "label": "Cooperative (strong tradition — Tontine/Ikimina)"},
        },
        "automation_calibration_factor": 0.58,
        "automation_calibration_rationale": "Rwanda has lower formal sector share and lower automation exposure overall. Rapidly digitalising but from a low base. Strong governance and Vision 2050 push for services/tech.",
        "ui_locale": "en-RW",
        "accent_color": "#00A1DE",
        "primary_color": "#FAD201",
        "onboarding_tone": "warm_direct",
        "sector_growth_outlook": {
            "_source": "World Bank Rwanda Economic Update 2023; MINICOM; Rwanda Vision 2050",
            "sectors_growing": [
                {"sector": "ICT & Digital Services", "growth_tag": "Very High", "rationale": "Kigali Innovation City, Carnegie Mellon Africa campus, government digitisation push."},
                {"sector": "Tourism & Hospitality", "growth_tag": "Very High", "rationale": "Gorilla trekking premium tourism, MICE (Kigali Convention Centre), Visit Rwanda campaign."},
                {"sector": "Financial Services & Mobile Money", "growth_tag": "High", "rationale": "MTN MoMo, Irembo digital government platform, fintech growth."},
                {"sector": "Manufacturing & Made in Rwanda", "growth_tag": "High", "rationale": "Import substitution strategy, Kigali Special Economic Zone, textile/garment."},
                {"sector": "Agriculture & Agriprocessing", "growth_tag": "Medium", "rationale": "Coffee/tea value addition, horticulture. Moving up the value chain."},
            ],
            "sectors_at_risk": [
                {"sector": "Routine Clerical & Admin", "growth_tag": "Declining", "rationale": "Government digitisation (Irembo) reducing manual admin"},
                {"sector": "Subsistence Agriculture", "growth_tag": "Stagnant", "rationale": "Land scarcity, small plot sizes. Government pushing land consolidation."},
                {"sector": "Traditional Retail", "growth_tag": "Declining", "rationale": "Formalisation and e-commerce growing"},
            ],
        },
        "wages_note": "Very limited formal wage data. Rwanda's economy is majority informal/agricultural.",
        "mean_monthly_earnings_usd": {
            "all_sectors": {"value": 95, "year": 2022, "source": "NISR Labour Force Survey; ILO estimates"},
            "agriculture": {"value": 35, "year": 2022, "source": "NISR estimate"},
            "industry_manufacturing": {"value": 88, "year": 2022, "source": "NISR"},
            "wholesale_retail_trade": {"value": 78, "year": 2022, "source": "NISR"},
            "information_communication": {"value": 320, "year": 2022, "source": "NISR; tech sector premium"},
            "construction": {"value": 72, "year": 2022, "source": "NISR"},
            "health_social_work": {"value": 165, "year": 2022, "source": "NISR"},
            "education": {"value": 145, "year": 2022, "source": "NISR"},
            "public_admin": {"value": 195, "year": 2022, "source": "NISR"},
        },
        "minimum_wage_usd_monthly": {"value": 0, "year": 2024, "source": "Rwanda has no official minimum wage. De facto minimum ~RWF 100/day for unskilled labour."},
        "digital_mobile_money_pct": 45.0,
        "digital_mobile_money_note": "MTN MoMo and Airtel Money. Government Irembo platform drives digital adoption.",
        "mean_years_schooling": 4.4,
        "skill_questions_languages": ["en", "fr", "rw"],
    },
    "NGA": {
        "name": "Nigeria",
        "iso2": "NG",
        "region": "Sub-Saharan Africa",
        "subregion": "West Africa",
        "income_group": "Lower Middle Income",
        "economy_type": "urban_informal_mixed",
        "primary_language": "en",
        "supported_languages": ["en", "ha", "yo", "ig"],
        "currency": "NGN",
        "currency_symbol": "₦",
        "usd_exchange_rate_approx": 780,
        "usd_exchange_rate_year": 2023,
    },
    "GHA": {
        "name": "Ghana",
        "iso2": "GH",
        "region": "Sub-Saharan Africa",
        "subregion": "West Africa",
        "income_group": "Lower Middle Income",
        "economy_type": "mixed_formal_informal",
        "primary_language": "en",
        "supported_languages": ["en", "ak", "ee"],
        "currency": "GHS",
        "currency_symbol": "GH₵",
        "usd_exchange_rate_approx": 14,
        "usd_exchange_rate_year": 2024,
    },
}

# ─── Data loaders ───────────────────────────────────────────────────────────

def load_wdi(iso3):
    """Load latest values for all WDI indicators for a given country."""
    data = {}
    with open(WDI_CSV) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["country_code"] == iso3 and row["value"]:
                ind = row["indicator_id"]
                yr = int(row["year"])
                val = float(row["value"])
                if ind not in data or yr > data[ind]["year"]:
                    data[ind] = {"value": val, "year": yr}
    return data


def load_hci(iso3):
    """Load latest HCI overall score."""
    best = None
    with open(HCI_CSV) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["country_id"] == iso3 and row["indicator_code"] == "HD.HCI.OVRL" and row["value"]:
                yr = int(row["year"])
                val = float(row["value"])
                if best is None or yr > best["year"]:
                    best = {"value": round(val, 2), "year": yr}
    return best


def load_wittgenstein(country_name):
    """Load Wittgenstein education projections for SSP2 scenario."""
    data = {}
    with open(WITT_CSV) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["name"] == country_name and int(float(row["scenario"])) == 2:
                yr = int(float(row["year"]))
                if yr in (2025, 2035):
                    ed = row["education"]
                    pop = float(row["pop"])
                    if yr not in data:
                        data[yr] = {}
                    data[yr][ed] = pop
    # Convert to percentages (excluding Under 15)
    result = {}
    for yr in (2025, 2035):
        if yr in data:
            d = data[yr]
            total_15plus = sum(v for k, v in d.items() if k != "Under 15")
            if total_15plus > 0:
                no_ed = d.get("No Education", 0)
                inc_pri = d.get("Incomplete Primary", 0)
                primary = d.get("Primary", 0)
                lower_sec = d.get("Lower Secondary", 0)
                upper_sec = d.get("Upper Secondary", 0)
                post_sec = d.get("Post Secondary", 0) + d.get("Short Post Secondary", 0) + d.get("Bachelor", 0) + d.get("Master and higher", 0)
                result[str(yr)] = {
                    "no_education_pct": round(no_ed / total_15plus * 100, 1),
                    "primary_pct": round((inc_pri + primary) / total_15plus * 100, 1),
                    "lower_secondary_pct": round(lower_sec / total_15plus * 100, 1),
                    "upper_secondary_pct": round(upper_sec / total_15plus * 100, 1),
                    "post_secondary_pct": round(post_sec / total_15plus * 100, 1),
                }
    return result


def load_neet(iso3):
    """Load latest NEET rate from ILO SDG 8.5.2 dataset."""
    neet_csv = ILO_DIR / "SDG_0852_SEX_AGE_RT_A.csv"
    best = None
    with open(neet_csv) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["ref_area"] == iso3 and row["sex"] == "SEX_T" and "Y15-24" in row.get("classif1", ""):
                yr = int(row["time"])
                val = float(row["obs_value"])
                if best is None or yr > best["year"]:
                    best = {"value": round(val, 1), "year": yr}
    return best


def load_ilo_sector_employment(iso3):
    """Load employment by sector from ILO (thousands) — latest year."""
    sector_csv = ILO_DIR / "EMP_TEMP_SEX_ECO_NB_A.csv"
    sectors = {}
    with open(sector_csv) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["ref_area"] == iso3 and row["sex"] == "SEX_T":
                classif = row["classif1"]
                yr = int(row["time"])
                val = float(row["obs_value"])
                if classif not in sectors or yr > sectors[classif]["year"]:
                    sectors[classif] = {"value": val, "year": yr}
    return sectors


def load_un_population(iso3):
    """Load latest population from UN population dataset."""
    best = None
    with open(UN_POP_CSV) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["iso3"] == iso3:
                yr = int(row["year"])
                val = float(row["pop_total"])
                if best is None or yr > best["year"]:
                    best = {"value": val, "year": yr}
    return best


# ─── Config builders ────────────────────────────────────────────────────────

def build_wdi_labour(iso3, wdi, hci, witt, neet, meta):
    """Build the wdi_labour.json structure matching Nigeria's schema."""
    country_name = meta["name"]

    gdp_pc = wdi.get("NY.GDP.PCAP.CD", {})
    pop = wdi.get("SP.POP.TOTL", {})
    unemp = wdi.get("SL.UEM.TOTL.ZS", {})
    youth_unemp = wdi.get("SL.UEM.1524.ZS", {})
    lfp = wdi.get("SL.TLF.CACT.ZS", {})
    lfp_f = wdi.get("SL.TLF.CACT.FE.ZS", {})
    agr = wdi.get("SL.AGR.EMPL.ZS", {})
    ind = wdi.get("SL.IND.EMPL.ZS", {})
    srv = wdi.get("SL.SRV.EMPL.ZS", {})
    internet = wdi.get("IT.NET.USER.ZS", {})
    prim_comp = wdi.get("SE.PRM.CMPT.ZS", {})
    sec_enrl = wdi.get("SE.SEC.ENRR", {})
    ter_enrl = wdi.get("SE.TER.ENRR", {})

    labour = {
        "_metadata": {
            "country": country_name,
            "iso3": iso3,
            "region": meta.get("region", "TODO"),
            "income_group": meta.get("income_group", "TODO"),
            "last_updated": "2024-04",
            "sources": {
                "WDI": "World Bank World Development Indicators, https://data.worldbank.org",
                "ILOSTAT": "International Labour Organization, ILOSTAT, https://ilostat.ilo.org",
                "Wittgenstein": "Wittgenstein Centre for Demography and Global Human Capital",
            },
            "data_gaps": [
                "Informal sector wage data: limited systematic coverage",
                "Occupation-level wage data: Not available at ISCO-08 disaggregation",
                "TODO: Add country-specific data gap notes",
            ],
        },
        "macro": {
            "gdp_per_capita_usd": _mkval(gdp_pc, "WDI NY.GDP.PCAP.CD", rounding=0),
            "population_millions": _mkval_pop(pop, "WDI SP.POP.TOTL"),
            "urban_population_pct": _mkval(wdi.get("SP.URB.TOTL.IN.ZS", {}), "WDI SP.URB.TOTL.IN.ZS"),
        },
        "labour_market": {
            "unemployment_rate_pct": _mkval(unemp, "WDI SL.UEM.TOTL.ZS"),
            "youth_unemployment_rate_pct": _mkval(youth_unemp, "WDI SL.UEM.1524.ZS"),
            "youth_neet_pct": {
                "value": neet["value"] if neet else "TODO",
                "year": neet["year"] if neet else "TODO",
                "source": "ILO modelled estimate, ILOSTAT SDG 8.6.1",
            },
            "labour_force_participation_pct": _mkval(lfp, "WDI SL.TLF.CACT.ZS"),
            "female_labour_participation_pct": _mkval(lfp_f, "WDI SL.TLF.CACT.FE.ZS"),
            "self_employment_pct": {"value": "TODO", "year": "TODO", "source": "TODO: Add from national LFS"},
            "informal_employment_pct": {"value": "TODO", "year": "TODO", "source": "TODO: Add from national LFS or ILO estimates"},
            "employment_by_sector": {
                "agriculture_pct": _mkval(agr, "WDI SL.AGR.EMPL.ZS"),
                "industry_pct": _mkval(ind, "WDI SL.IND.EMPL.ZS"),
                "services_pct": _mkval(srv, "WDI SL.SRV.EMPL.ZS"),
            },
        },
        "wages": {
            "_note": meta.get("wages_note", "TODO: Add wage data notes"),
            "mean_monthly_earnings_usd": meta.get("mean_monthly_earnings_usd", {"_note": "TODO: Add sector wage data"}),
            "minimum_wage_usd_monthly": meta.get("minimum_wage_usd_monthly", {"value": "TODO", "year": "TODO", "source": "TODO"}),
        },
        "education": {
            "primary_completion_rate_pct": _mkval(prim_comp, "WDI SE.PRM.CMPT.ZS"),
            "secondary_enrollment_gross_pct": _mkval(sec_enrl, "WDI SE.SEC.ENRR"),
            "tertiary_enrollment_gross_pct": _mkval(ter_enrl, "WDI SE.TER.ENRR"),
            "mean_years_schooling": {"value": meta.get("mean_years_schooling", "TODO"), "year": 2021, "source": "UNDP HDI data"},
            "human_capital_index": {
                "value": hci["value"] if hci else "TODO",
                "year": hci["year"] if hci else "TODO",
                "source": "World Bank Human Capital Index",
            },
        },
        "digital": {
            "internet_penetration_pct": _mkval(internet, "WDI IT.NET.USER.ZS"),
            "mobile_money_adoption_pct_adults": {
                "value": meta.get("digital_mobile_money_pct", "TODO"),
                "year": 2022,
                "source": "Global Findex / national surveys",
                "note": meta.get("digital_mobile_money_note", "TODO"),
            },
        },
        "wittgenstein_projections": {
            "_source": "Wittgenstein Centre for Demography and Global Human Capital (2018), Education projection v.2.0",
            "_note": f"Education level distribution for {country_name}, all ages 15+, 2025 vs 2035 (SSP2)",
            "ages_15_plus": witt if witt else {"TODO": "Wittgenstein data not found for this country"},
        },
    }

    # Add self-employment / informal estimates for known countries
    if iso3 == "KEN":
        labour["labour_market"]["self_employment_pct"] = {"value": 72.0, "year": 2022, "source": "KNBS Integrated Household Budget Survey 2022"}
        labour["labour_market"]["informal_employment_pct"] = {"value": 84.0, "year": 2022, "source": "KNBS; ILO Kenya decent work profile"}
    elif iso3 == "IND":
        labour["labour_market"]["self_employment_pct"] = {"value": 57.3, "year": 2022, "source": "PLFS 2022-23"}
        labour["labour_market"]["informal_employment_pct"] = {"value": 89.0, "year": 2022, "source": "ILO India; PLFS 2022-23 estimate"}
    elif iso3 == "RWA":
        labour["labour_market"]["self_employment_pct"] = {"value": 76.0, "year": 2022, "source": "NISR Labour Force Survey 2022"}
        labour["labour_market"]["informal_employment_pct"] = {"value": 91.0, "year": 2022, "source": "NISR; ILO Rwanda decent work profile"}

    return labour


def _mkval(d, source, rounding=1):
    """Create a value dict from WDI data."""
    if not d:
        return {"value": "TODO", "year": "TODO", "source": source}
    val = d["value"]
    if rounding == 0:
        val = int(round(val))
    else:
        val = round(val, rounding)
    return {"value": val, "year": d["year"], "source": source}


def _mkval_pop(d, source):
    """Create a population value in millions."""
    if not d:
        return {"value": "TODO", "year": "TODO", "source": source}
    val = round(d["value"] / 1_000_000, 1)
    return {"value": val, "year": d["year"], "source": source}


def build_country_config(iso3, wdi, meta):
    """Build the country_config JSON matching Nigeria's schema."""
    country_name = meta["name"]
    iso3_lower = iso3.lower()

    config = {
        "_schema_version": "1.0",
        "_description": f"{country_name} configuration. Swap this file for country_config_nga.json to reconfigure UNMAPPED for {country_name}. No codebase changes required.",
        "country": {
            "name": country_name,
            "iso3": iso3,
            "iso2": meta["iso2"],
            "region": meta.get("region", "TODO"),
            "subregion": meta.get("subregion", "TODO"),
            "economy_type": meta.get("economy_type", "TODO"),
            "primary_language": meta.get("primary_language", "en"),
            "supported_languages": meta.get("supported_languages", ["en"]),
            "currency": meta.get("currency", "TODO"),
            "currency_symbol": meta.get("currency_symbol", "TODO"),
            "usd_exchange_rate_approx": meta.get("usd_exchange_rate_approx", "TODO"),
            "usd_exchange_rate_year": meta.get("usd_exchange_rate_year", 2024),
        },
        "data_paths": {
            "labour_market": f"data/{iso3_lower}/wdi_labour.json",
            "occupation_lookup": "data/isco_fo_joined.csv",
            "automation_calibration": "config/calibration.json",
        },
        "automation": {
            "calibration_factor": meta.get("automation_calibration_factor", 0.65),
            "calibration_rationale": meta.get("automation_calibration_rationale", "TODO: Add calibration rationale"),
            "source_dataset": "Frey-Osborne 2013, ISCO-08 crosswalk",
            "recalibration_trigger": f"TODO: Update when {country_name} publishes updated occupation-level task data",
        },
        "education_taxonomy": {
            "levels": meta.get("education_taxonomy", [{"code": "TODO", "label": "TODO", "isco_skill_level": 1}]),
            "informal_recognition": meta.get("informal_recognition", {
                "enabled": True,
                "categories": ["apprenticeship", "self_taught", "community_training", "on_job_experience"],
                "note": "TODO: Add country-specific informal skills note",
            }),
        },
        "opportunity_types": meta.get("opportunity_types", {
            "formal_employment": {"enabled": True, "label": "Formal job"},
            "self_employment": {"enabled": True, "label": "Start or grow a business"},
            "gig_platform": {"enabled": True, "label": "Platform work"},
            "training_pathway": {"enabled": True, "label": "Training or upskilling"},
            "apprenticeship": {"enabled": True, "label": "Apprenticeship"},
        }),
        "econometric_signals": {
            "signal_1": {
                "name": "Sector wage comparison",
                "description": "Monthly earnings by economic sector (formal sector only)",
                "data_field": "wages.mean_monthly_earnings_usd",
                "vintage": f"TODO: {country_name} Labour Force Survey",
                "display_unit": "USD/month",
                "display_caveat": "Formal sector only. Informal sector wages typically lower.",
            },
            "signal_2": {
                "name": "Sector growth outlook",
                "description": "Which sectors are growing or declining",
                "data_field": "sector_growth_outlook",
                "vintage": f"World Bank {country_name} Economic Update 2023",
                "display_unit": "Qualitative (Very High / High / Medium / Declining)",
                "display_caveat": "Forward-looking estimate.",
            },
        },
        "ui": {
            "default_language": meta.get("primary_language", "en"),
            "font_stack": "system-ui, sans-serif",
            "locale": meta.get("ui_locale", f"en-{meta['iso2']}"),
            "number_format": "1,234.56",
            "date_format": "DD/MM/YYYY",
            "low_bandwidth_mode": True,
            "image_loading": "lazy",
            "max_initial_payload_kb": 150,
            "primary_color": meta.get("primary_color", "#1B5E8A"),
            "accent_color": meta.get("accent_color", "#008751"),
            "onboarding_tone": meta.get("onboarding_tone", "warm_direct"),
            "reading_level_target": "secondary_school",
        },
        "skill_input_questions": _build_skill_questions(iso3, meta),
    }

    # Add sector growth outlook
    if "sector_growth_outlook" in meta:
        config["sector_growth_outlook"] = meta["sector_growth_outlook"]

    return config


def _build_skill_questions(iso3, meta):
    """Build skill input questions — English base with TODO for translations."""
    langs = meta.get("skill_questions_languages", ["en"])
    other_langs = [l for l in langs if l != "en"]

    # Build education options from taxonomy
    ed_options = []
    for level in meta.get("education_taxonomy", []):
        ed_options.append(level["label"])

    questions = [
        {
            "id": "q_work_activity",
            "question_en": "What do you spend most of your working time doing?",
            **{f"question_{l}": "TODO" for l in other_langs},
            "type": "select_with_freetext",
            "options_en": _get_work_options(iso3),
            "maps_to": "isco08_primary",
        },
        {
            "id": "q_education",
            "question_en": "What is your highest level of education?",
            **{f"question_{l}": "TODO" for l in other_langs},
            "type": "select",
            "options_en": ed_options if ed_options else ["TODO"],
            "maps_to": "education_level_code",
        },
        {
            "id": "q_informal_skills",
            "question_en": "Have you taught yourself any skills? (select all that apply)",
            **{f"question_{l}": "TODO" for l in other_langs},
            "type": "multi_select",
            "options_en": _get_informal_skills_options(iso3),
            "maps_to": "informal_skills_tags",
        },
        {
            "id": "q_years_experience",
            "question_en": "How many years have you been doing your main work?",
            **{f"question_{l}": "TODO" for l in other_langs},
            "type": "select",
            "options_en": ["Less than 1 year", "1-2 years", "3-5 years", "More than 5 years"],
            "maps_to": "experience_years_band",
        },
        {
            "id": "q_goal",
            "question_en": "What are you most hoping to do?",
            **{f"question_{l}": "TODO" for l in other_langs},
            "type": "select",
            "options_en": [
                "Find a formal job",
                "Grow my own business",
                "Learn a new skill or get certified",
                "Understand what different jobs pay",
                "See how AI might affect my work",
            ],
            "maps_to": "user_goal",
        },
    ]
    return questions


def _get_work_options(iso3):
    """Country-specific work activity options."""
    base = [
        "Selling goods (market, shop, online)",
        "Repairing phones, electronics, or appliances",
        "Sewing, tailoring, or making clothes",
        "Cooking, food prep, or catering",
        "Construction or building work",
        "Farming or growing food",
        "Teaching or training others",
        "Office or admin work",
        "Healthcare or caring for others",
        "IT, tech, or computer work",
        "Creative work (content, design, music)",
        "Something else",
    ]
    if iso3 == "KEN":
        base.insert(3, "Driving (matatu, boda-boda, Bolt)")
        base.insert(7, "M-Pesa / mobile money agent work")
    elif iso3 == "IND":
        base.insert(3, "Driving (auto-rickshaw, Ola, Uber)")
        base.insert(7, "Delivery work (Swiggy, Zomato, Dunzo)")
        base.insert(8, "Beauty / salon services (Urban Company)")
    elif iso3 == "RWA":
        base.insert(3, "Driving (moto-taxi, Yego Moto)")
        base.insert(7, "Mobile money agent work (MTN MoMo)")
    return base


def _get_informal_skills_options(iso3):
    """Country-specific informal skills options."""
    base = [
        "Basic computer use",
        "Using smartphones and apps",
        "Social media for business",
        "Accounting or bookkeeping",
        "Coding or tech skills",
        "A language",
        "Nothing specific",
    ]
    if iso3 == "KEN":
        base.insert(4, "A trade through Jua Kali apprenticeship")
        base.insert(5, "M-Pesa / mobile money management")
    elif iso3 == "IND":
        base.insert(4, "A trade through apprenticeship (ITI/traditional)")
        base.insert(5, "UPI / digital payment management")
    elif iso3 == "RWA":
        base.insert(4, "A trade through apprenticeship")
        base.insert(5, "Skills from Umuganda community work")
    return base


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_country.py <ISO3_CODE>")
        print("Example: python scripts/generate_country.py KEN")
        sys.exit(1)

    iso3 = sys.argv[1].upper()

    if iso3 not in COUNTRY_META:
        print(f"Warning: {iso3} not found in COUNTRY_META. Using minimal defaults.")
        COUNTRY_META[iso3] = {
            "name": iso3.title(),
            "iso2": iso3[:2],
            "region": "TODO",
            "subregion": "TODO",
            "income_group": "TODO",
        }

    meta = COUNTRY_META[iso3]
    country_name = meta["name"]
    iso3_lower = iso3.lower()

    print(f"Generating configs for {country_name} ({iso3})...")

    # Load data
    print("  Loading WDI data...")
    wdi = load_wdi(iso3)
    print(f"    Found {len(wdi)} indicators")

    print("  Loading HCI data...")
    hci = load_hci(iso3)
    print(f"    HCI: {hci}")

    print("  Loading Wittgenstein projections...")
    witt = load_wittgenstein(country_name)
    print(f"    Wittgenstein years: {list(witt.keys())}")

    print("  Loading NEET data...")
    neet = load_neet(iso3)
    print(f"    NEET: {neet}")

    # Build wdi_labour.json
    print("  Building wdi_labour.json...")
    labour = build_wdi_labour(iso3, wdi, hci, witt, neet, meta)

    # Write wdi_labour.json
    out_dir = PROJECT_ROOT / "data" / iso3_lower
    out_dir.mkdir(parents=True, exist_ok=True)
    labour_path = out_dir / "wdi_labour.json"
    with open(labour_path, "w") as f:
        json.dump(labour, f, indent=2, default=str)
    print(f"  ✓ Written: {labour_path}")

    # Build country config
    print("  Building country_config...")
    config = build_country_config(iso3, wdi, meta)

    # Write country config
    config_dir = PROJECT_ROOT / "data" / "config"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / f"country_config_{iso3_lower}.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2, default=str)
    print(f"  ✓ Written: {config_path}")

    print(f"\nDone! Generated configs for {country_name}.")
    print(f"  Config: {config_path}")
    print(f"  Labour: {labour_path}")


if __name__ == "__main__":
    main()
