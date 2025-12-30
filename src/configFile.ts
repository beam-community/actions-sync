import * as core from "@actions/core";
import { readFile } from "fs/promises";
import { load as loadYaml } from "js-yaml";

import { Config } from "./config";

/**
 * Schema for the actions-sync.yml configuration file.
 * All fields are optional and serve as fallbacks when action inputs are not specified.
 */
export type ConfigFile = {
  "commit-branch"?: string;
  "commit-message"?: string;
  "commit-user-email"?: string;
  "commit-user-name"?: string;
  "ignore-files"?: string[];
  "pr-body"?: string;
  "pr-enabled"?: boolean;
  "pr-labels"?: string[];
  "pr-review-users"?: string[];
  "pr-title"?: string;
};

/**
 * Loads the actions-sync.yml configuration file from the target repository
 * and merges it with the existing config. Action workflow inputs take precedence
 * over values in the config file.
 */
export async function loadConfigFile(config: Config): Promise<Config> {
  let fileConfig: ConfigFile = {};

  try {
    const configFileContent = await readFile(config.configFilePath, "utf8");
    const parsed = loadYaml(configFileContent);

    if (parsed && typeof parsed === "object") {
      fileConfig = parsed as ConfigFile;
      core.info(`Loaded configuration from ${config.configFilePath}`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      core.debug(`No config file found at ${config.configFilePath}`);
    } else {
      core.warning(
        `Failed to load config file at ${config.configFilePath}: ${err}`,
      );
    }
    return config;
  }

  // Merge config file values with action inputs.
  // Config file values are used as fallbacks when action inputs use defaults.
  return {
    ...config,
    commitBranch: config.commitBranch || fileConfig["commit-branch"],
    commitMessage: config.commitMessage || fileConfig["commit-message"],
    commitUserEmail: config.commitUserEmail || fileConfig["commit-user-email"],
    commitUserName: config.commitUserName || fileConfig["commit-user-name"],
    ignoreFiles: config.ignoreFiles.length > 0
      ? config.ignoreFiles
      : fileConfig["ignore-files"] || [],
    prBody: config.prBody || fileConfig["pr-body"],
    prEnabled: fileConfig["pr-enabled"] !== undefined
      ? fileConfig["pr-enabled"]
      : config.prEnabled,
    prLabels: config.prLabels.length > 0
      ? config.prLabels
      : fileConfig["pr-labels"] || [],
    prReviewUsers: config.prReviewUsers.length > 0
      ? config.prReviewUsers
      : fileConfig["pr-review-users"] || [],
    prTitle: config.prTitle || fileConfig["pr-title"],
  };
}
