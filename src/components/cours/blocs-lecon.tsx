/**
 * =============================================================
 *  Fichier    : blocs-lecon.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Rendu du contenu d'une leçon : titres, paragraphes, listes, tableaux,
 *               encadrés, notions dépliables, schémas, exercices, « Appliquez-le » et
 *               fiche. Chaque passage de texte porte data-bloc (indice continu, dans
 *               l'ordre du contenu) : ancrage des surlignages et unité de la lecture à
 *               voix haute. Les exercices n'en portent pas (pas annotables).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts, schemas.tsx, exercices.tsx, i18n/course.ts
 * =============================================================
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { InlineText } from "@/components/powerbi/inline-text";
import { BUTTON_SECONDARY } from "@/components/ui/styles";
import { interpolate } from "@/i18n";
import { getCourseDictionary } from "@/i18n/course";
import { STRATEGY_HOME } from "@/lib/auth/routes";
import type {
  AppliquezBlock,
  CoursBlock,
  EncadreBlock,
  EncadreTon,
  ListeBlock,
  TableauBlock,
  TexteBlock,
} from "@/lib/cours/content";

import { ExerciceCours } from "./exercices";
import { Schema } from "./schemas";

const t = getCourseDictionary();

/** Distributeur d'indices de blocs, appelé dans l'ordre du rendu. */
type Compteur = () => number;

/** Apparence de chaque ton d'encadré (bordure gauche colorée). */
const TONS: Record<EncadreTon, string> = {
  retenir: "border-encre bg-encre-soft",
  piege: "border-danger bg-surface",
  terrain: "border-ocre bg-sand",
  definition: "border-line bg-surface",
};

// ==================== BLOCS DE TEXTE ====================

/** Liste à puces ou numérotée (un seul bloc annotable). */
function Liste({ bloc, n }: { bloc: ListeBlock; n: number }) {
  const Balise = bloc.ordonnee ? "ol" : "ul";
  return (
    <Balise
      data-bloc={n}
      className={`${bloc.ordonnee ? "list-decimal" : "list-disc"} space-y-1 pl-6`}
    >
      {bloc.items.map((item) => (
        <li key={item}>
          <InlineText texte={item} />
        </li>
      ))}
    </Balise>
  );
}

