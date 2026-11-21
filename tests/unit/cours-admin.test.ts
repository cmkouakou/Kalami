/**
 * Fichier    : cours-admin.test.ts
 * Projet     : Kalami Stratégie — le cours
 * Description: Tests des fonctions pures de l'administration du cours (v0.29.0) :
 *              lecture d'une liste de courriels collée, synthèse et tri du suivi,
 *              fiche par module, export CSV (protection contre les formules),
 *              validation des formulaires (prix, cohorte, accès) et demande d'achat
 *              du cours.
 * Auteur     : Claude Marcel
 * Version    : 1.1
 * Date       : 2026-11-20
 */

import { describe, expect, it } from "vitest";

import { lireAccord, lireCohorte, lireReglages } from "@/lib/cours/admin-validation";
import { LECONS, MODULES } from "@/lib/cours/modules";
import {
  celluleCsv,
  enrichir,
  exporterCsv,
  ficheParModule,
  lireCourriels,
  lireTri,
  trier,
  type LigneApprenant,
} from "@/lib/cours/suivi";
import { cancelPathFor, parseCheckoutBody } from "@/lib/payments/checkout-request";

// ==================== OUTILS ====================

const UUID = "11111111-2222-4333-8444-555555555555";

/**
 * Formulaire construit à partir d'un objet.
 * @param champs - Paires nom → valeur
 */
function formulaire(champs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [nom, valeur] of Object.entries(champs)) fd.set(nom, valeur);
  return fd;
}

/**
 * Ligne d'apprenant minimale, complétée par les valeurs données.
 * @param valeurs - Champs à remplacer
 */
function ligne(valeurs: Partial<LigneApprenant> = {}): LigneApprenant {
  return {
    access_id: UUID,
    user_id: UUID,
    email: "awa@exemple.ci",
    display_name: null,
    source: "admin_grant",
    cohort_id: null,
    cohort_name: null,
    granted_at: "2026-11-01T10:00:00Z",
    completed: null,
    started: null,
    seconds: null,
    last_seen_at: null,
    average_score: null,
    exercises: null,
    ...valeurs,
  };
}

// ==================== COURRIELS ====================

describe("lireCourriels", () => {
  it("accepte virgules, points-virgules, retours et noms affichés", () => {
    const { valides, invalides } = lireCourriels(
      "Awa Koné <Awa@Exemple.ci>, kofi@x.gh;\nawa@exemple.ci  marie@y.sn",
    );
    expect(valides).toEqual(["awa@exemple.ci", "kofi@x.gh", "marie@y.sn"]);
    expect(invalides).toEqual([]);
  });

  it("signale les adresses mal formées", () => {
    const { valides, invalides } = lireCourriels("bon@x.ci, mauvais@, 1234");
    expect(valides).toEqual(["bon@x.ci"]);
    expect(invalides).toEqual(["mauvais@", "1234"]);
  });
});

// ==================== SUIVI ====================

