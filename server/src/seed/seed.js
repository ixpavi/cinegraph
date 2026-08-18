import "dotenv/config";
import { driver, closeDriver } from "../db/neo4j.js";
import { movies } from "./data/movies.js";
import { users } from "./data/users.js";
import { genres as allGenres } from "./data/genres.js";
import { posters } from "./data/posters.js";

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The free CognoDB instance used for this project has occasionally shown
 * transient "transaction conflict... modified concurrently" errors (a
 * platform-side condition, not caused by this app — see the README's
 * Deployment section). Both the driver and Neo4j flag these as retriable,
 * so retry with backoff instead of failing the whole seed run outright.
 */
async function runWithRetry(session, cypher, params = {}, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await session.run(cypher, params);
    } catch (err) {
      if (!err.retriable || i === attempts) throw err;
      const delay = 500 * i;
      console.warn(`[seed] Transient error (attempt ${i}/${attempts}), retrying in ${delay}ms: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function main() {
  const session = driver.session();
  try {
    console.log("[seed] Verifying connectivity...");
    await driver.verifyConnectivity();

    console.log("[seed] Ensuring constraints...");
    await runWithRetry(session, `CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE`);
    await runWithRetry(session, `CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE`);
    await runWithRetry(session, `CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE`);
    await runWithRetry(session, `CREATE CONSTRAINT studio_name IF NOT EXISTS FOR (s:Studio) REQUIRE s.name IS UNIQUE`);
    await runWithRetry(session, `CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`);

    console.log("[seed] Clearing previous demo data...");
    // Deleted in small batches (rather than one huge transaction) so a
    // concurrent writer touching unrelated nodes elsewhere in the graph
    // can't collide with this transaction and abort the whole delete.
    let deletedTotal = 0;
    for (;;) {
      const result = await runWithRetry(
        session,
        `
        MATCH (n) WHERE n:Movie OR n:Person OR n:Genre OR n:Studio OR n:User
        WITH n LIMIT 500
        DETACH DELETE n
        RETURN count(n) AS deleted
        `
      );
      const deleted = result.records[0].get("deleted").toNumber();
      deletedTotal += deleted;
      if (deleted === 0) break;
    }
    console.log(`[seed] Cleared ${deletedTotal} pre-existing nodes.`);

    console.log(`[seed] Loading ${allGenres.length} genres...`);
    await runWithRetry(
      session,
      `UNWIND $genres AS name MERGE (g:Genre {name: name})`,
      { genres: allGenres }
    );

    console.log(`[seed] Loading ${movies.length} movies, their people, genres and studios...`);
    for (const movie of movies) {
      const directorId = slugify(movie.director);
      const castRows = movie.cast.map((c) => ({ id: slugify(c.name), name: c.name, role: c.role }));

      await runWithRetry(
        session,
        `
        MERGE (m:Movie {id: $id})
        SET m.title = $title, m.year = $year, m.runtime = $runtime, m.plot = $plot, m.posterUrl = $posterUrl

        MERGE (studio:Studio {name: $studio})
        MERGE (studio)-[:PRODUCED]->(m)

        MERGE (director:Person {id: $directorId})
        ON CREATE SET director.name = $directorName
        MERGE (director)-[:DIRECTED]->(m)

        WITH m
        UNWIND $genres AS genreName
        MATCH (g:Genre {name: genreName})
        MERGE (m)-[:IN_GENRE]->(g)
        `,
        {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          runtime: movie.runtime,
          plot: movie.plot,
          posterUrl: posters[movie.id] ?? null,
          studio: movie.studio,
          directorId,
          directorName: movie.director,
          genres: movie.genres,
        }
      );

      await runWithRetry(
        session,
        `
        MATCH (m:Movie {id: $movieId})
        UNWIND $cast AS c
        MERGE (actor:Person {id: c.id})
        ON CREATE SET actor.name = c.name
        MERGE (actor)-[r:ACTED_IN]->(m)
        SET r.role = c.role
        `,
        { movieId: movie.id, cast: castRows }
      );
    }

    console.log(`[seed] Loading ${users.length} users and their ratings...`);
    for (const user of users) {
      await runWithRetry(session, `MERGE (u:User {id: $id}) SET u.name = $name`, { id: user.id, name: user.name });
      const ratingRows = Object.entries(user.ratings).map(([movieId, score]) => ({ movieId, score }));
      await runWithRetry(
        session,
        `
        MATCH (u:User {id: $userId})
        UNWIND $ratings AS r
        MATCH (m:Movie {id: r.movieId})
        MERGE (u)-[rated:RATED]->(m)
        SET rated.score = r.score
        `,
        { userId: user.id, ratings: ratingRows }
      );
    }

    const [{ movieCount, personCount, ratingCount }] = (
      await runWithRetry(session, `
        MATCH (m:Movie) WITH count(m) AS movieCount
        MATCH (p:Person) WITH movieCount, count(p) AS personCount
        MATCH (:User)-[r:RATED]->(:Movie) WITH movieCount, personCount, count(r) AS ratingCount
        RETURN movieCount, personCount, ratingCount
      `)
    ).records.map((r) => r.toObject());

    console.log(
      `[seed] Done. ${movieCount.toNumber()} movies, ${personCount.toNumber()} people, ${ratingCount.toNumber()} ratings loaded.`
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
