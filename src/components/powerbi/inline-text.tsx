/**
 * =============================================================
 *  Fichier    : inline-text.tsx
 *  Projet     : Kalami Données
 *  Description: Rend en React un texte au balisage léger (**gras**, *italique*, `code`,
 *               [lien](url)) lu par parseInline. Aucun HTML n'est injecté : chaque nœud
 *               devient un élément React, le texte reste échappé.
 *  Auteur     : Claude Marcel
 *               v1.1 (v0.21.0) : style du code et des liens laissé à powerbi.css.
 *  Version    : 1.1
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/inline.ts
 * =============================================================
 */

import { parseInline, type InlineNode } from "@/lib/powerbi/inline";

/** Texte balisé rendu en ligne. */
export function InlineText({ texte }: { texte: string }) {
  return <Noeuds noeuds={parseInline(texte)} />;
}

/** Rend une suite de nœuds. */
function Noeuds({ noeuds }: { noeuds: InlineNode[] }) {
  return (
    <>
      {noeuds.map((n, i) => (
        <Noeud key={i} noeud={n} />
      ))}
    </>
  );
}

/** Rend un nœud selon son type. */
function Noeud({ noeud }: { noeud: InlineNode }) {
  switch (noeud.type) {
    case "texte":
      return <>{noeud.texte}</>;
    case "code":
      return (
        <code>
          {noeud.texte}
        </code>
      );
    case "gras":
      return (
        <strong className="font-semibold">
          <Noeuds noeuds={noeud.enfants} />
        </strong>
      );
    case "italique":
      return (
        <em>
          <Noeuds noeuds={noeud.enfants} />
        </em>
      );
    case "lien": {
      const externe = noeud.url.startsWith("https://");
      return (
        <a
          href={noeud.url}
          {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Noeuds noeuds={noeud.enfants} />
        </a>
      );
    }
  }
}
