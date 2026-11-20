/**
 * =============================================================
 *  Fichier    : schemas.tsx (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Schémas SVG originaux du cours. Couleurs tirées des variables du thème
 *               (currentColor, --encre, --ocre, --line), donc lisibles en clair et en
 *               sombre. Chaque schéma est décrit par la légende du bloc (figcaption).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-20
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

/** Les cinq forces : quatre forces externes poussent vers la rivalité, au centre. */
function CinqForces() {
  return (
    <Cadre largeur={640} hauteur={300}>
      <Boite x={230} y={10} l={180} h={56} lignes={["Nouveaux entrants", "menace"]} ton="ocre" />
      <Boite x={10} y={122} l={170} h={56} lignes={["Fournisseurs", "pouvoir"]} ton="ocre" />
      <Boite
        x={230}
        y={112}
        l={180}
        h={76}
        lignes={["Rivalité entre", "concurrents existants"]}
        ton="encre"
      />
      <Boite x={460} y={122} l={170} h={56} lignes={["Clients", "pouvoir"]} ton="ocre" />
      <Boite x={230} y={234} l={180} h={56} lignes={["Substituts", "menace"]} ton="ocre" />
      <Fleche x1={320} y1={68} x2={320} y2={109} />
      <Fleche x1={182} y1={150} x2={227} y2={150} />
      <Fleche x1={458} y1={150} x2={413} y2={150} />
      <Fleche x1={320} y1={232} x2={320} y2={191} />
    </Cadre>
  );
}

/** Le cycle de vie d'une industrie : une courbe des ventes en quatre phases. */
function CycleVie() {
  const phases = [
    ["Émergence", "convaincre"],
    ["Croissance", "suivre la demande"],
    ["Maturité", "défendre ses parts"],
    ["Déclin", "se repositionner"],
  ];
  return (
    <Cadre largeur={640} hauteur={280}>
      <Fleche x1={40} y1={190} x2={40} y2={12} />
      <Fleche x1={40} y1={190} x2={632} y2={190} />
      <Libelle x={22} y={100} texte="Ventes" rotation={-90} />
      <Libelle x={628} y={176} texte="Temps" ancre="end" />
      {[188, 336, 484].map((x) => (
        <line
          key={x}
          x1={x}
          y1={20}
          x2={x}
          y2={190}
          stroke="var(--line)"
          strokeDasharray="4 4"
        />
      ))}
      <path
        d="M45,180 C120,178 150,165 188,140 C250,95 290,55 336,45 C400,32 440,32 484,48
           C540,70 580,110 620,140"
        fill="none"
        stroke="var(--encre)"
        strokeWidth={3}
      />
      {phases.map(([nom, enjeu], i) => (
        <Boite
          key={nom}
          x={44 + i * 148}
          y={204}
          l={140}
          h={60}
          lignes={[nom, enjeu]}
          ton={i % 2 === 0 ? "ocre" : "neutre"}
        />
      ))}
    </Cadre>
  );
}

/** Concurrents et substituts : deux façons de répondre au même besoin. */
function ConcurrentSubstitut() {
  return (
    <Cadre largeur={640} hauteur={230}>
      <rect
        x={10}
        y={10}
        width={200}
        height={210}
        rx={14}
        fill="var(--surface)"
        stroke="var(--line)"
        strokeWidth={1.5}
      />
      <Libelle x={110} y={30} texte="Même manière de répondre" />
      <Boite x={30} y={50} l={160} h={56} lignes={["L'entreprise"]} ton="encre" />
      <Boite x={30} y={130} l={160} h={56} lignes={["Ses concurrents"]} />
      <Boite x={245} y={80} l={150} h={70} lignes={["Le besoin", "du client"]} ton="ocre" />
      <rect
        x={430}
        y={10}
        width={200}
        height={210}
        rx={14}
        fill="var(--surface)"
        stroke="var(--line)"
        strokeWidth={1.5}
      />
      <Libelle x={530} y={30} texte="Autre manière de répondre" />
      <Boite x={450} y={80} l={160} h={70} lignes={["Les substituts"]} />
      <Fleche x1={212} y1={115} x2={242} y2={115} />
      <Fleche x1={428} y1={115} x2={398} y2={115} />
    </Cadre>
  );
}

