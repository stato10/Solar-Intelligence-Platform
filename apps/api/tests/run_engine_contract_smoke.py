import json
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = ROOT / "apps" / "engine" / "tests" / "fixtures" / "engine" / "v1"
API_URL = "http://localhost:3000/api/v1/integrations/engine/calculate/v1"


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
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def assert_contract_shape(envelope: dict):
    if envelope.get("success") is not True:
        return "Envelope success flag is not true."
    if "data" not in envelope:
        return "Envelope missing data."
    if "meta" not in envelope:
        return "Envelope missing meta."

    payload = envelope["data"]
    if payload.get("connected") is not True:
        return "Engine client reported disconnected."
    if payload.get("statusCode") != 200:
        return "Engine statusCode is not 200."
    engine_data = payload.get("data")
    if not isinstance(engine_data, dict):
        return "Engine data payload is missing."
    required_top = [
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
    ]
    for key in required_top:
        if key not in engine_data:
            return f"Missing engine data field: {key}"
    return None


def main():
    input_files = sorted(FIXTURES_DIR.glob("input-*.json"))
    if not input_files:
        raise SystemExit("No fixture inputs found.")

    failures = []
    for input_file in input_files:
        case_name = input_file.name.replace("input-", "").replace(".json", "")
        payload = load_json(input_file)
        try:
            status, response = post_json(API_URL, payload)
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

    if failures:
        print("Engine API contract smoke failures:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(f"Engine API contract smoke passed for {len(input_files)} scenario(s).")


if __name__ == "__main__":
    main()
