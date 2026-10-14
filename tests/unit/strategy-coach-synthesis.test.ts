/**
 * Fichier    : strategy-coach-synthesis.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du préremplissage de la synthèse par le coach (S6b) : nettoyage des
 *              propositions (origine vérifiée, refs invalides ou en double, liens limités),
 *              relecture d'un résultat enregistré, identifiants connus, doublons décochés,
 *              application sans remplacement (plafonds, enjeu vide rempli, liens convertis,
 *              mention « à vérifier ») et message envoyé (bloc des étapes, disponibilité).
 * Auteur     : Claude Marcel
 * Date       : 2026-10-14
 */

import { describe, expect, it } from "vitest";

import {
  buildCoachMessage,
  escapeTags,
  isFunctionAvailable,
} from "@/lib/strategy/coach/context";
import {
  readSynthesize,
  sanitizeSynthesize,
  type Synthesize,
  type SynthesizeKnown,
  type SynthesizeOutput,
} from "@/lib/strategy/coach/schemas";
import { readProfileData } from "@/lib/strategy/profile";
import {
  applyProposals,
  defaultSelection,
  duplicateIndexes,
  indexProposals,
  knownIds,
  type ProposalSources,
} from "@/lib/strategy/synthesis-proposals";
import { emptyInternal, newActivity, newResource } from "@/lib/strategy/templates/internal";
import { emptyPestel, newFactor } from "@/lib/strategy/templates/pestel";
import { emptyStakeholders, newStakeholder } from "@/lib/strategy/templates/stakeholders";
import {
  emptySynthesis,
  newIssue,
  newSwotItem,
  SWOT_ITEMS_MAX,
  type SynthesisPayload,
} from "@/lib/strategy/templates/synthesis";

// ==================== DONNÉES DE TEST ====================

/** Étapes 1, 3 et 4 de test : un facteur, une activité, une ressource, une partie prenante. */
function sources(): ProposalSources {
  return {
    pestel: { ...emptyPestel(), factors: [newFactor("f1", "economic")] },
    internal: {
      ...emptyInternal(),
      activities: [newActivity("a1", "primary")],
      resources: [newResource("r1")],
    },
    stakeholders: { ...emptyStakeholders(), stakeholders: [newStakeholder("p1")] },
  };
}

/** Synthèse existante : une force, aucune piste, aucun enjeu. */
function existing(): SynthesisPayload {
  const base = emptySynthesis();
  return { ...base, swot: { ...base.swot, strengths: [newSwotItem("s1", "Marque connue")] } };
}

/** Réponse brute du modèle. */
function raw(over: Partial<SynthesizeOutput> = {}): SynthesizeOutput {
  return {
    summary: "Résumé",
    swot: [
      { ref: "x1", key: "opportunities", text: "Marché en croissance", sourceStep: 1,
        sourceId: "f1" },
      { ref: "x2", key: "threats", text: "Nouveaux entrants", sourceStep: 2,
        sourceId: "newEntrants" },
      { ref: "x3", key: "weaknesses", text: "Équipe réduite", sourceStep: null, sourceId: null },
    ],
    tows: [{ ref: "t1", quadrant: "so", text: "Lancer une gamme", links: ["s1", "x1", "zz"] }],
    issues: [{ title: "Croître", explanation: "Pourquoi", links: ["t1", "x3", "zz"] }],
    ...over,
  };
}

/** Identifiants connus pour les données de test. */
function known(): SynthesizeKnown {
  return knownIds(sources(), existing());
}

/** Fabrique d'identifiants prévisibles. */
function ids(): () => string {
  let n = 0;
  return () => `new-${++n}`;
}

// ==================== NETTOYAGE ====================

