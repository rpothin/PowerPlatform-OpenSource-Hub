---
sidebar_position: 1
---

# Self Onboarding

We are thrilled to have you join us!

This guide will help you configure your GitHub repository to be part of the Power Platform Open-Source Hub initiative.

## Prerequisites

To be able to onboard a repository into the initative you need to have the permission to add topics to it.

If you are not a maintainer of the repository, you can follow the [Invitation to Join](./invitation-to-join.md) procedure and ask the maintainer(s) to complete the process.

## Steps

1. Select in the list of the monitored topics the one(s) that best describe your repository - _You can find the list of topics [here](../intro.md#how-it-works)._
2. Go to your repository on GitHub.
3. In the **About** section, click on the settings icon.
4. In the **Edit repository details** dialog, add the selected topics to the **Topics** field.
5. Click on **Save changes**.

That's it for the actions on your side!

Now we will just need to wait for a maximum of 24 hours for the repository to be added to the Power Platform Open-Source Hub initative and be visible on the website.

## Repository metadata and curation

The hub combines generated GitHub facts with human-reviewed curation:

- Generated fields such as stars, topics, languages, releases, license, issues, and activity come from the daily pipeline.
- Curated fields such as category, focus areas, audience, featured status, custom description, exclusion, and curated health are reviewed through files in `Data\CuratedRepositories`.
- The daily bot can update generated files and the merged website data, but it does not create or rewrite curated overlays.

If your repository appears with the wrong category, focus area, audience, description, or health/featured badge, open a PR or issue requesting an overlay update. New taxonomy values should be requested with a clear description so maintainers can keep the vocabulary stable and useful for filtering.

Curating a repository does not pin it in the generated catalog by itself. If a curated repository is not part of the sentinel list and later disappears from GitHub topic search results, the merge step fails loudly so maintainers can either restore discovery, remove the stale overlay, or intentionally add the repository as a sentinel.
