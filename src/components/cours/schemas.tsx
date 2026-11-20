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

/** Libellé d'axe ou de calque, plus discret que le texte des boîtes. */
function Libelle({
  x,
  y,
  texte,
  ancre = "middle",
  rotation,
}: {
  x: number;
  y: number;
  texte: string;
  ancre?: "start" | "middle" | "end";
  rotation?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={ancre}
      dominantBaseline="middle"
      fontSize={12}
      fill="currentColor"
      opacity={0.75}
      transform={rotation ? `rotate(${rotation} ${x} ${y})` : undefined}
    >
      {texte}
    </text>
  );
}

/** Stratégique, tactique, opérationnel : horizon, réversibilité, décideur. */
function NiveauxDecision() {
  const niveaux = [
    { nom: "Stratégique", details: ["Plusieurs années", "Difficile à défaire", "La direction"] },
    { nom: "Tactique", details: ["Quelques mois", "Ajustable", "Les cadres"] },
    { nom: "Opérationnel", details: ["Jour, semaine", "Facile à corriger", "Les équipes"] },
  ];
  return (
    <Cadre largeur={640} hauteur={200}>
      {niveaux.map((n, i) => (
        <g key={n.nom}>
          <Boite
            x={10 + i * 212}
            y={10}
            l={196}
            h={46}
            lignes={[n.nom]}
            ton={i === 0 ? "encre" : i === 1 ? "ocre" : "neutre"}
          />
          <Fleche x1={108 + i * 212} y1={58} x2={108 + i * 212} y2={84} />
          <Boite x={10 + i * 212} y={88} l={196} h={86} lignes={n.details} />
        </g>
      ))}
      <Libelle x={320} y={190} texte="Horizon · réversibilité · qui décide" />
    </Cadre>
  );
}

/** Le noyau d'une bonne stratégie : diagnostic, politique directrice, actions. */
function Noyau() {
  const temps = [
    ["Diagnostic", "quel est le défi ?"],
    ["Politique directrice", "comment l'aborder"],
    ["Actions cohérentes", "qui se renforcent"],
  ];
  return (
    <Cadre largeur={640} hauteur={110}>
      {temps.map(([nom, detail], i) => (
        <Boite
          key={nom}
          x={10 + i * 215}
          y={20}
          l={190}
          h={70}
          lignes={[nom, detail]}
          ton={i === 1 ? "ocre" : "encre"}
        />
      ))}
      {[0, 1].map((i) => (
        <Fleche key={i} x1={202 + i * 215} y1={55} x2={223 + i * 215} y2={55} />
      ))}
    </Cadre>
  );
}

/** Les strates de l'environnement, de la plus large à l'entreprise. */
function Strates() {
  const calques = [
    { texte: "Macroenvironnement (PESTEL)", x: 10, y: 10, l: 620, h: 280, fond: "var(--surface)" },
    { texte: "Industrie", x: 55, y: 50, l: 530, h: 200, fond: "var(--sand)" },
    { texte: "Concurrents et marchés", x: 100, y: 90, l: 440, h: 120, fond: "var(--surface)" },
  ];
  return (
    <Cadre largeur={640} hauteur={300}>
      {calques.map((c) => (
        <g key={c.texte}>
          <rect
            x={c.x}
            y={c.y}
            width={c.l}
            height={c.h}
            rx={14}
            fill={c.fond}
            stroke="var(--line)"
            strokeWidth={1.5}
          />
          <Libelle x={c.x + 14} y={c.y + 20} texte={c.texte} ancre="start" />
        </g>
      ))}
      <Boite x={220} y={125} l={200} h={50} lignes={["L'entreprise"]} ton="encre" />
    </Cadre>
  );
}

