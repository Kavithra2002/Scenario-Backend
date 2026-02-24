export const ROLES = ["user", "admin", "system-admin", "authorizer"] as const;
export type Role = (typeof ROLES)[number];

export interface JwtPayload {
  userId: number;
  role: Role;
  iat?: number;
  exp?: number;
}

/** Matches DB: id, email, password_hash, name, role, created_at, updated_at. No plain_password. */
export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  role: string;
  created_at: Date | null;
  updated_at: Date | null;
}

/** User object returned in auth responses (login, me) */
export interface AuthUserResponse {
  id: number;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

/** User object in system-admin list/detail (includes contact, lastUpdated) */
export interface SystemAdminUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contact: string | null;
  role: Role;
  lastUpdated: string | null;
}

export function nameToFirstLast(name: string | null): { firstName: string; lastName: string } {
  if (!name || !name.trim()) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function firstLastToName(firstName?: string, lastName?: string): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (!f && !l) return "";
  return [f, l].filter(Boolean).join(" ");
}
