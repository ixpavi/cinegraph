import "dotenv/config";
import { driver, closeDriver } from "../db/neo4j.js";
import { runSeed } from "./runSeed.js";

async function main() {
  const session = driver.session();
  try {
    console.log("[seed] Verifying connectivity...");
    await driver.verifyConnectivity();

    console.log("[seed] Clearing previous data and loading demo dataset...");
    const result = await runSeed(session);

    console.log(
      `[seed] Done. Cleared ${result.deleted} pre-existing nodes. ` +
        `Loaded ${result.movies} movies, ${result.people} people, ${result.ratings} ratings.`
    );
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
