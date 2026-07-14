import { ok } from "assert";
import * as core from "@actions/core";
import { join } from "path";

import { createTempPath } from "./utility";

export type Config = {
  commitBranch: string;
  commitMessage: string;
  commitUserEmail: string;
  commitUserName: string;
  configFilePath: string;
  fullPath: string;
  ignoreFiles: string[];
  path: string;
  prAssignee?: string;
  prBody: string;
  prEnabled: boolean;
  prLabels: string[];
  prReviewUsers: string[];
  prTitle: string;
  prToken?: string;
  syncAuth?: string;
  syncPath: string;
  syncRepository: string;
  syncTree: string;
  templateVariables: Record<string, string>;
};

export function getConfig(): Config {
  const path = core.getInput("path", { required: false });
  const workspace = process.env.GITHUB_WORKSPACE;
  ok(workspace, "Expected GITHUB_WORKSPACE to be defined");

  const configFile = core.getInput("config-file", { required: false }) || ".github/actions-sync.yml";

  return {
    commitBranch: core.getInput("commit-branch", { required: false }),
    commitMessage: core.getInput("commit-message", { required: false }),
    commitUserEmail: core.getInput("commit-user-email", { required: false }),
    commitUserName: core.getInput("commit-user-name", { required: false }),
    configFilePath: join(workspace, path, configFile),
    fullPath: join(workspace, path),
    ignoreFiles: core.getMultilineInput("ignore-files", { required: false }),
    path: path,
    prBody: core.getInput("pr-body", { required: false }),
    prEnabled: core.getBooleanInput("pr-enabled", { required: false }),
    prLabels: core.getMultilineInput("pr-labels", { required: false }),
    prReviewUsers: core.getMultilineInput("pr-review-users", {
      required: false,
    }),
    prTitle: core.getInput("pr-title", { required: false }),
    prToken: core.getInput("pr-token", { required: false }),
    syncAuth: core.getInput("sync-auth", { required: false }),
    syncPath: createTempPath(),
    syncRepository: core.getInput("sync-repository", { required: true }),
    syncTree:
      core.getInput("sync-branch", { required: false }) ||
      core.getInput("sync-tree", { required: true }),
    templateVariables: {},
  };
}
