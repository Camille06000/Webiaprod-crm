# Webiaprod AI — CRM Kanban Early Bird

CRM Kanban Next.js 14 + Tailwind + SQLite pour la prospection GEO/SEO de
Webiaprod AI. Conçu autour de l'offre **Early Bird 500€/12 mois + audit GEO
offert** (50 places maximum, 2-3 clients max par ville+secteur).

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- SQLite local via `better-sqlite3`
- Drag & drop : `@dnd-kit/core` + `@dnd-kit/sortable`
- TypeScript, interface 100% FR, responsive mobile

## Démarrage rapide

```bash
npm install
npm run seed   # (optionnel) données de démo
npm run dev    # http://localhost:3000
```

La base SQLite est créée automatiquement dans `data/crm.db`.

## Fonctionnalités

- **Kanban 8 colonnes** : Nouveaux leads · Contactés · Intéressés · Démo bookée
  · Closés Early Bird · Pas Fit · Concurrent signé · Pas intéressé / NPAI.
- **Drag & drop** entre colonnes (mobile-friendly).
- **Dashboard Early Bird** en tête : clients signés / 50, cash, MRR équivalent,
  taux conv contact→démo et démo→client. Bandeau auto quand N atteint 50.
- **Zones bloquées** : tableau ville × secteur, statut OUVERT (<3) / FERMÉ (≥3),
  bandeau d'alerte, action « notifier prospects en cours » et bouton « marquer
  comme Concurrent signé ».
- **Scoring 1–10** automatique :
  email pro (+2), site actif (+2), Google ≥4 & ≥20 avis (+2), description claire
  (+1), top 10 local (+3), GBP bien rempli (+1). Score < 5 → Pas Fit auto.
- **Actions recommandées dynamiques** :
  J+0 valider draft Gmail · J+3 relance soft · J+7 relance valeur ChatGPT live
  · J+14 archiver. Bouton « Action faite » qui recalcule la prochaine, « +2j »
  qui repousse.

## Routes API

- `GET/POST /api/leads`, `GET/PATCH/DELETE /api/leads/:id`
- `POST /api/leads/:id/move` — change le statut (drag&drop)
- `POST /api/leads/:id/action` — `op: done | skip`
- `GET /api/zones`, `GET /api/zones?ville=...&secteur=...`
- `POST /api/zones/close-out` — bascule tous les leads en cours d'une zone
  fermée vers « Concurrent signé »
- `GET /api/metrics` — KPI Early Bird

## Modèle économique

- Offre publique : **99€/mois (1 188€/an)**
- Offre Early Bird : **500€/12 mois + audit GEO offert (447€)**, 50 places
- Rareté géo : 2-3 clients max par ville+secteur
