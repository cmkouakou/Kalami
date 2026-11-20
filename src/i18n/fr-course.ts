/**
 * =============================================================
 *  Fichier    : fr-course.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Textes français du cours de stratégie : accueil, programme, page de
 *               leçon, encadrés, exercices, annotations, lecture à voix haute et
 *               messages d'erreur. Lus via getCourseDictionary() (course.ts).
 *               v0.37.0 : quiz de module. v0.38.0 : examen final et diplôme.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-11-20
 * =============================================================
 */

const courseFr = {
  title: "Le cours de stratégie",
  description:
    "Un cours complet de stratégie d'entreprise : des leçons courtes et denses, des schémas, " +
    "des exercices corrigés, et un lien direct avec votre propre étude dans Kalami Stratégie.",
  privacy:
    "Pour suivre votre progression, Kalami enregistre les leçons ouvertes et terminées, le " +
    "temps passé et vos résultats aux exercices. Votre formateur peut les consulter.",

  accueil: {
    eyebrow: "Kalami Stratégie",
    progression: "Votre progression",
    terminees: "{n} leçon(s) terminée(s) sur {total}",
    temps: "Temps de formation : {duree}",
    reprendre: "Reprendre : {titre}",
    commencer: "Commencer le cours",
    module: "Module {n}",
    chapitre: "Livre, chapitre {n}",
    bientot: "Bientôt",
    terminee: "Terminée",
    enCours: "En cours",
    minutes: "{n} min",
  },

  sansAcces: {
    titre: "Ce cours est réservé aux inscrits",
    texte:
      "Votre compte n'a pas encore accès au cours. Si vous faites partie d'une cohorte, " +
      "transmettez à votre formateur le courriel de votre compte Kalami : il vous donnera " +
      "l'accès.",
    bientot: "L'inscription en ligne ouvrira prochainement.",
    acheter:
      "Vous pouvez aussi vous inscrire vous-même : l'accès est immédiat et complet, avec " +
      "le livre qui accompagne le cours.",
    annule: "Le paiement a été annulé : aucun montant n'a été prélevé.",
    compte: "Courriel de votre compte : {email}",
  },

  lecon: {
    retour: "Programme du cours",
    moduleLecon: "Module {m} · Leçon {l}",
    /** Référence d'un passage cité (le cours tient lieu d'ouvrage). */
    citation: {
      auteur: "Claude Marcel Kouakou",
      plateforme: "Kalami Stratégie",
      annee: 2026,
    },
    duree: "Environ {n} min",
    precedente: "Leçon précédente",
    suivante: "Leçon suivante",
    terminer: "J'ai terminé cette leçon",
    terminee: "Leçon terminée",
    erreurTerminer:
      "Impossible d'enregistrer. Vérifiez votre connexion et réessayez.",
    bientot:
      "Cette leçon est en cours de rédaction. Elle sera bientôt disponible.",
    ecouter: "Écouter la leçon",
    pause: "Pause",
    reprendre: "Reprendre",
    arreter: "Arrêter",
    aide: "Sélectionnez un passage pour le surligner ou y ajouter une note.",
  },

  // ==================== DIFFUSION PROGRAMMÉE (v0.33.0) ====================
  diffusion: {
    disponibleLe: "Disponible le {date}",
    lectureAvance: "Lecture en avance",
    fermeeTitre: "Cette leçon n'est pas encore ouverte",
    fermeeTexte:
      "Votre formateur ouvre le cours au fil des semaines. Cette leçon sera disponible " +
      "le {date}.",
    apercuTexte:
      "Vous lisez cette leçon en avance. Ses exercices et le bouton « J'ai terminé » " +
      "s'ouvriront le {date}.",
    exerciceFerme: "Cet exercice s'ouvrira le {date}.",
    pasEncore: "Cette leçon n'est pas encore ouverte.",
  },

  // ==================== QUIZ DE MODULE (v0.37.0) ====================
  quiz: {
    titre: "Quiz du module {n}",
    ligne: "Quiz du module",
    intro:
      "{n} questions. Le quiz est réussi à partir de {seuil} / 100. Les essais sont " +
      "illimités : votre meilleure note compte.",
    verrouille:
      "Le quiz s'ouvrira quand toutes les leçons du module seront ouvertes.",
    question: "Question {n}",
    valider: "Valider le quiz",
    envoi: "Correction…",
    incomplet: "Répondez à toutes les questions avant de valider.",
    score: "Votre note : {score} / 100",
    reussi: "Quiz réussi. Le corrigé de chaque question s'affiche ci-dessous.",
    echoue:
      "Il faut {seuil} / 100 pour réussir. Relisez les leçons concernées, puis " +
      "réessayez : le corrigé s'affichera une fois le quiz réussi.",
    noteQuestion: "Question {n} : {score} / 100",
    recommencer: "Recommencer le quiz",
    voirCorrige: "Voir le corrigé",
    masquerCorrige: "Masquer le corrigé",
    meilleure: "Meilleure note : {score} / 100",
    essais: "{n} essai(s)",
    aFaire: "À faire",
    reussiBadge: "Réussi",
    passer: "Passer le quiz du module {n}",
    erreur: "Le quiz n'a pas pu être enregistré. Réessayez.",
  },

  examen: {
    titre: "Examen final",
    lien: "Examen final",
    carte: "Examen final et diplôme",
    intro:
      "Un cas court, puis {n} questions sur l'ensemble du cours. L'examen est réussi à " +
      "partir de {seuil} / 100. Vous avez {essais} essais, espacés d'au moins 24 heures ; " +
      "votre meilleure note compte.",
    cas: "Le cas",
    questions: "Les questions",
    verrouille:
      "L'examen s'ouvre quand les 13 quiz de module sont réussis. Quiz réussis : {n} / {total}.",
    attente: "Prochain essai possible le {date}.",
    epuise: "Vous avez utilisé vos {essais} essais.",
    termine: "Votre diplôme est délivré : l'examen est clos.",
    restants: "Essais restants : {n}",
    valider: "Remettre l'examen",
    continuer: "Revoir mes réponses",
    envoi: "Correction…",
    confirmer:
      "Remettre l'examen ? Cet essai comptera parmi vos {essais} essais.",
    incomplet: "Répondez à toutes les questions avant de remettre l'examen.",
    score: "Votre note : {score} / 100",
    reussi: "Examen réussi. Vous pouvez maintenant obtenir votre diplôme.",
    echoue: "Il faut {seuil} / 100 pour réussir l'examen.",
    manquees: "Questions à revoir : {liste}",
    aucuneManquee: "Aucune question manquée.",
    meilleure: "Meilleure note à l'examen : {score} / 100",
    versDiplome: "Obtenir mon diplôme",
    tropTot: "Il faut attendre 24 heures entre deux essais.",
    plusDEssais: "Vous n'avez plus d'essai.",
    erreur: "L'examen n'a pas pu être enregistré. Réessayez.",
  },

  diplome: {
    titre: "Mon diplôme",
    lien: "Mon diplôme",
    bilan: "Votre bilan",
    quiz: "Quiz de module (moyenne)",
    exercices: "Exercices notés (moyenne)",
    examen: "Examen final (meilleure note)",
    finale: "Note finale",
    poids: "{n} %",
    note: "{score} / 100",
    nonFait: "—",
    conditions:
      "Le diplôme est délivré quand les 13 quiz sont réussis ({seuilQuiz} / 100) et " +
      "l'examen final est réussi ({seuilExamen} / 100).",
    quizReussis: "Quiz réussis : {n} / {total}",
    examenAFaire: "Examen final : à réussir",
    examenFait: "Examen final : réussi",
    nomTitre: "Le nom inscrit sur le diplôme",
    nomAide:
      "Vérifiez l'orthographe, les accents et l'ordre prénom-nom : vous ne pourrez plus " +
      "le modifier vous-même ensuite.",
    nomChamp: "Nom complet",
    nomConfirmer: "Je confirme que ce nom est bien orthographié.",
    delivrer: "Obtenir mon diplôme",
    envoi: "Délivrance…",
    nomInvalide: "Saisissez un nom de 2 à 120 caractères (lettres, espaces, - ' .).",
    nonAdmissible: "Les conditions du diplôme ne sont pas encore réunies.",
    erreur: "Le diplôme n'a pas pu être délivré. Réessayez.",
    delivre: "Diplôme délivré le {date}",
    numero: "Numéro : {numero}",
    mention: "Mention : {mention}",
    telecharger: "Télécharger le diplôme (PDF)",
    verifier: "Page de vérification publique",
    correction:
      "Une erreur dans le nom ? Signalez-la à votre formateur en indiquant le numéro du " +
      "diplôme : il peut la corriger.",
    mentions: {
      reussite: "Réussite",
      bien: "Bien",
      tres_bien: "Très bien",
    },
    pdf: {
      surtitre: "Kalami Stratégie",
      titre: "Diplôme",
      decerne: "décerné à",
      cours: "pour avoir suivi et réussi le cours",
      intitule: "Le cours de stratégie d'entreprise",
      mention: "Mention {mention}",
      date: "Délivré le {date}",
      numero: "N° {numero}",
      verifier: "Vérification : {adresse}",
      signature: "Claude Marcel, auteur du cours",
    },
    verification: {
      titre: "Vérification d'un diplôme",
      valide: "Ce diplôme est authentique.",
      nom: "Titulaire",
      cours: "Cours",
      date: "Date de délivrance",
      mention: "Mention",
      introuvable: "Aucun diplôme ne correspond à ce numéro.",
    },
  },

  encadres: {
    retenir: "À retenir",
    piege: "Piège fréquent",
    terrain: "Sur le terrain",
    definition: "Définition",
    fiche: "La fiche de la leçon",
    appliquez: "Appliquez-le",
    ouvrirEtape: "Ouvrir l'étape {n} de Kalami Stratégie",
    ouvrirAssistant: "Ouvrir Kalami Stratégie",
  },

  exercices: {
    exercice: "Exercice {n}",
    valider: "Valider",
    recommencer: "Recommencer",
    envoi: "Correction…",
    juste: "Bonne réponse",
    faux: "Pas tout à fait",
    vrai: "Vrai",
    fauxChoix: "Faux",
    score: "Votre note : {score} / 100",
    meilleure: "Meilleure note : {score} / 100",
    choisir: "Choisissez…",
    incomplet: "Répondez à toutes les questions avant de valider.",
    erreur: "La correction n'a pas pu être enregistrée. Réessayez.",
    votreReponse: "Votre réponse (pour vous seul, non enregistrée)",
    voirCorrige: "Voir le corrigé",
    masquerCorrige: "Masquer le corrigé",
    corrige: "Corrigé modèle",
  },

  annotations: {
    titre: "Mes annotations",
    lien: "Mes annotations",
    intro:
      "Vos passages surlignés et vos notes, leçon par leçon. Touchez un passage pour le " +
      "retrouver dans sa leçon.",
    vide:
      "Vous n'avez encore rien surligné. Dans une leçon, sélectionnez un passage pour le " +
      "surligner, l'annoter, le citer ou le partager.",
    recherche: "Chercher dans mes annotations",
    filtre: "Filtrer par couleur",
    toutes: "Toutes",
    nombre: "{n} annotation(s)",
    aucune: "Aucune annotation ne correspond.",
    ouvrir: "Ouvrir dans la leçon",
    retirer: "Retirer le surlignage « {extrait} »",
    retire: "Surlignage retiré.",
    couleurs: { jaune: "Jaune", vert: "Vert", bleu: "Bleu", rose: "Rose", orange: "Orange" },
    connexion: "Connectez-vous pour annoter.",
    erreur: "L'annotation n'a pas pu être enregistrée.",
    tropNombreuses:
      "Vous avez atteint le nombre maximal d'annotations pour cette leçon.",
    noteInvalide: "La note est trop longue (2000 caractères au plus).",
  },

  erreurs: {
    acces: "Votre compte n'a pas accès au cours.",
    connexion: "Connectez-vous pour continuer.",
    invalide: "Requête invalide.",
  },

  // ==================== ADMINISTRATION (v0.29.0) ====================
  admin: {
    titre: "Cours de stratégie",
    intro:
      "Donnez l'accès au cours à vos cohortes, suivez la progression de chaque apprenant " +
      "et réglez la vente en ligne.",
    retour: "Cours de stratégie",
    nav: {
      apprenants: "Apprenants et accès",
      cohortes: "Cohortes",
      suivi: "Suivi",
      prix: "Prix et vente",
      diplomes: "Évaluation et diplômes",
    },
    aide: {
      apprenants: "Coller une liste de courriels, choisir la cohorte, retirer un accès.",
      cohortes: "Créer et modifier les groupes (pays, dates, note).",
      suivi: "Progression, temps de formation et notes ; export CSV.",
      prix: "Mettre le cours en vente, fixer ses prix et le livre associé.",
      diplomes: "Seuils, poids de la note finale, mentions ; diplômes délivrés.",
    },
    chiffres: {
      apprenants: "{n} apprenant(s) actif(s)",
      cohortes: "{n} cohorte(s)",
      enVente: "En vente en ligne",
      horsVente: "Pas en vente en ligne",
    },
    source: { purchase: "Achat", admin_grant: "Accès accordé" },
    sansCohorte: "Sans cohorte",
    toutes: "Toutes les cohortes",
    aucunApprenant: "Aucun apprenant pour l'instant.",

    accorder: {
      titre: "Donner l'accès",
      courriels: "Courriels des apprenants",
      aideCourriels:
        "Collez les adresses séparées par des virgules, des points-virgules ou des retours " +
        "à la ligne (200 au plus). Chaque personne doit d'abord avoir créé son compte Kalami.",
      cohorte: "Cohorte",
      livre: "Donner aussi le livre associé au cours",
      note: "Note interne (facultative)",
      envoyer: "Donner l'accès",
      rapport: "{granted} accès donné(s), {moved} changé(s) de cohorte, {already} déjà " +
        "inscrit(s), {no_account} sans compte, {invalid} invalide(s).",
      statuts: {
        granted: "Accès donné",
        moved: "Cohorte changée",
        already: "Déjà inscrit",
        no_account: "Aucun compte Kalami",
        invalid: "Adresse invalide",
      },
      ignores: "Fragments non reconnus : {liste}",
    },

    liste: {
      titre: "Apprenants inscrits ({n})",
      courriel: "Courriel",
      cohorte: "Cohorte",
      origine: "Origine",
      depuis: "Accès depuis",
      changer: "Changer",
      cohorteChangee: "Cohorte modifiée.",
      retirer: "Retirer l'accès",
      confirmer: "Confirmer le retrait",
      retirerLivre: "Retirer aussi le livre donné avec l'accès",
      retire: "Accès retiré.",
      achatNote:
        "Accès acheté : le retirer ne rembourse pas la commande. Un remboursement (page " +
        "Commandes) retire l'accès de lui-même.",
    },

    cohortes: {
      titre: "Cohortes",
      nouvelle: "Nouvelle cohorte",
      nom: "Nom",
      pays: "Pays (code à 2 lettres, ex. CI)",
      debut: "Début",
      fin: "Fin",
      note: "Note",
      creer: "Créer la cohorte",
      modifier: "Modifier",
      enregistrer: "Enregistrer",
      creee: "Cohorte créée.",
      enregistree: "Cohorte enregistrée.",
      calendrier: "Calendrier de diffusion",
      programmee: "Diffusion programmée",
      supprimer: "Supprimer",
      supprimee: "Cohorte supprimée. Ses apprenants gardent leur accès, sans cohorte.",
      apprenants: "{n} apprenant(s)",
      aucune: "Aucune cohorte pour l'instant.",
      periode: "Du {debut} au {fin}",
    },

    calendrier: {
      titre: "Calendrier de diffusion",
      retour: "Cohortes",
      introuvable: "Cohorte introuvable.",
      intro:
        "Ouvrez le cours au fil des semaines, comme en classe. Chaque module reçoit une " +
        "date ; une leçon peut avoir la sienne, qui remplace celle du module. Sans date, le " +
        "contenu est ouvert. Les dates ouvrent à minuit dans le fuseau choisi.",
      activer: "Activer la diffusion programmée pour cette cohorte",
      aideActiver:
        "Désactivée, les apprenants de la cohorte voient tout le cours ; les dates sont " +
        "conservées.",
      lectureAvance: "Lecture en avance de la prochaine leçon",
      aideLectureAvance:
        "La prochaine leçon se lit avant sa date ; ses exercices restent fermés jusqu'à " +
        "l'ouverture.",
      fuseau: "Fuseau horaire",
      fuseaux: {
        "Africa/Abidjan": "Abidjan (GMT)",
        "America/Toronto": "Montréal (heure de l'Est)",
      },
      generateur: "Générer un calendrier",
      aideGenerateur:
        "Remplit les dates ci-dessous (sans enregistrer) ; ajustez-les ensuite à la main.",
      depart: "Date de départ",
      intervalle: "Jours entre deux ouvertures",
      par: "Ouvrir",
      parModule: "un module à la fois",
      parLecon: "une leçon à la fois",
      generer: "Remplir les dates",
      effacer: "Effacer toutes les dates",
      module: "Module {n} — {titre}",
      dateModule: "Ouverture du module {n}",
      dateLecon: "Leçon {n} : {titre}",
      heriteDe: "Comme le module",
      lecons: "Dates des leçons (facultatives)",
      enregistrer: "Enregistrer le calendrier",
      enregistre: "Calendrier enregistré.",
      etat: "{n} date(s) fixée(s)",
    },

    suivi: {
      titre: "Suivi des apprenants",
      filtre: "Cohorte",
      filtrer: "Afficher",
      exporter: "Exporter en CSV",
      apprenant: "Apprenant",
      achevement: "Achèvement",
      lecons: "Leçons",
      temps: "Temps",
      derniere: "Dernière activité",
      moyenne: "Moyenne",
      jamais: "Jamais",
      voir: "Fiche",
      trierPar: "Trier par {colonne}",
      resume: "{n} apprenant(s) · achèvement moyen {pourcentage} % · temps total {temps}",
    },

    fiche: {
      titre: "Fiche de l'apprenant",
      introuvable: "Cet apprenant n'a pas d'accès actif au cours.",
      retour: "Suivi des apprenants",
      identite: "Compte",
      cohorte: "Cohorte : {nom}",
      depuis: "Accès depuis le {date} ({origine})",
      progression: "{terminees} leçon(s) terminée(s) sur {total} · {pourcentage} %",
      temps: "Temps de formation : {duree}",
      moyenne: "Moyenne aux exercices : {moyenne} / 100 ({n} exercice(s))",
      sansNote: "Aucun exercice noté pour l'instant.",
      modules: "Progression par module",
      module: "Module {n} — {titre}",
      moduleResume: "{terminees}/{total} · {duree}",
      etat: { terminee: "Terminée", enCours: "En cours", aFaire: "À faire" },
      note: "Exercice {n} : {score} / 100 ({essais} essai(s))",
      quiz: "Quiz du module : {score} / 100 ({essais} essai(s))",
      quizAucun: "Quiz du module : pas encore tenté",
      jours: "Temps par jour (90 derniers jours)",
      aucunJour: "Aucune activité enregistrée.",
    },

    prix: {
      titre: "Prix et vente en ligne",
      intro:
        "Quand le cours est en vente, un membre sans accès peut l'acheter par carte ou " +
        "Mobile Money depuis la page du cours. L'achat ouvre le cours et donne le livre " +
        "associé. Seuls les codes promo valables sur tout le site s'appliquent.",
      enVente: "Mettre le cours en vente",
      xof: "Prix en FCFA",
      eur: "Prix en euros",
      cad: "Prix en dollars canadiens",
      aideDevise: "Laissez vide pour ne pas proposer cette devise.",
      livre: "Livre associé",
      aucunLivre: "Aucun livre",
      enregistrer: "Enregistrer",
      enregistre: "Réglages enregistrés.",
      maj: "Dernière modification : {date}",
    },

    diplomes: {
      titre: "Évaluation et diplômes",
      intro:
        "La note finale combine la moyenne des 13 quiz, celle des exercices notés (un " +
        "exercice non fait compte pour 0) et la meilleure note de l'examen. Le diplôme " +
        "exige tous les quiz et l'examen réussis. Les diplômes déjà délivrés gardent " +
        "leurs notes et leur mention.",
      evaluation: "Réglages d'évaluation",
      seuilQuiz: "Seuil de réussite d'un quiz",
      seuilExamen: "Seuil de réussite de l'examen",
      aideSeuil: "Entre 50 et 100.",
      poidsQuiz: "Poids des quiz (%)",
      poidsExercices: "Poids des exercices (%)",
      poidsExamen: "Poids de l'examen (%)",
      aidePoids: "La somme des trois poids doit faire 100.",
      mentionBien: "Mention Bien à partir de",
      mentionTresBien: "Mention Très bien à partir de",
      aideMention: "En dessous de « Bien » : mention Réussite.",
      enregistrer: "Enregistrer",
      enregistre: "Réglages d'évaluation enregistrés.",
      delivres: "Diplômes délivrés",
      aucun: "Aucun diplôme délivré pour l'instant.",
      numero: "Numéro",
      nom: "Nom imprimé",
      mention: "Mention",
      finale: "Note finale",
      date: "Délivré le",
      corrige: "Nom corrigé le {date}",
      corriger: "Corriger le nom",
      renomme: "Nom corrigé. Le prochain PDF le reprendra.",
      pdf: "PDF",
      verifier: "Vérification",
    },

    erreursAdmin: {
      invalid_threshold: "Seuil invalide : saisissez un entier entre 50 et 100.",
      invalid_weights: "Poids invalides : trois entiers dont la somme fait 100.",
      invalid_honours:
        "Mentions invalides : « Bien » doit dépasser le seuil de l'examen et rester " +
        "sous « Très bien » (100 au plus).",
      invalid_diploma_name: "Nom invalide : 2 à 120 lettres (espaces, points, traits " +
        "d'union et apostrophes permis).",
      diploma_not_found: "Diplôme introuvable. Rechargez la page.",
      invalid_price: "Prix invalide : saisissez un montant positif (2 décimales au plus).",
      price_required: "Saisissez au moins un prix pour mettre le cours en vente.",
      book_not_found: "Livre introuvable.",
      invalid_name: "Le nom est obligatoire (120 caractères au plus).",
      invalid_country: "Le pays s'écrit avec son code à 2 lettres (ex. CI, SN, CA).",
      invalid_dates: "Dates invalides : la fin doit suivre le début.",
      invalid_note: "La note est trop longue.",
      cohort_not_found: "Cohorte introuvable. Rechargez la page.",
      no_emails: "Aucun courriel reconnu dans la liste.",
      too_many_emails: "200 courriels au plus par envoi.",
      no_book: "Aucun livre n'est associé au cours : choisissez-le dans « Prix et vente ».",
      access_not_found: "Accès introuvable. Rechargez la page.",
      invalid_timezone: "Fuseau horaire invalide.",
      invalid_schedule: "Une date du calendrier est invalide (format AAAA-MM-JJ).",
      generique: "L'opération a échoué. Réessayez.",
    },
  },
};

export default courseFr;