/** Tableau à en-tête, défilant horizontalement sur petit écran. */
function Tableau({ bloc, n }: { bloc: TableauBlock; n: number }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table data-bloc={n} className="w-full border-collapse text-small">
          <thead className="bg-sand text-left">
            <tr>
              {bloc.entetes.map((e) => (
                <th key={e} scope="col" className="px-3 py-2 font-semibold">
                  <InlineText texte={e} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloc.lignes.map((ligne) => (
              <tr key={ligne.join("|")} className="border-t border-line">
                {ligne.map((cellule, i) => (
                  <td key={`${i}-${cellule}`} className="px-3 py-2 align-top">
                    <InlineText texte={cellule} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bloc.legende && (
        <figcaption className="text-caption text-ink-muted">
          <InlineText texte={bloc.legende} />
        </figcaption>
      )}
    </figure>
  );
}

/** Bloc de texte simple (paragraphe, liste ou tableau). */
function rendreTexte(
  bloc: TexteBlock,
  suivant: Compteur,
  cle: string,
): ReactNode {
  const n = suivant();
  if (bloc.kind === "liste") return <Liste key={cle} bloc={bloc} n={n} />;
  if (bloc.kind === "tableau") return <Tableau key={cle} bloc={bloc} n={n} />;
  return (
    <p key={cle} data-bloc={n}>
      <InlineText texte={bloc.texte} />
    </p>
  );
}

// ==================== ENCADRÉS ====================

/** Encadré : l'étiquette du ton n'est pas annotable, le texte et les points le sont. */
function rendreEncadre(
  bloc: EncadreBlock,
  suivant: Compteur,
  cle: string,
): ReactNode {
  const texte = suivant();
  const points = bloc.points?.length ? suivant() : null;
  return (
    <aside
      key={cle}
      className={`flex flex-col gap-2 rounded-lg border-l-4 p-4 ${TONS[bloc.ton]}`}
    >
      <p className="text-caption font-semibold uppercase">
        {bloc.titre ?? t.encadres[bloc.ton]}
      </p>
      <p data-bloc={texte}>
        <InlineText texte={bloc.texte} />
      </p>
      {points !== null && bloc.points && (
        <Liste bloc={{ kind: "liste", items: bloc.points }} n={points} />
      )}
    </aside>
  );
}

/** « Appliquez-le » : renvoi vers Kalami Stratégie (l'étude se choisit à l'accueil). */
function rendreAppliquez(
  bloc: AppliquezBlock,
  suivant: Compteur,
  cle: string,
): ReactNode {
  const n = suivant();
  const lien = bloc.etape
    ? interpolate(t.encadres.ouvrirEtape, { n: String(bloc.etape) })
    : t.encadres.ouvrirAssistant;
  return (
    <aside
      key={cle}
      className="flex flex-col gap-3 rounded-lg border border-encre p-4"
    >
      <p className="text-caption font-semibold uppercase text-encre">
        {t.encadres.appliquez}
      </p>
      <p data-bloc={n}>
        <InlineText texte={bloc.texte} />
      </p>
      <Link href={STRATEGY_HOME} className={`${BUTTON_SECONDARY} self-start`}>
        {lien}
      </Link>
    </aside>
  );
}

// ==================== RENDU D'UN BLOC ====================

type Contexte = {
  leconId: string;
  meilleures: Record<string, number>;
  /** Numéro du prochain exercice (1, 2, 3…), indépendant des indices de blocs. */
  exercice: () => number;
};

/** Rend un bloc et consomme ses indices dans l'ordre. */
function rendreBloc(
  bloc: CoursBlock,
  suivant: Compteur,
  ctx: Contexte,
  cle: string,
): ReactNode {
  switch (bloc.kind) {
    case "titre":
      return (
        <h2 key={cle} data-bloc={suivant()} className="mt-4 font-serif text-h2">
          <InlineText texte={bloc.texte} />
        </h2>
      );
    case "paragraphe":
    case "liste":
    case "tableau":
      return rendreTexte(bloc, suivant, cle);
    case "encadre":
      return rendreEncadre(bloc, suivant, cle);
    case "notion":
      return (
        <details
          key={cle}
          className="group rounded-lg border border-line bg-surface p-4"
        >
          <summary className="cursor-pointer font-semibold">
            <span data-bloc={suivant()}>{bloc.titre}</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {bloc.contenu.map((b, i) => rendreTexte(b, suivant, `${cle}-${i}`))}
          </div>
        </details>
      );
    case "schema":
      return (
        <figure
          key={cle}
          className="flex flex-col gap-2 rounded-lg bg-surface p-4"
        >
          <SchemaSur id={bloc.schema} />
          <figcaption
            data-bloc={suivant()}
            className="text-small text-ink-muted"
          >
            <InlineText texte={bloc.legende} />
          </figcaption>
        </figure>
      );
    case "exercice": {
      const id = bloc.exercice.id;
      return (
        <ExerciceCours
          key={cle}
          leconId={ctx.leconId}
          numero={ctx.exercice()}
          exercice={bloc.exercice}
          meilleure={ctx.meilleures[id] ?? null}
        />
      );
    }
    case "appliquez":
      return rendreAppliquez(bloc, suivant, cle);
    case "fiche":
      return (
        <section
          key={cle}
          className="flex flex-col gap-2 rounded-lg bg-sand p-5"
        >
          <h2 className="font-serif text-h3">{t.encadres.fiche}</h2>
          <Liste bloc={{ kind: "liste", items: bloc.points }} n={suivant()} />
        </section>
      );
  }
}

/** Schéma isolé de la sélection de texte (dessin, pas du texte à annoter). */
function SchemaSur({ id }: { id: Parameters<typeof Schema>[0]["id"] }) {
  return (
    <div className="select-none">
      <Schema id={id} />
    </div>
  );
}

// ==================== CONTENU COMPLET ====================

type Props = {
  leconId: string;
  contenu: CoursBlock[];
  /** Meilleures notes par exercice (« e1 » → 80). */
  meilleures: Record<string, number>;
};

/**
 * Contenu d'une leçon. Les indices data-bloc sont attribués dans l'ordre : ne pas
 * réordonner les blocs d'une leçon publiée (les surlignages des apprenants en dépendent).
 */
export function BlocsLecon({ leconId, contenu, meilleures }: Props) {
  let bloc = 0;
  let exercice = 0;
  const suivant: Compteur = () => bloc++;
  const ctx: Contexte = { leconId, meilleures, exercice: () => ++exercice };
  return (
    <div className="flex flex-col gap-5 leading-relaxed">
      {contenu.map((b, i) => rendreBloc(b, suivant, ctx, `b${i}`))}
    </div>
  );
}
