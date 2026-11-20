/**
 * =============================================================
 *  Fichier    : cours-dates-individuelles.test.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Tests des dates individuelles (v0.42.0) : lecture du calendrier avec les
 *               dates de l'apprenant, priorité sur la cohorte, état « expirée », lecture
 *               en avance, formulaires d'administration, filtres de la liste des inscrits.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: vitest, lib/cours/calendrier.ts, lib/cours/admin-validation.ts,
 *               lib/cours/liste-apprenants.ts
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import {
  lireDiffusionSaisie,
  lireRetraitDiffusion,
} from "@/lib/cours/admin-validation";
import {
  dateFermeture,
  dateOuverture,
  estVerrouillee,
  etatsDiffusion,
  lireCalendrier,
  veille,
  type Calendrier,
} from "@/lib/cours/calendrier";
import {
  filtrerInscrits,
  normaliser,
  numerosElement,
  SANS_COHORTE,
  TOUTES,
  type LigneInscrit,
} from "@/lib/cours/liste-apprenants";

// ==================== DONNÉES DE TEST ====================

const MAINTENANT = Date.parse("2026-12-10T12:00:00Z");
const PASSE = "2026-12-01T00:00:00Z";
const FUTUR = "2026-12-20T00:00:00Z";
const U1 = "3f2b8a1e-4c5d-4e6f-8a7b-9c0d1e2f3a4b";
const U2 = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const COHORTE = "11111111-2222-4333-8444-555555555555";

/** Calendrier de test, Abidjan. */
function cal(
  dates: Record<string, string>,
  perso: Calendrier["perso"],
  lectureAvance = false,
): Calendrier {
  return { fuseau: "Africa/Abidjan", lectureAvance, dates, perso };
}

/** Formulaire construit à partir de paires (les champs répétés sont permis). */
function form(champs: [string, string][]): FormData {
  const fd = new FormData();
  for (const [nom, valeur] of champs) fd.append(nom, valeur);
  return fd;
}

// ==================== CALENDRIER ====================

describe("lireCalendrier avec dates individuelles", () => {
  it("lit les dates de l'apprenant et écarte celles qui sont invalides", () => {
    const lu = lireCalendrier({
      timezone: "Africa/Abidjan",
      read_ahead: false,
      items: {},
      personal: {
        m01: { opens: PASSE, closes: FUTUR },
        "m02-l01": { opens: null, closes: "n'importe quoi" },
        m03: "pas un objet",
      },
    });
    expect(lu?.perso).toEqual({ m01: { ouvre: PASSE, ferme: FUTUR } });
  });

  it("garde un calendrier vide de perso si le champ manque", () => {
    expect(lireCalendrier({ timezone: "Africa/Abidjan", items: {} })?.perso).toEqual({});
  });
});

describe("priorité des dates", () => {
  it("leçon de l'apprenant, module de l'apprenant, puis cohorte", () => {
    const c = cal(
      { m01: PASSE, "m01-l02": PASSE },
      { m01: { ouvre: FUTUR, ferme: null }, "m01-l03": { ouvre: PASSE, ferme: null } },
    );
    expect(dateOuverture(c, "m01-l01")).toBe(FUTUR);
    expect(dateOuverture(c, "m01-l02")).toBe(FUTUR);
    expect(dateOuverture(c, "m01-l03")).toBe(PASSE);
  });

  it("la fermeture ne vient que des dates individuelles", () => {
    const c = cal({ m01: PASSE }, { m01: { ouvre: null, ferme: FUTUR } });
    expect(dateOuverture(c, "m01-l01")).toBe(PASSE);
    expect(dateFermeture(c, "m01-l01")).toBe(FUTUR);
    expect(dateFermeture(c, "m02-l01")).toBeNull();
  });
});

describe("état « expirée »", () => {
  const ids = ["m01-l01", "m01-l02", "m02-l01"];

  it("ferme une leçon une fois la date de fermeture passée", () => {
    const etats = etatsDiffusion(
      cal({}, { m01: { ouvre: null, ferme: PASSE }, "m02-l01": { ouvre: null, ferme: FUTUR } }),
      MAINTENANT,
      ids,
    );
    expect(etats.get("m01-l01")).toEqual({ etat: "expiree", ouvreLe: null, fermeLe: PASSE });
    expect(etats.get("m02-l01")?.etat).toBe("ouverte");
    expect(estVerrouillee(etats.get("m01-l02"))).toBe(true);
    expect(estVerrouillee(etats.get("m02-l01"))).toBe(false);
  });

  it("une leçon expirée n'est jamais lue en avance", () => {
    const etats = etatsDiffusion(
      cal(
        { m02: FUTUR },
        { "m01-l02": { ouvre: "2026-12-15T00:00:00Z", ferme: "2026-12-16T00:00:00Z" } },
        true,
      ),
      Date.parse("2026-12-17T00:00:00Z"),
      ids,
    );
    expect(etats.get("m01-l02")?.etat).toBe("expiree");
    expect(etats.get("m02-l01")?.etat).toBe("apercu");
  });

  it("veille recule d'un instant (dernier jour ouvert)", () => {
    expect(veille("2026-12-15T00:00:00.000Z")).toBe("2026-12-14T23:59:59.000Z");
  });
});

