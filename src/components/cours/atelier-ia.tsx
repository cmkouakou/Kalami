/**
 * =============================================================
 *  Fichier    : atelier-ia.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Atelier corrigé par l'IA (v0.40.0) : l'apprenant décrit sa propre
 *               décision, répond aux questions de la leçon, choisit sa conclusion, puis
 *               clique sur Correction. Compteur de corrections restantes (5 par
 *               atelier), correction affichée (verdict, points juste / à revoir,
 *               conseil) et historique des corrections précédentes.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/atelier-ia.ts, lib/cours/actions-atelier.ts, i18n/course.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { BUTTON_PRIMARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { corrigerAtelier } from "@/lib/cours/actions-atelier";
import {
  MAX_CORRECTIONS,
  validerSaisie,
  type AtelierIA,
  type ChampAtelier,
  type CorrectionAtelier,
  type HistoriqueAtelier,
  type Saisie,
} from "@/lib/cours/atelier-ia";

const t = getCourseDictionary();

/** Couleur du bandeau selon le verdict. */
const TON_VERDICT: Record<CorrectionAtelier["verdict"], string> = {
  valide: "border-encre bg-encre-soft",
  partiel: "border-ocre bg-sand",
  "a-corriger": "border-danger bg-surface",
};

type Props = {
  leconId: string;
  /** Identifiant local (« a1 »). */
  localId: string;
  atelier: AtelierIA;
  /** Corrections déjà obtenues, la plus récente d'abord. */
  historique: HistoriqueAtelier[];
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Saisie de départ : la dernière réponse corrigée, sinon des champs vides. */
function saisieInitiale(atelier: AtelierIA, historique: HistoriqueAtelier[]): Saisie {
  const derniere = historique[0]?.saisie ?? {};
  return Object.fromEntries(atelier.champs.map((c) => [c.id, derniere[c.id] ?? ""]));
}

/** Libellé d'un champ par son identifiant (pour les points de la correction). */
const libelleChamp = (atelier: AtelierIA, id: string): string =>
  atelier.champs.find((c) => c.id === id)?.libelle.split(" :")[0] ?? id;

/** Date lisible en français (jour, mois, heure). */
const dateLisible = (iso: string): string =>
  new Date(iso).toLocaleString("fr-CA", { dateStyle: "long", timeStyle: "short" });

// ==================== CHAMP DE SAISIE ====================

/** Un champ de l'atelier : zone de texte avec compteur, ou liste de choix. */
function Champ({
  atelier,
  champ,
  valeur,
  onChange,
  desactive,
}: {
  atelier: AtelierIA;
  champ: ChampAtelier;
  valeur: string;
  onChange: (v: string) => void;
  desactive: boolean;
}) {
  const id = `${atelier.id}-${champ.id}`;
  if (champ.type === "choix") {
    return (
      <label htmlFor={id} className="flex flex-col gap-1 font-semibold">
        {champ.libelle}
        <select
          id={id}
          value={valeur}
          disabled={desactive}
          onChange={(e) => onChange(e.target.value)}
          className={`${CONTROL} font-normal sm:max-w-xs`}
        >
          <option value="">{t.ateliers.choisir}</option>
          {champ.options.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {champ.libelle}
      </label>
      <textarea
        id={id}
        rows={champ.id === "decision" ? 2 : 3}
        maxLength={champ.max}
        value={valeur}
        disabled={desactive}
        aria-describedby={`${id}-aide`}
        onChange={(e) => onChange(e.target.value)}
        className={`${CONTROL} text-ink`}
      />
      <p id={`${id}-aide`} className="flex justify-between gap-3 text-small text-ink-muted">
        <span>{champ.aide}</span>
        <span className="shrink-0">
          {interpolate(t.ateliers.caracteres, {
            n: String(valeur.length),
            max: String(champ.max),
          })}
        </span>
      </p>
    </div>
  );
}

// ==================== CORRECTION ====================

/** Correction rendue par l'IA : verdict, résumé, points et conseil. */
function VueCorrection({
  atelier,
  correction,
}: {
  atelier: AtelierIA;
  correction: CorrectionAtelier;
}) {
  const famille =
    t.ateliers.familles[correction.familleAttendue as keyof typeof t.ateliers.familles];
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border-l-4 p-4 ${TON_VERDICT[correction.verdict]}`}
    >
      <p className="font-semibold">{t.ateliers.verdicts[correction.verdict]}</p>
      <p>{correction.resume}</p>
      {famille && (
        <p className="text-small">
          {interpolate(t.ateliers.familleRetenue, { famille })}
        </p>
      )}
      {correction.points.length > 0 && (
        <ul className="flex flex-col gap-2">
          {correction.points.map((p, i) => (
            <li key={`${p.champ}-${i}`} className="flex flex-col gap-0.5">
              <span className="text-small font-semibold">
                {p.statut === "juste" ? "✓ " : "✗ "}
                {libelleChamp(atelier, p.champ)} —{" "}
                {p.statut === "juste" ? t.ateliers.juste : t.ateliers.aRevoir}
              </span>
              <span>{p.explication}</span>
            </li>
          ))}
        </ul>
      )}
      {correction.conseil && (
        <p>
          <span className="font-semibold">{t.ateliers.conseil} : </span>
          {correction.conseil}
        </p>
      )}
    </div>
  );
}

// ==================== ATELIER ====================

/**
 * Atelier corrigé par l'IA, avec son compteur de corrections.
 * Chaque clic sur Correction consomme une correction, sauf en cas d'échec technique.
 */
export function AtelierIACours({ leconId, localId, atelier, historique }: Props) {
  const [saisie, setSaisie] = useState<Saisie>(() => saisieInitiale(atelier, historique));
  const [passees, setPassees] = useState<HistoriqueAtelier[]>(historique);
  const [restantes, setRestantes] = useState(
    Math.max(0, MAX_CORRECTIONS - historique.length),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();

  const derniere = passees[0] ?? null;
  const anciennes = passees.slice(1);
  const epuise = restantes <= 0;
  const max = String(MAX_CORRECTIONS);

  /** Envoie la saisie au correcteur et met à jour le compteur. */
  const corriger = () => {
    if (!validerSaisie(atelier, saisie)) {
      setErreur(interpolate(t.ateliers.incomplet, { min: "15" }));
      return;
    }
    setErreur(null);
    demarrer(async () => {
      try {
        const res = await corrigerAtelier(leconId, localId, saisie);
        if (!res.ok) {
          setErreur(res.error);
          if (res.restantes !== undefined) setRestantes(res.restantes);
          return;
        }
        setPassees((p) => [
          { id: res.id, saisie: { ...saisie }, correction: res.correction, creeLe: res.creeLe },
          ...p,
        ]);
        setRestantes(res.restantes);
      } catch {
        setErreur(t.ateliers.erreur);
      }
    });
  };

  return (
    <section className={`${CARD} flex flex-col gap-4 p-5`} aria-label={atelier.titre}>
      <p className="text-caption font-semibold uppercase text-encre">{t.ateliers.badge}</p>
      <h3 className="font-serif text-h3">{atelier.titre}</h3>
      <p>{atelier.consigne}</p>
      <p className="text-small text-ink-muted">
        {interpolate(t.ateliers.avertissement, { max })}
      </p>

      {atelier.champs.map((champ) => (
        <Champ
          key={champ.id}
          atelier={atelier}
          champ={champ}
          valeur={saisie[champ.id] ?? ""}
          desactive={envoi || epuise}
          onChange={(v) => setSaisie((s) => ({ ...s, [champ.id]: v }))}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={corriger}
          disabled={envoi || epuise}
          className={BUTTON_PRIMARY}
        >
          {envoi ? t.ateliers.envoi : t.ateliers.corriger}
        </button>
        <span className="text-small text-ink-muted">
          {interpolate(t.ateliers.restantes, { n: String(restantes), max })}
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {epuise && <p className="text-small">{interpolate(t.ateliers.epuise, { max })}</p>}
        {erreur && (
          <p role="alert" className="text-small text-danger">
            {erreur}
          </p>
        )}
        {derniere && (
          <>
            <h4 className="font-semibold">{t.ateliers.titreCorrection}</h4>
            <VueCorrection atelier={atelier} correction={derniere.correction} />
          </>
        )}
      </div>

      {anciennes.length > 0 && (
        <details className="rounded-md border border-line p-3">
          <summary className="cursor-pointer text-small font-semibold">
            {interpolate(t.ateliers.historique, { n: String(anciennes.length) })}
          </summary>
          <div className="mt-3 flex flex-col gap-4">
            {anciennes.map((h) => (
              <div key={h.id} className="flex flex-col gap-2">
                <p className="text-small font-semibold">
                  {interpolate(t.ateliers.correctionDu, { date: dateLisible(h.creeLe) })}
                </p>
                <p className="text-small text-ink-muted">
                  {t.ateliers.votreDecision} : {h.saisie.decision}
                </p>
                <VueCorrection atelier={atelier} correction={h.correction} />
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
