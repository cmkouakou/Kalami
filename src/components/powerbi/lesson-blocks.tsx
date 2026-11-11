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
 *               v1.2 (v0.21.0) : classes de la charte powerbi4you (powerbi.css) ; les
 *               blocs sont rendus à plat, comme enfants directs de la carte.
 *  Auteur     : Claude Marcel
 *               v1.3 (v0.21.2) : passages en couleur (pastilles, colonnes mono, code).
 *  Version    : 1.3
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts, inline-text.tsx, guide-visuals.tsx,
 *               guide-checklist.tsx, i18n
 * =============================================================
 */

import { getPowerbiDictionary } from "@/i18n/powerbi";
import type {
  ContentBlock,
  LessonContent,
  ListItem,
  NoteTone,
  SectionTag,
} from "@/lib/powerbi/content";

import { GuideChecklist } from "./guide-checklist";
import {
  ChaineDiagram,
  EtoileDiagram,
  FluxDiagram,
  MergeMock,
  PowerQueryMock,
  SchemaDiagram,
} from "./guide-visuals";
import { InlineText } from "./inline-text";

const d = getPowerbiDictionary();

// ==================== CORRESPONDANCES AVEC LA CHARTE ====================

/** Variante d'encadré de chaque ton (filet ocre par défaut). */
const TON_CLASSE: Record<NoteTone, string> = {
  info: "callout info",
  examen: "callout",
  memo: "callout memo",
  precision: "callout info",
  attention: "callout",
};

/** Intitulé par défaut de chaque ton ; les tons du chantier portent le leur dans le texte. */
const TON_TITRE: Record<NoteTone, string | null> = {
  info: d.encadre.info,
  examen: d.encadre.examen,
  memo: d.encadre.memo,
  precision: null,
  attention: null,
};

/** Classe d'étiquette de chaque nature de section. */
const ETIQUETTE_CLASSE: Record<SectionTag, string> = {
  pratique: "action",
  info: "info",
  repere: "recap",
};

/** Progression du lecteur, pour les cases à cocher d'un sprint. */
export type Progression = { coches: string[]; enregistrable: boolean };

type Props = { contenu: LessonContent; progression?: Progression };

type Carte = Extract<ContentBlock, { kind: "cartes" }>["cartes"][number];

// ==================== COMPOSANTS EXPORTÉS ====================

/** Rend la suite des blocs d'une leçon ou d'un sprint, à plat dans la carte. */
export function LessonBlocks({ contenu, progression }: Props) {
  return (
    <>
      {contenu.map((bloc, index) => (
        <Bloc key={index} bloc={bloc} progression={progression} />
      ))}
    </>
  );
}

/** Étiquette « Pratique », « Info » ou « Repère » d'un titre de section. */
export function Etiquette({ tag }: { tag: SectionTag }) {
  return (
    <span className={`step-tag ${ETIQUETTE_CLASSE[tag]}`}>{d.chantier.etiquettes[tag]}</span>
  );
}

// ==================== BLOCS ====================

/** Rend une liste, ses éléments pouvant porter une sous-liste. */
function Liste({ items, ordonnee }: { items: ListItem[]; ordonnee?: boolean }) {
  const contenu = items.map((item, i) =>
    typeof item === "string" ? (
      <li key={i}>
        <InlineText texte={item} />
      </li>
    ) : (
      <li key={i}>
        <InlineText texte={item.texte} />
        <ul>
          {item.sous.map((s, j) => (
            <li key={j}>
              <InlineText texte={s} />
            </li>
          ))}
        </ul>
      </li>
    ),
  );
  return ordonnee ? <ol>{contenu}</ol> : <ul>{contenu}</ul>;
}

