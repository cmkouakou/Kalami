/**
 * Fichier    : strategy-presence.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests de la présence et du verrouillage doux (S9c) sans réseau : sujet du
 *              canal, lecture prudente des présences, regroupement de plusieurs onglets,
 *              membres par étape, éditeurs d'un élément, initiales et message
 *              « étape enregistrée ».
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { describe, expect, it } from "vitest";

import {
  editorsOf,
  initials,
  peersOf,
  peersOnStep,
  readPresenceMeta,
  readSavedEvent,
  studyTopic,
} from "@/lib/strategy/presence";

const ME = "u-moi";
const ANNA = { userId: "u-anna", name: "Anna Koné" };
const BOB = { userId: "u-bob", name: "Bob" };

describe("studyTopic", () => {
  it("préfixe l'identifiant de l'étude", () => {
    expect(studyTopic("abc")).toBe("study:abc");
  });
});

describe("readPresenceMeta", () => {
  it("lit une présence complète", () => {
    expect(readPresenceMeta({ ...ANNA, stepNo: 2, elementId: "rivalry" })).toEqual({
      ...ANNA,
      stepNo: 2,
      elementId: "rivalry",
    });
  });

  it("refuse une présence sans membre ou sans nom", () => {
    expect(readPresenceMeta(null)).toBeNull();
    expect(readPresenceMeta({ name: "X" })).toBeNull();
    expect(readPresenceMeta({ userId: "u", name: "  " })).toBeNull();
  });

  it("ignore une étape ou un élément invalides", () => {
    expect(readPresenceMeta({ ...ANNA, stepNo: 12, elementId: "a" })).toMatchObject({
      stepNo: null,
      elementId: null,
    });
    expect(readPresenceMeta({ ...ANNA, stepNo: 1, elementId: "<script>" })).toMatchObject({
      stepNo: 1,
      elementId: null,
    });
  });

  it("borne la longueur du nom", () => {
    const meta = readPresenceMeta({ userId: "u", name: "x".repeat(200) });
    expect(meta?.name).toHaveLength(80);
  });
});

describe("peersOf", () => {
  const state = {
    [ME]: [{ userId: ME, name: "Moi", stepNo: 1, elementId: null }],
    [ANNA.userId]: [
      { ...ANNA, stepNo: 3, elementId: null },
      { ...ANNA, stepNo: 1, elementId: "f1" },
      { ...ANNA, stepNo: 1, elementId: "f1" },
    ],
    [BOB.userId]: [{ ...BOB, stepNo: null, elementId: null }, { bad: true }],
  };

  it("exclut le membre courant et regroupe les onglets", () => {
    const peers = peersOf(state, ME);
    expect(peers.map((p) => p.name)).toEqual(["Anna Koné", "Bob"]);
    expect(peers[0].steps).toEqual([1, 3]);
    expect(peers[0].editing).toEqual([{ stepNo: 1, elementId: "f1" }]);
    expect(peers[1].steps).toEqual([]);
  });

  it("donne les membres d'une étape et les éditeurs d'un élément", () => {
    const peers = peersOf(state, ME);
    expect(peersOnStep(peers, 1).map((p) => p.userId)).toEqual([ANNA.userId]);
    expect(peersOnStep(peers, 2)).toEqual([]);
    expect(editorsOf(peers, 1, "f1")).toEqual(["Anna Koné"]);
    expect(editorsOf(peers, 3, "f1")).toEqual([]);
  });
});

describe("initials", () => {
  it("prend la première et la dernière initiale", () => {
    expect(initials("Anna Marie Koné")).toBe("AK");
  });

  it("prend deux lettres d'un mot seul ou d'un courriel", () => {
    expect(initials("bob")).toBe("BO");
    expect(initials("jean.dupont@exemple.com")).toBe("JD");
  });
});

describe("readSavedEvent", () => {
  it("lit un message valide", () => {
    expect(readSavedEvent({ ...ANNA, stepNo: 4, revision: 7 })).toEqual({
      ...ANNA,
      stepNo: 4,
      revision: 7,
    });
  });

  it("refuse un message mal formé", () => {
    expect(readSavedEvent({ ...ANNA, stepNo: 4, revision: 0 })).toBeNull();
    expect(readSavedEvent({ ...ANNA, stepNo: 10, revision: 2 })).toBeNull();
    expect(readSavedEvent({ name: "X", stepNo: 4, revision: 2 })).toBeNull();
    expect(readSavedEvent("x")).toBeNull();
  });
});
