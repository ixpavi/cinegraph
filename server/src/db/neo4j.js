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
 */
export async function runQuery(cypher, params = {}, { database } = {}) {
  const session = driver.session(database ? { database } : undefined);
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject());
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  await driver.close();
}
