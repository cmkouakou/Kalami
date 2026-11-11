/**
 * =============================================================
 *  Fichier    : content.ts
 *  Projet     : Kalami Données
 *  Description: Blocs de contenu d'une leçon ou d'un sprint du chantier : titres,
 *               paragraphes, listes, tableaux, encadrés et code, plus les blocs du chantier
 *               (v0.18.0) : notions dépliables, références, cases à cocher, cartes, schémas
 *               de modèle et maquettes Power Query. Écrits en TypeScript plutôt qu'en
 *               Markdown pour rester typés, relus en revue de code et versionnés avec le
 *               reste du dépôt, sans ajouter de dépendance de rendu.
 *
 *               Balisage en ligne accepté dans les textes : **gras**, *italique*, `code`
 *               et [lien](https://…). Voir lib/powerbi/inline.ts.
 *  Auteur     : Claude Marcel
 *               v1.2 (v0.21.2) : passages en couleur du guide d'origine (colonnes en
 *               police mono, pastilles dimension / fait, accents dans le code).
 *  Version    : 1.2
 *  Date       : 2026-11-05
 * =============================================================
 */

/**
 * Ton d'un encadré. Les trois premiers portent un intitulé par défaut (à retenir, piège
 * d'examen, moyen mnémotechnique) ; « precision » et « attention », venus du chantier,
 * n'en ont pas : leur texte commence par son propre intitulé en gras.
 */
export type NoteTone = "info" | "examen" | "memo" | "precision" | "attention";

/** Nature d'une section du chantier : à faire, à lire, ou bilan de fin de sprint. */
export type SectionTag = "pratique" | "info" | "repere";

/** Titre intermédiaire ; dans le chantier, numéroté (« 2.4 ») et étiqueté. */
export type HeadingBlock = {
  kind: "titre";
  texte: string;
  numero?: string;
  etiquette?: SectionTag;
};

/** Paragraphe de texte courant ; discret = note de bas de section, plus petite. */
export type ParagraphBlock = { kind: "paragraphe"; texte: string; discret?: boolean };

/** Élément de liste, éventuellement suivi d'une sous-liste. */
export type ListItem = string | { texte: string; sous: string[] };

/** Liste à puces ou numérotée. */
export type ListBlock = { kind: "liste"; ordonnee?: boolean; items: ListItem[] };

/**
 * Tableau à en-tête : chaque ligne doit avoir autant de cellules que d'en-têtes.
 * La légende, si présente, s'affiche au-dessus (ex. « Axe marché BRVM »).
 */
export type TableBlock = {
  kind: "tableau";
  entetes: string[];
  lignes: string[][];
  legende?: string;
  /** Colonnes en police à chasse fixe (noms de vues, de colonnes, de mesures). */
  colonnesMono?: number[];
  /** Colonne dont les cellules sont des pastilles : dimension (sarcelle) ou fait (ocre). */
  pastilles?: { colonne: number; teintes: ("dim" | "fait")[] };
};

/** Encadré mis en valeur, éventuellement suivi de points. */
export type NoteBlock = {
  kind: "encadre";
  ton: NoteTone;
  titre?: string;
  texte: string;
  points?: ListItem[];
};

/** Extrait de code ou de formule, affiché en police à chasse fixe. */
export type CodeBlock = {
  kind: "code";
  langage?: string;
  texte: string;
  /** Passages mis en couleur : fonctions DAX, types M, nouveaux noms. */
  accents?: string[];
};

/** Notion dépliable : un approfondissement qu'on ouvre si on en a besoin. */
export type NotionBlock = {
  kind: "notion";
  titre: string;
  etiquette?: string;
  contenu: ContentBlock[];
};

/** Pages Microsoft Learn qui couvrent la section. */
export type ReferencesBlock = { kind: "references"; liens: { texte: string; url: string }[] };

/**
 * Cases à cocher de fin de sprint. Chaque identifiant est stable : la progression de
 * l'utilisateur est enregistrée sous cet identifiant (ex. « c2-3 »), ne jamais le
 * renommer une fois publié.
 */
export type ChecklistBlock = { kind: "checklist"; items: { id: string; texte: string }[] };

