/**
 * Fichier    : strategy-plan-export.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests de l'export du plan stratégique (S8b) : document d'export (numérotation
 *              des paragraphes, organisation, Gantt, tableau de bord, annexe, nom de
 *              fichier), mise en page HTML du PDF (échappement, annexes) et fichier DOCX.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/i18n";
import { assemblePlan, type PlanInputs } from "@/lib/strategy/plan-assemble";
import {
  buildPlanExport,
  exportFileName,
  exportGantt,
  exportScorecard,
} from "@/lib/strategy/plan-export";
import { buildPlanDocx } from "@/lib/strategy/plan-export-docx";
import { buildPlanHtml } from "@/lib/strategy/plan-export-html";
import { EMPTY_PROFILE } from "@/lib/strategy/profile";
import { emptyAction, newIndicator, newWorkstream } from "@/lib/strategy/templates/action";
import { emptyChoice } from "@/lib/strategy/templates/choice";
import { emptyDirection } from "@/lib/strategy/templates/direction";
import { editSection } from "@/lib/strategy/templates/plan";
import { emptySynthesis } from "@/lib/strategy/templates/synthesis";

// render.ts (échappement) passe par sanitize.ts, réservé au serveur
vi.mock("server-only", () => ({}));

const e = getDictionary().strategy.plan.export;
const NOW = new Date("2026-10-15T12:00:00.000Z");

// ==================== JEUX DE DONNÉES ====================

/** Matière vide : profil sans réponse et étapes 5 à 8 jamais enregistrées. */
function emptyInputs(): PlanInputs {
  return {
    companyName: "Atelier Nord",
    question: "",
    profile: EMPTY_PROFILE,
    synthesis: emptySynthesis(),
    direction: emptyDirection(),
    choice: emptyChoice(),
    action: emptyAction(),
  };
}

/** Matière avec deux chantiers et des indicateurs (dont un sans nom). */
function actionInputs(): PlanInputs {
  const base = emptyInputs();
  return {
    ...base,
    question: "Comment doubler la clientèle <PME> ?",
    action: {
      ...base.action,
      workstreams: [
        {
          ...newWorkstream("w1"),
          name: "Offre PME",
          owner: "Directrice des ventes",
          start: "2027-01",
          end: "2027-06",
        },
        { ...newWorkstream("w2"), name: "Site web", start: "2027-02", end: "2027-03" },
      ],
      indicators: [
        { ...newIndicator("k1", "customer"), name: "Clients PME", frequency: "quarterly" },
        { ...newIndicator("k2", "financial"), name: "  " },
      ],
    },
  };
}

// ==================== DOCUMENT D'EXPORT ====================

describe("buildPlanExport", () => {
  it("garde le rang d'origine des paragraphes et écarte les paragraphes vides", () => {
    const inputs = emptyInputs();
    const plan = editSection(assemblePlan(inputs, NOW), "risks", [
      { id: "b1", text: "Premier", sources: [] },
      { id: "b2", text: "   ", sources: [] },
      { id: "b3", text: "Troisième", sources: [] },
    ]);
    const doc = buildPlanExport(plan, inputs, NOW);
    const risks = doc.sections.find((section) => section.key === "risks");
    expect(risks?.paragraphs).toEqual([
      { no: 1, text: "Premier" },
      { no: 3, text: "Troisième" },
    ]);
    expect(doc.sections).toHaveLength(8);
  });

  it("renseigne le titre, la date d'export, le pied de page et le nom de fichier", () => {
    const inputs = emptyInputs();
    const doc = buildPlanExport(assemblePlan(inputs, NOW), inputs, NOW);
    expect(doc.title).toBe(e.documentTitle);
    expect(doc.exportedOn).toContain("2026");
    expect(doc.footer).toContain("Atelier Nord");
    expect(doc.fileName).toBe("plan-strategique-atelier-nord");
  });

  it("nomme l'entreprise mère pour une division", () => {
    const inputs = {
      ...emptyInputs(),
      profile: { ...EMPTY_PROFILE, scope: "unit" as const, parentCompany: "Groupe Sud" },
    };
    const doc = buildPlanExport(assemblePlan(inputs, NOW), inputs, NOW);
    expect(doc.organisation).toContain("Atelier Nord");
    expect(doc.organisation).toContain("Groupe Sud");
  });
});

describe("exportFileName", () => {
  it("retire accents et ponctuation, avec un nom de secours", () => {
    expect(exportFileName("Café & Cie")).toBe("plan-strategique-cafe-cie");
    expect(exportFileName("!!!")).toBe("plan-strategique");
  });
});

describe("exportGantt et exportScorecard", () => {
  it("décrit chaque chantier par sa période et marque l'année en tête de colonne", () => {
    const gantt = exportGantt(actionInputs());
    expect(gantt.rows.map((row) => row.name)).toEqual(["Offre PME", "Site web"]);
    expect(gantt.rows[0].owner).toBe("Directrice des ventes");
    expect(gantt.rows[0].span).toBe(6);
    expect(gantt.rows[0].period).toContain("2027");
    expect(gantt.months[0].year).toBe("2027");
  });

  it("n'a aucune ligne sans chantier daté", () => {
    expect(exportGantt(emptyInputs()).rows).toEqual([]);
  });

  it("regroupe les indicateurs nommés par perspective", () => {
    const scorecard = exportScorecard(actionInputs());
    expect(scorecard).toHaveLength(4);
    const customer = scorecard.find((item) => item.key === "customer");
    expect(customer?.indicators.map((item) => item.name)).toEqual(["Clients PME"]);
    expect(customer?.indicators[0].frequency).not.toBe("");
    expect(scorecard.find((item) => item.key === "financial")?.indicators).toEqual([]);
  });
});

// ==================== FICHIERS ====================

describe("buildPlanHtml", () => {
  it("échappe le texte saisi et contient les sections et les annexes", () => {
    const inputs = actionInputs();
    const html = buildPlanHtml(buildPlanExport(assemblePlan(inputs, NOW), inputs, NOW), null);
    expect(html).toContain("&lt;PME&gt;");
    expect(html).not.toContain("<PME>");
    expect(html).toContain(e.ganttTitle);
    expect(html).toContain(e.scorecardTitle);
    expect(html).toContain(e.annexTitle);
    expect(html).toContain("Offre PME");
  });
});

describe("buildPlanDocx", () => {
  it("produit une archive Word non vide", async () => {
    const inputs = actionInputs();
    const bytes = await buildPlanDocx(buildPlanExport(assemblePlan(inputs, NOW), inputs, NOW));
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // Un fichier .docx est une archive ZIP : signature « PK »
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
  });

  it("accepte un plan sans chantier ni indicateur", async () => {
    const inputs = emptyInputs();
    const bytes = await buildPlanDocx(buildPlanExport(assemblePlan(inputs, NOW), inputs, NOW));
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
  });
});
