/**
 * =============================================================
 *  Fichier    : epilogue.ts
 *  Projet     : Kalami Stratégie
 *  Description: Épilogue du cas Ajinomoto Afrique de l'Ouest (module 11 du livre) : prise de
 *               participation dans Promasidor (2016), dissolution de la filiale (2021) et
 *               question finale. Affiché avec le plan, une fois l'analyse terminée.
 *               Contenu payant : serveur seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: server-only, cases/types.ts
 * =============================================================
 */

import "server-only";

import type { CaseEpilogue } from "../types";

// ==================== ÉPILOGUE ====================

export const CASE_EPILOGUE: CaseEpilogue = {
  title: "Épilogue : ce qui s'est passé ensuite",
  blocks: [
    {
      kind: "paragraph",
      text:
        "En novembre 2016, le groupe Ajinomoto annonce l'acquisition d'une participation " +
        "de 33,33 % dans Promasidor Holdings, un fabricant d'aliments transformés présent " +
        "dans 36 pays africains, pour 532 millions de dollars. Le groupe explique vouloir " +
        "combiner son savoir-faire en développement de produits et en production avec le " +
        "puissant réseau de vente et de distribution de Promasidor, afin de devenir un " +
        "acteur de premier plan des assaisonnements et des aliments transformés en " +
        "Afrique. Il annonce aussi qu'il étudiera l'intégration de ses activités " +
        "nigérianes avec celles de son nouveau partenaire.",
    },
    {
      kind: "paragraph",
      text:
        "Le 1er octobre 2021, les actionnaires d'AAO décident la dissolution anticipée de " +
        "la société et sa mise en liquidation amiable, confiée pour trois ans à deux " +
        "liquidateurs japonais et à un cabinet d'avocats d'Abidjan. L'avis est publié le " +
        "11 novembre 2021. L'historique officiel d'Ajinomoto Europe et Afrique mentionne " +
        "désormais la filiale ivoirienne comme « fermée en 2021 ».",
    },
    {
      kind: "paragraph",
      text:
        "Les causes exactes de cette décision n'ont pas été rendues publiques. Elles sont " +
        "sans doute multiples, et beaucoup échappent à ceux qui travaillaient sur place. " +
        "Mais l'épilogue invite à une dernière réflexion. En 2016, le groupe a choisi " +
        "d'accéder aux marchés africains par une participation dans un acteur déjà " +
        "installé, doté d'un réseau de distribution, plutôt qu'en continuant à bâtir le " +
        "sien filiale par filiale. Au regard de votre analyse, ce choix vous paraît-il " +
        "cohérent ? Et qu'aurait-il fallu faire, dès 2012, pour que la question ne se " +
        "pose pas ?",
    },
    {
      kind: "paragraph",
      text:
        "Source : Ajinomoto Co. (8 novembre 2016). Communiqué sur l'acquisition de " +
        "33,33 % de Promasidor Holdings.",
    },
  ],
};
