import { readFile } from "node:fs/promises";
import path from "node:path";

import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";

import type { RepositoryRecord } from "./types.js";

export async function validateRecordsWithSchema(records: readonly RepositoryRecord[], schemaPath: string): Promise<void> {
  await validateValueWithSchema(records, schemaPath, "Generated data");
}

export async function validateValueWithSchema(value: unknown, schemaPath: string, label: string): Promise<void> {
  const validate = await createSchemaValidator(schemaPath);
  validate(value, label);
}

export async function createSchemaValidator(schemaPath: string): Promise<(value: unknown, label: string) => void> {
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as AnySchema;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  await addSharedDefinitions(ajv, schemaPath);
  const validate = ajv.compile(schema);

  return (value: unknown, label: string): void => {
    if (!validate(value)) {
      throw new Error(`${label} does not match schema '${schemaPath}': ${ajv.errorsText(validate.errors)}`);
    }
  };
}

async function addSharedDefinitions(ajv: Ajv2020, schemaPath: string): Promise<void> {
  const definitionsPath = path.join(path.dirname(schemaPath), "GitHubRepositoryDefinitions.schema.json");
  const definitions = JSON.parse(await readFile(definitionsPath, "utf8")) as AnySchema;
  ajv.addSchema(definitions);
}
