/**
 * Fichier    : strategy-templates-s3.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests des gabarits de l'étape 3 (modèle Porter ou services, chaîne de valeur,
 *              VRIO) et de l'étape 4 (parties prenantes) : contenu de départ, changement de
 *              modèle, lecture tolérante, arbre VRIO (« partiel » = « non », à confirmer),
 *              cases pouvoir-intérêt (fort à partir de 3), listes de contrôle (miroir de
 *              strategy_checklist_ok) et validation stricte avant envoi.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-11
 */

import { describe, expect, it } from "vitest";

import { parsePayload } from "@/lib/strategy/templates";
import { checklistOk } from "@/lib/strategy/templates/common";
import {
  emptyInternal,
  internalChecklist,
  newActivity,
  newResource,
  PORTER_ACTIVITIES,
  readInternal,
  RESOURCES_MAX,
  SERVICES_ACTIVITIES,
  untouchedActivities,
  vrioResult,
  withModel,
  type Answer,
  type InternalChecklistKey,
  type InternalPayload,
  type Resource,
} from "@/lib/strategy/templates/internal";
import {
  autoQuadrant,
  emptyStakeholders,
  newStakeholder,
  noHighPower,
  quadrantOf,
  readStakeholders,
  stakeholdersChecklist,
  STAKEHOLDERS_MAX,
  type Stakeholder,
} from "@/lib/strategy/templates/stakeholders";

/** Libellés factices des activités des deux modèles (clé = libellé). */
const LABELS = Object.fromEntries(
  [...PORTER_ACTIVITIES, ...SERVICES_ACTIVITIES].map(({ key }) => [key, key]),
);

/** Ressource nommée avec les quatre réponses données (null = sans réponse). */
function resource(answers: (Answer | null)[], id = "r1"): Resource {
  const item = { ...newResource(id), name: `Savoir-faire ${id}` };
  const [value, rarity, imitability, organization] = answers;
  item.tests = {
    value: { answer: value, justification: "" },
    rarity: { answer: rarity, justification: "" },
    imitability: { answer: imitability, justification: "" },
    organization: { answer: organization, justification: "" },
  };
  return item;
}

/** Ressources VRIO complètes. */
function completeResources(count: number): Resource[] {
  return Array.from({ length: count }, (_, i) => resource(["yes", "yes", "no", "yes"], `r${i}`));
}

/** Partie prenante nommée avec pouvoir et intérêt donnés. */
function stakeholder(
  power: number | null,
  interest: number | null,
  patch: Partial<Stakeholder> = {},
): Stakeholder {
  return { ...newStakeholder(crypto.randomUUID()), name: "Banque", power, interest, ...patch };
}

/** Cinq parties prenantes placées, dont une seule à pouvoir fort. */
function fiveStakeholders(): Stakeholder[] {
  return [
    stakeholder(4, 4),
    stakeholder(1, 1),
    stakeholder(2, 4),
    stakeholder(1, 2),
    stakeholder(2, 2),
  ];
}

/** Analyse interne complète : modèle Porter, 4 activités évaluées sur 9, 3 ressources. */
function filledInternal(): InternalPayload {
  const payload = withModel(emptyInternal(), "porter", LABELS);
  payload.activities = payload.activities.map((a, i) =>
    i < 4 ? { ...a, evaluation: "strength" } : a,
  );
  payload.resources = completeResources(3);
  return payload;
}

// ==================== ÉTAPE 3 : MODÈLE ET CHAÎNE DE VALEUR ====================

