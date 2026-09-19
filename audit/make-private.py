#!/usr/bin/env python3
"""
Make a fixed list of realdubb repos private, with a full before/after audit
log and an undo script. Never deletes anything, never touches a repo outside
the target list, never commits.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

OWNER = "realdubb"
BASE_DIR = Path(__file__).resolve().parent
TARGETS_FILE = BASE_DIR / "2026-09-19-tier2-targets.json"
LOG_FILE = BASE_DIR / "2026-09-19-make-private.jsonl"
UNDO_FILE = BASE_DIR / "2026-09-19-make-private-undo.sh"


def run(cmd):
    """Run a command, return (returncode, combined-output-first-200-chars, full_stdout)."""
    proc = subprocess.run(cmd, capture_output=True, text=True)
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, out[:200], proc.stdout


def ensure_undo_header():
    if not UNDO_FILE.exists() or UNDO_FILE.stat().st_size == 0:
        UNDO_FILE.write_text(
            "#!/bin/bash\n"
            "# Undo script for audit/make-private.py run on 2026-09-19\n"
            "# Restores each repo to public (and prior archived state).\n"
            "set -e\n\n"
        )
        UNDO_FILE.chmod(0o755)


def append_undo(name, was_archived):
    lines = []
    if was_archived:
        lines.append(f"gh repo unarchive {OWNER}/{name} --yes")
    lines.append(
        f"gh repo edit {OWNER}/{name} --visibility public --accept-visibility-change-consequences"
    )
    if was_archived:
        lines.append(f"gh repo archive {OWNER}/{name} --yes")
    with open(UNDO_FILE, "a") as f:
        f.write(f"# --- {name} ---\n")
        for line in lines:
            f.write(line + "\n")
        f.write("\n")


def append_log(record):
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")


def main():
    targets = json.loads(TARGETS_FILE.read_text())
    ensure_undo_header()

    ok_count = 0
    fail_count = 0
    failures = []

    for t in targets:
        name = t["name"]
        repo = f"{OWNER}/{name}"
        ts = datetime.now(timezone.utc).isoformat()
        steps = {}
        failed_here = False
        error_text = None

        # 1. Record before-state
        rc, out200, out_full = run(
            ["gh", "api", f"repos/{repo}", "--jq", "{private,archived}"]
        )
        steps["before_state"] = {"rc": rc, "output": out200}
        if rc != 0:
            failed_here = True
            error_text = out200
            before = None
        else:
            try:
                before = json.loads(out_full.strip())
            except Exception as e:
                failed_here = True
                error_text = f"failed to parse before-state json: {e}"
                before = None

        was_archived = bool(before.get("archived")) if before else bool(t.get("archived"))

        # 2. Unarchive first if archived
        if not failed_here and was_archived:
            rc, out200, _ = run(["gh", "repo", "unarchive", repo, "--yes"])
            steps["unarchive"] = {"rc": rc, "output": out200}
            if rc != 0:
                failed_here = True
                error_text = out200

        # 3. Set visibility private
        if not failed_here:
            rc, out200, _ = run(
                [
                    "gh",
                    "repo",
                    "edit",
                    repo,
                    "--visibility",
                    "private",
                    "--accept-visibility-change-consequences",
                ]
            )
            steps["set_private"] = {"rc": rc, "output": out200}
            if rc != 0:
                failed_here = True
                error_text = out200

        # 4. Restore archived state if it was archived
        if was_archived:
            # Attempt restore even if set_private failed, so state doesn't
            # drift further from before-state. Only skip if we never got
            # past step 1 (before is unknown) or if unarchive itself failed
            # (repo may still be in a weird state, but re-archiving an
            # already-archived repo is harmless/no-op-ish via API anyway).
            if before is not None:
                rc, out200, _ = run(["gh", "repo", "archive", repo, "--yes"])
                steps["restore_archive"] = {"rc": rc, "output": out200}
                if rc != 0 and not failed_here:
                    failed_here = True
                    error_text = out200

        record = {
            "ts": ts,
            "repo": repo,
            "before": before,
            "steps": steps,
        }
        append_log(record)

        if not failed_here:
            append_undo(name, was_archived)
            ok_count += 1
            print(f"ok {name}")
        else:
            fail_count += 1
            failures.append((name, error_text))
            print(f"FAIL {name} {error_text}")

    print(f"\nSummary: {ok_count} ok, {fail_count} failed out of {len(targets)}")
    if failures:
        print("Failures:")
        for name, err in failures:
            print(f"  {name}: {err}")

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
