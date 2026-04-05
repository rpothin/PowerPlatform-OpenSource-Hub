#!/usr/bin/env python3
"""sync_repos.py — Source-of-Truth data pipeline for the Power Platform Open-Source Hub.

This script fetches metadata from GitHub repositories matching tracked topics,
then generates structured Markdown files in ``docs/registry/`` that are consumed
by MkDocs to build the public documentation site.

Usage:
    # Live fetch (GITHUB_TOKEN recommended for higher rate-limits)
    export GITHUB_TOKEN=ghp_…
    python scripts/sync_repos.py
"""

from __future__ import annotations

import json
import logging
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT_DIR / "configuration" / "GitHubRepositoriesSearchCriteria.json"
REGISTRY_DIR = ROOT_DIR / "docs" / "registry"
CONTRIBUTE_DIR = ROOT_DIR / "docs" / "contribute"
OVERRIDES_DIR = ROOT_DIR / "overrides"

# ---------------------------------------------------------------------------
# Repository selection thresholds
# ---------------------------------------------------------------------------
MIN_STARS = 10
CONTRIBUTION_ISSUE_DISPLAY_LIMIT = 5
CONTRIBUTION_GRAPHQL_BATCH_SIZE = 20
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
CONTRIBUTION_ACTIVE_MAX_AGE_DAYS = 180
CONTRIBUTION_OLDER_MAX_AGE_DAYS = 365

# ---------------------------------------------------------------------------
# Required service coverage
# ---------------------------------------------------------------------------
REQUIRED_SERVICE_SLUGS = (
    "power-platform",
    "power-apps",
    "power-automate",
    "copilot-studio",
    "dataverse",
    "pro-development",
    "dynamics-365",
)

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
def _invalid_config(message: str) -> None:
    """Abort execution with a clear configuration validation error."""
    raise SystemExit(f"Invalid search criteria in {CONFIG_PATH.name}: {message}")


def _validate_non_empty_string(value: Any, field_name: str) -> str:
    """Return a stripped string value or fail fast when invalid."""
    if not isinstance(value, str) or not value.strip():
        _invalid_config(f"{field_name} must be a non-empty string")
    return value.strip()


def _validate_positive_int(value: Any, field_name: str) -> int:
    """Return a positive integer value or fail fast when invalid."""
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        _invalid_config(f"{field_name} must be a positive integer")
    return value


def load_search_criteria() -> dict[str, dict[str, Any]]:
    """Load and validate the service-centric search criteria configuration."""
    try:
        with open(CONFIG_PATH, encoding="utf-8") as fh:
            raw_criteria = json.load(fh)
    except json.JSONDecodeError as exc:
        _invalid_config(f"invalid JSON ({exc})")
    except OSError as exc:
        _invalid_config(str(exc))

    if not isinstance(raw_criteria, dict) or not raw_criteria:
        _invalid_config("top-level JSON object keyed by service slug is required")

    missing_services = [slug for slug in REQUIRED_SERVICE_SLUGS if slug not in raw_criteria]
    if missing_services:
        _invalid_config(
            "missing required services: " + ", ".join(sorted(missing_services))
        )

    criteria: dict[str, dict[str, Any]] = {}
    total_topics = 0

    for slug, raw_service in raw_criteria.items():
        if not isinstance(slug, str) or slug != slug.strip().lower():
            _invalid_config("service keys must be lowercase slug strings")
        if not isinstance(raw_service, dict):
            _invalid_config(f"{slug} must map to an object")

        raw_topics = raw_service.get("topics")
        raw_aliases = raw_service.get("aliases", [])
        if not isinstance(raw_topics, list) or not raw_topics:
            _invalid_config(f"{slug}.topics must be a non-empty array")
        if not isinstance(raw_aliases, list):
            _invalid_config(f"{slug}.aliases must be an array when provided")

        topics: list[dict[str, Any]] = []
        tracked_topic_names: set[str] = set()
        for index, raw_topic in enumerate(raw_topics):
            if not isinstance(raw_topic, dict):
                _invalid_config(f"{slug}.topics[{index}] must be an object")

            topic_name = _validate_non_empty_string(
                raw_topic.get("name"),
                f"{slug}.topics[{index}].name",
            ).lower()
            if topic_name in tracked_topic_names:
                _invalid_config(f"{slug}.topics contains duplicate topic '{topic_name}'")

            topics.append(
                {
                    "name": topic_name,
                    "searchLimit": _validate_positive_int(
                        raw_topic.get("searchLimit"),
                        f"{slug}.topics[{index}].searchLimit",
                    ),
                }
            )
            tracked_topic_names.add(topic_name)

        aliases: list[str] = []
        seen_aliases: set[str] = set()
        for index, raw_alias in enumerate(raw_aliases):
            alias = _validate_non_empty_string(
                raw_alias,
                f"{slug}.aliases[{index}]",
            ).lower()
            if alias in tracked_topic_names or alias in seen_aliases:
                _invalid_config(f"{slug}.aliases contains duplicate topic '{alias}'")
            aliases.append(alias)
            seen_aliases.add(alias)

        criteria[slug] = {
            "categoryDisplayName": _validate_non_empty_string(
                raw_service.get("categoryDisplayName"),
                f"{slug}.categoryDisplayName",
            ),
            "icon": _validate_non_empty_string(raw_service.get("icon"), f"{slug}.icon"),
            "description": _validate_non_empty_string(
                raw_service.get("description"),
                f"{slug}.description",
            ),
            "topics": topics,
            "aliases": aliases,
        }
        total_topics += len(topics)

    log.info(
        "Loaded %d services / %d tracked topics from %s",
        len(criteria),
        total_topics,
        CONFIG_PATH.name,
    )
    return criteria


