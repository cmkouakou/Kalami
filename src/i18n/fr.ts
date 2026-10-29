/**
 * =============================================================
 *  Fichier    : fr.ts
 *  Projet     : Kalami
 *  Description: Textes de l'interface en français (langue par défaut).
 *               « {appName} » est remplacé par APP_NAME au moment de l'affichage.
 *  Auteur     : Claude Marcel
 *  Version    : 1.7
 *  Date       : 2026-10-29
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
    search: "Rechercher un livre ou un auteur",
    home: "Kalami, accueil",
  },
  home: {
    seoTitle: "{appName} — Livres d'auteurs africains et francophones en ligne",
    kicker: "Librairie en ligne",
    title: "Des livres pour comprendre, décider et avancer.",
    subtitle:
      "Découvrez le sommaire et un extrait gratuit, puis poursuivez la lecture " +
      "après achat par carte bancaire ou Mobile Money.",
    comingSoon: "Le catalogue ouvre bientôt.",
    browse: "Parcourir le catalogue",
    readExcerpt: "Lire un extrait gratuit",
    exploreCategories: "Explorer par catégorie",
    benefits: [
      {
        title: "Extrait gratuit",
        text: "Lisez le début de chaque livre sans inscription avant de vous décider.",
      },
      {
        title: "Sur tous vos écrans",
        text: "Ordinateur, tablette ou téléphone : la lecture reprend là où vous l'avez laissée.",
      },
      {
        title: "Lecture protégée",
        text: "Les livres restent en ligne, avec un filigrane personnel, pour respecter les auteurs.",
      },
    ],
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
      tocSoon: "Le sommaire de ce livre sera bientôt disponible.",
      freeExcerpt: "Extrait gratuit",
      words: "{count} mots",
      readExcerpt: "Lire l'extrait",
      readExcerptHint: "Extrait gratuit, sans inscription",
      buy: "Acheter",
      aboutAuthor: "À propos de l'auteur",
      breadcrumb: "Fil d'Ariane",
      home: "Accueil",
      free: "Gratuit",
      included: "Inclus à l'achat",
    },
    purchase: {
      payIn: "Payer en",
      buyIn: "Acheter — {price}",
      redirecting: "Ouverture du paiement sécurisé…",
      signInToBuy: "Se connecter pour acheter",
      owned: "Ce livre fait partie de votre bibliothèque.",
      secure:
        "Paiement par carte, sécurisé par Stripe. En FCFA : Mobile Money (Wave, Orange " +
        "Money, MTN MoMo ou Moov Money), validé à la main sous 24 h.",
      promoToggle: "J'ai un code promo",
      promoLabel: "Code promo",
      promoApply: "Appliquer",
      promoChecking: "Vérification…",
      promoApplied: "Code {code} appliqué.",
      promoRemove: "Retirer le code",
      promoNotInCurrency:
        "Ce code ne s'applique pas aux paiements dans cette devise.",
      priceBefore: "Prix avant réduction :",
      waiver:
        "Je demande l'accès immédiat à ce contenu numérique et je reconnais perdre mon " +
        "droit de rétractation dès qu'il m'est fourni (voir les",
      waiverLink: "Conditions de vente",
      errors: {
        waiver_required:
          "Cochez la case d'accès immédiat pour continuer vers le paiement.",
        already_owned: "Vous possédez déjà ce livre : rechargez la page.",
        rate_limited: "Trop de tentatives en une heure. Réessayez plus tard.",
        not_for_sale: "Cet article n'est pas vendu dans cette devise.",
        not_allowed:
          "Seul le propriétaire de l'étude ou son enseignant peut faire cet achat.",
        stripe_unavailable:
          "Le service de paiement ne répond pas. Réessayez dans un instant.",
        promo_invalid: "Ce code promo n'existe pas ou n'est plus actif.",
        promo_expired: "Ce code promo a expiré.",
        promo_exhausted:
          "Ce code promo a atteint son nombre maximal d'utilisations.",
        promo_used: "Vous avez déjà utilisé ce code promo.",
        promo_not_applicable:
          "Ce code promo ne s'applique pas à cet article ou à cette devise.",
        promo_too_low:
          "La réduction est trop forte pour cet article : le code ne s'applique pas.",
        generic: "Le paiement n'a pas pu démarrer. Réessayez.",
      },
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
    tagline: "Lecture en ligne d'ouvrages d'auteurs africains et francophones.",
    explore: "Explorer",
    legal: "Informations légales",
  },
  strategyPromo: {
    label: "Kalami Stratégie",
    title: "Appliquez la démarche à votre organisation",
    text:
      "Kalami Stratégie vous guide étape par étape, de l'analyse au plan stratégique, " +
      "seul ou en équipe.",
    cta: "Découvrir Kalami Stratégie",
  },
  content: {
    openingTitle: "Début de l'ouvrage",
    chapterTitle: "Chapitre {n}",
    api: {
      locked: "Ce chapitre est réservé aux lecteurs qui ont acheté le livre.",
      notFound: "Chapitre introuvable.",
      tooManyRequests:
        "Trop de chapitres demandés en peu de temps. Réessayez dans une minute.",
      badRequest: "Requête invalide.",
      unauthorized: "Connexion requise.",
    },
  },
  pdf: {
    copyOf: "Exemplaire de",
    contents: "Sommaire",
    by: "par",
    title: "Version PDF",
    help:
      "Fichier personnel : chaque page porte votre nom, votre courriel et la référence {ref}. " +
      "Merci de ne pas le partager.",
    remaining: "Téléchargements restants : {count} sur 3",
    prepare: "Préparer mon PDF",
    preparing: "Préparation du PDF… (jusqu'à une minute)",
    download: "Télécharger le PDF",
    expiresAt: "Lien valable jusqu'au {date}.",
    errors: {
      no_purchase: "Vous n'avez pas l'option PDF pour ce livre.",
      exhausted:
        "Vous avez utilisé vos 3 téléchargements. Écrivez-nous si vous avez perdu le fichier.",
      unavailable: "Ce livre ne peut pas être imprimé en PDF pour le moment.",
      expired:
        "Ce lien a expiré : préparez un nouveau PDF depuis la fiche du livre.",
      revoked: "L'option PDF a été retirée de votre compte.",
      not_found: "Fichier introuvable.",
      generic:
        "La préparation du PDF a échoué. Réessayez dans quelques minutes.",
    },
    back: "Retour au livre",
  },
  reader: {
    metaTitle: "Lecture — {title}",
    close: "Fermer la liseuse",
    loading: "Chargement du chapitre…",
    loadError: "Impossible de charger ce chapitre. Vérifiez votre connexion.",
    retry: "Réessayer",
    previousPage: "Page précédente",
    nextPage: "Page suivante",
    previousChapter: "Chapitre précédent",
    nextChapter: "Chapitre suivant",
    pageOf: "Page {current} sur {total}",
    pageShort: "p. {current}",
    coverAlt: "Couverture de « {title} »",
    backCoverAlt: "Quatrième de couverture de « {title} »",
    progress: "{percent} % du livre",
    seekLabel: "Aller à un endroit du livre",
    seekTarget: "{title} · {percent} %",
    bookStart: "Début du livre",
    bookEnd: "Fin du livre",
    toolbar: "Outils de lecture",
    desktopView:
      "Votre navigateur affiche la « version pour ordinateur » : le texte est réduit. " +
      "Décochez-la dans le menu du navigateur (⋮ ou aA) pour lire confortablement.",
    desktopViewClose: "Fermer cet avis",
    resume: "Reprendre la lecture ({percent} %)",
    readBook: "Lire le livre",
    protection:
      "Le texte est protégé : copie et impression désactivées. La sélection sert seulement à " +
      "surligner, annoter, citer ou partager un court extrait. Les captures d'écran restent " +
      "possibles, chaque page porte un filigrane personnel.",
    printBlocked: "L'impression de ce livre n'est pas autorisée.",
    shortcuts: "Flèches : tourner les pages · Échap : fermer un panneau",
    panels: {
      toc: "Sommaire",
      bookmarks: "Signets",
      annotations: "Annotations",
      search: "Rechercher",
      settings: "Réglages",
      close: "Fermer le panneau",
    },
    colors: {
      jaune: "Jaune",
      vert: "Vert",
      bleu: "Bleu",
      rose: "Rose",
      orange: "Orange",
    },
    selection: {
      menu: "Actions sur le passage",
      highlight: "Surligner en {color}",
      note: "Ajouter une note",
      editNote: "Modifier la note",
      cite: "Citer",
      share: "Partager",
      remove: "Retirer le surlignage",
      signIn: "Connectez-vous pour annoter",
      notePlaceholder: "Votre note sur ce passage",
      noteLabel: "Note",
      saveNote: "Enregistrer la note",
      cancel: "Annuler",
    },
    annotations: {
      empty:
        "Aucune annotation pour ce livre. Sélectionnez un passage pour le surligner.",
      noMatch: "Aucune annotation ne correspond à ces critères.",
      filter: "Filtrer les annotations",
      search: "Rechercher dans les annotations",
      allColors: "Toutes",
      count: "{count} annotation(s)",
      open: "Aller au passage",
      remove: "Supprimer l'annotation « {quote} »",
      signInRequired:
        "Connectez-vous pour surligner et annoter sur tous vos appareils.",
      signIn: "Se connecter",
      noteTooLong: "La note ne peut dépasser 2000 caractères.",
      tooMany: "Nombre maximal d'annotations atteint pour ce livre.",
      error: "Impossible d'enregistrer l'annotation. Réessayez.",
    },
    cite: {
      title: "Citer ce passage",
      excerptCut: "Extrait limité à 280 caractères.",
      inText: "Dans le texte :",
      apa: "APA (7e éd.)",
      mla: "MLA (9e éd.)",
      chicago: "Chicago",
      copy: "Copier",
      copied: "Copiée !",
      copyError: "Copie impossible : sélectionnez la référence à la main.",
      close: "Fermer",
    },
    share: {
      title: "Partager un extrait",
      intro:
        "Une image de l'extrait (280 caractères au plus) avec le titre et le lien du livre.",
      preview: "Aperçu de l'image partagée",
      send: "Partager l'image",
      download: "Télécharger l'image",
      linkCopied: "Image téléchargée et lien du livre copié.",
      error: "Partage impossible pour le moment.",
      book: "Partager ce livre",
      bookCopied: "Lien du livre copié.",
      bookText: "« {title} » de {author}, à lire sur {app}",
      close: "Fermer",
    },
    toc: {
      locked: "Réservé aux acheteurs",
      current: "Chapitre en cours",
    },
    bookmarks: {
      add: "Ajouter un signet ici",
      label: "Nom du signet",
      save: "Enregistrer",
      empty: "Aucun signet pour ce livre.",
      remove: "Supprimer le signet « {label} »",
      signInRequired:
        "Connectez-vous pour enregistrer des signets sur tous vos appareils.",
      signIn: "Se connecter",
      invalid: "Le nom du signet doit compter de 1 à 120 caractères.",
      tooMany: "Nombre maximal de signets atteint pour ce livre.",
      error: "Impossible d'enregistrer le signet. Réessayez.",
    },
    search: {
      field: "Mot ou expression",
      submit: "Rechercher",
      searching: "Recherche…",
      tooShort: "Saisissez de 2 à 100 caractères.",
      noResults: "Aucun résultat dans les parties que vous pouvez lire.",
      results: "{count} résultat(s)",
      limited: "Seuls les {count} premiers résultats sont affichés.",
      previewOnly: "La recherche porte uniquement sur l'extrait gratuit.",
      error: "Recherche impossible pour le moment. Réessayez.",
    },
    settings: {
      mode: "Mode de lecture",
      flip: "Pages à tourner",
      scroll: "Défilement",
      phoneScroll: "Sur téléphone, le livre se lit en défilement.",
      theme: "Thème",
      light: "Clair",
      sepia: "Sépia",
      dark: "Sombre",
      font: "Police",
      serif: "Avec empattements",
      sans: "Sans empattements",
      fontSize: "Taille du texte",
      smaller: "Réduire le texte",
      larger: "Agrandir le texte",
      lineHeight: "Interligne",
      lineHeights: ["Serré", "Normal", "Aéré"],
    },
    readAloud: {
      start: "Lire à voix haute",
      pause: "Mettre en pause",
      resume: "Reprendre la lecture à voix haute",
      stop: "Arrêter la lecture à voix haute",
      unsupported:
        "La lecture à voix haute n'est pas disponible dans ce navigateur.",
      title: "Lecture à voix haute",
      voice: "Voix",
      recommended: "recommandée",
      preview: "Écouter",
      rate: "Vitesse",
      rates: ["Lente", "Normale", "Rapide", "Très rapide"],
      noVoice:
        "Aucune voix de la langue du livre n'est installée sur cet appareil.",
      betterVoices:
        "Pour une voix plus naturelle : utilisez Microsoft Edge (voix « Natural ») ou " +
        "installez une voix « améliorée » dans les réglages d'accessibilité de votre appareil.",
    },
    lock: {
      title: "Vous avez terminé l'extrait gratuit",
      text: "La suite de « {title} » est réservée aux lecteurs qui ont acheté le livre.",
      signIn: "Vous avez déjà acheté ce livre ? Connectez-vous.",
      backToBook: "Retour à la fiche du livre",
    },
    end: {
      title: "Fin du livre",
      text: "Vous avez terminé « {title} ». Merci de votre lecture !",
      backToBook: "Retour à la fiche du livre",
    },
  },
  auth: {
    email: "Adresse courriel",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    displayName: "Nom affiché",
    or: "ou",
    tabsLabel: "Connexion ou création de compte",
    signIn: {
      title: "Connexion",
      submit: "Se connecter",
      magicLink: "Recevoir un lien de connexion par courriel",
      google: "Continuer avec Google",
      forgot: "Mot de passe oublié ?",
      signUpLink: "Créer un compte",
    },
    signUp: {
      title: "Créer un compte",
      submit: "Créer mon compte",
      signInLink: "Se connecter",
      ageConfirm: "J'ai 14 ans ou plus, ou l'accord d'un parent ou tuteur.",
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
      emailNotConfirmed:
        "Confirmez d'abord votre adresse à l'aide du courriel reçu.",
      weakPassword: "Le mot de passe doit contenir au moins 8 caractères.",
      invalidEmail: "Adresse courriel invalide.",
      rateLimited: "Trop de tentatives. Réessayez dans quelques minutes.",
      linkExpired: "Ce lien est invalide ou a expiré. Demandez-en un nouveau.",
      ageRequired: "Confirmez avoir 14 ans ou plus, ou l'accord d'un parent ou tuteur.",
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
    purchasesLink: "Mes achats",
    purchases: {
      title: "Mes achats",
      empty: "Vous n'avez encore rien acheté.",
      browse: "Parcourir le catalogue",
      paidOn: "Payé le {date}",
      pending: "Paiement en cours de confirmation",
      refundedOn: "Remboursé le {date}",
      receipt: "Reçu",
      read: "Lire",
      openStrategy: "Ouvrir Kalami Stratégie",
      openCoach: "Ouvrir le coach",
      openCase: "Ouvrir le cas",
      openWorkshop: "Ouvrir l'atelier",
      mmToPay: "Mobile Money : en attente de votre paiement",
      mmToReview: "Mobile Money : paiement en cours de vérification",
      mmRejected: "Mobile Money : paiement refusé",
      mmOpen: "Voir la commande",
      thanks: {
        title: "Merci pour votre achat !",
        paid: "Votre paiement est confirmé : « {label} » est dans votre bibliothèque.",
        paidCredits:
          "Votre paiement est confirmé : {credits} crédit(s) d'étude ont été ajoutés à " +
          "votre compte.",
        paidPack:
          "Votre paiement est confirmé : « {label} » est ajouté au coach de l'étude.",
        paidCase:
          "Votre paiement est confirmé : « {label} » est ouvert. Votre étude préremplie " +
          "vous attend.",
        paidWorkshop:
          "Votre paiement est confirmé : « {label} » est ajouté à votre atelier d'auteur.",
        refunded: "Cette commande a été remboursée.",
        bonus: "Une étude Kalami Stratégie vous est offerte avec ce livre.",
        bonusLink: "Commencer une étude",
        waiting:
          "Nous attendons la confirmation de Stripe. Cela prend quelques secondes…",
        slow:
          "La confirmation tarde. Votre paiement n'est pas perdu : l'accès s'ouvrira dès " +
          "sa réception. Consultez « Mes achats » dans quelques minutes.",
        expired:
          "Cette session de paiement a expiré : aucun montant n'a été prélevé.",
        notFound: "Commande introuvable.",
      },
    },
    authorLink: "Espace auteur",
    becomeAuthor: "Devenir auteur",
    becomeAuthorHelp:
      "Publiez vos livres sur Kalami : l'inscription est libre, chaque livre est relu " +
      "avant publication.",
    privacy: {
      title: "Mes données",
      intro:
        "Téléchargez une copie de vos renseignements personnels (format JSON) : profil, " +
        "accès aux livres, lecture, annotations, études et consentements.",
      export: "Télécharger mes données",
      policyLink: "Politique de confidentialité",
    },
    deletion: {
      title: "Supprimer mon compte",
      intro:
        "La suppression est définitive. Elle est exécutée 30 jours après votre demande ; " +
        "vous pouvez l'annuler d'ici là.",
      impactTitle: "Ce qui sera supprimé avec votre compte",
      impactBase:
        "Votre profil, vos accès aux livres, vos positions de lecture, signets, surlignages " +
        "et notes.",
      impactStudies:
        "{count} étude(s) Kalami Stratégie dont vous êtes propriétaire.",
      impactShared:
        "Dont {count} partagée(s) avec d'autres membres : elles disparaîtront aussi pour " +
        "eux. Exportez les plans utiles avant la suppression.",
      impactClasses: "{count} classe(s) que vous animez.",
      impactAuthor:
        "Votre fiche d'auteur et vos livres publiés restent en ligne, détachés de votre " +
        "compte ; écrivez-nous pour les retirer.",
      confirmLabel: "Pour confirmer, saisissez SUPPRIMER",
      confirmWord: "SUPPRIMER",
      confirmMismatch: "Saisissez SUPPRIMER en majuscules pour confirmer.",
      request: "Demander la suppression",
      requested: "Demande enregistrée.",
      pending: "Votre compte sera supprimé le {date}.",
      pendingHelp:
        "Vous changez d'avis ? Annulez la demande, votre compte reste intact.",
      cancel: "Annuler la suppression",
      cancelled: "Suppression annulée.",
    },
  },
  author: {
    title: "Espace auteur",
    intro: "Vos livres, leur état de validation et ce qu'en font vos lecteurs.",
    nav: {
      dashboard: "Tableau de bord",
      profile: "Profil et versements",
      contract: "Contrat",
      revenue: "Revenus",
      workshop: "Atelier",
    },
    dashboard: {
      books: "Mes livres",
      newBook: "Nouveau livre",
      noBooks: "Aucun livre pour le moment. Commencez par créer sa fiche.",
      readers: "{count} lecteurs",
      highlights: "{count} surlignages",
      pendingVersion: "Nouvelle version en attente",
      salesTitle: "Ventes et revenus",
      salesIntro:
        "Votre part des ventes de vos livres, disponible après le délai de garde.",
      salesNone: "Aucune vente pour le moment.",
      salesAvailable: "{amount} disponibles",
      salesLink: "Voir mes revenus",
    },
    revenue: {
      title: "Revenus",
      intro:
        "Vos ventes, votre part et ce qui est disponible pour un versement.",
      share:
        "Votre part : {share} % du montant net (après frais de paiement et taxes).",
      hold: "Une vente devient disponible {days} jours après le paiement.",
      minimum: "Versement possible dès {xof}, {eur} ou {cad} disponibles.",
      payoutsIntro:
        "Une demande verse tout votre disponible d'une devise. Kalami paie les frais du " +
        "virement ou du transfert.",
      payoutDetails: "Coordonnées de versement",
      balancesTitle: "Soldes par devise",
      none: "Aucune vente pour le moment.",
      available: "Disponible",
      pending: "En attente",
      earned: "Total gagné",
      requested: "Demande en cours",
      paid: "Déjà versé",
      sales: "{count} ventes nettes · {gross} vendus",
      request: "Demander le versement de {amount}",
      requestSent:
        "Demande envoyée. L'équipe Kalami la traite sous quelques jours.",
      blockers: {
        open: "Une demande est déjà en cours pour cette devise.",
        below_minimum: "Versement possible à partir de {minimum} disponibles.",
        no_details: "Renseignez d'abord vos coordonnées de versement.",
      },
      payoutsTitle: "Mes demandes de versement",
      payoutsNone: "Aucune demande pour le moment.",
      reference: "Référence",
      amount: "Montant",
      status: "Statut",
      requestedOn: "Demandé le",
      details: "Détails",
      cancel: "Annuler la demande",
      cancelSent: "Demande annulée : le montant est de nouveau disponible.",
      statuses: {
        requested: "Demandée",
        approved: "Approuvée",
        paid: "Payée",
        rejected: "Refusée",
        cancelled: "Annulée",
      },
      paidOn: "Payé le {date} · transaction {reference}",
      rejectedBecause: "Motif : {reason}",
      errors: {
        invalid_currency: "Devise inconnue.",
        no_payout_details: "Renseignez d'abord vos coordonnées de versement.",
        payout_open: "Une demande est déjà en cours pour cette devise.",
        below_minimum:
          "Votre disponible n'atteint pas encore le seuil de versement.",
        payout_not_found: "Cette demande ne peut plus être annulée.",
      },
      entriesTitle: "Dernières écritures",
      date: "Date",
      book: "Livre",
      type: "Type",
      gross: "Prix payé",
      yourShare: "Votre part",
      availableAt: "Disponible le",
      types: { sale: "Vente", refund: "Remboursement" },
    },
    register: {
      title: "Devenir auteur",
      intro:
        "Créez votre fiche d'auteur. Elle sera visible des lecteurs dès la publication de " +
        "votre premier livre.",
      closed: "Les inscriptions des auteurs ouvrent bientôt.",
      closedExternal:
        "Kalami publie pour l'instant les livres de son fondateur. Le dépôt par des " +
        "auteurs externes ouvrira plus tard.",
      displayName: "Nom d'auteur (affiché aux lecteurs)",
      slug: "Adresse de votre page (laisser vide pour la générer)",
      bio: "Biographie (facultative)",
      accept: "J'ai lu et j'accepte le contrat auteur (version {version}).",
      submit: "Créer ma fiche d'auteur",
      acceptRequired: "Vous devez accepter le contrat pour continuer.",
      alreadyAuthor: "Vous avez déjà une fiche d'auteur.",
    },
    contract: {
      title: "Contrat auteur",
      version: "Version {version} — publiée le {date}",
      acceptedOn: "Accepté le {date}.",
      newVersion:
        "Une nouvelle version du contrat a été publiée. Acceptez-la pour soumettre vos livres.",
      accept: "J'accepte cette version",
      accepted: "Contrat accepté.",
      outdated: "Le contrat vient de changer : relisez la nouvelle version.",
    },
    profile: {
      title: "Profil et versements",
      public: "Fiche publique",
      photo: "Photo",
      payout: "Coordonnées de versement",
      payoutHelp:
        "Utilisées pour vous verser vos revenus. Seuls vous et l'équipe Kalami les voyez.",
      method: "Mode de versement",
      methods: { bank: "Virement bancaire", mobile_money: "Mobile Money" },
      accountHolder: "Titulaire du compte",
      bankName: "Banque",
      accountNumber: "Numéro de compte ou IBAN",
      swift: "Code SWIFT/BIC (facultatif)",
      mobileOperator: "Opérateur",
      operators: {
        orange: "Orange Money",
        mtn: "MTN MoMo",
        moov: "Moov Money",
        wave: "Wave",
      },
      mobileNumber: "Numéro Mobile Money",
      bankFields: "Pour un virement : banque et numéro de compte obligatoires.",
      mobileFields: "Pour Mobile Money : opérateur et numéro obligatoires.",
    },
    book: {
      newTitle: "Nouveau livre",
      created: "Fiche créée. Ajoutez maintenant la couverture et le manuscrit.",
      back: "Retour à l'espace auteur",
      details: "Fiche du livre",
      locked:
        "Fiche verrouillée pendant la validation et après publication. Pour corriger le " +
        "texte d'un livre publié, déposez une nouvelle version.",
      rejected: "Livre refusé. Motif : {reason}",
      manuscriptHelp:
        "Le texte déposé reste privé jusqu'à sa validation. Un nouveau dépôt remplace la " +
        "version en attente.",
      pending: "Version en attente : {chapters} chapitres, {words} mots.",
      current: "Version publiée : {chapters} chapitres, {words} mots.",
      noVersion: "Aucun manuscrit déposé pour le moment.",
      preview: "Prévisualiser dans la liseuse",
      submissionOpen: "Demande de validation en cours depuis le {date}.",
      submitTitle: "Validation",
      submitHelp:
        "Avant d'envoyer : résumé, catégorie, au moins un prix et un manuscrit converti.",
      submit: "Soumettre pour validation",
      submitUpdate: "Soumettre la nouvelle version",
      submitted: "Demande envoyée. Vous serez informé de la décision.",
      history: "Historique des demandes",
      kinds: { first: "Première publication", update: "Nouvelle version" },
      submissionStatuses: {
        submitted: "En attente",
        approved: "Validée",
        rejected: "Refusée",
      },
      topPassages: "Passages les plus surlignés",
      topPassagesHelp:
        "Affichés à partir de 3 lecteurs différents, sans les identifier.",
      noTopPassages: "Pas encore assez de surlignages.",
      passage: "Chapitre {chapter} — {readers} lecteurs",
    },
    errors: {
      contract_required:
        "Acceptez la dernière version du contrat avant de soumettre.",
      already_submitted: "Une demande de validation est déjà en cours.",
      missing_version: "Déposez et convertissez d'abord un manuscrit.",
      incomplete:
        "Fiche incomplète : résumé, catégorie et au moins un prix sont requis.",
      submission_open:
        "Impossible de déposer une version pendant la validation.",
      notAuthor: "Créez d'abord votre fiche d'auteur.",
      authors_closed:
        "Le dépôt de livres par des auteurs externes est fermé pour le moment.",
    },
  },
  admin: {
    title: "Administration",
    welcome: "Bienvenue dans l'espace d'administration.",
    nav: {
      dashboard: "Tableau de bord",
      books: "Livres",
      authors: "Auteurs",
      categories: "Catégories",
      submissions: "Soumissions",
      contract: "Contrat auteur",
      legal: "Textes légaux",
      strategy: "Stratégie",
      orders: "Commandes",
      promos: "Codes promo",
      mobileMoney: "Mobile Money",
      revenue: "Revenus",
      payouts: "Versements",
      workshop: "Atelier des auteurs",
      audit: "Journal",
      audience: "Lecture et audience",
      site: "Voir le site",
      strategyOverview: "Vue d'ensemble",
      strategySteps: "Étapes et guides",
      strategyCoach: "Coach IA",
      menu: "Menu de l'administration",
      toDo: "{count} à traiter",
      groups: {
        overview: "Pilotage",
        catalog: "Catalogue",
        sales: "Ventes",
        strategy: "Kalami Stratégie",
        legal: "Juridique et sécurité",
      },
    },
    audience: {
      title: "Lecture et audience",
      intro:
        "Qui lit quoi, depuis quand, et d'où viennent les visiteurs. Visites anonymes (sans " +
        "témoin ni adresse IP) ; détail conservé 12 mois, puis réduit en totaux mensuels.",
      period: "Période",
      periodDays: "{days} jours",
      periodYear: "12 mois",
      tiles: {
        entries: "Visites",
        views: "Pages vues",
        readers: "Lecteurs actifs",
        readingTime: "Temps de lecture",
        newReaders: "Nouvelles lectures",
        inactive: "Sans lecture depuis {days} j",
      },
      daysTitle: "Jour par jour",
      dayVisits: "{entries} visites, {views} pages vues",
      dayReading: "{readers} lecteurs, {time}",
      pagesTitle: "Pages les plus vues",
      page: "Page",
      countriesTitle: "Pays",
      country: "Pays",
      unknownCountry: "Inconnu",
      sourcesTitle: "Provenance des visites",
      source: "Origine",
      sources: {
        direct: "Accès direct",
        search: "Moteurs de recherche",
        social: "Réseaux sociaux",
        email: "Courriel",
        website: "Autres sites",
      },
      readersTitle: "Lecteurs",
      readersNone: "Aucun lecteur pour ce filtre.",
      statusLabel: "Statut",
      allStatuses: "Tous",
      status: {
        active: "Actif",
        paused: "En pause",
        abandoned: "Abandonné",
        finished: "Terminé",
      },
      reader: "Lecteur",
      book: "Livre",
      progress: "Avancement",
      chapter: "Chapitre {current} / {total}",
      chaptersOpened: "{count} chapitres ouverts",
      started: "Début",
      sinceStart: "il y a {days} j",
      lastRead: "Dernière lecture",
      idle: "{days} j sans lecture",
      idleToday: "aujourd'hui",
      totalTime: "Temps total",
      activeDays: "{count} jours actifs",
      details: "Fiche",
      views: "Vues",
      entries: "Visites",
      readers: "Lecteurs",
      noData: "Aucune donnée pour cette période.",
      readerTitle: "Fiche lecteur",
      back: "Retour à Lecture et audience",
      readerBooks: "Livres lus",
      readerDays: "Activité jour par jour",
      day: "Jour",
      time: "Temps",
      chapters: "Chapitres ouverts",
      readerNotFound: "Ce lecteur n'a encore rien lu.",
      untilTracking:
        "Le temps de lecture, les chapitres et le pays sont mesurés depuis la v0.16.1 ; " +
        "les lectures plus anciennes n'ont que le début, la dernière lecture et l'avancement.",
    },
    dashboard: {
      published: "Livres publiés",
      drafts: "Brouillons",
      authors: "Auteurs",
      categories: "Catégories",
      submissions: "Soumissions en attente",
      todoTitle: "À traiter",
      payoutsOpen: "Versements à traiter",
      mmToReview: "Paiements Mobile Money à valider",
      catalogTitle: "Catalogue",
      monthTitle: "Ventes du mois",
      monthNone: "Aucune vente ce mois-ci.",
      monthSales: "{count} ventes nettes",
      monthGross: "Encaissé",
      monthCommission: "Commission Kalami",
      monthAuthors: "Part des auteurs",
      revenueLink: "Voir les revenus",
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
      depositTitle: "Dépôt par des auteurs externes",
      depositOpen:
        "Ouvert : toute personne inscrite peut créer sa fiche et soumettre un livre.",
      depositClosed:
        "Fermé : seuls vos propres livres sont publiés. Les inscriptions, créations de " +
        "livres et soumissions des autres comptes sont refusées.",
      openDeposit: "Ouvrir le dépôt aux auteurs externes",
      closeDeposit: "Fermer le dépôt",
      depositOpened: "Dépôt ouvert aux auteurs externes.",
      depositClosedDone: "Dépôt fermé aux auteurs externes.",
    },
    books: {
      title: "Livres",
      new: "Nouveau livre",
      edit: "Modifier le livre",
      readFull: "Lire le livre complet (aperçu)",
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
      pdfEnabled: "Proposer aussi en PDF filigrané (au nom de l'acheteur)",
      status: "Statut",
      rejectionReason: "Motif du refus (obligatoire si refusé)",
      prices: "Prix",
      pricesHelp: "Laisser vide si le livre n'est pas vendu dans cette devise.",
      cover: "Couverture",
      backCover: "Quatrième de couverture",
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
    content: {
      title: "Contenu du livre",
      manuscript: "Manuscrit",
      choose: "Choisir un fichier Word, PDF ou EPUB (20 Mo max.)",
      help:
        "Word : chaque « Titre 1 » ouvre un chapitre ; sans styles, les lignes « Chapitre 2 » " +
        "ou en gras sont reconnues. PDF : les titres sont repérés à leur taille, les en-têtes " +
        "et numéros de page retirés. EPUB : les chapitres suivent la table des matières. La " +
        "typographie est harmonisée ; vérifiez le résultat dans l'aperçu. Word : les schémas " +
        "et les encadrés colorés sont conservés (pas les images d'un PDF ou d'un EPUB).",
      uploading: "Envoi du fichier…",
      converting: "Conversion en cours…",
      converted: "Conversion réussie : {count} chapitres.",
      invalidType: "Format refusé : Word (DOCX), PDF ou EPUB uniquement.",
      tooLarge: "Fichier trop lourd (20 Mo maximum).",
      noVersion: "Aucun manuscrit converti pour le moment.",
      currentVersion:
        "Version {number} ({format}) — {chapters} chapitres, {words} mots",
      toc: "Sommaire converti",
      preview: "Extrait gratuit",
      previewChapters: "Nombre de chapitres de l'extrait",
      previewCut:
        "Coupure dans le dernier chapitre (nombre de blocs, vide = chapitre entier)",
      previewHelp:
        "Un bloc = un paragraphe, un intertitre, une liste ou un tableau. 0 chapitre = aucun " +
        "extrait.",
      blocks: "{count} blocs",
      entitlements: "Droits de lecture",
      entitlementsHelp:
        "Les achats accorderont ces droits automatiquement (Sprints 5 et 6). Ici : accès " +
        "manuel, par exemple pour un relecteur.",
      grantEmail: "Courriel du lecteur",
      grantNote: "Note (facultative)",
      grant: "Accorder l'accès",
      granted: "Accès accordé.",
      revoke: "Retirer",
      revoked: "Accès retiré.",
      revokeConfirm: "Confirmer le retrait",
      noEntitlements: "Aucun droit de lecture.",
      sources: { purchase: "Achat", admin_grant: "Accès manuel" },
      pdf: {
        title: "Option PDF",
        help:
          "Chaque option donne 3 téléchargements d'un PDF filigrané au nom du lecteur ; elle " +
          "ouvre aussi la lecture en ligne. Les achats l'accorderont automatiquement.",
        disabled:
          "Cochez « Proposer aussi en PDF » dans la fiche du livre pour l'activer.",
        grant: "Accorder l'option PDF",
        granted: "Option PDF accordée.",
        revoke: "Retirer",
        revoked: "Option PDF retirée.",
        revokeConfirm: "Confirmer le retrait",
        reset: "Remettre 3 téléchargements",
        resetDone: "Téléchargements remis à 3.",
        none: "Aucune option PDF.",
        remaining: "{count} téléchargement(s) restant(s)",
        alreadyGranted: "Ce lecteur a déjà l'option PDF.",
        pdfDisabled: "L'option PDF n'est pas activée pour ce livre.",
      },
      errors: {
        invalid_file:
          "Fichier illisible : ce n'est pas un DOCX, un PDF ou un EPUB valide.",
        scanned:
          "Ce PDF ne contient pas de texte (document numérisé) : envoyez le fichier Word " +
          "d'origine ou un PDF exporté depuis votre traitement de texte.",
        empty: "Aucun texte trouvé dans le fichier.",
        too_large: "Livre trop volumineux pour être converti.",
        too_many_chapters: "Trop de chapitres (500 maximum).",
        userNotFound: "Aucun compte n'utilise cette adresse.",
        alreadyGranted: "Ce lecteur a déjà accès au livre.",
        previewCutTooHigh:
          "La coupure doit être inférieure au nombre de blocs du chapitre.",
      },
    },
    errors: {
      required: "Champ obligatoire manquant : {field}.",
      tooLong: "Texte trop long : {field}.",
      invalidSlug:
        "Identifiant d'URL invalide (lettres minuscules, chiffres et tirets).",
      slugTaken: "Cet identifiant d'URL est déjà utilisé.",
      invalidNumber: "Nombre invalide : {field}.",
      invalidPrice: "Prix invalide en {currency}.",
      invalidChoice: "Valeur non autorisée : {field}.",
      rejectionReason: "Indiquez le motif du refus.",
      authorHasBooks: "Impossible : cet auteur a encore des livres.",
      generic: "L'enregistrement a échoué. Réessayez.",
    },
    submissions: {
      title: "Soumissions en attente",
      empty: "Aucune demande de validation en attente.",
      book: "Livre",
      author: "Auteur",
      kind: "Type",
      date: "Envoyée le",
      review: "Décision",
      reviewHelp:
        "Prévisualisez la version soumise, puis validez-la (elle devient la version publiée) " +
        "ou refusez-la avec un motif transmis à l'auteur.",
      pending: "Version soumise : {chapters} chapitres, {words} mots.",
      approve: "Valider et publier",
      approved: "Version validée et publiée.",
      reason: "Motif du refus (transmis à l'auteur)",
      reject: "Refuser",
      rejected: "Demande refusée.",
      closed: "Cette demande a déjà été traitée.",
    },
    contract: {
      title: "Contrat auteur",
      current: "Version en vigueur",
      none: "Aucun contrat publié : les auteurs ne peuvent pas encore s'inscrire.",
      newVersion: "Publier une nouvelle version",
      newVersionHelp:
        "Chaque publication crée une version numérotée. Les auteurs devront l'accepter " +
        "avant leur prochaine soumission.",
      contractTitle: "Titre",
      body: "Texte du contrat",
      publish: "Publier cette version",
      published: "Nouvelle version publiée.",
      acceptances: "{count} acceptations",
    },
    legal: {
      title: "Textes légaux",
      intro:
        "Chaque publication crée une version numérotée, affichée aussitôt sur le site et " +
        "dans Kalami Stratégie. Une version publiée n'est jamais modifiée.",
      current: "Version en vigueur",
      none: "Aucune version publiée.",
      newVersion: "Publier une nouvelle version",
      docTitle: "Titre",
      body: "Texte (paragraphes séparés par une ligne vide)",
      publish: "Publier cette version",
      published: "Nouvelle version publiée.",
      view: "Voir la page publique",
      consents: "Registre des consentements",
      consentsCount:
        "{accepted} acceptation(s) et {refused} refus enregistrés.",
      deletions: "Suppressions de compte en attente : {count}.",
    },
    mfa: {
      title: "Vérification en deux étapes",
      enrollIntro:
        "Scannez ce code avec une application d'authentification (Google Authenticator, " +
        "Microsoft Authenticator, 1Password…), puis saisissez le code à 6 chiffres.",
      secretLabel: "Ou saisissez cette clé manuellement :",
      challengeIntro:
        "Saisissez le code à 6 chiffres affiché par votre application.",
      code: "Code à 6 chiffres",
      verify: "Vérifier",
      invalidCode: "Code incorrect. Réessayez.",
      replaceIntro:
        "Scannez ce nouveau code avec votre application, puis saisissez le code à 6 chiffres " +
        "qu'elle affiche pour « Kalami ». L'ancienne entrée cessera de fonctionner : " +
        "supprimez-la ensuite de l'application.",
      replaceLink: "Remplacer l'application d'authentification",
    },
    orders: {
      title: "Commandes",
      intro:
        "Les 200 commandes les plus récentes de Kalami. Un remboursement passe par Stripe " +
        "(compte en mode réel) puis retire les droits : livre, PDF, crédits d'étude non " +
        "utilisés et forfaits du coach. Une étude déjà créée avec un crédit reste. " +
        "Un paiement Mobile Money se valide ici, après vérification du relevé de l'opérateur.",
      filter: "Statut",
      filterAll: "Toutes",
      filterToReview: "Mobile Money à valider",
      mm: "Mobile Money {operator} ({country}) · réf. {reference}",
      mmTransaction:
        "Transaction {transaction} · payeur {payer} · déclarée le {date}",
      mmNotDeclared: "Transaction pas encore déclarée",
      mmRejected: "Refusé : {reason}",
      toReview: "À valider",
      validate: "Valider le paiement",
      validateConfirm: "J'ai vu ce paiement sur le relevé de l'opérateur",
      reject: "Refuser",
      rejectReason: "Motif du refus (envoyé à l'acheteur)",
      validated: "Paiement validé : l'accès est ouvert.",
      rejected: "Paiement refusé.",
      emailSent: "Courriel envoyé à l'acheteur.",
      emailNotSent: "Courriel non envoyé : prévenez l'acheteur vous-même.",
      apply: "Filtrer",
      statuses: {
        pending: "En attente",
        paid: "Payée",
        refunded: "Remboursée",
        expired: "Expirée",
        failed: "Échouée",
      },
      columns: {
        date: "Date",
        buyer: "Acheteur",
        items: "Articles",
        amount: "Montant",
        status: "Statut",
        actions: "Actions",
      },
      none: "Aucune commande.",
      stripe: "Voir dans Stripe",
      receipt: "Reçu",
      refund: "Rembourser",
      refundConfirm: "Je confirme le remboursement intégral",
      refunded:
        "Commande remboursée : {removed} crédit(s) retiré(s), {kept} déjà utilisé(s), " +
        "{packs} forfait(s) retiré(s).",
      refundedByWebhook:
        "Commande remboursée : Stripe a déjà signalé le remboursement, les droits sont retirés.",
      offersTitle: "Prix des études",
      offersIntro:
        "Prix d'une étude et des lots de 10 et 30 (FCFA entier, euros et dollars canadiens). " +
        "Un prix vide retire cette devise de la vente.",
      offerName: "Nom affiché",
      priceXof: "Prix en FCFA",
      priceEur: "Prix en euros",
      priceCad: "Prix en dollars canadiens",
      offerActive: "En vente",
      offerCredits: "{count} crédit(s)",
      save: "Enregistrer",
      offerSaved: "Prix enregistrés.",
      casesTitle: "Cas d'entraînement",
      casesIntro:
        "Prix de chaque cas (FCFA entier, euros et dollars canadiens). Un cas fermé ne se " +
        "vend pas. « Tout de suite » ouvre le corrigé entier dès l'achat, au lieu d'une " +
        "étape à la fois quand l'acheteur valide la même étape.",
      caseTitle: "Titre affiché",
      caseActive: "En vente",
      caseImmediate: "Corrigé ouvert tout de suite",
      caseAccessCount: "{count} accès actif(s)",
      caseSaved: "Cas enregistré.",
      caseAccessTitle: "Accès d'un compte",
      caseAccessEmail: "Courriel du compte",
      caseGrant: "Accorder l'accès",
      caseRevoke: "Retirer l'accès",
      caseGranted: "Accès accordé.",
      caseRevoked: "Accès retiré : le cas résolu est supprimé, l'étude d'exercice est conservée.",
      // Liste des accès (v0.14.3)
      caseAccessesTitle: "Comptes qui ont accès",
      caseAccessesEmpty: "Aucun compte n'a accès à ce cas.",
      caseAccessesError:
        "Liste des accès illisible : la migration du cas résolu est-elle appliquée ?",
      caseSourcePurchase: "Achat",
      caseSourceGrant: "Accordé",
      caseHasStudy: "exercice ouvert",
      caseHasExample: "cas résolu ouvert",
      caseNoStudy: "aucune étude ouverte",
      errors: {
        order_not_found: "Cette commande n'existe plus.",
        not_refundable: "Seule une commande payée peut être remboursée.",
        no_payment: "Paiement Stripe introuvable pour cette commande.",
        stripe_failed:
          "Stripe a refusé le remboursement. Vérifiez la commande dans Stripe.",
        refund_unrecorded:
          "Remboursement fait chez Stripe, mais non enregistré dans Kalami. Recommencez : " +
          "Stripe ne remboursera pas deux fois.",
        confirm: "Cochez la case de confirmation.",
        invalid_name: "Indiquez un nom de 1 à 80 caractères.",
        invalid_price: "Un prix est un nombre positif (FCFA : entier).",
        offer_not_found: "Cette offre n'existe plus.",
        case_not_found: "Ce cas n'existe plus.",
        user_not_found: "Aucun compte n'utilise ce courriel.",
        not_declared: "L'acheteur n'a pas encore déclaré sa transaction.",
        invalid_reason: "Indiquez un motif de 3 à 300 caractères.",
        mm_refund:
          "Une commande Mobile Money se rembourse hors de Kalami (renvoi au numéro payeur).",
      },
    },
    mobileMoney: {
      title: "Mobile Money",
      intro:
        "Numéros marchands proposés aux acheteurs qui paient en FCFA. L'acheteur paie hors de " +
        "Kalami puis déclare sa transaction ; vous la validez dans « Commandes » après " +
        "vérification du relevé.",
      operatorsTitle: "Opérateurs",
      enabled: "Actif",
      disabled: "Éteint",
      enable: "Activer",
      disable: "Éteindre",
      operatorSaved: "Opérateur mis à jour.",
      accountsTitle: "Numéros marchands",
      operator: "Opérateur",
      country: "Pays",
      number: "Numéro marchand",
      numberHint: "Avec l'indicatif, par exemple +225 07 00 00 00 00.",
      name: "Nom du compte (affiché à l'acheteur)",
      active: "Proposé aux acheteurs",
      save: "Enregistrer le numéro",
      saved: "Numéro enregistré.",
      none: "Aucun numéro marchand : le Mobile Money n'est pas proposé.",
      inactive: "Retiré",
      fee: "Frais de l'opérateur (%)",
      feeHint:
        "Retenus sur chaque paiement validé, avant le partage avec l'auteur.",
      feeSave: "Enregistrer les frais",
      errors: {
        invalid_account:
          "Vérifiez l'opérateur, le pays, le numéro et le nom (2 à 80 car.).",
        operator_not_found: "Cet opérateur n'existe pas.",
      },
    },
    revenue: {
      title: "Revenus",
      intro:
        "Grand livre des ventes : chaque paiement est réparti entre frais, taxes, commission " +
        "Kalami et part de l'auteur. Un remboursement passe une écriture inverse.",
      settingsTitle: "Réglages",
      authorShare: "Part de l'auteur (%)",
      authorShareHint:
        "Sur le net, après frais de paiement et taxes. Le reste revient à Kalami.",
      holdDays: "Délai de disponibilité (jours)",
      holdDaysHint:
        "Garde contre les remboursements avant qu'une vente soit versable.",
      minXof: "Seuil de versement (FCFA)",
      minEur: "Seuil de versement (€)",
      minCad: "Seuil de versement ($ CA)",
      settingsNote:
        "Les nouveaux réglages valent pour les ventes suivantes ; les écritures passées ne " +
        "changent pas.",
      settingsSave: "Enregistrer les réglages",
      settingsSaved: "Réglages enregistrés.",
      commissionsTitle: "Part par auteur",
      commissionsIntro:
        "Laissez vide pour appliquer la part globale ({share} %).",
      custom: "Part propre",
      commissionSave: "Enregistrer",
      commissionSaved: "Part de l'auteur enregistrée.",
      commissionCleared: "L'auteur revient à la part globale.",
      noAuthors: "Aucun auteur.",
      totalsTitle: "Totaux par devise",
      none: "Aucune écriture pour le moment.",
      currency: "Devise",
      sales: "Ventes",
      gross: "Brut",
      fees: "Frais",
      taxes: "Taxes",
      commission: "Commission",
      authors: "Auteurs",
      entriesTitle: "Dernières écritures",
      date: "Date",
      reference: "Référence",
      label: "Article",
      type: "Type",
      types: { sale: "Vente", refund: "Remboursement" },
      feeSaved: "Frais enregistrés.",
      errors: {
        invalid_settings:
          "Vérifiez la part (0 à 100 %), le délai (0 à 365 jours) et les seuils.",
        invalid_share: "La part doit être un pourcentage entre 0 et 100.",
        author_not_found: "Cet auteur n'existe pas.",
        invalid_fee: "Les frais doivent être un pourcentage entre 0 et 20.",
        operator_not_found: "Cet opérateur n'existe pas.",
      },
    },
    payouts: {
      title: "Versements",
      intro:
        "Les auteurs demandent tout leur disponible d'une devise. Approuvez la demande, " +
        "payez hors de Kalami (frais à notre charge) avec les coordonnées affichées, puis " +
        "marquez-la payée avec la référence de la transaction et le reçu.",
      filters: {
        open: "À traiter",
        paid: "Payées",
        rejected: "Refusées",
        cancelled: "Annulées",
      },
      none: "Aucune demande dans cette liste.",
      requestedOn: "Demandé le {date}",
      details: "Coordonnées au moment de la demande",
      methods: { bank: "Virement bancaire", mobile_money: "Mobile Money" },
      fields: {
        account_holder: "Titulaire",
        bank_name: "Banque",
        account_number: "Compte",
        swift: "SWIFT/BIC",
        mobile_operator: "Opérateur",
        mobile_number: "Numéro",
      },
      approve: "Approuver",
      approved:
        "Demande approuvée. Effectuez le paiement, puis marquez-la payée.",
      reject: "Refuser",
      rejectReason: "Motif du refus (envoyé à l'auteur)",
      rejected:
        "Demande refusée : le montant redevient disponible pour l'auteur.",
      paymentReference: "Référence de la transaction",
      paymentReferenceHint:
        "Numéro du virement ou de la transaction Mobile Money.",
      proof: "Reçu (PDF ou image, 5 Mo au plus, facultatif)",
      markPaid: "Marquer payée",
      uploading: "Envoi du reçu…",
      paid: "Versement enregistré comme payé.",
      paidOn: "Payé le {date} · transaction {reference}",
      openProof: "Voir le reçu",
      rejectedBecause: "Refusée le {date} : {reason}",
      cancelledOn: "Annulée par l'auteur le {date}",
      emailSent: "L'auteur a été prévenu par courriel.",
      emailNotSent: "Courriel non envoyé : prévenez l'auteur vous-même.",
      email: {
        greeting: "Bonjour,",
        adminSubject: "Demande de versement {reference} : {amount}",
        adminBody:
          "{author} demande le versement de {amount} (référence {reference}).",
        adminCta: "Traiter la demande",
        paidSubject: "Versement {reference} effectué",
        paidBody:
          "Nous vous avons versé {amount} (référence {reference}, transaction {transaction}).",
        rejectedSubject: "Demande de versement {reference} refusée",
        rejectedBody:
          "Votre demande de versement de {amount} (référence {reference}) a été refusée. " +
          "Le montant est de nouveau disponible dans votre espace.",
        reason: "Motif : {reason}",
        cta: "Voir mes revenus",
      },
      errors: {
        payout_not_found: "Cette demande a déjà été traitée.",
        invalid_reason: "Le motif doit faire de 3 à 500 caractères.",
        invalid_payment_reference:
          "Indiquez la référence de la transaction (120 car. au plus).",
        invalid_proof: "Le reçu est introuvable : renvoyez-le.",
        proof_type: "Le reçu doit être un PDF ou une image (PNG, JPEG, WebP).",
        proof_size: "Le reçu dépasse 5 Mo.",
        proof_upload: "L'envoi du reçu a échoué. Réessayez.",
      },
    },
    audit: {
      title: "Journal d'audit",
      intro:
        "Toutes les actions sensibles : réglages, paiements, versements, accès accordés, " +
        "décisions sur les soumissions. Le journal ne peut être ni modifié ni effacé.",
      all: "Tout",
      date: "Date",
      actor: "Par",
      action: "Action",
      target: "Cible",
      details: "Détails",
      system: "Système",
      none: "Aucune entrée.",
      previous: "Plus récentes",
      next: "Plus anciennes",
      page: "Page {page}",
    },
    promos: {
      title: "Codes promo et taxes",
      intro:
        "Un code s'applique au paiement par carte, après la remise enseignant éventuelle. " +
        "Chaque compte ne l'utilise qu'une fois ; seules les commandes payées comptent " +
        "(une commande remboursée ne rend pas l'utilisation). Pour offrir un livre, " +
        "utilisez l'accès manuel de la fiche du livre.",
      newTitle: "Nouveau code",
      code: "Code",
      codeHint:
        "3 à 30 caractères : lettres, chiffres, « - » et « _ » (mis en majuscules).",
      scope: "S'applique à",
      scopes: {
        book: "Un livre",
        books: "Tous les livres",
        strategy: "Kalami Stratégie (études, lots, forfaits)",
        all: "Tout le catalogue",
      },
      book: "Livre (si « Un livre »)",
      noBook: "—",
      percentOff: "Réduction en %",
      percentHint: "De 1 à 90. Laissez vide pour une réduction en montant.",
      amountXof: "Réduction en FCFA",
      amountEur: "Réduction en euros",
      amountCad: "Réduction en dollars canadiens",
      amountHint:
        "Sans pourcentage : un montant par devise (une devise vide n'a pas de réduction).",
      expiresOn: "Expire le",
      expiresHint:
        "Valable jusqu'à la fin de ce jour (UTC). Vide : sans expiration.",
      maxUses: "Utilisations maximales",
      maxUsesHint: "Vide : sans limite.",
      note: "Note interne",
      create: "Créer le code",
      created: "Code {code} créé.",
      listTitle: "Codes existants",
      none: "Aucun code promo.",
      uses: "{count} utilisation(s)",
      usesOf: "{count} / {max} utilisation(s)",
      expires: "expire le {date}",
      expired: "expiré",
      noExpiry: "sans expiration",
      inactive: "Désactivé",
      activate: "Réactiver",
      deactivate: "Désactiver",
      activated: "Code réactivé.",
      deactivated: "Code désactivé.",
      taxTitle: "Taxes de vente (Stripe Tax)",
      taxOn:
        "Allumé : Stripe calcule la taxe du pays de l'acheteur, comprise dans le prix affiché " +
        "(le montant payé ne change pas).",
      taxOff:
        "Éteint : aucune taxe n'est perçue (petit fournisseur dispensé de TPS/TVQ). " +
        "Avant d'allumer, inscrivez les juridictions et le code fiscal par défaut dans Stripe.",
      taxEnable: "Allumer Stripe Tax",
      taxDisable: "Éteindre Stripe Tax",
      taxEnabled: "Stripe Tax allumé pour les prochains paiements.",
      taxDisabled: "Stripe Tax éteint.",
      errors: {
        invalid_code:
          "Le code doit compter 3 à 30 caractères : lettres, chiffres, - et _.",
        invalid_scope: "Choisissez à quoi s'applique le code.",
        book_required: "Choisissez le livre visé.",
        discount_choice:
          "Indiquez un pourcentage OU des montants, pas les deux.",
        invalid_percent: "Le pourcentage est un entier de 1 à 90.",
        invalid_amount: "Un montant est un nombre positif (FCFA : entier).",
        invalid_date: "Date d'expiration invalide.",
        date_past: "La date d'expiration est déjà passée.",
        invalid_max_uses:
          "Le nombre d'utilisations est un entier de 1 à 100 000.",
        invalid_note: "La note compte au plus 200 caractères.",
        promo_taken: "Ce code existe déjà.",
        invalid_promo:
          "Code refusé par la base : vérifiez la réduction et le livre.",
        promo_not_found: "Ce code n'existe plus.",
      },
    },
  },
  mobileMoney: {
    choose: "Payer par Mobile Money",
    chooseHelp: "Choisissez votre opérateur et votre pays.",
    loading: "Chargement des numéros…",
    none: "Le Mobile Money n'est pas disponible pour le moment.",
    operatorLegend: "Opérateur et pays",
    continue: "Continuer — {price}",
    starting: "Création de la commande…",
    cancel: "Annuler",
    countries: {
      BJ: "Bénin",
      BF: "Burkina Faso",
      CI: "Côte d'Ivoire",
      GW: "Guinée-Bissau",
      ML: "Mali",
      NE: "Niger",
      SN: "Sénégal",
      TG: "Togo",
    },
    errors: {
      operator_unavailable:
        "Ce numéro n'est plus proposé. Choisissez-en un autre.",
      order_not_found: "Commande introuvable.",
      already_declared: "Cette transaction est déjà déclarée.",
      order_expired: "Le délai de 24 h est dépassé : refaites un achat.",
      invalid_transaction:
        "Numéro de transaction invalide (4 à 40 caractères : lettres, chiffres, . ou -).",
      invalid_payer:
        "Numéro payeur invalide (8 à 20 chiffres, indicatif possible).",
      transaction_used: "Ce numéro de transaction a déjà été utilisé.",
      generic: "La demande n'a pas abouti. Réessayez dans un instant.",
    },
    order: {
      title: "Paiement Mobile Money",
      amount: "Montant à envoyer",
      number: "Numéro {operator}",
      reference: "Référence",
      deadline: "À payer et déclarer avant le {date}.",
      stepsTitle: "Comment payer",
      step1: "Envoyez exactement {amount} par {operator} au {number}.",
      step2:
        "Indiquez la référence {reference} en motif du transfert, si l'application le permet.",
      step3:
        "Notez le numéro de transaction reçu par SMS, puis déclarez-le ci-dessous avec le " +
        "numéro qui a payé.",
      transaction: "Numéro de transaction",
      transactionHint: "Il figure dans le SMS de confirmation de l'opérateur.",
      payer: "Numéro qui a payé",
      payerHint: "Avec l'indicatif, par exemple +225 07 00 00 00 00.",
      declare: "Déclarer mon paiement",
      declared:
        "Paiement déclaré : nous le vérifions, vous recevrez un courriel.",
      toReview:
        "Paiement déclaré le {date} (transaction {transaction}). Nous le vérifions : " +
        "vous recevrez un courriel dès la validation.",
      paid: "Paiement validé : votre achat est disponible.",
      open: "Ouvrir mon achat",
      rejected: "Paiement refusé : {reason}",
      rejectedHelp:
        "Une erreur ? Écrivez-nous avec la référence de la commande.",
      expired:
        "La commande {reference} a expiré sans paiement déclaré. Vous pouvez refaire un achat.",
      notFound: "Commande introuvable.",
      back: "Retour à mes achats",
    },
    email: {
      greeting: "Bonjour,",
      adminSubject: "Mobile Money à valider — {reference} ({amount})",
      adminBody:
        "{buyer} a déclaré un paiement {operator} de {amount} pour « {labels} ».",
      adminDetails:
        "Référence {reference} · transaction {transaction} · payeur {payer}.",
      adminCta: "Valider ou refuser",
      validatedSubject: "Paiement confirmé — {reference}",
      validatedBody:
        "Votre paiement Mobile Money de {amount} est validé : « {labels} » est disponible.",
      rejectedSubject: "Paiement non validé — {reference}",
      rejectedBody:
        "Votre paiement Mobile Money de {amount} pour « {labels} » n'a pas été validé.",
      reason: "Motif : {reason}",
      rejectedHelp:
        "Une erreur ? Répondez à ce courriel avec la référence {reference}.",
      cta: "Voir mes achats",
    },
  },
  legal: {
    kinds: {
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      sales: "Conditions de vente",
    },
    version: "Version {version} — en vigueur depuis le {date}",
    missing: "Ce texte sera publié prochainement.",
    signupNotice:
      "En créant un compte, vous confirmez avoir 14 ans ou plus (ou l'accord d'un parent " +
      "ou tuteur) et vous acceptez les {terms} et la {privacy}.",
    signupTerms: "conditions d'utilisation",
    signupPrivacy: "politique de confidentialité",
    consent: {
      title: "Témoins (cookies)",
      text:
        "Kalami utilise les témoins nécessaires au fonctionnement du site (connexion, devise, " +
        "ce choix) et, seulement si vous acceptez, ceux de Google Analytics pour mesurer " +
        "l'audience. Aucun témoin publicitaire.",
      more: "En savoir plus",
      accept: "Accepter",
      refuse: "Refuser",
      manage: "Gérer les témoins",
      error: "Votre choix n'a pas pu être enregistré. Réessayez.",
    },
  },
  pwa: {
    strategyShortName: "Stratégie",
    install: "Installer l'application",
    installIosTitle: "Installer sur iPhone ou iPad",
    installIosSteps:
      "Dans Safari, touchez le bouton Partager, puis « Sur l'écran d'accueil ». " +
      "L'application s'ouvrira ensuite comme les autres, sans barre d'adresse.",
    close: "Fermer",
    offlineBanner:
      "Vous êtes hors ligne. Les pages déjà visitées restent consultables ; le reste se " +
      "chargera au retour de la connexion.",
    offlineTitle: "Vous êtes hors ligne",
    offlineText:
      "Cette page n'a pas encore été enregistrée sur cet appareil. Vérifiez votre " +
      "connexion, puis réessayez.",
    offlineReader:
      "La lecture des livres exige une connexion : le contenu n'est jamais conservé sur " +
      "l'appareil.",
    offlineStrategy:
      "Vos études ne sont pas conservées sur l'appareil, par confidentialité : retrouvez-les " +
      "dès le retour de la connexion.",
    retry: "Réessayer",
    backHome: "Retour à l'accueil",
  },
  a11y: {
    skipToContent: "Aller au contenu",
  },
  notFound: {
    title: "Page introuvable",
    text: "Cette adresse ne correspond à aucune page, ou la page n'est plus disponible.",
  },
  error: {
    title: "Un incident est survenu",
    text:
      "La page n'a pas pu s'afficher. Il s'agit souvent d'une coupure passagère : réessayez " +
      "dans un instant. Vos données enregistrées ne sont pas perdues.",
    reference: "Référence de l'incident : {digest}",
  },
};

export default fr;

/** Structure attendue de tout dictionnaire de langue. */
export type Dictionary = typeof fr;
