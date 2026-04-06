# :material-tag-outline: Releases

Well-managed releases give users confidence that they can depend on your
project. This guide covers semantic versioning, GitHub Releases, changelogs,
and release cadence.

---

## Semantic Versioning

!!! info "The standard: MAJOR.MINOR.PATCH"
    [Semantic Versioning (SemVer)](https://semver.org/) is the most widely
    adopted version scheme in open source:

    - **MAJOR** — Incompatible API or behaviour changes
    - **MINOR** — New functionality that is backwards-compatible
    - **PATCH** — Backwards-compatible bug fixes

    Example: `2.4.1` → major 2, minor 4, patch 1

### When to bump

| Change | Version bump | Example |
|--------|-------------|---------|
| Breaking change to public API | MAJOR | `1.3.2` → `2.0.0` |
| New feature, no breaking changes | MINOR | `1.3.2` → `1.4.0` |
| Bug fix | PATCH | `1.3.2` → `1.3.3` |
| Pre-release | Suffix | `2.0.0-beta.1` |

!!! tip "Start at 1.0.0"
    If your project is ready for production use, start at `1.0.0`. Staying on
    `0.x.y` signals instability and discourages adoption.

---

## Changelogs

A changelog is a curated, human-readable list of notable changes in each
release. It helps users and contributors understand what changed and why.

### Format

Follow the [Keep a Changelog](https://keepachangelog.com/) convention:

```markdown
# Changelog

## [1.4.0] - 2026-04-01

### Added
- New export command for bulk data operations

### Changed
- Improved error messages for authentication failures

### Fixed
- Connection timeout with large datasets (#142)

## [1.3.2] - 2026-03-15

### Fixed
- Duplicate entries in search results (#138)
```

### Categories

| Category | When to use |
|----------|-------------|
| **Added** | New features |
| **Changed** | Changes in existing functionality |
| **Deprecated** | Features that will be removed |
| **Removed** | Features that were removed |
| **Fixed** | Bug fixes |
| **Security** | Vulnerability fixes |

---

## GitHub Releases

GitHub Releases tie a Git tag to release notes, making it easy for users to
download specific versions and see what changed.

### Creating a release

1. Go to your repository → **Releases** → **Draft a new release**.
2. Choose or create a tag (e.g., `v1.4.0`).
3. Set the release title (e.g., `v1.4.0 — Bulk Export`).
4. Write or paste release notes (use the changelog entry).
5. Attach any build artefacts if applicable.
6. Publish the release.

!!! tip "Auto-generated release notes"
    GitHub can automatically generate release notes from merged pull requests.
    Click **Generate release notes** when drafting a release. This works best
    when PRs have clear titles and labels.

### Automation with GitHub Actions

!!! example "Automated release on tag push"
    ```yaml
    name: Release
    on:
      push:
        tags:
          - 'v*'
    jobs:
      release:
        runs-on: ubuntu-latest
        permissions:
          contents: write
        steps:
          - uses: actions/checkout@v4
          - name: Create GitHub Release
            uses: softprops/action-gh-release@v2
            with:
              generate_release_notes: true
    ```

---

## Release Cadence

Establishing a predictable release cadence helps users plan upgrades and
contributors time their contributions.

### Common patterns

| Pattern | Description | Best for |
|---------|-------------|----------|
| **Time-based** | Release every 2-4 weeks | Active projects with regular contributions |
| **Feature-based** | Release when a set of features is ready | Projects with infrequent, large changes |
| **On-demand** | Release whenever an important fix lands | Security-critical tools |

!!! tip "Communicate your cadence"
    Add a sentence to your README or CONTRIBUTING.md:

    > We aim to release a new version every two weeks. Bug-fix releases may
    > happen sooner if a critical issue is reported.

---

## Pre-Release and Beta Versions

For major changes, consider publishing a pre-release first:

1. Tag with a pre-release suffix: `v2.0.0-beta.1`
2. In GitHub Releases, tick **Set as a pre-release**.
3. Gather feedback before the stable release.

This lets early adopters test changes without affecting users who depend on
stable versions.

---

## Checklist

!!! abstract "Release readiness"
    - [ ] Version number follows SemVer
    - [ ] Changelog entry written for this release
    - [ ] Git tag created and pushed
    - [ ] GitHub Release published with notes
    - [ ] Build artefacts attached (if applicable)
    - [ ] Users and contributors notified (Discussions, README badge)
