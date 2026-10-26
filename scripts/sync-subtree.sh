#!/usr/bin/env bash
# Pull latest commits from a project's original repo into projects/<id>
set -euo pipefail
id="$1"; branch="${2:-main}"
git subtree pull --prefix="projects/$id" "https://github.com/penny323mo/$id.git" "$branch" -m "Sync $id from upstream"
