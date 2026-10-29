/**
 * Fichier    : strategy-comments.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests de la discussion d'équipe (S9b) sans base : éléments commentables,
 *              repérage des mentions, autocomplétion, regroupement en fils, pastilles,
 *              phrases des notifications, traduction des erreurs SQL et courriel de
 *              mention (échappement HTML, objet sur une ligne).
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it, vi } from "vitest";

import { APP_URL } from "@/lib/config";
import {
  commentError,
  commentTargets,
  countByTarget,
  describeNotification,
  extractMentions,
  findMentions,
  groupThreads,
  mentionQuery,
  mentionSegments,
  type MentionMember,
  type NotificationEntry,
  type StepComment,
} from "@/lib/strategy/comments";
import { buildMentionEmail, commentPath, commentUrl } from "@/lib/strategy/comments-email";
import { PLAN_SECTIONS } from "@/lib/strategy/templates/plan";
import { getStrategyDictionary } from "@/i18n/strategy";

// comments-email.ts et render.ts (échappement) sont réservés au serveur
vi.mock("server-only", () => ({}));

const s = getStrategyDictionary();
const cm = s.comments;

const MEMBERS: MentionMember[] = [
  { id: "u-awa", label: "Awa" },
  { id: "u-awa-kone", label: "Awa Koné" },
  { id: "u-paul", label: "Paul" },
];

/** Commentaire minimal, complété par `extra`. */
function comment(extra: Partial<StepComment> & { id: string }): StepComment {
  return {
    parent_id: null,
    target_id: null,
    target_label: null,
    author_id: "u-awa",
    author_name: "Awa",
    body: "Texte",
    mentions: [],
    created_at: "2026-10-15T10:00:00Z",
    edited_at: null,
    deleted: false,
    resolved_at: null,
    resolver_name: null,
    ...extra,
  };
}

/** Facteur PESTEL valide portant le texte donné. */
function factor(id: string, text: string) {
  return {
    id,
    dimension: "economic",
    factor: text,
    effect: "",
    nature: null,
    source: "",
    quadrant: null,
  };
}

// ==================== ÉLÉMENTS VISÉS ====================

describe("commentTargets", () => {
  it("nomme les facteurs PESTEL par leur texte, raccourci au besoin", () => {
    const long = "a".repeat(80);
    const targets = commentTargets(1, {
      factors: [factor("f1", "  Inflation   forte "), factor("f2", ""), factor("f3", long)],
    });
    expect(targets.map((t) => t.id)).toEqual(["f1", "f2", "f3"]);
    expect(targets[0].label).toBe(`${cm.sections.factor} — Inflation forte`);
    expect(targets[1].label).toBe(`${cm.sections.factor} 2`);
    expect(targets[2].label.endsWith("…")).toBe(true);
    expect(targets[2].label.length).toBeLessThanOrEqual(cm.sections.factor.length + 3 + 60);
  });

  it("ignore un contenu vide ou invalide", () => {
    expect(commentTargets(1, null)).toEqual([]);
    expect(commentTargets(1, { factors: [{ id: "pas un id !" }] })).toEqual([]);
  });

  it("propose les cinq forces de Porter, même sans contenu", () => {
    const ids = commentTargets(2, {}).map((t) => t.id);
    expect(ids).toHaveLength(5);
  });

  it("propose vision, mission, choix générique et énoncé par identifiant fixe", () => {
    expect(commentTargets(6, {}).map((t) => t.id)).toEqual(["vision", "mission"]);
    expect(commentTargets(7, {}).map((t) => t.id)).toEqual(["generic", "statement"]);
  });

  it("propose chaque section du plan", () => {
    expect(commentTargets(9, {}).map((t) => t.id)).toEqual([...PLAN_SECTIONS]);
  });
});

// ==================== MENTIONS ====================

describe("findMentions et extractMentions", () => {
  it("préfère le nom le plus long et ignore la casse", () => {
    const matches = findMentions("Merci @awa koné et @Paul !", MEMBERS);
    expect(matches.map((m) => m.memberId)).toEqual(["u-awa-kone", "u-paul"]);
    expect(matches[0]).toMatchObject({ start: 6, end: 15 });
  });

  it("exige une fin de mot et refuse un @ collé à un mot", () => {
    expect(findMentions("@Pauline", MEMBERS)).toEqual([]);
    expect(findMentions("paul@Paul.ca", MEMBERS)).toEqual([]);
    expect(findMentions("(@Paul)", MEMBERS).map((m) => m.memberId)).toEqual(["u-paul"]);
  });

  it("dédoublonne et limite à 10 personnes", () => {
    expect(extractMentions("@Paul @Paul @Awa", MEMBERS)).toEqual(["u-paul", "u-awa"]);
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `u${i}`, label: `M${i}x` }));
    const body = many.map((m) => `@${m.label}`).join(" ");
    expect(extractMentions(body, many)).toHaveLength(10);
  });
});

describe("mentionSegments", () => {
  it("découpe le texte autour des mentions", () => {
    expect(mentionSegments("Salut @Paul, ok ?", MEMBERS)).toEqual([
      { text: "Salut ", mention: false },
      { text: "@Paul", mention: true },
      { text: ", ok ?", mention: false },
    ]);
    expect(mentionSegments("", MEMBERS)).toEqual([]);
  });
});