describe("readInternal et withModel", () => {
  it("attend le choix du modèle quand rien n'est enregistré", () => {
    expect(readInternal({})).toEqual(emptyInternal());
  });

  it("garde Porter pour un ancien contenu sans modèle mais avec des activités", () => {
    const result = readInternal({ activities: [newActivity("a1", "primary", "Ventes")] });
    expect(result.model).toBe("porter");
  });

  it("part des activités du modèle choisi", () => {
    const porter = withModel(emptyInternal(), "porter", LABELS);
    expect(porter.activities).toHaveLength(PORTER_ACTIVITIES.length);
    const services = withModel(emptyInternal(), "services", LABELS);
    expect(services.model).toBe("services");
    expect(services.activities.map((a) => a.name)).toEqual(
      SERVICES_ACTIVITIES.map(({ key }) => key),
    );
    expect(services.activities.filter((a) => a.kind === "primary")).toHaveLength(5);
  });

  it("change de modèle en gardant les ressources", () => {
    const payload = filledInternal();
    expect(untouchedActivities(payload)).toBe(false);
    const switched = withModel(payload, "services", LABELS);
    expect(switched.resources).toEqual(payload.resources);
    expect(untouchedActivities(switched)).toBe(true);
  });

  it("garde une liste d'activités enregistrée, même vide", () => {
    expect(readInternal({ model: "services", activities: [] }).activities).toEqual([]);
  });

  it("écarte les éléments invalides et limite les ressources", () => {
    const many = Array.from({ length: RESOURCES_MAX + 3 }, (_, i) => newResource(`r${i}`));
    const result = readInternal({
      model: "inconnu",
      activities: [newActivity("a1", "primary", "Ventes"), { id: "a2", kind: "inconnu" }],
      resources: many,
    });
    expect(result.model).toBe("porter");
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
  /** État d'un élément de la liste de contrôle. */
  const ok = (payload: InternalPayload, key: InternalChecklistKey) =>
    internalChecklist(payload).find((item) => item.key === key)?.ok;

  it("accepte 4 activités évaluées et 3 ressources complètes", () => {
    expect(checklistOk(internalChecklist(filledInternal()))).toBe(true);
  });

  it("exige le choix du modèle", () => {
    expect(ok({ ...filledInternal(), model: null }, "model")).toBe(false);
    expect(ok(emptyInternal(), "model")).toBe(false);
  });

  it("exige 4 activités nommées et évaluées", () => {
    const payload = filledInternal();
    payload.activities[3] = { ...payload.activities[3], evaluation: null };
    expect(ok(payload, "activities")).toBe(false);
    payload.activities[3] = { ...payload.activities[3], evaluation: "marginal", name: " " };
    expect(ok(payload, "activities")).toBe(false);
  });

  it("exige 3 ressources complètes et les quatre réponses pour chacune", () => {
    const payload = filledInternal();
    payload.resources = completeResources(2);
    expect(ok(payload, "resources")).toBe(false);

    payload.resources = [...completeResources(3), resource(["yes", "yes", null, null], "r9")];
    expect(ok(payload, "resources")).toBe(true);
    expect(ok(payload, "complete")).toBe(false);

    // Une ressource sans nom est ignorée
    payload.resources = [...completeResources(3), newResource("vide")];
    expect(checklistOk(internalChecklist(payload))).toBe(true);
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

  it("exige 5 parties prenantes nommées et placées, dont une à pouvoir fort", () => {
    expect(checklistOk(stakeholdersChecklist(emptyStakeholders()))).toBe(false);
    expect(checklistOk(stakeholdersChecklist({ stakeholders: fiveStakeholders() }))).toBe(true);

    const four = [...fiveStakeholders().slice(0, 4), newStakeholder("vide")];
    expect(checklistOk(stakeholdersChecklist({ stakeholders: four }))).toBe(false);

    const unplaced = [...fiveStakeholders(), stakeholder(null, 4)];
    expect(checklistOk(stakeholdersChecklist({ stakeholders: unplaced }))).toBe(false);

    const byHand = [...fiveStakeholders(), stakeholder(null, 4, { quadrantOverride: "inform" })];
    expect(checklistOk(stakeholdersChecklist({ stakeholders: byHand }))).toBe(true);
  });

  it("repère l'absence de pouvoir fort, même corrigée à la main", () => {
    const low = fiveStakeholders().map((item) => ({ ...item, power: 1 }));
    expect(noHighPower({ stakeholders: low })).toBe(true);
    expect(checklistOk(stakeholdersChecklist({ stakeholders: low }))).toBe(false);

    low[0] = { ...low[0], quadrantOverride: "satisfy" };
    expect(noHighPower({ stakeholders: low })).toBe(false);
    expect(checklistOk(stakeholdersChecklist({ stakeholders: low }))).toBe(true);
  });
});

// ==================== VALIDATION AVANT ENVOI ====================

describe("parsePayload (étapes 3 et 4)", () => {
  it("accepte un contenu complet, avec l'un ou l'autre modèle", () => {
    expect(parsePayload(3, filledInternal())).not.toBeNull();
    expect(parsePayload(3, withModel(filledInternal(), "services", LABELS))).not.toBeNull();
    expect(parsePayload(3, emptyInternal())).not.toBeNull();
    expect(parsePayload(4, { stakeholders: [stakeholder(3, 4)] })).not.toBeNull();
  });

  it("refuse un modèle inconnu, une réponse inconnue ou un niveau hors bornes", () => {
    expect(parsePayload(3, { ...filledInternal(), model: "inconnu" })).toBeNull();
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
