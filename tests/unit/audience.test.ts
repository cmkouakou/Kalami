/**
 * Fichier    : audience.test.ts
 * Projet     : Kalami
 * Description: Tests des statistiques de lecture et de visite (v0.16.1) : chemins comptés,
 *              site d'origine, robots, provenance, période, statut d'un lecteur, durées.
 * Auteur     : Claude Marcel
 * Version    : 1.0
 * Date       : 2026-10-28
 */

import { describe, expect, it } from "vitest";

import {
  daysSince,
  formatDuration,
  parsePeriod,
  periodStart,
  readerStatus,
} from "@/lib/analytics/audience";
import {
  countryCode,
  isBot,
  normalizeVisitPath,
  referrerHost,
  sourceKind,
} from "@/lib/analytics/visit";

const NOW = new Date("2026-10-28T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("normalizeVisitPath", () => {
  it("retire les paramètres, masque les identifiants et la barre finale", () => {
    expect(normalizeVisitPath("/livres/mon-livre?ref=x#a")).toBe("/livres/mon-livre");
    expect(
      normalizeVisitPath("/strategie/etudes/6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b/plan"),
    ).toBe("/strategie/etudes/:id/plan");
    expect(normalizeVisitPath("/recherche/")).toBe("/recherche");
    expect(normalizeVisitPath("/")).toBe("/");
  });

  it("ignore l'administration, l'API, la connexion et les chemins invalides", () => {
    expect(normalizeVisitPath("/admin")).toBeNull();
    expect(normalizeVisitPath("/admin/audience")).toBeNull();
    expect(normalizeVisitPath("/api/visite")).toBeNull();
    expect(normalizeVisitPath("/auth/callback")).toBeNull();
    expect(normalizeVisitPath("//pirate.example")).toBeNull();
    expect(normalizeVisitPath("https://pirate.example/")).toBeNull();
    expect(normalizeVisitPath(42)).toBeNull();
    expect(normalizeVisitPath(`/${"a".repeat(250)}`)).toBeNull();
  });

  it("compte /administration (autre page au début semblable)", () => {
    expect(normalizeVisitPath("/administration")).toBe("/administration");
  });
});

describe("referrerHost", () => {
  it("garde le nom d'hôte seul, sans www", () => {
    expect(referrerHost("https://www.google.com/search?q=kalami", "kalami-livres.com")).toBe(
      "google.com",
    );
  });

  it("vide pour un accès direct, interne ou invalide", () => {
    expect(referrerHost("", "kalami-livres.com")).toBe("");
    expect(referrerHost("https://kalami-livres.com/livres", "kalami-livres.com")).toBe("");
    expect(referrerHost("https://www.kalami-livres.com/", "kalami-livres.com")).toBe("");
    expect(referrerHost("pas une adresse", "kalami-livres.com")).toBe("");
  });
});

describe("isBot, sourceKind, countryCode", () => {
  it("écarte les robots et les agents absents", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1")).toBe(false);
  });

  it("classe la provenance par famille", () => {
    expect(sourceKind("")).toBe("direct");
    expect(sourceKind("google.ci")).toBe("search");
    expect(sourceKind("l.facebook.com")).toBe("social");
    expect(sourceKind("t.co")).toBe("social");
    expect(sourceKind("mail.google.com")).toBe("email");
    expect(sourceKind("brvm-analyser.com")).toBe("website");
  });

  it("n'accepte qu'un code pays à 2 lettres", () => {
    expect(countryCode("CI")).toBe("CI");
    expect(countryCode("ci")).toBe("");
    expect(countryCode(null)).toBe("");
  });
});

describe("période et statut", () => {
  it("lit la période demandée, 30 jours par défaut", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod("365")).toBe(365);
    expect(parsePeriod("12")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
    expect(periodStart(7, NOW)).toBe("2026-10-22");
  });

  it("classe une lecture : active, en pause, abandonnée, terminée", () => {
    expect(readerStatus(0.4, daysAgo(2), NOW)).toBe("active");
    expect(readerStatus(0.4, daysAgo(15), NOW)).toBe("paused");
    expect(readerStatus(0.4, daysAgo(45), NOW)).toBe("abandoned");
    expect(readerStatus(0.99, daysAgo(90), NOW)).toBe("finished");
    expect(daysSince(daysAgo(3), NOW)).toBe(3);
  });

  it("affiche une durée lisible", () => {
    expect(formatDuration(42)).toBe("42 s");
    expect(formatDuration(12 * 60)).toBe("12 min");
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe("3 h 05");
  });
});
