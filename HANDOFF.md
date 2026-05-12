# Webiaprod CRM — Handoff context

> Document de reprise pour ouvrir une nouvelle session Claude Code (ou
> partager le contexte à un nouvel agent / collaborateur). Tient en 1
> page : ce qui est fait, ce qui tourne, ce qu'il reste à faire.

---

## 🎯 Le projet en 1 phrase

CRM Kanban + 2 subagents Claude Code pour la **prospection cold mailing
automatisée** de **Webiaprod AI** (offre Early Bird GEO/SEO Local :
500€/12 mois + audit GEO offert (447€), 50 places, max 2-3 par
ville+secteur).

**Owner** : Camille / Jérôme Webiaprod
**Repo** : https://github.com/Camille06000/Webiaprod-crm
**Branche active** : `claude/crm-kanban-early-bird-5ZH3a`
**PR ouverte (draft)** : #1

---

## 🌐 Production live

- **URL** : http://72.62.27.251:8080
- **VPS** : Hostinger Ubuntu 22.04, IP `72.62.27.251` (root SSH)
- **App** : Next.js 14 (App Router) en pm2 sous user `webiaprod`
- **Chemin** : `/home/webiaprod/app`
- **DB** : Postgres local (port auto-détecté car Supabase squattait 5432),
  base `webiaprod_crm`, user `webiaprod`
- **Cron quotidien** : crontab user `webiaprod`, 9h Paris
  (`CRON_TZ=Europe/Paris`), appelle `http://127.0.0.1:8080/api/cron/daily`
  avec Bearer `CRON_SECRET`
- **Pas de HTTPS** (pas de domaine), **pas d'auth** sur le CRM

⚠️ **Le VPS héberge déjà plein de services Hostinger** : Supabase
(5432, 8000), nginx (80, 443), des apps Node sur 3000/3001/3002/3003/3006,
n8n (5678). Notre CRM est sur **8080** pour cohabiter.

---

## 🧱 Stack

| Couche | Tech |
|---|---|
| Frontend | Next.js 14 App Router + Tailwind + dnd-kit, 100% FR, responsive |
| Backend | Routes API Next.js (Node runtime) |
| DB | Postgres via `postgres` (postgres.js) — driver universel (local + Neon) |
| Hosting | VPS Ubuntu, pm2 + UFW |
| Scraping | Apify actor `compass/crawler-google-places` avec `scrapeContacts: true` |
| Email | Gmail API via OAuth refresh token (scope `gmail.compose`) |
| Agents | `.claude/agents/webiaprod-cold-email.md` + `webiaprod-daily-prospection.md` |

---

## ✅ Ce qui fonctionne aujourd'hui

1. **Kanban 8 colonnes** avec drag & drop entre colonnes
   (Nouveaux → Contactés → Intéressés → Démo → Closés / Pas Fit /
   Concurrent / Pas intéressé)
2. **Dashboard Early Bird** : N/50 signés, cash, MRR, démos en attente,
   taux conv contact→démo et démo→client
3. **Vue Zones bloquées** : tableau ville × secteur, OUVERT / FERMÉ,
   bouton "Marquer Concurrent signé"
4. **Scoring 1-10 auto** (email pro, site actif, Google ≥4 & ≥20 avis,
   description claire, top 10 local, GBP rempli) → < 5 = Pas Fit auto
5. **Actions recommandées** : J+0 / J+3 / J+7 / J+14, boutons "Action faite"
   et "Reporter +2j"
6. **Formulaire lead complet** (création + édition)
7. **Scraping Apify** : `POST /api/scrape` body `{ville, secteur, maxResults}`
   → scrape → dédup → score → import. **Testé OK** sur "plombier Lyon" :
   50 scrapés → 21 importés → 29 sans email public
8. **Subagent rédacteur** `webiaprod-cold-email` (voix Webiaprod,
   5-6 lignes + signature RS6776, Calendly `calendly.com/jerome-webiaprod`)
9. **Subagent orchestrateur** `webiaprod-daily-prospection` (workflow
   quotidien 12 étapes)
10. **Endpoint /api/cron/daily** : snapshot quotidien (zone active,
    leads à relancer, top 3, KPIs)

---

## 🟡 En cours / partiel

### Gmail draft creation (côté code = fait, côté config = en attente)

- ✅ `lib/gmail.ts` : OAuth refresh + create draft
- ✅ `scripts/gmail-oauth.mjs` : CLI pour récupérer le refresh token
- ✅ `POST /api/leads/:id/draft` : endpoint
- ✅ Bouton "✉️ Créer draft Gmail" sur la fiche lead

⏳ **Reste à faire par l'utilisateur (Camille)** :
1. Créer un projet Google Cloud
2. Activer Gmail API + créer un OAuth Client (Desktop app)
3. Lancer `node scripts/gmail-oauth.mjs` sur son PC pour obtenir le
   `GOOGLE_OAUTH_REFRESH_TOKEN`
4. Coller les 5 variables dans `/home/webiaprod/app/.env.local` sur le VPS
   et faire `pm2 restart webiaprod-crm`

Détails complets dans le README.

---

## 🔴 Pas encore fait

- **L'orchestrateur quotidien ne tourne pas vraiment** : il est défini en
  prompt mais le cron Vercel ne fait qu'un snapshot. Pour que la run 9h
  Paris s'exécute autonome : il faudrait un endpoint
  `/api/runs/daily/execute` qui chaîne scrape (toutes zones actives) →
  drafts Gmail (pour chaque lead ≥5) → email récap à Jérôme.
