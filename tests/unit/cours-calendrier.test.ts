/**
 * Fichier    : cours-calendrier.test.ts
 * Projet     : Kalami Stratégie — le cours
 * Description: Tests de la diffusion programmée (v0.33.0) : lecture du calendrier, état
 *              des leçons (ouverte, lecture en avance, fermée), dates dans le fuseau de
 *              la cohorte, générateur, et lecture du formulaire d'administration.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-11-20
 */

import { describe, expect, it } from "vitest";

import { lireCalendrierSaisi } from "@/lib/cours/admin-validation";
import {
  ajouterJours,
  dateLisible,
  estJour,
  etatsDiffusion,
  genererCalendrier,
  jourDansFuseau,
  lireCalendrier,
  type Calendrier,
} from "@/lib/cours/calendrier";
import { LECONS, MODULES } from "@/lib/cours/modules";

const MAINTENANT = Date.parse("2026-12-10T12:00:00Z");
const PASSE = "2026-12-01T00:00:00Z";
const FUTUR = "2026-12-20T00:00:00Z";
const ID = "3f2b8a1e-4c5d-4e6f-8a7b-9c0d1e2f3a4b";

/** Calendrier de test, Abidjan, avec lecture en avance au choix. */
function cal(dates: Record<string, string>, lectureAvance = false): Calendrier {
  return { fuseau: "Africa/Abidjan", lectureAvance, dates };
}

describe("lireCalendrier", () => {
  it("renvoie null sans calendrier ou avec un fuseau inconnu", () => {
    expect(lireCalendrier(null)).toBeNull();
    expect(lireCalendrier({ timezone: "Europe/Paris", items: {} })).toBeNull();
  });

  it("garde seulement les dates valides", () => {
    const lu = lireCalendrier({
      timezone: "America/Toronto",
      read_ahead: true,
      items: { m01: PASSE, m02: "pas une date", m03: 12 },
    });
    expect(lu).toEqual({
      fuseau: "America/Toronto",
      lectureAvance: true,
      dates: { m01: PASSE },
    });
  });
});

describe("etatsDiffusion", () => {
  const ids = ["m01-l01", "m01-l02", "m02-l01", "m02-l02"];

  it("ouvre tout sans calendrier", () => {
    const etats = etatsDiffusion(null, MAINTENANT, ids);
    expect([...etats.values()].every((e) => e.etat === "ouverte")).toBe(true);
  });

  it("applique la date du module, remplacée par celle de la leçon", () => {
    const etats = etatsDiffusion(
      cal({ m01: PASSE, m02: FUTUR, "m01-l02": FUTUR, "m02-l01": PASSE }),
      MAINTENANT,
      ids,
    );
    expect(etats.get("m01-l01")?.etat).toBe("ouverte");
    expect(etats.get("m01-l02")?.etat).toBe("fermee");
    expect(etats.get("m02-l01")?.etat).toBe("ouverte");
    expect(etats.get("m02-l02")).toEqual({ etat: "fermee", ouvreLe: FUTUR });
  });

  it("met en aperçu la prochaine leçon seulement avec la lecture en avance", () => {
    const dates = { m02: FUTUR, "m02-l02": "2026-12-15T00:00:00Z" };
    const sans = etatsDiffusion(cal(dates), MAINTENANT, ids);
    expect([...sans.values()].some((e) => e.etat === "apercu")).toBe(false);
    const avec = etatsDiffusion(cal(dates, true), MAINTENANT, ids);
    expect(avec.get("m02-l02")?.etat).toBe("apercu");
    expect(avec.get("m02-l01")?.etat).toBe("fermee");
  });

  it("départage les dates égales par l'ordre du programme et les candidates", () => {
    const c = cal({ m02: FUTUR }, true);
    expect(etatsDiffusion(c, MAINTENANT, ids).get("m02-l01")?.etat).toBe("apercu");
    const etats = etatsDiffusion(c, MAINTENANT, ids, (id) => id !== "m02-l01");
    expect(etats.get("m02-l01")?.etat).toBe("fermee");
    expect(etats.get("m02-l02")?.etat).toBe("apercu");
  });

  it("ouvre une leçon à l'instant exact de sa date", () => {
    const etats = etatsDiffusion(cal({ m01: FUTUR }), Date.parse(FUTUR), ["m01-l01"]);
    expect(etats.get("m01-l01")?.etat).toBe("ouverte");
  });
});

