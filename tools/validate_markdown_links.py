#!/usr/bin/env python3
"""Validate straightforward inline local Markdown links in this repository.

Usage:
    python3 tools/validate_markdown_links.py
"""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote


LINK_PATTERN = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
FENCE_PATTERN = re.compile(r"^\s*(`{3,}|~{3,})")


def iter_markdown_files(root: Path) -> list[Path]:
    return sorted(root.rglob("*.md"))


def resolve_target(md_file: Path, target: str) -> Path:
    clean_target = unquote(target.split()[0].split("#")[0])
    return (md_file.parent / clean_target).resolve()


def outside_fenced_code(content: str) -> str:
    """Avoid treating code examples such as `fn[args](...args)` as links."""
    visible_lines: list[str] = []
    fence_char = None
    fence_length = 0

    for line in content.splitlines():
        match = FENCE_PATTERN.match(line)
        if fence_char is None:
            if match:
                fence_char = match.group(1)[0]
                fence_length = len(match.group(1))
                continue
            visible_lines.append(line)
            continue

        if match:
            marker = match.group(1)
            if marker[0] == fence_char and len(marker) >= fence_length:
                fence_char = None
                fence_length = 0

    return "\n".join(visible_lines)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    missing: list[tuple[Path, str]] = []

    for md_file in iter_markdown_files(root):
        content = outside_fenced_code(
            md_file.read_text(encoding="utf-8", errors="ignore")
        )
        for target in LINK_PATTERN.findall(content):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            resolved = resolve_target(md_file, target)
            if not resolved.exists():
                missing.append((md_file.relative_to(root), target))

    if missing:
        print("Broken local markdown links found:")
        for source, target in missing:
            print(f"  - {source} -> {target}")
        return 1

    print("All local markdown links are valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
