/**
 * Fichier    : content-access.test.ts
 * Projet     : Kalami
 * Description: Tests des règles d'accès au contenu : numéro de chapitre, décision
 *              (complet / extrait / refusé), coupure de l'extrait, sujet de limitation.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-08
 */

import { describe, expect, it } from "vitest";

import {
  applyPreviewCut,
  decideAccess,
  parseChapterPosition,
  rateLimitSubject,
} from "@/lib/content/access";

const RULE = { preview_chapters: 1, preview_cut_block: null };
const BLOCKS = ["<p>a</p>", "<p>b</p>", "<p>c</p>", "<p>d</p>"];

describe("parseChapterPosition", () => {
  it("accepte un entier de 1 à 1000", () => {
    expect(parseChapterPosition("1")).toBe(1);
    expect(parseChapterPosition("1000")).toBe(1000);
  });

  it("refuse 0, les zéros initiaux, les signes, les décimales et au-delà de 1000", () => {
    for (const value of ["0", "01", "-1", "+1", "1.5", "1e2", "1001", "abc", ""]) {
      expect(parseChapterPosition(value)).toBeNull();
    }
  });
});

describe("decideAccess", () => {
  it("donne le chapitre 1 en extrait par défaut, refuse le chapitre 2", () => {
    expect(decideAccess(1, RULE, false)).toBe("preview");
    expect(decideAccess(2, RULE, false)).toBe("denied");
  });

  it("donne tout au lecteur qui a un droit de lecture", () => {
    expect(decideAccess(2, RULE, true)).toBe("full");
    expect(decideAccess(1, RULE, true)).toBe("full");
  });

  it("refuse tout sans extrait (0 chapitre)", () => {
    expect(decideAccess(1, { preview_chapters: 0, preview_cut_block: null }, false)).toBe(
      "denied",
    );
  });
});

describe("applyPreviewCut", () => {
  const cutRule = { preview_chapters: 2, preview_cut_block: 2 };

  it("coupe le dernier chapitre de l'extrait au bloc indiqué", () => {
    expect(applyPreviewCut(BLOCKS, 2, "preview", cutRule)).toEqual({
      blocks: BLOCKS.slice(0, 2),
      truncated: true,
    });
  });

  it("ne coupe ni les chapitres précédents, ni la lecture complète", () => {
    expect(applyPreviewCut(BLOCKS, 1, "preview", cutRule).truncated).toBe(false);
    expect(applyPreviewCut(BLOCKS, 2, "full", cutRule)).toEqual({
      blocks: BLOCKS,
      truncated: false,
    });
  });

  it("ne coupe pas si la coupure dépasse la longueur du chapitre", () => {
    const rule = { preview_chapters: 1, preview_cut_block: 10 };
    expect(applyPreviewCut(BLOCKS, 1, "preview", rule).blocks).toHaveLength(4);
  });

  it("ne renvoie aucun bloc pour un accès refusé", () => {
    expect(applyPreviewCut(BLOCKS, 3, "denied", cutRule)).toEqual({
      blocks: [],
      truncated: true,
    });
  });
});

describe("rateLimitSubject", () => {
  it("utilise le compte s'il est connecté", () => {
    expect(rateLimitSubject("abc", new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "user:abc",
    );
  });

  it("utilise la première adresse IP transmise, sinon x-real-ip", () => {
    const forwarded = new Headers({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" });
    expect(rateLimitSubject(null, forwarded)).toBe("ip:1.2.3.4");
    expect(rateLimitSubject(null, new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("ip:5.6.7.8");
    expect(rateLimitSubject(null, new Headers())).toBe("ip:inconnue");
  });
});
