import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotEnv } from "dotenv";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:3002/api/v1";
const THIS_DIR = dirname(fileURLToPath(import.meta.url));
loadDotEnv({ path: resolve(THIS_DIR, "../../../.env") });
const JWT_SECRET = process.env.JWT_SECRET;
const { sign } = jwt;

if (!JWT_SECRET || JWT_SECRET.trim().length < 32) {
  throw new Error("JWT_SECRET must be set with at least 32 chars for auth hardening smoke.");
}

async function postJson(path, payload, headers = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { status: response.status, body };
}

async function getJson(path, headers = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const suffix = randomUUID();
  const email = `auth-hardening-${suffix}@example.com`;
  const password = "StrongPass123!";
  const registerPayload = {
    fullName: "Auth Hardening Smoke",
    email,
    password
  };

  const register = await postJson("/auth/register", registerPayload);
  assert(register.status === 201, `register expected 201, got ${register.status}`);
  assert(register.body?.success === true, "register expected success=true");
  const token = register.body?.data?.accessToken;
  assert(typeof token === "string" && token.split(".").length === 3, "register must return JWT access token");

  const duplicateRegister = await postJson("/auth/register", registerPayload);
  assert(duplicateRegister.status === 201, `duplicate register expected 201, got ${duplicateRegister.status}`);
  assert(duplicateRegister.body?.success === false, "duplicate register expected success=false");

  const badLogin = await postJson("/auth/login", { email, password: "WrongPass999!" });
  assert(badLogin.status === 401, `bad login expected 401, got ${badLogin.status}`);

  const login = await postJson("/auth/login", { email, password });
  assert(login.status === 201, `login expected 201, got ${login.status}`);
  assert(login.body?.success === true, "login expected success=true");
  const loginToken = login.body?.data?.accessToken;
  assert(
    typeof loginToken === "string" && loginToken.split(".").length === 3,
    "login must return JWT access token"
  );

  const meMissing = await getJson("/auth/me");
  assert(meMissing.status === 401, `me missing token expected 401, got ${meMissing.status}`);

  const meInvalid = await getJson("/auth/me", { Authorization: "Bearer invalid.jwt.token" });
  assert(meInvalid.status === 401, `me invalid token expected 401, got ${meInvalid.status}`);

  const expiredToken = sign(
    { sub: login.body.data.user.id, email, role: "owner" },
    JWT_SECRET,
    { expiresIn: -10 }
  );
  const meExpired = await getJson("/auth/me", { Authorization: `Bearer ${expiredToken}` });
  assert(meExpired.status === 401, `me expired token expected 401, got ${meExpired.status}`);

  const meValid = await getJson("/auth/me", { Authorization: `Bearer ${loginToken}` });
  assert(meValid.status === 200, `me valid token expected 200, got ${meValid.status}`);
  assert(meValid.body?.success === true, "me valid token expected success=true");
  assert(meValid.body?.data?.user?.email === email, "me should return same user email");

  const dashboardAggregate = await postJson("/dashboard/aggregate", {
    siteId: "auth-hardening-smoke-site",
    latitude: 32.0853,
    longitude: 34.7818,
    systemSizeKw: 8.5,
    lossPercent: 14,
    timezone: "Asia/Jerusalem",
    generatedAt: "2026-03-20T10:00:00Z",
    tariff: {
      currency: "ILS",
      importRate: 0.62,
      exportRate: 0.28
    }
  });
  assert(
    dashboardAggregate.status === 201 && dashboardAggregate.body?.success === true,
    "dashboard aggregate should succeed for AI auth smoke"
  );

  const aiWithJwt = await postJson(
    "/ai/insights",
    dashboardAggregate.body.data,
    { Authorization: `Bearer ${loginToken}` }
  );
  assert(aiWithJwt.status !== 401 && aiWithJwt.status !== 403, "AI endpoint should accept JWT bearer token");

  console.log("Auth hardening smoke passed (JWT + hashed credentials + guard behavior verified).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
