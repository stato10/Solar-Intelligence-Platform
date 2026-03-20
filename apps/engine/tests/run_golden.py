import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
ENGINE_APP_DIR = ROOT / "apps" / "engine"
sys.path.append(str(ENGINE_APP_DIR))

from src.main import EngineCalculateV1Input, calculate_v1  # noqa: E402


FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "engine" / "v1"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def main():
    input_files = sorted(FIXTURES_DIR.glob("input-*.json"))
    if not input_files:
        raise SystemExit("No fixture inputs found.")

    failures = []
    for input_file in input_files:
        case_name = input_file.name.replace("input-", "").replace(".json", "")
        expected_file = FIXTURES_DIR / f"expected-{case_name}.json"
        if not expected_file.exists():
            failures.append(f"{case_name}: missing expected file {expected_file.name}")
            continue

        payload = load_json(input_file)
        expected = load_json(expected_file)

        result = calculate_v1(EngineCalculateV1Input.model_validate(payload)).model_dump()
        actual_norm = normalize(result)
        expected_norm = normalize(expected)
        if actual_norm != expected_norm:
            failures.append(f"{case_name}: golden mismatch")
            continue

        # Determinism check: second run must be identical.
        second = calculate_v1(EngineCalculateV1Input.model_validate(payload)).model_dump()
        if normalize(second) != actual_norm:
            failures.append(f"{case_name}: nondeterministic output across repeated runs")

    if failures:
        print("Golden test failures:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(f"Golden tests passed for {len(input_files)} scenario(s).")


if __name__ == "__main__":
    main()
