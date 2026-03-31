import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { verify } from "jsonwebtoken";

/**
 * Protects routes that require an authenticated user by validating
 * a signed bearer JWT and attaching minimal user context on request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is required");
    }
    this.jwtSecret = secret;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers["authorization"];
    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException("Missing or malformed authorization token.");
    }

    const parsed = this.parseJwtToken(token);
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

  private parseJwtToken(token: string): { sub: string; email: string; role: "owner" | "admin" } | null {
    try {
      const parsed = verify(token, this.jwtSecret);
      if (typeof parsed !== "object" || parsed === null) {
        return null;
      }
      if (
        typeof (parsed as Record<string, unknown>).sub === "string" &&
        typeof (parsed as Record<string, unknown>).email === "string" &&
        ((parsed as Record<string, unknown>).role === "owner" ||
          (parsed as Record<string, unknown>).role === "admin")
      ) {
        return parsed as { sub: string; email: string; role: "owner" | "admin" };
      }
      return null;
    } catch {
      return null;
    }
  }
}