def fetch_repos_live(
    criteria: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, int | str]]]:
    """Fetch repository metadata from GitHub using *PyGithub*.

    Searches for each topic defined in the configuration, applies the minimum
    star threshold, de-duplicates by full repository name, and returns a flat
    list of normalised dicts along with the topics that reached their
    configured search limit.
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
    limit_hits: list[dict[str, int | str]] = []

    for service_slug, service in criteria.items():
        for topic in service["topics"]:
            topic_name = topic["name"]
            limit = topic["searchLimit"]
            log.info(
                "Searching service=%s topic=%s (limit=%d, min_stars=%d) …",
                service_slug,
                topic_name,
                limit,
                MIN_STARS,
            )

            query = f"topic:{topic_name} stars:>={MIN_STARS}"
            results = gh.search_repositories(query=query, sort="stars", order="desc")

            count = 0
            for repo in results:
                if count >= limit:
                    break
                if repo.stargazers_count < MIN_STARS:
                    continue
                if repo.full_name in seen:
                    continue
                seen.add(repo.full_name)
                repos.append(_normalise_repo(repo))
                count += 1

            if count == limit:
                limit_hits.append(
                    {
                        "service": service_slug,
                        "topic": topic_name,
                        "count": count,
                        "limit": limit,
                    }
                )

    repos.sort(key=lambda r: r.get("stargazerCount", 0), reverse=True)
    log.info(
        "Fetched %d unique repositories from GitHub API after applying min_stars=%d.",
        len(repos),
        MIN_STARS,
    )
    return repos, limit_hits


def _parse_datetime(iso: str | None) -> datetime | None:
    """Return a timezone-aware ``datetime`` parsed from ISO-8601."""
    if not iso or not isinstance(iso, str):
        return None
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _format_graphql_datetime(value: datetime) -> str:
    """Return a UTC ISO-8601 timestamp suitable for GraphQL ``since`` filters."""
    return (
        value.astimezone(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _build_contribution_query(
    repos: list[dict[str, Any]],
    reference_time: datetime,
) -> tuple[str, dict[str, dict[str, Any]]]:
    """Build a batched GraphQL query for contribution-opportunity issues."""
    aliases: dict[str, dict[str, Any]] = {}
    active_since = _format_graphql_datetime(
        reference_time - timedelta(days=CONTRIBUTION_ACTIVE_MAX_AGE_DAYS)
    )
    visible_since = _format_graphql_datetime(
        reference_time - timedelta(days=CONTRIBUTION_OLDER_MAX_AGE_DAYS)
    )
    query_parts = [
        "query ContributionOpportunities {",
        "  rateLimit { cost remaining resetAt }",
    ]

    for index, repo in enumerate(repos):
        full_name = repo.get("fullName", "")
        if "/" not in full_name:
            continue

        owner, name = full_name.split("/", 1)
        alias = f"repo_{index}"
        aliases[alias] = repo
        query_parts += [
            f"  {alias}: repository(owner: {json.dumps(owner)}, name: {json.dumps(name)}) {{",
            "    nameWithOwner",
            "    goodFirstActive: issues(",
            '      states: OPEN, labels: ["good first issue"],',
            f"      filterBy: {{since: {json.dumps(active_since)}}},",
            f"      first: {CONTRIBUTION_ISSUE_DISPLAY_LIMIT},",
            "      orderBy: {field: UPDATED_AT, direction: DESC}",
            "    ) {",
            "      totalCount",
            "      nodes {",
            "        number",
            "        title",
            "        url",
            "        createdAt",
            "        updatedAt",
            "        author {",
            "          login",
            "          url",
            "        }",
            "      }",
            "    }",
            "    goodFirstVisible: issues(",
            '      states: OPEN, labels: ["good first issue"],',
            f"      filterBy: {{since: {json.dumps(visible_since)}}},",
            f"      last: {CONTRIBUTION_ISSUE_DISPLAY_LIMIT},",
            "      orderBy: {field: UPDATED_AT, direction: DESC}",
            "    ) {",
            "      totalCount",
            "      nodes {",
            "        number",
            "        title",
            "        url",
            "        createdAt",
            "        updatedAt",
            "        author {",
            "          login",
            "          url",
            "        }",
            "      }",
            "    }",
            "    helpWantedActive: issues(",
            '      states: OPEN, labels: ["help wanted"],',
            f"      filterBy: {{since: {json.dumps(active_since)}}},",
            f"      first: {CONTRIBUTION_ISSUE_DISPLAY_LIMIT},",
            "      orderBy: {field: UPDATED_AT, direction: DESC}",
            "    ) {",
            "      totalCount",
            "      nodes {",
            "        number",
            "        title",
            "        url",
            "        createdAt",
            "        updatedAt",
            "        author {",
            "          login",
            "          url",
            "        }",
            "      }",
            "    }",
            "    helpWantedVisible: issues(",
            '      states: OPEN, labels: ["help wanted"],',
            f"      filterBy: {{since: {json.dumps(visible_since)}}},",
            f"      last: {CONTRIBUTION_ISSUE_DISPLAY_LIMIT},",
            "      orderBy: {field: UPDATED_AT, direction: DESC}",
            "    ) {",
            "      totalCount",
            "      nodes {",
            "        number",
            "        title",
            "        url",
            "        createdAt",
            "        updatedAt",
            "        author {",
            "          login",
            "          url",
            "        }",
            "      }",
            "    }",
            "  }",
        ]

    query_parts.append("}")
    return "\n".join(query_parts), aliases


def _run_graphql_query(query: str, token: str) -> dict[str, Any]:
    """Execute a GitHub GraphQL query and return the decoded JSON payload."""
    request = urllib.request.Request(
        GITHUB_GRAPHQL_URL,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={
            "Authorization": f"bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "PowerPlatform-OpenSource-Hub-sync",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub GraphQL HTTP {exc.code}: {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"GitHub GraphQL request failed: {exc.reason}") from exc


def _normalise_issue(issue: dict[str, Any]) -> dict[str, Any]:
    """Convert a GraphQL issue node into a serialisable dict."""
    author = issue.get("author") or {}
    return {
        "number": issue.get("number"),
        "title": issue.get("title") or "Untitled issue",
        "url": issue.get("url") or "#",
        "createdAt": issue.get("createdAt"),
        "updatedAt": issue.get("updatedAt"),
        "author": {
            "login": author.get("login") or "unknown",
            "url": author.get("url") or "",
        },
    }


def _issue_activity_iso(issue: dict[str, Any]) -> str | None:
    """Return the freshest known activity timestamp for an issue."""
    return issue.get("updatedAt") or issue.get("createdAt")


def _issue_updated_age_days(
    issue: dict[str, Any],
    reference_time: datetime,
) -> int | None:
    """Return age in days based strictly on the issue ``updatedAt`` timestamp."""
    dt = _parse_datetime(issue.get("updatedAt"))
    if not dt:
        return None
    return max(0, int((reference_time - dt).total_seconds() // 86400))


def _filter_older_contribution_issues(
    issues: list[dict[str, Any]],
    reference_time: datetime,
) -> list[dict[str, Any]]:
    """Return issues whose ``updatedAt`` falls in the older/backlog window."""
    older = [
        issue
        for issue in issues
        if (
            (age := _issue_updated_age_days(issue, reference_time)) is not None
            and CONTRIBUTION_ACTIVE_MAX_AGE_DAYS < age <= CONTRIBUTION_OLDER_MAX_AGE_DAYS
        )
    ]
    return sorted(
        older,
        key=lambda issue: _parse_datetime(issue.get("updatedAt"))
        or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )


def fetch_contribution_opportunities(
    repos: list[dict[str, Any]],
) -> dict[str, Any]:
    """Enrich repositories with open contribution-opportunity issue data."""
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    reference_time = datetime.now(timezone.utc)
    status = {
        "state": "complete",
        "message": "Contribution-opportunity data refreshed from GitHub GraphQL.",
        "reposRequested": len(repos),
        "reposLoaded": 0,
    }

    if not repos:
        return status

    if not token:
        status.update(
            {
                "state": "skipped",
                "message": (
                    "Contribution-opportunity sync skipped because GITHUB_TOKEN was "
                    "not available."
                ),
            }
        )
        log.warning(status["message"])
        return status

    failed_batches = 0
    for start in range(0, len(repos), CONTRIBUTION_GRAPHQL_BATCH_SIZE):
        batch = repos[start : start + CONTRIBUTION_GRAPHQL_BATCH_SIZE]
        query, aliases = _build_contribution_query(batch, reference_time)
        if not aliases:
            continue

        try:
            payload = _run_graphql_query(query, token)
        except RuntimeError as exc:
            failed_batches += 1
            log.warning(
                "Failed to fetch contribution opportunities for batch %d-%d: %s",
                start + 1,
                start + len(batch),
                exc,
            )
            continue

        errors = payload.get("errors") or []
        if errors:
            failed_batches += 1
            log.warning(
                "GitHub GraphQL returned %d error(s) for batch %d-%d; leaving "
                "contribution data unchanged for that batch.",
                len(errors),
                start + 1,
                start + len(batch),
            )
            for error in errors[:3]:
                log.warning("GraphQL error: %s", error.get("message", error))
            continue

        data = payload.get("data") or {}
        rate_limit = data.get("rateLimit") or {}
        if rate_limit:
            log.info(
                "Contribution GraphQL batch %d-%d cost=%s remaining=%s reset=%s",
                start + 1,
                start + len(batch),
                rate_limit.get("cost", "?"),
                rate_limit.get("remaining", "?"),
                rate_limit.get("resetAt", "?"),
            )

        for alias, repo in aliases.items():
            repo_data = data.get(alias)
            if not repo_data:
                continue

            good_first_active = repo_data.get("goodFirstActive") or {}
            good_first_visible = repo_data.get("goodFirstVisible") or {}
            help_wanted_active = repo_data.get("helpWantedActive") or {}
            help_wanted_visible = repo_data.get("helpWantedVisible") or {}

            recent_good_first = [
                _normalise_issue(issue)
                for issue in good_first_active.get("nodes") or []
            ]
            recent_help_wanted = [
                _normalise_issue(issue)
                for issue in help_wanted_active.get("nodes") or []
            ]
            older_good_first_candidates = [
                _normalise_issue(issue)
                for issue in good_first_visible.get("nodes") or []
            ]
            older_help_wanted_candidates = [
                _normalise_issue(issue)
                for issue in help_wanted_visible.get("nodes") or []
            ]

            active_good_first_count = good_first_active.get("totalCount", 0) or 0
            active_help_wanted_count = help_wanted_active.get("totalCount", 0) or 0
            visible_good_first_count = good_first_visible.get("totalCount", 0) or 0
            visible_help_wanted_count = help_wanted_visible.get("totalCount", 0) or 0

            repo["openedGoodFirstIssues"] = active_good_first_count
            repo["openedHelpWantedIssues"] = active_help_wanted_count
            repo["olderGoodFirstIssues"] = max(
                visible_good_first_count - active_good_first_count,
                0,
            )
            repo["olderHelpWantedIssues"] = max(
                visible_help_wanted_count - active_help_wanted_count,
                0,
            )
            repo["staleGoodFirstIssues"] = 0
            repo["staleHelpWantedIssues"] = 0
            repo["recentGoodFirstIssues"] = recent_good_first
            repo["recentHelpWantedIssues"] = recent_help_wanted
            repo["olderGoodFirstIssuesList"] = _filter_older_contribution_issues(
                older_good_first_candidates,
                reference_time,
            )[:CONTRIBUTION_ISSUE_DISPLAY_LIMIT]
            repo["olderHelpWantedIssuesList"] = _filter_older_contribution_issues(
                older_help_wanted_candidates,
                reference_time,
            )[:CONTRIBUTION_ISSUE_DISPLAY_LIMIT]
            status["reposLoaded"] += 1

    if failed_batches:
        if status["reposLoaded"]:
            status["state"] = "partial"
            status["message"] = (
                "Contribution-opportunity data was only partially refreshed; some "
                "repositories may show stale or unavailable counts."
            )
        else:
            status["state"] = "failed"
            status["message"] = (
                "Contribution-opportunity sync failed; repository metadata was left "
                "without issue counts."
            )

    log.info(
        "Contribution opportunities synced for %d/%d repositories (state=%s).",
        status["reposLoaded"],
        status["reposRequested"],
        status["state"],
    )
    if status["state"] != "complete":
        log.warning(status["message"])
    return status


def _normalise_repo(repo: Any) -> dict[str, Any]:
    """Convert a PyGithub *Repository* object into a plain dict matching
    the schema used by the generated registry pages."""
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
        "watchersCount": repo.subscribers_count,
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
        "openedGoodFirstIssues": 0,
        "openedHelpWantedIssues": 0,
        "olderGoodFirstIssues": 0,
        "olderHelpWantedIssues": 0,
        "staleGoodFirstIssues": 0,
        "staleHelpWantedIssues": 0,
        "recentGoodFirstIssues": [],
        "recentHelpWantedIssues": [],
        "olderGoodFirstIssuesList": [],
        "olderHelpWantedIssuesList": [],
    }

def log_search_limit_summary(limit_hits: list[dict[str, int | str]]) -> None:
    """Log a concise summary of topics that reached their configured search limit."""
    if not limit_hits:
        log.info("Topics reaching their configured search limit: none.")
        return

    summary = ", ".join(
        f"{hit['topic']} [{hit['service']}] ({hit['count']}/{hit['limit']})"
        for hit in limit_hits
    )
    log.info(
        "Topics reaching their configured search limit (%d): %s",
        len(limit_hits),
        summary,
    )


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
    dt = _parse_datetime(iso)
    if not dt:
        return str(iso)[:10]
    return dt.strftime("%Y-%m-%d")


def _format_number(n: int | None) -> str:
    """Format large numbers with comma separators."""
    if n is None:
        return "0"
    return f"{n:,}"


def _latest_issue_date(repo: dict[str, Any]) -> str:
    """Return the most recent contribution-issue activity date for a repository."""
    dates = [
        _issue_activity_iso(issue)
        for issue in (repo.get("recentGoodFirstIssues") or [])
        + (repo.get("recentHelpWantedIssues") or [])
        + (repo.get("olderGoodFirstIssuesList") or [])
        + (repo.get("olderHelpWantedIssuesList") or [])
        if _issue_activity_iso(issue)
    ]
    if not dates:
        return "—"
    return _format_date(max(dates))


def _render_issue_list(issues: list[dict[str, Any]], indent: str = "") -> list[str]:
    """Render issue dictionaries as Markdown bullet items."""
    if not issues:
        return [f"{indent}- _No recent issues found._"]

    lines: list[str] = []
    for issue in issues:
        author = issue.get("author") or {}
        author_login = author.get("login") or "unknown"
        author_url = author.get("url") or ""
        author_link = (
            f"[@{author_login}]({author_url})" if author_url else f"@{author_login}"
        )
        created = _format_date(issue.get("createdAt"))
        updated = _format_date(issue.get("updatedAt") or issue.get("createdAt"))
        recency = f"updated {updated}"
        if created != updated:
            recency += f" (opened {created})"
        lines.append(
            f"{indent}- [#{issue.get('number')} {issue.get('title', 'Untitled issue')}]"
            f"({issue.get('url', '#')}) — {recency} by {author_link}"
        )
    return lines


def _topics_badges(topics: list[str] | None) -> str:
    """Render topic tags as styled span badges."""
    if not topics:
        return "_none_"
    return " ".join(f'<span class="registry-badge">{t}</span>' for t in sorted(topics))


def _service_category_topics(service: dict[str, Any]) -> set[str]:
    """Return the tracked and alias topics used for service categorisation."""
    tracked_topics = {topic["name"] for topic in service.get("topics", [])}
    return tracked_topics | set(service.get("aliases", []))


def _categorize_repo(
    repo: dict[str, Any],
    criteria: dict[str, dict[str, Any]],
) -> list[str]:
    """Return the list of service slugs a repository belongs to."""
    repo_topics = {t.lower() for t in (repo.get("topics") or [])}
    return [
        slug
        for slug, service in criteria.items()
        if repo_topics & _service_category_topics(service)
    ]


def generate_repo_page(repo: dict[str, Any]) -> str:
    """Generate a single Markdown page for one repository."""
    full_name = repo.get("fullName", "unknown/unknown")
    name = repo.get("name", full_name)
    desc = repo.get("description", "") or "_No description provided._"
    url = repo.get("url", "#")
    homepage = repo.get("homepage", "")
    language = repo.get("language") or "Unknown"
    stars = _format_number(repo.get("stargazerCount"))
    watchers = repo.get("watchersCount")
    watchers_display = _format_number(watchers) if watchers is not None else "—"
    community_metrics = f":star: {stars}"
    if watchers is not None:
        community_metrics += f" · :material-eye: {watchers_display}"
    forks = _format_number(repo.get("forkCount"))
    issues = _format_number(repo.get("openIssuesCount"))
    created = _format_date(repo.get("createdAt"))
    updated = _format_date(repo.get("updatedAt"))
    topics = _topics_badges(repo.get("topics"))
    license_name = "None"
    if repo.get("license"):
        license_name = repo["license"].get("name") or repo["license"].get("key") or "None"

    lines: list[str] = [
        '<div class="registry-detail" markdown>',
        "",
        f"# {name}",
        "",
        f"> {desc}",
        "",
        f"[:material-github: View on GitHub]({url}){{ .md-button .md-button--primary }}",
        "",
        "---",
        "",
        '<div class="registry-overview" markdown>',
        "",
        "## Overview",
        "",
        "| | |",
        "|---|---|",
        f"| **Full Name** | `{full_name}` |",
        f"| **Language** | {language} |",
        f"| **License** | {license_name} |",
        f"| **Community** | {community_metrics} |",
        f"| **Forks** | :material-source-fork: {forks} |",
        f"| **Open Issues** | :material-alert-circle-outline: {issues} |",
        f"| **Created** | {created} |",
        f"| **Last Updated** | {updated} |",
    ]

    if homepage:
        lines.append(f"| **Homepage** | [{homepage}]({homepage}) |")

    lines += ["", "</div>", "", "## Topics", "", topics]

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
    older_good_first = repo.get("olderGoodFirstIssues", 0)
    older_help_wanted = repo.get("olderHelpWantedIssues", 0)
    recent_good_first = repo.get("recentGoodFirstIssues") or []
    recent_help_wanted = repo.get("recentHelpWantedIssues") or []
    older_good_first_list = repo.get("olderGoodFirstIssuesList") or []
    older_help_wanted_list = repo.get("olderHelpWantedIssuesList") or []
    if good_first or help_wanted:
        lines += [
            "",
            '!!! tip "Active Contribution Opportunities"',
            f"    - **Good First Issues (updated <= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days):** {good_first}",
            f"    - **Help Wanted Issues (updated <= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days):** {help_wanted}",
        ]
        if older_good_first or older_help_wanted:
            lines += [
                f"    - **Older labeled backlog ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days):** {older_good_first + older_help_wanted}",
            ]
    elif older_good_first or older_help_wanted:
        lines += [
            "",
            '!!! note "No active opportunities in the last 180 days"',
            "    This repository still has labeled contribution issues updated within the last year.",
            f"    - **Older Good First Issues ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days):** {older_good_first}",
            f"    - **Older Help Wanted Issues ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days):** {older_help_wanted}",
        ]

    if recent_good_first or recent_help_wanted:
        lines += ["", "## Active Contribution Opportunities", ""]
    if recent_good_first:
        lines += [
            "### Active Good First Issues",
            "",
            *_render_issue_list(recent_good_first),
            "",
        ]
    if recent_help_wanted:
        lines += [
            "### Active Help Wanted Issues",
            "",
            *_render_issue_list(recent_help_wanted),
            "",
        ]
    if older_good_first_list or older_help_wanted_list:
        lines += [
            "",
            f'??? note "Older labeled opportunities ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days)"',
        ]
        if older_good_first_list:
            lines += [
                "",
                "    **Good First Issues**",
                "",
                *_render_issue_list(older_good_first_list, indent="    "),
            ]
        if older_help_wanted_list:
            lines += [
                "",
                "    **Help Wanted Issues**",
                "",
                *_render_issue_list(older_help_wanted_list, indent="    "),
            ]
        lines += [""]

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines += [
        "",
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
        "</div>",
        "",
    ]

    return "\n".join(lines)


def generate_contribution_page(
    repos: list[dict[str, Any]],
    contribution_status: dict[str, Any],
) -> str:
    """Generate the contribution opportunities landing page."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    repos_with_good_first = sorted(
        [repo for repo in repos if repo.get("openedGoodFirstIssues", 0)],
        key=lambda repo: (
            repo.get("openedGoodFirstIssues", 0),
            repo.get("openedHelpWantedIssues", 0),
            repo.get("stargazerCount", 0),
        ),
        reverse=True,
    )
    repos_with_help_wanted = sorted(
        [repo for repo in repos if repo.get("openedHelpWantedIssues", 0)],
        key=lambda repo: (
            repo.get("openedHelpWantedIssues", 0),
            repo.get("openedGoodFirstIssues", 0),
            repo.get("stargazerCount", 0),
        ),
        reverse=True,
    )

    repos_with_active_opportunities = sorted(
        [
            repo
            for repo in repos
            if repo.get("openedGoodFirstIssues", 0) or repo.get("openedHelpWantedIssues", 0)
        ],
        key=lambda repo: (
            repo.get("openedGoodFirstIssues", 0) + repo.get("openedHelpWantedIssues", 0),
            repo.get("stargazerCount", 0),
        ),
        reverse=True,
    )
    repos_with_older_opportunities = sorted(
        [
            repo
            for repo in repos
            if repo.get("olderGoodFirstIssues", 0) or repo.get("olderHelpWantedIssues", 0)
        ],
        key=lambda repo: (
            repo.get("olderGoodFirstIssues", 0) + repo.get("olderHelpWantedIssues", 0),
            repo.get("stargazerCount", 0),
        ),
        reverse=True,
    )

    total_good_first = sum(repo.get("openedGoodFirstIssues", 0) for repo in repos)
    total_help_wanted = sum(repo.get("openedHelpWantedIssues", 0) for repo in repos)
    total_older_good_first = sum(repo.get("olderGoodFirstIssues", 0) for repo in repos)
    total_older_help_wanted = sum(repo.get("olderHelpWantedIssues", 0) for repo in repos)
    overview_rows = [
        "| Metric | Value |",
        "|--------|-------|",
        f"| **Tracked repositories** | {len(repos)} |",
        f"| **Repositories with active opportunities** | {len(repos_with_active_opportunities)} |",
        f"| **Active Good First Issues (<= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)** | {total_good_first} |",
        f"| **Active Help Wanted Issues (<= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)** | {total_help_wanted} |",
        f"| **Repositories with older / backlog opportunities** | {len(repos_with_older_opportunities)} |",
        f"| **Older Good First Issues ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days)** | {total_older_good_first} |",
        f"| **Older Help Wanted Issues ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days)** | {total_older_help_wanted} |",
    ]

    repo_rows = [
        "| Repository | Good First Issues | Help Wanted Issues | Latest Activity |",
        "|------------|-------------------|--------------------|-----------------|",
    ]
    repo_rows.extend(
        [
            f"| [{repo.get('fullName', repo.get('name', 'unknown'))}]"
            f"(../registry/{_sanitise_filename(repo.get('fullName', 'unknown/unknown'))}.md) | "
            f"{repo.get('openedGoodFirstIssues', 0)} | {repo.get('openedHelpWantedIssues', 0)} | "
            f"{_latest_issue_date(repo)} |"
            for repo in repos_with_active_opportunities
        ]
        or [
            f"| _No tracked repositories currently expose active contribution opportunities (<= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)._ | 0 | 0 | — |"
        ]
    )

    status_block: list[str] = []
    state = contribution_status.get("state")
    if state == "skipped":
        status_block = [
            '!!! warning "Contribution sync skipped"',
            f"    {contribution_status.get('message')}",
            "",
        ]
    elif state in {"partial", "failed"}:
        status_block = [
            '!!! warning "Contribution sync incomplete"',
            f"    {contribution_status.get('message')}",
            "",
        ]
    else:
        status_block = [
            '!!! info "Contribution issue data"',
            f"    {contribution_status.get('message')}",
            "",
        ]

    lines: list[str] = [
        "---",
        "hide:",
        "  - toc",
        "---",
        "",
        "# :material-hand-heart: Contribution Opportunities",
        "",
        "Discover tracked repositories with active contribution opportunities "
        "updated in the last six months. Older labeled issues updated within the "
        "last year are grouped separately as backlog.",
        "",
        f'!!! info "Last synced: {now}"',
        "    Repository metadata and issue details are generated by "
        "[`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py).",
        "",
        *status_block,
        '!!! info "Freshness windows"',
        f"    Active opportunities use issue `updatedAt` within the last {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days.",
        f"    Older / backlog opportunities use issue `updatedAt` between {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1} and {CONTRIBUTION_OLDER_MAX_AGE_DAYS} days.",
        f"    Contribution-specific counts and lists hide issues older than {CONTRIBUTION_OLDER_MAX_AGE_DAYS} days.",
        "",
        "---",
        "",
        '<div class="registry-summary" markdown>',
        "",
        "## Summary",
        "",
        *overview_rows,
        "",
        "</div>",
        "",
        "---",
        "",
        f"## Active Repositories (updated <= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)",
        "",
        *repo_rows,
        "",
    ]

    sections = [
        (
            f"Active Good First Issues (updated <= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)",
            "openedGoodFirstIssues",
            "recentGoodFirstIssues",
            repos_with_good_first,
        ),
        (
            f"Active Help Wanted Issues (updated <= {CONTRIBUTION_ACTIVE_MAX_AGE_DAYS} days)",
            "openedHelpWantedIssues",
            "recentHelpWantedIssues",
            repos_with_help_wanted,
        ),
    ]

    for title, count_key, issues_key, section_repos in sections:
        lines += ["---", "", f"## {title}", ""]
        if not section_repos:
            lines.append("_No matching open issues were returned for this sync._")
            lines += ["", ""]
            continue

        for repo in section_repos:
            full_name = repo.get("fullName", repo.get("name", "unknown/unknown"))
            repo_link = f"../registry/{_sanitise_filename(full_name)}.md"
            issue_count = repo.get(count_key, 0)
            lines += [
                f'??? note "[{full_name}]({repo_link}) — {_format_number(issue_count)} open"',
                *(
                     _render_issue_list(repo.get(issues_key) or [], indent="    ")
                     + (
                        [
                            "    "
                            f"_Showing the {min(issue_count, CONTRIBUTION_ISSUE_DISPLAY_LIMIT)} most recently updated issue(s)._"
                        ]
                        if issue_count > CONTRIBUTION_ISSUE_DISPLAY_LIMIT
                        else []
                    )
                ),
                "",
            ]

    if repos_with_older_opportunities:
        lines += [
            "---",
            "",
            f"## Older Labeled Opportunities ({CONTRIBUTION_ACTIVE_MAX_AGE_DAYS + 1}-{CONTRIBUTION_OLDER_MAX_AGE_DAYS} days)",
            "",
            "These issues still showed activity within the last year, but they are not recent enough to count as active opportunities.",
            "",
        ]
        for repo in repos_with_older_opportunities:
            full_name = repo.get("fullName", repo.get("name", "unknown/unknown"))
            repo_link = f"../registry/{_sanitise_filename(full_name)}.md"
            older_total = repo.get("olderGoodFirstIssues", 0) + repo.get("olderHelpWantedIssues", 0)
            lines += [
                f'??? note "[{full_name}]({repo_link}) — {_format_number(older_total)} older labeled issue(s)"',
            ]
            if repo.get("olderGoodFirstIssuesList"):
                lines += [
                    "",
                    "    **Good First Issues**",
                    "",
                    *_render_issue_list(repo.get("olderGoodFirstIssuesList") or [], indent="    "),
                ]
            if repo.get("olderHelpWantedIssuesList"):
                lines += [
                    "",
                    "    **Help Wanted Issues**",
                    "",
                    *_render_issue_list(repo.get("olderHelpWantedIssuesList") or [], indent="    "),
                ]
            lines += [""]

    lines += [
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
    ]
    return "\n".join(lines)


