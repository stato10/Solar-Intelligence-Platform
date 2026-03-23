export function getApiBaseUrl(): string {
  // Keep current behavior unchanged for 6.1.
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api/v1";
}
