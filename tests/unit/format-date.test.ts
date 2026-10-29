/**
 * Fichier    : format-date.test.ts
 * Projet     : Kalami
 * Description: Tests des formats de date : fuseau d'Abidjan, indépendant du fuseau du poste,
 *              et dates seules (AAAA-MM-JJ) affichées au bon jour.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-29
 */

import { describe, expect, it } from "vitest";

import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  DISPLAY_TIME_ZONE,
  MONTH_YEAR_FORMAT,
  TIME_FORMAT,
} from "@/lib/format/date";

/** Remplace les espaces insécables d'Intl par des espaces simples. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("formats de date", () => {
  it("affichent tous dans le fuseau d'Abidjan", () => {
    expect(DISPLAY_TIME_ZONE).toBe("Africa/Abidjan");
    for (const format of [DATE_FORMAT, DATE_TIME_FORMAT, TIME_FORMAT, MONTH_YEAR_FORMAT]) {
      expect(format.resolvedOptions().timeZone).toBe("Africa/Abidjan");
    }
  });

  it("donnent l'heure d'Abidjan (UTC+0), pas celle du poste", () => {
    // 23 h 30 UTC = 19 h 30 à Montréal : l'heure affichée doit rester 23:30
    const instant = new Date("2026-10-29T23:30:00Z");
    expect(plain(TIME_FORMAT.format(instant))).toBe("23:30");
    expect(plain(DATE_TIME_FORMAT.format(instant))).toBe("29 oct. 2026, 23:30");
  });

  it("gardent le bon jour pour une date seule AAAA-MM-JJ", () => {
    expect(plain(DATE_FORMAT.format(new Date("2026-03-01")))).toBe("1 mars 2026");
    expect(MONTH_YEAR_FORMAT.format(new Date(Date.UTC(2027, 0, 1)))).toBe("janvier 2027");
  });
});
