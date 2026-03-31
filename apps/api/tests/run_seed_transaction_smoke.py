import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


API_BASE = "http://localhost:3002/api/v1"
DEMO_SEED_URL = f"{API_BASE}/dashboard/demo/seed"
USERS_URL = f"{API_BASE}/users"
SITES_URL = f"{API_BASE}/sites"


def post_json(url: str, payload: dict):
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def get_json(url: str, query: dict):
    encoded_query = urllib.parse.urlencode(query)
    request = urllib.request.Request(
        f"{url}?{encoded_query}",
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def count_users(email_fragment: str) -> int:
    status, envelope = get_json(USERS_URL, {"page": 1, "limit": 100, "search": email_fragment})
    if status != 200:
        raise RuntimeError(f"Unexpected users status code: {status}")
    return len(envelope.get("data", []))


def count_sites(site_name_fragment: str) -> int:
    status, envelope = get_json(SITES_URL, {"page": 1, "limit": 100, "search": site_name_fragment})
    if status != 200:
        raise RuntimeError(f"Unexpected sites status code: {status}")
    return len(envelope.get("data", []))


def main():
    seed_key = f"tx-smoke-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
    email_fragment = f"demo.owner+{seed_key}@sip.local"
    site_name_fragment = f"Demo Solar Site {seed_key}"

    before_users = count_users(email_fragment)
    before_sites = count_sites(site_name_fragment)
    if before_users != 0 or before_sites != 0:
        raise SystemExit("Seed key collision detected; retry the smoke test.")

    try:
        post_json(
            DEMO_SEED_URL,
            {
                "seedKey": seed_key,
                "failAfterStep": "site",
            },
        )
        raise SystemExit("Expected demo seed failure was not triggered.")
    except urllib.error.HTTPError as error:
        if error.code < 500:
            raise SystemExit(f"Expected 5xx for injected failure, got {error.code}") from error

    users_after_failure = count_users(email_fragment)
    sites_after_failure = count_sites(site_name_fragment)
    if users_after_failure != 0 or sites_after_failure != 0:
        raise SystemExit(
            "Rollback failed: partial seed records remained "
            f"(users={users_after_failure}, sites={sites_after_failure})."
        )

    status, success_envelope = post_json(DEMO_SEED_URL, {"seedKey": seed_key})
    if status != 201:
        raise SystemExit(f"Expected successful seed status 201, got {status}")
    if success_envelope.get("success") is not True:
        raise SystemExit("Successful seed envelope has success=false.")

    users_after_success = count_users(email_fragment)
    sites_after_success = count_sites(site_name_fragment)
    if users_after_success != 1 or sites_after_success != 1:
        raise SystemExit(
            "Expected committed records after successful seed "
            f"(users={users_after_success}, sites={sites_after_success})."
        )

    print("Seed transaction smoke passed (rollback + commit behavior verified).")


if __name__ == "__main__":
    main()
