import neo4j from "neo4j-driver";

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error(
    "[db] Missing NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD env vars. " +
      "Copy server/.env.example to server/.env and fill them in."
  );
}

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  { maxConnectionPoolSize: 20 }
);

let verified = false;
let lastError = null;

export async function verifyConnectivity() {
  try {
    await driver.verifyConnectivity();
    verified = true;
    lastError = null;
    console.log("[db] Connected to graph database.");
  } catch (err) {
    verified = false;
    lastError = err.message;
    console.error("[db] Could not connect to graph database:", err.message);
  }
  return verified;
}

export function dbStatus() {
  return { connected: verified, error: lastError };
}

/**
 * Run a parameterised Cypher query in a managed session and return plain records.
 * Never string-concatenate Cypher — always pass `params`.
 *
 * Retries once on driver-flagged transient errors (`retriable: true`) —
 * the free CognoDB instance backing this project has been observed
 * dropping connections under load ("Connection was closed by server",
 * `code: ServiceUnavailable`), which the driver correctly marks
 * retriable; a fresh session on retry gets a healthy pooled connection.
 * See the README's Deployment section.
 */
export async function runQuery(cypher, params = {}, { database, attempts = 4 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    const session = driver.session(database ? { database } : undefined);
    try {
      const result = await session.run(cypher, params);
      return result.records.map((r) => r.toObject());
    } catch (err) {
      if (!err.retriable || i === attempts) throw err;
      const delay = 400 * i;
      console.warn(`[db] Transient query error (attempt ${i}/${attempts}), retrying in ${delay}ms: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      await session.close();
    }
  }
}

export async function closeDriver() {
  await driver.close();
}
