# 🚀 Deployment Guide: Vercel (Frontend) & Render (Backend)

The **Cascade Slayers 2.2 — The 72-Hour Warning** application is built with a decoupled architecture:
- **Frontend**: High-performance static web application (Landing Page + 3D Simulation + Real Cartographic GIS Leaflet Map + Voiceflow AI Assistant) hosted on **Vercel Edge CDN**.
- **Backend**: High-throughput FastAPI machine learning microservice (LightGBM multi-horizon classifiers + Hawkes branching ratio GLM + MILP optimizer) hosted on **Render**.

---

## 1. Deploy the Backend on Render (Free Tier)

### Method A: Connect GitHub Repository via Web Console (Recommended)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   `https://github.com/bhalerao-aditya007/Cascade_slayers_2.2`
4. Fill in the service configuration:
   - **Name**: `cascade-slayers-backend`
   - **Region**: Oregon (US West) or closest region
   - **Branch**: `main`
   - **Root Directory**: `Backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn api.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan Type**: `Free`
5. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.6`
   - `PROJECT_ROOT`: `.`
   - `DISABLE_TICKER`: `0`
6. Click **Create Web Service**.
7. Render will build and deploy the backend. Once active, copy your live HTTPS URL:
   `https://cascade-slayers-backend.onrender.com`

> [!NOTE]
> Free tier Render services spin down after 15 minutes of inactivity. When accessed again, they take 30–50 seconds to wake up.

---

## 2. Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import the repository: `bhalerao-aditya007/Cascade_slayers_2.2`.
4. Configure the project:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave default, `vercel.json` handles routing)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
5. Click **Deploy**.
6. Vercel will deploy instantly (under 15 seconds) to a public URL:
   `https://cascade-slayers-2-2.vercel.app`

---

## 3. Link Vercel Frontend to Render Backend

You can connect the deployed Vercel frontend to your live Render backend in any of three easy ways:

### Option 1: In-App UI Configuration (Easiest)
1. Open your Vercel URL in your browser.
2. Click the **`☁️ API Endpoint`** button in the top navigation bar.
3. Paste your Render backend URL (e.g. `https://cascade-slayers-backend.onrender.com`).
4. Click **Test Ping** (verifies connection and latency).
5. Click **Save & Reconnect**.
   *The URL is saved to browser `localStorage` and persists across page reloads!*

### Option 2: Direct URL Query Parameter
Visit the frontend with the `?api=` parameter:
```
https://your-vercel-domain.vercel.app/dashboard?api=https://cascade-slayers-backend.onrender.com
```
*The app automatically detects the query parameter, saves it to `localStorage`, and connects.*

### Option 3: Local Dev Mode
If running the frontend on Vercel while running the backend locally:
- Leave the API Base set to `http://localhost:8000`
- The backend's permissive CORS configuration allows the Vercel origin to communicate with `localhost:8000` seamlessly.

---

## 4. Verification Checklist

| Endpoint / Feature | Expected Behavior |
| :--- | :--- |
| `GET /healthz` | HTTP 200 `{"status":"HEALTHY","scenario":"flood","city":"mumbai"}` |
| `GET /docs` | Interactive Swagger API specification with all 14 routes |
| `/` (Landing Page) | Luxury Cream & Baby Pink landing page with Voiceflow AI chatbot |
| `/dashboard` | Mission Control with Real Cartographic GIS Leaflet Map & 3D Simulation |
| Scenario Switcher | Real LightGBM multi-horizon inference dynamically loaded |