/** Ressources seuils (la base partagée) et distinctives (ce qui fait la différence). */
function SeuilsDistinctives() {
  return (
    <Cadre largeur={640} hauteur={220}>
      <Boite
        x={170}
        y={10}
        l={300}
        h={80}
        lignes={["Distinctives", "faire mieux que les autres"]}
        ton="encre"
      />
      <Boite
        x={20}
        y={120}
        l={600}
        h={80}
        lignes={["Seuils", "nécessaires pour exister, partagées par tous"]}
        ton="ocre"
      />
      <Fleche x1={320} y1={118} x2={320} y2={93} />
    </Cadre>
  );
}

/** La chaîne de valeur de Porter : soutien en haut, activités principales en bas. */
function ChaineValeur() {
  const soutien = [
    "Infrastructure",
    "Ressources humaines",
    "Développement technologique",
    "Approvisionnement",
  ];
  const principales = [
    ["Logistique", "interne"],
    ["Production"],
    ["Logistique", "externe"],
    ["Marketing", "et ventes"],
    ["Services"],
  ];
  return (
    <Cadre largeur={640} hauteur={270}>
      <Libelle x={10} y={12} texte="Activités de soutien" ancre="start" />
      {soutien.map((s, i) => (
        <Boite key={s} x={10} y={24 + i * 38} l={530} h={32} lignes={[s]} ton="ocre" />
      ))}
      <Libelle x={10} y={186} texte="Activités principales" ancre="start" />
      {principales.map((lignes, i) => (
        <Boite
          key={lignes[0] + i}
          x={10 + i * 107}
          y={198}
          l={101}
          h={62}
          lignes={lignes}
          ton="encre"
        />
      ))}
      <Boite x={555} y={24} l={75} h={236} lignes={["Marge"]} />
    </Cadre>
  );
}

/** La chaîne d'Infosystem : le parcours du problème d'un client, lu fort / à renforcer. */
function ChaineServices() {
  const activites = [
    { nom: "Attirer", fort: false },
    { nom: "Diagnostic", fort: true },
    { nom: "Mise en place", fort: true },
    { nom: "Soutien", fort: false },
    { nom: "Urgence", fort: true },
  ];
  return (
    <Cadre largeur={640} hauteur={230}>
      <Boite
        x={10}
        y={10}
        l={620}
        h={50}
        lignes={["Soutien : ressources humaines", "point faible critique"]}
      />
      {activites.map((a, i) => (
        <Boite
          key={a.nom}
          x={10 + i * 126}
          y={100}
          l={114}
          h={70}
          lignes={[a.nom, a.fort ? "point fort" : "à renforcer"]}
          ton={a.fort ? "encre" : "ocre"}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Fleche key={i} x1={126 + i * 126} y1={135} x2={134 + i * 126} y2={135} />
      ))}
      <Libelle x={320} y={200} texte="Le parcours du problème du client, de gauche à droite" />
    </Cadre>
  );
}

/** Le VRIO : quatre tests successifs, et le résultat du premier « non ». */
function Vrio() {
  const tests = [
    { test: "Valeur ?", non: ["Désavantage"] },
    { test: "Rareté ?", non: ["Parité"] },
    { test: "Inimitable ?", non: ["Avantage", "temporaire"] },
    { test: "Organisée ?", non: ["Avantage", "non exploité"] },
  ];
  return (
    <Cadre largeur={640} hauteur={230}>
      {tests.map((t, i) => (
        <g key={t.test}>
          <Boite x={10 + i * 125} y={20} l={105} h={56} lignes={[t.test]} ton="ocre" />
          <Fleche x1={62 + i * 125} y1={78} x2={62 + i * 125} y2={136} />
          <Libelle x={70 + i * 125} y={106} texte="non" ancre="start" />
          <Boite x={10 + i * 125} y={140} l={105} h={60} lignes={t.non} />
          <Fleche x1={117 + i * 125} y1={48} x2={133 + i * 125} y2={48} />
          <Libelle x={125 + i * 125} y={10} texte="oui" />
        </g>
      ))}
      <Boite
        x={510}
        y={20}
        l={120}
        h={80}
        lignes={["Avantage", "durable"]}
        ton="encre"
      />
    </Cadre>
  );
}

