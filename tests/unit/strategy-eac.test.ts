/**
 * =============================================================
 *  Fichier    : strategy-eac.test.ts
 *  Projet     : Kalami Stratégie
 *  Description: Tests de la liaison Entrepreneur au Combat (v0.26.0) : validation du
 *               dossier reçu, conversion en profil, relecture du contexte, réglages et
 *               texte transmis au coach.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-17
 *  Dépendances: vitest, lib/strategy/eac.ts
 * =============================================================
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_COACH_BUDGET_USD,
  eacContextLines,
  eacDeleteStudySchema,
  eacOpenStudySchema,
  eacReturnSettings,
  eacSettings,
  isContextEmpty,
  profileFromEac,
  readEacContext,
  splitList,
} from "@/lib/strategy/eac";

// ==================== DONNÉES DE TEST ====================

const DOSSIER_ID = "3f1c2b8e-7a4d-4c1e-9b2a-5d6e7f8a9b0c";
const OWNER_ID = "0b6c1f2e-3d4a-4b5c-8d9e-1f2a3b4c5d6e";
const SECRET = "a".repeat(32);

/** Corps minimal valide, modifiable par test. */
function body(overrides: Record<string, unknown> = {}) {
  return {
    dossierId: DOSSIER_ID,
    dossierNumero: "EAC-2026-0012",
    companyName: "Boulangerie Kalis",
    strategicQuestion: "Faut-il ouvrir une deuxième boutique ?",
    company: { secteur: "Commerce", domaine: "Boulangerie", pays: "Côte d'Ivoire" },
    context: { besoin: "Croître", comprehension: "", etapes: {} },
    members: [{ email: "mentor@example.com" }],
    ...overrides,
  };
}

// ==================== SCHÉMA ====================

describe("eacOpenStudySchema", () => {
  it("accepte un dossier minimal et complète les valeurs par défaut", () => {
    const parsed = eacOpenStudySchema.parse(body());
    expect(parsed.company.anneeCreation).toBeNull();
    expect(parsed.company.canauxVente).toEqual([]);
    expect(parsed.context.etapes.agir).toBe("");
  });

  it("refuse un identifiant de dossier invalide ou un nom vide", () => {
    expect(eacOpenStudySchema.safeParse(body({ dossierId: "12" })).success).toBe(false);
    expect(eacOpenStudySchema.safeParse(body({ companyName: "  " })).success).toBe(false);
  });

  it("refuse un courriel invalide et plus de 10 membres", () => {
    expect(eacOpenStudySchema.safeParse(body({ members: [{ email: "x" }] })).success).toBe(false);
    const many = Array.from({ length: 11 }, (_, i) => ({ email: `p${i}@example.com` }));
    expect(eacOpenStudySchema.safeParse(body({ members: many })).success).toBe(false);
  });
});

describe("eacDeleteStudySchema (v0.27.0)", () => {
  it("accepte un identifiant de dossier et refuse le reste", () => {
    expect(eacDeleteStudySchema.safeParse({ dossierId: DOSSIER_ID }).success).toBe(true);
    expect(eacDeleteStudySchema.safeParse({ dossierId: "12" }).success).toBe(false);
    expect(eacDeleteStudySchema.safeParse({}).success).toBe(false);
  });
});

// ==================== CONVERSION ====================

describe("splitList", () => {
  it("découpe, nettoie et retire les doublons sans tenir compte de la casse", () => {
    expect(splitList("Kalis, Dabo ;\n kalis ; ;Sika")).toEqual(["Kalis", "Dabo", "Sika"]);
    expect(splitList("")).toEqual([]);
  });
});

describe("profileFromEac", () => {
  it("convertit les informations de l'entreprise en profil Kalami", () => {
    const { company } = eacOpenStudySchema.parse(body({
      company: {
        secteur: "Commerce",
        domaine: "Boulangerie",
        pays: "Côte d'Ivoire",
        ville: "Abidjan, Bouaké",
        anneeCreation: 2015,
        trancheCa: "10 à 50 M FCFA",
        canauxVente: ["Boutique", "Livraison"],
        concurrents: "Dabo; Sika",
      },
    }));
    const profile = profileFromEac(company);
    expect(profile.sector).toBe("Commerce — Boulangerie");
    expect(profile.foundedYear).toBe(2015);
    expect(profile.countries).toEqual(["Côte d'Ivoire"]);
    expect(profile.cities).toEqual(["Abidjan", "Bouaké"]);
    expect(profile.markets).toEqual(["Boutique", "Livraison"]);
    expect(profile.competitors).toEqual(["Dabo", "Sika"]);
    expect(profile.revenueRange).toBe("10 à 50 M FCFA");
  });

  it("ignore une année de création future", () => {
    const { company } = eacOpenStudySchema.parse(body({
      company: { anneeCreation: new Date().getFullYear() + 1 },
    }));
    expect(profileFromEac(company).foundedYear).toBeNull();
  });
});

