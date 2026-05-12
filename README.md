# Webiaprod AI — Système de prospection autonome GEO/SEO

> Machine de prospection cold mailing pour vendre l'offre **Early Bird
> GEO/SEO Local** de Webiaprod AI : **500€ pour 12 mois + audit GEO
> offert** (au lieu de 1 188€), limitée à 50 clients, max 2-3 par
> ville+secteur.

C'est **deux briques qui travaillent ensemble** :

| Brique | Rôle |
|---|---|
| **CRM Kanban** (web app) | La source de vérité : leads, statuts, scores, zones, métriques. Accessible depuis ton téléphone, ton ordi, n'importe où. |
| **Subagents Claude Code** (`.claude/agents/`) | Le cerveau : un agent qui pilote la run quotidienne, un agent qui rédige les emails dans la bonne voix. |

---

## Le problème qu'on résout

Quand un client potentiel demande à ChatGPT *« meilleur restaurant
français à Bangkok »* ou *« plombier fiable Lyon »*, **ce sont nos
clients qui doivent ressortir**.

Webiaprod AI référence les entreprises locales sur les IA génératives
(ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews). On vend ça en
cold mailing :

- **Prix public site** : 99€/mois (1 188€/an) — l'ancrage.
- **Early Bird** : 500€/12 mois + audit GEO offert (valeur 447€). Économie totale 1 135€.
- **Plafond global** : 50 clients Early Bird, puis on bascule sur l'offre publique.
- **Rareté géographique** : 2-3 entreprises max par ville+secteur. Quand
  on signe 3 dentistes à Lille, la zone se ferme automatiquement et les
  prospects restants sur cette zone deviennent « Concurrent signé ».

Les **4 leviers psychologiques** activés à chaque email :

1. **Prix** (500€ vs 1 188€, -58%)
2. **Bonus** (audit GEO 447€ offert)
3. **Rareté quantitative** (50 premiers clients)
4. **Rareté géographique** (2-3 par zone)

---

## Ce que le CRM fait

### 1. Pipeline Kanban (page d'accueil)

8 colonnes représentant l'état d'un prospect, du premier draft Gmail
à la signature :

```
Nouveaux Leads → Contactés → Intéressés → Démo bookée → Closés Early Bird
              ↓
        Pas Fit   Concurrent signé   Pas intéressé / NPAI
```

Tu fais glisser une carte d'une colonne à l'autre, le CRM met à jour le
statut + recalcule la prochaine action recommandée.

### 2. Dashboard Early Bird (en tête de page)

À chaque instant tu vois :

- 🔥 **Clients Early Bird signés : N/50** (avec barre de progression)
- 💰 **Cash encaissé total** (= N × 500€)
- 📅 **MRR équivalent** (= N × 41,67€/mois)
- 🎯 **Démos bookées en attente**
- 📊 **Taux conv contact → démo** et **démo → client**

Quand N atteint 50 → bandeau **« Early Bird terminé, basculer offre publique 99€/mois »**.

### 3. Zones bloquées (page `/zones`)

Tableau filtrable de tous les couples **ville × secteur** où tu as des
leads :

- **OUVERT** : < 3 signés sur la zone, tu peux encore prospecter.
- **FERMÉ** : ≥ 3 signés. Bandeau d'alerte rouge.
  Bouton **« Marquer leads restants Concurrent signé »** pour solder la
  zone d'un coup et notifier les prospects que la place est prise.

Le panneau latéral te liste les prospects à closer **vite** sur la zone
(Contactés / Intéressés / Démo bookée) avant qu'ils basculent en
« Concurrent signé ».

### 4. Scoring 1-10 automatique

À chaque lead créé ou modifié :

| Critère | Points |
|---|---|
| Email pro vérifiable | +2 |
| Site web actif | +2 |
| Note Google ≥ 4 ET ≥ 20 avis | +2 |
| Description claire | +1 |
| Top 10 Google local pour son secteur | +3 |
| Google Business Profile bien rempli | +1 |

**Score < 5 → atterrit direct dans « Pas Fit »**, pas de draft à
rédiger.

### 5. Actions recommandées avec dates

Chaque lead a une **prochaine action** calculée selon son statut :

- **J+0** : valider le draft Gmail
- **J+3** : relance soft (« vos concurrents... »)
- **J+7** : relance valeur (test ChatGPT live)
- **J+14** : archiver « Pas intéressé »

Sur la fiche d'un lead, deux boutons :
- ✓ **Action faite** → recalcule la prochaine action
- ⏭ **Reporter +2j** → repousse la date

Les leads en retard apparaissent en rouge sur les cartes Kanban.

---

## Ce que les Subagents font

