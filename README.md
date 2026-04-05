<p align="center">
    <h1 align="center">
        Power Platform Open-Source Hub
    </h1>
    <h3 align="center">
        Your amazing journey in Power Platform open-source ecosystem could start here 🧳
    </h3>
</p>

<p align="center">
    <a href="https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/LICENSE" alt="Repository License">
        <img src="https://img.shields.io/github/license/rpothin/PowerPlatform-OpenSource-Hub?color=yellow&label=License" /></a>
    <a href="#watchers" alt="Watchers">
        <img src="https://img.shields.io/github/watchers/rpothin/PowerPlatform-OpenSource-Hub?style=social" /></a>
    <a href="#forks" alt="Forks">
        <img src="https://img.shields.io/github/forks/rpothin/PowerPlatform-OpenSource-Hub?style=social" /></a>
    <a href="#stars" alt="Stars">
        <img src="https://img.shields.io/github/stars/rpothin/PowerPlatform-OpenSource-Hub?style=social" /></a>
</p>

<p align="center">
    <a href="https://github.com/rpothin/PowerPlatform-OpenSource-Hub/actions/workflows/deploy-mkdocs.yml" alt="Deploy MkDocs site">
        <img src="https://github.com/rpothin/PowerPlatform-OpenSource-Hub/actions/workflows/deploy-mkdocs.yml/badge.svg" /></a>
</p>

---

## 🌐 Visit the Hub

👉 **[rpothin.github.io/PowerPlatform-OpenSource-Hub](https://rpothin.github.io/PowerPlatform-OpenSource-Hub/)**

Browse the full registry of Power Platform open-source repositories, discover projects open to contributions, and find your next adventure.

---

## 📖 About

The **Power Platform Open-Source Hub** is a community initiative that aggregates and showcases open-source repositories related to the Power Platform ecosystem. The hub automatically discovers repositories tagged with tracked GitHub topics, groups those topics by service area, and presents the results in a searchable, browsable documentation site.

### How It Works

1. **Discovery** — A Python pipeline ([`scripts/sync_repos.py`](scripts/sync_repos.py)) searches GitHub for repositories tagged with [tracked topics](configuration/GitHubRepositoriesSearchCriteria.json).
2. **Service Grouping** — Those tracked topics are grouped into service areas such as **Power Platform**, **Power Apps**, **Power Automate**, **Copilot Studio**, **Dataverse**, **Pro Development**, and **Dynamics 365**.
3. **Generation** — The service grouping drives the category metadata and generated service pages, while individual repository pages are created with metadata, statistics, and contribution opportunities.
4. **Publication** — The deployment workflow refreshes repository metadata live from GitHub, then builds the site with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and deploys it to GitHub Pages automatically.

### Tracked Topics

Tracked GitHub topics remain the discovery mechanism. The Hub groups them into
service pages that drive category metadata and browsing:

| Service | Tracked GitHub topics |
|---------|------------------------|
| Power Platform | `powerplatform`, `power-platform`, `ai-builder` |
| Power Apps | `powerapps`, `power-apps` |
| Power Automate | `powerautomate`, `power-automate` |
| Copilot Studio | `powervirtualagent`, `power-virtual-agent`, `copilot-studio` |
| Dataverse | `dataverse`, `microsoft-dataverse` |
| Pro Development | `pcf-controls`, `powerappscomponentframework`, `powerfx`, `power-fx` |
| Dynamics 365 | `dynamics365`, `dynamics-365` |

---

## 🤝 Contributing

Want to contribute? Check out the [Contributing Guide](https://rpothin.github.io/PowerPlatform-OpenSource-Hub/guide/contributing/) on the documentation site.

**Quick ways to get involved:**
- **Add your repository** — Tag it with a [tracked topic](#tracked-topics) and it will be discovered automatically
- **Improve documentation** — Submit a PR to improve guides or fix issues
- **Enhance the pipeline** — Help improve the data sync and site generation

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 📜 Code of Conduct

This project has adopted the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