describe("enrichir et trier", () => {
  it("calcule l'achèvement sur tout le programme et ignore les leçons inconnues", () => {
    const [ap] = enrichir([
      ligne({
        completed: [LECONS[0].id, "lecon-inconnue"],
        started: [LECONS[0].id, LECONS[1].id],
        average_score: "72.5",
      }),
    ]);
    expect(ap.terminees).toBe(1);
    expect(ap.enCours).toBe(1);
    expect(ap.pourcentage).toBe(Math.floor((1 / LECONS.length) * 100));
    expect(ap.moyenne).toBe(72.5);
  });

  it("trie dans les deux sens et laisse les valeurs absentes à la fin", () => {
    const lignes = enrichir([
      ligne({ email: "b@x.ci", average_score: 50 }),
      ligne({ email: "a@x.ci", average_score: null }),
      ligne({ email: "c@x.ci", average_score: 90 }),
    ]);
    expect(trier(lignes, "moyenne", "desc").map((l) => l.email)).toEqual([
      "c@x.ci",
      "b@x.ci",
      "a@x.ci",
    ]);
    expect(trier(lignes, "moyenne", "asc").map((l) => l.email)).toEqual([
      "b@x.ci",
      "c@x.ci",
      "a@x.ci",
    ]);
    expect(trier(lignes, "email", "asc")[0].email).toBe("a@x.ci");
  });

  it("additionne les tentatives aux exercices et aux quiz (v0.45.0)", () => {
    const lignes = enrichir([
      ligne({ email: "a@x.ci", attempts_exercises: 8, attempts_quiz: 4 }),
      ligne({ email: "b@x.ci", attempts_exercises: 20, attempts_quiz: 1 }),
      // Fonction SQL sans les colonnes (migration non appliquée) : total inconnu
      ligne({ email: "c@x.ci" }),
    ]);
    expect(lignes.map((l) => l.tentatives)).toEqual([12, 21, null]);
    expect(trier(lignes, "tentatives", "desc").map((l) => l.email)).toEqual([
      "b@x.ci",
      "a@x.ci",
      "c@x.ci",
    ]);
    expect(lireTri("tentatives", undefined)).toEqual({ cle: "tentatives", sens: "desc" });
  });

  it("lit un tri d'adresse avec des valeurs par défaut sûres", () => {
    expect(lireTri("moyenne", undefined)).toEqual({ cle: "moyenne", sens: "desc" });
    expect(lireTri("n'importe", "asc")).toEqual({ cle: "email", sens: "asc" });
    expect(lireTri(undefined, "bizarre")).toEqual({ cle: "email", sens: "asc" });
  });
});

describe("ficheParModule", () => {
  it("donne l'état, le temps et la meilleure note de chaque leçon", () => {
    const premiere = LECONS[0];
    const seconde = LECONS[1];
    const modules = ficheParModule(
      [
        {
          lesson_id: premiere.id,
          started_at: "2026-11-02T10:00:00Z",
          completed_at: "2026-11-02T11:00:00Z",
          seconds: 600,
        },
        {
          lesson_id: seconde.id,
          started_at: "2026-11-03T10:00:00Z",
          completed_at: null,
          seconds: 120,
        },
      ],
      [
        { exercise_id: `${premiere.id}-e1`, score: 40, created_at: "2026-11-02T10:10:00Z" },
        { exercise_id: `${premiere.id}-e1`, score: "80", created_at: "2026-11-02T10:20:00Z" },
        { exercise_id: `${premiere.id}-e2`, score: 60, created_at: "2026-11-02T10:30:00Z" },
      ],
    );
    expect(modules).toHaveLength(MODULES.length);
    const lecons = modules.flatMap((m) => m.lecons);
    const l1 = lecons.find((l) => l.id === premiere.id);
    const l2 = lecons.find((l) => l.id === seconde.id);
    expect(l1?.etat).toBe("terminee");
    expect(l1?.secondes).toBe(600);
    expect(l1?.notes).toEqual([
      { exercice: `${premiere.id}-e1`, meilleure: 80, essais: 2 },
      { exercice: `${premiere.id}-e2`, meilleure: 60, essais: 1 },
    ]);
    expect(l2?.etat).toBe("enCours");
    expect(lecons.filter((l) => l.etat === "aFaire")).toHaveLength(LECONS.length - 2);
  });
});

// ==================== EXPORT CSV ====================

