/**
 * =============================================================
 *  Fichier    : contrast.test.ts
 *  Projet     : Kalami
 *  Description: Vérifie que les paires texte / fond de la charte respectent le contraste
 *               WCAG AA (4,5:1) dans les trois thèmes, à partir des valeurs de globals.css.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: vitest, src/app/globals.css
 * =============================================================
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// ==================== LECTURE DES JETONS ====================

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Sélecteurs des blocs de jetons de chaque thème. */
const THEMES: Record<string, string> = {
  light: '[data-theme="light"] {',
  sepia: '[data-theme="sepia"] {',
  dark: '[data-theme="dark"] {',
};

/** Paires [texte, fond] dont le texte doit atteindre 4,5:1. */
const PAIRS: [string, string][] = [
  ["ink", "paper"],
  ["ink", "surface"],
  ["ink", "sand"],
  ["ink-muted", "paper"],
  ["ink-muted", "surface"],
  ["ink-muted", "sand"],
  ["encre", "paper"],
  ["encre", "surface"],
  ["encre", "encre-soft"],
  ["on-encre", "encre"],
  ["on-encre", "encre-strong"],
  ["ocre-text", "paper"],
  ["ocre-text", "surface"],
  ["success", "surface"],
  ["danger", "surface"],
  ["on-encre", "danger"],
];

const MIN_RATIO = 4.5;

/**
 * Extrait les jetons hexadécimaux du bloc de thème qui suit le sélecteur donné.
 * @param {string} selector - Début du bloc (ex. '[data-theme="dark"] {')
 * @returns {Record<string, string>} Nom du jeton → couleur #rrggbb
 */
function readTokens(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  if (start < 0) throw new Error(`Bloc introuvable : ${selector}`);
  const block = CSS.slice(start, CSS.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

// ==================== CALCUL WCAG ====================

/** Luminance relative WCAG d'une couleur #rrggbb. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs. */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// ==================== TESTS ====================

describe("contraste des jetons de la charte", () => {
  it("calcule le contraste de référence noir / blanc", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  for (const [theme, selector] of Object.entries(THEMES)) {
    const tokens = readTokens(selector);
    for (const [text, background] of PAIRS) {
      it(`${theme} : ${text} sur ${background} ≥ ${MIN_RATIO}:1`, () => {
        expect(tokens[text], `jeton --${text}`).toBeDefined();
        expect(tokens[background], `jeton --${background}`).toBeDefined();
        expect(contrast(tokens[text], tokens[background])).toBeGreaterThanOrEqual(MIN_RATIO);
      });
    }
  }
});
