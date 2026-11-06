/**
 * =============================================================
 *  Fichier    : guide-visuals.tsx
 *  Projet     : Kalami Données
 *  Description: Visuels du chantier BRVM : schéma de modèle (dimensions → faits) dessiné
 *               en SVG à partir de ses relations, maquette de l'éditeur Power Query et
 *               maquette de la fenêtre de fusion. Ce sont des repères pour se situer
 *               avant d'ouvrir Power BI Desktop, pas des captures : tout est en texte,
 *               donc lisible par un lecteur d'écran et net à toutes les tailles.
 *               v1.1 (v0.21.0) : classes de la charte powerbi4you (powerbi.css) ; barre
 *               de formule sous les volets, comme dans le guide d'origine.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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
    <figure className="schema-wrap">
      <svg
        viewBox={`0 0 ${LARGEUR} ${hauteur}`}
        role="img"
        aria-label={bloc.legende ?? "Schéma du modèle"}
      >
        {liens.map((lien, i) => {
          const nb = paires.get(lien.cle) ?? 1;
          const dy = (lien.rang - (nb - 1) / 2) * DECALAGE_LIEN;
          const y1 = hautBoite(lien.de, bloc.gauche.length, total) + BOITE_H / 2 + dy;
          const y2 = hautBoite(lien.vers, bloc.droite.length, total) + BOITE_H / 2 + dy;
          return (
            <g key={i}>
              <line
                x1={xLienG}
                y1={y1}
                x2={xDroite}
                y2={y2}
                className="lien"
                strokeWidth={1.5}
                strokeDasharray={lien.inactif ? "5 4" : undefined}
              />
              <text x={xLienG + 6} y={y1 - 4} fontSize={11} className="lien-texte">
                1
              </text>
              <text x={xDroite - 12} y={y2 - 4} fontSize={11} className="lien-texte">
                *
              </text>
              {lien.libelle && (
                <text
                  x={(xLienG + xDroite) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fontSize={10.5}
                  textAnchor="middle"
                  className="lien-texte"
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
      {bloc.legende && <figcaption>{bloc.legende}</figcaption>}
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

/** Une table du schéma : dimensions en sarcelle, faits en ocre. */
function Boite({ x, y, nom, dim }: { x: number; y: number; nom: string; dim?: boolean }) {
  return (
    <g className={dim ? "dim" : "fait"}>
      <rect x={x} y={y} width={BOITE_L} height={BOITE_H} rx={6} strokeWidth={1.2} />
      <text x={x + BOITE_L / 2} y={y + BOITE_H / 2 + 4.5} fontSize={13} textAnchor="middle">
        {nom}
      </text>
    </g>
  );
}

// ==================== MAQUETTE POWER QUERY ====================

/**
 * Maquette de l'éditeur Power Query : ruban, requêtes, aperçu, étapes, formule.
 * La grille s'adapte aux volets présents (requêtes et aperçu sont facultatifs).
 */
export function PowerQueryMock({ bloc }: { bloc: PowerQueryMockBlock }) {
  const { onglets, requetes, apercu, etapes, formule } = bloc;
  const corps = [
    "pq-body",
    requetes ? "" : "sans-requetes",
    apercu ? "" : "sans-apercu",
  ].filter(Boolean);
  return (
    <figure className="pq-mock" aria-label="Maquette de l'éditeur Power Query">
      {onglets && (
        <div className="pq-ribbon">
          {onglets.map((onglet, i) => (
            <span key={onglet} className={i === 0 ? "on" : undefined}>
              {onglet}
            </span>
          ))}
        </div>
      )}
      <div className={corps.join(" ")}>
        {requetes && <Requetes requetes={requetes} />}
        {apercu && <Apercu apercu={apercu} />}
        <Etapes etapes={etapes} />
      </div>
      {formule && <BarreFormule formule={formule} />}
    </figure>
  );
}

/** Barre de formule : le préfixe « fx » est mis en relief, comme dans l'éditeur. */
function BarreFormule({ formule }: { formule: string }) {
  if (!formule.startsWith("fx")) return <div className="pq-fx">{formule}</div>;
  return (
    <div className="pq-fx">
      <b>fx</b>
      {formule.slice(2)}
    </div>
  );
}

/** Volet des requêtes, la requête active surlignée. */
function Requetes({ requetes }: { requetes: NonNullable<PowerQueryMockBlock["requetes"]> }) {
  return (
    <div className="pq-col">
      <h4>
        {d.maquette.requetes} [{requetes.noms.length}]
      </h4>
      <ul className="pq-queries">
        {requetes.noms.map((nom) => (
          <li
            key={nom}
            aria-current={nom === requetes.selection ? "true" : undefined}
            className={nom === requetes.selection ? "sel" : undefined}
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
    <div className="pq-col">
      <h4>{apercu.titre}</h4>
      <div className="pq-grid">
        <table>
          <thead>
            <tr>
              {apercu.colonnes.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
            <tr className="typ">
              {apercu.types.map((t, i) => (
                <td key={i}>{t}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {apercu.lignes.map((ligne, i) => (
              <tr key={i}>
                {ligne.map((v, j) => (
                  <td key={j}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {apercu.note && <p className="pq-note">{apercu.note}</p>}
    </div>
  );
}

/** Volet des étapes appliquées ; la dernière est l'étape courante. */
function Etapes({ etapes }: { etapes: PowerQueryMockBlock["etapes"] }) {
  const derniere = etapes.noms.length - 1;
  return (
    <div className="pq-col">
      <h4>{etapes.titre}</h4>
      <ol className="pq-steps">
        {etapes.noms.map((nom, i) => (
          <li
            key={nom}
            aria-current={i === derniere ? "step" : undefined}
            className={i === derniere ? "cur" : undefined}
          >
            {nom}
          </li>
        ))}
      </ol>
      {etapes.note && <p className="pq-note">{etapes.note}</p>}
    </div>
  );
}

// ==================== MAQUETTE DE FUSION ====================

/** Fenêtre « Fusionner des requêtes » : deux tables, leur clé commune, la jointure. */
export function MergeMock({ bloc }: { bloc: MergeMockBlock }) {
  return (
    <figure className="merge-mock" aria-label={d.maquette.fusionTitre}>
      <div className="merge-tables">
        {bloc.tables.map((table) => (
          <div key={table.titre} className="t">
            <h4>{table.titre}</h4>
            <ul>
              {table.colonnes.map((col) => (
                <li key={col} className={col === table.cle ? "col match" : "col"}>
                  {col}
                  {col === table.cle && <span className="sr-only"> ({d.maquette.cle})</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="merge-join" role="group" aria-label={d.maquette.jointure}>
        {bloc.jointures.map((j) => (
          <span
            key={j}
            aria-current={j === bloc.choisie ? "true" : undefined}
            className={j === bloc.choisie ? "on" : undefined}
          >
            {j}
          </span>
        ))}
      </div>
    </figure>
  );
}
