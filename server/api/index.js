import { app } from "../src/app.js";
import { verifyConnectivity, dbStatus } from "../src/db/neo4j.js";

// Vercel serverless entry point. Reuses the same Express app as local dev
// (src/app.js) — no app.listen() here, Vercel's Node runtime invokes the
// exported handler directly per request.
//
// Cold starts race the DB handshake against the first request, so this
// memoizes the initial connectivity check and awaits it before delegating,
// instead of relying on the polling loop `src/index.js` uses for local dev.
let warmup = null;

export default async function handler(req, res) {
  if (!warmup) warmup = verifyConnectivity();
  await warmup;
  if (!dbStatus().connected) warmup = null; // retry on the next cold path
  return app(req, res);
}
