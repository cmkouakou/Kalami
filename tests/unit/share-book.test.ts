/**
 * Fichier    : share-book.test.ts
 * Projet     : Kalami
 * Description: Tests unitaires du partage du lien d'un livre (v0.15.8) : menu natif,
 *              copie du lien à défaut, annulation silencieuse et échec.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-28
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { shareBookLink } from "@/lib/catalog/share";
import { APP_URL } from "@/lib/config";

const BOOK = { slug: "mon-livre", title: "Mon livre", authorName: "Awa" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shareBookLink", () => {
  it("utilise le menu de partage natif avec le lien public du livre", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    expect(await shareBookLink(BOOK)).toBe("shared");
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mon livre", url: `${APP_URL}/livres/mon-livre` }),
    );
  });

  it("copie le texte et le lien sans menu natif", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareBookLink(BOOK)).toBe("copied");
    expect(writeText.mock.calls[0][0]).toContain(`${APP_URL}/livres/mon-livre`);
    expect(writeText.mock.calls[0][0]).toContain("Awa");
  });

  it("distingue l'annulation de l'échec", async () => {
    const abort = new DOMException("annulé", "AbortError");
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(abort) });
    expect(await shareBookLink(BOOK)).toBe("cancelled");
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("refus")) });
    expect(await shareBookLink(BOOK)).toBe("error");
  });
});
