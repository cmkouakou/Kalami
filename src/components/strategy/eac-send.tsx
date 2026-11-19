/**
 * =============================================================
 *  Fichier    : eac-send.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Bouton « Envoyer à Entrepreneur au Combat » (v0.26.1) : transmet le plan
 *               stratégique de l'étude au dossier EAC lié, où le mentor le publie à
 *               l'entrepreneur. Affiche la date du dernier envoi.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: components/ui/styles, i18n/strategy, lib/format/date
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getStrategyDictionary } from "@/i18n/strategy";
import { DATE_TIME_LONG_FORMAT } from "@/lib/format/date";

const t = getStrategyDictionary().eac.send;

type EacSendProps = {
  studyId: string;
  /** Date du dernier envoi, ou null. */
  sentAt: string | null;
};

/** Bouton d'envoi du plan à EAC. */
export function EacSend({ studyId, sentAt }: EacSendProps) {
  const [busy, setBusy] = useState(false);
  const [lastSent, setLastSent] = useState(sentAt);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  /** Demande au serveur de produire le plan et de le transmettre. */
  async function send() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/strategie/etudes/${studyId}/eac`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as
        | { version?: number; sentAt?: string; message?: string }
        | null;
      if (response.ok && body?.sentAt) {
        setLastSent(body.sentAt);
        setNotice(interpolate(t.done, { version: String(body.version ?? "") }));
      } else if (response.status === 429) {
        setError(t.rateLimited);
      } else {
        setError(body?.message ?? t.failed);
      }
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <p className="text-small">{t.intro}</p>
      <div>
        <button
          type="button"
          className={BUTTON_SECONDARY}
          disabled={busy}
          onClick={() => void send()}
        >
          {busy ? t.sending : lastSent ? t.resend : t.button}
        </button>
      </div>
      {lastSent && (
        <p className="text-small text-ink-muted">
          {interpolate(t.sentOn, { date: DATE_TIME_LONG_FORMAT.format(new Date(lastSent)) })}
        </p>
      )}
      {notice && <p role="status" className="text-small text-success">{notice}</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
    </div>
  );
}