- **Pas d'email récap quotidien** (étape 11 du workflow)
- **Pas de Gmail send** (seulement drafts, par sécurité — c'est voulu)
- **Pas de UI bouton "Scraper une zone"** (faut curler la commande)
- **Pas d'authentification** sur le CRM (URL publique sans login)
- **Pas de HTTPS** sur le VPS (faudrait un domaine + certbot)

---

## 🔑 Credentials configurés sur le VPS

Dans `/home/webiaprod/app/.env.local` (proprement chmod 600) :

| Variable | Statut |
|---|---|
| `DATABASE_URL` | ✅ Postgres local |
| `CRON_SECRET` | ✅ `f613d7a1a94c6c09eeaa641869033d155d2ac11b34e9c9e409d53be90f272dc2` |
| `APIFY_TOKEN` | ✅ token Apify configuré (utilisateur a fourni un, à rotate) |
| `GOOGLE_OAUTH_CLIENT_ID` | ⏳ à configurer |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ⏳ à configurer |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | ⏳ à configurer |
| `GMAIL_FROM_EMAIL` | ⏳ à configurer (probable `jerome@webiaprod.fr`) |
| `GMAIL_FROM_NAME` | ⏳ à configurer |
| `JEROME_LAST_NAME` | ⏳ à configurer |
| `CALENDLY_URL` | ✅ `https://calendly.com/jerome-webiaprod` |

---

## 🛠 Commandes utiles VPS

```bash
# Logs de l'app
sudo -u webiaprod pm2 logs webiaprod-crm

# Logs du cron quotidien
tail -f /var/log/webiaprod-cron.log

# Redémarrer après un git pull
cd /home/webiaprod/app
sudo -u webiaprod git pull
sudo -u webiaprod npm install
sudo -u webiaprod npm run build
sudo -u webiaprod pm2 restart webiaprod-crm

# Tester /api/cron/daily à la main
curl -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:8080/api/cron/daily

# Lancer un scrape Apify manuel
curl -X POST http://127.0.0.1:8080/api/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"ville":"Marseille","secteur":"restaurant","maxResults":50}'

# Créer un draft Gmail pour le lead #42
curl -X POST http://127.0.0.1:8080/api/leads/42/draft \
  -H "Content-Type: application/json" -d '{}'
```

---

## 📂 Structure du repo

```
app/
├── api/
│   ├── leads/             CRUD + move + action + draft Gmail
│   ├── zones/             zones bloquées + close-out
│   ├── metrics/           KPIs Early Bird
│   ├── scrape/            Apify Google Maps scraper
│   └── cron/daily/        snapshot pour l'orchestrateur
├── leads/[id]/            fiche lead (action panel + form)
├── leads/new/             création
├── zones/                 vue zones bloquées
└── page.tsx               Kanban + dashboard
components/
├── KanbanBoard.tsx        dnd-kit board
├── LeadCard.tsx
├── LeadForm.tsx
├── LeadActionPanel.tsx    "Action faite" / "Reporter +2j" + "Créer draft Gmail"
├── EarlyBirdDashboard.tsx
└── ZonesView.tsx
lib/
├── columns.ts             8 colonnes Kanban
├── types.ts               type Lead
├── scoring.ts             règle 1-10
├── actions.ts             J+0 / J+3 / J+7 / J+14
├── db.ts                  postgres.js connection + ensureSchema()
├── repo.ts                toutes les requêtes (async)
├── apify.ts               wrapper Apify Google Maps + scrapeContacts
└── gmail.ts               OAuth refresh + createDraft
scripts/
├── install-vps.sh         install one-shot Ubuntu 22/24
├── gmail-oauth.mjs        CLI one-shot pour refresh token Gmail
└── seed.mjs               9 leads de démo
.claude/agents/
├── webiaprod-cold-email.md       rédacteur 5-6 lignes voix Webiaprod
└── webiaprod-daily-prospection.md  orchestrateur 12 étapes
vercel.json                Vercel Cron (alternatif au cron VPS)
.env.example
README.md
HANDOFF.md                 (ce fichier)
```

---

## 📋 Modèle économique Webiaprod (à toujours rappeler dans les emails)

- **Tarif public** : 99€/mois (1 188€/an)
- **Offre Early Bird** : 500€ pour 12 mois + audit GEO offert (447€)
  → économie 1 135€
- **Plafond global** : 50 premiers clients
- **Rareté géo** : max 2-3 par ville+secteur
- **4 leviers psy** à activer dans chaque email :
  1. Prix (500€ vs 1 188€ public, -58%)
  2. Bonus (audit 447€ offert)
  3. Rareté quantitative (50 premiers)
  4. Rareté géographique (2-3 par zone)

---

## 🎬 Pour une nouvelle session

1. Cloner le repo + checkout la bonne branche :
   ```bash
   git clone https://github.com/Camille06000/Webiaprod-crm.git
   cd Webiaprod-crm
   git checkout claude/crm-kanban-early-bird-5ZH3a
   ```
2. Lire ce HANDOFF.md + le README
3. Pour bosser sur l'app, soit local (`cp .env.example .env.local && npm
   install && npm run dev`), soit en SSH sur le VPS
4. Pour faire évoluer le code : commit + push sur la branche, puis sur
   le VPS faire `git pull && npm run build && pm2 restart webiaprod-crm`

**Priorité 1 next session** : finir le setup Gmail OAuth (étape 1-2 dans
le README) pour activer le bouton "Créer draft Gmail" sur les leads.

**Priorité 2** : écrire un endpoint `/api/runs/daily/execute` qui rend
l'orchestrateur autonome (scrape automatique zones actives + drafts +
email récap).
