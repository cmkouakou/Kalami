/**
 * =============================================================
 *  Fichier    : guide-visuals.tsx
 *  Projet     : Kalami Données
 *  Description: Visuels du chantier BRVM : schéma de modèle (dimensions → faits) dessiné
 *               en SVG à partir de ses relations, maquette de l'éditeur Power Query et
 *               maquette de la fenêtre de fusion. Ce sont des repères pour se situer
 *               avant d'ouvrir Power BI Desktop, pas des captures : tout est en texte,
 *               donc lisible par un lecteur d'écran et net à toutes les tailles.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts, i18n
 * =============================================================
 */

import { getPowerbiDictionary } from "@/i18n/powerbi";
import type { MergeMockBlock, PowerQueryMockBlock, SchemaBlock } from "@/lib/powerbi/content";

const d = getPowerbiDictionary();

// ==================== SCHÉMA DE MODÈLE ====================

/** Géométrie du schéma, en unités du viewBox. */
const LARGEUR = 520;
const BOITE_L = 170;
const BOITE_H = 34;
const ECART = 14;
const MARGE = 8;
/** Décalage vertical entre deux relations reliant les mêmes tables. */
const DECALAGE_LIEN = 12;

/** Ordonnée du haut de la boîte de rang `i` dans une colonne de `n` boîtes. */
function hautBoite(i: number, n: number, total: number): number {
  const hauteurColonne = n * BOITE_H + (n - 1) * ECART;
  const hauteurMax = total * BOITE_H + (total - 1) * ECART;
  return MARGE + (hauteurMax - hauteurColonne) / 2 + i * (BOITE_H + ECART);
}

/**
 * Schéma dimensions → faits.
 * Les relations parallèles (même paire de tables) sont écartées verticalement ;
 * une relation inactive est tracée en pointillé, comme dans la vue Modèle.
 */
