import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyConnectivity, dbStatus } from "./db/neo4j.js";
import { moviesRouter } from "./routes/movies.js";
import { peopleRouter } from "./routes/people.js";
import { recommendationsRouter } from "./routes/recommendations.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// Every request checks the last-known DB connectivity state and fails fast
// with a clear message instead of hanging or throwing a raw driver error.
app.use((req, res, next) => {
  if (req.path === "/api/health") return next();
  const status = dbStatus();
  if (!status.connected) {
    return res.status(503).json({
      error: "Database unavailable",
      detail: status.error || "Graph database connection has not been established yet.",
    });
  }
  next();
});

app.get("/api/health", async (req, res) => {
  const status = dbStatus();
  res.status(status.connected ? 200 : 503).json(status);
});

app.use("/api/movies", moviesRouter);
app.use("/api/people", peopleRouter);
app.use("/api/recommendations", recommendationsRouter);

app.use((err, req, res, next) => {
  console.error("[api]", err);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

async function start() {
  await verifyConnectivity();
  app.listen(PORT, () => {
    console.log(`[api] CineGraph server listening on http://localhost:${PORT}`);
  });

  // Keep retrying in the background if the DB wasn't reachable at boot, so
  // the app recovers on its own once CognoDB comes back without a restart.
  setInterval(() => {
    if (!dbStatus().connected) verifyConnectivity();
  }, 10_000);
}

start();
