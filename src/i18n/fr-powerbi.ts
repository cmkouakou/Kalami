/**
 * =============================================================
 *  Fichier    : fr-powerbi.ts
 *  Projet     : Kalami Données
 *  Description: Textes français de l'espace de préparation à la certification Microsoft
 *               PL-300 : navigation, accueil, liste des modules, page de leçon et
 *               mentions du parcours. Lus via getPowerbiDictionary() (powerbi.ts).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 * =============================================================
 */

const powerbiFr = {
  name: "Données",
  title: "Kalami Données",
  description:
    "Préparation à la certification Microsoft PL-300 : des résumés structurés de chaque " +
    "leçon officielle, et un chantier pratique mené sur une vraie base de données.",

  nav: {
    home: "Le parcours",
    workshop: "Le chantier",
    principale: "Sections de Kalami Données",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    signedInAs: "{name}",
  },

  accueil: {
    titre: "Préparer le PL-300, une leçon à la fois",
    intro:
      "Chaque leçon du parcours officiel Microsoft, résumée pour la compréhension : " +
      "l'idée centrale d'abord, puis les détails que l'examen vérifie. Le lien vers la " +
      "page d'origine reste visible pour pouvoir y revenir.",
    avancement: "{pretes} leçons rédigées sur {total}",
    modulesTitre: "Les modules",
    lireLecon: "Lire",
    aVenir: "À venir",
    minutes: "{n} min",
    lecons: "{n} leçons",
  },

  lecon: {
    retour: "Retour au parcours",
    source: "Page officielle Microsoft Learn",
    precedente: "Leçon précédente",
    suivante: "Leçon suivante",
    nonRedigee: "Cette leçon n'est pas encore rédigée.",
    nonRedigeeAide:
      "Le résumé sera ajouté au fil de la progression dans le parcours. En attendant, " +
      "la page officielle reste accessible ci-dessous.",
  },

  encadre: {
    info: "À retenir",
    examen: "À l'examen",
    memo: "Pour retenir",
  },

  chantier: {
    surtitre: "BRVM Analyser · schéma reporting → Power BI Desktop",
    titre: "Chantier BRVM Power BI",
    intro:
      "Guide d'entraînement, sprint par sprint : de la connexion déjà en place jusqu'à un " +
      "dashboard complet — nettoyage, transformation, modélisation, présentation.",
    legendeTitre: "Repères de lecture",
    etiquettes: { pratique: "Pratique", info: "Info", repere: "Repère" },
    legende: {
      pratique: "à faire dans Power BI, maintenant",
      info: "contexte / explication, rien à cliquer",
      repere: "checklist de fin de sprint",
    },
    sprintsTitre: "Les sprints",
    sprint: "Sprint {n}",
    avancement: "{n} / {total} sprints terminés",
    cases: "{n} / {total} étapes cochées",
    termine: "Terminé",
    ouvrir: "Ouvrir",
    retour: "Retour au chantier",
    precedent: "Sprint précédent",
    suivant: "Sprint suivant",
    navigation: "Navigation entre les sprints",
    notion: "Notion",
    references: "Microsoft Learn",
    erreur: "La case n'a pas pu être enregistrée. Réessaie dans un instant.",
    horsLigne:
      "La progression ne peut pas être enregistrée pour le moment : les cases restent " +
      "consultables, mais ne sont pas mémorisées.",
  },

  maquette: {
    requetes: "Requêtes",
    etapes: "Étapes appliquées",
    fusionTitre: "Fusionner des requêtes",
    cle: "colonne clé",
    jointure: "Type de jointure",
  },

  prive: {
    badge: "Espace privé",
    explication: "Section en construction, réservée aux comptes invités.",
  },

  footer: {
    tagline: "Préparation à la certification Microsoft PL-300.",
    avertissement:
      "Parcours personnel de révision. Sans affiliation avec Microsoft ; PL-300 et " +
      "Power BI sont des marques de Microsoft Corporation.",
  },
} as const;

export default powerbiFr;
