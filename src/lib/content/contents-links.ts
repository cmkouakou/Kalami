/**
 * =============================================================
 *  Fichier    : contents-links.ts
 *  Projet     : Kalami
 *  Description: Table des matières cliquable : chaque entrée du sommaire Word (classes
 *               « sommaire-1 » et « sommaire-2 ») reçoit le chapitre et le bloc qu'elle
 *               annonce (data-chapitre, data-bloc), retrouvés par leur titre une fois le livre
 *               découpé. Une entrée de module reçoit aussi son surtitre (« MODULE 3 »).
 *               Les blocs sont déjà nettoyés : seuls des attributs numériques sont ajoutés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: types.ts
 * =============================================================
 */

import "server-only";

import type { ConvertedChapter } from "./types";

// ==================== CONSTANTES ====================

/** Entrée de table des matières nettoyée par la conversion (texte seul). */
const ENTRY = /^<p class="(sommaire-[12])">([^<]*)<\/p>$/;

/** Intertitre d'un chapitre (le titre du chapitre lui-même est rendu à part). */
const SUBHEADING = /^<h[2-3]\b[^>]*>([\s\S]*)<\/h[2-3]>$/;

/** Surtitre d'ouverture de chapitre (« MODULE 3 »). */
const KICKER = /^<p class="chapitre-surtitre">([^<]*)<\/p>$/;

/** Entités produites par le nettoyage HTML. */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Cible d'une entrée : chapitre (position, à partir de 1) et bloc. */
type Target = { chapter: number; block: number };

// ==================== OUTILS ====================

/**
 * Texte comparable d'un fragment HTML : balises retirées, entités décodées, casse,
 * apostrophes et espaces uniformisés.
 * @param html - Fragment nettoyé ou titre brut
 */
export function comparable(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole;
      const hex = code[1].toLowerCase() === "x";
      const value = hex ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
    })
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFC")
    .toLowerCase();
}

/**
 * Cherche un intertitre dans un chapitre, à partir d'un bloc donné.
 * @returns Indice du bloc, ou -1
 */
function findSubheading(blocks: string[], text: string, from: number): number {
  for (let index = Math.max(0, from); index < blocks.length; index++) {
    const match = SUBHEADING.exec(blocks[index]);
    if (match && comparable(match[1]) === text) return index;
  }
  return -1;
}

// ==================== POINT D'ENTRÉE ====================

/**
 * Rend cliquables les entrées de la table des matières du livre (modifie les blocs).
 * Une entrée de niveau 1 vise le chapitre de même titre ; une entrée de niveau 2,
 * l'intertitre de même texte dans le chapitre de l'entrée précédente (les « À vous de
 * jouer » répétés restent ainsi dans le bon module), sinon dans tout le livre.
 * Une entrée introuvable reste du texte simple.
 * @param chapters - Chapitres convertis, dans l'ordre du livre
 *
 * Exemple : linkContents(chapitres) — « <p class="sommaire-1">Préface</p> » devient
 *           « <p class="sommaire-1" data-chapitre="4" data-bloc="0">Préface</p> »
 */
export function linkContents(chapters: ConvertedChapter[]): void {
  const titles = chapters.map((chapter) => comparable(chapter.title));
  let current: Target | null = null;

  /** Intertitre recherché d'abord après l'entrée précédente, puis dans tout le livre. */
  const locate = (text: string): Target | null => {
    if (current) {
      const block = findSubheading(chapters[current.chapter - 1].blocks, text, current.block);
      if (block >= 0) return { chapter: current.chapter, block };
    }
    for (let index = 0; index < chapters.length; index++) {
      const block = findSubheading(chapters[index].blocks, text, 0);
      if (block >= 0) return { chapter: index + 1, block };
    }
    return null;
  };

  for (const chapter of chapters) {
    chapter.blocks = chapter.blocks.map((block) => {
      const match = ENTRY.exec(block);
      if (!match) return block;
      const [, level, label] = match;
      const text = comparable(label);
      const titled = titles.indexOf(text);
      let target: Target | null = null;
      if (level === "sommaire-1" && titled >= 0) target = { chapter: titled + 1, block: 0 };
      else target = locate(text) ?? (titled >= 0 ? { chapter: titled + 1, block: 0 } : null);
      if (!target) return block;
      current = target;

      const kicker = KICKER.exec(chapters[target.chapter - 1].blocks[0] ?? "");
      const prefix =
        level === "sommaire-1" && target.block === 0 && kicker
          ? `<span class="sommaire-surtitre">${kicker[1]}</span> `
          : "";
      return (
        `<p class="${level}" data-chapitre="${target.chapter}" data-bloc="${target.block}">` +
        `${prefix}${label}</p>`
      );
    });
  }
}
