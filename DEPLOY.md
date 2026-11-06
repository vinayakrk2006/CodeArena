# Putting CodeArena online (Render)

The repo includes `render.yaml`, which tells Render to create two services:
- `codearena-api`: the Python backend
- `codearena-web`: the website

## Steps
1. **Put the project on GitHub.** In VS Code, open the Source Control icon (left bar), click **Publish to GitHub**, and choose a private repository. The `.gitignore` keeps `.env`, `.venv` and `node_modules` off GitHub.
2. **Create the services.** On render.com, sign in with GitHub, click **New > Blueprint**, pick your repository, and click **Apply**. Render builds both services. When it asks for values, type any placeholder for now.
3. **Copy the two addresses.** Open each service on Render and copy its address, like `https://codearena-api-xxxx.onrender.com` and `https://codearena-web-xxxx.onrender.com`.
4. **Connect them.**
   - On `codearena-api`, set `FRONTEND_ORIGIN` to the website address (no slash at the end).
   - On `codearena-web`, set `VITE_API_URL` to the API address followed by `/api`.
5. **Redeploy both** (Manual Deploy > Deploy latest commit). The website bakes in `VITE_API_URL` at build time, so it must be rebuilt after you change it.
6. Open the website address and sign up.

## Before real students use it
- **Data is lost on free hosting.** Free Render web services sleep when idle and do not keep files between deploys, so accounts and scores in the SQLite file can disappear. Use a paid persistent disk or move to a hosted Postgres database. Check Render's current plans.
- **Code runner limits.** The free public Judge0 server is shared and rate-limited. For many students, use a paid Judge0 plan or your own Judge0 server, and put its address and key in the API settings. If your provider needs more than one header, the code needs a small change.
- **Still to add:** email verification, password reset, and rate limits on code runs.
- **Dates use the server's clock** (UTC on Render), so a day can roll over at 5:30 am India time.
