#!/usr/bin/env bash
#
# Install Webiaprod CRM on a fresh Ubuntu 22.04 / 24.04 VPS.
# Idempotent — re-running is safe.
#
# Usage (as root or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/Camille06000/Webiaprod-crm/main/scripts/install-vps.sh -o install.sh
#   chmod +x install.sh
#   DB_PASSWORD='choisis-un-mot-de-passe' ./install.sh
#
# Optional env:
#   REPO_URL=https://github.com/Camille06000/Webiaprod-crm.git
#   BRANCH=main
#   APP_USER=webiaprod
#   APP_DIR=/home/webiaprod/app
#   APP_PORT=3000
#   CRON_SECRET=<auto-généré si absent>
#   SEED=1  # pour insérer 9 leads de démo

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Camille06000/Webiaprod-crm.git}"
BRANCH="${BRANCH:-main}"
APP_USER="${APP_USER:-webiaprod}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/app}"
APP_PORT="${APP_PORT:-3000}"
DB_NAME="${DB_NAME:-webiaprod_crm}"
DB_USER="${DB_USER:-webiaprod}"
DB_PASSWORD="${DB_PASSWORD:-}"
CRON_SECRET="${CRON_SECRET:-}"
SEED="${SEED:-0}"

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "Ce script doit être lancé en root (ou avec sudo)." >&2
    exit 1
  fi
}

generate_secret() {
  openssl rand -hex 32
}

require_root

if [[ -z "$DB_PASSWORD" ]]; then
  echo "DB_PASSWORD non défini. Génère-en un et relance :"
  echo "  DB_PASSWORD='\$(openssl rand -hex 16)' ./install.sh"
  exit 1
fi

if [[ -z "$CRON_SECRET" ]]; then
  CRON_SECRET="$(generate_secret)"
  echo ">> CRON_SECRET généré : $CRON_SECRET"
fi

echo ">> [1/9] APT update + paquets de base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  curl ca-certificates gnupg git build-essential \
  postgresql postgresql-contrib \
  ufw

echo ">> [2/9] Node.js 20 LTS (NodeSource)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo ">> [3/9] pm2 (gestionnaire de process)"
npm install -g pm2 >/dev/null

echo ">> [4/9] Utilisateur applicatif : $APP_USER"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$APP_USER"
fi

echo ">> [5/9] Postgres : base $DB_NAME / user $DB_USER"
systemctl enable --now postgresql

# Créer user + DB de manière idempotente
sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo ">> [6/9] Clone / pull du repo dans $APP_DIR"
if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi
sudo -u "$APP_USER" git -C "$APP_DIR" fetch origin
sudo -u "$APP_USER" git -C "$APP_DIR" checkout "$BRANCH"
sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only origin "$BRANCH"

cat > "$APP_DIR/.env.local" <<EOF
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}
CRON_SECRET=${CRON_SECRET}
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/.env.local"
chmod 600 "$APP_DIR/.env.local"

echo ">> [7/9] npm install + build"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm install --no-audit --no-fund --loglevel=error"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm run build"

if [[ "$SEED" == "1" ]]; then
  echo ">> Seed des 9 leads de démo"
  sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm run seed" || echo "(seed ignoré)"
fi

echo ">> [8/9] pm2 (start + autostart au boot)"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && pm2 delete webiaprod-crm 2>/dev/null || true"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && pm2 start npm --name webiaprod-crm -- start"
sudo -u "$APP_USER" bash -lc "pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/${APP_USER}" >/dev/null || true
systemctl enable "pm2-${APP_USER}" 2>/dev/null || true

echo ">> [9/9] UFW firewall + cron quotidien 9h Paris"
ufw allow OpenSSH >/dev/null
ufw allow "${APP_PORT}/tcp" >/dev/null
ufw --force enable >/dev/null

# Crontab avec timezone Paris (CRON_TZ géré par vixie-cron sur Ubuntu)
CRON_LINE="CRON_TZ=Europe/Paris
0 9 * * * curl -fsS -H 'Authorization: Bearer ${CRON_SECRET}' http://127.0.0.1:${APP_PORT}/api/cron/daily >> /var/log/webiaprod-cron.log 2>&1"
echo "$CRON_LINE" | crontab -u "$APP_USER" -

IP="$(curl -fsS https://api.ipify.org || echo 'TON_IP_VPS')"
echo
echo "===================================================================="
echo " ✓ Installation terminée."
echo
echo "   App         : http://${IP}:${APP_PORT}"
echo "   DB          : postgres://${DB_USER}@127.0.0.1:5432/${DB_NAME}"
echo "   CRON_SECRET : ${CRON_SECRET}"
echo "   Logs app    : sudo -u ${APP_USER} pm2 logs webiaprod-crm"
echo "   Logs cron   : tail -f /var/log/webiaprod-cron.log"
echo "   Reload app  : sudo -u ${APP_USER} pm2 restart webiaprod-crm"
echo
echo " Note : pas de domaine = pas de HTTPS. Pour ajouter HTTPS plus tard,"
echo " achète un domaine, pointe-le sur ${IP}, puis :"
echo "   apt install -y nginx certbot python3-certbot-nginx"
echo "   certbot --nginx -d crm.tondomaine.fr"
echo "===================================================================="
