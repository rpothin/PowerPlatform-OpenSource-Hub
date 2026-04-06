# :material-compass: Getting Started

So you want to contribute to a Power Platform open-source project — great!
This guide helps you find the right project, understand what you are looking
at, and prepare for a successful first contribution.

---

## Finding a Project

### Use the Hub

The fastest way to find contribution opportunities is the Hub itself:

1. **[Contribute page](../../contribute/index.md)** — Lists repositories with active
   `good first issue` and `help wanted` issues, sorted by freshness.
2. **[Registry](../../registry/index.md)** — Browse all tracked repositories. Look
   for the 🌱 and 🛠️ badges that indicate contribution opportunities.

### Evaluate a repository

Before diving in, spend a few minutes assessing the project:

| Signal | What to look for |
|--------|-----------------|
| **Activity** | Recent commits, merged PRs, and issue responses in the last 90 days |
| **Stars and forks** | Higher numbers indicate adoption and community interest |
| **Open issues** | A healthy backlog suggests an active project |
| **CONTRIBUTING.md** | Shows the maintainer has thought about external contributors |
| **License** | Confirms you can legally contribute |
| **CI status** | Green badges mean the project has automated quality checks |

!!! tip "Look for responsiveness"
    Check how quickly maintainers respond to issues and PRs. A project where
    PRs sit unanswered for months may not be the best use of your time.

---

## Understanding the Codebase

### Read the README first

The README explains what the project does, how to install it, and how to use
it. This gives you the mental model you need before reading code.

### Explore the file structure

Most Power Platform projects follow predictable patterns:

| Language | Common structure |
|----------|-----------------|
| **C# / .NET** | `src/`, `tests/`, `.sln` at root |
| **TypeScript / PCF** | `src/`, `__tests__/`, `package.json` |
| **Python** | `src/` or module folder, `tests/`, `requirements.txt` |
| **PowerShell** | `src/`, `tests/`, module manifest `.psd1` |

### Run the project locally

Before making changes, verify you can build and run the project:

1. Follow the README's **Getting Started** section.
2. Run tests to make sure everything passes.
3. Explore the application or library as a user would.

---

## Choosing Your First Issue

### Start small

!!! success "Good first issues"
    Issues labelled `good first issue` are specifically curated for newcomers.
    They typically:

    - Have a clear description of what to change
    - Require changes to one or two files
    - Do not need deep architectural knowledge

### Comment before you start

Before writing code, leave a comment on the issue:

> "Hi! I'd like to work on this. I plan to [brief approach]. Could you
> confirm this is the right direction?"

This prevents duplicate work and gives the maintainer a chance to provide
guidance.

---

## Types of Contributions

Contributing is not just about code. All of these are valuable:

| Type | Examples |
|------|---------|
| **Code** | Bug fixes, new features, performance improvements |
| **Documentation** | README improvements, tutorials, API docs |
| **Testing** | Writing tests, manual testing, reporting bugs |
| **Review** | Reviewing other contributors' pull requests |
| **Triage** | Labelling issues, reproducing bugs, closing duplicates |
| **Design** | UI/UX improvements, icons, diagrams |
| **Translation** | Localising content for other languages |

---

## Setting Up Your Environment

### Git basics

If you are new to Git, you need:

1. **Git** installed locally — [Download Git](https://git-scm.com/downloads)
2. **A GitHub account** — [Sign up](https://github.com/join)
3. **A code editor** — [VS Code](https://code.visualstudio.com/) is
   recommended

### Fork and clone

```bash
# Fork the repository on GitHub (click the Fork button)

# Clone your fork
git clone https://github.com/YOUR-USERNAME/REPO-NAME.git
cd REPO-NAME

# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/REPO-NAME.git
```

---

## Next Steps

You have found a project and set up your environment. Now follow the
[Making Contributions](making-contributions.md) guide to learn the
fork-and-PR workflow, writing quality code, and navigating code reviews.