def generate_registry_index(repos: list[dict[str, Any]]) -> str:
    """Generate the ``docs/registry/index.md`` overview page with card-based layout."""
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

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # Build card grid for top 50 repos
    top_repos = repos[:50]
    card_items: list[str] = []
    for r in top_repos:
        name = r.get("name", "")
        full = r.get("fullName", "")
        slug = _sanitise_filename(full)
        stars = r.get("stargazerCount", 0)
        watchers = r.get("watchersCount")
        watcher_text = (
            f" · :material-eye: {_format_number(watchers)} watchers"
            if watchers is not None
            else ""
        )
        lang = r.get("language") or "Unknown"
        desc = (r.get("description") or "No description")[:100]
        if len(r.get("description") or "") > 100:
            desc += "…"
        card_items.append(
            f"-   :star: **{name}** · {_format_number(stars)} stars{watcher_text} · `{lang}`\n"
            f"\n"
            f"    ---\n"
            f"\n"
            f"    {desc}\n"
            f"\n"
            f"    [:octicons-arrow-right-24: View details]({slug}.md)"
        )

    cards_block = "\n\n".join(card_items)

    # Build table for remaining repos
    remaining = repos[50:]
    remaining_rows: list[str] = []
    for r in remaining:
        name = r.get("name", "")
        full = r.get("fullName", "")
        slug = _sanitise_filename(full)
        stars = r.get("stargazerCount", 0)
        lang = r.get("language") or "—"
        desc = (r.get("description") or "")[:80]
        if len(r.get("description") or "") > 80:
            desc += "…"
        remaining_rows.append(
            f"| [{name}]({slug}.md) | {lang} | :star: {_format_number(stars)} | {desc} |"
        )

    remaining_table = "\n".join(remaining_rows)

    remaining_section = ""
    if remaining_rows:
        remaining_section = (
            "\n---\n\n"
            "## All Repositories\n\n"
            '??? note "View all remaining repositories"\n\n'
            "    | Repository | Language | Stars | Description |\n"
            "    |------------|----------|-------|-------------|\n"
            + "\n".join(f"    {row}" for row in remaining_rows)
        )

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
        '<div class="registry-summary" markdown>',
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
        "</div>",
        "",
        "---",
        "",
        "## Featured Repositories",
        "",
        '<div class="grid cards" markdown>',
        "",
        cards_block,
        "",
        "</div>",
        remaining_section,
        "",
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
    ]

    return "\n".join(lines)


