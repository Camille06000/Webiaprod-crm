#!/usr/bin/env node
//
// CLI one-shot pour récupérer un GOOGLE_OAUTH_REFRESH_TOKEN.
//
// À lancer SUR TON PC (Mac/Windows/Linux), pas sur le VPS — il faut un
// navigateur qui puisse callback sur http://localhost:8765/callback.
//
// Pré-requis :
// 1. Crée un projet Google Cloud → console.cloud.google.com
// 2. APIs & Services → Enable APIs → "Gmail API" → Enable
// 3. OAuth consent screen → External (ou Internal si Workspace), ajoute
//    l'adresse email d'envoi dans les "test users"
// 4. Credentials → Create OAuth Client ID → type "Desktop app"
//    → tu obtiens un client_id + client_secret
//
// Puis exporte-les et lance le script :
//   export GOOGLE_OAUTH_CLIENT_ID='...'
//   export GOOGLE_OAUTH_CLIENT_SECRET='...'
//   node scripts/gmail-oauth.mjs

import http from "node:http";
import { URL } from "node:url";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.compose";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\nManque GOOGLE_OAUTH_CLIENT_ID ou GOOGLE_OAUTH_CLIENT_SECRET dans l'env.\n");
  console.error("Exemple :");
  console.error("  export GOOGLE_OAUTH_CLIENT_ID='123...apps.googleusercontent.com'");
  console.error("  export GOOGLE_OAUTH_CLIENT_SECRET='GOCSPX-...'");
  console.error("  node scripts/gmail-oauth.mjs\n");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\n1. Ouvre cette URL dans ton navigateur (sur cette machine) :\n");
console.log("   " + authUrl.toString() + "\n");
console.log("2. Connecte-toi avec l'adresse d'envoi (ex. jerome@webiaprod.fr).");
console.log("3. Autorise l'accès Gmail.compose (création de drafts uniquement).");
console.log("4. Tu seras redirigé sur " + REDIRECT_URI + " — ce script va capter le code.\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end("Not found");
    return;
  }
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" })
      .end(`<h1>Erreur OAuth</h1><pre>${error || "no code"}</pre>`);
    console.error("\nÉchec OAuth :", error || "no code");
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" })
        .end(`<h1>Echec exchange</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
      console.error("\nÉchec exchange code → token :", data);
      server.close();
      process.exit(1);
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(
      "<h1>OK ✅</h1><p>Refresh token récupéré. Tu peux fermer cet onglet et regarder le terminal.</p>"
    );

    console.log("\n✅ Refresh token récupéré.\n");
    console.log("Copie ces variables dans le .env.local de ton VPS :\n");
    console.log(`   GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`   GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`   GOOGLE_OAUTH_REFRESH_TOKEN=${data.refresh_token}\n`);
    console.log("Puis sur le VPS : pm2 restart webiaprod-crm\n");

    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500).end("Error: " + e.message);
    console.error("\nErreur :", e);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} en attente du callback OAuth…\n`);
});