describe("export CSV", () => {
  it("neutralise les formules et protège les séparateurs", () => {
    expect(celluleCsv("=SOMME(A1)")).toBe(`"'=SOMME(A1)"`);
    expect(celluleCsv("-12")).toBe(`"'-12"`);
    expect(celluleCsv("a;b")).toBe(`"a;b"`);
    expect(celluleCsv('dit "oui"')).toBe(`"dit ""oui"""`);
    expect(celluleCsv(null)).toBe("");
    expect(celluleCsv(42)).toBe("42");
  });

  it("produit un fichier lisible par Excel en français", () => {
    const csv = exporterCsv(
      enrichir([
        ligne({
          average_score: 72.5,
          seconds: 3600,
          source: "purchase",
          attempts_exercises: 8,
          attempts_quiz: 4,
        }),
      ]),
    );
    expect(csv.startsWith("﻿Courriel;")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    const donnees = csv.split("\r\n")[1].split(";");
    expect(donnees[0]).toBe("awa@exemple.ci");
    expect(donnees[3]).toBe("Achat");
    expect(donnees[7]).toBe("60");
    expect(donnees[9]).toBe("72,5");
    expect(donnees.slice(11)).toEqual(["8", "4"]);
  });
});

// ==================== FORMULAIRES ====================

describe("lireReglages", () => {
  it("accepte des prix avec virgule et un livre facultatif", () => {
    const lu = lireReglages(
      formulaire({ on_sale: "on", price_xof: "25 000", price_eur: "39,90", price_cad: "" }),
    );
    expect(lu).toEqual({
      ok: true,
      valeur: {
        p_on_sale: true,
        p_price_xof: 25000,
        p_price_eur: 39.9,
        p_price_cad: null,
        p_book_id: null,
      },
    });
  });

  it("refuse un prix mal formé, une vente sans prix et un livre invalide", () => {
    expect(lireReglages(formulaire({ price_xof: "12,5" }))).toEqual({
      ok: false,
      erreur: "invalid_price",
    });
    expect(lireReglages(formulaire({ on_sale: "on" }))).toEqual({
      ok: false,
      erreur: "price_required",
    });
    expect(lireReglages(formulaire({ book_id: "pas-un-uuid" }))).toEqual({
      ok: false,
      erreur: "book_not_found",
    });
  });
});

describe("lireCohorte", () => {
  it("normalise le pays et accepte des dates facultatives", () => {
    const lu = lireCohorte(
      formulaire({ name: " Abidjan 2027 ", country: "ci", starts_on: "2027-01-10" }),
    );
    expect(lu).toEqual({
      ok: true,
      valeur: {
        p_id: null,
        p_name: "Abidjan 2027",
        p_country: "CI",
        p_starts_on: "2027-01-10",
        p_ends_on: null,
        p_note: null,
      },
    });
  });

  it("refuse un nom vide, un pays invalide et une fin avant le début", () => {
    expect(lireCohorte(formulaire({ name: "" }))).toMatchObject({ erreur: "invalid_name" });
    expect(lireCohorte(formulaire({ name: "A", country: "CIV" }))).toMatchObject({
      erreur: "invalid_country",
    });
    expect(
      lireCohorte(formulaire({ name: "A", starts_on: "2027-02-01", ends_on: "2027-01-01" })),
    ).toMatchObject({ erreur: "invalid_dates" });
  });
});

describe("lireAccord", () => {
  it("transmet les courriels valides et signale les autres", () => {
    const lu = lireAccord(
      formulaire({ emails: "a@x.ci, faux@", cohort_id: UUID, grant_book: "on" }),
    );
    expect(lu).toEqual({
      ok: true,
      valeur: {
        p_emails: ["a@x.ci"],
        p_cohort_id: UUID,
        p_grant_book: true,
        p_note: null,
        invalides: ["faux@"],
      },
    });
  });

  it("refuse une liste vide ou trop longue", () => {
    expect(lireAccord(formulaire({ emails: "rien ici" }))).toMatchObject({
      erreur: "no_emails",
    });
    const trop = Array.from({ length: 201 }, (_, i) => `p${i}@x.ci`).join(",");
    expect(lireAccord(formulaire({ emails: trop }))).toMatchObject({
      erreur: "too_many_emails",
    });
  });
});

// ==================== ACHAT ====================

describe("achat du cours", () => {
  it("accepte une demande d'achat du cours et renvoie vers le cours si annulée", () => {
    const corps = parseCheckoutBody({ item: "course", currency: "XOF" });
    expect(corps).toEqual({ item: "course", currency: "XOF" });
    expect(cancelPathFor({ item: "course" }, null)).toBe("/strategie/cours?paiement=annule");
  });
});