export function SchemaDiagram({ bloc }: { bloc: SchemaBlock }) {
  const total = Math.max(bloc.gauche.length, bloc.droite.length);
  const hauteur = MARGE * 2 + total * BOITE_H + (total - 1) * ECART;
  const xDroite = LARGEUR - MARGE - BOITE_L;
  const xLienG = MARGE + BOITE_L;

  // Rang de chaque relation parmi celles qui relient la même paire
  const paires = new Map<string, number>();
  const liens = bloc.liens.map((lien) => {
    const cle = `${lien.de}-${lien.vers}`;
    const rang = paires.get(cle) ?? 0;
    paires.set(cle, rang + 1);
    return { ...lien, rang, cle };
  });

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${LARGEUR} ${hauteur}`}
        className="w-full max-w-2xl"
        role="img"
        aria-label={bloc.legende ?? "Schéma du modèle"}
      >
        {liens.map((lien, i) => {
          const nb = paires.get(lien.cle) ?? 1;
          const dy = (lien.rang - (nb - 1) / 2) * DECALAGE_LIEN;
          const y1 = hautBoite(lien.de, bloc.gauche.length, total) + BOITE_H / 2 + dy;
          const y2 = hautBoite(lien.vers, bloc.droite.length, total) + BOITE_H / 2 + dy;
          return (
            <g key={i} className="text-ink-muted">
              <line
                x1={xLienG}
                y1={y1}
                x2={xDroite}
                y2={y2}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray={lien.inactif ? "5 4" : undefined}
              />
              <text x={xLienG + 6} y={y1 - 4} fontSize={11} fill="currentColor">
                1
              </text>
              <text x={xDroite - 12} y={y2 - 4} fontSize={11} fill="currentColor">
                *
              </text>
              {lien.libelle && (
                <text
                  x={(xLienG + xDroite) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fontSize={10.5}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {lien.libelle}
                </text>
              )}
            </g>
          );
        })}
        {bloc.gauche.map((nom, i) => (
          <Boite key={nom} x={MARGE} y={hautBoite(i, bloc.gauche.length, total)} nom={nom} dim />
        ))}
        {bloc.droite.map((nom, i) => (
          <Boite key={nom} x={xDroite} y={hautBoite(i, bloc.droite.length, total)} nom={nom} />
        ))}
      </svg>
      {bloc.legende && (
        <figcaption className="text-caption text-ink-muted">{bloc.legende}</figcaption>
      )}
      {/* Les relations en texte, pour un lecteur d'écran */}
      <ul className="sr-only">
        {bloc.liens.map((lien, i) => (
          <li key={i}>
            {bloc.gauche[lien.de]} → {bloc.droite[lien.vers]}
            {lien.libelle ? ` (${lien.libelle})` : ""}
            {lien.inactif ? " — relation inactive" : ""}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Une table du schéma ; les dimensions sont teintées encre. */
function Boite({ x, y, nom, dim }: { x: number; y: number; nom: string; dim?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={BOITE_L}
        height={BOITE_H}
        rx={6}
        className={dim ? "fill-encre-soft stroke-encre" : "fill-sand stroke-line"}
        strokeWidth={1.2}
      />
      <text
        x={x + BOITE_L / 2}
        y={y + BOITE_H / 2 + 4.5}
        fontSize={13}
        textAnchor="middle"
        className={dim ? "fill-encre font-mono" : "fill-ink font-mono"}
      >
        {nom}
      </text>
    </g>
  );
}

// ==================== MAQUETTE POWER QUERY ====================

/** Petit titre de zone, en capitales comme dans l'éditeur. */
const ZONE_TITRE = "px-3 py-2 text-caption uppercase text-ink-muted border-b border-line";

/** Trois volets côte à côte dès la tablette ; empilés sur mobile. */
const GRILLE_COMPLETE =
  "md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,13rem)]";

/** Maquette de l'éditeur Power Query : ruban, requêtes, aperçu, étapes, formule. */
export function PowerQueryMock({ bloc }: { bloc: PowerQueryMockBlock }) {
  const { onglets, requetes, apercu, etapes, formule } = bloc;
  return (
    <figure
      className="overflow-hidden rounded-lg border border-line bg-surface text-small"
      aria-label="Maquette de l'éditeur Power Query"
    >
      {onglets && (
        <div className="flex flex-wrap gap-1 border-b border-line bg-sand px-2 py-1.5">
          {onglets.map((onglet, i) => (
            <span
              key={onglet}
              className={
                i === 0
                  ? "rounded-sm bg-surface px-2 py-0.5 font-semibold text-encre"
                  : "px-2 py-0.5 text-ink-muted"
              }
            >
              {onglet}
            </span>
          ))}
        </div>
      )}
      {formule && (
        <p className="border-b border-line px-3 py-1.5 font-mono text-caption text-ink-muted">
          {formule}
        </p>
      )}
      <div className={`grid gap-px bg-line ${requetes && apercu ? GRILLE_COMPLETE : ""}`}>
        {requetes && <Requetes requetes={requetes} />}
        {apercu && <Apercu apercu={apercu} />}
        <Etapes etapes={etapes} />
      </div>
    </figure>
  );
}

/** Volet des requêtes, la requête active surlignée. */
function Requetes({ requetes }: { requetes: NonNullable<PowerQueryMockBlock["requetes"]> }) {
  return (
    <div className="bg-surface">
      <p className={ZONE_TITRE}>
        {d.maquette.requetes} [{requetes.noms.length}]
      </p>
      <ul className="flex flex-col py-1 font-mono text-caption">
        {requetes.noms.map((nom) => (
          <li
            key={nom}
            aria-current={nom === requetes.selection ? "true" : undefined}
            className={
              nom === requetes.selection
                ? "bg-encre-soft px-3 py-1 font-semibold text-encre"
                : "px-3 py-1"
            }
          >
            {nom}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Aperçu des données : en-têtes, ligne des types, premières lignes. */
function Apercu({ apercu }: { apercu: NonNullable<PowerQueryMockBlock["apercu"]> }) {
  return (
    <div className="min-w-0 bg-surface">
      <p className={ZONE_TITRE}>{apercu.titre}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-caption">
          <thead>
            <tr className="border-b border-line text-left">
              {apercu.colonnes.map((c) => (
                <th key={c} scope="col" className="px-3 py-1.5 font-semibold text-encre">
                  {c}
                </th>
              ))}
            </tr>
            <tr className="border-b border-line text-left text-ocre-text">
              {apercu.types.map((t, i) => (
                <td key={i} className="px-3 py-1">
                  {t}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {apercu.lignes.map((ligne, i) => (
              <tr key={i} className="border-b border-line last:border-b-0">
                {ligne.map((v, j) => (
                  <td key={j} className="px-3 py-1">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {apercu.note && <p className="px-3 py-2 text-caption text-ink-muted">{apercu.note}</p>}
    </div>
  );
}

/** Volet des étapes appliquées ; la dernière est l'étape courante. */
function Etapes({ etapes }: { etapes: PowerQueryMockBlock["etapes"] }) {
  const derniere = etapes.noms.length - 1;
  return (
    <div className="bg-surface">
      <p className={ZONE_TITRE}>{etapes.titre}</p>
      <ol className="flex flex-col py-1 text-caption">
        {etapes.noms.map((nom, i) => (
          <li
            key={nom}
            aria-current={i === derniere ? "step" : undefined}
            className={
              i === derniere
                ? "bg-encre-soft px-3 py-1 font-semibold text-encre"
                : "px-3 py-1"
            }
          >
            {nom}
          </li>
        ))}
      </ol>
      {etapes.note && <p className="px-3 pb-2 text-caption text-ink-muted">{etapes.note}</p>}
    </div>
  );
}

// ==================== MAQUETTE DE FUSION ====================

/** Fenêtre « Fusionner des requêtes » : deux tables, leur clé commune, la jointure. */
export function MergeMock({ bloc }: { bloc: MergeMockBlock }) {
  return (
    <figure
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 text-small"
      aria-label={d.maquette.fusionTitre}
    >
      <p className="text-caption uppercase text-ink-muted">{d.maquette.fusionTitre}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {bloc.tables.map((table) => (
          <div key={table.titre} className="overflow-hidden rounded-md border border-line">
            <p className="border-b border-line bg-sand px-3 py-1.5 font-semibold">
              {table.titre}
            </p>
            <ul className="flex flex-wrap gap-1.5 p-2 font-mono text-caption">
              {table.colonnes.map((col) => (
                <li
                  key={col}
                  className={
                    col === table.cle
                      ? "rounded-sm border border-encre bg-encre-soft px-2 py-1 text-encre"
                      : "rounded-sm border border-line px-2 py-1"
                  }
                >
                  {col}
                  {col === table.cle && <span className="sr-only"> ({d.maquette.cle})</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-caption text-ink-muted">{d.maquette.jointure} :</span>
        {bloc.jointures.map((j) => (
          <span
            key={j}
            aria-current={j === bloc.choisie ? "true" : undefined}
            className={
              j === bloc.choisie
                ? "rounded-full bg-encre px-3 py-1 text-caption text-on-encre"
                : "rounded-full bg-sand px-3 py-1 text-caption text-ink-muted"
            }
          >
            {j}
          </span>
        ))}
      </div>
    </figure>
  );
}
