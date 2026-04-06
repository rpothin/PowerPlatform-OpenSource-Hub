# :material-source-repository: Repository Setup

A well-configured repository is the foundation of a successful open-source
project. This guide walks you through every setting and file that matters —
from your first commit to automatic discovery by the Power Platform
Open-Source Hub.

---

## README

Your README is the front door of your project. A visitor should understand
**what the project does**, **who it is for**, and **how to get started**
within 30 seconds.

!!! tip "README template"
    ```markdown
    # Project Name

    One-line description of what the project does.

    ## Features
    - Feature A
    - Feature B

    ## Getting Started

    ### Prerequisites
    - Requirement 1
    - Requirement 2

    ### Installation
    ```bash
    # installation steps
    ```

    ## Usage
    Brief usage example or screenshot.

    ## Contributing
    See CONTRIBUTING.md for details.

    ## License
    This project is licensed under the MIT License. See the LICENSE file.
    ```

### What to include

| Section | Purpose |
|---------|---------|
| **Title and description** | Clear, one-line summary |
| **Badges** | Build status, license, latest release |
| **Features** | What the project does |
| **Getting Started** | Prerequisites, installation, first run |
| **Usage** | Code samples or screenshots |
| **Contributing** | Link to CONTRIBUTING.md |
| **License** | Link to LICENSE file |

---

## Topics and Hub Discovery

!!! success "How automatic discovery works"
    The Hub automatically discovers repositories tagged with tracked GitHub
    topics. Simply adding the correct topic(s) is the easiest way to get your
    project listed.

### Adding topics

1. Navigate to your repository on GitHub.
2. Click the :material-cog: **Settings** gear next to **About** on the right
   sidebar.
3. Under **Topics**, add the most relevant tracked topic(s) for your project.
4. Save the changes.

### Tracked topics

| Service page | Tracked GitHub topics | Typical fit |
|---|---|---|
| Power Platform | `powerplatform`, `power-platform`, `ai-builder` | Platform-wide resources, ALM, governance, AI Builder |
| Power Apps | `powerapps`, `power-apps` | Canvas apps, model-driven apps |
| Power Automate | `powerautomate`, `power-automate` | Cloud flows, desktop flows |
| Copilot Studio | `powervirtualagent`, `power-virtual-agent`, `copilot-studio` | Copilot Studio projects |
| Dataverse | `dataverse`, `microsoft-dataverse` | Dataverse SDKs, tooling |
| Pro Development | `pcf-controls`, `powerappscomponentframework`, `powerfx`, `power-fx` | PCF, Power Fx, developer tooling |
| Dynamics 365 | `dynamics365`, `dynamics-365` | Dynamics 365 apps, extensions |

!!! note "Multiple topics"
    A project can carry multiple tracked topics and appear on multiple service
    pages. Apply only the topic(s) that genuinely describe the project.

!!! note "Processing time"
    The sync pipeline runs on a scheduled basis. Your repository will appear
    in the registry after the next sync cycle.

---

## License

Every open-source project needs a license file. Without one, the code is
**not truly open source** — others cannot legally use, modify, or distribute
it.

### Choosing a license

| License | Permissive? | Key characteristic |
|---------|-------------|-------------------|
| **MIT** | Yes | Simple, widely used, minimal restrictions |
| **Apache 2.0** | Yes | Explicit patent grant, used by many enterprises |
| **GPL 3.0** | No (copyleft) | Derivatives must also be open source |

!!! tip "When in doubt"
    **MIT** is the most common choice in the Power Platform ecosystem. It is
    simple, permissive, and well understood by organisations evaluating
    third-party dependencies.

### Adding a license

1. Create a `LICENSE` file at the repository root.
2. Paste the full text of your chosen license.
3. GitHub will automatically detect and display the license badge.

---

## Continuous Integration

Setting up CI early catches issues before they reach users and makes
contributions easier to review.

### Recommended checks

| Check | Tool | Purpose |
|-------|------|---------|
| Build | GitHub Actions | Ensure the project builds cleanly |
| Tests | pytest, dotnet test, etc. | Catch regressions |
| Lint | ESLint, flake8, etc. | Enforce code style |
| Docs | `mkdocs build --strict` | Validate documentation |

!!! example "Minimal GitHub Actions workflow"
    ```yaml
    name: CI
    on: [push, pull_request]
    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - name: Build
            run: |
              # your build command here
          - name: Test
            run: |
              # your test command here
    ```

---

## Onboarding Checklist

!!! abstract "Is your repository ready?"
    - [x] Has a clear **README** with project description
    - [x] Includes at least one **tracked topic** tag
    - [x] Has a **license** file
    - [x] Is **not archived** (archived repos are excluded from the Hub)
    - [ ] _(Recommended)_ Has a **Code of Conduct** — see
          [Community Health](community-health.md)
    - [ ] _(Recommended)_ Has a **Security Policy** — see
          [Community Health](community-health.md#security-policy)
    - [ ] _(Recommended)_ Has **Good First Issues** labelled for newcomers
    - [ ] _(Recommended)_ Has CI configured for pull requests

---

## Manual Request

If automatic discovery does not work for your use case, you can request manual
inclusion.

1. Open an [issue](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/issues/new)
   on the Hub repository.
2. Provide the full repository URL, a brief description of how it relates to
   Power Platform, the topics already applied, and the service page(s) you
   expect to appear on.
3. A maintainer will review and confirm whether the current tracked topics
   already fit or whether a search-criteria update is needed.
