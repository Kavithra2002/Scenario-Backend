import { Router } from "express";

export const adminRoutes = Router();

// GET /api/admin/reports – used by admin task-management page
adminRoutes.get("/reports", (_req, res) => {
  res.json([]);
});