/** Cartes côte à côte : pages du tableau de bord visé, ou deux options à comparer. */
export type CardsBlock = {
  kind: "cartes";
  cartes: { titre: string; texte?: string; points: ListItem[] }[];
};

/**
 * Schéma de modèle : dimensions à gauche, tables de faits à droite, et les relations
 * qui les relient (index dans chaque colonne). Une relation inactive est en pointillé.
 */
export type SchemaBlock = {
  kind: "schema";
  gauche: string[];
  droite: string[];
  liens: { de: number; vers: number; libelle?: string; inactif?: boolean }[];
  legende?: string;
};

/**
 * Schéma en étoile : une table de faits au centre, ses dimensions aux branches.
 * Complète SchemaBlock, qui montre le modèle comme la vue Modèle de Power BI (colonnes
 * gauche/droite) ; celui-ci montre la *forme* du modèle, comme les diagrammes de la
 * documentation Microsoft, pour faire voir pourquoi on parle d'étoile.
 */
export type EtoileBlock = {
  kind: "etoile";
  /** Table de faits, au centre. */
  centre: { nom: string; note?: string };
  /** Tables de dimensions, réparties autour. La clé s'affiche le long de la branche. */
  branches: { nom: string; cle?: string }[];
  legende?: string;
};

/**
 * Maquette de l'éditeur Power Query, pour se repérer avant d'ouvrir le logiciel.
 * Chaque zone est facultative : une maquette peut ne montrer que les étapes.
 */
export type PowerQueryMockBlock = {
  kind: "maquette-power-query";
  onglets?: string[];
  requetes?: { noms: string[]; selection: string };
  apercu?: {
    titre: string;
    colonnes: string[];
    types: string[];
    lignes: string[][];
    note?: string;
  };
  etapes: { titre: string; noms: string[]; note?: string };
  formule?: string;
};

/** Maquette de la fenêtre de fusion : deux tables, leur colonne clé, le type de jointure. */
export type MergeMockBlock = {
  kind: "maquette-fusion";
  tables: { titre: string; colonnes: string[]; cle: string }[];
  jointures: string[];
  choisie: string;
};

/** Un bloc de contenu, quel que soit son type. */
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | NoteBlock
  | CodeBlock
  | NotionBlock
  | ReferencesBlock
  | ChecklistBlock
  | CardsBlock
  | SchemaBlock
  | EtoileBlock
  | PowerQueryMockBlock
  | MergeMockBlock;

/** Contenu complet d'une leçon. */
export type LessonContent = ContentBlock[];

// ==================== FABRIQUES ====================
// Raccourcis d'écriture : une leçon se lit comme une suite d'appels courts.

/** Titre intermédiaire. */
export const titre = (texte: string): HeadingBlock => ({ kind: "titre", texte });

/** Paragraphe. */
export const p = (texte: string): ParagraphBlock => ({ kind: "paragraphe", texte });

/** Liste à puces. */
export const liste = (...items: string[]): ListBlock => ({ kind: "liste", items });

/** Liste numérotée, pour une marche à suivre. */
export const etapes = (...items: string[]): ListBlock => ({
  kind: "liste",
  ordonnee: true,
  items,
});

/** Tableau à en-tête. */
export const tableau = (entetes: string[], lignes: string[][]): TableBlock => ({
  kind: "tableau",
  entetes,
  lignes,
});

/** Schéma en étoile : une table de faits au centre, ses dimensions aux branches. */
export const etoile = (
  centre: EtoileBlock["centre"],
  branches: EtoileBlock["branches"],
  legende?: string,
): EtoileBlock => ({ kind: "etoile", centre, branches, legende });

/** Encadré d'information. */
export const note = (texte: string, titreEncadre?: string): NoteBlock => ({
  kind: "encadre",
  ton: "info",
  titre: titreEncadre,
  texte,
});

/** Encadré « piège d'examen ». */
export const examen = (texte: string): NoteBlock => ({
  kind: "encadre",
  ton: "examen",
  titre: "À l'examen",
  texte,
});

/** Encadré « moyen mnémotechnique ». */
export const memo = (texte: string): NoteBlock => ({
  kind: "encadre",
  ton: "memo",
  titre: "Pour retenir",
  texte,
});

/** Extrait de code. */
export const code = (texte: string, langage?: string): CodeBlock => ({
  kind: "code",
  langage,
  texte,
});