def generate_category_page(service: dict[str, Any], repos: list[dict[str, Any]]) -> str:
    """Generate a Markdown page for a single service category."""
    label = service["categoryDisplayName"]
    icon = service["icon"]
    description = service["description"]
    total = len(repos)
    total_stars = sum(r.get("stargazerCount", 0) for r in repos)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # Language breakdown
    languages: dict[str, int] = {}
    for r in repos:
        lang = r.get("language") or "Unknown"
        languages[lang] = languages.get(lang, 0) + 1
    top_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]
    lang_rows = [f"| {lang} | {count} |" for lang, count in top_langs] or ["| — | 0 |"]

    # Build card grid for top 30 repos (or all if fewer)
    top_repos = repos[:30]
    card_items: list[str] = []
    for r in top_repos:
        name = r.get("name", "")
        full = r.get("fullName", "")
        repo_slug = _sanitise_filename(full)
        stars = r.get("stargazerCount", 0)
        watchers = r.get("watchersCount")
        watcher_text = (
            f" · :material-eye: {_format_number(watchers)} watchers"
            if watchers is not None
            else ""
        )
        lang = r.get("language") or "Unknown"
        desc = (r.get("description") or "No description")[:100]
        if len(r.get("description") or "") > 100:
            desc += "…"
        card_items.append(
            f"-   :star: **{name}** · {_format_number(stars)} stars{watcher_text} · `{lang}`\n"
            f"\n"
            f"    ---\n"
            f"\n"
            f"    {desc}\n"
            f"\n"
            f"    [:octicons-arrow-right-24: View details]({repo_slug}.md)"
        )
    cards_block = "\n\n".join(card_items)

    featured_section = [
        "---",
        "",
        "## Featured Repositories",
        "",
    ]
    if card_items:
        featured_section += [
            '<div class="grid cards" markdown>',
            "",
            cards_block,
            "",
            "</div>",
        ]
    else:
        featured_section.append("_No repositories matched this service in the current sync._")

    # Build table for remaining repos
    remaining = repos[30:]
    remaining_section = ""
    if remaining:
        remaining_rows = []
        for r in remaining:
            name = r.get("name", "")
            full = r.get("fullName", "")
            repo_slug = _sanitise_filename(full)
            stars = r.get("stargazerCount", 0)
            lang = r.get("language") or "—"
            desc = (r.get("description") or "")[:80]
            if len(r.get("description") or "") > 80:
                desc += "…"
            remaining_rows.append(
                f"    | [{name}]({repo_slug}.md) | {lang} | :star: {_format_number(stars)} | {desc} |"
            )
        remaining_section = (
            "\n---\n\n"
            "## All Repositories\n\n"
            f'??? note "View all {len(remaining)} remaining repositories"\n\n'
            "    | Repository | Language | Stars | Description |\n"
            "    |------------|----------|-------|-------------|\n"
            + "\n".join(remaining_rows)
        )

    lines = [
        "---",
        "hide:",
        "  - toc",
        "---",
        "",
        f"# {icon} {label}",
        "",
        description,
        "",
        f'!!! info "Last synced: {now}"',
        f"    Showing **{total}** repositories matching this focus area.",
        "",
        "---",
        "",
        '<div class="registry-summary" markdown>',
        "",
        "## Overview",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| **Repositories** | {total} |",
        f"| **Total Stars** | :star: {_format_number(total_stars)} |",
        "",
        "### Top Languages",
        "",
        "| Language | Repositories |",
        "|----------|-------------|",
        *lang_rows,
        "",
        "</div>",
        "",
        *featured_section,
        remaining_section,
        "",
        "---",
        "",
        f"_Auto-generated by [`sync_repos.py`](https://github.com/rpothin/PowerPlatform-OpenSource-Hub/blob/main/scripts/sync_repos.py) on {now}._",
        "",
    ]

    return "\n".join(lines)