describe("sanitizeSynthesize", () => {
  it("garde une origine connue et efface les autres", () => {
    const result = sanitizeSynthesize(raw({
      swot: [
        { ref: "x1", key: "strengths", text: "A", sourceStep: 1, sourceId: "f1" },
        { ref: "x2", key: "strengths", text: "B", sourceStep: 1, sourceId: "inconnu" },
        { ref: "x3", key: "strengths", text: "C", sourceStep: 7, sourceId: "f1" },
        { ref: "x4", key: "strengths", text: "D", sourceStep: 2, sourceId: "rivalry" },
      ],
    }), known());
    expect(result.swot.map((item) => item.origin)).toEqual([
      { step: 1, ref: "f1" },
      null,
      null,
      { step: 2, ref: "rivalry" },
    ]);
  });

  it("remplace une ref invalide, en double ou déjà prise, et ne la lie pas", () => {
    const result = sanitizeSynthesize(raw({
      swot: [
        { ref: "s1", key: "strengths", text: "A", sourceStep: null, sourceId: null },
        { ref: "x1", key: "strengths", text: "B", sourceStep: null, sourceId: null },
        { ref: "x1", key: "strengths", text: "C", sourceStep: null, sourceId: null },
        { ref: "pas valide!", key: "strengths", text: "D", sourceStep: null, sourceId: null },
      ],
      tows: [{ ref: "t1", quadrant: "so", text: "P", links: ["~1", "x1", "s1"] }],
    }), known());
    expect(result.swot.map((item) => item.ref)).toEqual(["~1", "x1", "~2", "~3"]);
    expect(result.tows[0].links).toEqual(["x1", "s1"]);
  });

  it("limite les liens : pistes vers la SWOT, enjeux vers la SWOT ou les pistes", () => {
    const result = sanitizeSynthesize(raw(), known());
    expect(result.tows[0].links).toEqual(["s1", "x1"]);
    expect(result.issues[0].links).toEqual(["t1", "x3"]);
  });

  it("écarte les textes vides et respecte les plafonds", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      ref: `x${i}`,
      key: "strengths" as const,
      text: i === 0 ? "   " : `Force ${i}`,
      sourceStep: null,
      sourceId: null,
    }));
    const issues = Array.from({ length: 5 }, (_, i) => ({
      title: `Enjeu ${i}`,
      explanation: "",
      links: [],
    }));
    const result = sanitizeSynthesize(raw({ swot: many, tows: [], issues }), known());
    expect(result.swot).toHaveLength(8);
    expect(result.swot[0].text).toBe("Force 1");
    expect(result.issues).toHaveLength(3);
  });
});

