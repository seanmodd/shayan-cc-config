#!/bin/bash
# Double-click this (or run: bash publish.command) to create + push the GitHub repo.
cd "$(dirname "$0")"
echo "▸ Preparing shayan-cc-config for GitHub…"
git init -q 2>/dev/null || true
git add -A
git commit -qm "shayan-cc-config: Claude Code setup gallery + real-time customizer" \
  -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" 2>/dev/null || git commit -qm "update" 2>/dev/null || true
git branch -M main 2>/dev/null || true
if gh repo view seanmodd/shayan-cc-config >/dev/null 2>&1; then
  echo "▸ Repo exists — pushing…"
  git remote remove origin 2>/dev/null || true
  git remote add origin https://github.com/seanmodd/shayan-cc-config.git
  git push -u origin main
else
  echo "▸ Creating public repo seanmodd/shayan-cc-config…"
  gh repo create seanmodd/shayan-cc-config --public --source=. --remote=origin --push
fi
echo ""
echo "✓ Done → https://github.com/seanmodd/shayan-cc-config"
