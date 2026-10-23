/**
 * =============================================================
 *  Fichier    : etape-2.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 2 (environnement
 *               concurrentiel) : cinq forces, place du bouillon cube (substitut) et
 *               tableau de comparaison (question 2 du livre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/forces.ts
 * =============================================================
 */

import "server-only";

import type { ForcesPayload } from "@/lib/strategy/templates/forces";

// ==================== CORRIGÉ ====================

export const CASE_STEP_2: ForcesPayload = {
  forces: {
    rivalry: {
      intensity: "medium",
      justification:
        "Sur le glutamate pur, les rivaux directs d'AAO sont les contrefaçons et imitations, " +
        "vendues sous divers noms comme Jakomo, souvent en gros cristaux irréguliers, moins " +
        "chères et qui entretiennent le doute sur le produit authentique. Elles prennent des " +
        "ventes, surtout auprès des acheteurs les plus sensibles au prix, mais n'ont ni marque " +
        "forte ni communication. La rivalité n'est donc pas la force qui pèse le " +
        "plus : le marché du glutamate pur est petit, n'a jamais été mesuré, et les ventes " +
        "d'AAO sont stables, sans recul. La rivalité devient en revanche très forte dès " +
        "qu'AAO vend un produit mélangé comme AjiGoût, qui affronte directement Maggi, Jumbo, " +
        "Doli et Maxi Goût sur leur propre terrain.",
    },
    newEntrants: {
      intensity: "medium",
      justification:
        "Produire du glutamate exige une usine de fermentation et un savoir-faire que seuls " +
        "quelques groupes possèdent : cette entrée est très improbable. En revanche, importer " +
        "du glutamate en vrac et le reconditionner en sachets coûte peu, comme le montrent les " +
        "contrefacteurs, et les contrôles sont faibles. La vraie barrière est la confiance des " +
        "grossistes et des cuisiniers, que même AAO n'a pas encore gagnée.",
    },
    substitutes: {
      intensity: "high",
      justification:
        "Force n° 1. Le bouillon cube est un substitut au sens de Porter : c'est un autre " +
        "produit, qui répond au même besoin (donner du goût aux sauces et aux soupes) et se " +
        "dispute la même dépense. Il domine le marché, avec environ 30 000 tonnes et 90 " +
        "milliards de FCFA par an en Côte d'Ivoire, dont 75 % pour Maggi. Il bénéficie d'une " +
        "confiance que le glutamate n'a pas, alors qu'il contient souvent lui-même des " +
        "exhausteurs de goût. S'y ajoutent les condiments traditionnels, perçus comme naturels. " +
        "Conséquence : AAO ne peut pas attaquer le cube de front. Elle doit soit viser les " +
        "usages où le glutamate pur bat le cube (cuisine en volume, à moindre coût par plat), " +
        "soit entrer dans l'univers du cube avec des produits mélangés, en acceptant d'affronter " +
        "Nestlé.",
    },
    buyers: {
      intensity: "high",
      justification:
        "Force n° 2. Les grossistes, qui achètent en volume et commandent l'accès aux marchés " +
        "et aux détaillantes, pèsent lourd dans les négociations. Ils invoquent la mauvaise " +
        "réputation du produit pour obtenir de meilleures conditions, et la vente directe " +
        "d'AAO dans leurs zones les incite peu à pousser la marque. Les restaurateurs et " +
        "rôtisseurs sont nombreux et dispersés, donc peu puissants un par un, mais sensibles au " +
        "coût par plat et libres de revenir au cube. Les ménages achètent peu.",
    },
    suppliers: {
      intensity: "medium",
      justification:
        "Le glutamate en vrac vient d'une autre filiale du groupe, au Brésil : " +
        "l'approvisionnement " +
        "est sûr, mais le prix de cession et les volumes sont fixés par le groupe, et AAO n'a " +
        "pas d'autre source. Ce pouvoir s'exerce par la hiérarchie plutôt que par la " +
        "négociation : il limite la liberté de prix de la filiale. Les fournisseurs " +
        "d'emballages et les transporteurs sont nombreux, mais exposés aux règles sur les " +
        "sachets plastiques et à l'insécurité de certains pays (étape 1).",
    },
  },
  comparison: {
    actors: [
      { id: "aao", name: "AJI-NO-MOTO® (AAO)" },
      { id: "maggi", name: "Maggi (Nestlé), cube : substitut" },
      { id: "jumbo", name: "Jumbo (GB Foods), cube : substitut" },
      { id: "contrefacon", name: "Glutamate contrefait" },
      { id: "condiments", name: "Condiments traditionnels : substitut" },
    ],
    criteria: [
      {
        id: "cout-plat",
        name: "Coût par plat pour qui cuisine en volume",
        scores: {
          aao: {
            score: 4,
            note: "Moins cher que les cubes pour le même goût (récit).",
          },
          maggi: {
            score: 3,
            note: "Bon marché à l'unité, plus cher à l'usage en grande quantité.",
          },
          jumbo: { score: 3, note: "Même logique que Maggi." },
          contrefacon: {
            score: 5,
            note: "Le moins cher, au prix d'une qualité douteuse.",
          },
          condiments: {
            score: 3,
            note: "Coût variable selon le produit et la saison.",
          },
        },
      },
      {
        id: "confiance",
        name: "Confiance du consommateur final",
        scores: {
          aao: {
            score: 2,
            note: "Rumeur du « cube Maggi blanc » ; usage souvent caché aux clients.",
          },
          maggi: {
            score: 5,
            note: "Produit de référence des cuisines ouest-africaines.",
          },
          jumbo: { score: 4, note: "Marque de cube bien installée." },
          contrefacon: {
            score: 1,
            note: "Entretient le doute sur tout le glutamate.",
          },
          condiments: { score: 5, note: "Perçus comme naturels." },
        },
      },
      {
        id: "qualite",
        name: "Qualité et régularité du produit",
        scores: {
          aao: {
            score: 5,
            note: "Fine poudre blanche, standards du groupe, usine parmi les dix meilleures.",
          },
          maggi: { score: 5, note: "Standards d'un groupe international." },
          jumbo: { score: 4, note: "Standards industriels." },
          contrefacon: { score: 1, note: "Gros cristaux irréguliers." },
          condiments: { score: 2, note: "Qualité artisanale variable." },
        },
      },
      {
        id: "distribution",
        name: "Couverture de la distribution",
        scores: {
          aao: {
            score: 2,
            note: "Trois implantations de vente directe en Côte d'Ivoire, export à construire.",
          },
          maggi: {
            score: 5,
            note: "Présent partout, jusqu'aux petites boutiques.",
          },
          jumbo: { score: 4, note: "Large présence sur les marchés." },
          contrefacon: {
            score: 3,
            note: "Circuits informels, présence irrégulière.",
          },
          condiments: { score: 4, note: "Sur tous les marchés." },
        },
      },
      {
        id: "petit-format",
        name: "Petits formats adaptés aux ménages",
        scores: {
          aao: { score: 3, note: "Formats adaptés, reconditionnés à Abidjan." },
          maggi: { score: 5, note: "Le cube à l'unité." },
          jumbo: { score: 5, note: "Le cube à l'unité." },
          contrefacon: { score: 3, note: "Vendue au détail en vrac." },
          condiments: { score: 5, note: "Vendus en très petites quantités." },
        },
      },
      {
        id: "communication",
        name: "Communication et animation du marché",
        scores: {
          aao: {
            score: 3,
            note: "Campagne avec Delta, dépliants, équipes sur les marchés : effort récent.",
          },
          maggi: { score: 5, note: "Publicité massive et ancienne." },
          jumbo: { score: 4, note: "Publicité régulière." },
          contrefacon: { score: 1, note: "Aucune." },
          condiments: { score: 1, note: "Bouche-à-oreille." },
        },
      },
    ],
  },
};
