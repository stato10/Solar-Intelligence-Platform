import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthUser } from "./interfaces/auth-user.interface";

interface JwtClaims {
  sub: string;
  email: string;
  role: "owner" | "admin";
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is required");
    }
    this.jwtSecret = secret;
  }

  async register(payload: RegisterDto) {
    const email = payload.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return this.buildResponse({ message: "User already exists" }, false);
    }

    const passwordHash = await hash(payload.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        fullName: payload.fullName,
        email,
        role: "owner",
        passwordHash
      }
    });
    const publicUser = this.publicUser(newUser);

    return this.buildResponse(
      {
        user: publicUser,
        accessToken: this.createJwtToken(publicUser)
      },
      true
    );
  }

  async login(payload: LoginDto) {
    const email = payload.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await compare(payload.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const publicUser = this.publicUser(user);

    return this.buildResponse(
      {
        user: publicUser,
        accessToken: this.createJwtToken(publicUser)
      },
      true
    );
  }

  async me(authHeader?: string) {
    const token = this.extractToken(authHeader);
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }

    const parsed = this.parseJwtToken(token);
    if (!parsed) {
      throw new UnauthorizedException("Invalid token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parsed.sub }
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.buildResponse({ user: this.publicUser(user) }, true);
  }

  private publicUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: "owner" | "admin";
  }): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
  }

  private createJwtToken(user: AuthUser): string {
    const claims: JwtClaims = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    return sign(claims, this.jwtSecret, { expiresIn: "7d" });
  }

  private parseJwtToken(token: string): JwtClaims | null {
    try {
      const parsed = verify(token, this.jwtSecret);
      if (typeof parsed !== "object" || parsed === null) {
        return null;
      }
      if (
        typeof (parsed as Record<string, unknown>).sub !== "string" ||
        typeof (parsed as Record<string, unknown>).email !== "string" ||
        ((parsed as Record<string, unknown>).role !== "owner" &&
          (parsed as Record<string, unknown>).role !== "admin")
      ) {
        return null;
      }
      return parsed as JwtClaims;
    } catch {
      return null;
    }
  }

  private extractToken(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.replace("Bearer ", "").trim();
  }

  private buildResponse(data: unknown, success: boolean) {
    return {
      success,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
