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
    skipClosedPlaces: true,
  };

  // run-sync-get-dataset-items renvoie directement les items du dataset (1 seul appel).
  // ⚠️ pour de très gros runs (> 5 min), il faudrait passer en run async + polling.
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

  const places = (await res.json()) as ApifyPlace[];

  return places.map((p): ScrapedLead => {
    const email = p.emails?.[0] ?? p.email ?? null;
    return {
      entreprise: (p.title ?? "").trim(),
      secteur,
      ville,
      quartier: p.neighborhood ?? null,
      email,
      telephone: p.phoneUnformatted ?? p.phone ?? null,
      site: p.website ?? null,
      note_google: typeof p.totalScore === "number" ? p.totalScore : null,
      nb_avis: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
      description: p.description ?? null,
      source_url: p.url ?? null,
    };
  });
}