def write_registry(
    repos: list[dict[str, Any]],
    criteria: dict[str, dict[str, Any]],
) -> None:
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

    service_repos: dict[str, list[dict[str, Any]]] = {slug: [] for slug in criteria}
    for repo in repos:
        for slug in _categorize_repo(repo, criteria):
            service_repos[slug].append(repo)

    # Write category pages
    for slug, service in criteria.items():
        cat_repos = sorted(
            service_repos[slug],
            key=lambda r: r.get("stargazerCount", 0),
            reverse=True,
        )
        cat_path = REGISTRY_DIR / f"{slug}.md"
        cat_path.write_text(
            generate_category_page(service, cat_repos),
            encoding="utf-8",
        )
    log.info("Wrote %d category pages", len(criteria))


def write_contribution_page(
    repos: list[dict[str, Any]],
    contribution_status: dict[str, Any],
) -> None:
    """Write the contribution opportunities landing page."""
    CONTRIBUTE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CONTRIBUTE_DIR / "index.md"
    out_path.write_text(
        generate_contribution_page(repos, contribution_status),
        encoding="utf-8",
    )
    log.info("Wrote contribution opportunities page to %s", out_path)


def _format_number_short(n: int) -> str:
    """Format a number for display: 54143 -> '54,000+'."""
    if n >= 1000:
        rounded = (n // 1000) * 1000
        return f"{rounded:,}+"
    return str(n)


def write_home_data(
    repos: list[dict[str, Any]],
    criteria: dict[str, dict[str, Any]],
) -> None:
    """Generate ``overrides/partials/home_hero.html`` with homepage stats and featured repos.

    This partial is included by ``overrides/home.html`` via Jinja2 ``{% include %}``.
    """
    total = len(repos)
    total_stars = sum(r.get("stargazerCount", 0) for r in repos)
    contrib_repos = sum(
        1 for r in repos
        if r.get("openedGoodFirstIssues", 0) or r.get("openedHelpWantedIssues", 0)
    )

    topics_count = sum(len(service["topics"]) for service in criteria.values())

    featured = repos[:6]

    # Build featured cards HTML
    featured_cards: list[str] = []
    for r in featured:
        name = r.get("name", "")
        full_name = r.get("fullName", "")
        desc = (r.get("description") or "No description")[:100]
        if len(r.get("description") or "") > 100:
            desc += "…"
        stars = _format_number(r.get("stargazerCount", 0))
        watchers = r.get("watchersCount")
        watchers_html = (
            f'        <div class="mdx-repo-card__metrics">\n'
            f'          <span class="mdx-repo-card__metric">⭐ {stars}</span>\n'
            f'          <span class="mdx-repo-card__metric">👁️ {_format_number(watchers)}</span>\n'
            f'        </div>\n'
            if watchers is not None
            else f'        <div class="mdx-repo-card__metrics">\n'
                 f'          <span class="mdx-repo-card__metric">⭐ {stars}</span>\n'
                 f'        </div>\n'
        )
        lang = r.get("language") or "Unknown"
        slug = _sanitise_filename(full_name)

        featured_cards.append(
            f'      <a class="mdx-repo-card" href="registry/{slug}/">\n'
            f'        <div class="mdx-repo-card__header">\n'
            f'          <span class="mdx-repo-card__name">{name}</span>\n'
            f'        </div>\n'
            f'        <p class="mdx-repo-card__desc">{desc}</p>\n'
            f'{watchers_html}'
            f'        <span class="mdx-repo-card__lang">{lang}</span>\n'
            f'      </a>'
        )

    featured_html = "\n".join(featured_cards)

    partial = f"""\
<!-- Auto-generated by sync_repos.py — do not edit manually -->
<section class="mdx-stats">
  <div class="md-grid">
    <div class="mdx-stats__grid">
      <div class="mdx-stats__card">
        <div class="mdx-stats__number">📦 {_format_number_short(total)}</div>
        <div class="mdx-stats__label">Repositories</div>
      </div>
      <div class="mdx-stats__card">
        <div class="mdx-stats__number">⭐ {_format_number_short(total_stars)}</div>
        <div class="mdx-stats__label">Total Stars</div>
      </div>
      <div class="mdx-stats__card">
        <div class="mdx-stats__number">🤝 {contrib_repos}</div>
        <div class="mdx-stats__label">Open to Contributions</div>
      </div>
      <div class="mdx-stats__card">
        <div class="mdx-stats__number">🏷️ {topics_count}</div>
        <div class="mdx-stats__label">Topics Tracked</div>
      </div>
    </div>
  </div>
</section>

<section class="mdx-featured">
  <div class="md-grid">
    <h2 class="mdx-featured__title">Featured Repositories</h2>
    <div class="mdx-featured__grid">
{featured_html}
    </div>
  </div>
</section>
"""

    partials_dir = OVERRIDES_DIR / "partials"
    partials_dir.mkdir(parents=True, exist_ok=True)
    out_path = partials_dir / "home_hero.html"
    out_path.write_text(partial, encoding="utf-8")
    log.info("Wrote homepage data partial to %s", out_path)


# ===================================================================
# CLI entry-point
# ===================================================================
def main() -> None:
    criteria = load_search_criteria()
    repos, limit_hits = fetch_repos_live(criteria)
    contribution_status = fetch_contribution_opportunities(repos)

    write_registry(repos, criteria)
    write_contribution_page(repos, contribution_status)
    write_home_data(repos, criteria)
    log_search_limit_summary(limit_hits)
    log.info("Done ✓")


if __name__ == "__main__":
    main()
