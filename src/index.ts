import "dotenv/config";
import express from "express";
import cors from "cors";
import { authorizerRoutes } from "./routes/authorizer";
import { adminRoutes } from "./routes/admin";
import { systemAdminRoutes } from "./routes/system-admin";
import { healthRoutes } from "./routes/health";

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3001";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Health check (for frontend to verify backend is up)
app.use("/api", healthRoutes);
app.use("/api/authorizer", authorizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system-admin", systemAdminRoutes);

app.listen(PORT, () => {
  console.log(`[scenario-backend] Server running at http://localhost:${PORT}`);
  console.log(`[scenario-backend] CORS allowed for: ${FRONTEND_ORIGIN}`);
});
