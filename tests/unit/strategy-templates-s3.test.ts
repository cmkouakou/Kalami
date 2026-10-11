/**
 * Fichier    : strategy-templates-s3.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests des gabarits de l'étape 3 (chaîne de valeur, VRIO) et de l'étape 4
 *              (parties prenantes) : contenu de départ, lecture tolérante, arbre VRIO
 *              (« partiel » = « non », à confirmer), cases pouvoir-intérêt (fort à partir
 *              de 3), listes de contrôle (miroir de strategy_checklist_ok) et validation
 *              stricte avant envoi.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { describe, expect, it } from "vitest";

import { parsePayload } from "@/lib/strategy/templates";
import { checklistOk } from "@/lib/strategy/templates/common";
import {
  initialInternal,
  internalChecklist,
  newActivity,
  newResource,
  PORTER_ACTIVITIES,
  readInternal,
  RESOURCES_MAX,
  vrioResult,
  type Answer,
  type InternalPayload,
  type Resource,
} from "@/lib/strategy/templates/internal";
import {
  autoQuadrant,
  emptyStakeholders,
  newStakeholder,
  quadrantOf,
  readStakeholders,
  stakeholdersChecklist,
  STAKEHOLDERS_MAX,
  type Stakeholder,
} from "@/lib/strategy/templates/stakeholders";

/** Libellés factices des activités de Porter (clé = libellé). */
const LABELS = Object.fromEntries(PORTER_ACTIVITIES.map(({ key }) => [key, key]));

/** Ressource nommée avec les quatre réponses données (null = sans réponse). */
function resource(answers: (Answer | null)[], id = "r1"): Resource {
  const item = { ...newResource(id), name: "Savoir-faire" };
  const [value, rarity, imitability, organization] = answers;
  item.tests = {
    value: { answer: value, justification: "" },
    rarity: { answer: rarity, justification: "" },
    imitability: { answer: imitability, justification: "" },
    organization: { answer: organization, justification: "" },
  };
  return item;
}

/** Partie prenante nommée avec pouvoir et intérêt donnés. */
function stakeholder(
  power: number | null,
  interest: number | null,
  patch: Partial<Stakeholder> = {},
): Stakeholder {
  return { ...newStakeholder("p1"), name: "Banque", power, interest, ...patch };
}

/** Analyse interne complète : activités évaluées et une ressource évaluée. */
function filledInternal(): InternalPayload {
  const payload = initialInternal(LABELS);
  payload.activities = payload.activities.map((a) => ({ ...a, evaluation: "strength" }));
  payload.resources = [resource(["yes", "yes", "no", "yes"])];
  return payload;
}

// ==================== ÉTAPE 3 : CHAÎNE DE VALEUR ====================

describe("readInternal", () => {
  it("part des neuf activités de Porter quand rien n'est enregistré", () => {
    const result = readInternal({}, LABELS);
    expect(result.model).toBe("porter");
    expect(result.activities).toHaveLength(PORTER_ACTIVITIES.length);
    expect(result.activities.filter((a) => a.kind === "primary")).toHaveLength(5);
    expect(result.activities.every((a) => a.name.length > 0)).toBe(true);
    expect(result.resources).toEqual([]);
  });

  it("garde une liste d'activités enregistrée, même vide", () => {
    expect(readInternal({ activities: [] }, LABELS).activities).toEqual([]);
  });

  it("écarte les éléments invalides et limite les ressources", () => {
    const many = Array.from({ length: RESOURCES_MAX + 3 }, (_, i) => newResource(`r${i}`));
    const result = readInternal(
      {
        activities: [newActivity("a1", "primary", "Ventes"), { id: "a2", kind: "inconnu" }],
        resources: many,
      },
      LABELS,
    );
    expect(result.activities.map((a) => a.id)).toEqual(["a1"]);
    expect(result.resources).toHaveLength(RESOURCES_MAX);
  });
});

// ==================== ÉTAPE 3 : VRIO ====================

describe("vrioResult", () => {
  it("attend une réponse à chaque question nécessaire", () => {
    expect(vrioResult(resource([null, null, null, null]))).toBeNull();
    expect(vrioResult(resource(["yes", "yes", null, null]))).toBeNull();
  });

  it("s'arrête au premier « non »", () => {
    expect(vrioResult(resource(["no", null, null, null]))).toEqual({
      outcome: "disadvantage",
      tentative: false,
    });
    expect(vrioResult(resource(["yes", "no", null, null]))?.outcome).toBe("parity");
    expect(vrioResult(resource(["yes", "yes", "no", null]))?.outcome).toBe("temporary");
    expect(vrioResult(resource(["yes", "yes", "yes", "no"]))?.outcome).toBe("unexploited");
  });

  it("donne un avantage durable avec quatre « oui »", () => {
    expect(vrioResult(resource(["yes", "yes", "yes", "yes"]))).toEqual({
      outcome: "sustained",
      tentative: false,
    });
  });

  it("traite « partiel » comme « non », à confirmer", () => {
    expect(vrioResult(resource(["yes", "partial", "yes", "yes"]))).toEqual({
      outcome: "parity",
      tentative: true,
    });
  });
});

