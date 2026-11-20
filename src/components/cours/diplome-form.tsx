/**
 * =============================================================
 *  Fichier    : diplome-form.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Formulaire de délivrance du diplôme : l'apprenant saisit le nom à
 *               imprimer et confirme son orthographe (une seule fois ; ensuite, seul
 *               l'administrateur peut le corriger). Le serveur vérifie les conditions
 *               et fige les notes (delivrerDiplome).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/actions.ts, i18n/course.ts
 * =============================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { BUTTON_PRIMARY, CONTROL } from "@/components/ui/styles";
import { getCourseDictionary } from "@/i18n/course";
import { delivrerDiplome } from "@/lib/cours/actions";
import { NOM_MAX, NOM_MIN } from "@/lib/cours/note-finale";

const t = getCourseDictionary();

// ==================== FORMULAIRE ====================

/** Saisie et confirmation du nom, puis délivrance du diplôme. */
export function FormulaireDiplome({ nomPropose }: { nomPropose: string }) {
  const router = useRouter();
  const idNom = useId();
  const idConfirme = useId();
  const [nom, setNom] = useState(nomPropose);
  const [confirme, setConfirme] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();

  /** Envoie le nom confirmé ; la page se recharge avec le diplôme délivré. */
  const envoyer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    startEnvoi(async () => {
      const r = await delivrerDiplome(nom, confirme);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-3">
      <label htmlFor={idNom} className="font-semibold">
        {t.diplome.nomChamp}
      </label>
      <input
        id={idNom}
        type="text"
        value={nom}
        onChange={(e) => {
          setNom(e.target.value);
          setConfirme(false);
        }}
        required
        minLength={NOM_MIN}
        maxLength={NOM_MAX}
        autoComplete="name"
        className={`${CONTROL} w-full`}
      />
      <p className="text-small text-ink-muted">{t.diplome.nomAide}</p>
      <label htmlFor={idConfirme} className="flex items-start gap-2 text-small">
        <input
          id={idConfirme}
          type="checkbox"
          checked={confirme}
          onChange={(e) => setConfirme(e.target.checked)}
          required
          className="mt-1 h-4 w-4"
        />
        {t.diplome.nomConfirmer}
      </label>
      <button
        type="submit"
        disabled={envoi || !confirme}
        className={`${BUTTON_PRIMARY} self-start`}
      >
        {envoi ? t.diplome.envoi : t.diplome.delivrer}
      </button>
      <p role="alert" aria-live="polite" className="text-small text-danger empty:hidden">
        {message}
      </p>
    </form>
  );
}
