/**
 * =============================================================
 *  Fichier    : etape-3.ts
 *  Projet     : Kalami Stratégie
 *  Description: Corrigé du cas Ajinomoto Afrique de l'Ouest, étape 3 (environnement
 *               interne) : chaîne de valeur, ressources au VRIO en distinguant le groupe
 *               et la filiale (question 3), et lecture chiffrée de l'annexe 5 (question 4).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/templates/internal.ts
 * =============================================================
 */

import "server-only";

import type { InternalPayload } from "@/lib/strategy/templates/internal";

// ==================== CORRIGÉ ====================

export const CASE_STEP_3: InternalPayload = {
  model: "porter",
  activities: [
    {
      id: "inboundLogistics",
      kind: "primary",
      name: "Logistique d'approvisionnement",
      description:
        "Réception du glutamate en vrac importé de la filiale brésilienne du groupe et des " +
        "emballages, contrôle et stockage à Yopougon.",
      evaluation: "improve",
      comment:
        "Approvisionnement sûr mais long et en devises. Quand les ventes ne suivent pas, les " +
        "stocks s'accumulent : les magasins de l'usine finissent par déborder.",
    },
    {
      id: "operations",
      kind: "primary",
      name: "Reconditionnement (usine de Yopougon)",
      description:
        "Conditionnement du glutamate en formats adaptés aux consommateurs locaux, avec une " +
        "démarche TPM et un suivi quotidien de l'efficacité des équipements.",
      evaluation: "strength",
      comment:
        "C'est ici que la valeur se crée : pertes réduites de 40 %, usine classée parmi les " +
        "dix meilleures des quelque cent vingt usines du groupe. Mais cette valeur n'existe " +
        "que si le produit se vend : le succès industriel a pu masquer un temps que la " +
        "filiale n'avait pas trouvé son marché.",
    },
    {
      id: "outboundLogistics",
      kind: "primary",
      name: "Logistique de distribution",
      description:
        "Flotte de véhicules, agences d'Abidjan et de Bouaké, dépôt de Daloa, service de " +
        "transit et de logistique pour l'export vers les pays voisins.",
      evaluation: "weakness",
      comment:
        "Une flotte et des équipes qui parcourent les marchés pour des factures moyennes " +
        "d'environ 2 900 FCFA coûtent cher par franc vendu. L'export vers dix pays exige un " +
        "réseau que la filiale n'a pas.",
    },
    {
      id: "marketingSales",
      kind: "primary",
      name: "Marketing et ventes",
      description:
        "Vente directe au comptant (sept équipes, un dépôt, deux développeurs), canal " +
        "distributeurs, grossistes et restaurants, export, campagne avec Delta, dépliants et " +
        "équipes d'information sur les marchés, lancement d'AjiGoût.",
      evaluation: "weakness",
      comment:
        "C'est ici que la valeur se perd. Annexe 5 : 163,5 M FCFA en 10 mois, soit environ " +
        "196 M FCFA par an. L'objectif de 2,5 Mds de yens vaut environ 12,25 Mds FCFA (4,9 " +
        "FCFA par yen) : la vente directe en couvre environ 1,6 %. Au prix moyen de 1 470 " +
        "FCFA le kg, l'objectif représente environ 8 300 tonnes par an, contre 134 tonnes " +
        "vendues par ce canal. Facture moyenne de 2 900 FCFA (2 kg) et 1,10 article par " +
        "facture : des achats de dépannage, sans vente croisée. Ventes mensuelles stables " +
        "(14,6 à 18,8 M FCFA) : les réformes n'ont pas créé de croissance.",
    },
    {
      id: "service",
      kind: "primary",
      name: "Services aux clients",
      description:
        "Prospection de nouveaux clients par deux développeurs ; peu de conseil d'utilisation " +
        "aux restaurateurs et rôtisseurs.",
      evaluation: "improve",
      comment:
        "Les développeurs émettent 1,6 % des factures mais réalisent 8 % du chiffre, avec une " +
        "facture moyenne d'environ 14 600 FCFA (près de 10 kg), cinq fois la moyenne. Les " +
        "clients qui cuisinent en volume valent bien plus que la vente au détail : c'est là " +
        "qu'un service (démonstrations, dosage, formats professionnels) créerait de la valeur.",
    },
    {
      id: "infrastructure",
      kind: "support",
      name: "Direction et organisation",
      description:
        "Direction japonaise appuyée par des cadres ivoiriens ; prix, objectifs et grandes " +
        "décisions réservés aux dirigeants japonais, en lien avec le siège à Tokyo.",
      evaluation: "weakness",
      comment:
        "Les décisions de prix et d'objectifs sont prises loin du terrain : l'objectif de " +
        "2,5 Mds de yens n'a jamais été rapproché de la taille réelle du marché du glutamate " +
        "pur, que personne n'avait mesurée.",
    },
    {
      id: "humanResources",
      kind: "support",
      name: "Gestion des ressources humaines",
      description:
        "Formation aux standards du groupe par un consultant délégué, culture TPM à l'usine, " +
        "formation du personnel commercial après la réorganisation.",
      evaluation: "improve",
      comment:
        "Point fort à l'usine. Côté ventes, les vendeurs sont pour la plupart embauchés et " +
        "restent, faute d'autres emplois, même s'ils jugent leur salaire insuffisant : " +
        "l'équipe est stable, mais sa motivation n'est pas liée aux résultats.",
    },
    {
      id: "technology",
      kind: "support",
      name: "Développement des produits (appui du groupe)",
      description:
        "Savoir-faire du groupe en fermentation et en assaisonnement ; développement local " +
        "d'AjiGoût avec des épices ouest-africaines.",
      evaluation: "strength",
      comment:
        "Atout réel, qui vient du groupe. AjiGoût montre que la filiale sait adapter l'offre " +
        "aux goûts locaux ; reste à en faire un produit qui se vend.",
    },
    {
      id: "procurement",
      kind: "support",
      name: "Achats",
      description:
        "Achat du glutamate en vrac à la filiale brésilienne et des emballages, souvent " +
        "importés.",
      evaluation: "improve",
      comment:
        "Prix de cession fixé par le groupe : AAO maîtrise mal son coût de revient et donc " +
        "sa politique de prix face aux grossistes et à la contrefaçon.",
    },
  ],
  resources: [
    {
      id: "groupe-marque",
      name: "Marque AJI-NO-MOTO® et caution d'un groupe centenaire",
      category: "Groupe : marque",
      tests: {
        value: {
          answer: "yes",
          justification:
            "Garantit l'authenticité face à la contrefaçon et rassure les grossistes.",
        },
        rarity: {
          answer: "yes",
          justification:
            "Aucun autre glutamate de marque n'a cette histoire dans la zone.",
        },
        imitability: {
          answer: "yes",
          justification:
            "Une marque centenaire ne se copie pas ; seul l'emballage peut l'être.",
        },
        organization: {
          answer: "partial",
          justification:
            "En Côte d'Ivoire, la marque est encore associée à la rumeur : la campagne avec " +
            "Delta et les dépliants commencent à peine à la faire connaître pour ce qu'elle est.",
        },
      },
    },
    {
      id: "groupe-savoir-faire",
      name: "Savoir-faire de fermentation et de développement de produits",
      category: "Groupe : savoir-faire",
      tests: {
        value: {
          answer: "yes",
          justification:
            "Qualité constante et capacité à lancer des variantes comme AjiGoût.",
        },
        rarity: {
          answer: "yes",
          justification:
            "Seuls quelques groupes dans le monde produisent du glutamate.",
        },
        imitability: {
          answer: "yes",
          justification:
            "Les contrefaçons, en gros cristaux irréguliers, montrent l'écart.",
        },
        organization: {
          answer: "partial",
          justification:
            "La fermentation se fait au Brésil ; la filiale l'exploite surtout à travers la " +
            "qualité du produit et le développement d'AjiGoût.",
        },
      },
    },
    {
      id: "groupe-vente-directe",
      name: "Modèle de vente directe au comptant, éprouvé en Asie du Sud-Est",
      category: "Groupe : modèle commercial",
      tests: {
        value: {
          answer: "partial",
          justification:
            "Il assure une présence sur les marchés, mais produit ici des factures de 2 900 " +
            "FCFA et des ventes qui stagnent.",
        },
        rarity: {
          answer: "no",
          justification: "Tout concurrent peut recruter des vendeurs.",
        },
        imitability: {
          answer: "no",
          justification:
            "Des équipes de vente se recrutent et se forment en quelques mois.",
        },
        organization: {
          answer: "partial",
          justification:
            "Il entre en concurrence avec les grossistes au lieu de s'appuyer sur eux, dans " +
            "un marché qu'ils dominent.",
        },
      },
    },
    {
      id: "groupe-finances",
      name: "Capacité financière et patience du groupe",
      category: "Groupe : finances",
      tests: {
        value: {
          answer: "yes",
          justification:
            "Investissement de 1,9 Md FCFA et pertes de démarrage supportables.",
        },
        rarity: {
          answer: "partial",
          justification:
            "Nestlé et GB Foods disposent aussi de moyens importants.",
        },
        imitability: {
          answer: "partial",
          justification:
            "Hors de portée des acteurs locaux, pas des multinationales.",
        },
        organization: {
          answer: "partial",
          justification:
            "Les moyens sont liés à un objectif fixé sans mesure du marché : la patience du " +
            "groupe a une limite.",
        },
      },
    },
    {
      id: "aao-usine",
      name: "Usine de Yopougon et discipline TPM",
      category: "AAO : production",
      tests: {
        value: {
          answer: "yes",
          justification: "Coûts maîtrisés, qualité et livraisons régulières.",
        },
        rarity: {
          answer: "partial",
          justification:
            "Le classement compare l'usine aux autres usines du groupe, pas aux concurrents.",
        },
        imitability: {
          answer: "partial",
          justification:
            "La méthode TPM est connue ; la discipline des équipes l'est moins.",
        },
        organization: {
          answer: "yes",
          justification:
            "Suivi quotidien de l'efficacité des équipements, pertes réduites de 40 %.",
        },
      },
    },
    {
      id: "aao-terrain",
      name: "Connaissance du terrain des cadres et vendeurs ivoiriens",
      category: "AAO : ressources humaines",
      tests: {
        value: {
          answer: "yes",
          justification:
            "Ils savent qui utilise le glutamate, pourquoi en cachette, et ce que disent les " +
            "grossistes.",
        },
        rarity: {
          answer: "partial",
          justification:
            "Les concurrents installés ont aussi leurs équipes locales.",
        },
        imitability: {
          answer: "partial",
          justification:
            "Elle se construit avec des années de terrain ; l'équipe, stable, la conserve.",
        },
        organization: {
          answer: "no",
          justification:
            "Les décisions de prix et d'objectifs restent aux dirigeants japonais, en lien " +
            "avec Tokyo : cette connaissance remonte peu.",
        },
      },
    },
    {
      id: "aao-reseau",
      name: "Réseau commercial : vente directe, développeurs, grossistes, restaurants, export",
      category: "AAO : distribution",
      tests: {
        value: {
          answer: "partial",
          justification:
            "Donne accès aux marchés ivoiriens, mais avec un faible chiffre par visite.",
        },
        rarity: {
          answer: "no",
          justification:
            "Les mêmes grossistes vendent aussi les cubes concurrents.",
        },
        imitability: {
          answer: "no",
          justification:
            "Un concurrent peut recruter les mêmes vendeurs et distributeurs.",
        },
        organization: {
          answer: "partial",
          justification:
            "Les canaux se concurrencent : la vente directe aux détaillantes mécontente les " +
            "grossistes.",
        },
      },
    },
    {
      id: "aao-gamme",
      name: "Gamme : AJI-NO-MOTO® pur et AjiGoût",
      category: "AAO : offre",
      tests: {
        value: {
          answer: "partial",
          justification:
            "AjiGoût, moins cher et aux épices locales, répond mieux aux ménages que le " +
            "glutamate pur.",
        },
        rarity: {
          answer: "partial",
          justification:
            "Les mélanges d'épices existent déjà, notamment dans les cubes.",
        },
        imitability: {
          answer: "no",
          justification: "Une recette de mélange se copie facilement.",
        },
        organization: {
          answer: "partial",
          justification:
            "1,10 article par facture : les clients n'achètent qu'une référence, la gamme " +
            "n'est pas encore vendue comme une gamme.",
        },
      },
    },
    {
      id: "aao-donnees",
      name: "Données de vente détaillées (bilan de la vente directe)",
      category: "AAO : information",
      tests: {
        value: {
          answer: "yes",
          justification:
            "Elles montrent la taille réelle du canal et la valeur des gros clients.",
        },
        rarity: {
          answer: "no",
          justification: "Tout concurrent peut suivre ses ventes.",
        },
        imitability: {
          answer: "no",
          justification: "Un tableau de bord se reproduit facilement.",
        },
        organization: {
          answer: "partial",
          justification:
            "Les chiffres existent, mais ne servent pas à remettre en question l'objectif du " +
            "groupe ni le modèle de vente.",
        },
      },
    },
  ],
};