/** Les capacités dynamiques : percevoir, saisir, reconfigurer, en cycle. */
function CapacitesDynamiques() {
  return (
    <Cadre largeur={640} hauteur={250}>
      <Boite
        x={230}
        y={10}
        l={180}
        h={64}
        lignes={["Percevoir", "les changements"]}
        ton="ocre"
      />
      <Boite
        x={420}
        y={170}
        l={200}
        h={64}
        lignes={["Saisir", "engager des ressources"]}
        ton="encre"
      />
      <Boite
        x={20}
        y={170}
        l={200}
        h={64}
        lignes={["Reconfigurer", "l'organisation"]}
        ton="ocre"
      />
      <Fleche x1={412} y1={50} x2={500} y2={166} />
      <Fleche x1={418} y1={202} x2={222} y2={202} />
      <Fleche x1={140} y1={166} x2={228} y2={50} />
    </Cadre>
  );
}

/** La SWOT : interne ou externe, aide ou nuit. */
function Swot() {
  const cases = [
    { lignes: ["Forces", "ce que l'on fait bien"], ton: "encre" as const },
    { lignes: ["Faiblesses", "ce qui nous limite"], ton: "ocre" as const },
    { lignes: ["Opportunités", "ce qui peut aider"], ton: "encre" as const },
    { lignes: ["Menaces", "ce qui peut nuire"], ton: "ocre" as const },
  ];
  return (
    <Cadre largeur={640} hauteur={300}>
      <Libelle x={226} y={20} texte="Aide à atteindre les objectifs" />
      <Libelle x={498} y={20} texte="Nuit aux objectifs" />
      {cases.map((c, i) => (
        <Boite
          key={c.lignes[0]}
          x={95 + (i % 2) * 272}
          y={40 + Math.floor(i / 2) * 124}
          l={262}
          h={114}
          lignes={c.lignes}
          ton={c.ton}
        />
      ))}
      <Libelle x={34} y={97} texte="Interne" rotation={-90} />
      <Libelle x={56} y={97} texte="on agit" rotation={-90} />
      <Libelle x={34} y={221} texte="Externe" rotation={-90} />
      <Libelle x={56} y={221} texte="on subit" rotation={-90} />
    </Cadre>
  );
}

/** La TOWS : croiser l'interne et l'externe pour faire naître des options. */
function Tows() {
  const cellules = [
    { lignes: ["SO : attaquer", "forces × opportunités"], ton: "encre" as const },
    { lignes: ["WO : se renforcer", "corriger pour saisir"], ton: "neutre" as const },
    { lignes: ["ST : défendre", "forces contre menaces"], ton: "neutre" as const },
    { lignes: ["WT : se protéger", "limiter l'exposition"], ton: "ocre" as const },
  ];
  return (
    <Cadre largeur={640} hauteur={320}>
      <Boite x={190} y={10} l={215} h={56} lignes={["Forces (S)"]} />
      <Boite x={415} y={10} l={215} h={56} lignes={["Faiblesses (W)"]} />
      <Boite x={10} y={76} l={170} h={110} lignes={["Opportunités (O)"]} />
      <Boite x={10} y={196} l={170} h={110} lignes={["Menaces (T)"]} />
      {cellules.map((c, i) => (
        <Boite
          key={c.lignes[0]}
          x={190 + (i % 2) * 225}
          y={76 + Math.floor(i / 2) * 120}
          l={215}
          h={110}
          lignes={c.lignes}
          ton={c.ton}
        />
      ))}
    </Cadre>
  );
}

