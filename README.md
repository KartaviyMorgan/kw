# Sports Betting Prompt Generator

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

- `GET /health`
- `GET /api/config`
- `POST /api/generate`
- `POST /api/generate-batch`
- `POST /api/import/csv`

## Publish to GitHub

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin work
```

If your main branch is `main`, open a PR from `work` to `main` in GitHub UI.

## Test online quickly (Render)

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from that GitHub repo.
3. Render will auto-detect `render.yaml` (or use `npm install` + `npm start`).
4. After deploy, open:
   - `/` for UI
   - `/health` for status
