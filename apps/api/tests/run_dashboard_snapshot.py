import json
import os
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = ROOT / "apps" / "api" / "tests" / "fixtures" / "dashboard" / "v1"
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3002/api/v1")
API_URL = f"{API_BASE_URL}/dashboard/aggregate"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def post_json(url: str, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def typify(value):
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float)):
        return "number"
    if isinstance(value, str):
        return "string"
    if value is None:
        return "null"
    if isinstance(value, list):
        if not value:
            return []
        return [typify(value[0])]
    if isinstance(value, dict):
        return {key: typify(value[key]) for key in sorted(value.keys())}
    return "unknown"


def main():
    input_payload = load_json(FIXTURES_DIR / "input-baseline.json")
    expected_shape = load_json(FIXTURES_DIR / "expected-shape-baseline.json")

    status, envelope = post_json(API_URL, input_payload)
    if status != 201:
        raise SystemExit(f"Expected HTTP 201, got {status}")
    if envelope.get("success") is not True:
        raise SystemExit("Dashboard response did not indicate success.")

    actual_shape = typify(envelope["data"])
    if actual_shape != expected_shape:
        print("Dashboard snapshot shape mismatch.")
        print("--- Expected ---")
        print(json.dumps(expected_shape, indent=2, sort_keys=True))
        print("--- Actual ---")
        print(json.dumps(actual_shape, indent=2, sort_keys=True))
        raise SystemExit(1)

    print("Dashboard snapshot shape test passed.")


if __name__ == "__main__":
    main()
