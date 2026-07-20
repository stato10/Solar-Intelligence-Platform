import json
import os
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = ROOT / "apps" / "api" / "tests" / "fixtures" / "dashboard" / "v1"
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3002/api/v1")
API_URL = f"{API_BASE_URL}/dashboard/aggregate"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def post_json(url: str, payload: dict, correlation_id: str):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-correlation-id": correlation_id,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        headers = dict(response.getheaders())
        return response.getcode(), json.loads(response.read().decode("utf-8")), headers


def assert_contract_shape(envelope: dict):
    if envelope.get("success") is not True:
        return "Envelope success flag is not true."
    if "data" not in envelope:
        return "Envelope missing data."
    if "meta" not in envelope:
        return "Envelope missing meta."

    payload = envelope["data"]
    required = [
        "siteId",
        "generatedAt",
        "source",
        "forecast",
        "soiling",
        "heat",
        "risks",
        "optimization",
        "financial",
        "benchmark",
        "selfConsumption",
        "providers",
    ]
    for key in required:
        if key not in payload:
            return f"Missing dashboard field: {key}"

    if not isinstance(payload.get("optimization", {}).get("recommendations"), list):
        return "optimization.recommendations is not an array."

    return None


def main():
    input_files = sorted(FIXTURES_DIR.glob("input-*.json"))
    if not input_files:
        raise SystemExit("No dashboard fixture inputs found.")

    failures = []
    for input_file in input_files:
        case_name = input_file.name.replace("input-", "").replace(".json", "")
        payload = load_json(input_file)
        correlation_id = f"dashboard-contract-{case_name}"

        try:
            status, response, headers = post_json(API_URL, payload, correlation_id)
        except urllib.error.HTTPError as error:
            failures.append(f"{case_name}: HTTPError {error.code}")
            continue
        except Exception as error:  # noqa: BLE001
            failures.append(f"{case_name}: request failed ({error})")
            continue

        if status != 201:
            failures.append(f"{case_name}: expected 201, got {status}")
            continue

        shape_error = assert_contract_shape(response)
        if shape_error:
            failures.append(f"{case_name}: {shape_error}")

        echo_id = headers.get("x-correlation-id")
        if echo_id != correlation_id:
            failures.append(f"{case_name}: correlation id not echoed correctly")

    if failures:
        print("Dashboard contract smoke failures:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(f"Dashboard contract smoke passed for {len(input_files)} scenario(s).")


if __name__ == "__main__":
    main()
