/**
 * Fichier    : cours.test.ts
 * Projet     : Kalami Stratégie — le cours
 * Description: Tests des fonctions pures du cours : programme (identifiants stables,
 *              adresses, voisines), correction des exercices (réponses justes, fausses,
 *              mal formées), synthèse de la progression, durée lisible, et cohérence du
 *              contenu rédigé (identifiants d'exercices, bonnes réponses, catégories).
 *              v0.38.0 : examen final, note finale, mentions, numéro et nom du diplôme.
 *              v0.46.0 : suite d'un quiz et module terminé.
 * Auteur     : Claude Marcel
 * Version    : 1.4 (v0.38.0 : examen et diplôme ; v0.38.2 : annotations ; v0.46.0 : suite)
 * Date       : 2026-11-20
 */

import { describe, expect, it } from "vitest";

import { getCourseDictionary } from "@/i18n/course";
import { exercicesDe, type Exercice } from "@/lib/cours/content";
import {
  QUESTIONS_MAX,
  QUESTIONS_MIN,
  corrigerQuiz,
  estReussi,
  quizOuvert,
  reponseModele,
  resultatsQuiz,
  versionPublique,
} from "@/lib/cours/evaluation";
import { CAS_EXAMEN, QUESTIONS_EXAMEN } from "@/lib/cours/examen";
import { HIGHLIGHT_COLORS } from "@/lib/reader/types";
import { contenuLecon, estRedigee } from "@/lib/cours/lecons";
import {
  EXERCICES_NOTES,
  REGLAGES_DEFAUT,
  bilanApprenant,
  etatExamen,
  lireNumero,
  lireReglagesEvaluation,
  mentionDe,
  nomImprime,
  numeroDiplome,
  type TentativeCours,
} from "@/lib/cours/note-finale";
import { quizDe } from "@/lib/cours/quiz";
import {
  LECONS,
  MODULES,
  adresseLecon,
  leconParId,
  moduleTermine,
  suiteDuQuiz,
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

  it("donne la suite d'un quiz : dernière leçon, module suivant ou examen (v0.46.0)", () => {
    const { precedente, suivant } = suiteDuQuiz(MODULES[0]);
    expect(precedente?.id).toBe(MODULES[0].lecons.at(-1)!.id);
    expect(suivant?.module.id).toBe(MODULES[1].id);
    expect(suivant?.lecon.id).toBe(MODULES[1].lecons[0].id);
    expect(suiteDuQuiz(MODULES.at(-1)!).suivant).toBeNull();
  });

  it("tient un module pour terminé : toutes ses leçons et son quiz réussi (v0.46.0)", () => {
    const mod = MODULES[0];
    const toutes = new Set(mod.lecons.map((l) => l.id));
    const moinsUne = new Set(mod.lecons.slice(1).map((l) => l.id));
    expect(moduleTermine(mod, toutes, true)).toBe(true);
    expect(moduleTermine(mod, toutes, false)).toBe(false);
    expect(moduleTermine(mod, moinsUne, true)).toBe(false);
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

// ==================== QUIZ DE MODULE (v0.37.0) ====================

describe("quiz de module", () => {
  it("chaque module a un quiz de 8 à 10 questions valides", () => {
    for (const mod of MODULES) {
      const quiz = quizDe(mod.id);
      expect(quiz, mod.id).not.toBeNull();
      const questions = quiz ?? [];
      expect(questions.length).toBeGreaterThanOrEqual(QUESTIONS_MIN);
      expect(questions.length).toBeLessThanOrEqual(QUESTIONS_MAX);
      const ids = questions.map((q) => q.id);
      expect(new Set(ids).size, mod.id).toBe(ids.length);
      for (const q of questions) {
        if (q.type === "qcm") {
          expect(q.bonne).toBeGreaterThanOrEqual(0);
          expect(q.bonne).toBeLessThan(q.choix.length);
        } else if (q.type === "classement") {
          for (const e of q.elements) {
            expect(e.categorie).toBeGreaterThanOrEqual(0);
            expect(e.categorie).toBeLessThan(q.categories.length);
          }
        } else {
          expect(q.affirmations.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("la version publique ne contient aucune réponse ni explication", () => {
    for (const mod of MODULES) {
      const json = JSON.stringify((quizDe(mod.id) ?? []).map(versionPublique));
      expect(json).not.toMatch(/"(bonne|vrai|categorie|explication)"/);
    }
  });

  it("corrigerQuiz donne 100 avec les réponses modèles et refuse le malformé", () => {
    const quiz = [...(quizDe("m01") ?? [])];
    const parfait = corrigerQuiz(quiz, quiz.map(reponseModele));
    expect(parfait?.score).toBe(100);
    expect(estReussi(parfait?.score ?? null)).toBe(true);
    expect(corrigerQuiz(quiz, "x")).toBeNull();
    expect(corrigerQuiz(quiz, quiz.slice(1).map(reponseModele))).toBeNull();
    expect(corrigerQuiz(quiz, quiz.map(() => null))).toBeNull();
    expect(corrigerQuiz([], [])).toBeNull();
  });

  it("une moitié juste donne 50, sous le seuil", () => {
    const quiz = [...(quizDe("m02") ?? [])].filter((q) => q.type === "qcm").slice(0, 2);
    const q0 = quiz[0];
    const q1 = quiz[1];
    if (q0?.type !== "qcm" || q1?.type !== "qcm") throw new Error("QCM attendus");
    const r = corrigerQuiz(quiz, [
      { type: "qcm", choix: q0.bonne },
      { type: "qcm", choix: (q1.bonne + 1) % q1.choix.length },
    ]);
    expect(r?.score).toBe(50);
    expect(estReussi(r?.score ?? null)).toBe(false);
  });

  it("quizOuvert exige que toutes les leçons du module soient ouvertes", () => {
    const ids = ["m01-l01", "m01-l02"];
    expect(quizOuvert(ids, new Map())).toBe(true);
    const ouvre = { etat: "ouverte" as const, ouvreLe: null, fermeLe: null };
    const apercu = { etat: "apercu" as const, ouvreLe: null, fermeLe: null };
    expect(quizOuvert(ids, new Map([["m01-l01", ouvre], ["m01-l02", ouvre]]))).toBe(true);
    expect(quizOuvert(ids, new Map([["m01-l02", apercu]]))).toBe(false);
  });

  it("resultatsQuiz garde la meilleure note et compte les essais", () => {
    const r = resultatsQuiz([
      { exercise_id: "m01-quiz", score: "62.5" },
      { exercise_id: "m01-quiz", score: 87.5 },
      { exercise_id: "m01-l01-e1", score: 100 },
      { exercise_id: "examen", score: 90 },
    ]);
    expect(r.get("m01")).toEqual({ meilleure: 87.5, essais: 2 });
    expect(r.size).toBe(1);
  });
});

describe("examen final", () => {
  it("compte 20 questions valides, aux identifiants uniques, et un cas", () => {
    expect(QUESTIONS_EXAMEN).toHaveLength(20);
    expect(CAS_EXAMEN.paragraphes.length).toBeGreaterThan(0);
    const ids = QUESTIONS_EXAMEN.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS_EXAMEN) {
      if (q.type === "qcm") {
        expect(q.bonne).toBeGreaterThanOrEqual(0);
        expect(q.bonne).toBeLessThan(q.choix.length);
      } else if (q.type === "classement") {
        for (const e of q.elements) {
          expect(e.categorie).toBeGreaterThanOrEqual(0);
          expect(e.categorie).toBeLessThan(q.categories.length);
        }
      } else {
        expect(q.affirmations.length).toBeGreaterThan(0);
      }
    }
  });

  it("la version publique ne contient aucune réponse", () => {
    const json = JSON.stringify(QUESTIONS_EXAMEN.map(versionPublique));
    expect(json).not.toMatch(/"(bonne|vrai|categorie|explication)"/);
  });

  it("les réponses modèles donnent 100", () => {
    const r = corrigerQuiz(QUESTIONS_EXAMEN, QUESTIONS_EXAMEN.map(reponseModele));
    expect(r?.score).toBe(100);
  });
});

describe("note finale et diplôme", () => {
  /** Tentatives : les 13 quiz à la note donnée, puis d'autres lignes. */
  const quiz = (note: number): TentativeCours[] =>
    MODULES.map((m) => ({ exercise_id: `${m.id}-quiz`, score: note }));

  it("lit les réglages et revient aux valeurs par défaut si incohérents", () => {
    expect(lireReglagesEvaluation(null)).toEqual(REGLAGES_DEFAUT);
    const ok = lireReglagesEvaluation({
      quiz_threshold: 75,
      weight_quizzes: 50,
      weight_exercises: 10,
      weight_exam: 40,
    });
    expect(ok.seuilQuiz).toBe(75);
    expect(ok.poidsQuiz).toBe(50);
    const somme = lireReglagesEvaluation({ weight_quizzes: 90 });
    expect(somme).toEqual(REGLAGES_DEFAUT);
  });

  it("mentionDe applique les seuils 80 et 90", () => {
    expect(mentionDe(79.99, REGLAGES_DEFAUT)).toBe("reussite");
    expect(mentionDe(80, REGLAGES_DEFAUT)).toBe("bien");
    expect(mentionDe(90, REGLAGES_DEFAUT)).toBe("tres_bien");
  });

  it("pondère 40/20/40, exercices non faits à 0", () => {
    const ex = ["a", "b"];
    const b = bilanApprenant(
      [...quiz(80), { exercise_id: "a", score: 100 }, { exercise_id: "examen", score: 90 }],
      REGLAGES_DEFAUT,
      ex,
    );
    expect(b.quiz).toBe(80);
    expect(b.exercices).toBe(50);
    expect(b.examen).toBe(90);
    // 0,4 × 80 + 0,2 × 50 + 0,4 × 90 = 78
    expect(b.finale).toBe(78);
    expect(b.admissible).toBe(true);
    expect(b.mention).toBe("reussite");
  });

  it("exige les 13 quiz et l'examen réussis", () => {
    const unRate = quiz(100).map((t, i) => (i === 0 ? { ...t, score: 60 } : t));
    const b = bilanApprenant([...unRate, { exercise_id: "examen", score: 100 }], REGLAGES_DEFAUT);
    expect(b.tousQuizReussis).toBe(false);
    expect(b.admissible).toBe(false);
    expect(b.mention).toBeNull();
    const c = bilanApprenant([...quiz(100), { exercise_id: "examen", score: 65 }], REGLAGES_DEFAUT);
    expect(c.examenReussi).toBe(false);
    expect(c.admissible).toBe(false);
  });

  it("garde la meilleure note de l'examen et compte les essais", () => {
    const b = bilanApprenant(
      [
        ...quiz(100),
        { exercise_id: "examen", score: 60, created_at: "2026-11-01T10:00:00Z" },
        { exercise_id: "examen", score: 85, created_at: "2026-11-03T10:00:00Z" },
      ],
      REGLAGES_DEFAUT,
    );
    expect(b.examen).toBe(85);
    expect(b.essaisExamen).toBe(2);
    expect(b.dernierExamen).toBe(Date.parse("2026-11-03T10:00:00Z"));
  });

  it("le cours compte des exercices notés", () => {
    expect(EXERCICES_NOTES.length).toBeGreaterThan(0);
    expect(new Set(EXERCICES_NOTES).size).toBe(EXERCICES_NOTES.length);
  });

  it("etatExamen : verrouillé, ouvert, attente de 24 h, épuisé, terminé", () => {
    const t0 = Date.parse("2026-11-10T12:00:00Z");
    const essai = (h: number, score: number): TentativeCours => ({
      exercise_id: "examen",
      score,
      created_at: new Date(t0 + h * 3_600_000).toISOString(),
    });
    expect(etatExamen(bilanApprenant([], REGLAGES_DEFAUT), t0, false).etat).toBe("verrouille");
    const ouvert = bilanApprenant(quiz(100), REGLAGES_DEFAUT);
    expect(etatExamen(ouvert, t0, false)).toEqual({ etat: "ouvert", restants: 3 });
    const un = bilanApprenant([...quiz(100), essai(0, 50)], REGLAGES_DEFAUT);
    expect(etatExamen(un, t0 + 3_600_000, false).etat).toBe("attente");
    expect(etatExamen(un, t0 + 25 * 3_600_000, false)).toEqual({ etat: "ouvert", restants: 2 });
    const trois = bilanApprenant(
      [...quiz(100), essai(0, 50), essai(30, 55), essai(60, 60)],
      REGLAGES_DEFAUT,
    );
    expect(etatExamen(trois, t0 + 100 * 3_600_000, false).etat).toBe("epuise");
    expect(etatExamen(ouvert, t0, true).etat).toBe("termine");
  });

  it("numéro de diplôme : forme stable, relu sans tenir compte de la casse", () => {
    const n = numeroDiplome(2026, new Uint8Array([0, 1, 2, 3, 30, 31, 32, 255]));
    expect(n).toMatch(/^KS-2026-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(lireNumero(` ${n.toLowerCase()} `)).toBe(n);
    expect(lireNumero("KS-2026-OOOO-1111")).toBeNull();
    expect(lireNumero(42)).toBeNull();
  });

  it("nomImprime nettoie les espaces et refuse chiffres et symboles", () => {
    expect(nomImprime("  Aïcha   N'Guessan-Koné ")).toBe("Aïcha N'Guessan-Koné");
    expect(nomImprime("A")).toBeNull();
    expect(nomImprime("Jean 2")).toBeNull();
    expect(nomImprime("<script>")).toBeNull();
    expect(nomImprime("x".repeat(121))).toBeNull();
  });
});

describe("mes annotations", () => {
  it("chaque couleur de surlignage a son libellé", () => {
    const couleurs = getCourseDictionary().annotations.couleurs;
    for (const c of HIGHLIGHT_COLORS) expect(couleurs[c], c).toBeTruthy();
  });
});