Deux subagents Claude Code dans `.claude/agents/`. Tu les invoques depuis
Claude Code une fois que tu as cloné le repo.

### `webiaprod-cold-email` — le rédacteur

**Rôle** : produire UN email cold dans la voix Webiaprod, à la demande.

**Tu lui dis** : *« écris un cold email pour Boulangerie du Marché, Lyon
Croix-Rousse, 312 avis 4,7★ »*.

**Il te rend** un email de 5-6 lignes + signature, format imposé :

```
Objet : <≤ 50 caractères>

Ligne 1 — accroche personnalisée (élément factuel)
Ligne 2 — pivot ChatGPT (« sauf que sur ChatGPT... »)
Ligne 3 — offre Early Bird avec les 4 leviers
Ligne 4 — bénéfice concret secteur
Ligne 5 — CTA Calendly 15 min démo LIVE

Jérôme [Nom]
Chef de projet — Webiaprod AI
Agence IA certifiée RS6776
webiaprod.fr
```

**Garde-fous** (refus de livrer si une condition échoue) :
- Pas d'emoji, pas de mot spammy en objet
- 4 leviers Early Bird obligatoires (500€/12 mois, 447€ offert, 50, 2-3/zone)
- Accroche citant un élément factuel (avis, position, ancienneté)
- CTA = démo live 15 min, pas « un appel »
- Signature RS6776 obligatoire

### `webiaprod-daily-prospection` — l'orchestrateur quotidien

**Rôle** : à 9h Paris chaque jour, tourner le cycle complet en 12 étapes
sans intervention humaine.

```
1.  Vérifier le compteur Early Bird (N/50)
       └── si ≥ 50, alerte email et arrêt
2.  Identifier le secteur+ville ACTIF (passer au suivant si besoin)
3.  Vérifier que la zone n'est pas FERMÉE
4.  Scraper 50-80 leads via Apify (Google Maps)
5.  Dédupliquer contre le CRM
6.  Scorer chaque lead (1-10)
7.  Pour chaque score ≥ 5 → déléguer la rédaction au subagent
       webiaprod-cold-email et créer le draft Gmail
8.  Logger le lead dans le CRM
9.  Détecter si la zone est épuisée (< 5 leads/jour pendant 2 jours, etc.)
10. Logger la run du jour
11. Envoyer un email récap à jerome@webiaprod.fr (top 3, KPIs, alertes)
12. Lire la boîte [WBAI-FEEDBACK] et appliquer les corrections demain
```

**Règle absolue** : **jamais d'envoi auto** vers les prospects. L'agent
crée des **drafts Gmail**, Jérôme valide manuellement.

---

## L'enchaînement quotidien

```
                              9h Paris
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  Vercel Cron déclenche /api/cron/daily      │
        │  → renvoie zone active, leads à relancer    │
        │    et KPIs au subagent daily-prospection    │
        └────────────────────────────────────────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  Subagent daily-prospection :               │
        │   • Apify scrape la zone du jour            │
        │   • Dédup + score                           │
        │   • Pour chaque lead retenu, appelle        │
        │     subagent cold-email                     │
        │   • Crée les drafts Gmail                   │
        │   • Logge tout dans le CRM                  │
        └────────────────────────────────────────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  Email récap à jerome@webiaprod.fr          │
        │  → Jérôme valide les drafts dans Gmail      │
        │  → Jérôme déplace les cartes dans le CRM    │
        │    au fil des réponses / démos / signatures │
        └────────────────────────────────────────────┘
```

Tout est traçable dans le CRM, et chaque KPI Early Bird est recalculé en
direct.

---

## Architecture technique

| Couche | Tech |
|---|---|
| Frontend | Next.js 14 App Router + Tailwind + dnd-kit, 100% FR, responsive mobile |
| Backend | Routes API Next.js (Node runtime) |
| DB | **Neon Postgres** (gratuit, serverless) via `@neondatabase/serverless` |
| Hosting | **Vercel** (gratuit), URL publique 24/7 |
| Cron | **Vercel Cron** quotidien à 8h UTC (= 9h Paris hiver / 10h été) |
| Agents | Subagents Claude Code dans `.claude/agents/` (markdown + frontmatter) |
| Sécurité cron | Endpoint `/api/cron/daily` protégé par `CRON_SECRET` |

### Routes API

