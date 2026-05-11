import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSchemaValidator } from "./schema.js";
import type { RepositoryRecord } from "./types.js";

export interface GeneratedRepositoryFilePlan {
  fullName: string;
  relativePath: string;
  absolutePath: string;
}

export interface WriteGeneratedRepositoryFilesOptions {
  generatedDir: string;
  schemaPath: string;
}

const invalidPathCharacterPattern = /[<>:"|?*\u0000-\u001F\\]/u;
const whitespacePattern = /\s/u;

export function generatedRepositoryRelativePath(fullName: string): string {
  const { owner, repository } = parseRepositoryFullName(fullName);
  return path.join(owner.toLowerCase(), `${repository.toLowerCase()}.json`);
}

export function planGeneratedRepositoryFiles(
  records: readonly Pick<RepositoryRecord, "fullName">[],
  generatedDir: string
): GeneratedRepositoryFilePlan[] {
  const pathsByCollisionKey = new Map<string, string>();

  return records.map((record) => {
    const relativePath = generatedRepositoryRelativePath(record.fullName);
    const collisionKey = relativePath.toLowerCase();
    const existingFullName = pathsByCollisionKey.get(collisionKey);
    if (existingFullName !== undefined) {
      throw new Error(
        `Generated repository path collision between '${existingFullName}' and '${record.fullName}' at '${relativePath}'.`
      );
    }

    pathsByCollisionKey.set(collisionKey, record.fullName);
    return {
      fullName: record.fullName,
      relativePath,
      absolutePath: path.join(generatedDir, relativePath)
    };
  });
}

export async function writeGeneratedRepositoryFilesAtomically(
  records: readonly RepositoryRecord[],
  options: WriteGeneratedRepositoryFilesOptions
): Promise<void> {
  const plannedFiles = planGeneratedRepositoryFiles(records, options.generatedDir);
  const validate = await createSchemaValidator(options.schemaPath);
  const stagingDir = await createStagingDirectory(options.generatedDir);
  let stagingReplaced = false;

  try {
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const plannedFile = plannedFiles[index];
      if (record === undefined || plannedFile === undefined) {
        throw new Error("Generated repository file planning became inconsistent.");
      }

      validate(record, `Generated repository '${record.fullName}'`);
      const stagedPath = path.join(stagingDir, plannedFile.relativePath);
      await mkdir(path.dirname(stagedPath), { recursive: true });
      await writeFile(stagedPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    }

    await replaceDirectory(stagingDir, options.generatedDir);
    stagingReplaced = true;
  } finally {
    if (!stagingReplaced) {
      await rm(stagingDir, { recursive: true, force: true });
    }
  }
}

function parseRepositoryFullName(fullName: string): { owner: string; repository: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid repository fullName '${fullName}'. Expected 'owner/repo'.`);
  }

  const [owner, repository] = parts;
  if (!isValidPathSegment(owner) || !isValidPathSegment(repository)) {
    throw new Error(`Invalid repository fullName '${fullName}'. Expected filesystem-safe 'owner/repo'.`);
  }

  return { owner, repository };
}

function isValidPathSegment(segment: string | undefined): segment is string {
  return (
    segment !== undefined &&
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    !whitespacePattern.test(segment) &&
    !invalidPathCharacterPattern.test(segment)
  );
}

async function createStagingDirectory(targetDir: string): Promise<string> {
  const parent = path.dirname(targetDir);
  const baseName = path.basename(targetDir);
  await mkdir(parent, { recursive: true });

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const stagingDir = path.join(parent, `.${baseName}.staging-${process.pid}-${Date.now()}-${attempt}`);
    try {
      await mkdir(stagingDir);
      return stagingDir;
    } catch (error) {
      if (!isNodeError(error) || error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  throw new Error(`Unable to create staging directory for '${targetDir}'.`);
}

async function replaceDirectory(sourceDir: string, targetDir: string): Promise<void> {
  const parent = path.dirname(targetDir);
  const baseName = path.basename(targetDir);
  const backupDir = path.join(parent, `.${baseName}.backup-${process.pid}-${Date.now()}`);
  let backupCreated = false;

  try {
    await rename(targetDir, backupDir);
    backupCreated = true;
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  try {
    await rename(sourceDir, targetDir);
  } catch (error) {
    await rm(targetDir, { recursive: true, force: true });
    if (backupCreated) {
      await rename(backupDir, targetDir);
    }
    throw error;
  }

  if (backupCreated) {
    await rm(backupDir, { recursive: true, force: true });
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
