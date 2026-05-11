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

  it("rejects topics with spaces", async () => {
    const configPath = path.join(outputRoot, "invalid.json");
    await writeFile(configPath, JSON.stringify([{ topic: "power platform", searchLimit: 10 }]), "utf8");

    await expect(loadSearchCriteria(configPath)).rejects.toThrow("cannot contain spaces");
  });
});
