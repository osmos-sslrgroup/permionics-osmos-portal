# Permionics Insights Hub — Production Deployment Guide

This guide walks you through deploying the full **Permionics BD Suite (OSMOS)** stack to production. Follow each section in order.

---

## Deployment Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                  Firebase Auth (Production)                      │
│               console.firebase.google.com                        │
│         Manages user sign-in, tokens, account lifecycle          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express API Backend (Railway / Render)              │
│                  e.g. https://api.permionics.app                 │
│        Verifies Firebase tokens, autoMigrates DB on start        │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│   Frontend (Vercel)      │    │   Neon PostgreSQL Database       │
│ https://permionics.app   │    │   console.neon.tech              │
└──────────────────────────┘    └─────────────────────────────────┘
```

---

## Section 1: Neon PostgreSQL Database Setup

**Where:** [https://console.neon.tech](https://console.neon.tech)

1. Sign in and click **New Project**.
2. Set a project name (e.g. `permionics-prod`) and choose the closest region.
3. Click **Create Project**. Neon provisions your database instantly.
4. On the project dashboard, find the **Connection String** section.
5. Copy the connection string. It looks like:
   ```
   postgres://USER:PASSWORD@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Paste this as your `DATABASE_URL` in the backend environment.

> **Note:** The `autoMigrate` engine runs automatically on first backend startup. You do NOT need to run any SQL manually. All 7 tables and seed case studies are created automatically.

---

## Section 2: Firebase Project Setup

