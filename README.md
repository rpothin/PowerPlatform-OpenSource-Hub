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

The **Power Platform Open-Source Hub** is a community initiative that aggregates and showcases open-source repositories related to the Power Platform ecosystem. The hub automatically discovers repositories tagged with Power Platform topics on GitHub and presents them in a searchable, browsable documentation site.

### How It Works

1. **Discovery** — A Python pipeline ([`scripts/sync_repos.py`](scripts/sync_repos.py)) searches GitHub for repositories tagged with [tracked topics](configuration/GitHubRepositoriesSearchCriteria.json) like `powerplatform`, `powerapps`, `dataverse`, `dynamics365`, and more.
2. **Generation** — Individual documentation pages are generated for each repository with metadata, statistics, and contribution opportunities.
3. **Publication** — The site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and deployed to GitHub Pages automatically.

### Tracked Topics

`powerplatform` · `power-platform` · `powerapps` · `power-apps` · `powerautomate` · `power-automate` · `powervirtualagent` · `power-virtual-agent` · `dataverse` · `microsoft-dataverse` · `powerfx` · `power-fx` · `dynamics365` · `dynamics-365` · `pcf-controls` · `powerappscomponentframework` · `ai-builder`

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
