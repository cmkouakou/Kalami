/**
 * =============================================================
 *  Fichier    : lesson-blocks.tsx
 *  Projet     : Kalami Données
 *  Description: Rendu des blocs de contenu d'une leçon ou d'un sprint du chantier : titres,
 *               paragraphes, listes, tableaux, encadrés, code, notions dépliables,
 *               références, cartes, cases à cocher et visuels. Les encadrés se distinguent
 *               par la couleur de leur filet gauche autant que par leur intitulé, pour
 *               rester lisibles sans dépendre de la seule couleur.
 *               v1.1 (v0.18.0) : blocs du chantier BRVM et balisage en ligne.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts, inline-text.tsx, guide-visuals.tsx,
 *               guide-checklist.tsx, i18n
 * =============================================================
 */

import { BADGE } from "@/components/ui/styles";
import { getPowerbiDictionary } from "@/i18n/powerbi";
import type {
  ContentBlock,
  LessonContent,
  ListItem,
  NoteTone,
  SectionTag,
} from "@/lib/powerbi/content";

import { GuideChecklist } from "./guide-checklist";
import { MergeMock, PowerQueryMock, SchemaDiagram } from "./guide-visuals";
import { InlineText } from "./inline-text";

const d = getPowerbiDictionary();

/** Filet gauche de chaque ton d'encadré. */
const TON_BORDURE: Record<NoteTone, string> = {
  info: "border-l-encre",
  examen: "border-l-ocre",
  memo: "border-l-ink-muted",
  precision: "border-l-encre",
  attention: "border-l-ocre",
};

/** Intitulé par défaut de chaque ton ; les tons du chantier portent le leur dans le texte. */
const TON_TITRE: Record<NoteTone, string | null> = {
  info: d.encadre.info,
  examen: d.encadre.examen,
  memo: d.encadre.memo,
  precision: null,
  attention: null,
};

/** Couleur du badge de chaque nature de section. */
const ETIQUETTE_CLASSE: Record<SectionTag, string> = {
  pratique: "bg-encre-soft text-encre",
  info: "bg-sand text-ink-muted",
  repere: "bg-ocre/15 text-ocre-text",
};

/** Progression du lecteur, pour les cases à cocher d'un sprint. */
export type Progression = { coches: string[]; enregistrable: boolean };

type Props = { contenu: LessonContent; progression?: Progression };

/** Rend la suite des blocs d'une leçon ou d'un sprint. */
export function LessonBlocks({ contenu, progression }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {contenu.map((bloc, index) => (
        <Bloc key={index} bloc={bloc} progression={progression} />
      ))}
    </div>
  );
}

/** Badge « Pratique », « Info » ou « Repère » d'un titre de section. */
export function Etiquette({ tag }: { tag: SectionTag }) {
  return (
    <span className={`${BADGE} ${ETIQUETTE_CLASSE[tag]} align-middle`}>
      {d.chantier.etiquettes[tag]}
    </span>
  );
}

/** Rend une liste, ses éléments pouvant porter une sous-liste. */
function Liste({ items, ordonnee }: { items: ListItem[]; ordonnee?: boolean }) {
  const classes = `max-w-prose flex flex-col gap-1 pl-5 ${ordonnee ? "list-decimal" : "list-disc"}`;
  const contenu = items.map((item, i) =>
    typeof item === "string" ? (
      <li key={i}>
        <InlineText texte={item} />
      </li>
    ) : (
      <li key={i}>
        <InlineText texte={item.texte} />
        <ul className="mt-1 flex list-[circle] flex-col gap-1 pl-5">
          {item.sous.map((s, j) => (
            <li key={j}>
              <InlineText texte={s} />
            </li>
          ))}
        </ul>
      </li>
    ),
  );
  return ordonnee ? <ol className={classes}>{contenu}</ol> : <ul className={classes}>{contenu}</ul>;
}

