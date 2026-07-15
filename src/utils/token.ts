/**
 * Extract JWT from Authorization header.
 * Handles: "Bearer <token>", "Bearer Bearer <token>", or raw token.
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.trim()) return null;

  let value = authHeader.trim();

  while (/^Bearer\s+/i.test(value)) {
    value = value.replace(/^Bearer\s+/i, "").trim();
  }

  return value.length > 0 ? value : null;
}