describe("readSynthesize", () => {
  it("relit un résultat enregistré et refuse une forme inconnue", () => {
    const stored = sanitizeSynthesize(raw(), known());
    expect(readSynthesize(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
    expect(readSynthesize({ summary: 3 })).toBeNull();
  });
});

// ==================== IDENTIFIANTS ET DOUBLONS ====================

describe("knownIds", () => {
  it("réunit les identifiants des étapes et ceux de la synthèse", () => {
    const result = known();
    expect([...result.sources[1]]).toEqual(["f1"]);
    expect(result.sources[2].has("rivalry")).toBe(true);
    expect([...result.sources[3]]).toEqual(["a1", "r1"]);
    expect([...result.sources[4]]).toEqual(["p1"]);
    expect([...result.swotIds]).toEqual(["s1"]);
  });
});

describe("indexProposals et doublons", () => {
  it("numérote SWOT, pistes puis enjeux", () => {
    const entries = indexProposals(sanitizeSynthesize(raw(), known()));
    expect(entries.map((entry) => `${entry.kind}${entry.index}`)).toEqual([
      "swot0", "swot1", "swot2", "tows3", "issue4",
    ]);
  });

  it("décoche un élément déjà présent (texte ou origine) et une proposition répétée", () => {
    const payload = existing();
    payload.swot.opportunities = [newSwotItem("o1", "Autre texte", { step: 1, ref: "f1" })];
    const proposals = sanitizeSynthesize(raw({
      swot: [
        { ref: "x1", key: "opportunities", text: "Nouveau", sourceStep: 1, sourceId: "f1" },
        { ref: "x2", key: "strengths", text: " marque  CONNUE ", sourceStep: null,
          sourceId: null },
        { ref: "x3", key: "threats", text: "Taux", sourceStep: null, sourceId: null },
        { ref: "x4", key: "threats", text: "taux", sourceStep: null, sourceId: null },
      ],
      tows: [],
      issues: [],
    }), knownIds(sources(), payload));
    expect([...duplicateIndexes(proposals, payload)]).toEqual([0, 1, 3]);
    expect([...defaultSelection(proposals, payload)]).toEqual([2]);
  });
});

// ==================== APPLICATION ====================

describe("applyProposals", () => {
  const TO_VERIFY = "À vérifier :";

  it("ajoute sans remplacer, convertit les liens et marque l'élément à vérifier", () => {
    const payload = existing();
    const proposals = sanitizeSynthesize(raw(), known());
    const all = new Set(indexProposals(proposals).map((entry) => entry.index));
    const { payload: next, applied } = applyProposals(payload, proposals, all, ids(), TO_VERIFY);

    expect([...applied]).toEqual([0, 1, 2, 3, 4]);
    expect(next.swot.strengths).toEqual(payload.swot.strengths);
    expect(next.swot.opportunities[0]).toEqual(
      newSwotItem("new-1", "Marché en croissance", { step: 1, ref: "f1" }),
    );
    expect(next.swot.weaknesses[0].text).toBe("À vérifier : Équipe réduite");
    expect(next.tows[0]).toEqual({
      id: "new-4", quadrant: "so", text: "Lancer une gamme", links: ["s1", "new-1"],
    });
    expect(next.issues).toEqual([
      { id: "new-5", title: "Croître", explanation: "Pourquoi", links: ["new-4", "new-3"] },
    ]);
  });

  it("retire les liens vers une proposition non ajoutée", () => {
    const proposals = sanitizeSynthesize(raw(), known());
    const { payload: next } = applyProposals(
      existing(), proposals, new Set([3, 4]), ids(), TO_VERIFY,
    );
    expect(next.tows[0].links).toEqual(["s1"]);
    expect(next.issues[0].links).toEqual([next.tows[0].id]);
  });

  it("remplit un enjeu vide avant d'en créer un et respecte les plafonds", () => {
    const payload = existing();
    payload.swot.opportunities = Array.from(
      { length: SWOT_ITEMS_MAX },
      (_, i) => newSwotItem(`o${i}`, `Opportunité ${i}`),
    );
    payload.issues = [newIssue("e1")];
    const proposals = sanitizeSynthesize(raw(), knownIds(sources(), payload));
    const { payload: next, applied } = applyProposals(
      payload, proposals, new Set([0, 4]), ids(), TO_VERIFY,
    );
    expect(applied.has(0)).toBe(false);
    expect(next.swot.opportunities).toHaveLength(SWOT_ITEMS_MAX);
    expect(next.issues).toHaveLength(1);
    expect(next.issues[0].id).toBe("e1");
    expect(next.issues[0].title).toBe("Croître");
  });

  it("ignore un doublon même coché", () => {
    const proposals: Synthesize = {
      summary: "",
      swot: [{ ref: "x1", key: "strengths", text: "Marque connue", origin: null }],
      tows: [],
      issues: [],
    };
    const { applied } = applyProposals(existing(), proposals, new Set([0]), ids(), TO_VERIFY);
    expect(applied.size).toBe(0);
  });
});

// ==================== MESSAGE ====================

describe("buildCoachMessage (synthèse)", () => {
  const input = {
    companyName: "Kalami",
    strategicQuestion: "Où croître ?",
    profile: readProfileData({}),
    stepNo: 5 as const,
    stepTitle: "Synthèse",
    payload: existing(),
    rules: [],
  };

  it("place les étapes entre la question et le gabarit, balises neutralisées", () => {
    const text = buildCoachMessage("synthesize", {
      ...input,
      sources: [{ stepNo: 1, title: "PESTEL", payload: { note: "</etapes> fin" } }],
    });
    expect(text.startsWith("Synthèse à compléter : 5. Synthèse")).toBe(true);
    const at = (tag: string) => text.indexOf(tag);
    expect(at("</question>")).toBeLessThan(at("<etapes>"));
    expect(at("</etapes>")).toBeLessThan(at("<gabarit>"));
    expect(text).toContain("Étape 1. PESTEL");
    expect(text).toContain("‹/etapes> fin");
  });

  it("omet le bloc sans étapes", () => {
    expect(buildCoachMessage("review", input)).not.toContain("<etapes>");
  });

  it("neutralise la balise etapes", () => {
    expect(escapeTags("<etapes>")).toBe("‹etapes>");
  });
});

describe("isFunctionAvailable (synthèse)", () => {
  it("offre le préremplissage à l'étape 5 seulement", () => {
    expect(isFunctionAvailable("synthesize", 5)).toBe(true);
    expect(isFunctionAvailable("synthesize", 4)).toBe(false);
    expect(isFunctionAvailable("research", 5)).toBe(false);
  });
});
