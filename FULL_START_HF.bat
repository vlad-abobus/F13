@echo off
REM FULL START for Hugging Face Spaces (Windows)
echo Preparing repository for Hugging Face Spaces deployment

REM check for clean git working tree
for /f "delims=" %%i in ('git status --porcelain') do (
  echo ERROR: Git working tree not clean. Commit or stash changes first.
  git status --porcelain
  exit /b 1
)

python -m venv .venv || (
  echo Failed to create virtualenv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if exist client (
  pushd client
  npm ci || npm install
  npm run build
  popd
)

python test_duck_integration.py || echo Warning: validation script failed

echo.
echo Next steps:
echo  - Create a Space at https://huggingface.co/spaces (SDK: gradio)
echo  - Add HF remote and push: git remote add hf https://huggingface.co/spaces/<username>/<repo> && git push hf main
echo  - Add secrets (GOOGLE_API_KEY) in Space settings
echo.
echo FULL_START_HF completed.
