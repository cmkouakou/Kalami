/**
 * Fichier    : strategy-team.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests du travail en équipe (S9a) sans base : courriel normalisé, rôles
 *              d'invitation, nom affiché, phrases du journal, traduction des erreurs SQL,
 *              jeton et lien d'invitation, courriel d'invitation (échappement, texte brut).
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/i18n";
import { APP_URL } from "@/lib/config";
import {
  ACTIVITY_ACTIONS,
  canBeAssigned,
  describeActivity,
  isActivityAction,
  isInviteRole,
  memberLabel,
  normalizeEmail,
  teamError,
  type ActivityEntry,
} from "@/lib/strategy/team";
import {
  buildInvitationEmail,
  invitationUrl,
  newInvitationToken,
} from "@/lib/strategy/team-email";

// team-email.ts et render.ts (échappement) sont réservés au serveur
vi.mock("server-only", () => ({}));

const s = getDictionary().strategy;
const tm = s.team;

/** Entrée de journal minimale, complétée par `extra`. */
function entry(extra: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: 1,
    action: "step_validated",
    step_no: null,
    actor_name: null,
    target_name: null,
    details: {},
    created_at: "2026-10-15T12:00:00.000Z",
    ...extra,
  };
}

// ==================== RÔLES ET CHAMPS ====================

describe("normalizeEmail", () => {
  it("retire les espaces et met en minuscules", () => {
    expect(normalizeEmail("  Awa.Kone@Exemple.CI ")).toBe("awa.kone@exemple.ci");
  });

  it("refuse un courriel invalide ou trop long", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("awa@exemple")).toBeNull();
    expect(normalizeEmail("awa kone@exemple.ci")).toBeNull();
    expect(normalizeEmail(`${"a".repeat(250)}@x.ci`)).toBeNull();
  });
});

describe("rôles", () => {
  it("n'admet que contributeur et observateur pour une invitation", () => {
    expect(isInviteRole("contributor")).toBe(true);
    expect(isInviteRole("observer")).toBe(true);
    expect(isInviteRole("owner")).toBe(false);
    expect(isInviteRole(undefined)).toBe(false);
  });

  it("réserve la responsabilité d'étape à qui peut la remplir", () => {
    expect(canBeAssigned("owner")).toBe(true);
    expect(canBeAssigned("contributor")).toBe(true);
    expect(canBeAssigned("observer")).toBe(false);
  });

  it("affiche le nom s'il existe, sinon le courriel", () => {
    expect(memberLabel({ display_name: " Awa ", email: "a@x.ci" })).toBe("Awa");
    expect(memberLabel({ display_name: "  ", email: "a@x.ci" })).toBe("a@x.ci");
    expect(memberLabel({ display_name: null, email: "a@x.ci" })).toBe("a@x.ci");
  });
});

// ==================== JOURNAL ====================

describe("describeActivity", () => {
  it("a une phrase pour chaque action", () => {
    for (const action of ACTIVITY_ACTIONS) {
      expect(isActivityAction(action)).toBe(true);
      expect(tm.journal.actions[action]).toBeTruthy();
    }
    expect(isActivityAction("system")).toBe(false);
  });

  it("nomme l'auteur, l'étape et la personne visée", () => {
    const text = describeActivity(
      entry({ action: "step_assigned", step_no: 3, actor_name: "Awa", target_name: "Koffi" }),
    );
    expect(text).toContain("Awa");
    expect(text).toContain("Koffi");
    expect(text).toContain(`3 — ${s.steps[3].title}`);
  });

  it("traduit le rôle et remplace un auteur inconnu", () => {
    const text = describeActivity(
      entry({ action: "member_joined", details: { role: "observer" } }),
    );
    expect(text).toContain(tm.journal.someone);
    expect(text).toContain(s.studies.roles.observer.toLowerCase());
    expect(text).not.toContain("{");
  });
});

// ==================== ERREURS ====================

describe("teamError", () => {
  it("traduit les erreurs d'équipe puis celles de l'étude", () => {
    expect(teamError({ code: "P0001", message: "already_member" })).toBe(
      tm.errors.already_member,
    );
    expect(teamError({ code: "P0001", message: "invalid_step" })).toBe(s.errors.invalid_step);
  });

  it("retombe sur « accès refusé » ou le message générique", () => {
    expect(teamError({ code: "42501", message: "accès refusé" })).toBe(s.errors.forbidden);
    expect(teamError({ code: "XX000", message: "boom" })).toBe(s.errors.generic);
    expect(teamError({})).toBe(s.errors.generic);
  });
});

// ==================== LIEN ET COURRIEL ====================

describe("lien d'invitation", () => {
  it("produit un jeton base64url de 256 bits, différent à chaque appel", () => {
    const token = newInvitationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newInvitationToken()).not.toBe(token);
  });

  it("pointe vers la page d'invitation de l'application", () => {
    expect(invitationUrl("abc_-1")).toBe(`${APP_URL}/strategie/invitation/abc_-1`);
  });
});

describe("buildInvitationEmail", () => {
  const message = buildInvitationEmail({
    to: "awa@exemple.ci",
    inviterName: "Koffi <b>",
    companyName: "Bois & Fils\r\nBcc: x@y.z",
    role: "contributor",
    url: "https://kalami-livres.com/strategie/invitation/abc",
  });

  it("échappe le texte saisi dans le HTML", () => {
    expect(message.html).toContain("Koffi &lt;b&gt;");
    expect(message.html).toContain("Bois &amp; Fils");
    expect(message.html).not.toContain("<b>");
    expect(message.html).toContain('href="https://kalami-livres.com/strategie/invitation/abc"');
  });

  it("retire les retours à la ligne de l'objet", () => {
    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.subject).toContain("Koffi <b>");
  });

  it("fournit un corps texte avec le lien et le rôle", () => {
    expect(message.to).toBe("awa@exemple.ci");
    expect(message.text).toContain("https://kalami-livres.com/strategie/invitation/abc");
    expect(message.text).toContain(s.studies.roles.contributor.toLowerCase());
  });
});
