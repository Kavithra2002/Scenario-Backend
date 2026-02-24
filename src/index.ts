import "dotenv/config";
import express from "express";
import cors from "cors";
import { checkDatabaseConnection } from "./db";
import { authRoutes } from "./routes/auth";
import { authorizerRoutes } from "./routes/authorizer";
import { adminRoutes } from "./routes/admin";
import { systemAdminRoutes } from "./routes/system-admin";
import { healthRoutes } from "./routes/health";

const app = express();
const PORT = process.env.PORT ?? 4000;
// Allow frontend origin(s). Use comma-separated list for multiple, or single URL.
const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || frontendOrigins.includes(origin)) {
        cb(null, origin || frontendOrigins[0]);
      } else {
        console.warn("[scenario-backend] CORS rejected origin:", origin, "| allowed:", frontendOrigins.join(", "));
        cb(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Log every request (helps debug "Failed to fetch" – if you never see the request here, the frontend isn’t reaching the backend)
app.use((req, _res, next) => {
  const origin = req.headers.origin ?? "(none)";
  console.log(`[scenario-backend] ${req.method} ${req.url} | Origin: ${origin}`);
  next();
});

// Health check (for frontend to verify backend is up)
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/authorizer", authorizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system-admin", systemAdminRoutes);

async function start() {
  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    console.log("[scenario-backend] Database successfully connected.");
  } else {
    console.log("[scenario-backend] Database not connected.");
  }

  app.listen(PORT, () => {
    console.log(`[scenario-backend] Server running at http://localhost:${PORT}`);
    console.log(`[scenario-backend] CORS allowed for: ${frontendOrigins.join(", ")}`);
    console.log(`[scenario-backend] Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`[scenario-backend] Watch this terminal for request logs and errors when you try to sign in.`);
  });
}

start();
