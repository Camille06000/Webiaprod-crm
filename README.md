# Webiaprod AI — CRM Kanban Early Bird

CRM Kanban Next.js 14 + Tailwind + **Neon Postgres** + dnd-kit pour la
prospection GEO/SEO de Webiaprod AI. Conçu autour de l'offre **Early Bird
500€/12 mois + audit GEO offert** (50 places, 2-3 clients max par
ville+secteur).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- **Neon Postgres** via `@neondatabase/serverless` (Edge-compatible)
- `@dnd-kit/core` + `@dnd-kit/sortable` pour le drag & drop
- **Vercel Cron** quotidien à 9h Paris pour l'orchestrateur de prospection
- Interface 100% FR, responsive mobile

---

## Déploiement (Vercel + Neon)

### 1. Créer la base Neon (gratuit)

1. Va sur [console.neon.tech](https://console.neon.tech)
2. Crée un projet `webiaprod-crm`
3. Copie la **Pooled connection string** (`postgres://...neon.tech/...?sslmode=require`)

### 2. Déployer sur Vercel

1. Va sur [vercel.com/new](https://vercel.com/new)
2. Importe le repo GitHub `Camille06000/Webiaprod-crm`
3. Dans **Environment Variables**, ajoute :
   - `DATABASE_URL` = la connection string Neon
   - `CRON_SECRET` = une chaîne aléatoire (génère avec `openssl rand -hex 32`)
4. Deploy.

Vercel crée automatiquement le cron job défini dans `vercel.json` (déclenché
à **8h UTC** = 9h Paris en hiver / 10h Paris en été).

### 3. Initialiser le schéma + (optionnel) seeder

Une fois déployé, le schéma se crée tout seul au premier appel. Pour
**peupler des leads de démo**, exécute localement (avec le `.env.local`) :

```bash
npm run seed
```

---

## Développement local

```bash
cp .env.example .env.local
# remplis DATABASE_URL avec ta connection string Neon
npm install
npm run seed   # (optionnel) 9 leads de démo
npm run dev    # http://localhost:3000
```

---

## Fonctionnalités

- **Kanban 8 colonnes** : Nouveaux Leads · Contactés · Intéressés · Démo
  bookée · Closés Early Bird · Pas Fit · Concurrent signé · Pas intéressé /
  NPAI. Drag & drop entre colonnes (mobile-friendly).
- **Dashboard Early Bird** : N/50 signés, cash, MRR équivalent (× 41,67€),
  démos en attente, taux conv contact→démo et démo→client. Bandeau auto à
  50.
- **Zones bloquées** : tableau ville × secteur, statut OUVERT (<3) / FERMÉ
  (≥3), bandeau d'alerte, action « marquer Concurrent signé » pour les
  leads restants.
- **Scoring 1–10 auto** : email pro (+2), site actif (+2), Google ≥4 & ≥20
  avis (+2), description claire (+1), top 10 local (+3), GBP rempli (+1).
  Score < 5 → Pas Fit auto.
- **Actions recommandées** : J+0 valider draft · J+3 relance soft · J+7
  relance valeur ChatGPT · J+14 archivage. Boutons « Action faite » et
  « +2j ».
- **Subagents Claude Code** (`.claude/agents/`) :
  - `webiaprod-cold-email` — rédige les cold emails dans la voix Webiaprod
  - `webiaprod-daily-prospection` — orchestre la run quotidienne 9h Paris

## Routes API

- `GET/POST /api/leads`, `GET/PATCH/DELETE /api/leads/:id`
- `POST /api/leads/:id/move` — change le statut (drag & drop)
- `POST /api/leads/:id/action` — `op: done | skip`
- `GET /api/zones`, `GET /api/zones?ville=...&secteur=...`
- `POST /api/zones/close-out` — bascule les leads en cours d'une zone fermée
- `GET /api/metrics` — KPI Early Bird
- `GET /api/cron/daily` — snapshot quotidien pour l'orchestrateur
  (protégé par `Authorization: Bearer ${CRON_SECRET}`)

## Modèle économique

- Offre publique : **99€/mois (1 188€/an)**
- Offre Early Bird : **500€/12 mois + audit GEO offert (447€)**, 50 places
- Rareté géo : 2-3 clients max par ville+secteur
