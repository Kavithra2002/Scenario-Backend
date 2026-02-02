import { Router } from "express";

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

// GET /api/system-admin/users – used by user-list page
systemAdminRoutes.get("/users", (_req, res) => {
  res.json([]);
});
