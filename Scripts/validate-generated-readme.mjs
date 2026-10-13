import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const GENERATED_README_SECTIONS = Object.freeze([
  "summary",
  "repositories-opened-to-contribution",
  "top-growing-repositories"
]);

export function assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate) {
  if (maskGeneratedSections(baseline) !== maskGeneratedSections(candidate)) {
    throw new Error("README changes extend outside the generated sections.");
  }
}

function maskGeneratedSections(markdown) {
  let cursor = 0;
  let masked = "";

  for (const identifier of GENERATED_README_SECTIONS) {
    const startMarker = `<!--START_SECTION:${identifier}-->`;
    const endMarker = `<!--END_SECTION:${identifier}-->`;

    if (countOccurrences(markdown, startMarker) !== 1 || countOccurrences(markdown, endMarker) !== 1) {
      throw new Error(`README must contain exactly one start and end marker for '${identifier}'.`);
    }

    const startIndex = markdown.indexOf(startMarker);
    const contentStart = startIndex + startMarker.length;
    const endIndex = markdown.indexOf(endMarker);
    if (startIndex < cursor || endIndex < contentStart) {
      throw new Error(`README markers for '${identifier}' are missing, reordered, or overlapping.`);
    }

    masked += markdown.slice(cursor, contentStart);
    masked += `\u0000generated:${identifier}\u0000`;
    masked += endMarker;
    cursor = endIndex + endMarker.length;
  }

  return masked + markdown.slice(cursor);
}

function countOccurrences(value, token) {
  let count = 0;
  let index = 0;
  while ((index = value.indexOf(token, index)) !== -1) {
    count += 1;
    index += token.length;
  }
  return count;
}

async function runCli() {
  const [, , baselinePath, candidatePath] = process.argv;
  if (!baselinePath || !candidatePath) {
    throw new Error("Usage: validate-generated-readme.mjs <baseline-readme> <candidate-readme>");
  }

  const [baseline, candidate] = await Promise.all([
    readFile(baselinePath, "utf8"),
    readFile(candidatePath, "utf8")
  ]);
  assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate);
  process.stdout.write("README changes are confined to generated sections.\n");
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
