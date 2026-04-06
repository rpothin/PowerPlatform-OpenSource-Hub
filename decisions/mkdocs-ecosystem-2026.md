# Decision Log: MkDocs Ecosystem Strategy (2026)

**Date:** April 2026  
**Status:** Accepted  
**Authors:** PowerPlatform-OpenSource-Hub maintainers  

---

## Context

This project uses [MkDocs](https://www.mkdocs.org/) + [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) to build and publish the documentation site.

### MkDocs 1.x is effectively unmaintained

MkDocs **1.6.1** (released August 2024) is the last release of the original `mkdocs` project maintained by the `mkdocs` organization. As of early 2026, there has been no new release and the project shows no signs of active development. It still works, but it receives no new features and security/bug fixes are not guaranteed.

### Material for MkDocs enters maintenance mode in 9.7.x

Starting with **mkdocs-material 9.7.0**, the Material theme team (squidfunk) introduced a deprecation warning banner in the terminal during `mkdocs serve` and `mkdocs build`. This banner reads:

```
WARNING - MkDocs 2.0 is available! Upgrade now for the future of documentation.
```

The banner:
- Is shown unconditionally unless suppressed with `NO_MKDOCS_2_WARNING=true`
- Refers to a **separate, incompatible project** (see below) — not an upgrade of MkDocs 1.x
- Signals that the Material team is moving focus away from the 9.x / MkDocs 1.x stack

The official suppression mechanism is the `NO_MKDOCS_2_WARNING=true` environment variable, which is checked in `material/templates/__init__.py`.

---

## The "MkDocs 2.0" Landscape

At the time of this decision, three projects are competing to succeed MkDocs 1.x:

### 1. MkDocs 2.0 (encode/mkdocs) — NOT viable

The project at https://github.com/encode/mkdocs represents a ground-up rewrite by the original creator of MkDocs. It is **not a viable upgrade path** for us because:

- Removes the entire plugin system (incompatible with all existing plugins, including Material)
- Requires migration from YAML to TOML configuration
- No backwards compatibility with `mkdocs.yml`
- Currently unlicensed as of this writing
- The Material team references this project in their 9.7.x banner, but explicitly does NOT support it yet

**Assessment: Skip entirely.**

### 2. ProperDocs (community fork of MkDocs 1.6.1) — Monitor

A community fork that aims to continue MkDocs 1.x under a new name. Reads existing `mkdocs.yml` out of the box. Low adoption as of April 2026 — still early stage.

**Assessment: Monitor. Do not migrate until adoption is proven.**

### 3. Zensical — Our long-term bet (Path B)

[Zensical](https://zensical.com) is the squidfunk team's own successor to MkDocs + Material. Key facts:

- Built in Rust for performance
- Designed to read existing `mkdocs.yml` configuration (migration path preserved)
- Currently in **alpha** as of April 2026
- Backed by the same team that built Material for MkDocs (highest credibility, proven track record)

**Assessment: This is our long-term migration target once it reaches stable/beta.**

---

## Decision

### Short-Term: Path A — Stay and Pin

**We stay on MkDocs 1.6.1 + Material 9.6.x and use range pins to prevent accidental upgrades into the warning-bearing 9.7.x series.**

Rationale:
- Our current stack is stable and fully functional
- No compelling reason to change right now
- Range pins protect us from accidental `pip install --upgrade` breakage
- If a developer is ever on 9.7.x (e.g., via a loose install), `NO_MKDOCS_2_WARNING=true` suppresses the banner

**Implementation (see `requirements.txt`):**
```
mkdocs>=1.6.1,<2
mkdocs-material>=9.6.23,<9.7
```

- `mkdocs>=1.6.1,<2` — allows patch-level fixes within 1.x if they ever appear; blocks MkDocs 2.0
- `mkdocs-material>=9.6.23,<9.7` — allows patch-level fixes within the 9.6.x series; blocks 9.7.x (banner) and above

> **Note:** To suppress the MkDocs 2.0 banner if running on 9.7.x outside the pinned environment:
> ```bash
> NO_MKDOCS_2_WARNING=true mkdocs serve
> ```

### Mid/Long-Term: Path B — Migrate to Zensical

**We commit to migrating to Zensical when it reaches a stable or generally-available release.**

Rationale:
- Backed by the squidfunk team — the highest-confidence successor
- Rust-based performance
- Reads `mkdocs.yml` — minimises migration cost
- Ensures we don't get stranded on a dead stack indefinitely

**Trigger for action:** Zensical publishes a stable/beta release with Material theme support and a documented migration guide.

**Monitor:**
- https://zensical.com
- https://squidfunk.github.io/mkdocs-material/ (announcements)

---

## Rejected Alternatives

| Option | Reason for rejection |
|---|---|
| Upgrade to mkdocs-material 9.7.x now | Introduces warning banner; no benefit that justifies it |
| Migrate to MkDocs 2.0 (encode/mkdocs) | Removes plugin system; no Material support; unlicensed |
| Migrate to ProperDocs | Too early, low adoption, unproven |
| Do nothing (exact pins forever) | Exact pins are brittle in CI and block legitimate patch fixes |

---

## Review Trigger

Revisit this decision when:
- Zensical publishes a stable/beta release
- MkDocs 1.x receives a security advisory
- mkdocs-material drops support for MkDocs 1.x in the 9.6.x series
