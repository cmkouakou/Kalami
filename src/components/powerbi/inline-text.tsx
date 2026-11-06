/**
 * =============================================================
 *  Fichier    : inline-text.tsx
 *  Projet     : Kalami Données
 *  Description: Rend en React un texte au balisage léger (**gras**, *italique*, `code`,
 *               [lien](url)) lu par parseInline. Aucun HTML n'est injecté : chaque nœud
 *               devient un élément React, le texte reste échappé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
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
        <code className="rounded-sm bg-sand px-1 py-0.5 font-mono text-[0.9em] text-encre">
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
          className="text-encre underline underline-offset-2 hover:text-encre-strong"
          {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Noeuds noeuds={noeud.enfants} />
        </a>
      );
    }
  }
}
