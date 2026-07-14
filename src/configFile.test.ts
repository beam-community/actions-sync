import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "path";
import { tmpdir } from "os";

import { Config } from "./config";
import { loadConfigFile } from "./configFile";

interface LocalTestContext {
  config: Config;
  tempDir: string;
}

describe.concurrent("configFile", () => {
  beforeEach<LocalTestContext>(async (ctx) => {
    const tempDir = await mkdtemp(join(tmpdir(), "actions-sync-config"));
    await mkdir(join(tempDir, ".github"), { recursive: true });

    ctx.tempDir = tempDir;
    ctx.config = {
      commitBranch: "gha/actions-sync",
      commitMessage: "chore: sync files",
      commitUserEmail: "test@example.com",
      commitUserName: "testing",
      configFilePath: join(tempDir, ".github/actions-sync.yml"),
      fullPath: tempDir,
      ignoreFiles: [],
      path: "",
      prAssignee: "",
      prBody: "",
      prEnabled: true,
      prLabels: [],
      prReviewUsers: [],
      prTitle: "chore: sync files",
      syncAuth: "",
      syncPath: "",
      syncRepository: "test/test",
      syncTree: "main",
      templateVariables: {},
    };
  });

  afterEach<LocalTestContext>(async (ctx) => {
    await rm(ctx.tempDir, { recursive: true });
  });

  it<LocalTestContext>("returns original config when no config file exists", async (ctx) => {
    const result = await loadConfigFile(ctx.config);
    expect(result).toEqual(ctx.config);
  });

  it<LocalTestContext>("loads ignore-files from config file", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `ignore-files:
  - .credo.exs
  - .formatter.exs
`,
    );

    const result = await loadConfigFile(ctx.config);
    expect(result.ignoreFiles).toEqual([".credo.exs", ".formatter.exs"]);
  });

  it<LocalTestContext>("action input takes precedence over config file for ignore-files", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `ignore-files:
  - .credo.exs
`,
    );

    const configWithInput = {
      ...ctx.config,
      ignoreFiles: [".formatter.exs"],
    };

    const result = await loadConfigFile(configWithInput);
    expect(result.ignoreFiles).toEqual([".formatter.exs"]);
  });

  it<LocalTestContext>("loads commit-branch from config file", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `commit-branch: custom/branch
`,
    );

    // Simulate empty action input by setting to empty string
    const configWithEmptyInput = {
      ...ctx.config,
      commitBranch: "",
    };

    const result = await loadConfigFile(configWithEmptyInput);
    expect(result.commitBranch).toBe("custom/branch");
  });

  it<LocalTestContext>("loads pr-enabled from config file", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `pr-enabled: false
`,
    );

    const result = await loadConfigFile(ctx.config);
    expect(result.prEnabled).toBe(false);
  });

  it<LocalTestContext>("loads pr-labels from config file", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `pr-labels:
  - sync
  - automated
`,
    );

    const result = await loadConfigFile(ctx.config);
    expect(result.prLabels).toEqual(["sync", "automated"]);
  });

  it<LocalTestContext>("action input takes precedence over config file for pr-labels", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `pr-labels:
  - from-file
`,
    );

    const configWithInput = {
      ...ctx.config,
      prLabels: ["from-action"],
    };

    const result = await loadConfigFile(configWithInput);
    expect(result.prLabels).toEqual(["from-action"]);
  });

  it<LocalTestContext>("handles multiple config options together", async (ctx) => {
    await writeFile(
      ctx.config.configFilePath,
      `commit-branch: feature/sync
pr-title: "feat: sync configuration"
pr-labels:
  - sync
ignore-files:
  - "*.md"
`,
    );

    const configWithEmptyInputs = {
      ...ctx.config,
      commitBranch: "",
      prTitle: "",
    };

    const result = await loadConfigFile(configWithEmptyInputs);
    expect(result.commitBranch).toBe("feature/sync");
    expect(result.prTitle).toBe("feat: sync configuration");
    expect(result.prLabels).toEqual(["sync"]);
    expect(result.ignoreFiles).toEqual(["*.md"]);
  });

  it<LocalTestContext>("handles invalid YAML gracefully", async (ctx) => {
    await writeFile(ctx.config.configFilePath, "invalid: yaml: content: [");

    const result = await loadConfigFile(ctx.config);
    // Should return original config when YAML is invalid
    expect(result).toEqual(ctx.config);
  });
});
