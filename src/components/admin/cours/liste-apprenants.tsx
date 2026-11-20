/**
 * =============================================================
 *  Fichier    : liste-apprenants.tsx (admin/cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Liste de tous les inscrits (v0.42.0) : recherche sur le courriel ou le
 *               nom, filtres par cohorte (ou sans cohorte) et par origine, cohorte de
 *               chaque inscrit, dates individuelles déjà posées, cases à cocher (une à
 *               une ou tous les inscrits affichés) qui alimentent le panneau des dates.
 *               Changer de cohorte et retirer l'accès restent sur chaque ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/cours/liste-apprenants.ts, components/admin/cours/*
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ChoixCohorte,
  RetraitAcces,
} from "@/components/admin/cours/actions-apprenant";
import { PanneauDiffusion } from "@/components/admin/cours/panneau-diffusion";
import { BADGE, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import {
  filtrerInscrits,
  numerosElement,
  SANS_COHORTE,
  TOUTES,
  type DateIndividuelle,
  type Filtres,
  type LigneInscrit,
} from "@/lib/cours/liste-apprenants";

const a = getCourseDictionary().admin;
const d = a.diffusionPerso;

/** Dates individuelles montrées par ligne avant « + n autre(s) ». */
const MAX_DATES_LIGNE = 3;

// ==================== DATES D'UNE LIGNE ====================

/**
 * Libellé d'une date individuelle : « Module 5 : ouvre le …, ferme le … ».
 * @param date - Date individuelle de l'apprenant
 */
function libelleDate(date: DateIndividuelle): string {
  const n = numerosElement(date.item);
  const element = !n
    ? date.item
    : n.l === null
      ? interpolate(d.module, { n: String(n.m) })
      : interpolate(d.lecon, { m: String(n.m), l: String(n.l) });
  const parties = [
    date.ouvre ? interpolate(d.ouvre, { date: date.ouvre }) : null,
    date.ferme ? interpolate(d.ferme, { date: date.ferme }) : null,
  ].filter(Boolean);
  return `${element} : ${parties.join(", ")}`;
}

/** Dates individuelles d'un inscrit (les premières, puis le nombre restant). */
function DatesLigne({ dates }: { dates: DateIndividuelle[] | undefined }) {
  if (!dates || dates.length === 0) {
    return <span className="text-ink-muted">{a.liste.aucuneDate}</span>;
  }
  const reste = dates.length - MAX_DATES_LIGNE;
  return (
    <ul className="flex flex-col gap-1 text-small">
      {dates.slice(0, MAX_DATES_LIGNE).map((date) => (
        <li key={date.item}>{libelleDate(date)}</li>
      ))}
      {reste > 0 && (
        <li className="text-ink-muted">{interpolate(a.liste.autres, { n: String(reste) })}</li>
      )}
    </ul>
  );
}

// ==================== FILTRES ====================

