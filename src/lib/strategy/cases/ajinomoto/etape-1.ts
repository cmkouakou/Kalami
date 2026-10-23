/**
 * =============================================================
 *  Fichier    : etape-1.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 1 (environnement
 *               externe) : PESTEL au début de 2016, deux variables pivots et quatre
 *               scénarios (question 1 du livre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/pestel.ts
 * =============================================================
 */

import "server-only";

import type { PestelPayload } from "@/lib/strategy/templates/pestel";

// ==================== CORRIGÉ ====================

export const CASE_STEP_1: PestelPayload = {
  factors: [
    // ---------- Politique ----------
    {
      id: "pol-stabilite",
      dimension: "political",
      factor:
        "Retour de la stabilité en Côte d'Ivoire après la crise postélectorale de 2010-2011 ; " +
        "élection présidentielle d'octobre 2015 sans violence majeure.",
      effect:
        "Abidjan redevient une base crédible pour desservir la région, et l'État soigne les " +
        "investisseurs : l'usine a été inaugurée par le Premier ministre comme le premier " +
        "investissement industriel japonais depuis la crise. AAO peut compter sur un climat " +
        "des affaires favorable dans son pays d'implantation.",
      nature: "opportunity",
      source: "Récit du cas ; Agence Ecofin, 14 mai 2013.",
      quadrant: "trend",
    },
    {
      id: "pol-zone",
      dimension: "political",
      factor:
        "Instabilité de plusieurs marchés de la zone visée : insécurité au Mali depuis 2012, " +
        "attentat de Ouagadougou en janvier 2016, épidémie d'Ebola en Guinée, au Liberia et " +
        "en Sierra Leone (2014-2015) et fermeture des frontières ivoiriennes avec ces pays.",
      effect:
        "Une part importante des onze pays de l'annexe 2 est difficile ou coûteuse à servir : " +
        "transport plus risqué, frontières fermées, créances plus incertaines. L'objectif du " +
        "groupe repose sur une conquête régionale ; si ces marchés restent fermés ou risqués, " +
        "il devient hors d'atteinte. C'est la première variable pivot.",
      nature: "threat",
      source:
        "Organisation mondiale de la santé (épidémie d'Ebola 2014-2016) ; presse " +
        "internationale (Mali, Ouagadougou).",
      quadrant: "pivot",
    },
    {
      id: "pol-investissement",
      dimension: "political",
      factor:
        "Politique ivoirienne d'attraction des investissements (Code des investissements de " +
        "2012, avantages à l'implantation industrielle).",
      effect:
        "Allège le coût de l'implantation de l'usine, mais ne règle pas la question de la " +
        "demande : l'avantage joue sur les coûts, pas sur les ventes.",
      nature: "opportunity",
      source: "Code des investissements de Côte d'Ivoire (ordonnance de 2012).",
      quadrant: "minor",
    },
    // ---------- Économique ----------
    {
      id: "eco-croissance",
      dimension: "economic",
      factor:
        "Croissance ivoirienne supérieure à 8 % par an depuis 2012, mais pouvoir d'achat des " +
        "ménages modestes toujours serré.",
      effect:
        "La restauration populaire et la consommation urbaine progressent, ce qui élargit la " +
        "clientèle qui cuisine en volume. Mais les ménages comptent chaque franc : seuls les " +
        "très petits formats et les produits au coût par plat le plus bas trouvent preneur.",
      nature: "both",
      source:
        "Fonds monétaire international, Perspectives de l'économie mondiale.",
      quadrant: "trend",
    },
    {
      id: "eco-distribution",
      dimension: "economic",
      factor:
        "Distribution des produits de grande consommation dominée par des grossistes, des " +
        "demi-grossistes et des détaillantes des marchés, en grande partie informelle.",
      effect:
        "Pour toucher les marchés et les boutiques, il faut passer par des intermédiaires peu " +
        "nombreux et puissants, qui négocient prix et conditions. Un modèle de vente directe " +
        "au comptant entre en concurrence avec eux au lieu de s'appuyer sur eux.",
      nature: "threat",
      source: "Récit du cas ; annexe 3.",
      quadrant: "trend",
    },
    {
      id: "eco-change",
      dimension: "economic",
      factor:
        "Monnaies hors zone franc instables : forte dépréciation du cedi ghanéen en 2014 et " +
        "2015 ; francs guinéen, leone et dalasi également fragiles.",
      effect:
        "Dans cinq des onze pays visés, un produit vendu en francs CFA devient plus cher pour " +
        "les acheteurs locaux : AAO doit choisir entre perdre des ventes et réduire sa marge.",
      nature: "threat",
      source: "Banque du Ghana ; annexe 2.",
      quadrant: "watch",
    },
    // ---------- Social ----------
    {
      id: "soc-reputation",
      dimension: "social",
      factor:
        "Réputation tenace du glutamate : surnommé « cube Maggi blanc », accusé de blanchir " +
        "une marmite noircie, utilisé en cachette par ceux qui l'apprécient.",
      effect:
        "La méfiance freine les achats des ménages et oblige les restaurateurs à cacher leur " +
        "usage. Les grossistes s'en servent pour obtenir de meilleures conditions. Selon que " +
        "la rumeur se dissipe ou s'installe, le marché du glutamate pur reste confidentiel ou " +
        "s'ouvre. C'est la seconde variable pivot.",
      nature: "threat",
      source: "Récit du cas.",
      quadrant: "pivot",
    },
    {
      id: "soc-habitudes",
      dimension: "social",
      factor:
        "Habitudes alimentaires proches de celles du Nigeria : féculents accompagnés de sauces " +
        "et de soupes, que le glutamate relève bien.",
      effect:
        "Le besoin existe, et le groupe le connaît par vingt ans de présence au Nigeria. Mais " +
        "il est déjà satisfait par le bouillon cube : le glutamate doit trouver sa place à " +
        "côté de lui ou à l'intérieur de recettes mélangées.",
      nature: "opportunity",
      source: "Ajinomoto Co., communiqué du 21 octobre 2011.",
      quadrant: "trend",
    },
    {
      id: "soc-demographie",
      dimension: "social",
      factor:
        "Population nombreuse et en forte croissance : environ 113 millions d'habitants dans " +
        "les onze pays en 2009 ; Abidjan compte environ 4,7 millions d'habitants en 2014.",
      effect:
        "Le marché potentiel grandit chaque année, surtout en ville, où se concentrent les " +
        "restaurants, maquis et rôtisseurs. La taille de la population ne dit rien, en " +
        "revanche, de la part qui achète du glutamate pur.",
      nature: "opportunity",
      source:
        "Ajinomoto Co., communiqué du 21 octobre 2011 ; recensement général de la population " +
        "de Côte d'Ivoire (RGPH 2014).",
      quadrant: "trend",
    },
    // ---------- Technologique ----------
    {
      id: "tec-mobile",
      dimension: "technological",
      factor:
        "Essor du paiement mobile (Orange Money, MTN Mobile Money, Moov Money) chez les " +
        "commerçants et les ménages.",
      effect:
        "Les équipes de vente au comptant pourraient encaisser sans transporter d'espèces, ce " +
        "qui réduit les risques et facilite le suivi des ventes par client.",
      nature: "opportunity",
      source:
        "Opérateurs de téléphonie mobile ; Banque centrale des États de l'Afrique de l'Ouest.",
      quadrant: "minor",
    },
    // ---------- Environnemental ----------
    {
      id: "env-plastique",
      dimension: "environmental",
      factor:
        "Pollution par les sachets plastiques, devenue un enjeu public dans la zone : " +
        "interdictions en Côte d'Ivoire (2013) et au Burkina Faso (2014).",
      effect:
        "Les petits sachets, format clé pour vendre aux ménages, peuvent devenir plus chers à " +
        "produire ou être interdits. L'application reste inégale, d'où une forte incertitude " +
        "mais un impact limité à court terme.",
      nature: "threat",
      source: "Voir les facteurs légaux ci-dessous.",
      quadrant: "watch",
    },
    // ---------- Légal ----------
    {
      id: "leg-sachets-ci",
      dimension: "legal",
      factor:
        "Côte d'Ivoire : décret de mai 2013 interdisant la production, l'importation, la " +
        "commercialisation et l'utilisation des sachets plastiques, appliqué de façon inégale.",
      effect:
        "AAO doit prévoir un emballage conforme pour ses petits formats et suivre l'évolution " +
        "des contrôles, sans que cela change la question centrale de la demande.",
      nature: "threat",
      source: "Décret n° 2013-327 du 22 mai 2013 (Côte d'Ivoire).",
      quadrant: "watch",
    },
    {
      id: "leg-sachets-bf",
      dimension: "legal",
      factor:
        "Burkina Faso : loi de 2014 interdisant les emballages et sachets plastiques non " +
        "biodégradables.",
      effect:
        "Les produits exportés au Burkina Faso doivent être emballés de façon conforme, sous " +
        "peine de saisie.",
      nature: "threat",
      source: "Loi n° 017-2014/AN du 20 mai 2014 (Burkina Faso).",
      quadrant: "minor",
    },
    {
      id: "leg-travail",
      dimension: "legal",
      factor:
        "Nouveau Code du travail ivoirien de 2015, qui encadre le recours aux travailleurs " +
        "temporaires.",
      effect:
        "Le recours prolongé à des temporaires devient plus difficile : la filiale, dont les " +
        "vendeurs sont pour la plupart déjà embauchés, doit surtout intégrer ce coût dans ses " +
        "renforts saisonniers et son personnel d'usine.",
      nature: "threat",
      source:
        "Loi n° 2015-532 du 20 juillet 2015 portant Code du travail (Côte d'Ivoire).",
      quadrant: "minor",
    },
    {
      id: "leg-marque",
      dimension: "legal",
      factor:
        "Protection des marques par l'Organisation africaine de la propriété intellectuelle " +
        "(OAPI) dans les pays francophones de la zone, mais lutte contre la contrefaçon peu " +
        "efficace sur les marchés.",
      effect:
        "La marque peut être défendue en droit, mais les saisies restent rares : la " +
        "contrefaçon continue d'entretenir le doute sur le produit. La meilleure défense est " +
        "de faire reconnaître le produit authentique par les acheteurs.",
      nature: "both",
      source: "Accord de Bangui (OAPI) ; récit du cas.",
      quadrant: "watch",
    },
  ],
  scenarios: {
    axes: [
      {
        factorId: "soc-reputation",
        low: "La rumeur s'installe : le glutamate reste un produit honteux",
        high: "La confiance s'installe : le glutamate devient un ingrédient assumé",
      },
      {
        factorId: "pol-zone",
        low: "Les marchés voisins restent fermés ou risqués",
        high: "Les marchés voisins s'ouvrent : sécurité et frontières rétablies",
      },
    ],
    cells: {
      hh: {
        name: "Le relais régional",
        description:
          "Le produit est accepté et les onze pays sont accessibles. Le modèle de filiale " +
          "régionale peut fonctionner, à condition de disposer d'un réseau de distribution " +
          "capable de couvrir la zone : la vente directe au comptant, avec trois implantations " +
          "en Côte d'Ivoire, n'y suffit pas. Même dans ce scénario favorable, l'objectif de " +
          "2,5 milliards de yens reste très éloigné des ventes constatées.",
      },
      hl: {
        name: "Le champion ivoirien",
        description:
          "Le produit gagne la confiance, mais les pays voisins restent difficiles. AAO " +
          "concentre ses moyens sur la Côte d'Ivoire et sur un ou deux marchés stables de la " +
          "zone franc, où elle peut construire une marque assumée auprès des restaurateurs, " +
          "puis des ménages. L'objectif doit être revu à la mesure de ce marché resserré.",
      },
      lh: {
        name: "Des marchés ouverts à un produit suspect",
        description:
          "Les frontières s'ouvrent, mais la rumeur demeure. Les volumes ne peuvent venir que " +
          "de ceux qui utilisent déjà le glutamate, souvent en cachette (restaurants, " +
          "rôtisseurs), et de produits mélangés où il se fait discret, comme AjiGoût. La " +
          "contrefaçon prospère sur la méfiance générale.",
      },
      ll: {
        name: "Le repli",
        description:
          "Le produit reste suspect et la zone reste instable. Une filiale autonome, avec " +
          "usine, force de vente et ambition sur onze pays, coûte plus qu'elle ne rapporte. " +
          "Il faut réduire la voilure, se limiter aux clients les plus rentables et étudier " +
          "d'autres façons d'accéder au marché, comme un partenariat avec un acteur déjà " +
          "installé.",
      },
    },
  },
};