/** La matrice pouvoir-intérêt, avec les parties prenantes d'Infosystem. */
function PouvoirInteret() {
  return (
    <Grille2x2
      cases={[
        ["Garder satisfaits", "éditeurs, banques, État"],
        ["Gérer de près", "seniors, jeunes, grands clients"],
        ["Surveiller", "filles de Justin"],
        ["Tenir informés", "petits clients, cégeps"],
      ]}
      tons={["ocre", "encre", "neutre", "neutre"]}
      axeVertical={["Pouvoir", "faible", "fort"]}
      axeHorizontal={["Intérêt", "faible", "fort"]}
    />
  );
}

/** La dérive stratégique : l'environnement change en continu, la stratégie par marches. */
function DeriveStrategique() {
  const phases = [
    ["Petites touches", "tout va bien"],
    ["Dérive", "l'écart grandit"],
    ["Flottement", "on hésite"],
    ["Transformation", "ou disparition"],
  ];
  return (
    <Cadre largeur={640} hauteur={290}>
      <Fleche x1={40} y1={200} x2={40} y2={12} />
      <Fleche x1={40} y1={200} x2={632} y2={200} />
      <Libelle x={22} y={105} texte="Changement" rotation={-90} />
      <Libelle x={628} y={186} texte="Temps" ancre="end" />
      {[188, 336, 484].map((x) => (
        <line
          key={x}
          x1={x}
          y1={20}
          x2={x}
          y2={200}
          stroke="var(--line)"
          strokeDasharray="4 4"
        />
      ))}
      <path
        d="M45,190 C110,186 150,180 188,175 C260,165 300,155 336,140 C400,115 440,105 484,85
           C540,62 580,45 620,25"
        fill="none"
        stroke="var(--encre)"
        strokeWidth={3}
      />
      <path
        d="M45,190 H90 V186 H140 V180 H188 V176 H236 V172 H286 V168 H336 V165 H380 V162
           H430 V164 H484 V160 H505 V150 H525 V162 H545 V40 H620"
        fill="none"
        stroke="var(--ocre)"
        strokeWidth={3}
      />
      <Libelle x={470} y={60} texte="Environnement" ancre="end" />
      <Libelle x={400} y={182} texte="Stratégie" />
      {phases.map(([nom, detail], i) => (
        <Boite
          key={nom}
          x={44 + i * 148}
          y={214}
          l={140}
          h={60}
          lignes={[nom, detail]}
          ton={i % 2 === 0 ? "ocre" : "neutre"}
        />
      ))}
    </Cadre>
  );
}

/** Vision, mission, valeurs, objectifs : quatre énoncés, du plus large au plus précis. */
function QuatreEnonces() {
  const enonces = [
    { lignes: ["Vision", "où aller ?"], horizon: "5 à 10 ans", ton: "encre" as const },
    { lignes: ["Mission", "pourquoi ?"], horizon: "durable", ton: "encre" as const },
    {
      lignes: ["Valeurs", "comment se", "comporter ?"],
      horizon: "durables",
      ton: "ocre" as const,
    },
    {
      lignes: ["Objectifs", "comment", "mesurer ?"],
      horizon: "1 à 3 ans",
      ton: "ocre" as const,
    },
  ];
  return (
    <Cadre largeur={640} hauteur={170}>
      {enonces.map((e, i) => (
        <g key={e.lignes[0]}>
          <Boite x={10 + i * 158} y={10} l={140} h={90} lignes={e.lignes} ton={e.ton} />
          <Libelle x={80 + i * 158} y={118} texte={e.horizon} />
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <Fleche key={i} x1={152 + i * 158} y1={55} x2={166 + i * 158} y2={55} />
      ))}
      <Libelle x={320} y={155} texte="Du cap le plus large au résultat le plus précis" />
    </Cadre>
  );
}

