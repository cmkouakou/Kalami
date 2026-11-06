/**
 * =============================================================
 *  Fichier    : inline.ts
 *  Projet     : Kalami Données
 *  Description: Lecture du balisage en ligne des textes de leçons et du chantier :
 *               **gras**, *italique*, `code` et [lien](https://…). Produit une liste de
 *               nœuds que le composant InlineText rend en React, sans jamais injecter de
 *               HTML. Un marqueur sans fermeture reste du texte ordinaire : « 1:* » ou
 *               « a * b » s'affichent tels quels.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

/** Un morceau de texte mis en forme. */
export type InlineNode =
  | { type: "texte"; texte: string }
  | { type: "code"; texte: string }
  | { type: "gras"; enfants: InlineNode[] }
  | { type: "italique"; enfants: InlineNode[] }
  | { type: "lien"; url: string; enfants: InlineNode[] };

/** Seuls les liens web et les adresses internes au site sont rendus cliquables. */
const URL_SURE = /^(https:\/\/|\/)/;

/**
 * Découpe un texte balisé en nœuds.
 *
 * @param source - Texte avec balisage léger
 * @returns Nœuds dans l'ordre du texte
 *
 * Exemple : parseInline("Le **mode** `Import`") →
 *   texte « Le », gras « mode », texte « », code « Import »
 */
export function parseInline(source: string): InlineNode[] {
  const noeuds: InlineNode[] = [];
  let tampon = "";
  let i = 0;

  /** Vide le texte ordinaire accumulé dans un nœud. */
  const vider = () => {
    if (tampon) noeuds.push({ type: "texte", texte: tampon });
    tampon = "";
  };

  while (i < source.length) {
    const lu = lireMarqueur(source, i);
    if (lu) {
      vider();
      noeuds.push(lu.noeud);
      i = lu.fin;
    } else {
      tampon += source[i];
      i += 1;
    }
  }
  vider();
  return noeuds;
}

/** Tente de lire un marqueur à la position donnée ; null s'il n'y en a pas. */
function lireMarqueur(s: string, i: number): { noeud: InlineNode; fin: number } | null {
  const c = s[i];

  if (c === "`") {
    const fin = s.indexOf("`", i + 1);
    if (fin > i + 1) return { noeud: { type: "code", texte: s.slice(i + 1, fin) }, fin: fin + 1 };
    return null;
  }

  if (c === "*" && s[i + 1] === "*") {
    const fin = s.indexOf("**", i + 2);
    if (fin > i + 2) {
      return { noeud: { type: "gras", enfants: parseInline(s.slice(i + 2, fin)) }, fin: fin + 2 };
    }
    return null;
  }

  if (c === "*") return lireItalique(s, i);

  if (c === "[") return lireLien(s, i);

  return null;
}

/** Italique : l'astérisque ouvrant est suivi, et le fermant précédé, d'un non-espace. */
function lireItalique(s: string, i: number): { noeud: InlineNode; fin: number } | null {
  if (!s[i + 1] || /\s/.test(s[i + 1])) return null;
  let j = i + 1;
  while (j < s.length) {
    j = s.indexOf("*", j);
    if (j === -1) return null;
    if (s[j + 1] === "*") {
      // Un gras imbriqué n'est pas une fermeture : on saute la paire
      j += 2;
      continue;
    }
    if (!/\s/.test(s[j - 1])) {
      return { noeud: { type: "italique", enfants: parseInline(s.slice(i + 1, j)) }, fin: j + 1 };
    }
    j += 1;
  }
  return null;
}

/** Lien [texte](url), seulement vers une adresse sûre. */
function lireLien(s: string, i: number): { noeud: InlineNode; fin: number } | null {
  const finTexte = s.indexOf("](", i + 1);
  if (finTexte === -1) return null;
  const finUrl = s.indexOf(")", finTexte + 2);
  if (finUrl === -1) return null;
  const texte = s.slice(i + 1, finTexte);
  const url = s.slice(finTexte + 2, finUrl);
  if (!texte || texte.includes("[") || !URL_SURE.test(url) || /\s/.test(url)) return null;
  return { noeud: { type: "lien", url, enfants: parseInline(texte) }, fin: finUrl + 1 };
}

/** Texte brut sans balisage, pour un titre de page ou un attribut. */
export function texteBrut(source: string): string {
  return parseInline(source).map(aplatir).join("");
}

/** Concatène le texte d'un nœud et de ses enfants. */
function aplatir(n: InlineNode): string {
  return n.type === "texte" || n.type === "code" ? n.texte : n.enfants.map(aplatir).join("");
}
