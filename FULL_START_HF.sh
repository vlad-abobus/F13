#!/usr/bin/env bash
set -euo pipefail

echo "FULL START for Hugging Face Spaces — preparing repository"

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Git working tree is not clean. Commit or stash changes first."
  git status --porcelain
  exit 1
fi

# Create and activate virtualenv
python -m venv .venv || true
source .venv/bin/activate
pip install --upgrade pip

echo "Installing Python requirements..."
pip install -r requirements.txt

if [ -d client ]; then
  echo "Building frontend (client)..."
  pushd client >/dev/null
  if [ -f package-lock.json ] || [ -f yarn.lock ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd >/dev/null
fi

echo "Running validation/test script..."
if command -v pytest >/dev/null 2>&1; then
  pytest -q || echo "Warning: some tests failed"
else
  python test_duck_integration.py || echo "Warning: validation script failed"
fi

cat <<'INFO'
Done. Next actions to deploy to Hugging Face Spaces:

- Create the Space (SDK: gradio) in your Hugging Face account or org.
  Example (requires huggingface-cli login):
    huggingface-cli repo create <username>/<repo> --type=space --private

- Add a git remote and push:
    git remote add hf https://huggingface.co/spaces/<username>/<repo>
    git push hf main

- In the Space settings add required secrets/env vars, e.g.:
    - GOOGLE_API_KEY

- If Spaces validation fails, consider pinning `gradio` in `requirements.txt`.

INFO

echo "FULL_START_HF finished."
