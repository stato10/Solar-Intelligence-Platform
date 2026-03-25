import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

/**
 * JwtAuthGuard (task 7.8 — Change F)
 *
 * Protects routes that require an authenticated user.
 * Validates the dev-token format used by the scaffold auth layer
 * (`dev.<base64url-encoded-json>`), consistent with AuthService.me().
 *
 * When real JWT (Passport + JwtStrategy) is introduced in a future hardening
 * phase, replace the body of parseDevToken() only — no other changes needed.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers["authorization"];
    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException("Missing or malformed authorization token.");
    }

    const parsed = this.parseDevToken(token);
    if (!parsed) {
      throw new UnauthorizedException("Invalid authorization token.");
    }

    // Attach minimal user context to request for downstream use.
    (request as Request & { user: unknown }).user = parsed;
    return true;
  }

  private extractToken(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.replace("Bearer ", "").trim();
  }

  private parseDevToken(token: string): { email: string; role: string } | null {
    try {
      const [, encoded] = token.split(".");
      if (!encoded) {
        return null;
      }
      const decoded = Buffer.from(encoded, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded) as unknown;
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "email" in parsed &&
        "role" in parsed &&
        typeof (parsed as Record<string, unknown>).email === "string" &&
        typeof (parsed as Record<string, unknown>).role === "string"
      ) {
        return parsed as { email: string; role: string };
      }
      return null;
    } catch {
      return null;
    }
  }
}
