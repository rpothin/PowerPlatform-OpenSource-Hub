import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadSearchCriteria } from "../src/config.js";

const packageRoot = process.cwd();
const outputRoot = path.join(packageRoot, ".test-output", "config");

describe("loadSearchCriteria", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("loads repository search criteria with strict validation", async () => {
    const configPath = path.join(outputRoot, "criteria.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).resolves.toEqual([{ topic: "powerplatform", searchLimit: 25 }]);
  });

  it("accepts PowerShell-style property casing", async () => {
    const configPath = path.join(outputRoot, "criteria-pascal.json");
    await writeFile(configPath, JSON.stringify([{ Topic: "powerapps", SearchLimit: 10 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).resolves.toEqual([{ topic: "powerapps", searchLimit: 10 }]);
  });

  it("accepts valid minStars and includes it in the result", async () => {
    const configPath = path.join(outputRoot, "criteria-minstars.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25, minStars: 5 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).resolves.toEqual([{ topic: "powerplatform", searchLimit: 25, minStars: 5 }]);
  });

  it("omits minStars from the result when not provided", async () => {
    const configPath = path.join(outputRoot, "criteria-no-minstars.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25 }]), "utf8");

    const result = await loadSearchCriteria(configPath);
    expect(result[0]).not.toHaveProperty("minStars");
  });

  it("rejects minStars of zero", async () => {
    const configPath = path.join(outputRoot, "criteria-minstars-zero.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25, minStars: 0 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("invalid minStars: must be a positive integer");
  });

  it("rejects negative minStars", async () => {
    const configPath = path.join(outputRoot, "criteria-minstars-neg.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25, minStars: -1 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("invalid minStars: must be a positive integer");
  });

  it("rejects non-integer minStars", async () => {
    const configPath = path.join(outputRoot, "criteria-minstars-float.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25, minStars: 2.5 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("invalid minStars: must be a positive integer");
  });

  it("rejects null minStars", async () => {
    const configPath = path.join(outputRoot, "criteria-minstars-null.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 25, minStars: null }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("invalid minStars: must be a positive integer");
  });

  it("rejects topics with spaces", async () => {
    const configPath = path.join(outputRoot, "invalid.json");
    await writeFile(configPath, JSON.stringify([{ topic: "power platform", searchLimit: 10 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("cannot contain spaces");
  });
});
