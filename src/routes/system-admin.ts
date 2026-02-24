import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { query } from "../db";
import { authenticateJwt, requireSystemAdmin } from "../middleware/auth";
import {
  UserRow,
  SystemAdminUserResponse,
  Role,
  ROLES,
  nameToFirstLast,
  firstLastToName,
} from "../types/auth";

export const systemAdminRoutes = Router();

const integrationRouter = Router();

// GET /api/system-admin/integration/database
integrationRouter.get("/database", (_req, res) => {
  res.json({
    host: "",
    port: "",
    databaseName: "",
    username: "",
    password: "",
  });
});

// PUT /api/system-admin/integration/database
integrationRouter.put("/database", (req, res) => {
  res.json({ success: true });
});

// GET /api/system-admin/integration/server
integrationRouter.get("/server", (_req, res) => {
  res.json({
    apiBaseUrl: "",
    requestTimeoutMs: 10000,
    environment: "development",
  });
});

// PUT /api/system-admin/integration/server
integrationRouter.put("/server", (req, res) => {
  res.json({ success: true });
});

// GET /api/system-admin/integration/config
integrationRouter.get("/config", (_req, res) => {
  res.json({ entries: [] });
});

// PUT /api/system-admin/integration/config
integrationRouter.put("/config", (req, res) => {
  res.json({ success: true });
});

// POST /api/system-admin/integration/database/test
integrationRouter.post("/database/test", (req, res) => {
  res.json({ success: true, message: "Connection test (stub)" });
});

systemAdminRoutes.use("/integration", integrationRouter);

// --- User management (protected: system-admin only) ---

function toSystemAdminUserResponse(row: UserRow): SystemAdminUserResponse {
  const { firstName, lastName } = nameToFirstLast(row.name);
  const role = ROLES.includes(row.role as Role) ? (row.role as Role) : "user";
  return {
    id: row.id,
    firstName,
    lastName,
    email: row.email,
    contact: null,
    role,
    lastUpdated: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

// GET /api/system-admin/users – optional query: role, search
systemAdminRoutes.get(
  "/users",
  authenticateJwt,
  requireSystemAdmin,
  async (req, res: Response) => {
    const role = typeof req.query.role === "string" ? req.query.role.trim() : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

    let sql =
      "SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE 1=1";
    const params: unknown[] = [];
    let idx = 1;
    if (role && ROLES.includes(role as Role)) {
      sql += ` AND role = $${idx}`;
      params.push(role);
      idx++;
    }
    if (search) {
      sql += ` AND (email ILIKE $${idx} OR name ILIKE $${idx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }
    sql += " ORDER BY updated_at DESC NULLS LAST, id";

    const { rows } = await query<UserRow>(sql, params);
    const users = rows.map(toSystemAdminUserResponse);
    res.json({ users });
  }
);

// POST /api/system-admin/users
systemAdminRoutes.post(
  "/users",
  authenticateJwt,
  requireSystemAdmin,
  async (req, res: Response) => {
    const body = req.body ?? {};
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : null;
    const role = typeof body.role === "string" && ROLES.includes(body.role as Role) ? (body.role as Role) : "user";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    if (!password || password.length < 1) {
      res.status(400).json({ message: "Password is required" });
      return;
    }

    const { rowCount } = await query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (rowCount > 0) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const name = firstLastToName(firstName, lastName);

    const { rows } = await query<UserRow>(
      `INSERT INTO users (email, password_hash, name, role, created_at, updated_at, plain_password)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
       RETURNING id, email, password_hash, name, role, created_at, updated_at`,
      [email, password_hash, name || null, role, password]
    );
    const user = rows[0];
    if (!user) {
      res.status(500).json({ message: "Failed to create user" });
      return;
    }
    const responseUser: SystemAdminUserResponse = {
      ...toSystemAdminUserResponse(user),
      contact: contact ?? null,
    };
    res.status(201).json({ user: responseUser });
  }
);

// PATCH /api/system-admin/users/:id
systemAdminRoutes.patch(
  "/users/:id",
  authenticateJwt,
  requireSystemAdmin,
  async (req, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }
    const body = req.body ?? {};
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const contact = typeof body.contact === "string" ? body.contact.trim() : undefined;
    const role = typeof body.role === "string" && ROLES.includes(body.role as Role) ? (body.role as Role) : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    const { rows: existing } = await query<UserRow>(
      "SELECT id, email, name, role FROM users WHERE id = $1",
      [id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const current = existing[0];

    if (email !== undefined && email !== current.email) {
      const { rowCount } = await query("SELECT 1 FROM users WHERE email = $1 AND id != $2", [email, id]);
      if (rowCount > 0) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const newName = firstLastToName(
      firstName ?? nameToFirstLast(current.name).firstName,
      lastName ?? nameToFirstLast(current.name).lastName
    );
    updates.push(`name = $${idx++}`);
    params.push(newName || null);

    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      params.push(email);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      params.push(role);
    }
    if (password !== undefined && password.length > 0) {
      const password_hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`);
      params.push(password_hash);
      updates.push(`plain_password = $${idx++}`);
      params.push(password);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);
    const setClause = updates.join(", ");
    const idPlaceholder = params.length;
    const { rows: updated } = await query<UserRow>(
      `UPDATE users SET ${setClause} WHERE id = $${idPlaceholder} RETURNING id, email, password_hash, name, role, created_at, updated_at`,
      params
    );
    const user = updated[0];
    if (!user) {
      res.status(500).json({ message: "Update failed" });
      return;
    }
    const responseUser: SystemAdminUserResponse = {
      ...toSystemAdminUserResponse(user),
      contact: contact ?? null,
    };
    res.json({ user: responseUser });
  }
);

// DELETE /api/system-admin/users/:id
systemAdminRoutes.delete(
  "/users/:id",
  authenticateJwt,
  requireSystemAdmin,
  async (req, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }
    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [id]);
    if (rowCount === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, message: "User deleted" });
  }
);
