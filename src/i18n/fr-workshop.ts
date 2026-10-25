/**
 * =============================================================
 *  Fichier    : fr-workshop.ts
 *  Projet     : Kalami
 *  Description: Textes de l'atelier de l'auteur (v0.15.0) : Crédits Atelier, statistiques
 *               du manuscrit, liste de vérification avant soumission et administration
 *               (réglages, forfaits, octroi, consommation).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 * =============================================================
 */

const workshopFr = {
  // ==================== ATELIER DE L'AUTEUR ====================
  title: "Atelier de l'auteur",
  intro:
    "Des outils pour préparer votre livre avant de le soumettre. Les statistiques du " +
    "manuscrit et la liste de vérification sont gratuites ; la relecture par l'IA " +
    "utilise vos Crédits Atelier.",
  cancelled: "Paiement annulé : aucun montant n'a été prélevé.",
  balance: {
    title: "Mes Crédits Atelier",
    locked:
      "Vous n'avez pas encore de Crédits Atelier. Achetez un forfait pour utiliser la " +
      "relecture et la rédaction assistées par l'IA.",
    remaining: "Il vous reste {pct} % de vos crédits, soit environ {chapters} chapitres relus.",
    exhausted: "Vos crédits sont épuisés. Achetez un forfait pour continuer.",
    disabled: "Les outils IA de l'atelier sont momentanément indisponibles.",
  },
  offers: {
    title: "Forfaits Crédits Atelier",
    approx: "Environ {count} chapitres relus",
    none: "Aucun forfait n'est en vente pour le moment.",
    buy: "Acheter",
  },
  books: {
    title: "Mes livres",
    none: "Aucun livre pour le moment.",
    open: "Ouvrir l'atelier du livre",
  },
  bookLink: "Atelier : statistiques et vérification",

  // ==================== ATELIER D'UN LIVRE ====================
  book: {
    back: "Retour au livre",
    title: "Atelier — {title}",
    sourcePending: "Analyse de la version en attente de validation.",
    sourceCurrent: "Analyse de la version publiée.",
    noManuscript: "Importez d'abord un manuscrit pour obtenir ses statistiques.",
  },
  stats: {
    title: "Statistiques du manuscrit",
    words: "Mots",
    chapters: "Chapitres",
    reading: "Temps de lecture",
    readingValue: "{minutes} min",
    averageSentence: "Mots par phrase",
    closeRepeats: "Répétitions rapprochées",
    closeRepeatsHelp:
      "Mots de 5 lettres ou plus repris à moins de 25 mots d'intervalle dans un chapitre.",
    punctuation: "Espaces manquantes",
    punctuationHelp:
      "En français, une espace (insécable) précède ; : ! ? et entoure les guillemets « ».",
    chapterTable: "Chapitres",
    chapter: "Chapitre",
    share: "Part",
    long: "Phrases longues",
    repeats: "Répétitions",
    spacing: "Espaces",
    flagShort: "Très court",
    flagLong: "Très long",
    longSentences: "Phrases les plus longues (plus de 40 mots)",
    longSentence: "Chapitre {position} — {words} mots",
    noLongSentences: "Aucune phrase de plus de 40 mots.",
    topWords: "Mots les plus fréquents",
    topWord: "{word} ({count})",
  },
  checklist: {
    title: "Avant de soumettre",
    intro: "Une fiche complète aide les lecteurs à trouver et à choisir votre livre.",
    ready: "Tout est prêt pour la soumission.",
    done: "Fait",
    todo: "À faire",
    items: {
      title: "Un titre",
      cover: "Une première de couverture",
      backCover: "Une quatrième de couverture",
      summary: "Un résumé d'au moins 200 caractères",
      keywords: "Au moins 3 mots-clés",
      category: "Une catégorie",
      prices: "Au moins un prix",
      manuscript: "Un manuscrit importé",
    },
  },
  tools: {
    title: "Outils IA",
    soon:
      "Bientôt : relecteur (orthographe et grammaire), conseils de style chapitre par " +
      "chapitre, et rédaction de la fiche du livre (résumé, accroche, mots-clés).",
  },

  // ==================== ADMINISTRATION ====================
  admin: {
    title: "Atelier des auteurs",
    intro:
      "Réglages des outils IA de l'atelier, forfaits de Crédits Atelier et consommation " +
      "par auteur. Les montants en dollars ne sont jamais montrés aux auteurs.",
    settings: {
      title: "Réglages",
      enabled: "Outils IA activés",
      model: "Modèle",
      inputPrice: "Prix entrée (USD / million de jetons)",
      outputPrice: "Prix sortie (USD / million de jetons)",
      rateLimit: "Demandes permises par auteur",
      rateWindow: "Fenêtre (minutes)",
      save: "Enregistrer",
      saved: "Réglages enregistrés.",
      invalid: "Vérifiez les valeurs saisies.",
      invalidModel: "Identifiant de modèle invalide.",
    },
    packs: {
      title: "Forfaits",
      none: "Aucun forfait pour le moment.",
      newTitle: "Nouveau forfait",
      name: "Nom",
      cost: "Coût Anthropic couvert (USD)",
      position: "Ordre",
      priceXof: "Prix FCFA",
      priceEur: "Prix EUR",
      priceCad: "Prix CAD",
      active: "En vente",
      inactive: "Hors vente",
      approx: "≈ {count} chapitres",
      save: "Enregistrer",
      create: "Créer",
      saved: "Forfait enregistré.",
    },
    grant: {
      title: "Offrir un forfait",
      intro: "Ajoute les crédits d'un forfait à un auteur, sans paiement.",
      author: "Auteur",
      pack: "Forfait",
      note: "Note (facultative)",
      submit: "Offrir",
      granted: "Forfait offert.",
    },
    usage: {
      title: "Consommation",
      none: "Aucune consommation pour le moment.",
      author: "Auteur",
      requests: "Demandes",
      spent: "Dépensé (USD)",
      budget: "Crédits (USD)",
      last: "Dernière demande",
    },
    errors: {
      invalid_name: "Le nom doit compter de 1 à 80 caractères.",
      invalid_amount: "Le coût doit être compris entre 0,01 et 1 000 dollars.",
      invalid_price: "Prix invalide (FCFA entier, autres devises à deux décimales).",
      invalid_model: "Identifiant de modèle invalide.",
      invalid_rate: "Débit invalide.",
      pack_not_found: "Forfait introuvable.",
      author_not_found: "Auteur introuvable.",
      generic: "L'opération a échoué. Réessayez.",
    },
  },
};

export default workshopFr;