describe("dates et fuseaux", () => {
  it("ramène un instant au jour local de la cohorte", () => {
    // Minuit à Montréal (heure normale de l'Est) = 5 h UTC
    expect(jourDansFuseau("2026-12-01T05:00:00Z", "America/Toronto")).toBe("2026-12-01");
    expect(jourDansFuseau("2026-12-01T05:00:00Z", "Africa/Abidjan")).toBe("2026-12-01");
    expect(jourDansFuseau("2026-12-01T03:00:00Z", "America/Toronto")).toBe("2026-11-30");
  });

  it("écrit une date lisible en français", () => {
    expect(dateLisible("2026-12-03T00:00:00Z", "Africa/Abidjan")).toBe("3 décembre 2026");
  });

  it("refuse les dates impossibles et additionne les jours", () => {
    expect(estJour("2026-02-30")).toBe(false);
    expect(estJour("2026-2-3")).toBe(false);
    expect(estJour("2028-02-29")).toBe(true);
    expect(ajouterJours("2026-12-29", 7)).toBe("2027-01-05");
  });
});

describe("genererCalendrier", () => {
  it("propose une date par module selon le rythme", () => {
    const g = genererCalendrier("2026-12-01", 7, "module");
    expect(Object.keys(g ?? {})).toEqual(MODULES.map((m) => m.id));
    expect(g?.[MODULES[1].id]).toBe("2026-12-08");
  });

  it("propose une date par leçon", () => {
    const g = genererCalendrier("2026-12-01", 2, "lecon");
    expect(Object.keys(g ?? {})).toHaveLength(LECONS.length);
    expect(g?.[LECONS[2].id]).toBe("2026-12-05");
  });

  it("refuse une saisie invalide", () => {
    expect(genererCalendrier("", 7, "module")).toBeNull();
    expect(genererCalendrier("2026-12-01", 0, "module")).toBeNull();
    expect(genererCalendrier("2026-12-01", 61, "module")).toBeNull();
    expect(genererCalendrier("2026-12-01", 1.5, "module")).toBeNull();
  });
});

describe("lireCalendrierSaisi", () => {
  /** Formulaire de test. */
  function formulaire(champs: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(champs)) fd.set(k, v);
    return fd;
  }

  it("lit les réglages et ignore les dates vides", () => {
    const lu = lireCalendrierSaisi(
      formulaire({
        id: ID,
        enabled: "on",
        timezone: "America/Toronto",
        "date:m01": "2026-12-01",
        "date:m01-l02": "",
      }),
    );
    expect(lu).toEqual({
      ok: true,
      valeur: {
        p_cohort_id: ID,
        p_enabled: true,
        p_read_ahead: false,
        p_timezone: "America/Toronto",
        p_items: { m01: "2026-12-01" },
      },
    });
  });

  it("refuse cohorte, fuseau, élément ou date invalides", () => {
    const base = { id: ID, timezone: "Africa/Abidjan" };
    const erreur = (champs: Record<string, string>) => {
      const lu = lireCalendrierSaisi(formulaire(champs));
      return lu.ok ? null : lu.erreur;
    };
    expect(erreur({ ...base, id: "x" })).toBe("cohort_not_found");
    expect(erreur({ ...base, timezone: "UTC" })).toBe("invalid_timezone");
    expect(erreur({ ...base, "date:m99": "2026-12-01" })).toBe("invalid_schedule");
    expect(erreur({ ...base, "date:m01": "2026-02-30" })).toBe("invalid_schedule");
  });
});
