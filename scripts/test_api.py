#!/usr/bin/env python3
"""
Test script for UNMAPPED API.
Run the server first:  cd unmapped-global-hackathon && uvicorn backend.main:app --port 8000
Then:                  python scripts/test_api.py
"""
import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

TESTS = [
    # (name, path, expected_status, check_fn)
    ("Health", "/api/health", 200, lambda d: d["status"] == "ok"),
    ("Countries list", "/api/countries", 200, lambda d: len(d["countries"]) == 5),
    ("Country detail NGA", "/api/country/NGA", 200, lambda d: d["country"]["iso3"] == "NGA"),
    ("Country 404", "/api/country/XXX", 404, None),
    ("Query NGA 7422", "/api/query?isco08=7422&country=NGA", 200, lambda d: "occupation" in d or "isco08" in str(d).lower()),
    ("Query invalid country", "/api/query?isco08=7422&country=ZZZ", 400, None),
    ("Query invalid ISCO", "/api/query?isco08=abcd&country=NGA", 400, None),
    ("Crosswalk 7422", "/api/crosswalk/7422", 200, lambda d: d["isco08"] == "7422"),
    ("Crosswalk invalid", "/api/crosswalk/abcd", 400, None),
    ("Crosswalk 404", "/api/crosswalk/0000", 404, None),
    ("Recalibrated NGA 9211", "/api/recalibrated/NGA/9211", 200, lambda d: d["country"] == "NGA"),
    ("Recalibrated 404 country", "/api/recalibrated/XXX/9211", 404, None),
    ("Policymaker NGA", "/api/policymaker/NGA", 200, lambda d: d["country_code"] == "NGA"),
    ("Policymaker 404", "/api/policymaker/KEN", 404, None),  # KEN may not have policymaker data
    ("Root", "/", 200, lambda d: "name" in d),
]


def run_test(name, path, expected_status, check_fn):
    url = BASE_URL + path
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req)
        status = resp.getcode()
        body = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {}

    ok = status == expected_status
    if ok and check_fn:
        try:
            ok = check_fn(body)
        except Exception:
            ok = False

    symbol = "✅" if ok else "❌"
    print(f"  {symbol} {name}: {status} (expected {expected_status})")
    if not ok:
        print(f"     Response: {json.dumps(body, indent=2)[:300]}")
    return ok


def main():
    print(f"\n🧪 UNMAPPED API Test Suite\n   Target: {BASE_URL}\n")
    passed = 0
    failed = 0
    for args in TESTS:
        if run_test(*args):
            passed += 1
        else:
            failed += 1

    print(f"\n📊 Results: {passed}/{passed + failed} passed")
    if failed:
        print(f"   ⚠️  {failed} test(s) failed")
        sys.exit(1)
    else:
        print("   🎉 All tests passed!")


if __name__ == "__main__":
    main()
