# :material-format-text: Naming Conventions

Consistent naming helps the community discover and understand projects quickly.
This page documents the conventions used within the Power Platform open-source
ecosystem.

---

## Repository Naming

!!! info "General Pattern"
    ```
    <Platform>-<Component>-<Purpose>
    ```
    **Examples:** `PowerPlatform-OpenSource-Hub`, `PowerApps-PCF-Controls`,
    `Dataverse-REST-Builder`

### Rules

| Rule | Good :material-check: | Avoid :material-close: |
|------|----------------------|----------------------|
| Use **PascalCase** with hyphens as separators | `PowerApps-Samples` | `powerapps_samples` |
| Prefix with the **platform component** | `PowerAutomate-Desktop-Flows` | `Desktop-Flows` |
| Keep it **concise but descriptive** | `PCF-DatePicker` | `PCFComponentForDatePickerControl` |
| Avoid **generic names** | `Dataverse-Migration-Tool` | `my-tool` |

---

## Branch Naming

!!! tip "Recommended Pattern"
    ```
    <type>/<short-description>
    ```
    **Examples:** `feature/add-search`, `fix/api-rate-limit`, `docs/update-readme`

### Common Prefixes

| Prefix | Purpose |
|--------|---------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring |
| `ci/` | CI/CD pipeline changes |

---

## Topic Tags

!!! note "Required for Discovery"
    To be automatically discovered by the Hub, repositories **must** include at
    least one of the following GitHub topics. The Hub groups these topics into
    service pages for browsing, but discovery still depends on the topics
    themselves.

| Service page | Tracked GitHub topics | Typical fit |
|--------------|------------------------|-------------|
| Power Platform | `powerplatform`, `power-platform`, `ai-builder` | Platform-wide resources, cross-service samples, ALM, governance content, and AI Builder work |
| Power Apps | `powerapps`, `power-apps` | Canvas apps, model-driven apps, and app-focused samples |
| Power Automate | `powerautomate`, `power-automate` | Cloud flows, desktop flows, and automation scenarios |
| Copilot Studio | `powervirtualagent`, `power-virtual-agent`, `copilot-studio` | Copilot Studio and Power Virtual Agents projects |
| Dataverse | `dataverse`, `microsoft-dataverse` | Dataverse SDKs, tooling, schema, and data work |
| Pro Development | `pcf-controls`, `powerappscomponentframework`, `powerfx`, `power-fx` | Developer tooling, PCF, Power Fx, and code-first extension work |
| Dynamics 365 | `dynamics365`, `dynamics-365` | Dynamics 365 applications, tooling, and extensions |

Use the most relevant tracked topic or topics for the repository. If a project
genuinely spans multiple service areas, it can include multiple tracked topics
and appear on multiple service pages.

---

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Documentation | `kebab-case.md` | `naming-conventions.md` |
| Python scripts | `snake_case.py` | `sync_repos.py` |
| Configuration | `PascalCase.json` | `GitHubRepositoriesSearchCriteria.json` |
| PowerShell | `Verb-Noun.ps1` | `Export-GitHubRepositoriesDetails.ps1` |
