/**
 * =============================================================
 *  Fichier    : plan-export-files.ts
 *  Projet     : Kalami Stratégie
 *  Description: Production serveur du fichier d'export du plan stratégique (S8b) : lecture
 *               du plan enregistré et de la matière des étapes avec la session du membre
 *               (règles RLS), puis PDF (Chromium, métadonnées) ou DOCX. Rien n'est stocké :
 *               le fichier est renvoyé directement au navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: pdf-lib, lib/pdf/generate.ts, plan-export*.ts, plan-inputs.ts, queries.ts
 * =============================================================
 */

import "server-only";

import { PDFDocument } from "pdf-lib";

import { loadFonts, printHtmlToPdf } from "@/lib/pdf/generate";
import { buildPlanExport, type ExportFormat, type PlanExport } from "@/lib/strategy/plan-export";
import { buildPlanDocx } from "@/lib/strategy/plan-export-docx";
import { buildPlanHtml } from "@/lib/strategy/plan-export-html";
import { getPlanInputs } from "@/lib/strategy/plan-inputs";
import { getStepContent } from "@/lib/strategy/queries";
import { PLAN_STEP } from "@/lib/strategy/steps";
import { isGenerated, readPlan } from "@/lib/strategy/templates/plan";

// ==================== TYPES ====================

export type PlanFile = {
  bytes: Uint8Array;
  contentType: string;
  /** Nom complet, extension comprise. */
  fileName: string;
};

/** Type MIME de chaque format. */
const CONTENT_TYPES: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Imprime le plan en PDF et renseigne ses métadonnées (titre, langue, créateur).
 * @param doc - Document d'export
 */
async function renderPdf(doc: PlanExport): Promise<Uint8Array> {
  const printed = await printHtmlToPdf(buildPlanHtml(doc, await loadFonts()));
  const pdf = await PDFDocument.load(printed);
  pdf.setTitle(`${doc.title} — ${doc.organisation}`, { showInWindowTitleBar: true });
  pdf.setSubject(doc.question);
  pdf.setCreator("Kalami Stratégie — kalami-livres.com");
  pdf.setProducer("Kalami");
  pdf.setLanguage("fr");
  return pdf.save();
}

// ==================== EXPORT ====================

/**
 * Produit le fichier d'export du plan d'une étude.
 *
 * @param studyId - Identifiant de l'étude (UUID déjà vérifié)
 * @param format  - « pdf » ou « docx »
 * @returns Fichier prêt à télécharger, ou null si l'étude est inaccessible au membre ou
 *          si le plan n'a jamais été généré
 */
export async function renderPlanFile(
  studyId: string,
  format: ExportFormat,
): Promise<PlanFile | null> {
  // getPlanInputs lit l'étude avec la session : null si l'utilisateur n'en est pas membre
  const inputs = await getPlanInputs(studyId);
  if (!inputs) return null;
  const plan = readPlan((await getStepContent(studyId, PLAN_STEP)).payload);
  if (!isGenerated(plan)) return null;

  const doc = buildPlanExport(plan, inputs, new Date());
  const bytes = format === "pdf" ? await renderPdf(doc) : await buildPlanDocx(doc);
  return { bytes, contentType: CONTENT_TYPES[format], fileName: `${doc.fileName}.${format}` };
}
