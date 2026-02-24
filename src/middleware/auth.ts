import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, Role, ROLES } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production-use-long-random-string";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticateJwt(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized", error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded.userId !== "number" || !ROLES.includes(decoded.role as Role)) {
      res.status(401).json({ message: "Unauthorized", error: "Invalid token payload" });
      return;
    }
    req.user = { userId: decoded.userId, role: decoded.role as Role };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized", error: "Invalid or expired token" });
  }
}

export function requireSystemAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized", error: "Authentication required" });
    return;
  }
  if (req.user.role !== "system-admin") {
    res.status(403).json({ message: "Forbidden", error: "System admin role required" });
    return;
  }
  next();
}
