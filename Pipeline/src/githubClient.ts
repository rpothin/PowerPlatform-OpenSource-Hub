import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

import type { GitHubClient } from "./providers.js";

const PipelineOctokit = Octokit.plugin(retry, throttling);

export function createGitHubClient(authToken: string): GitHubClient {
  return new PipelineOctokit({
    auth: authToken,
    request: {
      retries: 2
    },
    throttle: {
      onRateLimit: (_retryAfter, options) => {
        const request = options.request as { retryCount?: number };
        return (request.retryCount ?? 0) < 2;
      },
      onSecondaryRateLimit: (_retryAfter, options) => {
        const request = options.request as { retryCount?: number };
        return (request.retryCount ?? 0) < 2;
      }
    }
  }) as unknown as GitHubClient;
}
