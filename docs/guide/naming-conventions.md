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
    least one of the following GitHub topics:

=== "Power Platform"

    - `powerplatform`
    - `power-platform`

=== "Power Apps"

    - `powerapps`
    - `power-apps`
    - `pcf-controls`
    - `powerappscomponentframework`

=== "Power Automate"

    - `powerautomate`
    - `power-automate`

=== "Dataverse"

    - `dataverse`
    - `microsoft-dataverse`

=== "Power Fx"

    - `powerfx`
    - `power-fx`

=== "Dynamics 365"

    - `dynamics365`
    - `dynamics-365`

=== "AI Builder"

    - `ai-builder`

=== "Copilot Studio"

    - `powervirtualagent`
    - `power-virtual-agent`

---

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Documentation | `kebab-case.md` | `naming-conventions.md` |
| Python scripts | `snake_case.py` | `sync_repos.py` |
| Configuration | `PascalCase.json` | `GitHubRepositoriesSearchCriteria.json` |
| PowerShell | `Verb-Noun.ps1` | `Export-GitHubRepositoriesDetails.ps1` |