/** Rend un bloc selon son type. */
function Bloc({ bloc, progression }: { bloc: ContentBlock; progression?: Progression }) {
  switch (bloc.kind) {
    case "titre":
      return (
        <h2
          className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-serif text-h3
            font-semibold text-encre"
        >
          {bloc.numero && (
            <span className="font-sans text-small font-semibold text-ocre-text">
              {bloc.numero}
            </span>
          )}
          <span>
            <InlineText texte={bloc.texte} />
          </span>
          {bloc.etiquette && <Etiquette tag={bloc.etiquette} />}
        </h2>
      );

    case "paragraphe":
      return (
        <p className={bloc.discret ? "max-w-prose text-small text-ink-muted" : "max-w-prose"}>
          <InlineText texte={bloc.texte} />
        </p>
      );

    case "liste":
      return <Liste items={bloc.items} ordonnee={bloc.ordonnee} />;

    case "tableau":
      return <Tableau bloc={bloc} />;

    case "encadre": {
      const intitule = bloc.titre ?? TON_TITRE[bloc.ton];
      return (
        <aside className={`max-w-prose border-l-4 bg-sand px-4 py-3 ${TON_BORDURE[bloc.ton]}`}>
          {intitule && (
            <p className="mb-1 text-caption font-semibold uppercase text-ink-muted">{intitule}</p>
          )}
          <p>
            <InlineText texte={bloc.texte} />
          </p>
          {bloc.points && (
            <div className="mt-2">
              <Liste items={bloc.points} />
            </div>
          )}
        </aside>
      );
    }

    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-encre px-4 py-3 text-small text-on-encre">
          <code>{bloc.texte}</code>
        </pre>
      );

    case "notion":
      return (
        <details className="group max-w-prose rounded-lg border border-line bg-surface">
          <summary
            className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 font-semibold
              text-encre"
          >
            <span className={`${BADGE} bg-encre-soft text-encre`}>
              {bloc.etiquette ?? d.chantier.notion}
            </span>
            <span className="flex-1">
              <InlineText texte={bloc.titre} />
            </span>
            <span
              aria-hidden="true"
              className="text-ink-muted transition-transform group-open:rotate-90"
            >
              ›
            </span>
          </summary>
          <div className="border-t border-line px-4 py-3">
            <LessonBlocks contenu={bloc.contenu} />
          </div>
        </details>
      );

    case "references":
      return (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small">
          <span className="text-caption uppercase text-ink-muted">{d.chantier.references}</span>
          {bloc.liens.map((lien) => (
            <a
              key={lien.url}
              href={lien.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-encre underline underline-offset-2 hover:text-encre-strong"
            >
              {lien.texte}
            </a>
          ))}
        </p>
      );

    case "checklist":
      return (
        <GuideChecklist
          items={bloc.items}
          cochesInitiaux={progression?.coches ?? []}
          enregistrable={progression?.enregistrable ?? false}
        />
      );

    case "cartes":
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bloc.cartes.map((carte, i) => (
            <section
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4"
            >
              <h3 className="font-semibold text-encre">
                <InlineText texte={carte.titre} />
              </h3>
              {carte.texte && (
                <p className="text-small text-ink-muted">
                  <InlineText texte={carte.texte} />
                </p>
              )}
              {carte.points.length > 0 && <Liste items={carte.points} />}
            </section>
          ))}
        </div>
      );

    case "schema":
      return <SchemaDiagram bloc={bloc} />;

    case "maquette-power-query":
      return <PowerQueryMock bloc={bloc} />;

    case "maquette-fusion":
      return <MergeMock bloc={bloc} />;
  }
}

/** Tableau à en-tête, avec sa légende éventuelle au-dessus. */
function Tableau({ bloc }: { bloc: Extract<ContentBlock, { kind: "tableau" }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-small">
        {bloc.legende && (
          <caption className="pb-2 text-left text-caption font-semibold uppercase text-ocre-text">
            {bloc.legende}
          </caption>
        )}
        <thead>
          <tr className="border-b border-line text-left">
            {bloc.entetes.map((entete, i) => (
              <th key={i} scope="col" className="py-2 pr-4 font-semibold text-encre">
                <InlineText texte={entete} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloc.lignes.map((ligne, i) => (
            <tr key={i} className="border-b border-line align-top">
              {ligne.map((cellule, j) => (
                <td key={j} className="py-2 pr-4">
                  <InlineText texte={cellule} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
