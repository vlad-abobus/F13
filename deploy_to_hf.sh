#!/usr/bin/env bash
set -euo pipefail

# deploy_to_hf.sh
# Usage:
#   HF_USER=your_hf_username HF_SPACE=your-space-name HF_TOKEN=your_hf_token ./deploy_to_hf.sh
# This script will commit any changes and push the repository to the Hugging Face Space git remote.

if [ -z "${HF_USER-}" ] || [ -z "${HF_SPACE-}" ] || [ -z "${HF_TOKEN-}" ]; then
  echo "Missing one of HF_USER, HF_SPACE, HF_TOKEN environment variables."
  echo "Example: HF_USER=me HF_SPACE=my-space HF_TOKEN=hf_xxx ./deploy_to_hf.sh"
  exit 1
fi

set -x

REMOTE_URL="https://${HF_TOKEN}@huggingface.co/spaces/${HF_USER}/${HF_SPACE}.git"

# Ensure git repo
if [ ! -d .git ]; then
  echo "Initializing local git repository"
  git init
fi

# Add .gitattributes for LFS if needed
if ! git ls-files --error-unmatch .gitattributes >/dev/null 2>&1; then
  cat >.gitattributes <<'EOF'
# Use git-lfs for large binaries (uncomment if you use LFS on HF)
# *.png filter=lfs diff=lfs merge=lfs -text
# *.jpg filter=lfs diff=lfs merge=lfs -text
EOF
  git add .gitattributes || true
fi

# Commit all changes
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit"
else
  git commit -m "HF deploy: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" || true
fi

# Add remote and push
if git remote | grep -q hf-space; then
  git remote remove hf-space || true
fi

git remote add hf-space "$REMOTE_URL" || true

# Force push current branch to main on HF Spaces (safe for personal spaces)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo main)

echo "Pushing ${CURRENT_BRANCH} to ${REMOTE_URL} (branch main)"
GIT_TERMINAL_PROMPT=0 git push --force hf-space "${CURRENT_BRANCH}:main"

echo "Push complete. Go to https://huggingface.co/spaces/${HF_USER}/${HF_SPACE} to check the build logs."
