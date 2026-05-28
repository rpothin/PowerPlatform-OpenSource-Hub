#!/usr/bin/env python3
"""Reviewed Webwright generated acceptance script for the repository gallery."""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import Page, expect, sync_playwright


BASE_URL = os.environ.get("WEBWRIGHT_BASE_URL", "http://127.0.0.1:3000/PowerPlatform-OpenSource-Hub").rstrip("/")
ARTIFACT_DIR = Path(os.environ.get("WEBWRIGHT_ARTIFACT_DIR", "tests/webwright/artifacts"))


def parse_repository_count(text: str) -> int:
    match = re.search(r"([\d,]+)\s+repositories?", text)
    if not match:
        raise AssertionError(f"Could not parse repository count from: {text!r}")
    return int(match.group(1).replace(",", ""))


def current_repository_count(page: Page) -> int:
    repository_count = page.locator("#repositoryCount")
    expect(repository_count).to_be_visible()
    return parse_repository_count(repository_count.inner_text())


def first_repository_name(page: Page) -> str:
    first_name = page.locator('[data-testid="repository-full-name"]').first
    expect(first_name).to_be_visible()
    return first_name.inner_text().strip()


def query_param(page: Page, name: str) -> list[str]:
    return parse_qs(urlparse(page.url).query).get(name, [])


def take_screenshot(page: Page, name: str) -> None:
    page.screenshot(path=str(ARTIFACT_DIR / f"{name}.png"), full_page=True)


def run_gallery_acceptance(page: Page) -> dict[str, object]:
    report: dict[str, object] = {
        "baseUrl": BASE_URL,
        "script": "gallery_acceptance.py",
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "scenarios": [],
    }

    page.goto(BASE_URL + "/", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Power Platform Open-Source Hub")).to_be_visible()
    expect(page.get_by_test_id("stats-row")).to_be_visible()
    take_screenshot(page, "01-landing-page")
    report["scenarios"].append("Landing page key insights are visible.")

    page.get_by_role("link", name=re.compile("Explore the Gallery")).click()
    page.wait_for_url(re.compile(r"/gallery/?$"))
    expect(page.get_by_label("Search repositories")).to_be_visible()
    expect(page.locator('[data-testid="repository-card"]').first).to_be_visible()
    initial_count = current_repository_count(page)
    if initial_count <= 0:
        raise AssertionError("Expected the gallery to contain repositories.")
    take_screenshot(page, "02-gallery")
    report["scenarios"].append("Gallery navigation renders repository cards and count.")

    selected_repository = first_repository_name(page)
    page.get_by_label("Search repositories").fill(selected_repository)
    expect(page.locator("#repositoryCount")).to_contain_text("repository")
    search_count = current_repository_count(page)
    if search_count <= 0 or search_count > initial_count:
        raise AssertionError(f"Search count {search_count} should be between 1 and {initial_count}.")
    if selected_repository not in first_repository_name(page):
        raise AssertionError(f"Expected {selected_repository!r} to remain visible after searching.")
    if query_param(page, "q") != [selected_repository]:
        raise AssertionError(f"Expected q URL parameter to be {selected_repository!r}; got {page.url}")
    take_screenshot(page, "03-search-filter")
    report["scenarios"].append("Search filters repositories and updates URL state.")

    page.get_by_role("button", name="Clear all filters").first.click()
    expect(page.get_by_label("Search repositories")).to_have_value("")
    restored_count = current_repository_count(page)
    if restored_count != initial_count:
        raise AssertionError(f"Expected count to return to {initial_count}; got {restored_count}.")
    if query_param(page, "q"):
        raise AssertionError(f"Expected q URL parameter to be cleared; got {page.url}")
    take_screenshot(page, "04-clear-filters")
    report["scenarios"].append("Clear all filters restores the original gallery state.")

    first_topic_badge = page.locator('[data-testid="topic-badge"]').first
    expect(first_topic_badge).to_be_visible()
    topic = first_topic_badge.inner_text().strip()
    first_topic_badge.click()
    topic_count = current_repository_count(page)
    if topic_count <= 0 or topic_count > initial_count:
        raise AssertionError(f"Topic count {topic_count} should be between 1 and {initial_count}.")
    if query_param(page, "topics") != [topic]:
        raise AssertionError(f"Expected topics URL parameter to be {topic!r}; got {page.url}")
    take_screenshot(page, "05-topic-filter")
    report["scenarios"].append("Topic badge filtering updates URL state and narrows results.")

    dialog_repository = first_repository_name(page)
    page.get_by_test_id("see-more-button").first.click()
    dialog = page.get_by_test_id("repository-dialog")
    expect(dialog).to_be_visible()
    expect(dialog.get_by_test_id("dialog-title")).to_contain_text(dialog_repository)
    expect(dialog.get_by_test_id("dialog-description")).to_be_visible()
    expect(dialog.get_by_test_id("dialog-stars-badge")).to_be_visible()
    take_screenshot(page, "06-repository-dialog")
    report["scenarios"].append("Repository detail dialog opens with metadata.")

    report["initialRepositoryCount"] = initial_count
    report["selectedRepository"] = selected_repository
    report["selectedTopic"] = topic
    report["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return report


def main() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        try:
            report = run_gallery_acceptance(page)
            (ARTIFACT_DIR / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        finally:
            browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
