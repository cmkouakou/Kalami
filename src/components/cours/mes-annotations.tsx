/**
 * =============================================================
 *  Fichier    : mes-annotations.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Liste « Mes annotations » : surlignages et notes de toutes les leçons,
 *               regroupés par module puis par leçon, avec recherche (passage ou note),
 *               filtre de couleur, lien vers le passage dans sa leçon et retrait.
 *               Même logique que le panneau d'annotations de la liseuse des livres.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: lib/reader/annotations.ts, lib/cours/{actions,modules}.ts, cours.css
 * =============================================================
 */

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { BUTTON_SECONDARY, CARD, CONTROL } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { supprimerAnnotation } from "@/lib/cours/actions";
import { LECONS, adresseLecon, leconParId } from "@/lib/cours/modules";
import { filterHighlights, groupByChapter, shareExcerpt } from "@/lib/reader/annotations";
import { HIGHLIGHT_COLORS, type Highlight, type HighlightColor } from "@/lib/reader/types";

const t = getCourseDictionary();
const a = t.annotations;

/** Bouton de retrait : cible tactile de 44 px au moins. */
const BOUTON_RETRAIT =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-muted " +
  "hover:text-danger";

/** Groupe d'affichage : un module et ses leçons annotées. */
type GroupeModule = {
  moduleId: string;
  titre: string;
  lecons: { rang: number; titre: string; adresse: string; items: Highlight[] }[];
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Regroupe les annotations par leçon (rang dans le cours), puis par module.
 * @param annotations - Annotations filtrées (chapter = rang de la leçon, 1 à 52)
 */
function grouper(annotations: Highlight[]): GroupeModule[] {
  const groupes: GroupeModule[] = [];
  for (const g of groupByChapter(annotations)) {
    const lecon = LECONS[g.chapter - 1];
    const trouve = lecon ? leconParId(lecon.id) : null;
    if (!trouve) continue;
    const { module: mod } = trouve;
    let groupe = groupes.at(-1);
    if (groupe?.moduleId !== mod.id) {
      groupe = {
        moduleId: mod.id,
        titre: `${interpolate(t.accueil.module, { n: String(mod.numero) })} — ${mod.titre}`,
        lecons: [],
      };
      groupes.push(groupe);
    }
    groupe.lecons.push({
      rang: g.chapter,
      titre: `${mod.numero}.${trouve.lecon.numero} ${trouve.lecon.titre}`,
      adresse: adresseLecon(mod, trouve.lecon),
      items: g.items,
    });
  }
  return groupes;
}

// ==================== LISTE ====================

/** Annotations de l'apprenant, avec recherche, filtre et retrait. */
export function MesAnnotations({ initiales }: { initiales: Highlight[] }) {
  const [liste, setListe] = useState(initiales);
  const [requete, setRequete] = useState("");
  const [couleur, setCouleur] = useState<HighlightColor | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();

  if (liste.length === 0) {
    return <p className={`${CARD} p-6 text-ink-muted`}>{a.vide}</p>;
  }

  const visibles = filterHighlights(liste, requete, couleur);
  const groupes = grouper(visibles);

  /** Retire un surlignage (et sa note) après réponse du serveur. */
  const retirer = (id: string) => {
    setAvis(null);
    startEnvoi(async () => {
      const r = await supprimerAnnotation(id);
      if (!r.ok) {
        setAvis(r.error);
        return;
      }
      setListe((l) => l.filter((h) => h.id !== id));
      setAvis(a.retire);
    });
  };

  /** Bouton de filtre (null : toutes les couleurs). */
  const boutonCouleur = (valeur: HighlightColor | null) => (
    <button
      key={valeur ?? "toutes"}
      type="button"
      onClick={() => setCouleur(valeur)}
      aria-pressed={couleur === valeur}
      className={`${BUTTON_SECONDARY} inline-flex min-h-11 items-center gap-2 ${
        couleur === valeur ? "ring-2 ring-encre" : ""
      }`}
    >
      {valeur && (
        <span data-couleur={valeur} className="liseuse-pastille size-4 rounded-full border" />
      )}
      {valeur ? a.couleurs[valeur] : a.toutes}
    </button>
  );

  return (
    <div className="cours-lecon flex flex-col gap-6">
      {/* ==================== RECHERCHE ET FILTRE ==================== */}
      <div className="flex flex-col gap-3">
        <label htmlFor="recherche-annotations" className="sr-only">
          {a.recherche}
        </label>
        <input
          id="recherche-annotations"
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder={a.recherche}
          className={`${CONTROL} w-full`}
        />
        <div role="group" aria-label={a.filtre} className="flex flex-wrap gap-2">
          {boutonCouleur(null)}
          {HIGHLIGHT_COLORS.map(boutonCouleur)}
        </div>
        <p className="text-small text-ink-muted" aria-live="polite">
          {interpolate(a.nombre, { n: String(visibles.length) })}
        </p>
        <p role="status" className="text-small empty:hidden">
          {avis}
        </p>
      </div>

      {/* ==================== ANNOTATIONS PAR MODULE ==================== */}
      {groupes.length === 0 ? (
        <p className="text-ink-muted">{a.aucune}</p>
      ) : (
        groupes.map((g) => (
          <section key={g.moduleId} className="flex flex-col gap-4">
            <h2 className="font-serif text-h3">{g.titre}</h2>
            {g.lecons.map((l) => (
              <div key={l.rang} className={`${CARD} flex flex-col gap-2 p-5`}>
                <h3 className="font-semibold">
                  <Link href={l.adresse} className="hover:underline">
                    {l.titre}
                  </Link>
                </h3>
                <ul className="flex flex-col divide-y divide-line">
                  {l.items.map((h) => (
                    <li key={h.id} className="flex items-start gap-2 py-2">
                      <Link
                        href={`${l.adresse}#annotation-${h.id}`}
                        aria-label={`${a.ouvrir} : ${shareExcerpt(h.quote, 60)}`}
                        className="flex min-h-11 flex-1 flex-col items-start gap-1"
                      >
                        <span
                          data-couleur={h.color}
                          className="liseuse-annotation line-clamp-3 px-1"
                        >
                          {h.quote}
                        </span>
                        {h.note && (
                          <span className="whitespace-pre-line text-small text-ink-muted">
                            {h.note}
                          </span>
                        )}
                      </Link>
                      <button
                        type="button"
                        onClick={() => retirer(h.id)}
                        disabled={envoi}
                        aria-label={interpolate(a.retirer, {
                          extrait: shareExcerpt(h.quote, 40),
                        })}
                        className={BOUTON_RETRAIT}
                      >
                        <span aria-hidden="true">🗑</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
