import neo4j from "neo4j-driver";

/**
 * Recursively converts Neo4j driver types (Integer, Node, Relationship, Path,
 * temporal types) into plain JSON-friendly JS values.
 */
export function toNative(value) {
  if (value === null || value === undefined) return value;

  if (neo4j.isInt(value)) {
    return value.inSafeRange() ? value.toNumber() : value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(toNative);
  }

  if (neo4j.isNode(value)) {
    return {
      id: value.elementId,
      labels: value.labels,
      ...toNative(value.properties),
    };
  }

  if (neo4j.isRelationship(value)) {
    return {
      id: value.elementId,
      type: value.type,
      ...toNative(value.properties),
    };
  }

  if (neo4j.isDate(value) || neo4j.isDateTime(value) || neo4j.isLocalDateTime(value)) {
    return value.toString();
  }

  if (value instanceof Object && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  if (value instanceof Object && value.constructor === Object) {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = toNative(value[key]);
    }
    return out;
  }

  return value;
}

export function toNativeRecords(records) {
  return records.map(toNative);
}
