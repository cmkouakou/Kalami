/**
 * =============================================================
 *  Fichier    : case-blocks.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Affichage des blocs de texte d'un cas d'entraînement (énoncé, annexes,
 *               épilogue) : intertitres, paragraphes, listes et tableaux chiffrés avec leur
 *               légende, leur ligne de total et leur source. Composant serveur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/cases/types.ts
 * =============================================================
 */

import type { CaseBlock, CaseTable } from "@/lib/strategy/cases/types";

/** Tableau chiffré, défilant horizontalement sur petit écran. */
function Table({ table }: { table: CaseTable }) {
  return (
    <figure className="flex flex-col gap-1">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-small">
          <caption className="pb-2 text-left font-semibold">{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((header, index) => (
                <th
                  key={`${index}-${header}`}
                  scope="col"
                  className="border-b border-line px-2 py-1 text-left align-bottom"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr
                key={`${index}-${row[0]}`}
                className={index === table.totalRow ? "font-semibold" : undefined}
              >
                {row.map((cell, col) => (
                  <td key={col} className="border-b border-line px-2 py-1 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.source && (
        <figcaption className="text-caption text-ink-muted">{table.source}</figcaption>
      )}
    </figure>
  );
}

/**
 * Suite de blocs du cas.
 * @param blocks - Blocs à afficher, dans l'ordre
 */
export function CaseBlocks({ blocks }: { blocks: readonly CaseBlock[] }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "heading") {
          return (
            <h3 key={key} className="pt-2 font-serif text-h3 font-semibold">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={key} className="flex list-disc flex-col gap-1 pl-6">
              {block.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          );
        }
        if (block.kind === "table") return <Table key={key} table={block.table} />;
        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}
