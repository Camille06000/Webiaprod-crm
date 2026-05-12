// Helper Gmail API : refresh d'access token + création de draft.
// L'auth est OAuth2 avec refresh_token (sans interaction utilisateur côté serveur).
//
// Variables d'env requises :
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//   GMAIL_FROM_EMAIL   (l'adresse email d'envoi)
//   GMAIL_FROM_NAME    (nom affiché dans le From, ex. "Jérôme Dupont")

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

let cached: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google OAuth env manquant (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN)"
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export interface DraftInput {
  to: string;
  from: string; // ex. "Jérôme Dupont <jerome@webiaprod.fr>"
  subject: string;
  body: string; // texte brut
}

export interface DraftResult {
  draftId: string;
  messageId: string | null;
  threadId: string | null;
}

export async function createGmailDraft(d: DraftInput): Promise<DraftResult> {
  const token = await getAccessToken();

  const headers = [
    `To: ${d.to}`,
    `From: ${d.from}`,
    `Subject: ${encodeSubject(d.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
  ];
  const rfc822 = headers.join("\r\n") + "\r\n\r\n" + d.body;
  const raw = base64UrlEncode(rfc822);

  const res = await fetch(`${GMAIL_API_BASE}/drafts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail draft creation failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    id: string;
    message?: { id?: string; threadId?: string };
  };
  return {
    draftId: data.id,
    messageId: data.message?.id ?? null,
    threadId: data.message?.threadId ?? null,
  };
}

function encodeSubject(s: string): string {
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf-8").toString("base64")}?=`;
}

function base64UrlEncode(s: string): string {
  return Buffer.from(s, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
