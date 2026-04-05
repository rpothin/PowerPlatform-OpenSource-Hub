# :material-source-repository: Repository Onboarding

Learn how to add your Power Platform open-source project to the Hub.

---

## Automatic Discovery

!!! success "Easiest Method"
    The Hub automatically discovers repositories tagged with
    [tracked topics](naming-conventions.md#topic-tags). Discovery is still
    driven by GitHub topics, so simply add the most relevant tracked topic(s)
    to your GitHub repository settings.

### Steps

1. Navigate to your repository on GitHub.
2. Click the :material-cog: **Settings** gear next to **About** on the right
   sidebar.
3. Under **Topics**, add the most relevant tracked topic(s) for your project
   (for example, `power-platform`, `power-apps`, or `dataverse`).
4. Save the changes.

!!! note "Service Page Placement"
    Repositories can appear under multiple service pages when they carry
    multiple relevant tracked topics. Apply only the tracked topic(s) that best
    describe the repository.

!!! note "Processing Time"
    The sync pipeline runs on a scheduled basis. Your repository will appear in
    the registry after the next sync cycle.

---

## Manual Request

If automatic discovery does not work for your use case, you can request manual
inclusion.

### Steps

1. Open an [issue](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/issues/new)
   on the Hub repository.
2. Provide:
   - The full repository URL
   - A brief description of how the project relates to Power Platform
   - The topics/tags already applied
   - The service page(s) you expect the repository to appear on, if relevant
3. A maintainer will review the request and confirm whether the current tracked
   topics already fit your repository or whether a search-criteria update is
   needed.

---

## Onboarding Checklist

!!! abstract "Before You Submit"
    Ensure your repository meets these minimum criteria:

    - [x] Has a clear **README** with project description
    - [x] Includes at least one **tracked topic** tag
    - [x] Uses the **most relevant tracked topic(s)** for the service areas it fits
    - [x] Has a **license** file
    - [x] Is **not archived** (archived repos are excluded)
    - [ ] _(Recommended)_ Has a **Code of Conduct**
    - [ ] _(Recommended)_ Has a **Security Policy**
    - [ ] _(Recommended)_ Has **Good First Issues** labelled for newcomers

---

## What Gets Displayed?

The registry page for each repository includes:

| Field | Source |
|-------|--------|
| Name & Description | Repository metadata |
| Stars, Forks, Issues | GitHub API |
| Language | Primary language detected by GitHub |
| License | Repository license file |
| Topics | GitHub topic tags |
| Latest Release | Most recent GitHub release |
| Contribution Status | Good First / Help Wanted issue counts |

!!! info "Data Freshness"
    All data is fetched directly from the GitHub API by
    `scripts/sync_repos.py`. The values shown reflect the state at the time of
    the last sync.