describe("mentionQuery", () => {
  it("repère la mention en cours de saisie", () => {
    expect(mentionQuery("Bonjour @Aw", 11)).toEqual({ start: 8, query: "Aw" });
    expect(mentionQuery("@", 1)).toEqual({ start: 0, query: "" });
    expect(mentionQuery("@Awa Ko", 7)).toEqual({ start: 0, query: "Awa Ko" });
  });

  it("ignore les adresses, les retours à la ligne et les textes sans @", () => {
    expect(mentionQuery("awa@exemple", 11)).toBeNull();
    expect(mentionQuery("@Awa\nsuite", 10)).toBeNull();
    expect(mentionQuery("Bonjour", 7)).toBeNull();
    expect(mentionQuery(`@${"a".repeat(41)}`, 42)).toBeNull();
  });
});

// ==================== FILS ====================

describe("groupThreads", () => {
  it("met les fils ouverts d'abord, du plus récemment actif au plus ancien", () => {
    const threads = groupThreads([
      comment({ id: "a", created_at: "2026-10-15T08:00:00Z" }),
      comment({ id: "b", created_at: "2026-10-15T09:00:00Z" }),
      comment({ id: "c", created_at: "2026-10-15T09:30:00Z", resolved_at: "2026-10-15T11:00Z" }),
      comment({ id: "a1", parent_id: "a", created_at: "2026-10-15T10:00:00Z" }),
      comment({ id: "a2", parent_id: "a", created_at: "2026-10-15T10:30:00Z" }),
      comment({ id: "orphelin", parent_id: "inconnu" }),
    ]);
    expect(threads.map((t) => t.root.id)).toEqual(["a", "b", "c"]);
    expect(threads[0].replies.map((r) => r.id)).toEqual(["a1", "a2"]);
  });
});

describe("countByTarget", () => {
  it("compte racines et réponses des fils ouverts, hors supprimés", () => {
    const counts = countByTarget([
      comment({ id: "a", target_id: "f1" }),
      comment({ id: "a1", parent_id: "a" }),
      comment({ id: "b", target_id: "f1", deleted: true }),
      comment({ id: "b1", parent_id: "b" }),
      comment({ id: "c", target_id: "f2", resolved_at: "2026-10-15T11:00:00Z" }),
      comment({ id: "d" }),
    ]);
    expect(counts).toEqual({ f1: 3 });
  });
});

// ==================== NOTIFICATIONS ====================

describe("describeNotification", () => {
  const base: NotificationEntry = {
    id: 1,
    kind: "mention",
    study_id: "e1",
    company_name: "Bois & Fils",
    step_no: 3,
    comment_id: "c1",
    actor_name: "Awa",
    excerpt: "",
    target_label: null,
    read_at: null,
    created_at: "2026-10-15T10:00:00Z",
  };

  it("nomme l'auteur, l'étape et l'entreprise", () => {
    const text = describeNotification(base);
    expect(text).toContain("Awa");
    expect(text).toContain(`3 — ${s.steps[3].title}`);
    expect(text).toContain("Bois & Fils");
  });

  it("remplace un auteur parti et une étape inconnue", () => {
    const text = describeNotification({ ...base, kind: "reply", actor_name: null, step_no: 12 });
    expect(text).toContain(s.team.journal.someone);
    expect(text).toContain("12");
  });
});

describe("commentError", () => {
  it("traduit les erreurs propres aux commentaires puis celles de l'étude", () => {
    expect(commentError({ message: "invalid_parent" })).toBe(cm.errors.invalid_parent);
    expect(commentError({ message: "invalid_step" })).toBe(s.errors.invalid_step);
    expect(commentError({ code: "42501", message: "accès refusé" })).toBe(s.errors.forbidden);
    expect(commentError({ message: "inattendue" })).toBe(s.errors.generic);
  });
});

// ==================== COURRIEL ====================

describe("buildMentionEmail", () => {
  const url = commentUrl("e1", 3, "c1");

  it("construit le chemin et l'adresse du commentaire", () => {
    expect(commentPath("e1", 3, "c1")).toBe("/strategie/etudes/e1/etapes/3#commentaire-c1");
    expect(url).toBe(`${APP_URL}/strategie/etudes/e1/etapes/3#commentaire-c1`);
  });

  it("échappe le texte saisi et garde l'objet sur une ligne", () => {
    const email = buildMentionEmail({
      to: "paul@exemple.ca",
      actorName: "Awa <b>",
      companyName: "Bois & Fils\r\nBcc: x@y.z",
      stepNo: 3,
      body: "<script>alert(1)</script> @Paul",
      url,
    });
    expect(email.to).toBe("paul@exemple.ca");
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Awa &lt;b&gt;");
    expect(email.text).toContain("<script>alert(1)</script> @Paul");
    expect(email.text).toContain(url);
  });

  it("raccourcit un long commentaire", () => {
    const email = buildMentionEmail({
      to: "paul@exemple.ca",
      actorName: "Awa",
      companyName: "Bois",
      stepNo: 1,
      body: "x".repeat(1000),
      url,
    });
    expect(email.text).toContain(`${"x".repeat(399)}…`);
    expect(email.text).not.toContain("x".repeat(400));
  });
});
