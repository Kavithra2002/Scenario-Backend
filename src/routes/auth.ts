import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db";
import { authenticateJwt, AuthRequest } from "../middleware/auth";
import {
  UserRow,
  AuthUserResponse,
  Role,
  ROLES,
  nameToFirstLast,
} from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production-use-long-random-string";
const JWT_EXPIRY = process.env.JWT_EXPIRY ?? "7d";

export const authRoutes = Router();

function toAuthUserResponse(row: UserRow): AuthUserResponse {
  const { firstName, lastName } = nameToFirstLast(row.name);
  const role = ROLES.includes(row.role as Role) ? (row.role as Role) : "user";
  return {
    id: row.id,
    email: row.email,
    role,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  };
}

// POST /api/auth/login
authRoutes.post("/login", async (req, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const { rows } = await query<UserRow>(
      "SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      console.log("[scenario-backend] Login failed: no user for email", email.trim().toLowerCase());
      res.status(401).json({ message: "Invalid email or password", error: "Invalid email or password" });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log("[scenario-backend] Login failed: password mismatch for email", email.trim().toLowerCase());
      res.status(401).json({ message: "Invalid email or password", error: "Invalid email or password" });
      return;
    }

    // Update plain_password with the password just entered (per requirement; avoid in production)
    try {
      await query(
        "UPDATE users SET plain_password = $1, updated_at = NOW() WHERE id = $2",
        [password, user.id]
      );
    } catch (e) {
      console.warn("[scenario-backend] Could not update plain_password:", (e as Error).message);
    }

    const role = ROLES.includes(user.role as Role) ? (user.role as Role) : "user";
    const token = jwt.sign(
      { userId: user.id, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as jwt.SignOptions
    );
    const userResponse = toAuthUserResponse(user);
    res.status(200).json({ accessToken: token, user: userResponse });
  } catch (err) {
    console.error("[scenario-backend] POST /api/auth/login error:", err);
    res.status(500).json({ message: "Internal server error", error: (err as Error).message });
  }
});

// GET /api/auth/me — requires Bearer token
authRoutes.get("/me", authenticateJwt, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!.userId;
  const { rows } = await query<UserRow>(
    "SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE id = $1",
    [userId]
  );
  const user = rows[0];
  if (!user) {
    res.status(401).json({ message: "Unauthorized", error: "User not found" });
    return;
  }
  res.status(200).json({ user: toAuthUserResponse(user) });
});
