/**
 * =============================================================
 *  Fichier    : plan-export.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Boutons « Exporter en PDF » et « Exporter en DOCX » du plan stratégique
 *               (S8b) : demande le fichier à la route d'export, puis le télécharge. Le
 *               fichier reprend la version enregistrée : les boutons attendent la fin de la
 *               sauvegarde automatique. Ouvert à tous les membres, observateurs compris.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-22
 *  Dépendances: api/strategie/etudes/[id]/plan/[format], i18n
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY, CARD } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import type { ExportFormat } from "@/lib/strategy/plan-export";

const e = getDictionary().strategy.plan.export;

/** Nom du fichier tiré de l'en-tête Content-Disposition, sinon un nom par défaut. */
function fileNameOf(response: Response, format: ExportFormat): string {
  const header = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(header);
  return match ? match[1] : `plan-strategique.${format}`;
}

/** Fait télécharger un fichier reçu par le navigateur. */
function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Laisse au navigateur le temps de lancer le téléchargement avant de libérer l'URL
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type PlanExportProps = {
  studyId: string;
  /** Vrai tant qu'une modification n'est pas enregistrée. */
  pending: boolean;
};

/** Boutons d'export du plan. */
export function PlanExport({ studyId, pending }: PlanExportProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");

  /**
   * Demande le fichier au serveur puis le télécharge.
   * @param format - « pdf » ou « docx »
   */
  async function exportPlan(format: ExportFormat) {
    setBusy(format);
    setError("");
    try {
      const response = await fetch(`/api/strategie/etudes/${studyId}/plan/${format}`, {
        method: "POST",
      });
      if (response.status === 429) {
        setError(e.rateLimited);
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      download(await response.blob(), fileNameOf(response, format));
    } catch {
      setError(e.failed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="plan-export" className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 id="plan-export" className="font-serif text-h3 font-semibold">{e.title}</h2>
      <p className="text-small text-ink-muted">{e.intro}</p>
      <div className="flex flex-wrap gap-2">
        {(["pdf", "docx"] as const).map((format) => (
          <button
            key={format}
            type="button"
            className={BUTTON_SECONDARY}
            disabled={busy !== null || pending}
            onClick={() => void exportPlan(format)}
          >
            {busy === format ? e.preparing : e[format]}
          </button>
        ))}
      </div>
      {pending && <p className="text-small text-ink-muted">{e.waitSave}</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
    </section>
  );
}
