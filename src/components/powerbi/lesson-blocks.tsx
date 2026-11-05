/**
 * =============================================================
 *  Fichier    : lesson-blocks.tsx
 *  Projet     : Kalami Données
 *  Description: Rendu des blocs de contenu d'une leçon : titres, paragraphes, listes,
 *               tableaux, encadrés et code. Les encadrés portent trois tons — à retenir,
 *               piège d'examen, moyen mnémotechnique — distingués par la couleur de leur
 *               filet gauche autant que par leur intitulé, pour rester lisibles sans
 *               dépendre de la seule couleur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts, i18n
 * =============================================================
 */

import { getPowerbiDictionary } from "@/i18n/powerbi";
import type { ContentBlock, LessonContent, NoteTone } from "@/lib/powerbi/content";

const d = getPowerbiDictionary();

/** Filet gauche de chaque ton d'encadré. */
const TON_BORDURE: Record<NoteTone, string> = {
  info: "border-l-encre",
  examen: "border-l-ocre",
  memo: "border-l-ink-muted",
};

/** Intitulé par défaut de chaque ton. */
const TON_TITRE: Record<NoteTone, string> = {
  info: d.encadre.info,
  examen: d.encadre.examen,
  memo: d.encadre.memo,
};

/** Rend la suite des blocs d'une leçon. */
export function LessonBlocks({ contenu }: { contenu: LessonContent }) {
  return (
    <div className="flex flex-col gap-5">
      {contenu.map((bloc, index) => (
        <Bloc key={index} bloc={bloc} />
      ))}
    </div>
  );
}

/** Rend un bloc selon son type. */
function Bloc({ bloc }: { bloc: ContentBlock }) {
  switch (bloc.kind) {
    case "titre":
      return (
        <h2 className="mt-2 font-serif text-h3 font-semibold text-encre">{bloc.texte}</h2>
      );

    case "paragraphe":
      return <p className="max-w-prose">{bloc.texte}</p>;

    case "liste": {
      const classes = "max-w-prose flex flex-col gap-1 pl-5";
      return bloc.ordonnee ? (
        <ol className={`${classes} list-decimal`}>
          {bloc.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className={`${classes} list-disc`}>
          {bloc.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    case "tableau":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="border-b border-line text-left">
                {bloc.entetes.map((entete, i) => (
                  <th key={i} scope="col" className="py-2 pr-4 font-semibold text-encre">
                    {entete}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloc.lignes.map((ligne, i) => (
                <tr key={i} className="border-b border-line align-top">
                  {ligne.map((cellule, j) => (
                    <td key={j} className="py-2 pr-4">
                      {cellule}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "encadre":
      return (
        <aside
          className={`max-w-prose border-l-4 bg-sand px-4 py-3 ${TON_BORDURE[bloc.ton]}`}
        >
          <p className="text-caption font-semibold uppercase text-ink-muted">
            {bloc.titre ?? TON_TITRE[bloc.ton]}
          </p>
          <p className="mt-1">{bloc.texte}</p>
        </aside>
      );

    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-encre px-4 py-3 text-small text-on-encre">
          <code>{bloc.texte}</code>
        </pre>
      );
  }
}
