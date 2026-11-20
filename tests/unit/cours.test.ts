/**
 * Fichier    : cours.test.ts
 * Projet     : Kalami Stratégie — le cours
 * Description: Tests des fonctions pures du cours : programme (identifiants stables,
 *              adresses, voisines), correction des exercices (réponses justes, fausses,
 *              mal formées), synthèse de la progression, durée lisible, et cohérence du
 *              contenu rédigé (identifiants d'exercices, bonnes réponses, catégories).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-11-19
 */

import { describe, expect, it } from "vitest";

import { exercicesDe, type Exercice } from "@/lib/cours/content";
import { contenuLecon, estRedigee } from "@/lib/cours/lecons";
import {
  LECONS,
  MODULES,
  adresseLecon,
  leconParId,
  trouverLecon,
  voisines,
} from "@/lib/cours/modules";
import {
  corriger,
  dureeLisible,
  synthese,
  type Reponse,
} from "@/lib/cours/notation";

// ==================== PROGRAMME ====================

describe("programme du cours", () => {
  it("compte 13 modules et 52 leçons aux identifiants uniques", () => {
    expect(MODULES).toHaveLength(13);
    expect(LECONS).toHaveLength(52);
    expect(new Set(LECONS.map((l) => l.id)).size).toBe(52);
  });

  it("respecte le format des identifiants accepté par la base", () => {
    for (const l of LECONS) expect(l.id).toMatch(/^m\d{2}-l\d{2}$/);
  });

  it("retrouve une leçon par son adresse et par son identifiant", () => {
    const trouve = trouverLecon("m1", "l1");
    expect(trouve?.lecon.id).toBe("m01-l01");
    expect(leconParId("m01-l01")?.module.slug).toBe("m1");
    expect(adresseLecon(trouve!.module, trouve!.lecon)).toBe(
      "/strategie/cours/m1/l1",
    );
    expect(trouverLecon("m99", "l1")).toBeNull();
    expect(leconParId("inconnue")).toBeNull();
  });

  it("donne les leçons voisines, y compris d'un module à l'autre", () => {
    expect(voisines("m01-l01").avant).toBeNull();
    const fin = MODULES[0].lecons.at(-1)!;
    expect(voisines(fin.id).apres?.id).toBe(MODULES[1].lecons[0].id);
    expect(voisines(LECONS.at(-1)!.id).apres).toBeNull();
  });
});

// ==================== CORRECTION ====================

const QCM: Exercice = {
  type: "qcm",
  id: "e1",
  question: "?",
  choix: [
    { texte: "a", explication: "" },
    { texte: "b", explication: "" },
  ],
  bonne: 1,
};

const VF: Exercice = {
  type: "vrai-faux",
  id: "e2",
  consigne: "?",
  affirmations: [
    { texte: "a", vrai: true, explication: "" },
    { texte: "b", vrai: false, explication: "" },
    { texte: "c", vrai: true, explication: "" },
  ],
};

const CLASSEMENT: Exercice = {
  type: "classement",
  id: "e3",
  consigne: "?",
  categories: ["X", "Y"],
  elements: [
    { texte: "a", categorie: 0 },
    { texte: "b", categorie: 1 },
  ],
};

describe("corriger", () => {
  it("note un QCM", () => {
    expect(corriger(QCM, { type: "qcm", choix: 1 })).toEqual({
      score: 100,
      justes: [true],
    });
    expect(corriger(QCM, { type: "qcm", choix: 0 })).toEqual({
      score: 0,
      justes: [false],
    });
  });

  it("note un vrai ou faux partie par partie", () => {
    const r = corriger(VF, { type: "vrai-faux", valeurs: [true, true, true] });
    expect(r).toEqual({ score: 66.67, justes: [true, false, true] });
  });

  it("note un classement", () => {
    const r = corriger(CLASSEMENT, { type: "classement", categories: [0, 0] });
    expect(r).toEqual({ score: 50, justes: [true, false] });
  });

  it("refuse une réponse mal formée ou d'un autre type", () => {
    const mauvaises: [Exercice, unknown][] = [
      [QCM, { type: "vrai-faux", valeurs: [true] }],
      [QCM, { type: "qcm", choix: 5 }],
      [QCM, { type: "qcm", choix: 0.5 }],
      [VF, { type: "vrai-faux", valeurs: [true] }],
      [VF, { type: "vrai-faux", valeurs: [true, "non", false] }],
      [CLASSEMENT, { type: "classement", categories: [0, 2] }],
      [CLASSEMENT, { type: "classement", categories: "0,1" }],
    ];
    for (const [ex, reponse] of mauvaises)
      expect(corriger(ex, reponse as Reponse)).toBeNull();
  });
});

// ==================== PROGRESSION ====================

describe("synthese", () => {
  it("compte les leçons terminées, en cours, le temps et le pourcentage", () => {
    const s = synthese(
      [
        {
          lesson_id: "m01-l01",
          completed_at: "2026-11-19T10:00:00Z",
          seconds: 900,
        },
        { lesson_id: "m01-l02", completed_at: null, seconds: 300 },
        {
          lesson_id: "retiree",
          completed_at: "2026-11-19T10:00:00Z",
          seconds: 5000,
        },
      ],
      4,
    );
    expect(s).toEqual({
      terminees: 1,
      enCours: 1,
      total: 4,
      pourcentage: 25,
      secondes: 1200,
    });
  });

  it("arrondit le pourcentage vers le bas (100 % seulement si tout est fini)", () => {
    const lignes = LECONS.slice(0, 51).map((l) => ({
      lesson_id: l.id,
      completed_at: "2026-11-19T10:00:00Z",
      seconds: 0,
    }));
    expect(synthese(lignes).pourcentage).toBe(98);
  });
});

describe("dureeLisible", () => {
  it("affiche des minutes, puis des heures", () => {
    expect(dureeLisible(0)).toBe("0 min");
    expect(dureeLisible(45 * 60 + 30)).toBe("45 min");
    expect(dureeLisible(2 * 3600 + 5 * 60)).toBe("2 h 05");
  });
});

// ==================== CONTENU RÉDIGÉ ====================

describe("leçons rédigées", () => {
  const redigees = LECONS.filter((l) => estRedigee(l.id));

  it("comprend au moins la leçon pilote", () => {
    expect(redigees.map((l) => l.id)).toContain("m01-l01");
  });

  it.each(redigees.map((l) => l.id))("%s : exercices cohérents", (id) => {
    const exercices = exercicesDe(contenuLecon(id)!);
    const ids = exercices.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of exercices) {
      // Même format que la contrainte de course_attempts (« m01-l01-e1 »)
      expect(`${id}-${e.id}`).toMatch(/^m\d{2}-l\d{2}-e\d{1,2}$/);
      if (e.type === "qcm") expect(e.bonne).toBeLessThan(e.choix.length);
      if (e.type === "classement") {
        for (const el of e.elements)
          expect(el.categorie).toBeLessThan(e.categories.length);
      }
    }
  });
});
