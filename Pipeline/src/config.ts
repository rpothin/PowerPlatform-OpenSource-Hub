import { readFile } from "node:fs/promises";

import type { SearchCriterion } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function loadSearchCriteria(configPath: string): Promise<SearchCriterion[]> {
  let raw: string;
  try {
    raw = await readFile(configPath, "utf8");
  } catch (error) {
    throw new Error(`No configuration file found at '${configPath}'.`, { cause: error });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Configuration file '${configPath}' is not valid JSON.`, { cause: error });
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Configuration file '${configPath}' must contain an array of search criteria.`);
  }

  return parsed.map((item, index) => normalizeCriterion(item, index, configPath));
}

function normalizeCriterion(item: unknown, index: number, configPath: string): SearchCriterion {
  if (!isRecord(item)) {
    throw new Error(`Search criterion ${index} in '${configPath}' must be an object.`);
  }

  const topic = item.topic ?? item.Topic;
  const searchLimit = item.searchLimit ?? item.SearchLimit;
  const hasMinStars = Object.hasOwn(item, "minStars") || Object.hasOwn(item, "MinStars");
  const minStars = item.minStars ?? item.MinStars;

  if (typeof topic !== "string" || topic.trim() === "") {
    throw new Error(`Search criterion ${index} in '${configPath}' must include a non-empty topic.`);
  }

  if (/\s/.test(topic)) {
    throw new Error(`Search criterion topic '${topic}' cannot contain spaces.`);
  }

  if (typeof searchLimit !== "number" || !Number.isInteger(searchLimit) || searchLimit < 1 || searchLimit > 1000) {
    throw new Error(`Search criterion '${topic}' in '${configPath}' must include searchLimit between 1 and 1000.`);
  }

  if (hasMinStars) {
    if (typeof minStars !== "number" || !Number.isInteger(minStars) || minStars < 1) {
      throw new Error(`Search criterion '${topic}' in '${configPath}' has invalid minStars: must be a positive integer.`);
    }
  }

  return { topic, searchLimit, ...(hasMinStars ? { minStars: minStars as number } : {}) };
}
