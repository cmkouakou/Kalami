/**
 * =============================================================
 *  Fichier    : fr.ts
 *  Projet     : Kalami
 *  Description: Textes de l'interface en français (langue par défaut).
 *               « {appName} » est remplacé par APP_NAME au moment de l'affichage.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 * =============================================================
 */

const fr = {
  meta: {
    description:
      "Lisez en ligne des ouvrages d'auteurs africains et francophones : extrait gratuit, " +
      "paiement par carte ou Mobile Money, liseuse moderne.",
  },
  nav: {
    catalog: "Catalogue",
    library: "Ma bibliothèque",
    signIn: "Se connecter",
  },
  home: {
    title: "Des livres à lire partout, sur tous vos écrans",
    subtitle:
      "Découvrez le sommaire et un extrait gratuit, puis poursuivez la lecture " +
      "après achat par carte bancaire ou Mobile Money.",
    comingSoon: "Le catalogue ouvre bientôt.",
    browse: "Parcourir le catalogue",
  },
  catalog: {
    newReleases: "Nouveautés",
    featured: "Notre sélection",
    categories: "Catégories",
    empty: "Aucun livre pour le moment.",
    by: "par",
    noCover: "Couverture à venir",
    currency: "Devise",
    priceUnavailable: "Prix à venir",
    languages: { fr: "Français", en: "Anglais" },
    book: {
      details: "Informations",
      edition: "Édition",
      pages: "Pages",
      chapters: "Chapitres",
      year: "Année de publication",
      category: "Catégorie",
      language: "Langue",
      summary: "Résumé",
      toc: "Sommaire",
      tocSoon: "Le sommaire et l'extrait gratuit seront bientôt disponibles.",
      readExcerpt: "Lire l'extrait",
      buy: "Acheter",
      soon: "Bientôt disponible",
      aboutAuthor: "À propos de l'auteur",
    },
    author: {
      books: "Ses livres",
    },
    search: {
      title: "Rechercher un livre",
      query: "Titre, auteur ou mot-clé",
      category: "Catégorie",
      anyCategory: "Toutes les catégories",
      language: "Langue",
      anyLanguage: "Toutes les langues",
      maxPrice: "Prix maximal",
      submit: "Rechercher",
      noResults: "Aucun livre ne correspond à votre recherche.",
      previous: "Page précédente",
      next: "Page suivante",
    },
  },
  footer: {
    rights: "Tous droits réservés.",
  },
  auth: {
    email: "Adresse courriel",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    displayName: "Nom affiché",
    or: "ou",
    signIn: {
      title: "Connexion",
      submit: "Se connecter",
      magicLink: "Recevoir un lien de connexion par courriel",
      google: "Continuer avec Google",
      forgot: "Mot de passe oublié ?",
      noAccount: "Pas encore de compte ?",
      signUpLink: "Créer un compte",
    },
    signUp: {
      title: "Créer un compte",
      submit: "Créer mon compte",
      hasAccount: "Déjà inscrit ?",
      signInLink: "Se connecter",
      checkEmail:
        "Presque terminé ! Ouvrez le courriel de confirmation que nous venons d'envoyer.",
    },
    forgot: {
      title: "Mot de passe oublié",
      intro:
        "Saisissez votre adresse : nous vous enverrons un lien pour choisir " +
        "un nouveau mot de passe.",
      submit: "Envoyer le lien",
      sent: "Si un compte existe pour cette adresse, un courriel vient d'être envoyé.",
    },
    reset: {
      title: "Nouveau mot de passe",
      submit: "Enregistrer",
    },
    magicLinkSent: "Lien envoyé ! Consultez votre boîte de réception.",
    signOut: "Se déconnecter",
    errors: {
      invalidCredentials: "Adresse ou mot de passe incorrect.",
      emailNotConfirmed: "Confirmez d'abord votre adresse à l'aide du courriel reçu.",
      weakPassword: "Le mot de passe doit contenir au moins 8 caractères.",
      invalidEmail: "Adresse courriel invalide.",
      rateLimited: "Trop de tentatives. Réessayez dans quelques minutes.",
      linkExpired: "Ce lien est invalide ou a expiré. Demandez-en un nouveau.",
      generic: "Une erreur est survenue. Réessayez.",
    },
  },
  account: {
    title: "Mon compte",
    profile: "Profil",
    currency: "Devise préférée",
    currencyAuto: "Automatique",
    save: "Enregistrer",
    saved: "Profil enregistré.",
    adminLink: "Administration",
  },
  admin: {
    title: "Administration",
    welcome: "Bienvenue dans l'espace d'administration.",
    nav: {
      dashboard: "Tableau de bord",
      books: "Livres",
      authors: "Auteurs",
      categories: "Catégories",
      site: "Voir le site",
    },
    dashboard: {
      published: "Livres publiés",
      drafts: "Brouillons",
      authors: "Auteurs",
      categories: "Catégories",
    },
    common: {
      save: "Enregistrer",
      saved: "Modifications enregistrées.",
      create: "Créer",
      delete: "Supprimer",
      deleted: "Élément supprimé.",
      edit: "Modifier",
      back: "Retour à la liste",
      none: "Aucune",
      slug: "Identifiant d'URL (slug)",
      slugHelp: "Laisser vide pour le générer automatiquement.",
      view: "Voir la page publique",
      confirmDelete: "Confirmer la suppression",
      cancel: "Annuler",
      empty: "Aucun élément pour le moment.",
      updatedAt: "Modifié le",
    },
    categories: {
      title: "Catégories",
      new: "Nouvelle catégorie",
      name: "Nom",
      description: "Description",
      position: "Ordre d'affichage",
    },
    authors: {
      title: "Auteurs",
      new: "Nouvel auteur",
      name: "Nom affiché",
      bio: "Biographie",
      photo: "Photo",
      books: "Livres",
    },
    books: {
      title: "Livres",
      new: "Nouveau livre",
      edit: "Modifier le livre",
      bookTitle: "Titre",
      subtitle: "Sous-titre",
      edition: "Édition",
      summary: "Résumé",
      keywords: "Mots-clés (séparés par des virgules)",
      language: "Langue",
      author: "Auteur",
      category: "Catégorie",
      pageCount: "Nombre de pages",
      chapterCount: "Nombre de chapitres",
      year: "Année de publication",
      featured: "Mettre en avant sur l'accueil",
      status: "Statut",
      rejectionReason: "Motif du refus (obligatoire si refusé)",
      prices: "Prix",
      pricesHelp: "Laisser vide si le livre n'est pas vendu dans cette devise.",
      cover: "Couverture",
      featuredBadge: "À la une",
      statuses: {
        draft: "Brouillon",
        submitted: "Soumis",
        published: "Publié",
        rejected: "Refusé",
      },
    },
    upload: {
      choose: "Choisir une image (JPEG, PNG ou WebP, 5 Mo max.)",
      uploading: "Envoi en cours…",
      done: "Image enregistrée.",
      invalidType: "Format refusé : JPEG, PNG ou WebP uniquement.",
      tooLarge: "Image trop lourde (5 Mo maximum).",
      failed: "L'envoi a échoué. Réessayez.",
    },
    errors: {
      required: "Champ obligatoire manquant : {field}.",
      tooLong: "Texte trop long : {field}.",
      invalidSlug: "Identifiant d'URL invalide (lettres minuscules, chiffres et tirets).",
      slugTaken: "Cet identifiant d'URL est déjà utilisé.",
      invalidNumber: "Nombre invalide : {field}.",
      invalidPrice: "Prix invalide en {currency}.",
      invalidChoice: "Valeur non autorisée : {field}.",
      rejectionReason: "Indiquez le motif du refus.",
      authorHasBooks: "Impossible : cet auteur a encore des livres.",
      generic: "L'enregistrement a échoué. Réessayez.",
    },
    mfa: {
      title: "Vérification en deux étapes",
      enrollIntro:
        "Scannez ce code avec une application d'authentification (Google Authenticator, " +
        "Microsoft Authenticator, 1Password…), puis saisissez le code à 6 chiffres.",
      secretLabel: "Ou saisissez cette clé manuellement :",
      challengeIntro: "Saisissez le code à 6 chiffres affiché par votre application.",
      code: "Code à 6 chiffres",
      verify: "Vérifier",
      invalidCode: "Code incorrect. Réessayez.",
    },
  },
};

export default fr;

/** Structure attendue de tout dictionnaire de langue. */
export type Dictionary = typeof fr;
