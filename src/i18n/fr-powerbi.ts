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
