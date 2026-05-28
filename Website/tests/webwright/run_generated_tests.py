#!/usr/bin/env python3
"""Run reviewed Webwright generated Playwright scripts against the built website."""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


WEBWRIGHT_DIR = Path(__file__).resolve().parent
WEBSITE_DIR = WEBWRIGHT_DIR.parents[1]
GENERATED_DIR = WEBWRIGHT_DIR / "generated"
DEFAULT_BASE_URL = "http://127.0.0.1:3000/PowerPlatform-OpenSource-Hub"


def wait_for_server(url: str, timeout_seconds: int) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                if response.status < 500:
                    return
        except Exception as error:  # noqa: BLE001 - keep the latest startup error for diagnostics.
            last_error = error
        time.sleep(2)

    raise TimeoutError(f"Timed out waiting for {url}: {last_error}")


def start_server(command: str) -> subprocess.Popen[str]:
    if os.name == "nt":
        return subprocess.Popen(
            command,
            cwd=WEBSITE_DIR,
            shell=True,
            text=True,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        )

    return subprocess.Popen(
        command,
        cwd=WEBSITE_DIR,
        shell=True,
        text=True,
        preexec_fn=os.setsid,
    )


def stop_server(process: subprocess.Popen[str] | None) -> None:
    if process is None or process.poll() is not None:
        return

    if os.name == "nt":
        process.send_signal(signal.CTRL_BREAK_EVENT)
    else:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)

    try:
        process.wait(timeout=15)
    except subprocess.TimeoutExpired:
        process.kill()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Webwright generated website tests.")
    parser.add_argument("--base-url", default=os.environ.get("WEBWRIGHT_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--server-command", default=os.environ.get("WEBWRIGHT_SERVER_COMMAND", "npm run serve"))
    parser.add_argument("--reuse-server", action="store_true", default=os.environ.get("WEBWRIGHT_REUSE_SERVER") == "1")
    parser.add_argument("--server-timeout", type=int, default=int(os.environ.get("WEBWRIGHT_SERVER_TIMEOUT", "120")))
    args = parser.parse_args()

    scripts = sorted(GENERATED_DIR.glob("*.py"))
    if not scripts:
        print(f"No generated Webwright scripts found in {GENERATED_DIR}", file=sys.stderr)
        return 1

    artifacts_dir = WEBWRIGHT_DIR / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    server: subprocess.Popen[str] | None = None
    try:
        if not args.reuse_server:
            server = start_server(args.server_command)

        wait_for_server(args.base_url.rstrip("/") + "/gallery", args.server_timeout)

        env = os.environ.copy()
        env["WEBWRIGHT_BASE_URL"] = args.base_url.rstrip("/")
        env["WEBWRIGHT_ARTIFACT_DIR"] = str(artifacts_dir)

        for script in scripts:
            print(f"Running Webwright generated script: {script.name}")
            subprocess.run([sys.executable, str(script)], cwd=WEBSITE_DIR, env=env, check=True)

        print(f"Webwright generated test artifacts: {artifacts_dir}")
        return 0
    finally:
        stop_server(server)


if __name__ == "__main__":
    raise SystemExit(main())
