/**
 * Fichier    : sw-routes.test.ts
 * Projet     : Kalami
 * Description: Tests des règles du service worker (public/sw-routes.js) : liste blanche de mise
 *              en cache, pages de repli par espace, clé de cache ; et des deux manifestes PWA.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { buildManifest, STRATEGY_MANIFEST_PATH } from "@/lib/pwa/manifest";

// ==================== CHARGEMENT DU SCRIPT ====================

type Classe = "statique" | "image" | "catalogue" | "page" | "ignorer";
interface Routes {
  PAGES_HORS_LIGNE: string[];
  classerRequete: (url: URL, mode: string, origine: string) => Classe;
  pageHorsLigne: (chemin: string) => string;
  cleDePage: (url: URL) => string;
}

/** Exécute sw-routes.js comme le ferait importScripts, dans un bac à sable. */
function chargerRoutes(): Routes {
  const code = readFileSync(join(process.cwd(), "public", "sw-routes.js"), "utf8");
  const bac = { self: {} as { KalamiRoutes?: Routes } };
  runInNewContext(code, bac);
  if (!bac.self.KalamiRoutes) throw new Error("KalamiRoutes absent");
  return bac.self.KalamiRoutes;
}

const routes = chargerRoutes();
const ORIGINE = "https://kalami.test";

/** Raccourci : classe un chemin du site. */
function classer(chemin: string, mode = "navigate"): Classe {
  return routes.classerRequete(new URL(chemin, ORIGINE), mode, ORIGINE);
}

// ==================== CLASSEMENT ====================

describe("classerRequete", () => {
  it("ignore les autres origines", () => {
    const url = new URL("https://projet.supabase.co/storage/v1/object/public/covers/a.jpg");
    expect(routes.classerRequete(url, "no-cors", ORIGINE)).toBe("ignorer");
  });

  it("met en cache les fichiers statiques et la charte", () => {
    expect(classer("/_next/static/chunks/app.js", "no-cors")).toBe("statique");
    expect(classer("/icons/icon-192.png", "no-cors")).toBe("statique");
    expect(classer("/brand/kalami-mark.svg", "no-cors")).toBe("statique");
  });

  it("traite les images optimisées à part", () => {
    expect(classer("/_next/image?url=%2Fx.jpg&w=256&q=75", "no-cors")).toBe("image");
  });

  it("garde les pages publiques du catalogue", () => {
    for (const chemin of [
      "/",
      "/categories/roman",
      "/livres/mon-livre",
      "/auteurs/ama",
      "/confidentialite",
      "/strategie/conditions-de-vente",
    ]) {
      expect(classer(chemin), chemin).toBe("catalogue");
    }
  });

  it("ne garde jamais le contenu des livres, les études, les comptes ni l'administration", () => {
    for (const chemin of [
      "/livres/mon-livre/lire",
      "/apercu/mon-livre",
      "/compte",
      "/admin",
      "/strategie",
      "/strategie/etudes/123",
      "/strategie/compte",
      "/connexion",
    ]) {
      expect(classer(chemin), chemin).toBe("page");
    }
  });

  it("ignore les requêtes qui ne sont pas des navigations (API, actions, HEAD)", () => {
    expect(classer("/api/livres/1/pdf", "cors")).toBe("ignorer");
    expect(classer("/livres/mon-livre", "cors")).toBe("ignorer");
  });
});

// ==================== REPLIS ET CLÉS ====================

describe("pageHorsLigne", () => {
  it("renvoie la page de repli de chaque espace", () => {
    expect(routes.pageHorsLigne("/livres/a/lire")).toBe("/hors-ligne");
    expect(routes.pageHorsLigne("/strategie")).toBe("/strategie/hors-ligne");
    expect(routes.pageHorsLigne("/strategie/etudes/1")).toBe("/strategie/hors-ligne");
    expect(routes.pageHorsLigne("/strategiez")).toBe("/hors-ligne");
  });

  it("enregistre les deux pages de repli à l'installation", () => {
    expect(routes.PAGES_HORS_LIGNE).toEqual(["/hors-ligne", "/strategie/hors-ligne"]);
  });
});

describe("cleDePage", () => {
  it("retire les paramètres de l'adresse", () => {
    expect(routes.cleDePage(new URL("/livres/a?_rsc=xyz", ORIGINE))).toBe(`${ORIGINE}/livres/a`);
  });
});

// ==================== MANIFESTES ====================

describe("buildManifest", () => {
  it("décrit la librairie sur tout le site", () => {
    const m = buildManifest("site");
    expect(m).toMatchObject({ id: "/", start_url: "/", scope: "/", display: "standalone" });
  });

  it("enferme Kalami Stratégie dans /strategie", () => {
    const m = buildManifest("strategy");
    expect(m).toMatchObject({ id: "/strategie", start_url: "/strategie", scope: "/strategie" });
    expect(STRATEGY_MANIFEST_PATH.startsWith("/strategie/")).toBe(true);
  });

  it("fournit une icône masquable de 512 px", () => {
    const icones = buildManifest("site").icons ?? [];
    expect(icones.some((i) => i.purpose === "maskable" && i.sizes === "512x512")).toBe(true);
  });
});
