// Wrapper minimaliste pour Apify Google Maps Scraper (actor `compass/crawler-google-places`).
// Doc actor : https://apify.com/compass/crawler-google-places
//
// Renvoie des leads normalisés au format Webiaprod CRM (champ → champ Lead).

export interface ScrapedLead {
  entreprise: string;
  secteur: string;
  ville: string;
  quartier: string | null;
  email: string | null;
  telephone: string | null;
  site: string | null;
  note_google: number | null;
  nb_avis: number | null;
  description: string | null;
  source_url: string | null;
}

interface ApifyPlace {
  title?: string;
  categoryName?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  url?: string;
  emails?: string[];
  email?: string;
  totalScore?: number;
  reviewsCount?: number;
  description?: string;
}

const APIFY_ACTOR = "compass~crawler-google-places";

export interface ScrapeParams {
  secteur: string;
  ville: string;
  maxResults?: number;
  language?: string;
}

export async function scrapeGoogleMaps(params: ScrapeParams): Promise<ScrapedLead[]> {
  const places = await scrapeGoogleMapsRaw(params);
  return places.map(toLead.bind(null, params.secteur, params.ville));
}

export async function scrapeGoogleMapsRaw(params: ScrapeParams): Promise<ApifyPlace[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN manquant dans l'environnement");

  const { secteur, ville, maxResults = 50, language = "fr" } = params;

  const input = {
    searchStringsArray: [`${secteur} ${ville}`],
    maxCrawledPlacesPerSearch: maxResults,
    language,
    countryCode: "fr",
    exportPlaceUrls: false,
    scrapeReviewsCount: 0,
    scrapePlaceDetailPage: true,
    // Visite le site web de chaque place pour en extraire emails + réseaux sociaux.
    scrapeContacts: true,
    skipClosedPlaces: true,
  };

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify run failed: ${res.status} ${body.slice(0, 500)}`);
  }

  return (await res.json()) as ApifyPlace[];
}

function toLead(secteur: string, ville: string, p: ApifyPlace): ScrapedLead {
  // Apify expose les emails à plusieurs emplacements selon l'option activée.
  const emailFromArrays =
    (p as Record<string, unknown>)["emails"] as string[] | undefined ??
    (p as Record<string, unknown>)["contactDetails"] as { emails?: string[] } | undefined;
  const cd = (p as Record<string, unknown>)["contactDetails"] as { emails?: string[]; phones?: string[]; phonesUncertain?: string[] } | undefined;
  const email =
    (Array.isArray(emailFromArrays) ? emailFromArrays[0] : undefined) ??
    cd?.emails?.[0] ??
    p.email ??
    null;

  return {
    entreprise: (p.title ?? "").trim(),
    secteur,
    ville,
    quartier: p.neighborhood ?? null,
    email,
    telephone: p.phoneUnformatted ?? p.phone ?? cd?.phones?.[0] ?? null,
    site: p.website ?? null,
    note_google: typeof p.totalScore === "number" ? p.totalScore : null,
    nb_avis: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
    description: p.description ?? null,
    source_url: p.url ?? null,
  };
}
