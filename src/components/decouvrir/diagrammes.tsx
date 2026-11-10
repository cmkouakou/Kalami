/**
 * =============================================================
 *  Fichier    : diagrammes.tsx
 *  Projet     : Kalami
 *  Description: Schémas dessinés de la page /decouvrir : démarche en quatre temps,
 *               enchaînement des neuf étapes d'une étude et boucle de travail avec le
 *               coach IA. SVG en ligne, couleurs par jetons de la charte (trois thèmes).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-09
 *  Dépendances: globals.css (jetons de la charte)
 * =============================================================
 */

// ==================== CONSTANTES ====================

/** Les quatre temps de la démarche, avec les outils de chacun. */
const TEMPS = [
  { titre: "Comprendre", outils: "PESTEL, cinq forces, chaîne de valeur, VRIO, parties prenantes" },
  { titre: "Synthétiser", outils: "SWOT, matrice TOWS, deux ou trois enjeux" },
  { titre: "Décider", outils: "Vision, mission, objectifs SMART, choix de la stratégie" },
  { titre: "Agir", outils: "Feuille de route, tableau de bord, plan stratégique" },
];

/** Étapes 1 à 4, menées en parallèle (colonne de gauche du schéma). */
const ETAPES_PARALLELES = [
  { n: 1, nom: "Environnement externe" },
  { n: 2, nom: "Concurrence" },
  { n: 3, nom: "Ressources internes" },
  { n: 4, nom: "Parties prenantes" },
];

/** Étapes 5 à 9, menées l'une après l'autre. */
const ETAPES_SUIVIES = [
  { n: 5, nom: "Synthèse" },
  { n: 6, nom: "Cap" },
  { n: 7, nom: "Choix" },
  { n: 8, nom: "Action" },
  { n: 9, nom: "Plan" },
];

/** Les quatre moments d'une séance avec le coach, dans le sens des aiguilles d'une montre. */
const BOUCLE_COACH = [
  { x: 320, y: 50, ligne1: "Vous rédigez", ligne2: "votre analyse" },
  { x: 540, y: 160, ligne1: "Le coach relit,", ligne2: "questionne, propose" },
  { x: 320, y: 270, ligne1: "Vous acceptez,", ligne2: "modifiez ou rejetez" },
  { x: 100, y: 160, ligne1: "Vous validez", ligne2: "l'étape" },
];

// ==================== COMPOSANTS ====================

/** Pointe de flèche réutilisée par les schémas (couleur ocre). */
function PointeFleche({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7"
        orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" className="fill-ocre" />
      </marker>
    </defs>
  );
}

/**
 * Démarche en quatre temps : cartes numérotées reliées par des flèches
 * (en ligne sur grand écran, en colonne sur téléphone).
 */