**Where:** [https://console.firebase.google.com](https://console.firebase.google.com)

### Step A: Create or Select a Project
1. Click **Add project** and follow the wizard. Disable Google Analytics if not needed.
2. Once created, note your **Project ID** (shown in the URL and project settings). This becomes `FIREBASE_PROJECT_ID`.

### Step B: Enable Email/Password Authentication
1. In the Firebase Console sidebar, go to **Build** → **Authentication**.
2. Click **Get started**.
3. Click the **Sign-in method** tab.
4. Click **Email/Password** → Enable the first toggle → **Save**.

### Step C: Get the Firebase Service Account Key (for the Backend)

> This is the most important credential. It allows your backend server to manage Firebase users server-side (create, verify tokens, block users).

1. In Firebase Console, click the ⚙️ gear icon (top left) → **Project settings**.
2. Click the **Service accounts** tab.
3. Click **Generate new private key** → **Generate key**.
4. A `.json` file will download to your machine. **Keep this file safe — it is equivalent to a root password.**
5. Open the `.json` file in any text editor.
6. **Minify it to a single line** (remove all line breaks). You can do this at [https://jsonminifier.net](https://jsonminifier.net) or by running:
   ```bash
   node -e "const f=require('./your-service-account.json'); console.log(JSON.stringify(f));"
   ```
7. Paste the entire single-line JSON as the value of `FIREBASE_SERVICE_ACCOUNT_KEY` in your backend environment.

### Step D: Get Firebase Client Keys (for the Frontend)
1. In Firebase Console → Project settings → **General** tab.
2. Scroll down to **Your apps**. Click **Add app** → select the **Web** (`</>`) icon.
3. Register the app with a nickname (e.g. `permionics-bd-suite`).
4. Firebase shows you a `firebaseConfig` object. Map the values:

| Firebase Config Key | Frontend Env Variable |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

> **Important:** In production, set `VITE_USE_FIREBASE_EMULATOR=false` in the frontend environment.

---

## Section 3: Backend Deployment (Railway / Render)

**Recommended platform:** [Railway](https://railway.app) — easiest for Node.js monorepos.

1. Connect your GitHub repository to Railway.
2. Set the **Root Directory** to `artifacts/api-server`.
3. Set the **Start Command** to: `node --enable-source-maps ./dist/index.mjs`
4. Set the **Build Command** to: `node ./build.mjs`
5. Go to the **Variables** tab and add every variable from `artifacts/api-server/.env.deployment`:

| Variable | Where to get it |
|---|---|
| `APP_MODE` | Set to `deploy` |
| `DATABASE_URL` | Section 1 above |
| `FIREBASE_PROJECT_ID` | Section 2, Step A |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Section 2, Step C |
| `ADMIN_EMAIL` | Your admin email (e.g. `admin@permionics.com`) |
| `ADMIN_PASSWORD` | Choose a strong password |
| `SESSION_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PORT` | Set to `5000` (Railway overrides this automatically) |
| `CORS_ORIGIN` | Your frontend URL (e.g. `https://permionics.vercel.app`) |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) — free tier |
| `GEMINI_API_KEY` | From [aistudio.google.com](https://aistudio.google.com) — free tier |

6. Deploy. Watch the logs for:
   ```
   [AUTO_MIGRATE] PostgreSQL AutoMigrate completed successfully.
   Server listening on port 5000
   ```

---

## Section 4: Frontend Deployment (Vercel)

**Recommended platform:** [Vercel](https://vercel.com)

1. Connect your GitHub repository to Vercel.
2. Set the **Root Directory** to `artifacts/permionics-bd-suite`.
3. Set the **Framework Preset** to `Vite`.
4. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_USE_FIREBASE_EMULATOR` | `false` |
| `VITE_FIREBASE_API_KEY` | From Section 2, Step D |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Section 2, Step D |
| `VITE_FIREBASE_PROJECT_ID` | From Section 2, Step D |
| `VITE_FIREBASE_STORAGE_BUCKET` | From Section 2, Step D |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Section 2, Step D |
| `VITE_FIREBASE_APP_ID` | From Section 2, Step D |
| `VITE_API_URL` | Your backend URL (e.g. `https://permionics-api.railway.app`) |

5. Deploy. Vercel builds and serves your frontend globally via CDN.

---

## Section 5: Cloudflare R2 Setup (Image Uploads in Case Study Generator)

**Where:** [https://dash.cloudflare.com](https://dash.cloudflare.com)

1. Log in to Cloudflare dashboard → click **R2 Object Storage** in the sidebar.
2. Click **Create bucket** → name it `permionics-assets`.
3. After creation, go to **Settings** → enable **Public Access** and copy the **Public Bucket URL** (`https://pub-XXXX.r2.dev`). This becomes `R2_PUBLIC_URL`.
4. Go to the main R2 page → click **Manage R2 API tokens** → **Create API token**.
5. Set permissions to **Object Read & Write** for your bucket.
6. Copy the **Access Key ID** (`R2_ACCESS_KEY_ID`) and **Secret Access Key** (`R2_SECRET_ACCESS_KEY`).
7. Your **Account ID** is in the Cloudflare dashboard URL: `dash.cloudflare.com/ACCOUNT_ID/`. This becomes `R2_ACCOUNT_ID`.

---

## Section 6: Post-Deployment Verification Checklist

- [ ] Backend health check: `GET https://your-api-url/api/healthz` → should return `{ "status": "ok" }`
- [ ] Admin login works at your frontend URL with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Check backend logs for `[AUTO_MIGRATE] PostgreSQL AutoMigrate completed successfully.`
- [ ] Case Study Library shows the 4 seeded case studies
- [ ] In Firebase Console → Authentication → Users, the admin account should appear after first login
- [ ] (Optional) Test user signup, operator creation from Settings page

---

## Section 7: Updating / Redeploying

Since `autoMigrate` runs on every backend startup and uses `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, redeployments are always **safe** — no data is lost when you push new code.

For Docker-based deployments:
```bash
make docker-backend VERSION=1.0.2
make docker-frontend VERSION=1.0.2
```

---

## Quick Reference: All Environment Variables

### Backend (`artifacts/api-server/.env.deployment`)

| Variable | Required | Description |
|---|---|---|
| `APP_MODE` | Yes | `deploy` for production |
| `DATABASE_URL` | Yes | Neon/Supabase/Render Postgres connection string |
| `FIREBASE_PROJECT_ID` | Yes | Your Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Single-line JSON service account key |
| `ADMIN_EMAIL` | Yes | Master admin login email |
| `ADMIN_PASSWORD` | Yes | Master admin login password |
| `SESSION_SECRET` | Yes | Random 48+ char secret for JWT signing |
| `PORT` | Yes | `5000` (platform may override) |
| `CORS_ORIGIN` | Yes | Frontend URL (no trailing slash) |
| `GROQ_API_KEY` | Optional | Groq LLM for Osmos AI assistant |
| `GEMINI_API_KEY` | Optional | Gemini LLM + Vision OCR |
| `R2_ACCOUNT_ID` | Optional | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Optional | Cloudflare R2 bucket name |
| `R2_PUBLIC_URL` | Optional | Cloudflare R2 public CDN URL |

### Frontend (`artifacts/permionics-bd-suite/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_USE_FIREBASE_EMULATOR` | Yes | `false` in production |
| `VITE_FIREBASE_API_KEY` | Yes | From Firebase Console → Project settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | e.g. `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | Yes | From Firebase Console |
| `VITE_API_URL` | Yes | Backend URL for API calls |
