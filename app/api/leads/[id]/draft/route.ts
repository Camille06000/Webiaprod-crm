import { NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/repo";
import { createGmailDraft } from "@/lib/gmail";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  to?: string; // override lead.email
  subject?: string; // override lead.objet_email
  body?: string; // contenu de l'email (sinon : template par défaut basé sur la voix Webiaprod)
  from?: string; // override GMAIL_FROM_EMAIL (rarement utile)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Body;

  const to = body.to ?? lead.email;
  if (!to) {
    return NextResponse.json(
      { error: "Lead sans email — ajoute un email au lead, ou fournis 'to' dans le body" },
      { status: 400 }
    );
  }

  const fromEmail = body.from ?? process.env.GMAIL_FROM_EMAIL;
  if (!fromEmail) {
    return NextResponse.json(
      { error: "GMAIL_FROM_EMAIL non configuré côté serveur" },
      { status: 500 }
    );
  }
  const fromName = process.env.GMAIL_FROM_NAME ?? "Webiaprod AI";
  const from = `${fromName} <${fromEmail}>`;

  const subject = body.subject ?? lead.objet_email ?? defaultSubject(lead);
  const emailBody = body.body ?? defaultBody(lead);

  let draft;
  try {
    draft = await createGmailDraft({ to, from, subject, body: emailBody });
  } catch (err) {
    return NextResponse.json(
      { error: "gmail failure", details: (err as Error).message },
      { status: 502 }
    );
  }

  const updated = await updateLead(id, {
    gmail_draft_id: draft.draftId,
    objet_email: subject,
  });

  return NextResponse.json({
    ok: true,
    draft_id: draft.draftId,
    drafts_url: "https://mail.google.com/mail/u/0/#drafts",
    lead: updated,
  });
}

function defaultSubject(lead: Lead): string {
  return `${lead.entreprise}, invisible sur ChatGPT à ${lead.ville}`;
}

function defaultBody(lead: Lead): string {
  const calendly = process.env.CALENDLY_URL ?? "https://calendly.com/jerome-webiaprod";
  const lastName = process.env.JEROME_LAST_NAME ?? "";
  const jname = `Jérôme${lastName ? " " + lastName : ""}`;
  const secteur = lead.secteur || "entreprise";

  const accroche =
    lead.accroche ??
    (lead.note_google != null && lead.nb_avis != null
      ? `Vu vos ${lead.nb_avis} avis ${lead.note_google}★ sur Google, ${lead.entreprise} est clairement bien placé dans le ${secteur} à ${lead.ville}.`
      : `${lead.entreprise} est bien positionné parmi les ${secteur} à ${lead.ville}.`);

  return [
    accroche,
    "",
    `Sauf que sur ChatGPT, quand on demande « meilleur ${secteur} à ${lead.ville} », vous n'apparaissez pas. Vos concurrents non plus. La place est ouverte.`,
    "",
    `On lance notre offre GEO/SEO Local à 99€/mois. Sur les 50 premiers clients, c'est 500€ pour 12 mois + audit GEO offert (valeur 447€). On ne prend que 2-3 ${secteur === "entreprise" ? "entreprises" : `${secteur}s`} par ville.`,
    "",
    `Concrètement : quand un client cherche « ${secteur} ${lead.ville} » sur ChatGPT, votre nom doit ressortir dans les premières suggestions.`,
    "",
    `15 min en visio, je vous montre en direct sur votre cas : ${calendly}`,
    "",
    jname,
    "Chef de projet — Webiaprod AI",
    "Agence IA certifiée RS6776",
    "webiaprod.fr",
  ].join("\n");
}
