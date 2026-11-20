/**
 * Fichier    : cours-atelier-ia.test.ts
 * Projet     : Kalami Stratégie — le cours
 * Description: Tests des ateliers corrigés par l'IA (v0.40.0) : présence dans les leçons,
 *              validation de la saisie, nettoyage d'une correction du modèle et relecture
 *              d'une correction enregistrée.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-11-20
 */

import { describe, expect, it } from "vitest";

import {
  ATELIERS,
  MAX_CORRECTIONS,
  MODELE_ATELIER,
  assainirCorrection,
  atelierParId,
  correctionSchema,
  lireCorrection,
  validerSaisie,
  type CorrectionBrute,
} from "@/lib/cours/atelier-ia";
import { atelierPresent } from "@/lib/cours/content";
import { contenuLecon } from "@/lib/cours/lecons";

const atelier = ATELIERS["m01-l02-a1"];

/** Saisie complète et valide. */
const saisieValide = () => ({
  decision: "Ouvrir une deuxième boutique à Bouaké l'an prochain.",
  horizon: "Plusieurs années : bail de cinq ans et clientèle à construire.",
  reversibilite: "Difficile : bail, aménagement et embauches seraient perdus.",
  ampleur: "Environ la moitié de nos économies et deux employés à former.",
  position: "Oui : nous servirons une nouvelle ville et de nouveaux clients.",
  famille: "strategique",
});

describe("ateliers corrigés par l'IA", () => {
  it("règle : 5 corrections, Claude Haiku 5.5", () => {
    expect(MAX_CORRECTIONS).toBe(5);
    expect(MODELE_ATELIER).toBe("claude-haiku-5-5");
  });

  it("chaque atelier a un identifiant stable et figure dans sa leçon", () => {
    for (const [cle, a] of Object.entries(ATELIERS)) {
      expect(a.id).toBe(cle);
      expect(cle).toMatch(/^m[0-9]{2}-l[0-9]{2}-a[0-9]{1,2}$/);
      const lecon = cle.slice(0, 7);
      expect(atelierPresent(contenuLecon(lecon) ?? [], cle.slice(8))).toBe(true);
    }
  });

  it("refuse un atelier inconnu ou une clé héritée", () => {
    expect(atelierParId("m99-l99-a1")).toBeNull();
    expect(atelierParId("toString")).toBeNull();
    expect(atelierParId(42)).toBeNull();
    expect(atelierParId("m01-l02-a1")).toBe(atelier);
  });

  it("accepte une saisie complète et retire les espaces", () => {
    const brut = { ...saisieValide(), decision: "  Ouvrir une deuxième boutique.  " };
    const propre = validerSaisie(atelier, brut);
    expect(propre?.decision).toBe("Ouvrir une deuxième boutique.");
    expect(propre?.famille).toBe("strategique");
  });

  it("refuse un champ manquant, trop court, trop long ou un choix inconnu", () => {
    const sansHorizon: Record<string, string> = saisieValide();
    delete sansHorizon.horizon;
    expect(validerSaisie(atelier, sansHorizon)).toBeNull();
    expect(validerSaisie(atelier, { ...saisieValide(), horizon: "Court" })).toBeNull();
    expect(validerSaisie(atelier, { ...saisieValide(), ampleur: "x".repeat(601) })).toBeNull();
    expect(validerSaisie(atelier, { ...saisieValide(), famille: "autre" })).toBeNull();
    expect(validerSaisie(atelier, null)).toBeNull();
    expect(validerSaisie(atelier, ["a"])).toBeNull();
  });

  it("ignore les champs en trop", () => {
    const propre = validerSaisie(atelier, { ...saisieValide(), pirate: "x" });
    expect(propre && "pirate" in propre).toBe(false);
  });

  it("nettoie la correction : champs inconnus écartés, textes bornés", () => {
    const brut: CorrectionBrute = correctionSchema.parse({
      verdict: "partiel",
      resume: `  ${"r".repeat(2000)}  `,
      famille_attendue: "strategique",
      points: [
        { champ: "horizon", statut: "juste", explication: "Bien vu." },
        { champ: "inconnu", statut: "a-revoir", explication: "Écarté." },
        { champ: "ampleur", statut: "a-revoir", explication: "   " },
      ],
      conseil: "Chiffrez l'ampleur.",
    });
    const c = assainirCorrection(atelier, brut);
    expect(c.resume.length).toBe(1200);
    expect(c.points).toEqual([{ champ: "horizon", statut: "juste", explication: "Bien vu." }]);
    expect(c.familleAttendue).toBe("strategique");
  });

  it("relit une correction enregistrée et rejette une forme inattendue", () => {
    const enregistree = {
      verdict: "valide",
      resume: "Bon raisonnement.",
      familleAttendue: "strategique",
      points: [{ champ: "horizon", statut: "juste", explication: "Oui." }, { champ: 3 }],
      conseil: "",
    };
    expect(lireCorrection(enregistree)?.points).toHaveLength(1);
    expect(lireCorrection({ verdict: "bravo", resume: "x", points: [] })).toBeNull();
    expect(lireCorrection(null)).toBeNull();
  });
});
