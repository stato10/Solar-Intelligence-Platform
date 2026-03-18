export type UserRole = "owner" | "admin";

export interface UserEntity {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
