import { readFile } from "node:fs/promises";
import path from "node:path";

import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";

import type { RepositoryRecord } from "./types.js";

export async function validateRecordsWithSchema(records: readonly RepositoryRecord[], schemaPath: string): Promise<void> {
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as AnySchema;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  await addSharedDefinitions(ajv, schemaPath);
  const validate = ajv.compile(schema);

  if (!validate(records)) {
    throw new Error(`Generated data does not match schema '${schemaPath}': ${ajv.errorsText(validate.errors)}`);
  }
}

async function addSharedDefinitions(ajv: Ajv2020, schemaPath: string): Promise<void> {
  const definitionsPath = path.join(path.dirname(schemaPath), "GitHubRepositoryDefinitions.schema.json");
  const definitions = JSON.parse(await readFile(definitionsPath, "utf8")) as AnySchema;
  ajv.addSchema(definitions);
}
