# :material-magnify: Discovering Projects

The Hub tracks hundreds of Power Platform open-source repositories. This guide
helps you navigate the Registry, understand the signals displayed for each
project, and choose the right tool for your needs.

---

## Using the Registry

### Browse by category

The [Registry](../../registry/index.md) is organised by service area:

| Category | What you will find |
|----------|-------------------|
| **Power Platform** | Cross-service tools, ALM, governance, AI Builder |
| **Power Apps** | Canvas and model-driven app tools, samples |
| **Power Automate** | Flow templates, connectors, desktop automation |
| **Copilot Studio** | Bot frameworks, PVA tools |
| **Dataverse** | SDKs, migration tools, schema management |
| **Pro Development** | PCF controls, Power Fx, developer tooling |
| **Dynamics 365** | D365 extensions, tooling, integrations |

### Understand the badges

Each repository in the Registry displays visual indicators to help you
assess it quickly:

| Badge | Meaning |
|-------|---------|
| 🏢 **Microsoft** | Owned by a Microsoft organisation |
| 👤 **Community** | Owned by a community member or organisation |
| 🟢 **Active** | Updated within the last 90 days |
| 🟡 **Maintained** | Updated within the last year |
| 🔴 **Inactive** | Not updated in over a year |
| 🌱 **Good First Issues** | Has beginner-friendly contribution opportunities |
| 🛠️ **Help Wanted** | Has issues specifically requesting community help |

---

## Evaluating a Project

Before adopting an open-source tool, evaluate it against these criteria:

### Health indicators

| Factor | What to check | Green flag | Red flag |
|--------|--------------|------------|----------|
| **Activity** | Last commit, last release | Updated in last 90 days | No updates in over a year |
| **Stars** | Community interest | Growing star count | Very few stars for an old project |
| **License** | Legal compatibility | MIT, Apache 2.0 | No license file |
| **Documentation** | README quality | Clear setup and usage instructions | Empty or outdated README |
| **Issues** | Maintenance responsiveness | Issues answered within days | Many unanswered issues |
| **Releases** | Maturity | Tagged releases with changelogs | No releases |

### Questions to ask yourself

!!! tip "Before you depend on it"
    1. **Does it solve my specific problem?** Read the README and check the
       feature list.
    2. **Is it actively maintained?** Check the activity badge and recent
       commit history.
    3. **Is the license compatible with my project?** MIT and Apache 2.0 are
       generally safe for most uses.
    4. **Are there alternatives?** Search the Registry for similar projects
       and compare.
    5. **Can I contribute fixes if needed?** Check for a CONTRIBUTING.md and
       responsive maintainers.

---

## Using the Detail Page

Each repository in the Registry has a detail page showing:

| Section | What it tells you |
|---------|------------------|
| **Hero** | Name, description, ownership (Microsoft/Community), activity status |
| **Stats** | Stars, watchers, forks, open issues |
| **Latest Release** | Most recent tagged version |
| **Topics** | GitHub topic tags for discoverability |
| **Contribution Opportunities** | Active good-first-issue and help-wanted issues |

### Reading the stats

- **Stars** — A proxy for community interest and trust. Higher is better,
  but new projects naturally have fewer.
- **Watchers** — People actively following the project. Indicates engaged
  users.
- **Forks** — People who have copied the project, often to contribute.
  High forks can indicate an active contributor community.
- **Open Issues** — An open backlog is normal for healthy projects. Zero
  issues on an active project can mean issues are being ignored, not that
  there are none.

---

## Searching Effectively

### Use the search bar

MkDocs Material provides a built-in search bar (top of the page). Type
keywords like "PCF date picker" or "Dataverse migration" to find relevant
projects.

### Filter by category

Use the Registry navigation tabs (Power Apps, Dataverse, etc.) to narrow
results to your area of interest.

### Compare projects

When you find multiple options, open each detail page in a new tab and
compare:

- Activity status
- Star count and trend
- License
- Documentation quality
- Whether it is Microsoft-owned or community-maintained

---

## Next Steps

Found a project you like? Consider [giving back](giving-back.md) to support
the maintainers who built it.
