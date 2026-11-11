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
import type {
  ChaineBlock,
  EtoileBlock,
  FluxBlock,
  MergeMockBlock,
  PowerQueryMockBlock,
  SchemaBlock,
} from "@/lib/powerbi/content";

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

// ==================== SCHÉMA EN ÉTOILE ====================

/** Géométrie de l'étoile, en unités du viewBox. */
const ET_LARGEUR = 560;
const ET_CENTRE_L = 184;
const ET_CENTRE_H = 46;
const ET_BRANCHE_L = 152;
const ET_BRANCHE_H = 38;
const ET_RX = 182;
const ET_RY = 96;
const ET_MARGE = 10;
/** Demi-largeur d'un rayon, au centre puis à la branche : c'est ce qui l'effile. */
const ET_RAYON_CENTRE = 26;
const ET_RAYON_BOUT = 7;

/**
 * Schéma en étoile : la table de faits au centre, ses dimensions aux branches, et des
 * rayons effilés qui dessinent l'étoile — la forme dont le modèle tire son nom.
 *
 * Là où SchemaDiagram reproduit la vue Modèle de Power BI (dimensions à gauche, faits à
 * droite), celui-ci montre la *forme* du modèle, comme les diagrammes de la documentation
 * Microsoft. Les branches sont réparties sur une ellipse : à deux, elles se placent de
 * part et d'autre du centre ; au-delà, elles tournent en partant du haut.
 */
export function EtoileDiagram({ bloc }: { bloc: EtoileBlock }) {
  const n = bloc.branches.length;
  const cx = ET_LARGEUR / 2;

  // À deux branches, l'horizontale se lit mieux que la verticale
  const angle = (i: number) =>
    n === 2 ? Math.PI + i * Math.PI : -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const positions = bloc.branches.map((_, i) => ({
    x: cx + ET_RX * Math.cos(angle(i)),
    dy: ET_RY * Math.sin(angle(i)),
  }));

  // Hauteur déduite des branches réellement posées, pour ne pas laisser de vide
  const amplitude = Math.max(ET_CENTRE_H / 2, ...positions.map((p) => Math.abs(p.dy) + ET_BRANCHE_H / 2));
  const cy = ET_MARGE + amplitude;
  const hauteur = (ET_MARGE + amplitude) * 2;

  return (
    <figure className="schema-wrap etoile-wrap">
      <svg
        viewBox={`0 0 ${ET_LARGEUR} ${hauteur}`}
        role="img"
        aria-label={
          bloc.legende ??
          `Schéma en étoile : ${bloc.centre.nom} au centre, relié à ${bloc.branches
            .map((b) => b.nom)
            .join(", ")}`
        }
      >
        {/* Rayons d'abord : les boîtes se posent par-dessus */}
        {positions.map((pos, i) => {
          const bx = pos.x;
          const by = cy + pos.dy;
          const dx = bx - cx;
          const dyr = by - cy;
          const long = Math.hypot(dx, dyr) || 1;
          // Perpendiculaire unitaire au rayon
          const px = -dyr / long;
          const py = dx / long;
          const points = [
            [cx + px * ET_RAYON_CENTRE, cy + py * ET_RAYON_CENTRE],
            [bx + px * ET_RAYON_BOUT, by + py * ET_RAYON_BOUT],
            [bx - px * ET_RAYON_BOUT, by - py * ET_RAYON_BOUT],
            [cx - px * ET_RAYON_CENTRE, cy - py * ET_RAYON_CENTRE],
          ];
          return (
            <polygon
              key={`rayon-${i}`}
              className="rayon"
              points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
            />
          );
        })}

        {/* Clé de chaque relation, posée au tiers du rayon côté dimension */}
        {positions.map((pos, i) => {
          const cle = bloc.branches[i].cle;
          if (!cle) return null;
          const bx = pos.x;
          const by = cy + pos.dy;
          return (
            <text
              key={`cle-${i}`}
              x={cx + (bx - cx) * 0.56}
              y={cy + (by - cy) * 0.56 - 6}
              fontSize={10.5}
              textAnchor="middle"
              className="lien-texte"
            >
              {cle}
            </text>
          );
        })}

        {/* Dimensions */}
        {positions.map((pos, i) => (
          <g key={`dim-${i}`} className="dim">
            <rect
              x={pos.x - ET_BRANCHE_L / 2}
              y={cy + pos.dy - ET_BRANCHE_H / 2}
              width={ET_BRANCHE_L}
              height={ET_BRANCHE_H}
              rx={6}
            />
            <text
              x={pos.x}
              y={cy + pos.dy + 4}
              fontSize={12}
              textAnchor="middle"
            >
              {bloc.branches[i].nom}
            </text>
          </g>
        ))}

        {/* Table de faits, au centre */}
        <g className="fait">
          <rect
            x={cx - ET_CENTRE_L / 2}
            y={cy - ET_CENTRE_H / 2}
            width={ET_CENTRE_L}
            height={ET_CENTRE_H}
            rx={6}
          />
          <text
            x={cx}
            y={bloc.centre.note ? cy - 1 : cy + 4}
            fontSize={12.5}
            textAnchor="middle"
          >
            {bloc.centre.nom}
          </text>
          {bloc.centre.note && (
            <text x={cx} y={cy + 13} fontSize={10} textAnchor="middle" className="centre-note">
              {bloc.centre.note}
            </text>
          )}
        </g>
      </svg>
      {bloc.legende && <figcaption>{bloc.legende}</figcaption>}
    </figure>
  );
}

