import { app } from "./app.js";
import { verifyConnectivity, dbStatus } from "./db/neo4j.js";

const PORT = process.env.PORT || 4000;

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