/** Les stratégies génériques de Porter, avec la position visée par Infosystem. */
function StrategiesGeneriques() {
  return (
    <Grille2x2
      cases={[
        ["Domination", "par les coûts"],
        ["Différenciation"],
        ["Focalisation", "par les coûts"],
        ["Focalisation par la", "différenciation", "(Infosystem)"],
      ]}
      tons={["neutre", "neutre", "neutre", "encre"]}
      axeVertical={["Cible", "étroite", "large"]}
      axeHorizontal={["Avantage", "coûts plus bas", "valeur unique"]}
    />
  );
}

/** L'horloge stratégique : positions autour d'une offre de référence. */
function HorlogeStrategique() {
  const positions = [
    { x: 80, y: 40, lignes: ["Hybride", "plus de valeur, prix bas"] },
    { x: 265, y: 14, lignes: ["Différenciation", "plus de valeur"] },
    { x: 450, y: 40, lignes: ["Sophistication", "valeur et prix élevés"] },
    { x: 80, y: 140, lignes: ["Prix", "même valeur, moins cher"] },
    { x: 80, y: 240, lignes: ["Épuration", "l'essentiel, très bas prix"] },
  ];
  return (
    <Cadre largeur={640} hauteur={340}>
      <Fleche x1={60} y1={310} x2={60} y2={10} />
      <Fleche x1={60} y1={310} x2={632} y2={310} />
      <Libelle x={30} y={160} texte="Valeur perçue" rotation={-90} />
      <Libelle x={628} y={326} texte="Prix" ancre="end" />
      <line x1={340} y1={20} x2={340} y2={300} stroke="var(--line)" strokeDasharray="4 4" />
      <line x1={70} y1={165} x2={620} y2={165} stroke="var(--line)" strokeDasharray="4 4" />
      {positions.map((pos) => (
        <Boite
          key={pos.lignes[0]}
          x={pos.x}
          y={pos.y}
          l={170}
          h={52}
          lignes={pos.lignes}
          ton={pos.lignes[0] === "Différenciation" ? "encre" : "neutre"}
        />
      ))}
      <Boite x={265} y={140} l={150} h={52} lignes={["Offre de", "référence"]} ton="ocre" />
      <Boite
        x={450}
        y={240}
        l={170}
        h={52}
        lignes={["Zone non viable", "moins de valeur, plus cher"]}
        ton="barre"
      />
    </Cadre>
  );
}

/** Le modèle d'affaires en neuf blocs (canevas d'Osterwalder et Pigneur). */
function CanevasModele() {
  const colonne = (i: number) => 1 + i * 130;
  return (
    <Cadre largeur={640} hauteur={300}>
      <Boite x={colonne(0)} y={10} l={118} h={200} lignes={["Partenaires", "clés"]} />
      <Boite x={colonne(1)} y={10} l={118} h={95} lignes={["Activités", "clés"]} />
      <Boite x={colonne(1)} y={115} l={118} h={95} lignes={["Ressources", "clés"]} />
      <Boite
        x={colonne(2)}
        y={10}
        l={118}
        h={200}
        lignes={["Proposition", "de valeur"]}
        ton="encre"
      />
      <Boite x={colonne(3)} y={10} l={118} h={95} lignes={["Relation", "client"]} />
      <Boite x={colonne(3)} y={115} l={118} h={95} lignes={["Canaux"]} />
      <Boite x={colonne(4)} y={10} l={118} h={200} lignes={["Segments", "de clients"]} />
      <Boite x={1} y={220} l={314} h={70} lignes={["Structure de coûts"]} ton="ocre" />
      <Boite x={325} y={220} l={314} h={70} lignes={["Sources de revenus"]} ton="ocre" />
    </Cadre>
  );
}