// ==================== FLUX D'ALIMENTATION ====================

/** Géométrie du flux, en unités du viewBox. */
const FL_LARGEUR = 560;
const FL_SOURCE_L = 132;
const FL_SOURCE_H = 40;
const FL_ECART = 16;
const FL_MARGE = 10;
const FL_FLECHE_D = 150;
const FL_FLECHE_F = 288;
/** Rayon du cercle qui tient le modèle. */
const FL_RAYON = 98;

/** Points d'une étoile à cinq branches centrée en (cx, cy). */
function pointsEtoile(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rayon = i % 2 === 0 ? r : r * 0.4;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rayon * Math.cos(a)).toFixed(1)},${(cy + rayon * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/**
 * Flux d'alimentation : les sources à gauche, le mode de connexion sur chaque flèche, et
 * le modèle à droite sous la forme d'une étoile dans son cercle. Les sources gardent leur
 * nom en toutes lettres plutôt qu'un logo : le propos est le mode de connexion, pas la
 * marque, et le texte reste lisible par un lecteur d'écran.
 */
export function FluxDiagram({ bloc }: { bloc: FluxBlock }) {
  const n = bloc.sources.length;
  const hauteurSources = n * FL_SOURCE_H + (n - 1) * FL_ECART;
  const hauteur = FL_MARGE * 2 + Math.max(hauteurSources, FL_RAYON * 2);
  const cy = hauteur / 2;
  const cxModele = FL_FLECHE_F + 24 + FL_RAYON;
  const y0 = (hauteur - hauteurSources) / 2;

  return (
    <figure className="schema-wrap flux-wrap">
      <svg
        viewBox={`0 0 ${FL_LARGEUR} ${hauteur.toFixed(0)}`}
        role="img"
        aria-label={
          bloc.legende ??
          `${bloc.sources.map((src) => src.nom).join(", ")} alimentent le modèle en mode ${bloc.mode}`
        }
      >
        <defs>
          <marker
            id="fl-pointe"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" className="pointe" />
          </marker>
        </defs>

        {bloc.sources.map((src, i) => {
          const y = y0 + i * (FL_SOURCE_H + FL_ECART);
          const milieu = y + FL_SOURCE_H / 2;
          return (
            <g key={i}>
              <g className="source">
                <rect x={FL_MARGE} y={y} width={FL_SOURCE_L} height={FL_SOURCE_H} rx={6} />
                <text
                  x={FL_MARGE + FL_SOURCE_L / 2}
                  y={milieu + 4}
                  fontSize={11.5}
                  textAnchor="middle"
                >
                  {src.nom}
                </text>
              </g>
              <line
                x1={FL_FLECHE_D}
                y1={milieu}
                x2={FL_FLECHE_F}
                y2={milieu}
                className="fleche"
                strokeWidth={1.5}
                markerEnd="url(#fl-pointe)"
              />
              <text
                x={(FL_FLECHE_D + FL_FLECHE_F) / 2}
                y={milieu - 7}
                fontSize={10.5}
                textAnchor="middle"
                className="lien-texte"
              >
                {src.mode ?? bloc.mode}
              </text>
            </g>
          );
        })}

        <circle cx={cxModele} cy={cy} r={FL_RAYON} className="cercle-modele" />
        <polygon points={pointsEtoile(cxModele, cy - (bloc.cible?.note ? 8 : 0), 46)} className="astre" />
        {bloc.cible?.note && (
          <text x={cxModele} y={cy + 68} fontSize={11} textAnchor="middle" className="lien-texte">
            {bloc.cible.note}
          </text>
        )}
      </svg>
      {bloc.legende && <figcaption>{bloc.legende}</figcaption>}
    </figure>
  );
}

// ==================== CHAÎNE DE REQUÊTES ====================

/** Géométrie de la chaîne, en unités du viewBox. */
const CH_LARGEUR = 560;
const CH_BOITE_L = 116;
const CH_BOITE_H = 44;
const CH_MODELE_R = 52;
const CH_FLECHE = 64;
const CH_MARGE = 8;

/**
 * Chaîne de requêtes : rapport → modèle → source, chaque flèche portant ce qui circule.
 * Le maillon marqué `modele` prend la forme d'une étoile dans son cercle, comme dans la
 * documentation Microsoft : c'est le même objet que dans les autres schémas du cours,
 * vu cette fois au milieu d'un trajet plutôt qu'au bout.
 */
export function ChaineDiagram({ bloc }: { bloc: ChaineBlock }) {
  const largeurs = bloc.maillons.map((m) => (m.modele ? CH_MODELE_R * 2 : CH_BOITE_L));
  const total = largeurs.reduce((a, b) => a + b, 0) + CH_FLECHE * (bloc.maillons.length - 1);
  const hauteur = CH_MODELE_R * 2 + CH_MARGE * 2 + 22;
  const cy = CH_MARGE + CH_MODELE_R;

  // Abscisse du centre de chaque maillon, chaîne centrée dans le viewBox.
  // Somme des maillons précédents plutôt qu'un curseur mutable : la fonction de rendu
  // reste pure, ce qu'exige la règle react-hooks/immutability.
  const debut = (CH_LARGEUR - total) / 2;
  const centres = largeurs.map(
    (l, i) =>
      debut +
      largeurs.slice(0, i).reduce((somme, precedente) => somme + precedente + CH_FLECHE, 0) +
      l / 2,
  );

  return (
    <figure className="schema-wrap chaine-wrap">
      <svg
        viewBox={`0 0 ${CH_LARGEUR} ${hauteur}`}
        role="img"
        aria-label={
          bloc.legende ??
          bloc.maillons.map((m) => m.nom).join(` ${bloc.fleches[0] ?? "vers"} `)
        }
      >
        <defs>
          <marker
            id="ch-pointe"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" className="pointe" />
          </marker>
        </defs>

        {bloc.fleches.map((libelle, i) => {
          const x1 = centres[i] + largeurs[i] / 2 + 6;
          const x2 = centres[i + 1] - largeurs[i + 1] / 2 - 6;
          return (
            <g key={`fl-${i}`}>
              <line
                x1={x1}
                y1={cy}
                x2={x2}
                y2={cy}
                className="fleche"
                strokeWidth={1.5}
                markerEnd="url(#ch-pointe)"
              />
              <text
                x={(x1 + x2) / 2}
                y={cy - 9}
                fontSize={10.5}
                textAnchor="middle"
                className="lien-texte"
              >
                {libelle}
              </text>
            </g>
          );
        })}

        {bloc.maillons.map((maillon, i) =>
          maillon.modele ? (
            <g key={`m-${i}`}>
              <circle cx={centres[i]} cy={cy} r={CH_MODELE_R} className="cercle-modele" />
              <polygon points={pointsEtoile(centres[i], cy, 30)} className="astre" />
              <text
                x={centres[i]}
                y={cy + CH_MODELE_R + 16}
                fontSize={11}
                textAnchor="middle"
                className="lien-texte"
              >
                {maillon.nom}
              </text>
            </g>
          ) : (
            <g key={`m-${i}`} className="source">
              <rect
                x={centres[i] - CH_BOITE_L / 2}
                y={cy - CH_BOITE_H / 2}
                width={CH_BOITE_L}
                height={CH_BOITE_H}
                rx={6}
              />
              <text x={centres[i]} y={cy + 4} fontSize={11.5} textAnchor="middle">
                {maillon.nom}
              </text>
            </g>
          ),
        )}
      </svg>
      {bloc.legende && <figcaption>{bloc.legende}</figcaption>}
    </figure>
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
