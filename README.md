# OPERATION YOU

75-dagen self-improvement tracker. Gepersonaliseerd op basis van jouw verhaal, sterktes en zwaktes. Geen generieke 75 Hard — jouw eigen 12 wetten, manifest en schaduw-analyse gegenereerd door Claude.

---

## Projectstructuur

```
operation-you/
├── frontend/          # De volledige app (vanilla JS, geen build)
│   ├── index.html     # Entrypoint
│   ├── css/           # Stylesheets per feature
│   └── js/
│       ├── core/      # state.js, api.js
│       ├── features/  # today, coach, journey, stats, training, modal, ...
│       ├── screens/   # screens.js, settings.js
│       └── onboarding/
├── backend/           # Express + SQLite API (optioneel)
│   ├── server.js      # Entrypoint
│   ├── src/
│   │   ├── db.js      # SQLite setup (auto-create)
│   │   ├── auth.js    # JWT helpers
│   │   └── routes/    # auth, sync, claude, workouts
│   └── data/          # app.db (auto-aangemaakt)
└── mobile/            # React Native/Expo app (work in progress)
```

---

## Frontend starten

De frontend heeft **geen build-stap** nodig. Gewoon het bestand openen.

### Optie 1 — Live Server (aanbevolen voor development)

1. Open de repo in VS Code
2. Installeer de **Live Server** extensie (als je die nog niet hebt)
3. Rechtsklik op `frontend/index.html` → **Open with Live Server**
4. App opent op `http://127.0.0.1:5500`

### Optie 2 — Direct openen

```bash
open frontend/index.html
```

> De app werkt volledig offline via localStorage. Backend is optioneel voor account-sync.

---

## Backend starten

De backend regelt accounts, state-sync tussen apparaten, en een server-side Claude proxy.

### 1. Installeer dependencies

```bash
cd backend
npm install
```

### 2. Maak een `.env` bestand

```bash
cp .env.example .env   # als dat bestaat, anders handmatig aanmaken
```

Inhoud van `.env`:

```env
PORT=3001
JWT_SECRET=<genereer met onderstaand commando>
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Genereer een veilige JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start de server

```bash
# Development (herstart automatisch bij wijzigingen)
npm run dev

# Productie
npm start
```

Server draait op `http://localhost:3001`.

> De database (`data/app.db`) wordt automatisch aangemaakt bij de eerste start.

---

## Frontend + Backend samen

Als de frontend op `localhost` of `127.0.0.1` draait, praat hij automatisch met `http://localhost:3001/api`. Geen extra configuratie nodig.

Start beide in aparte terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend (via Live Server in VS Code, of)
cd frontend && npx serve .
```

---

## API routes

| Methode | Route | Beschrijving |
|---------|-------|--------------|
| POST | `/api/auth/register` | Account aanmaken |
| POST | `/api/auth/login` | Inloggen, krijg JWT terug |
| GET | `/api/auth/me` | Ingelogde gebruiker ophalen |
| POST | `/api/sync` | State vanuit app naar server pushen |
| GET | `/api/sync` | State van server naar app pullen |
| POST | `/api/claude` | Claude API proxy (vereist auth) |
| POST | `/api/workouts` | Training log opslaan |
| GET | `/api/workouts` | Training logs ophalen |
| GET | `/api/health` | Server status check |

---

## App starten zonder account

Gewoon `frontend/index.html` openen. De app slaat alles op in `localStorage` onder de key `75h6`. Een account is alleen nodig voor sync tussen apparaten.

---

## Technische details

- **State**: alles in `localStorage['75h6']` als JSON
- **AI calls**: direct van browser naar `api.anthropic.com` (eigen API key vereist) of via de backend proxy als ingelogd
- **API key instellen**: Vandaag-tab → ⚙ → API Key
- **Database**: SQLite via `better-sqlite3`, auto-migrate bij eerste start
- **Auth**: JWT, 10 pogingen per 15 minuten op login/register

---

## Deploy (Cloudflare Pages)

De `frontend/` map deployt automatisch via Cloudflare Pages bij elke push naar `main`. Geen build command nodig. Zie `CLOUDFLARE.md` voor details.