// ==================== CONTEXTE ====================

describe("contexte du dossier", () => {
  it("relit un contexte enregistré, refuse un contenu illisible", () => {
    expect(readEacContext({ besoin: "Croître" })?.besoin).toBe("Croître");
    expect(readEacContext("texte")).toBeNull();
    expect(readEacContext(null)).toBeNull();
  });

  it("détecte un contexte vide", () => {
    expect(isContextEmpty(readEacContext({})!)).toBe(true);
    expect(isContextEmpty(readEacContext({ etapes: { agir: "Plan" } })!)).toBe(false);
  });

  it("met en texte pour le coach seulement les sections remplies", () => {
    const text = eacContextLines(readEacContext({
      besoin: "Croître",
      etapes: { decider: "Option B retenue" },
    })!);
    expect(text).toContain("Besoin exprimé par l'entrepreneur :\nCroître");
    expect(text).toContain("Notes de l'équipe — Décider :\nOption B retenue");
    expect(text).not.toContain("Compréhension");
    expect(eacContextLines(readEacContext({})!)).toBe("");
  });
});

// ==================== RÉGLAGES ====================

describe("eacSettings", () => {
  it("désactive la liaison sans clé assez longue ou sans compte valide", () => {
    expect(eacSettings({})).toBeNull();
    expect(eacSettings({ EAC_API_SECRET: "court", EAC_OWNER_ID: OWNER_ID })).toBeNull();
    expect(eacSettings({ EAC_API_SECRET: SECRET, EAC_OWNER_ID: "x" })).toBeNull();
  });

  it("lit le budget du coach, avec repli sur la valeur par défaut", () => {
    const base = { EAC_API_SECRET: SECRET, EAC_OWNER_ID: OWNER_ID };
    expect(eacSettings(base)?.coachBudgetUsd).toBe(DEFAULT_COACH_BUDGET_USD);
    expect(eacSettings({ ...base, EAC_COACH_BUDGET_USD: "12.5" })?.coachBudgetUsd).toBe(12.5);
    expect(eacSettings({ ...base, EAC_COACH_BUDGET_USD: "5000" })?.coachBudgetUsd)
      .toBe(DEFAULT_COACH_BUDGET_USD);
    expect(eacSettings({ ...base, EAC_COACH_BUDGET_USD: "abc" })?.coachBudgetUsd)
      .toBe(DEFAULT_COACH_BUDGET_USD);
  });
});

describe("eacReturnSettings (v0.26.1)", () => {
  it("masque l'envoi sans adresse, sans clé ou avec une adresse invalide", () => {
    expect(eacReturnSettings({})).toBeNull();
    expect(eacReturnSettings({ EAC_API_SECRET: SECRET })).toBeNull();
    expect(eacReturnSettings({ EAC_API_URL: "https://eac.test" })).toBeNull();
    expect(eacReturnSettings({ EAC_API_SECRET: SECRET, EAC_API_URL: "pas une url" })).toBeNull();
    expect(eacReturnSettings({ EAC_API_SECRET: SECRET, EAC_API_URL: "http://eac.test" }))
      .toBeNull();
  });

  it("construit l'adresse de réception à partir de l'origine", () => {
    const settings = eacReturnSettings({
      EAC_API_SECRET: SECRET,
      EAC_API_URL: " https://entrepreneuraucombat.com/ ",
    });
    expect(settings).toEqual({
      endpoint: "https://entrepreneuraucombat.com/api/kalami/strategie",
      secret: SECRET,
    });
  });

  it("accepte http en local pour les essais", () => {
    const settings = eacReturnSettings({
      EAC_API_SECRET: SECRET,
      EAC_API_URL: "http://localhost:3001",
    });
    expect(settings?.endpoint).toBe("http://localhost:3001/api/kalami/strategie");
  });
});
