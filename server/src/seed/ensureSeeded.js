import { driver } from "../db/neo4j.js";
import { runSeed } from "./runSeed.js";

// The free CognoDB instance backing this deployment has been observed
// spontaneously reverting to an unrelated ~36,000-node dataset (a
// platform-side issue — see README's Deployment section), which would
// otherwise make the live demo look broken to anyone who happens to load
// it right after a reset. Rather than depend on a human noticing and
// re-running `npm run seed`, every warm server instance re-checks the
// catalogue is actually populated and silently repairs it if not.
//
// Throttled per-instance (not per-request) since a live-population check
// is one extra query — cheap, but no reason to run it on every request.
let lastCheckedAt = 0;
let checking = null;
const RECHECK_INTERVAL_MS = 2 * 60 * 1000;

export async function ensureSeeded() {
  const now = Date.now();
  if (now - lastCheckedAt < RECHECK_INTERVAL_MS) return;
  if (checking) return checking;

  checking = (async () => {
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (m:Movie) RETURN count(m) AS total`);
      const total = result.records[0].get("total").toNumber();
      if (total > 0) {
        lastCheckedAt = now;
        return;
      }

      console.warn("[ensureSeeded] Movie catalogue is empty — reseeding automatically...");
      const seeded = await runSeed(session);
      console.warn(
        `[ensureSeeded] Reseeded: cleared ${seeded.deleted} nodes, loaded ${seeded.movies} movies.`
      );
      lastCheckedAt = Date.now();
    } catch (err) {
      console.error("[ensureSeeded] Check/reseed failed:", err.message);
      // Don't update lastCheckedAt on failure — retry on the next request.
    } finally {
      await session.close();
    }
  })();

  try {
    await checking;
  } finally {
    checking = null;
  }
}
