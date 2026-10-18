/**
 * Fichier    : reader-promo.test.ts
 * Projet     : Kalami
 * Description: Tests de l'encart Kalami Stratégie : livre guide seulement, chapitres qui
 *              contiennent la section « À vous de jouer » (espaces insécables acceptés).
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-17
 */

import { describe, expect, it } from "vitest";

import { hasExercises, hasStrategyPromo } from "@/lib/reader/promo";
import { GUIDE_BOOK_SLUG } from "@/lib/strategy/steps";

describe("hasStrategyPromo", () => {
  it("accepte le livre guide de la démarche", () => {
    expect(hasStrategyPromo(GUIDE_BOOK_SLUG)).toBe(true);
  });

  it("refuse les autres livres", () => {
    expect(hasStrategyPromo("un-autre-livre")).toBe(false);
  });
});

describe("hasExercises", () => {
  it("repère l'intertitre de la section", () => {
    expect(hasExercises(["<p>Texte</p>", "<h2>À vous de jouer</h2>", "<ol><li>…</li></ol>"]))
      .toBe(true);
  });

  it("accepte les espaces insécables", () => {
    expect(hasExercises(["<h2>À&nbsp;vous de jouer</h2>"])).toBe(true);
  });

  it("ignore une mention dans le texte ou dans le sommaire", () => {
    expect(
      hasExercises([
        "<p>Chaque module se termine par une section «&nbsp;À vous de jouer&nbsp;».</p>",
        '<p class="sommaire-2" data-chapitre="7" data-bloc="39">À vous de jouer</p>',
        "<h3>À vous de jouer</h3>",
      ]),
    ).toBe(false);
  });

  it("refuse un chapitre vide", () => {
    expect(hasExercises([])).toBe(false);
  });
});
