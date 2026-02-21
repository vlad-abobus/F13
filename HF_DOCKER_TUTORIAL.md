HF Docker deployment tutorial for Hugging Face Spaces

This short guide explains how to prepare your project (F13) to deploy on Hugging Face Spaces using Docker and how to test locally.

1) Overview
- Hugging Face Spaces supports two main modes: direct code (Gradio/Streamlit) or Docker. Because F13 is a full Flask + React app, Docker is a good fit.
- The repo already contains a `Dockerfile` that builds the client and backend. We'll show adjustments to ensure the container binds to the port expected by HF Spaces and how to test locally.

2) Recommended container port
- Spaces may expect your web app to bind to port `8080` in Docker. To be safe, make your container bind to `$PORT` env var or `0.0.0.0:8080`.

3) Minimal Docker run command (local test)

Build image:

```bash
docker build -t f13:local .
```

Run container mapping to local port 8080:

```bash
# test locally: expose container port 8080 to host 8080
docker run --rm -it -p 8080:8080 \
  -e FLASK_ENV=production \
  -e DATABASE_URL="sqlite:///instance/freedom13.db" \
  f13:local
```

Then open http://localhost:8080 in your browser.

4) Ensure the web server binds to $PORT (recommended)
- In Spaces, HF provides the `PORT` environment variable. Update your run command to pass `-b 0.0.0.0:$PORT` to `gunicorn`.

Example `Dockerfile` CMD change (or `start` script):

```dockerfile
# previous CMD might be:
# CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]

# recommended: allow binding to $PORT with default 8080
ENV PORT=8080
CMD ["gunicorn", "-c", "gunicorn.conf.py", "-b", "0.0.0.0:${PORT}", "wsgi:app"]
```

If you prefer a shell `start.sh` entrypoint (recommended for clarity):

```bash
#!/usr/bin/env bash
set -e
PORT=${PORT:-8080}
exec gunicorn -c gunicorn.conf.py -b 0.0.0.0:${PORT} wsgi:app
```

Make it executable and use it in the Dockerfile (`ENTRYPOINT ["/app/start.sh"]`).

5) Files to include in your Space repository
- `Dockerfile` (the repo already has one; consider small adjustments as above)
- `requirements.txt` (exists)
- `start` script (optional but useful)
- Anything necessary for build (client/ directory, package.json, etc.). The provided `Dockerfile` already builds the React app.

6) Secrets & Environment variables
- In the Space settings, set secrets like `GOOGLE_API_KEY`, `CLOUDINARY_URL`, `DATABASE_URL` (if you use remote DB), `JWT_SECRET`, etc.
- Avoid committing secrets to git.

7) Using `deploy_to_hf.sh` (provided in repo)
- Export environment variables and run the script:

```bash
export HF_USER=your-hf-username
export HF_SPACE=your-space-name
export HF_TOKEN=hf_xxx
./deploy_to_hf.sh
```

- The script commits and pushes current repo to the Space git remote. Space will then start its build.

8) Common gotchas
- Large files (>100MB) require Git LFS. Add `.gitattributes` entries and enable LFS on the Space if needed.
- If the build fails on Space, check the Build logs on the Space page; you may need to increase build time or reduce image size.
- If your app listens on a different port locally (5000), adjust the CMD to use `$PORT`.

9) Example: Quick test with an explicit start script
- Add `start.sh` as above, update Dockerfile to `ENTRYPOINT ["/bin/bash","/app/start.sh"]`, build and run locally mapping port 8080.

10) Final notes
- After pushing to the Space, watch the Build log on HF. If the container starts but the app is unreachable, confirm the app binds to the port provided by HF (`$PORT`, usually 8080) and listens on `0.0.0.0`.

If you want, I can:
- Modify the existing `Dockerfile` to include the `PORT` binding and add a `start.sh` script.
- Add a `.dockerignore` for smaller builds.
- Create a short `HF_SETUP.md` with screenshots and exact Space settings.