// ==================== FORMULAIRES D'ADMINISTRATION ====================

describe("lireDiffusionSaisie", () => {
  const base: [string, string][] = [
    ["user", U1],
    ["user", U2],
    ["user", U1],
    ["item", "m01"],
    ["item", "m02-l01"],
    ["timezone", "America/Toronto"],
  ];

  it("lit les apprenants (sans doublon), les éléments et les dates", () => {
    const lu = lireDiffusionSaisie(
      form([...base, ["opens", "2026-12-01"], ["closes", "2027-01-15"]]),
    );
    expect(lu).toEqual({
      ok: true,
      valeur: {
        p_user_ids: [U1, U2],
        p_items: ["m01", "m02-l01"],
        p_opens: "2026-12-01",
        p_closes: "2027-01-15",
        p_timezone: "America/Toronto",
      },
    });
  });

  it("accepte une seule des deux dates", () => {
    const lu = lireDiffusionSaisie(form([...base, ["opens", ""], ["closes", "2027-01-15"]]));
    expect(lu.ok && lu.valeur.p_opens).toBeNull();
  });

  it("refuse les saisies incomplètes ou incohérentes", () => {
    const erreur = (champs: [string, string][]) => {
      const lu = lireDiffusionSaisie(form(champs));
      return lu.ok ? null : lu.erreur;
    };
    expect(erreur(base.filter(([n]) => n !== "user"))).toBe("no_learners");
    expect(erreur([...base, ["user", "pas-un-uuid"], ["opens", "2026-12-01"]])).toBe(
      "no_learners",
    );
    expect(erreur(base.filter(([n]) => n !== "item"))).toBe("no_items");
    expect(erreur([...base, ["item", "m99"], ["opens", "2026-12-01"]])).toBe("no_items");
    expect(erreur(base)).toBe("no_dates");
    expect(erreur([...base, ["opens", "2026-02-30"]])).toBe("invalid_schedule");
    expect(erreur([...base, ["opens", "2026-12-10"], ["closes", "2026-12-10"]])).toBe(
      "invalid_window",
    );
  });
});

describe("lireRetraitDiffusion", () => {
  it("sans élément coché : toutes les dates des apprenants", () => {
    expect(lireRetraitDiffusion(form([["user", U1]]))).toEqual({
      ok: true,
      valeur: { p_user_ids: [U1], p_items: null },
    });
  });

  it("avec éléments cochés : ceux-là seulement", () => {
    const lu = lireRetraitDiffusion(form([["user", U1], ["item", "m03"]]));
    expect(lu.ok && lu.valeur.p_items).toEqual(["m03"]);
  });
});

// ==================== LISTE DES INSCRITS ====================

describe("filtrerInscrits", () => {
  const ligne = (p: Partial<LigneInscrit>): LigneInscrit => ({
    accessId: "a",
    userId: U1,
    email: null,
    nom: null,
    source: "purchase",
    depuis: "1 déc. 2026",
    cohorteId: null,
    cohorteNom: null,
    ...p,
  });
  const lignes = [
    ligne({ accessId: "1", email: "awa.kone@exemple.ci", nom: "Awa Koné", cohorteId: COHORTE }),
    ligne({ accessId: "2", email: "jean@exemple.ca", nom: "Jean Tremblay", source: "admin_grant" }),
    ligne({ accessId: "3", email: "kone.ibrahim@exemple.ci", nom: null }),
  ];
  const ids = (r: LigneInscrit[]) => r.map((l) => l.accessId);

  it("cherche sans accents ni majuscules, sur le courriel et le nom", () => {
    expect(ids(filtrerInscrits(lignes, { recherche: "KONÉ", cohorte: TOUTES, origine: "" })))
      .toEqual(["1", "3"]);
    expect(ids(filtrerInscrits(lignes, { recherche: "awa kone", cohorte: TOUTES, origine: "" })))
      .toEqual(["1"]);
    expect(normaliser("  Élodie ")).toBe("elodie");
  });

  it("filtre par cohorte, sans cohorte et origine", () => {
    expect(ids(filtrerInscrits(lignes, { recherche: "", cohorte: COHORTE, origine: "" })))
      .toEqual(["1"]);
    expect(ids(filtrerInscrits(lignes, { recherche: "", cohorte: SANS_COHORTE, origine: "" })))
      .toEqual(["2", "3"]);
    expect(
      ids(filtrerInscrits(lignes, { recherche: "", cohorte: TOUTES, origine: "admin_grant" })),
    ).toEqual(["2"]);
  });

  it("numerosElement lit les modules et les leçons", () => {
    expect(numerosElement("m05")).toEqual({ m: 5, l: null });
    expect(numerosElement("m05-l02")).toEqual({ m: 5, l: 2 });
    expect(numerosElement("x")).toBeNull();
  });
});
