"""Convert Hugo TOML frontmatter (+++) to YAML (---) in all content .md files.

Also:
- Skips _index.md files (handled separately)
- Adds `form: 其他` to files inside content/poems/
- Removes T00:00:00 from datetime values
Run from repo root: python3 utils/toml-to-yaml.py
"""

import os
import re
import sys

SRC_DIRS = [
    "src/content/poems",
    "src/content/essays",
    "src/content/fictions",
    "src/content/creations",
]


def toml_val_to_yaml(key: str, val: str) -> str:
    val = val.strip()
    # Strip TOML string quotes
    if (val.startswith("'") and val.endswith("'")) or \
       (val.startswith('"') and val.endswith('"')):
        val = val[1:-1]
        return f"{key}: {val}"
    # Datetime: remove T00:00:00 suffix
    if re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", val):
        val = val[:10]
        return f"{key}: {val}"
    # Boolean
    if val.lower() in ("true", "false"):
        return f"{key}: {val.lower()}"
    return f"{key}: {val}"


def convert_file(path: str, add_form: bool = False) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("+++"):
        return False  # already converted or no TOML frontmatter

    end = content.find("+++", 3)
    if end == -1:
        return False

    toml_block = content[3:end].strip()
    body = content[end + 3:]

    yaml_lines = ["---"]
    for line in toml_block.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, val = line.partition("=")
            key = key.strip()
            yaml_lines.append(toml_val_to_yaml(key, val.strip()))

    if add_form:
        has_form = any(l.startswith("form:") for l in yaml_lines)
        if not has_form:
            yaml_lines.append("form: 其他")

    yaml_lines.append("---")
    new_content = "\n".join(yaml_lines) + "\n" + body

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return True


def main():
    for src_dir in SRC_DIRS:
        if not os.path.isdir(src_dir):
            print(f"Skipping missing dir: {src_dir}")
            continue
        is_poems = src_dir.endswith("poems")
        for root, _, files in os.walk(src_dir):
            for fname in files:
                if not fname.endswith(".md"):
                    continue
                if fname == "_index.md":
                    continue
                fpath = os.path.join(root, fname)
                changed = convert_file(fpath, add_form=is_poems)
                if changed:
                    print(f"Converted: {fpath}")


if __name__ == "__main__":
    main()
