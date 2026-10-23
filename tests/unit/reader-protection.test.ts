/**
 * =============================================================
 *  Fichier    : reader-protection.test.ts
 *  Projet     : Kalami
 *  Description: Critère d'acceptation n° 5 (cahier §8) : Ctrl+C, clic droit et impression
 *               n'extraient pas le texte de la liseuse. Les écouteurs sont branchés sur de
 *               faux éléments (EventTarget de Node, sans navigateur) ; l'impression est
 *               vérifiée dans la feuille de style de la liseuse.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-22
 *  Dépendances: vitest, components/reader/use-protection.ts
 * =============================================================
 */

import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { attachProtection } from "@/components/reader/use-protection";
import { MAX_QUOTE_LENGTH } from "@/lib/reader/annotations";

// ==================== FAUX DOM ====================

/** Élément minimal : nom de balise et zones (sélecteurs) auxquelles il appartient. */
class FakeElement extends EventTarget {
  isContentEditable = false;
  parentElement: FakeElement | null = null;

  constructor(
    public tagName = "DIV",
    private zones: string[] = [],
  ) {
    super();
  }

  /** Renvoie l'élément si l'un des sélecteurs de la liste désigne l'une de ses zones. */
  closest(selector: string): FakeElement | null {
    const wanted = selector.split(",").map((part) => part.trim());
    return wanted.some((part) => this.zones.includes(part)) ? this : null;
  }

  contains(): boolean {
    return true;
  }
}

/** Sélection simulée : texte sélectionné et élément qui le contient. */
function fakeSelection(text: string, container: FakeElement) {
  const range = {
    startContainer: container,
    endContainer: container,
    commonAncestorContainer: container,
  };
  return {
    isCollapsed: text.length === 0,
    rangeCount: 1,
    getRangeAt: () => range,
    toString: () => text,
    removeAllRanges: vi.fn(),
  };
}

let selection: ReturnType<typeof fakeSelection> | null = null;
const doc = Object.assign(new EventTarget(), { getSelection: () => selection });
let root: FakeElement;
let detach: () => void;

/** Envoie un événement annulable et indique s'il a été bloqué. */
function blocked(target: EventTarget, event: Event): boolean {
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

const cancelable = (name: string) => new Event(name, { cancelable: true });
const shortcut = (key: string) =>
  Object.assign(cancelable("keydown"), { key, ctrlKey: true, metaKey: false });

beforeEach(() => {
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("Element", FakeElement);
  vi.stubGlobal("Node", FakeElement);
  selection = null;
  root = new FakeElement("DIV", [".liseuse"]);
  detach = attachProtection(
    root as unknown as HTMLElement,
    doc as unknown as Document,
  );
});

afterEach(() => {
  detach();
  vi.unstubAllGlobals();
});

// ==================== COPIE ET CLIC DROIT ====================

describe("protection de la liseuse", () => {
  it("bloque le clic droit et le glisser du texte", () => {
    expect(blocked(root, cancelable("contextmenu"))).toBe(true);
    expect(blocked(root, cancelable("dragstart"))).toBe(true);
  });

  it("bloque copier et couper sur le texte du livre", () => {
    selection = fakeSelection("Un passage du livre", new FakeElement("P", [".liseuse-texte"]));
    expect(blocked(doc, cancelable("copy"))).toBe(true);
    expect(blocked(doc, cancelable("cut"))).toBe(true);
  });

  it("bloque Ctrl+C, Ctrl+A, Ctrl+P (impression), Ctrl+S et Ctrl+U", () => {
    for (const key of ["c", "a", "p", "s", "u", "C"]) {
      expect(blocked(doc, shortcut(key))).toBe(true);
    }
  });

  it("laisse les autres raccourcis et la frappe ordinaire", () => {
    expect(blocked(doc, shortcut("f"))).toBe(false);
    const plain = Object.assign(cancelable("keydown"), { key: "c", ctrlKey: false });
    expect(blocked(doc, plain)).toBe(false);
  });

  it("permet de copier une référence à citer, et elle seule", () => {
    const reference = new FakeElement("P", ["[data-selectionnable]"]);
    selection = fakeSelection("Auteur, Titre, 2026", reference);
    expect(blocked(doc, cancelable("copy"))).toBe(false);
    expect(blocked(doc, shortcut("c"))).toBe(false);
  });

  it("n'autorise la sélection que dans le texte du livre", () => {
    expect(blocked(root, cancelable("selectstart"))).toBe(true);
    const text = new FakeElement("DIV", [".liseuse-texte"]);
    detach();
    detach = attachProtection(text as unknown as HTMLElement, doc as unknown as Document);
    expect(blocked(text, cancelable("selectstart"))).toBe(false);
  });

  it("annule une sélection plus longue qu'une citation", () => {
    selection = fakeSelection("x".repeat(MAX_QUOTE_LENGTH + 1), root);
    doc.dispatchEvent(new Event("selectionchange"));
    expect(selection.removeAllRanges).toHaveBeenCalledOnce();

    selection = fakeSelection("x".repeat(MAX_QUOTE_LENGTH), root);
    doc.dispatchEvent(new Event("selectionchange"));
    expect(selection.removeAllRanges).not.toHaveBeenCalled();
  });

  it("retire tous les écouteurs en quittant la liseuse", () => {
    detach();
    expect(blocked(root, cancelable("contextmenu"))).toBe(false);
    expect(blocked(doc, shortcut("c"))).toBe(false);
    detach = () => undefined;
  });
});

// ==================== IMPRESSION ====================

describe("impression de la liseuse", () => {
  const css = readFileSync("src/app/(site)/livres/[slug]/lire/reader.css", "utf8");
  const print = css.slice(css.indexOf("@media print"));

  it("masque toute la page qui contient la liseuse", () => {
    expect(print).toMatch(/^@media print \{\s*body:has\(\.liseuse\) \{\s*visibility: hidden;/);
  });

  it("n'imprime que l'avis de protection", () => {
    expect(css).toMatch(/\.liseuse-impression \{\s*display: none;/);
    expect(print).toMatch(/\.liseuse-impression \{\s*display: block;[^}]*visibility: visible;/);
  });
});
