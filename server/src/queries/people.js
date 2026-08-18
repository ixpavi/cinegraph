import neo4j from "neo4j-driver";
import { runQuery } from "../db/neo4j.js";
import { toNative } from "../db/serialize.js";

export async function searchPeople(search = "", limit = 10) {
  const cypher = `
    MATCH (p:Person)
    WHERE $search = '' OR toLower(p.name) CONTAINS toLower($search)
    RETURN p { .* } AS person
    ORDER BY p.name
    LIMIT $limit
  `;
  const records = await runQuery(cypher, { search, limit: neo4j.int(limit) });
  return records.map((r) => toNative(r.person));
}

/**
 * Person page: bio + full filmography (as actor and/or director) + frequent
 * collaborators (people they've shared a credit with more than once).
 */
export async function getPersonDetail(id) {
  const cypher = `
    MATCH (p:Person {id: $id})
    OPTIONAL MATCH (p)-[role:ACTED_IN]->(actedIn:Movie)
    OPTIONAL MATCH (p)-[:DIRECTED]->(directed:Movie)
    OPTIONAL MATCH (p)-[:ACTED_IN|DIRECTED]->(:Movie)<-[:ACTED_IN|DIRECTED]-(collaborator:Person)
    WHERE collaborator.id <> p.id
    WITH p,
      collect(DISTINCT actedIn { .id, .title, .year, .posterUrl, role: role.role }) AS actedIn,
      collect(DISTINCT directed { .id, .title, .year, .posterUrl }) AS directed,
      collaborator
    WITH p, actedIn, directed, collaborator, count(collaborator) AS collabCount
    ORDER BY collabCount DESC
    WITH p, actedIn, directed, collect({ person: collaborator { .id, .name }, count: collabCount })[0..8] AS collaborators
    RETURN p, actedIn, directed, collaborators
  `;
  const [row] = await runQuery(cypher, { id });
  if (!row) return null;
  return {
    ...toNative(row.p),
    actedIn: toNative(row.actedIn).filter((m) => m.id),
    directed: toNative(row.directed).filter((m) => m.id),
    collaborators: toNative(row.collaborators).filter((c) => c.person && c.person.id),
  };
}

/**
 * "Six degrees" — shortest path between two people through shared movie
 * credits, any number of hops. Variable-length, unknown-depth graph
 * traversal like this is exactly what relational joins struggle with:
 * SQL would need a recursive CTE re-joining a bridge table at every level.
 */
export async function shortestPathBetweenPeople(fromId, toId) {
  const cypher = `
    MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
    MATCH path = shortestPath((a)-[:ACTED_IN|DIRECTED*..8]-(b))
    RETURN [n IN nodes(path) |
      CASE
        WHEN n:Person THEN { kind: 'Person', id: n.id, name: n.name }
        WHEN n:Movie THEN { kind: 'Movie', id: n.id, name: n.title }
      END
    ] AS steps,
    length(path) AS hops
  `;
  const [row] = await runQuery(cypher, { fromId, toId });
  if (!row) return null;
  return { steps: toNative(row.steps), hops: toNative(row.hops) };
}