/** Les six dimensions du PESTEL autour de l'entreprise. */
function Pestel() {
  const dimensions = [
    ["Politique", "programmes, fiscalité"],
    ["Économique", "croissance, prix, taux"],
    ["Socioculturel", "démographie, usages"],
    ["Technologique", "innovations, ruptures"],
    ["Environnemental", "climat, ressources"],
    ["Légal", "lois, règlements"],
  ];
  return (
    <Cadre largeur={640} hauteur={280}>
      {dimensions.map(([nom, detail], i) => {
        const gauche = i < 3;
        const x = gauche ? 10 : 450;
        const y = 15 + (i % 3) * 95;
        return (
          <g key={nom}>
            <Boite x={x} y={y} l={180} h={60} lignes={[nom, detail]} ton="ocre" />
            <Fleche
              x1={gauche ? 192 : 448}
              y1={y + 30}
              x2={gauche ? 243 : 397}
              y2={140}
            />
          </g>
        );
      })}
      <Boite x={245} y={110} l={150} h={60} lignes={["L'entreprise"]} ton="encre" />
    </Cadre>
  );
}

/**
 * Grille à deux axes commune aux schémas « impact-incertitude » et « scénarios ».
 * Les cases se lisent de gauche à droite, puis de haut en bas.
 */
function Grille2x2({
  cases,
  axeVertical,
  axeHorizontal,
  tons,
}: {
  cases: string[][];
  axeVertical: [string, string, string];
  axeHorizontal: [string, string, string];
  tons: ("neutre" | "encre" | "ocre")[];
}) {
  return (
    <Cadre largeur={640} hauteur={310}>
      {cases.map((lignes, i) => (
        <Boite
          key={lignes[0]}
          x={95 + (i % 2) * 272}
          y={10 + Math.floor(i / 2) * 124}
          l={262}
          h={114}
          lignes={lignes}
          ton={tons[i]}
        />
      ))}
      <Fleche x1={80} y1={256} x2={80} y2={12} />
      <Fleche x1={80} y1={256} x2={632} y2={256} />
      <Libelle x={40} y={133} texte={axeVertical[0]} rotation={-90} />
      <Libelle x={66} y={20} texte={axeVertical[2]} ancre="end" />
      <Libelle x={66} y={246} texte={axeVertical[1]} ancre="end" />
      <Libelle x={363} y={290} texte={axeHorizontal[0]} />
      <Libelle x={95} y={272} texte={axeHorizontal[1]} ancre="start" />
      <Libelle x={629} y={272} texte={axeHorizontal[2]} ancre="end" />
    </Cadre>
  );
}

/** Grille impact-incertitude : où se trouvent les variables pivots. */
function ImpactIncertitude() {
  return (
    <Grille2x2
      cases={[
        ["Tendances lourdes", "à intégrer au plan"],
        ["Variables pivots", "base des scénarios"],
        ["Secondaires", "à noter, sans plus"],
        ["À surveiller", "signaux à suivre"],
      ]}
      tons={["ocre", "encre", "neutre", "neutre"]}
      axeVertical={["Impact", "faible", "fort"]}
      axeHorizontal={["Incertitude", "faible", "forte"]}
    />
  );
}

/** Quatre scénarios d'Infosystem, nés du croisement de ses deux variables pivots. */
function Scenarios() {
  return (
    <Grille2x2
      cases={[
        ["Goulot d'étranglement", "garder les techniciens"],
        ["Course à l'expertise", "monter en compétence"],
        ["Statu quo difficile", "fidéliser, gagner en efficacité"],
        ["Compression", "se replier sur une niche"],
      ]}
      tons={["ocre", "encre", "neutre", "neutre"]}
      axeVertical={["Demande des PME", "faible", "forte"]}
      axeHorizontal={["Vitesse de l'IA dans le soutien", "lente", "rapide"]}
    />
  );
}

/** Correspondance identifiant → schéma. */
const SCHEMAS: Record<SchemaId, () => ReactNode> = {
  "choisir-renoncer": ChoisirRenoncer,
  "trois-niveaux": TroisNiveaux,
  demarche: Demarche,
  "niveaux-decision": NiveauxDecision,
  noyau: Noyau,
  strates: Strates,
  pestel: Pestel,
  "impact-incertitude": ImpactIncertitude,
  scenarios: Scenarios,
};

/** Schéma du cours d'après son identifiant. */
export function Schema({ id }: { id: SchemaId }) {
  const Dessin = SCHEMAS[id];
  return <Dessin />;
}
