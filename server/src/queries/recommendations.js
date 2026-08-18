import neo4j from "neo4j-driver";
import { runQuery } from "../db/neo4j.js";
import { toNative } from "../db/serialize.js";

export async function listUsers() {
  const cypher = `
    MATCH (u:User)
    OPTIONAL MATCH (u)-[r:RATED]->(:Movie)
    WITH u, count(r) AS ratingCount
    RETURN u { .* } AS user, ratingCount
    ORDER BY u.name
  `;
  const records = await runQuery(cypher);
  return records.map((r) => ({ ...toNative(r.user), ratingCount: toNative(r.ratingCount) }));
}

export async function getUserRatings(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[r:RATED]->(m:Movie)
    RETURN m { .id, .title, .year, .posterUrl } AS movie, r.score AS score
    ORDER BY r.score DESC
  `;
  const records = await runQuery(cypher, { userId });
  return records.map((r) => ({ ...toNative(r.movie), score: toNative(r.score) }));
}

/**
 * Graph collaborative filtering: three hops out from the target user —
 * their rated movies, other users who rated those same movies highly, and
 * *those* users' other highly-rated movies — scored by number of
 * corroborating taste-neighbours and their average score. This "walk the
 * relationship graph outward" pattern is a single Cypher statement here;
 * in SQL it's a multi-way self-join across a ratings table that gets
 * slower and uglier with every extra hop.
 */
export async function getRecommendationsForUser(userId, limit = 10) {
  const cypher = `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:RATED]->(alreadySeen:Movie)
    WITH u, collect(alreadySeen.id) AS seenIds
    MATCH (u)-[ur:RATED]->(seen:Movie)
    WHERE ur.score >= 4
    MATCH (neighbour:User)-[nr:RATED]->(seen)
    WHERE neighbour.id <> u.id AND nr.score >= 4
    MATCH (neighbour)-[rec:RATED]->(recommended:Movie)
    WHERE rec.score >= 4 AND NOT recommended.id IN seenIds
    WITH recommended, count(DISTINCT neighbour) AS neighbourSupport, avg(rec.score) AS avgNeighbourScore
    OPTIONAL MATCH (recommended)-[:IN_GENRE]->(g:Genre)
    RETURN recommended { .* } AS movie,
      neighbourSupport,
      avgNeighbourScore,
      collect(DISTINCT g.name) AS genres
    ORDER BY neighbourSupport DESC, avgNeighbourScore DESC
    LIMIT $limit
  `;
  const records = await runQuery(cypher, { userId, limit: neo4j.int(limit) });
  return records.map((r) => ({
    ...toNative(r.movie),
    genres: r.genres,
    neighbourSupport: toNative(r.neighbourSupport),
    avgNeighbourScore: Math.round(toNative(r.avgNeighbourScore) * 10) / 10,
  }));
}
