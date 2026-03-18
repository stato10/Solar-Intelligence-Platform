import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthUser } from "./interfaces/auth-user.interface";

interface InMemoryAuthRecord extends AuthUser {
  password: string;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, InMemoryAuthRecord>();

  register(payload: RegisterDto) {
    const email = payload.email.toLowerCase();
    const existing = this.users.get(email);

    if (existing) {
      return this.buildResponse(
        {
          message: "User already exists"
        },
        false
      );
    }

    const newUser: InMemoryAuthRecord = {
      id: randomUUID(),
      fullName: payload.fullName,
      email,
      role: "owner",
      password: payload.password
    };
    this.users.set(email, newUser);

    return this.buildResponse(
      {
        user: this.publicUser(newUser),
        accessToken: this.createDevToken(newUser)
      },
      true
    );
  }

  login(payload: LoginDto) {
    const email = payload.email.toLowerCase();
    const user = this.users.get(email);

    if (!user || user.password !== payload.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildResponse(
      {
        user: this.publicUser(user),
        accessToken: this.createDevToken(user)
      },
      true
    );
  }

  me(authHeader?: string) {
    const token = this.extractToken(authHeader);
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }

    const parsed = this.parseDevToken(token);
    if (!parsed) {
      throw new UnauthorizedException("Invalid token");
    }

    const user = this.users.get(parsed.email);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.buildResponse({ user: this.publicUser(user) }, true);
  }

  private publicUser(user: InMemoryAuthRecord): AuthUser {
    const { password, ...publicUser } = user;
    void password;
    return publicUser;
  }

  private createDevToken(user: AuthUser) {
    const encoded = Buffer.from(
      JSON.stringify({ email: user.email, role: user.role }),
      "utf8"
    ).toString("base64url");
    return `dev.${encoded}`;
  }

  private parseDevToken(token: string): { email: string; role: string } | null {
    try {
      const [, encoded] = token.split(".");
      if (!encoded) {
        return null;
      }

      const decoded = Buffer.from(encoded, "base64url").toString("utf8");
      return JSON.parse(decoded) as { email: string; role: string };
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