/** La matrice d'Ansoff appliquée à Infosystem. */
function Ansoff() {
  return (
    <Grille2x2
      cases={[
        ["Développement de marché", "autres régions : plus tard"],
        ["Diversification", "hors du métier : non"],
        ["Pénétration de marché", "plus de PME : ensuite"],
        ["Développement de produit", "sécurité, conformité, IA :", "en premier"],
      ]}
      tons={["neutre", "neutre", "ocre", "encre"]}
      axeVertical={["Marchés", "actuels", "nouveaux"]}
      axeHorizontal={["Produits", "actuels", "nouveaux"]}
    />
  );
}

/** La filière d'Infosystem : intégration vers l'amont, vers l'aval, horizontale. */
function Filiere() {
  const maillons = [
    ["Éditeurs et", "fabricants"],
    ["Distributeurs", "de matériel"],
    ["Infosystem", "services gérés"],
    ["PME", "clientes"],
  ];
  return (
    <Cadre largeur={640} hauteur={250}>
      {maillons.map((lignes, i) => (
        <Boite
          key={lignes[0]}
          x={10 + i * 160}
          y={20}
          l={140}
          h={60}
          lignes={lignes}
          ton={i === 2 ? "encre" : "neutre"}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Fleche key={i} x1={152 + i * 160} y1={50} x2={168 + i * 160} y2={50} />
      ))}
      <Libelle x={170} y={100} texte="← Vers l'amont : remplacer un fournisseur" />
      <Libelle x={530} y={100} texte="Vers l'aval : vers le client →" />
      <Fleche x1={400} y1={84} x2={400} y2={150} />
      <Boite
        x={330}
        y={154}
        l={140}
        h={60}
        lignes={["Autre firme", "de services gérés"]}
        ton="ocre"
      />
      <Libelle x={180} y={184} texte="Horizontale : même métier," />
      <Libelle x={180} y={200} texte="même maillon de la filière" />
      <Libelle x={320} y={236} texte="La filière va de la matière première au client final" />
    </Cadre>
  );
}

/** La matrice BCG : croissance du marché et part de marché relative. */
function Bcg() {
  return (
    <Grille2x2
      cases={[
        ["Dilemmes", "investir ou sortir"],
        ["Vedettes", "investir pour tenir"],
        ["Poids morts", "récolter ou céder"],
        ["Vaches à lait", "financer les autres"],
      ]}
      tons={["neutre", "encre", "neutre", "ocre"]}
      axeVertical={["Croissance du marché", "faible", "forte"]}
      axeHorizontal={["Part de marché relative", "faible", "forte"]}
    />
  );
}

/** Le dilemme global-local : quatre façons d'aller à l'international. */
function GlobalLocal() {
  return (
    <Grille2x2
      cases={[
        ["Globale", "même offre partout"],
        ["Transnationale", "adapter et partager"],
        ["Exportation", "tout part du siège"],
        ["Multidomestique", "adapter pays par pays"],
      ]}
      tons={["ocre", "encre", "neutre", "neutre"]}
      axeVertical={["Intégration mondiale", "faible", "forte"]}
      axeHorizontal={["Adaptation locale", "faible", "forte"]}
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
  "cinq-forces": CinqForces,
  "cycle-vie": CycleVie,
  "concurrent-substitut": ConcurrentSubstitut,
  "seuils-distinctives": SeuilsDistinctives,
  "chaine-valeur": ChaineValeur,
  "chaine-services": ChaineServices,
  vrio: Vrio,
  "capacites-dynamiques": CapacitesDynamiques,
  swot: Swot,
  tows: Tows,
  "pouvoir-interet": PouvoirInteret,
  "derive-strategique": DeriveStrategique,
  "quatre-enonces": QuatreEnonces,
  "strategies-generiques": StrategiesGeneriques,
  "horloge-strategique": HorlogeStrategique,
  "canevas-modele": CanevasModele,
  ansoff: Ansoff,
  filiere: Filiere,
  bcg: Bcg,
  "global-local": GlobalLocal,
};

/** Schéma du cours d'après son identifiant. */
export function Schema({ id }: { id: SchemaId }) {
  const Dessin = SCHEMAS[id];
  return <Dessin />;
}