| Méthode + Route | Rôle |
|---|---|
| `GET /api/leads` · `POST /api/leads` | Lister · Créer un lead |
| `GET/PATCH/DELETE /api/leads/:id` | Lire / modifier / supprimer |
| `POST /api/leads/:id/move` | Changer le statut (drag & drop) |
| `POST /api/leads/:id/action` | `op: done` (action faite) ou `skip` (+2j) |
| `GET /api/zones` | Liste des zones avec statuts OUVERT/FERMÉ |
| `GET /api/zones?ville=…&secteur=…` | Leads d'une zone |
| `POST /api/zones/close-out` | Solder une zone fermée (basculer leads → Concurrent signé) |
| `GET /api/metrics` | KPIs Early Bird en temps réel |
| `GET /api/cron/daily` | Snapshot quotidien protégé par `CRON_SECRET` |
| `POST /api/scrape` | Scrape Apify Google Maps + dédup + score + import (auth Bearer `CRON_SECRET`) |
| `POST /api/leads/:id/draft` | Crée un draft Gmail pour le lead (utilise `lead.objet_email` + `lead.accroche` ou un template par défaut) |

## Intégration Gmail (création de drafts)

Le bouton **« ✉️ Créer draft Gmail »** sur la fiche d'un lead crée
automatiquement un brouillon dans la boîte de l'adresse OAuth'd, avec
le corps voix Webiaprod (5-6 lignes + signature RS6776, CTA Calendly).

### Setup (1 fois, ~10 min)

1. **Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com)
   - Crée un projet (ou utilise un existant)
   - **APIs & Services → Library** → cherche « Gmail API » → **Enable**
   - **OAuth consent screen** → User Type **External** (ou Internal si Workspace)
     - App name : `Webiaprod CRM`
     - User support email : ton email
     - Test users : ajoute l'email d'envoi (ex. `jerome@webiaprod.fr`)
   - **Credentials → Create credentials → OAuth client ID**
     - Application type : **Desktop app**
     - Tu obtiens un **Client ID** et un **Client Secret**

2. **Récupère le refresh token** (sur ton PC, pas sur le VPS — il faut un navigateur) :

   ```bash
   git clone https://github.com/Camille06000/Webiaprod-crm.git
   cd Webiaprod-crm
   export GOOGLE_OAUTH_CLIENT_ID='...apps.googleusercontent.com'
   export GOOGLE_OAUTH_CLIENT_SECRET='GOCSPX-...'
   node scripts/gmail-oauth.mjs
   ```

   → un lien s'affiche, tu cliques dessus, tu autorises avec ton email Webiaprod,
   et le terminal te print le `GOOGLE_OAUTH_REFRESH_TOKEN`.

3. **Sur le VPS**, ajoute les 5 variables dans `/home/webiaprod/app/.env.local` :

   ```bash
   echo 'GOOGLE_OAUTH_CLIENT_ID=...' | sudo tee -a /home/webiaprod/app/.env.local
   echo 'GOOGLE_OAUTH_CLIENT_SECRET=...' | sudo tee -a /home/webiaprod/app/.env.local
   echo 'GOOGLE_OAUTH_REFRESH_TOKEN=...' | sudo tee -a /home/webiaprod/app/.env.local
   echo 'GMAIL_FROM_EMAIL=jerome@webiaprod.fr' | sudo tee -a /home/webiaprod/app/.env.local
   echo 'GMAIL_FROM_NAME=Jérôme Dupont' | sudo tee -a /home/webiaprod/app/.env.local
   echo 'JEROME_LAST_NAME=Dupont' | sudo tee -a /home/webiaprod/app/.env.local
   sudo -u webiaprod pm2 restart webiaprod-crm
   ```

4. **Test** depuis la fiche d'un lead avec email :
   - Ouvre `/leads/X` dans le navigateur
   - Clique **« ✉️ Créer draft Gmail »**
   - Va dans https://mail.google.com/mail/u/0/#drafts → ton brouillon est là

---

## Déploiement

3 cibles supportées : **VPS Ubuntu** (Postgres local), **Vercel + Neon**
(cloud), ou **local** (dev).

### Option 1 — VPS Ubuntu 22.04 / 24.04 (recommandé)

Sur ton VPS fraîchement provisionné, en root :

```bash
curl -fsSL https://raw.githubusercontent.com/Camille06000/Webiaprod-crm/main/scripts/install-vps.sh -o install.sh
chmod +x install.sh
DB_PASSWORD="$(openssl rand -hex 16)" SEED=1 ./install.sh
```

Ça installe en une commande :
- **Node.js 20** LTS
- **Postgres** + base `webiaprod_crm` + utilisateur dédié
- L'app dans `/home/webiaprod/app`, **build production**
- **pm2** (autostart au reboot)
- **UFW** (firewall : 22 + 3000 ouverts)
- **Crontab** quotidien à 9h Paris (`CRON_TZ=Europe/Paris`) qui appelle
  `/api/cron/daily` avec le `CRON_SECRET`
- (optionnel) **Seed** des 9 leads de démo si `SEED=1`

