/**
 * Fichier    : author.test.ts
 * Projet     : Kalami
 * Description: Tests de l'espace auteur : choix de la version servie (aperçu, livre non
 *              publié) et validation des formulaires auteur et d'administration associés.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-09
 */

import { describe, expect, it } from "vitest";

import {
  parseAuthorBook,
  parseAuthorProfile,
  parseContract,
  parsePayout,
  parseRegistration,
  parseReview,
} from "@/lib/author/validation";
import { chooseVersion } from "@/lib/content/access";

const CONTRACT_ID = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

/** Construit un FormData à partir d'un objet simple. */
function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

// ==================== CHOIX DE LA VERSION ====================

describe("chooseVersion", () => {
  const published = { status: "published", current_version_id: "v1", pending_version_id: "v2" };
  const draft = { status: "draft", current_version_id: null, pending_version_id: "v1" };

  it("sert la version courante d'un livre publié à tout lecteur", () => {
    expect(chooseVersion(published, false, false)).toBe("v1");
  });

  it("sert la version en attente en aperçu, à l'équipe seulement", () => {
    expect(chooseVersion(published, true, true)).toBe("v2");
    expect(chooseVersion(published, false, true)).toBeNull();
  });

  it("retombe sur la version courante en aperçu sans version en attente", () => {
    const book = { ...published, pending_version_id: null };
    expect(chooseVersion(book, true, true)).toBe("v1");
  });

  it("cache un livre non publié aux lecteurs", () => {
    expect(chooseVersion(draft, false, false)).toBeNull();
    expect(chooseVersion(draft, true, true)).toBe("v1");
  });
});

// ==================== INSCRIPTION ET PROFIL ====================

describe("parseRegistration", () => {
  it("exige l'acceptation du contrat", () => {
    const result = parseRegistration(form({ display_name: "Awa", contract_id: CONTRACT_ID }));
    expect(result.ok).toBe(false);
  });

  it("refuse un identifiant de contrat invalide", () => {
    const result = parseRegistration(
      form({ display_name: "Awa", contract_id: "x", accept: "on" }),
    );
    expect(result.ok).toBe(false);
  });

  it("génère le slug depuis le nom", () => {
    const result = parseRegistration(
      form({ display_name: "Awa Koné", contract_id: CONTRACT_ID, accept: "on", bio: "" }),
    );
    expect(result).toEqual({
      ok: true,
      value: { display_name: "Awa Koné", slug: "awa-kone", bio: null, contract_id: CONTRACT_ID },
    });
  });
});

describe("parseAuthorProfile", () => {
  it("exige le nom affiché", () => {
    expect(parseAuthorProfile(form({ display_name: " " })).ok).toBe(false);
  });
});

// ==================== VERSEMENTS ====================

describe("parsePayout", () => {
  it("valide un compte Mobile Money et ignore les champs bancaires", () => {
    const result = parsePayout(
      form({
        method: "mobile_money",
        account_holder: "Awa Koné",
        mobile_operator: "wave",
        mobile_number: "+225 07 00 00 00 00",
        bank_name: "Banque",
      }),
    );
    expect(result.ok && result.value).toMatchObject({
      method: "mobile_money",
      mobile_operator: "wave",
      bank_name: null,
    });
  });

  it("exige banque et numéro pour un virement", () => {
    const result = parsePayout(form({ method: "bank", account_holder: "Awa", bank_name: "B" }));
    expect(result.ok).toBe(false);
  });

  it("met le code SWIFT en majuscules et refuse un code mal formé", () => {
    const base = { method: "bank", account_holder: "Awa", bank_name: "B", account_number: "1" };
    const ok = parsePayout(form({ ...base, swift: "sgbcciab" }));
    expect(ok.ok && ok.value.swift).toBe("SGBCCIAB");
    expect(parsePayout(form({ ...base, swift: "SG-1" })).ok).toBe(false);
  });

  it("refuse un opérateur inconnu ou un numéro invalide", () => {
    const base = { method: "mobile_money", account_holder: "Awa" };
    expect(parsePayout(form({ ...base, mobile_operator: "x", mobile_number: "0700000000" })).ok)
      .toBe(false);
    expect(parsePayout(form({ ...base, mobile_operator: "mtn", mobile_number: "abc" })).ok)
      .toBe(false);
  });
});

// ==================== LIVRE ====================

describe("parseAuthorBook", () => {
  it("ignore les champs réservés à l'administration", () => {
    const result = parseAuthorBook(
      form({ title: "Mon livre", language: "fr", status: "published", is_featured: "on" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.book).not.toHaveProperty("status");
      expect(result.value.book).not.toHaveProperty("is_featured");
      expect(result.value.book).not.toHaveProperty("slug");
    }
  });

  it("exige un titre", () => {
    expect(parseAuthorBook(form({ title: "", language: "fr" })).ok).toBe(false);
  });
});

// ==================== ADMINISTRATION ====================

describe("parseContract", () => {
  it("exige un titre et un texte", () => {
    expect(parseContract(form({ title: "Contrat", body: "" })).ok).toBe(false);
    expect(parseContract(form({ title: "Contrat", body: "Article 1" })).ok).toBe(true);
  });
});

describe("parseReview", () => {
  it("accepte une validation sans motif", () => {
    expect(parseReview(form({ decision: "approve" }))).toEqual({
      ok: true,
      value: { approve: true, reason: null },
    });
  });

  it("exige un motif pour un refus", () => {
    expect(parseReview(form({ decision: "reject" })).ok).toBe(false);
    expect(parseReview(form({ decision: "reject", reason: "Texte incomplet" })).ok).toBe(true);
  });

  it("refuse une décision inconnue", () => {
    expect(parseReview(form({ decision: "maybe" })).ok).toBe(false);
  });
});