export function SchemaDemarche() {
  return (
    <ol className="grid gap-3 md:grid-cols-4 md:gap-0">
      {TEMPS.map((temps, i) => (
        <li key={temps.titre} className="flex flex-col items-stretch md:flex-row md:items-center">
          <div className="flex-1 rounded-lg border border-line bg-surface p-4">
            <span
              aria-hidden="true"
              className="mb-2 flex size-9 items-center justify-center rounded-full bg-encre
                font-serif text-label text-on-encre"
            >
              {i + 1}
            </span>
            <p className="font-serif text-h3 text-ink">{temps.titre}</p>
            <p className="mt-1 text-small text-ink-muted">{temps.outils}</p>
          </div>
          {i < TEMPS.length - 1 && (
            <span aria-hidden="true" className="self-center px-2 py-1 text-h3 text-ocre">
              <span className="md:hidden">↓</span>
              <span className="hidden md:inline">→</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Carte des neuf étapes : 1 à 4 en parallèle, puis 5 à 9 en chaîne.
 * Le SVG défile horizontalement sur petit écran plutôt que de devenir illisible.
 */
export function SchemaEtapes() {
  const largeurBoite = 110;
  const departChaine = 240;
  const pas = 124;
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 860 300"
        role="img"
        aria-label={
          "Les étapes 1 à 4 se mènent en parallèle et mènent à la synthèse (5), " +
          "puis au cap (6), au choix (7), à l'action (8) et au plan stratégique (9)."
        }
        className="min-w-[640px] font-sans"
      >
        <PointeFleche id="fleche-etapes" />

        {/* Colonne des étapes parallèles */}
        <text x="10" y="20" className="fill-ink-muted text-[12px] uppercase tracking-wide">
          En parallèle
        </text>
        {ETAPES_PARALLELES.map((etape, i) => {
          const y = 34 + i * 64;
          return (
            <g key={etape.n}>
              <rect x="10" y={y} width="190" height="50" rx="8"
                className="fill-surface stroke-line" />
              <circle cx="34" cy={y + 25} r="13" className="fill-encre-soft" />
              <text x="34" y={y + 30} textAnchor="middle"
                className="fill-encre text-[13px] font-semibold">
                {etape.n}
              </text>
              <text x="54" y={y + 30} className="fill-ink text-[13px]">{etape.nom}</text>
              <path d={`M200,${y + 25} C222,${y + 25} 222,150 ${departChaine - 4},150`}
                fill="none" className="stroke-ocre" strokeWidth="1.5"
                markerEnd={i === 1 ? "url(#fleche-etapes)" : undefined} />
            </g>
          );
        })}

        {/* Chaîne des étapes suivantes */}
        {ETAPES_SUIVIES.map((etape, i) => {
          const x = departChaine + i * pas;
          const derniere = i === ETAPES_SUIVIES.length - 1;
          return (
            <g key={etape.n}>
              <rect x={x} y="118" width={largeurBoite} height="64" rx="8"
                className={derniere ? "fill-encre" : "fill-surface stroke-line"} />
              <text x={x + largeurBoite / 2} y="144" textAnchor="middle"
                className={
                  `text-[18px] font-semibold ${derniere ? "fill-on-encre" : "fill-encre"}`
                }>
                {etape.n}
              </text>
              <text x={x + largeurBoite / 2} y="166" textAnchor="middle"
                className={`text-[13px] ${derniere ? "fill-on-encre" : "fill-ink"}`}>
                {etape.nom}
              </text>
              {!derniere && (
                <line x1={x + largeurBoite} y1="150" x2={x + pas - 4} y2="150"
                  className="stroke-ocre" strokeWidth="1.5" markerEnd="url(#fleche-etapes)" />
              )}
            </g>
          );
        })}

        {/* Légende des temps sous la chaîne */}
        <text x={departChaine + largeurBoite / 2} y="212" textAnchor="middle"
          className="fill-ink-muted text-[12px]">Synthétiser</text>
        <text x={departChaine + pas * 1.5 + largeurBoite / 2} y="212" textAnchor="middle"
          className="fill-ink-muted text-[12px]">Décider</text>
        <text x={departChaine + pas * 3.5 + largeurBoite / 2} y="212" textAnchor="middle"
          className="fill-ink-muted text-[12px]">Agir</text>
        <text x="105" y="292" textAnchor="middle" className="fill-ink-muted text-[12px]">
          Comprendre
        </text>
        <text x={departChaine} y="262" className="fill-ink-muted text-[12px]">
          Chaque étape s&apos;ouvre quand la précédente est validée.
        </text>
      </svg>
    </div>
  );
}

/**
 * Boucle de travail avec le coach : l'utilisateur garde la main à chaque tour.
 */
export function SchemaCoach() {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 640 320"
        role="img"
        aria-label={
          "Boucle de travail : vous rédigez, le coach relit et propose, vous acceptez, " +
          "modifiez ou rejetez ses suggestions, puis vous validez l'étape."
        }
        className="mx-auto min-w-[520px] max-w-2xl font-sans"
      >
        <PointeFleche id="fleche-coach" />
        <ellipse cx="320" cy="160" rx="220" ry="110" fill="none" className="stroke-line"
          strokeWidth="1.5" strokeDasharray="4 6" />

        {/* Flèches entre les moments (arcs de l'ellipse) */}
        <path d="M410,62 Q490,85 520,122" fill="none" className="stroke-ocre"
          strokeWidth="1.5" markerEnd="url(#fleche-coach)" />
        <path d="M520,198 Q490,240 410,260" fill="none" className="stroke-ocre"
          strokeWidth="1.5" markerEnd="url(#fleche-coach)" />
        <path d="M230,260 Q150,240 120,198" fill="none" className="stroke-ocre"
          strokeWidth="1.5" markerEnd="url(#fleche-coach)" />
        <path d="M120,122 Q150,85 230,62" fill="none" className="stroke-ocre"
          strokeWidth="1.5" markerEnd="url(#fleche-coach)" />

        {BOUCLE_COACH.map((etape, i) => {
          const coach = i === 1;
          return (
            <g key={etape.ligne1}>
              <rect x={etape.x - 85} y={etape.y - 28} width="170" height="56" rx="10"
                className={coach ? "fill-encre" : "fill-surface stroke-line"} />
              <text x={etape.x} y={etape.y - 4} textAnchor="middle"
                className={`text-[13px] font-semibold ${coach ? "fill-on-encre" : "fill-ink"}`}>
                {etape.ligne1}
              </text>
              <text x={etape.x} y={etape.y + 14} textAnchor="middle"
                className={`text-[13px] ${coach ? "fill-on-encre" : "fill-ink-muted"}`}>
                {etape.ligne2}
              </text>
            </g>
          );
        })}

        <text x="320" y="156" textAnchor="middle" className="fill-encre font-serif text-[17px]">
          Vous gardez
        </text>
        <text x="320" y="178" textAnchor="middle" className="fill-encre font-serif text-[17px]">
          la décision
        </text>
      </svg>
    </div>
  );
}