À la fin, l'IP publique + l'URL `http://<IP>:3000` s'affichent.

| Commande | Utilité |
|---|---|
| `sudo -u webiaprod pm2 logs webiaprod-crm` | Logs de l'app |
| `tail -f /var/log/webiaprod-cron.log` | Logs du cron quotidien |
| `sudo -u webiaprod pm2 restart webiaprod-crm` | Redémarrer après un pull |
| `cd /home/webiaprod/app && sudo -u webiaprod git pull && npm run build && sudo -u webiaprod pm2 restart webiaprod-crm` | Mettre à jour |

**Pas de HTTPS sans domaine.** Pour ajouter HTTPS, achète un domaine,
pointe-le sur ton IP, puis :
```bash
apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d crm.tondomaine.fr
```

### Option 2 — Vercel + Neon (cloud)

1. **Neon** : [console.neon.tech](https://console.neon.tech) → projet
   `webiaprod-crm` → **Pooled connection** → copier la string.
2. **Vercel** : [vercel.com/new](https://vercel.com/new) → import du repo
   `Camille06000/Webiaprod-crm` → variables d'env :
   - `DATABASE_URL` = la string Neon
   - `CRON_SECRET` = `openssl rand -hex 32`
3. **Deploy**.

Vercel crée automatiquement le cron défini dans `vercel.json` (déclenché
à 8h UTC = 9h Paris hiver / 10h Paris été).

### Option 3 — Local (dev)

```bash
cp .env.example .env.local      # DATABASE_URL = ta string Postgres
npm install
npm run seed                     # (optionnel) 9 leads de démo
npm run dev                      # http://localhost:3000
```

---

## Développement local

```bash
cp .env.example .env.local      # DATABASE_URL = ta string Neon
npm install
npm run dev                      # http://localhost:3000
```

---

## Roadmap d'intégrations à brancher

L'agent quotidien a besoin de ces accès pour tourner **réellement**
(sinon il planifie sans exécuter) :

| Service | Pourquoi | À faire |
|---|---|---|
| **Apify** | Scraper Google Maps | Token API dans Vercel env |
| **Gmail** | Créer les drafts | OAuth Google + scope `gmail.compose` |
| **SMTP / Gmail send** | Email récap quotidien | OAuth ou SMTP applicatif |
| **Calendly** | Lien démo dans les emails | Juste l'URL dans env `CALENDLY_URL` |

Variables d'env optionnelles listées dans `.env.example`.

---

## Structure du repo

```
.
├── app/
│   ├── api/
│   │   ├── leads/             # CRUD + move + action
│   │   ├── zones/             # zones bloquées + close-out
│   │   ├── metrics/           # KPIs Early Bird
│   │   └── cron/daily/        # snapshot pour l'agent quotidien
│   ├── leads/[id]/            # fiche lead
│   ├── leads/new/             # création
│   ├── zones/                 # vue zones bloquées
│   └── page.tsx               # Kanban + dashboard
├── components/
│   ├── KanbanBoard.tsx        # drag & drop dnd-kit
│   ├── LeadCard.tsx
│   ├── LeadForm.tsx           # création / édition complète
│   ├── LeadActionPanel.tsx    # boutons « action faite » / « +2j »
│   ├── EarlyBirdDashboard.tsx # KPIs en tête
│   └── ZonesView.tsx          # tableau zones + panneau latéral
├── lib/
│   ├── columns.ts             # définition des 8 colonnes
│   ├── types.ts               # type Lead
│   ├── scoring.ts             # règle de scoring 1-10
│   ├── actions.ts             # règles J+0 / J+3 / J+7 / J+14
│   ├── db.ts                  # connexion Neon + migration schéma
│   └── repo.ts                # toutes les requêtes DB (async)
├── scripts/
│   └── seed.mjs               # 9 leads de démo
├── .claude/agents/
│   ├── webiaprod-cold-email.md        # subagent rédacteur
│   └── webiaprod-daily-prospection.md # subagent orchestrateur
├── vercel.json                # Vercel Cron quotidien
├── .env.example
└── README.md
```

---

## Récap : ce que tu obtiens

- Une **URL publique 24/7** accessible depuis ton téléphone
- Un **pipeline visuel** des 50 places Early Bird, à jour en temps réel
- Une **rareté géographique** appliquée automatiquement (zones FERMÉES)
- Un **scoring** qui élimine les mauvais leads avant même la rédaction
- Une **voix éditoriale** verrouillée dans un subagent (pas de dérive)
- Un **cycle quotidien autonome** qui tourne à 9h Paris sans toi
- **0€/mois** d'infra (Vercel + Neon gratuit)
- **Jamais d'envoi auto** → drafts uniquement, tu valides
