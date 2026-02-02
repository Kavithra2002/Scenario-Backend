import { Router } from "express";

export const authorizerRoutes = Router();

// GET /api/authorizer/tasks – used by authorizer task-management page
authorizerRoutes.get("/tasks", (_req, res) => {
  res.json([]);
});