/** Recherche et filtres au-dessus de la liste. */
function BarreFiltres({
  filtres,
  changer,
  cohortes,
}: {
  filtres: Filtres;
  changer: (f: Filtres) => void;
  cohortes: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-small font-semibold">{a.liste.recherche}</span>
        <input
          type="search"
          value={filtres.recherche}
          onChange={(e) => changer({ ...filtres, recherche: e.target.value })}
          className={CONTROL}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-small font-semibold">{a.liste.filtreCohorte}</span>
        <select
          value={filtres.cohorte}
          onChange={(e) => changer({ ...filtres, cohorte: e.target.value })}
          className={CONTROL}
        >
          <option value={TOUTES}>{a.liste.toutesCohortes}</option>
          <option value={SANS_COHORTE}>{a.sansCohorte}</option>
          {cohortes.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-small font-semibold">{a.liste.filtreOrigine}</span>
        <select
          value={filtres.origine}
          onChange={(e) =>
            changer({ ...filtres, origine: e.target.value as Filtres["origine"] })
          }
          className={CONTROL}
        >
          <option value="">{a.liste.toutesOrigines}</option>
          <option value="purchase">{a.source.purchase}</option>
          <option value="admin_grant">{a.source.admin_grant}</option>
        </select>
      </label>
    </div>
  );
}

// ==================== LISTE ====================

type ListeApprenantsProps = {
  lignes: LigneInscrit[];
  cohortes: { value: string; label: string }[];
  /** Dates individuelles par identifiant de compte. */
  dates: Record<string, DateIndividuelle[]>;
};

/**
 * Panneau des dates, filtres et tableau des inscrits avec sélection.
 * La sélection survit aux changements de filtre (un inscrit masqué reste coché).
 */
export function ListeApprenants({ lignes, cohortes, dates }: ListeApprenantsProps) {
  const [filtres, setFiltres] = useState<Filtres>({
    recherche: "",
    cohorte: TOUTES,
    origine: "",
  });
  const [selection, setSelection] = useState<Set<string>>(() => new Set());
  const affiches = useMemo(() => filtrerInscrits(lignes, filtres), [lignes, filtres]);

  // Seuls les comptes encore inscrits restent sélectionnés (après un retrait d'accès)
  const choisis = lignes.filter((l) => selection.has(l.userId)).map((l) => l.userId);
  const tousCoches = affiches.length > 0 && affiches.every((l) => selection.has(l.userId));

  /** Coche ou décoche un inscrit. */
  const basculer = (id: string, coche: boolean) =>
    setSelection((s) => {
      const copie = new Set(s);
      if (coche) copie.add(id);
      else copie.delete(id);
      return copie;
    });

  /** Coche ou décoche tous les inscrits affichés. */
  const basculerAffiches = (coche: boolean) =>
    setSelection((s) => {
      const copie = new Set(s);
      for (const l of affiches) {
        if (coche) copie.add(l.userId);
        else copie.delete(l.userId);
      }
      return copie;
    });

  return (
    <>
      <PanneauDiffusion selection={choisis} />

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">
          {interpolate(a.liste.titre, { n: String(lignes.length) })}
        </h2>
        <BarreFiltres filtres={filtres} changer={setFiltres} cohortes={cohortes} />
        <div className="flex flex-wrap items-center gap-3 text-small">
          <span role="status">
            {interpolate(a.liste.affiches, {
              n: String(affiches.length),
              total: String(lignes.length),
            })}
          </span>
          <span className="font-semibold">
            {interpolate(a.liste.selectionnes, { n: String(choisis.length) })}
          </span>
          {choisis.length > 0 && (
            <button
              type="button"
              onClick={() => setSelection(new Set())}
              className={BUTTON_TERTIARY}
            >
              {a.liste.effacerSelection}
            </button>
          )}
        </div>

        {affiches.length === 0 ? (
          <p className="text-ink-muted">{a.liste.aucunResultat}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3">
                    <label className="flex min-h-11 items-center">
                      <input
                        type="checkbox"
                        checked={tousCoches}
                        onChange={(e) => basculerAffiches(e.target.checked)}
                        aria-label={a.liste.toutSelectionner}
                        className="size-4"
                      />
                    </label>
                  </th>
                  <th scope="col" className="py-2 pr-4">{a.liste.courriel}</th>
                  <th scope="col" className="py-2 pr-4">{a.liste.origine}</th>
                  <th scope="col" className="py-2 pr-4">{a.liste.depuis}</th>
                  <th scope="col" className="py-2 pr-4">{a.liste.cohorte}</th>
                  <th scope="col" className="py-2 pr-4">{a.liste.dates}</th>
                  <th scope="col" className="py-2">
                    <span className="sr-only">{a.liste.retirer}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {affiches.map((ap) => {
                  const email = ap.email ?? ap.userId;
                  return (
                    <tr key={ap.accessId} className="border-b border-line align-top">
                      <td className="py-3 pr-3">
                        <label className="flex min-h-11 items-start">
                          <input
                            type="checkbox"
                            checked={selection.has(ap.userId)}
                            onChange={(e) => basculer(ap.userId, e.target.checked)}
                            aria-label={interpolate(a.liste.selectionner, { email })}
                            className="mt-1 size-4"
                          />
                        </label>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/cours/suivi/${ap.userId}`}
                          className="break-all text-encre underline"
                        >
                          {email}
                        </Link>
                        {ap.nom && <p className="text-small text-ink-muted">{ap.nom}</p>}
                      </td>
                      <td className="py-3 pr-4">{a.source[ap.source]}</td>
                      <td className="py-3 pr-4">{ap.depuis}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-2">
                          <span className={`${BADGE} self-start`}>
                            {ap.cohorteNom ?? a.sansCohorte}
                          </span>
                          <ChoixCohorte
                            accessId={ap.accessId}
                            cohorteActuelle={ap.cohorteId}
                            cohortes={cohortes}
                            email={email}
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <DatesLigne dates={dates[ap.userId]} />
                      </td>
                      <td className="py-3">
                        <RetraitAcces
                          accessId={ap.accessId}
                          achat={ap.source === "purchase"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
