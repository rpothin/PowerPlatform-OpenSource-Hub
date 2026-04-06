# :material-heart-pulse: Community Health

A healthy open-source project is one where contributors feel welcome, users
know how to report problems, and maintainers can sustain their efforts over
time. This guide covers the community-health files and practices that make
the difference.

---

## The CONTRIBUTING File

A `CONTRIBUTING.md` file tells potential contributors **how** to help. Without
one, even enthusiastic newcomers may hesitate because they do not know where
to start.

### What to include

!!! abstract "Recommended sections"
    - **How to report a bug** — Issue template or step-by-step instructions
    - **How to suggest a feature** — Discussion or issue guidelines
    - **How to submit a pull request** — Branch naming, commit message format,
      required checks
    - **Development setup** — Prerequisites, build commands, test commands
    - **Code style** — Linter configuration or style guide link
    - **Review process** — What to expect after opening a PR

!!! example "Minimal CONTRIBUTING.md"
    ```markdown
    # Contributing

    Thank you for considering a contribution!

    ## Reporting Bugs
    Open an issue with steps to reproduce, expected behaviour, and actual
    behaviour.

    ## Pull Requests
    1. Fork the repository and create your branch from `main`.
    2. Ensure tests pass locally.
    3. Open a pull request with a clear description of your changes.

    ## Code Style
    Run `npm run lint` (or the equivalent for your project) before
    committing.
    ```

---

## Labelling Issues

Issue labels are the primary mechanism contributors use to find actionable
work. Two labels matter most for ecosystem visibility:

### Good First Issue

The `good first issue` label signals that an issue is **approachable for
newcomers**. The Hub's Contribute page surfaces these prominently.

!!! tip "What makes a good first issue?"
    - **Small scope** — Can be completed in a few hours
    - **Clear description** — Explains what to change and where
    - **Low prerequisite knowledge** — Does not require deep architectural
      understanding
    - **Guidance** — Links to relevant files or documentation

### Help Wanted

The `help wanted` label signals that an issue is **ready for external
contribution** from someone with some existing knowledge.

### Creating effective labels

1. Go to your repository's **Issues** tab → **Labels**.
2. Ensure you have `good first issue` and `help wanted` labels (GitHub
   creates these by default).
3. Review existing issues and apply labels to 3-5 issues that genuinely
   match the criteria above.

!!! warning "Label hygiene"
    Do not label every issue as `good first issue`. If newcomers pick up an
    issue that turns out to be complex, the experience is discouraging and
    they are unlikely to return.

---

## Code of Conduct

A Code of Conduct sets expectations for behaviour and provides a framework
for resolving conflicts. It signals to the community that your project is a
safe space.

### Adding a Code of Conduct

1. Create a `CODE_OF_CONDUCT.md` file at the repository root.
2. Use an established template — the
   [Contributor Covenant](https://www.contributor-covenant.org/) is the most
   widely adopted in the open-source world.
3. Include **contact information** so people know how to report violations.

!!! example "Quick setup"
    GitHub can generate a Code of Conduct for you:

    1. Go to **Settings** → **Code and automation** → **Community profile**.
    2. Click **Add** next to Code of Conduct.
    3. Choose **Contributor Covenant** and fill in your contact email.

---

## Security Policy

A `SECURITY.md` file tells security researchers how to **responsibly
disclose** vulnerabilities instead of opening a public issue.

### What to include

| Section | Content |
|---------|---------|
| **Supported versions** | Which versions receive security updates |
| **Reporting a vulnerability** | Contact email or GitHub Security Advisories link |
| **Response timeline** | How quickly you aim to acknowledge and fix reports |

!!! example "Minimal SECURITY.md"
    ```markdown
    # Security Policy

    ## Supported Versions
    | Version | Supported |
    |---------|-----------|
    | latest  | Yes       |

    ## Reporting a Vulnerability
    Please report security vulnerabilities via
    [GitHub Security Advisories](https://github.com/YOUR-ORG/YOUR-REPO/security/advisories/new)
    or email security@example.com. Do **not** open a public issue.

    We aim to acknowledge reports within 48 hours and provide a fix within
    14 days.
    ```

---

## Issue and PR Templates

Templates standardise the information contributors provide, reducing
back-and-forth and making triage faster.

### Issue templates

Create `.github/ISSUE_TEMPLATE/` with YAML-based templates:

!!! example "Bug report template"
    ```yaml
    name: Bug Report
    description: Report a bug
    labels: [bug]
    body:
      - type: textarea
        attributes:
          label: Description
          description: What happened?
        validations:
          required: true
      - type: textarea
        attributes:
          label: Steps to Reproduce
          description: How can we reproduce this?
        validations:
          required: true
      - type: textarea
        attributes:
          label: Expected Behaviour
          description: What should have happened?
    ```

### Pull request template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

!!! example "PR template"
    ```markdown
    ## Description
    <!-- What does this PR do? -->

    ## Related Issue
    Closes #

    ## Checklist
    - [ ] Tests added/updated
    - [ ] Documentation updated
    - [ ] Lint passes
    ```

---

## Summary

| File / Practice | Purpose | Priority |
|----------------|---------|----------|
| `CONTRIBUTING.md` | Tell contributors how to help | High |
| `good first issue` / `help wanted` labels | Surface work for the community | High |
| `CODE_OF_CONDUCT.md` | Set behaviour expectations | High |
| `SECURITY.md` | Enable responsible disclosure | Medium |
| Issue / PR templates | Standardise contributions | Medium |