describe("internalChecklist", () => {
  it("refuse un gabarit de départ non évalué", () => {
    const items = internalChecklist(initialInternal(LABELS));
    expect(items.find((i) => i.key === "activities")?.ok).toBe(true);
    expect(items.find((i) => i.key === "evaluated")?.ok).toBe(false);
    expect(checklistOk(items)).toBe(false);
  });

  it("ignore les activités sans nom et exige une ressource complète", () => {
    const payload = filledInternal();
    payload.activities.push(newActivity("vide", "support"));
    expect(checklistOk(internalChecklist(payload))).toBe(true);

    payload.resources = [resource(["yes", "yes", null, null])];
    expect(checklistOk(internalChecklist(payload))).toBe(false);
  });

  it("refuse une chaîne sans activité nommée", () => {
    const payload = filledInternal();
    payload.activities = [newActivity("a1", "primary")];
    const items = internalChecklist(payload);
    expect(items.find((i) => i.key === "activities")?.ok).toBe(false);
    expect(items.find((i) => i.key === "evaluated")?.ok).toBe(false);
  });
});

// ==================== ÉTAPE 4 : PARTIES PRENANTES ====================

describe("autoQuadrant et quadrantOf", () => {
  it("place selon le seuil de 3", () => {
    expect(autoQuadrant(stakeholder(3, 3))).toBe("manage");
    expect(autoQuadrant(stakeholder(5, 2))).toBe("satisfy");
    expect(autoQuadrant(stakeholder(2, 3))).toBe("inform");
    expect(autoQuadrant(stakeholder(1, 2))).toBe("monitor");
  });

  it("ne place pas tant que le pouvoir ou l'intérêt manque", () => {
    expect(autoQuadrant(stakeholder(null, 4))).toBeNull();
    expect(quadrantOf(stakeholder(4, null))).toBeNull();
  });

  it("préfère la case choisie à la main", () => {
    expect(quadrantOf(stakeholder(1, 1, { quadrantOverride: "manage" }))).toBe("manage");
    expect(quadrantOf(stakeholder(null, null, { quadrantOverride: "inform" }))).toBe("inform");
  });
});

describe("readStakeholders et stakeholdersChecklist", () => {
  it("rend une liste vide pour un contenu absent et limite la liste", () => {
    expect(readStakeholders(null)).toEqual(emptyStakeholders());
    const many = Array.from({ length: STAKEHOLDERS_MAX + 2 }, (_, i) => newStakeholder(`p${i}`));
    expect(readStakeholders({ stakeholders: many }).stakeholders).toHaveLength(STAKEHOLDERS_MAX);
  });

  it("écarte les niveaux hors de 1 à 5", () => {
    const result = readStakeholders({ stakeholders: [stakeholder(6, 2), stakeholder(2, 2)] });
    expect(result.stakeholders).toHaveLength(1);
  });

  it("exige une partie prenante nommée avec pouvoir, intérêt et approche", () => {
    expect(checklistOk(stakeholdersChecklist(emptyStakeholders()))).toBe(false);
    const sans = { stakeholders: [stakeholder(4, 4)] };
    expect(checklistOk(stakeholdersChecklist(sans))).toBe(false);
    const ok = { stakeholders: [stakeholder(4, 4, { approach: "Rencontre trimestrielle" })] };
    expect(checklistOk(stakeholdersChecklist(ok))).toBe(true);
  });
});

// ==================== VALIDATION AVANT ENVOI ====================

describe("parsePayload (étapes 3 et 4)", () => {
  it("accepte un contenu complet", () => {
    expect(parsePayload(3, filledInternal())).not.toBeNull();
    expect(parsePayload(4, { stakeholders: [stakeholder(3, 4)] })).not.toBeNull();
  });

  it("refuse un modèle inconnu, une réponse inconnue ou un niveau hors bornes", () => {
    expect(parsePayload(3, { ...filledInternal(), model: "services" })).toBeNull();
    const payload = filledInternal();
    payload.resources[0].tests.value.answer = "peut-être" as Answer;
    expect(parsePayload(3, payload)).toBeNull();
    expect(parsePayload(4, { stakeholders: [stakeholder(0, 3)] })).toBeNull();
  });

  it("refuse le contenu d'une autre étape", () => {
    expect(parsePayload(4, filledInternal())).toBeNull();
    expect(parsePayload(3, emptyStakeholders())).toBeNull();
  });
});
