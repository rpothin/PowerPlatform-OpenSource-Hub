#!/usr/bin/env python3
"""sync_repos.py — Source-of-Truth data pipeline for the Power Platform Open-Source Hub.

This script fetches metadata from GitHub repositories matching tracked topics,
then generates structured Markdown files in ``docs/registry/`` that are consumed
by MkDocs to build the public documentation site.

Usage:
    # Live fetch (requires GITHUB_TOKEN for higher rate-limits)
    export GITHUB_TOKEN=ghp_…
    python scripts/sync_repos.py

    # Offline / CI fallback — reads cached JSON from Data/
    python scripts/sync_repos.py --offline
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "Configuration" / "GitHubRepositoriesSearchCriteria.json"
CACHE_PATH = ROOT_DIR / "Data" / "GitHubRepositoriesDetails.json"
REGISTRY_DIR = ROOT_DIR / "docs" / "registry"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sync_repos")


# ===================================================================
# Data acquisition
# ===================================================================
def load_search_criteria() -> list[dict[str, Any]]:
    """Load the topic search criteria from Configuration/."""
    with open(CONFIG_PATH, encoding="utf-8") as fh:
        criteria: list[dict[str, Any]] = json.load(fh)
    log.info("Loaded %d search criteria from %s", len(criteria), CONFIG_PATH.name)
    return criteria


def fetch_repos_live(criteria: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Fetch repository metadata from GitHub using *PyGithub*.

    Searches for each topic defined in the configuration, de-duplicates by
    full repository name, and returns a flat list of normalised dicts.
    """
    try:
        from github import Github  # type: ignore[import-untyped]
    except ImportError:
        log.error(
            "PyGithub is not installed.  Run:  pip install -r requirements.txt"
        )
        sys.exit(1)

    token = os.environ.get("GITHUB_TOKEN", "")
    gh = Github(token) if token else Github()

    seen: set[str] = set()
    repos: list[dict[str, Any]] = []

    for entry in criteria:
        topic = entry["topic"]
        limit = entry.get("searchLimit", 100)
        log.info("Searching topic=%s (limit=%d) …", topic, limit)

        query = f"topic:{topic}"
        results = gh.search_repositories(query=query, sort="stars", order="desc")

        count = 0
        for repo in results:
            if count >= limit:
                break
            if repo.full_name in seen:
                continue
            seen.add(repo.full_name)
            repos.append(_normalise_repo(repo))
            count += 1

    repos.sort(key=lambda r: r.get("stargazerCount", 0), reverse=True)
    log.info("Fetched %d unique repositories from GitHub API.", len(repos))
    return repos


def _normalise_repo(repo: Any) -> dict[str, Any]:
    """Convert a PyGithub *Repository* object into a plain dict matching
    the schema already used by the existing ``Data/`` JSON cache."""
    license_info = repo.license
    latest_release = None
    try:
        rel = repo.get_latest_release()
        latest_release = {
            "name": rel.title,
            "tagName": rel.tag_name,
            "url": rel.html_url,
            "publishedAt": rel.published_at.isoformat() if rel.published_at else None,
        }
    except Exception:
        pass

    return {
        "fullName": repo.full_name,
        "name": repo.name,
        "description": repo.description or "",
        "url": repo.html_url,
        "homepage": repo.homepage or "",
        "language": repo.language or "Unknown",
        "stargazerCount": repo.stargazers_count,
        "forkCount": repo.forks_count,
        "openIssuesCount": repo.open_issues_count,
        "isArchived": repo.archived,
        "createdAt": repo.created_at.isoformat() if repo.created_at else "",
        "updatedAt": repo.updated_at.isoformat() if repo.updated_at else "",
        "license": {
            "key": license_info.spdx_id if license_info else "",
            "name": license_info.name if license_info else "None",
        }
        if license_info
        else None,
        "topics": repo.get_topics(),
        "latestRelease": latest_release,
    }


def load_repos_offline() -> list[dict[str, Any]]:
    """Load cached repository data from ``Data/GitHubRepositoriesDetails.json``."""
    if not CACHE_PATH.exists():
        log.error("Cache file not found: %s", CACHE_PATH)
        sys.exit(1)

    with open(CACHE_PATH, encoding="utf-8") as fh:
        repos: list[dict[str, Any]] = json.load(fh)
    log.info("Loaded %d repositories from offline cache.", len(repos))

    # Filter out archived repos
    repos = [r for r in repos if not r.get("isArchived", False)]
    repos.sort(key=lambda r: r.get("stargazerCount", 0), reverse=True)
    return repos


# ===================================================================
# Markdown generation
# ===================================================================
def _sanitise_filename(name: str) -> str:
    """Convert a repository full-name (owner/repo) into a filesystem-safe slug."""
    return name.replace("/", "_").replace(" ", "-").lower()


def _format_date(iso: str | None) -> str:
    """Return a human-readable date string from an ISO-8601 timestamp."""
    if not iso:
        return "—"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return str(iso)[:10]


def _format_number(n: int | None) -> str:
    """Format large numbers with comma separators."""
    if n is None:
        return "0"
    return f"{n:,}"


def _topics_badges(topics: list[str] | None) -> str:
    """Render topic tags as inline badges."""
    if not topics:
        return "_none_"
    return " ".join(f"`{t}`" for t in sorted(topics))