/** Rend un bloc selon son type. */
function Bloc({ bloc, progression }: { bloc: ContentBlock; progression?: Progression }) {
  switch (bloc.kind) {
    case "titre":
      return (
        <h3 className="section">
          {bloc.numero && <span className="n">{bloc.numero}</span>}
          <span>
            <InlineText texte={bloc.texte} />
          </span>
          {bloc.etiquette && <Etiquette tag={bloc.etiquette} />}
        </h3>
      );

    case "paragraphe":
      return (
        <p className={bloc.discret ? "discret" : undefined}>
          <InlineText texte={bloc.texte} />
        </p>
      );

    case "liste":
      return <Liste items={bloc.items} ordonnee={bloc.ordonnee} />;

    case "tableau":
      return <Tableau bloc={bloc} />;

    case "encadre":
      return <Encadre bloc={bloc} />;

    case "code":
      return (
        <pre className="codebox">
          <code>
            <CodeColore texte={bloc.texte} accents={bloc.accents} />
          </code>
        </pre>
      );

    case "notion":
      return (
        <details className="glossary">
          <summary>
            <span className="ico" aria-hidden="true" />
            <span>
              <InlineText texte={bloc.titre} />
            </span>
            <span className="tag">{bloc.etiquette ?? d.chantier.notion}</span>
          </summary>
          <div className="body">
            <LessonBlocks contenu={bloc.contenu} />
          </div>
        </details>
      );

    case "references":
      return (
        <p className="msref">
          <span className="ms">{d.chantier.references}</span>
          {bloc.liens.map((lien, i) => (
            <span key={lien.url}>
              {i > 0 && " · "}
              <a href={lien.url} target="_blank" rel="noopener noreferrer">
                {lien.texte}
              </a>
            </span>
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
      return <Cartes cartes={bloc.cartes} />;

    case "schema":
      return <SchemaDiagram bloc={bloc} />;

    case "etoile":
      return <EtoileDiagram bloc={bloc} />;

    case "flux":
      return <FluxDiagram bloc={bloc} />;

    case "chaine":
      return <ChaineDiagram bloc={bloc} />;

    case "maquette-power-query":
      return <PowerQueryMock bloc={bloc} />;

    case "maquette-fusion":
      return <MergeMock bloc={bloc} />;
  }
}

/** Encadré : intitulé en gras dans la première phrase, puis points éventuels. */
function Encadre({ bloc }: { bloc: Extract<ContentBlock, { kind: "encadre" }> }) {
  const intitule = bloc.titre ?? TON_TITRE[bloc.ton];
  return (
    <aside className={TON_CLASSE[bloc.ton]}>
      <p>
        {intitule && <b>{intitule} : </b>}
        <InlineText texte={bloc.texte} />
      </p>
      {bloc.points && <Liste items={bloc.points} />}
    </aside>
  );
}

/**
 * Cartes côte à côte : deux options comparées (.decide) ou un ensemble de pages (.board).
 * @param cartes - Cartes du bloc
 */
function Cartes({ cartes }: { cartes: Carte[] }) {
  if (cartes.length === 2) {
    return (
      <div className="decide">
        {cartes.map((carte, i) => (
          <div key={i} className={i === 0 ? "box a" : "box b"}>
            <h4>
              <InlineText texte={carte.titre} />
            </h4>
            <ContenuCarte carte={carte} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="board">
      {cartes.map((carte, i) => (
        <div key={i} className="page">
          <h4 className="ptitle">
            <span className={`sw teinte-${i % 3}`} aria-hidden="true" />
            <InlineText texte={carte.titre} />
          </h4>
          <ContenuCarte carte={carte} />
        </div>
      ))}
    </div>
  );
}

/** Texte et points d'une carte. */
function ContenuCarte({ carte }: { carte: Carte }) {
  return (
    <>
      {carte.texte && (
        <p>
          <InlineText texte={carte.texte} />
        </p>
      )}
      {carte.points.length > 0 && <Liste items={carte.points} />}
    </>
  );
}

/** Cellule de tableau : pastille de rôle dans la colonne prévue, texte sinon. */
function Cellule(props: {
  bloc: Extract<ContentBlock, { kind: "tableau" }>;
  ligne: number;
  colonne: number;
  texte: string;
}) {
  const { bloc, ligne, colonne, texte } = props;
  const teinte = bloc.pastilles?.colonne === colonne ? bloc.pastilles.teintes[ligne] : null;
  if (!teinte) return <InlineText texte={texte} />;
  return (
    <span className={`role ${teinte}`}>
      <InlineText texte={texte} />
    </span>
  );
}

/** Échappe un texte pour l'insérer dans une expression régulière. */
function echapper(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Code avec ses passages en couleur, comme dans le guide d'origine.
 * Les mots isolés (CALCULATE, SUM…) ne sont colorés qu'en mot entier.
 * @param props - Texte du code et passages à colorer
 */
function CodeColore({ texte, accents }: { texte: string; accents?: string[] }) {
  if (!accents?.length) return <>{texte}</>;
  const motifs = [...accents]
    .sort((a, b) => b.length - a.length)
    .map((a) => (/^\w+$/.test(a) ? `\\b${echapper(a)}\\b` : echapper(a)));
  const morceaux = texte.split(new RegExp(`(${motifs.join("|")})`, "g"));
  return (
    <>
      {morceaux.map((m, i) =>
        i % 2 === 1 ? (
          <span key={i} className="c">
            {m}
          </span>
        ) : (
          m
        ),
      )}
    </>
  );
}

/** Tableau à en-tête, avec sa légende éventuelle au-dessus. */
function Tableau({ bloc }: { bloc: Extract<ContentBlock, { kind: "tableau" }> }) {
  return (
    <div className="tblwrap">
      <table className="views">
        {bloc.legende && <caption className="axis-title">{bloc.legende}</caption>}
        <thead>
          <tr>
            {bloc.entetes.map((entete, i) => (
              <th key={i} scope="col">
                <InlineText texte={entete} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloc.lignes.map((ligne, i) => (
            <tr key={i}>
              {ligne.map((cellule, j) => (
                <td key={j} className={bloc.colonnesMono?.includes(j) ? "vname" : undefined}>
                  <Cellule bloc={bloc} ligne={i} colonne={j} texte={cellule} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
