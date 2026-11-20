/**
 * =============================================================
 *  Fichier    : schemas.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Schémas SVG originaux du cours. Couleurs tirées des variables du thème
 *               (currentColor, --encre, --ocre, --line), donc lisibles en clair et en
 *               sombre. Chaque schéma est décrit par la légende du bloc (figcaption).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/cours/content.ts (SchemaId)
 * =============================================================
 */

import type { ReactNode } from "react";

import type { SchemaId } from "@/lib/cours/content";

// ==================== OUTILS DE DESSIN ====================

/** Boîte arrondie avec un texte centré (une ou deux lignes). */
function Boite({
  x,
  y,
  l,
  h,
  lignes,
  ton = "neutre",
}: {
  x: number;
  y: number;
  l: number;
  h: number;
  lignes: string[];
  ton?: "neutre" | "encre" | "ocre" | "barre";
}) {
  const fond = {
    neutre: "var(--surface)",
    encre: "var(--encre-soft)",
    ocre: "var(--sand)",
  };
  const trait =
    ton === "encre"
      ? "var(--encre)"
      : ton === "ocre"
        ? "var(--ocre)"
        : "var(--line)";
  const milieu = y + h / 2 - ((lignes.length - 1) * 16) / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={l}
        height={h}
        rx={10}
        fill={ton === "barre" ? "var(--surface)" : fond[ton]}
        stroke={trait}
        strokeWidth={1.5}
        strokeDasharray={ton === "barre" ? "5 4" : undefined}
      />
      {lignes.map((ligne, i) => (
        <text
          key={ligne}
          x={x + l / 2}
          y={milieu + i * 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="currentColor"
          opacity={ton === "barre" ? 0.55 : 1}
          textDecoration={ton === "barre" ? "line-through" : undefined}
        >
          {ligne}
        </text>
      ))}
    </g>
  );
}

/** Flèche simple d'un point à un autre. */
function Fleche({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--ink-muted)"
      strokeWidth={1.5}
      markerEnd="url(#cours-fleche)"
    />
  );
}

/** Cadre commun : marqueur de flèche et dimensions. */
function Cadre({
  largeur,
  hauteur,
  children,
}: {
  largeur: number;
  hauteur: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className="h-auto w-full text-ink"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="cours-fleche"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

// ==================== SCHÉMAS ====================

/** Textes des deux issues du filtre. */
const RETENU = ["Retenu :", "trois lignes, confort"];
const ECARTE = ["Écarté :", "petits prix, partout"];

/** Les trois niveaux, du plus large au plus précis. */
const NIVEAUX = [
  "Corporatif : dans quels domaines être présent ?",
  "D'affaires : comment gagner dans chaque domaine ?",
  "Fonctionnel : que fait chaque service ?",
];

/** Choisir, c'est renoncer : des options, un filtre, des choix retenus et écartés. */
function ChoisirRenoncer() {
  const options = [
    "Tous les clients",
    "Toutes les lignes",
    "Le prix le plus bas",
    "Le confort",
  ];
  return (
    <Cadre largeur={640} hauteur={260}>
      {options.map((o, i) => (
        <Boite key={o} x={10} y={20 + i * 58} l={150} h={42} lignes={[o]} />
      ))}
      {options.map((o, i) => (
        <Fleche key={`f-${o}`} x1={162} y1={41 + i * 58} x2={238} y2={130} />
      ))}
      <Boite
        x={240}
        y={90}
        l={140}
        h={80}
        lignes={["Filtre", "des choix"]}
        ton="encre"
      />
      <Fleche x1={382} y1={115} x2={448} y2={70} />
      <Fleche x1={382} y1={145} x2={448} y2={190} />
      <Boite x={450} y={30} l={180} h={80} lignes={RETENU} ton="ocre" />
      <Boite x={450} y={150} l={180} h={80} lignes={ECARTE} ton="barre" />
    </Cadre>
  );
}

/** Les trois niveaux de stratégie, emboîtés. */
function TroisNiveaux() {
  return (
    <Cadre largeur={640} hauteur={250}>
      <Boite x={20} y={10} l={600} h={60} lignes={[NIVEAUX[0]]} ton="encre" />
      <Fleche x1={320} y1={72} x2={320} y2={92} />
      <Boite x={70} y={95} l={500} h={60} lignes={[NIVEAUX[1]]} ton="ocre" />
      <Fleche x1={320} y1={157} x2={320} y2={177} />
      <Boite x={120} y={180} l={400} h={60} lignes={[NIVEAUX[2]]} />
    </Cadre>
  );
}

/** La démarche en quatre temps : comprendre, synthétiser, décider, agir. */
function Demarche() {
  const temps = [
    ["Comprendre", "environnement, interne"],
    ["Synthétiser", "SWOT, enjeux"],
    ["Décider", "cap, stratégie"],
    ["Agir", "plan, suivi"],
  ];
  return (
    <Cadre largeur={640} hauteur={110}>
      {temps.map(([nom, detail], i) => (
        <Boite
          key={nom}
          x={10 + i * 158}
          y={20}
          l={136}
          h={70}
          lignes={[nom, detail]}
          ton={i % 2 === 0 ? "encre" : "ocre"}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Fleche key={i} x1={148 + i * 158} y1={55} x2={166 + i * 158} y2={55} />
      ))}
    </Cadre>
  );
}

/** Correspondance identifiant → schéma. */
const SCHEMAS: Record<SchemaId, () => ReactNode> = {
  "choisir-renoncer": ChoisirRenoncer,
  "trois-niveaux": TroisNiveaux,
  demarche: Demarche,
};

/** Schéma du cours d'après son identifiant. */
export function Schema({ id }: { id: SchemaId }) {
  const Dessin = SCHEMAS[id];
  return <Dessin />;
}
