export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "admin";
}
