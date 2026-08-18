import { driver } from "../db/neo4j.js";
import { movies } from "./data/movies.js";
import { users } from "./data/users.js";
import { genres as allGenres } from "./data/genres.js";
import { posters } from "./data/posters.js";
import { personPhotos } from "./data/personPhotos.js";

/** Runs `fn` over `items` with at most `concurrency` in flight at once. */
async function runConcurrently(items, concurrency, fn) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

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

/**
 * Loads the full demo dataset into the given session: constraints, genres,
 * movies (+ cast, directors, studios, posters), users and ratings.
 * Idempotent (MERGE throughout) and safe to call on an already-populated
 * database — it clears prior CineGraph data first.
 *
 * Shared by the CLI seed script (npm run seed) and the API's self-healing
 * check (src/seed/ensureSeeded.js), since the free CognoDB instance backing
 * this project has been observed resetting itself to unrelated data —
 * see the README's Deployment section.
 */
export async function runSeed(session) {
  await runWithRetry(session, `CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE`);
  await runWithRetry(session, `CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE`);
  await runWithRetry(session, `CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE`);
  await runWithRetry(session, `CREATE CONSTRAINT studio_name IF NOT EXISTS FOR (s:Studio) REQUIRE s.name IS UNIQUE`);
  await runWithRetry(session, `CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`);

  // Deleted in batches (rather than one huge transaction) so a concurrent
  // writer touching unrelated nodes elsewhere in the graph can't collide
  // with this transaction and abort the whole delete. Batch size is a
  // balance: large enough to keep round-trips (and total latency) low —
  // this runs synchronously inside a serverless request when self-healing
  // — but small enough to stay a cheap, low-conflict transaction.
  let deletedTotal = 0;
  for (;;) {
    const result = await runWithRetry(
      session,
      `
      MATCH (n) WHERE n:Movie OR n:Person OR n:Genre OR n:Studio OR n:User
      WITH n LIMIT 5000
      DETACH DELETE n
      RETURN count(n) AS deleted
      `
    );
    const deleted = result.records[0].get("deleted").toNumber();
    deletedTotal += deleted;
    if (deleted === 0) break;
  }

  await runWithRetry(session, `UNWIND $genres AS name MERGE (g:Genre {name: name})`, { genres: allGenres });

  // Movie + cast writes run one at a time (concurrency of 1 — see
  // runConcurrently below). A concurrency of even 3 was enough to trip the
  // free CognoDB instance's overload protection during testing (it started
  // rejecting *all* new connections, including from unrelated fresh driver
  // instances, for roughly a minute). Each movie is still just one merged
  // Cypher statement instead of two, which keeps this fast enough to run
  // synchronously inside a serverless request when self-healing (see
  // ensureSeeded.js) without concurrency's risk on such a fragile instance.
  await runConcurrently(movies, 1, async (movie) => {
    const movieSession = driver.session();
    try {
      const directorId = slugify(movie.director);
      const castRows = movie.cast.map((c) => ({ id: slugify(c.name), name: c.name, role: c.role }));

      await runWithRetry(
        movieSession,
        `
        MERGE (m:Movie {id: $id})
        SET m.title = $title, m.year = $year, m.runtime = $runtime, m.plot = $plot, m.posterUrl = $posterUrl

        MERGE (studio:Studio {name: $studio})
        MERGE (studio)-[:PRODUCED]->(m)

        MERGE (director:Person {id: $directorId})
        ON CREATE SET director.name = $directorName, director.photoUrl = $directorPhotoUrl
        MERGE (director)-[:DIRECTED]->(m)

        WITH m
        UNWIND $genres AS genreName
        MATCH (g:Genre {name: genreName})
        MERGE (m)-[:IN_GENRE]->(g)

        WITH m
        UNWIND $cast AS c
        MERGE (actor:Person {id: c.id})
        ON CREATE SET actor.name = c.name, actor.photoUrl = c.photoUrl
        MERGE (actor)-[r:ACTED_IN]->(m)
        SET r.role = c.role
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
          directorPhotoUrl: personPhotos[directorId] ?? null,
          genres: movie.genres,
          cast: castRows.map((c) => ({ ...c, photoUrl: personPhotos[c.id] ?? null })),
        }
      );
    } finally {
      await movieSession.close();
    }
  });

  await runConcurrently(users, 1, async (user) => {
    const userSession = driver.session();
    try {
      const ratingRows = Object.entries(user.ratings).map(([movieId, score]) => ({ movieId, score }));
      await runWithRetry(
        userSession,
        `
        MERGE (u:User {id: $id}) SET u.name = $name
        WITH u
        UNWIND $ratings AS r
        MATCH (m:Movie {id: r.movieId})
        MERGE (u)-[rated:RATED]->(m)
        SET rated.score = r.score
        `,
        { id: user.id, name: user.name, ratings: ratingRows }
      );
    } finally {
      await userSession.close();
    }
  });

  const [{ movieCount, personCount, ratingCount }] = (
    await runWithRetry(
      session,
      `
      MATCH (m:Movie) WITH count(m) AS movieCount
      MATCH (p:Person) WITH movieCount, count(p) AS personCount
      MATCH (:User)-[r:RATED]->(:Movie) WITH movieCount, personCount, count(r) AS ratingCount
      RETURN movieCount, personCount, ratingCount
      `
    )
  ).records.map((r) => r.toObject());

  return {
    deleted: deletedTotal,
    movies: movieCount.toNumber(),
    people: personCount.toNumber(),
    ratings: ratingCount.toNumber(),
  };
}
