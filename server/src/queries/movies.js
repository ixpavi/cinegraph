import { runQuery } from "../db/neo4j.js";
import { toNative } from "../db/serialize.js";

/**
 * Paginated movie browse/search with average rating and genre list attached.
 * Single query, no N+1: aggregates ratings and genres per movie in one pass.
 */
export async function listMovies({ search = "", genre = "", limit = 24, offset = 0 } = {}) {
  const cypher = `
    MATCH (m:Movie)
    WHERE ($search = '' OR toLower(m.title) CONTAINS toLower($search))
      AND ($genre = '' OR EXISTS {
        MATCH (m)-[:IN_GENRE]->(g:Genre {name: $genre})
      })
    OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
    OPTIONAL MATCH (:User)-[r:RATED]->(m)
    WITH m, collect(DISTINCT g.name) AS genres, avg(r.score) AS avgRating, count(r) AS ratingCount
    RETURN m { .*, id: m.id } AS movie, genres, avgRating, ratingCount
    ORDER BY m.title ASC
    SKIP $offset LIMIT $limit
  `;
  const records = await runQuery(cypher, { search, genre, limit: neo4jInt(limit), offset: neo4jInt(offset) });
  return records.map((r) => ({
    ...toNative(r.movie),
    genres: r.genres,
    avgRating: r.avgRating ? Math.round(toNative(r.avgRating) * 10) / 10 : null,
    ratingCount: toNative(r.ratingCount),
  }));
}

export async function countMovies({ search = "", genre = "" } = {}) {
  const cypher = `
    MATCH (m:Movie)
    WHERE ($search = '' OR toLower(m.title) CONTAINS toLower($search))
      AND ($genre = '' OR EXISTS {
        MATCH (m)-[:IN_GENRE]->(g:Genre {name: $genre})
      })
    RETURN count(m) AS total
  `;
  const [row] = await runQuery(cypher, { search, genre });
  return toNative(row.total);
}

/**
 * Full detail for a single movie: genres, director(s), cast with role,
 * studio, and aggregate rating stats — one round trip.
 */
export async function getMovieDetail(id) {
  const cypher = `
    MATCH (m:Movie {id: $id})
    OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
    OPTIONAL MATCH (director:Person)-[:DIRECTED]->(m)
    OPTIONAL MATCH (actor:Person)-[role:ACTED_IN]->(m)
    OPTIONAL MATCH (studio:Studio)-[:PRODUCED]->(m)
    OPTIONAL MATCH (:User)-[r:RATED]->(m)
    RETURN m,
      collect(DISTINCT g.name) AS genres,
      collect(DISTINCT director { .id, .name, .photoUrl }) AS directors,
      collect(DISTINCT actor { .id, .name, .photoUrl, role: role.role }) AS cast,
      collect(DISTINCT studio.name)[0] AS studio,
      avg(r.score) AS avgRating,
      count(r) AS ratingCount
  `;
  const [row] = await runQuery(cypher, { id });
  if (!row) return null;
  return {
    ...toNative(row.m),
    genres: row.genres,
    directors: toNative(row.directors).filter((d) => d.id),
    cast: toNative(row.cast).filter((c) => c.id),
    studio: row.studio,
    avgRating: row.avgRating ? Math.round(toNative(row.avgRating) * 10) / 10 : null,
    ratingCount: toNative(row.ratingCount),
  };
}

/**
 * "More like this": a 2-hop traversal through shared actors AND shared genres,
 * scored by number of overlapping connections. This is the kind of query a
 * relational schema makes painful — it would need self-joins across a
 * movie_genre table and a movie_cast table, deduplicated and ranked, versus
 * one graph pattern here.
 */
export async function getSimilarMovies(id, limit = 8) {
  const cypher = `
    MATCH (m:Movie {id: $id})
    MATCH (m)-[:IN_GENRE|ACTED_IN|DIRECTED]-(shared)-[:IN_GENRE|ACTED_IN|DIRECTED]-(other:Movie)
    WHERE other.id <> m.id
    WITH other, count(DISTINCT shared) AS score
    OPTIONAL MATCH (other)-[:IN_GENRE]->(g:Genre)
    OPTIONAL MATCH (:User)-[r:RATED]->(other)
    WITH other, score, collect(DISTINCT g.name) AS genres, avg(r.score) AS avgRating, count(r) AS ratingCount
    RETURN other { .* } AS movie, score, genres, avgRating, ratingCount
    ORDER BY score DESC, avgRating DESC
    LIMIT $limit
  `;
  const records = await runQuery(cypher, { id, limit: neo4jInt(limit) });
  return records.map((r) => ({
    ...toNative(r.movie),
    genres: r.genres,
    sharedConnections: toNative(r.score),
    avgRating: r.avgRating ? Math.round(toNative(r.avgRating) * 10) / 10 : null,
    ratingCount: toNative(r.ratingCount),
  }));
}

export async function listGenres() {
  const cypher = `MATCH (g:Genre) RETURN g.name AS name ORDER BY name`;
  const records = await runQuery(cypher);
  return records.map((r) => r.name);
}

// Re-export a tiny helper so route files don't need to import neo4j-driver directly.
import neo4j from "neo4j-driver";
function neo4jInt(n) {
  return neo4j.int(n);
}