def generate_repo_page(repo: dict[str, Any]) -> str:
    """Generate a single Markdown page for one repository."""
    full_name = repo.get("fullName", "unknown/unknown")
    name = repo.get("name", full_name)
    desc = repo.get("description", "") or "_No description provided._"
    url = repo.get("url", "#")
    homepage = repo.get("homepage", "")
    language = repo.get("language") or "Unknown"
    stars = _format_number(repo.get("stargazerCount"))
    forks = _format_number(repo.get("forkCount"))
    issues = _format_number(repo.get("openIssuesCount"))
    created = _format_date(repo.get("createdAt"))
    updated = _format_date(repo.get("updatedAt"))
    topics = _topics_badges(repo.get("topics"))
    license_name = "None"
    if repo.get("license"):
        license_name = repo["license"].get("name") or repo["license"].get("key") or "None"

    lines: list[str] = [
        f"# {name}",
        "",
        f"> {desc}",
        "",
        f"[:material-github: View on GitHub]({url}){{ .md-button .md-button--primary }}",
        "",
        "---",
        "",
        "## Overview",
        "",
        "| | |",
        "|---|---|",
        f"| **Full Name** | `{full_name}` |",
        f"| **Language** | {language} |",
        f"| **License** | {license_name} |",
        f"| **Stars** | :star: {stars} |",
        f"| **Forks** | :material-source-fork: {forks} |",
        f"| **Open Issues** | :material-alert-circle-outline: {issues} |",
        f"| **Created** | {created} |",
        f"| **Last Updated** | {updated} |",
    ]

    if homepage:
        lines.append(f"| **Homepage** | [{homepage}]({homepage}) |")

    lines += ["", "## Topics", "", topics]

    # Latest release admonition
    rel = repo.get("latestRelease")
    if rel and rel.get("tagName"):
        rel_name = rel.get("name") or rel["tagName"]
        rel_url = rel.get("url", "#")
        rel_date = _format_date(rel.get("publishedAt"))
        lines += [
            "",
            '!!! success "Latest Release"',
            f"    **[{rel_name}]({rel_url})** — published {rel_date}",
        ]

    # Contribution admonition
    good_first = repo.get("openedGoodFirstIssues", 0)
    help_wanted = repo.get("openedHelpWantedIssues", 0)
    if good_first or help_wanted:
        lines += [
            "",
            '!!! tip "Open to Contributions"',
            f"    - **Good First Issues:** {good_first}",
            f"    - **Help Wanted Issues:** {help_wanted}",
        ]

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines += [
        "",
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
    ]

    return "\n".join(lines)


def generate_registry_index(repos: list[dict[str, Any]]) -> str:
    """Generate the ``docs/registry/index.md`` overview page."""
    total = len(repos)
    languages: dict[str, int] = {}
    total_stars = 0
    contrib_repos = 0

    for r in repos:
        lang = r.get("language") or "Unknown"
        languages[lang] = languages.get(lang, 0) + 1
        total_stars += r.get("stargazerCount", 0)
        if r.get("openedGoodFirstIssues", 0) or r.get("openedHelpWantedIssues", 0):
            contrib_repos += 1

    top_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]
    lang_rows = [f"| {lang} | {count} |" for lang, count in top_langs]

    # Build repo listing table
    repo_rows: list[str] = []
    for r in repos:
        name = r.get("name", "")
        full = r.get("fullName", "")
        slug = _sanitise_filename(full)
        stars = r.get("stargazerCount", 0)
        lang = r.get("language") or "—"
        desc = (r.get("description") or "")[:80]
        if len(r.get("description") or "") > 80:
            desc += "…"
        repo_rows.append(
            f"| [{name}]({slug}.md) | {lang} | :star: {_format_number(stars)} | {desc} |"
        )

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines: list[str] = [
        "---",
        "hide:",
        "  - toc",
        "---",
        "",
        "# :material-format-list-bulleted: Repository Registry",
        "",
        f"Browse the catalogue of **{total}** Power Platform & Copilot Studio",
        "open-source repositories tracked by the Hub.",
        "",
        f'!!! info "Last synced: {now}"',
        f"    Data is refreshed by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py).",
        "",
        "---",
        "",
        "## Summary",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| **Total Repositories** | {total} |",
        f"| **Total Stars** | :star: {_format_number(total_stars)} |",
        f"| **Open to Contributions** | {contrib_repos} |",
        "",
        "### Top Languages",
        "",
        "| Language | Repositories |",
        "|----------|-------------|",
        *lang_rows,
        "",
        "---",
        "",
        "## All Repositories",
        "",
        "| Repository | Language | Stars | Description |",
        "|------------|----------|-------|-------------|",
        *repo_rows,
        "",
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
    ]

    return "\n".join(lines)


def write_registry(repos: list[dict[str, Any]]) -> None:
    """Write Markdown files for every repository and the registry index."""
    # Ensure target directory exists and is clean
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)

    # Remove old auto-generated repo pages (keep index until we re-write it)
    for existing in REGISTRY_DIR.glob("*.md"):
        if existing.name != "index.md":
            existing.unlink()

    written = 0
    for repo in repos:
        full_name = repo.get("fullName", "")
        if not full_name:
            continue
        slug = _sanitise_filename(full_name)
        page_path = REGISTRY_DIR / f"{slug}.md"
        page_path.write_text(generate_repo_page(repo), encoding="utf-8")
        written += 1

    # Write the index
    index_path = REGISTRY_DIR / "index.md"
    index_path.write_text(generate_registry_index(repos), encoding="utf-8")
    log.info("Wrote %d repository pages + index to %s", written, REGISTRY_DIR)


# ===================================================================
# CLI entry-point
# ===================================================================
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync Power Platform repository data and generate MkDocs registry pages.",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Use cached Data/GitHubRepositoriesDetails.json instead of calling the GitHub API.",
    )
    args = parser.parse_args()

    if args.offline:
        repos = load_repos_offline()
    else:
        criteria = load_search_criteria()
        repos = fetch_repos_live(criteria)

    write_registry(repos)
    log.info("Done ✓")


if __name__ == "__main__":
    main()
