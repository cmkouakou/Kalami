/**
 * =============================================================
 *  Fichier    : fr-strategy.ts
 *  Projet     : Kalami Stratégie
 *  Description: Textes français de l'assistant stratégie (accueil, études, profil, carte
 *               des étapes, guide des étapes, gabarits PESTEL, cinq forces, analyse interne
 *               et parties prenantes, coach IA, administration des crédits, des guides
 *               et du coach : réglages, consignes et erreurs classiques), recherche Web
 *               sourcée du coach, documents joints au profil (S5b), gabarit de synthèse
 *               SWOT, TOWS et enjeux (S6a), gabarits Cap et Choix (S7a), gabarit Action
 *               (S7b), plan stratégique (S8a), équipe, invitations et journal (S9a),
 *               discussion, mentions et notifications (S9b), mode enseignant : classes,
 *               inscription, distribution, suivi et statut enseignant (S10a), page du coach
 *               d'une étude et forfaits du coach (v0.11.1).
 *               Rattachés à fr.ts sous « strategy ».
 *  Auteur     : Claude Marcel
 *  Version    : 2.4
 *  Date       : 2026-10-16
 * =============================================================
 */

const strategyFr = {
  name: "Stratégie",
  title: "Kalami Stratégie",
  description:
    "Analysez pas à pas la stratégie d'une entreprise, d'une division ou d'un département. " +
    "Le livre « La stratégie d'entreprise : analyse et mise en œuvre par l'exemple » sert de " +
    "guide à qui en a besoin.",
  nav: {
    home: "Présentation",
    studies: "Mes études",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    signedInAs: "Connecté : {name}",
  },
  footer: {
    tagline: "L'assistant d'analyse stratégique de Kalami.",
    book: "Le livre « La stratégie d'entreprise »",
  },

  // ==================== ACCUEIL ====================
  landing: {
    kicker: "Kalami Stratégie",
    title: "De l'analyse au plan stratégique, une étape à la fois.",
    subtitle:
      "Seul ou en équipe, étudiez une entreprise entière ou l'une de ses divisions : " +
      "environnement, concurrence, ressources, parties prenantes, puis synthèse, cap, " +
      "choix et feuille de route.",
    bookNote:
      "Besoin de repères ? Chaque étape renvoie au chapitre correspondant du livre, une " +
      "étude de cas complète qui montre la démarche appliquée.",
    start: "Commencer une étude",
    signUp: "Créer un compte pour commencer",
    signIn: "J'ai déjà un compte",
    phasesTitle: "Une démarche en quatre temps",
    coachNote:
      "Un coach IA relit vos analyses, pose des questions et signale les erreurs classiques. " +
      "Vous gardez toujours la décision.",
  },

  // ==================== ÉTUDES ====================
  studies: {
    title: "Mes études",
    none: "Vous n'avez pas encore d'étude.",
    credits: "Crédits d'étude disponibles : {count}",
    noCredit:
      "Aucun crédit d'étude disponible. Pendant la phase de lancement, les études sont " +
      "ouvertes par l'équipe Kalami : écrivez-nous pour en obtenir une.",
    newStudy: "Nouvelle étude",
    progress: "{count} étapes validées sur 9",
    updated: "Modifiée le {date}",
    roles: {
      owner: "Propriétaire",
      contributor: "Contributeur",
      observer: "Observateur",
    },
  },
  create: {
    title: "Nouvelle étude",
    intro: "La création utilise un crédit d'étude. Vous pourrez tout modifier ensuite.",
    companyName: "Organisation étudiée (entreprise, division ou département)",
    question: "Votre question stratégique",
    questionHint: "Exemples : « Faut-il croître ? », « Comment préparer la relève ? »",
    submit: "Créer l'étude",
  },

  // ==================== PROFIL ====================
  profile: {
    title: "Profil de l'organisation",
    intro:
      "Ces informations servent de point de départ aux quatre premières analyses. Les champs " +
      "marqués d'un astérisque sont indispensables pour les ouvrir.",
    back: "Retour à l'étude",
    saved: "Profil enregistré.",
    complete: "Profil complet : les étapes 1 à 4 sont ouvertes.",
    incomplete: "Profil à compléter : {fields}.",
    readOnly: "Vous consultez ce profil en lecture seule.",
    sections: {
      identity: "Identité",
      places: "Localisation et marchés",
      organization: "Organisation",
      offer: "Offre, clients et concurrents",
      question: "Question stratégique",
    },
    fields: {
      companyName: "Organisation étudiée",
      scope: "Périmètre de l'étude",
      parentCompany: "Entreprise de rattachement",
      strategicQuestion: "Question stratégique",
      sector: "Secteur d'activité",
      employees: "Effectif",
      revenueRange: "Ordre de grandeur du chiffre d'affaires (facultatif)",
      foundedYear: "Année de création",
      countries: "Pays d'implantation",
      cities: "Villes",
      markets: "Marchés servis",
      teams: "Équipes",
      offers: "Produits et services",
      clients: "Clients principaux",
      competitors: "Concurrents connus",
    },
    scopes: {
      company: "Entreprise entière",
      unit: "Division / département",
    },
    scopeHint:
      "Pour une division ou un département, indiquez l'entreprise dont il fait partie : " +
      "le coach en tiendra compte.",
    onePerLine: "Une entrée par ligne.",
    teamRole: "Rôle ou équipe",
    teamHeadcount: "Effectif",
    addTeam: "Ajouter une équipe",
    removeTeam: "Retirer cette équipe",
    invalid: "Vérifiez les champs suivants : {fields}.",
    save: "Enregistrer le profil",
  },

  // ==================== PIÈCES JOINTES DU PROFIL ====================
  attachments: {
    title: "Documents de l'organisation",
    intro:
      "Joignez des documents sur l'organisation étudiée (rapport annuel, présentation, " +
      "organigramme…). Le coach peut en faire un résumé et proposer des informations pour " +
      "le profil ; rien n'est ajouté sans votre accord.",
    hint:
      "PDF, Word (.docx), Excel (.xlsx) ou image (PNG, JPEG, WebP, GIF). 10 Mo au plus par " +
      "fichier (5 Mo pour une image), 10 fichiers par étude.",
    count: "{count} document(s) sur 10",
    add: "Joindre un document",
    uploading: "Envoi de « {name} »…",
    uploaded: "Document joint.",
    empty: "Aucun document joint pour le moment.",
    readOnly:
      "Seuls le propriétaire et les contributeurs peuvent joindre ou analyser des documents.",
    notAvailable: "L'analyse des documents par le coach n'est pas encore disponible.",
    addedAt: "Joint le {date}",
    download: "Télécharger",
    delete: "Supprimer",
    confirmDelete: "Confirmer la suppression",
    cancel: "Annuler",
    analyze: "Analyser",
    analyzeAgain: "Analyser de nouveau",
    analyzing: "Le coach lit le document… (jusqu'à quelques minutes)",
    analyzedAt: "Analysé le {date}",
    summaryTitle: "Résumé",
    proposalsTitle: "Propositions pour le profil",
    noProposals: "Le coach ne propose rien de nouveau pour le profil à partir de ce document.",
    inProfile: "déjà dans le profil",
    applyHint:
      "Les propositions cochées sont enregistrées tout de suite dans le profil : les listes " +
      "sont complétées, les autres champs remplacés. Enregistrez d'abord les modifications " +
      "en cours du formulaire.",
    apply: "Appliquer la sélection",
    dismissAll: "Tout écarter",
    applied: "Profil mis à jour.",
    decided: "Décision prise pour toutes les propositions.",
    decisions: {
      accepted: "Ajoutée",
      modified: "Ajoutée",
      rejected: "Écartée",
    },
    errors: {
      format:
        "Format non admis : joignez un PDF, un document Word (.docx), un classeur Excel (.xlsx) " +
        "ou une image.",
      tooLarge: "Ce fichier dépasse 10 Mo.",
      imageTooLarge: "Une image ne peut pas dépasser 5 Mo.",
      tooMany: "Cette étude compte déjà 10 documents : supprimez-en un d'abord.",
      missing: "Le fichier est introuvable. Joignez-le de nouveau.",
      upload: "L'envoi du fichier a échoué. Réessayez.",
    },
  },

  // ==================== CARTE DES ÉTAPES ====================
  map: {
    kicker: "Étude stratégique",
    questionLabel: "Question de départ : « {question} »",
    noQuestion: "Question de départ à préciser dans le profil.",
    progress: "Progression : {count} étapes validées sur 9",
    profileCard: "Profil de l'entreprise",
    profileComplete: "Complet",
    profileIncomplete: "À compléter",
    parallel: "Ces quatre étapes peuvent avancer en parallèle. Répartissez-les dans l'équipe.",
    locked: "Verrouillée",
    opensWhen: "S'ouvre quand {steps} sera validée.",
    opensWhenMany: "S'ouvre quand {steps} seront validées.",
    profileFirst: "S'ouvre quand le profil de l'entreprise sera complet.",
    generate: "Ouvrir le plan stratégique",
    generateLater: "Disponible quand les 8 premières étapes seront validées.",
    members: "{count} membre(s) · dernière modification le {date}",
  },
  phases: {
    understand: "1. Comprendre",
    synthesize: "2. Synthétiser",
    decide: "3. Décider",
    act: "4. Agir",
  },
  phaseIntro: {
    understand: "Environnement externe et concurrentiel, ressources internes, parties prenantes.",
    synthesize: "SWOT, TOWS et enjeux principaux.",
    decide: "Vision, mission, objectifs SMART ; options et stratégie retenue.",
    act: "Feuille de route, tableau de bord, puis plan stratégique.",
  },
  status: {
    todo: "À faire",
    in_progress: "En cours",
    submitted: "Soumise au coach",
    validated: "Validée",
    needs_review: "À revoir",
  },
  steps: {
    1: { title: "Environnement externe", tools: "PESTEL, impact-incertitude, scénarios" },
    2: { title: "Environnement concurrentiel", tools: "Cinq forces, comparaison des concurrents" },
    3: { title: "Environnement interne", tools: "Chaîne de valeur, ressources, VRIO" },
    4: { title: "Parties prenantes", tools: "Matrice pouvoir-intérêt, engagement" },
    5: { title: "Synthèse", tools: "SWOT, TOWS, enjeux" },
    6: { title: "Cap", tools: "Vision, mission, valeurs, objectifs SMART" },
    7: { title: "Choix", tools: "Stratégies génériques, Ansoff, évaluation des options" },
    8: { title: "Action", tools: "Feuille de route, tableau de bord équilibré" },
    9: { title: "Plan stratégique", tools: "Plan en huit sections, traçabilité" },
  },

  // ==================== PAGE D'UNE ÉTAPE ====================
  step: {
    back: "Retour à la carte",
    module: "Module {module} du livre",
    missingTitle: "Cette étape n'est pas encore ouverte",
    missingProfile: "Profil de l'entreprise à compléter",
    missingStep: "Étape {no} à valider : {title}",
    templateSoon:
      "Le gabarit interactif de cette étape arrive dans une prochaine version. Vous pouvez " +
      "déjà suivre son statut et la valider.",
    reviewTitle: "Étape à revoir",
    reviewBecause: "L'étape {no} ({title}) a été modifiée après validation le {date}.",
    start: "Commencer l'étape",
    validate: "Valider l'étape",
    validated: "Étape validée le {date}.",
    validateOwnerOnly: "Seul le propriétaire de l'étude peut valider une étape.",
    reopen: "Modifier l'étape validée",
    reopenWarning:
      "Les étapes suivantes déjà commencées passeront « à revoir » : {steps}.",
    reopened: "Étape rouverte. {count} étape(s) en aval à revoir.",
    readOnly: "Vous consultez cette étude en tant qu'observateur.",
  },

  // ==================== ERREURS ====================
  errors: {
    generic: "L'opération n'a pas abouti. Réessayez dans un instant.",
    no_credit: "Aucun crédit d'étude disponible.",
    not_owner: "Seul le propriétaire de l'étude peut faire cette action.",
    plan_step: "Le plan stratégique ne se valide pas : il se complète et se modifie librement.",
    invalid_step: "Cette étape n'existe pas.",
    prerequisites_missing: "Des étapes préalables ne sont pas encore validées.",
    not_started: "Commencez l'étape avant de la valider.",
    not_validated: "Cette étape n'est pas validée.",
    invalid_profile: "Le profil envoyé est invalide.",
    forbidden: "Vous n'avez pas les droits nécessaires sur cette étude.",
    invalid_payload: "Le contenu envoyé est invalide. Rechargez la page.",
    payload_too_large: "Le contenu de cette étape est trop volumineux pour être enregistré.",
    step_validated: "Cette étape est validée : choisissez « Modifier l'étape validée » d'abord.",
    revision_conflict:
      "Cette étape a été modifiée ailleurs (autre onglet ou autre membre). Rechargez la page " +
      "pour repartir de la dernière version.",
    checklist_incomplete: "La liste de contrôle n'est pas complète.",
    version_not_found: "Cette version n'existe plus.",
  },

  // ==================== GABARITS (COMMUN) ====================
  template: {
    readOnlyValidated:
      "Étape validée : le gabarit est en lecture seule. Pour le changer, choisissez " +
      "« Modifier l'étape validée ».",
    readOnlyObserver: "Vous consultez ce gabarit en lecture seule.",
    remove: "Retirer",
    autosave: {
      idle: "Les modifications sont enregistrées automatiquement.",
      dirty: "Modifications non enregistrées…",
      saving: "Enregistrement…",
      saved: "Enregistré à {time}",
      error: "Échec de l'enregistrement : {error}",
      retry: "Réessayer",
      reload: "Recharger la page",
      leaveWarning: "Des modifications ne sont pas encore enregistrées.",
    },
    checklist: {
      title: "Avant de valider",
      done: "Fait",
      missing: "À faire",
      waitSave: "Attendez la fin de l'enregistrement pour valider.",
    },
    versions: {
      title: "Historique des versions ({count})",
      none: "Aucune version pour l'instant : la première est créée au premier enregistrement.",
      intro:
        "Une version est gardée toutes les 15 minutes d'édition, à chaque validation et " +
        "à chaque restauration (50 au plus).",
      reasons: {
        auto: "Enregistrement",
        validation: "Validation",
        restore: "Restauration",
        conflict: "Copie de secours (conflit)",
      },
      revision: "révision {revision}",
      restore: "Restaurer",
      confirm: "Remplacer le contenu actuel par cette version ?",
      confirmYes: "Oui, restaurer",
      confirmNo: "Annuler",
      restored: "Version restaurée. L'état précédent a été gardé dans l'historique.",
      dirtyFirst: "Attendez la fin de l'enregistrement avant de restaurer.",
    },
  },

  // ==================== GABARIT : PESTEL ====================
  pestel: {
    factorsTitle: "1. Facteurs de l'environnement",
    factorsIntro:
      "Pour chaque dimension, notez les tendances qui peuvent toucher l'entreprise, leur effet " +
      "et s'il s'agit d'une opportunité ou d'une menace.",
    dimensions: {
      political: "Politique",
      economic: "Économique",
      social: "Socioculturel",
      technological: "Technologique",
      environmental: "Environnemental",
      legal: "Légal",
    },
    fields: {
      factor: "Facteur (tendance)",
      effect: "Effet sur l'entreprise",
      nature: "Opportunité ou menace",
      source: "Source (facultatif)",
    },
    natures: {
      opportunity: "Opportunité",
      threat: "Menace",
      both: "Les deux",
    },
    natureNone: "À préciser",
    addFactor: "Ajouter un facteur",
    noFactor: "Aucun facteur pour cette dimension.",
    untitled: "Facteur sans titre",
    maxFactors: "{max} facteurs au plus.",
    gridTitle: "2. Grille impact-incertitude",
    gridIntro:
      "Glissez chaque facteur dans une case, ou choisissez sa case dans la liste. Les facteurs " +
      "à fort impact et forte incertitude sont vos variables pivots.",
    unplaced: "À placer",
    unplacedEmpty: "Tous les facteurs nommés sont placés.",
    placeIn: "Case de « {factor} »",
    placeNone: "À placer",
    impactAxis: "Impact",
    uncertaintyAxis: "Incertitude",
    quadrants: {
      pivot: "Variables pivots",
      trend: "Tendances lourdes",
      watch: "À surveiller",
      minor: "Secondaires",
    },
    quadrantHints: {
      pivot: "Impact fort, incertitude forte : base des scénarios.",
      trend: "Impact fort, incertitude faible : à intégrer au plan.",
      watch: "Impact faible, incertitude forte : à suivre.",
      minor: "Impact faible, incertitude faible.",
    },
    scenariosTitle: "3. Matrice des scénarios",
    scenariosIntro:
      "Choisissez deux variables pivots et décrivez, pour chacune, une hypothèse basse et une " +
      "hypothèse haute. Les quatre combinaisons donnent quatre scénarios.",
    axis: "Variable {no}",
    axisFactor: "Facteur pivot",
    axisNone: "Choisir un facteur",
    axisLow: "Hypothèse basse",
    axisHigh: "Hypothèse haute",
    scenarioName: "Nom du scénario",
    scenarioDescription: "Ce qui se passe pour l'entreprise",
    noPivot: "Nommez d'abord des facteurs : ils serviront de variables.",
    checklist: {
      opportunity: "Au moins une opportunité",
      threat: "Au moins une menace",
    },
  },

  // ==================== GABARIT : CINQ FORCES ====================
  forces: {
    forcesTitle: "1. Les cinq forces",
    forcesIntro:
      "Pour chaque force, indiquez son intensité dans votre secteur et justifiez-la avec des " +
      "faits.",
    names: {
      rivalry: "Rivalité entre concurrents",
      newEntrants: "Menace des nouveaux entrants",
      substitutes: "Menace des produits de substitution",
      buyers: "Pouvoir de négociation des clients",
      suppliers: "Pouvoir de négociation des fournisseurs",
    },
    hints: {
      rivalry: "Nombre et taille des concurrents, croissance du marché, différenciation.",
      newEntrants: "Barrières à l'entrée : investissements, réglementation, accès aux clients.",
      substitutes: "Autres façons de répondre au même besoin, et leur rapport qualité-prix.",
      buyers: "Concentration des clients, coût pour changer de fournisseur, sensibilité au prix.",
      suppliers: "Concentration des fournisseurs, rareté des ressources, coût d'un changement.",
    },
    intensity: "Intensité",
    intensities: {
      low: "Faible",
      medium: "Moyenne",
      high: "Forte",
    },
    justification: "Justification",
    comparisonTitle: "2. Comparaison avec les concurrents",
    comparisonIntro:
      "Notez chaque acteur de 1 (faible) à 5 (excellent) sur les critères qui comptent pour " +
      "vos clients. L'entreprise et les concurrents du profil sont déjà en colonnes.",
    actorName: "Nom de l'acteur",
    addActor: "Ajouter un acteur",
    criterion: "Critère",
    criterionName: "Nom du critère",
    addCriterion: "Ajouter un critère",
    noCriterion: "Ajoutez un premier critère (ex. : prix, qualité, délais, service).",
    score: "Note de {actor} pour « {criterion} »",
    scoreNone: "–",
    note: "Commentaire",
    average: "Moyenne",
    maxActors: "{max} acteurs au plus.",
    maxCriteria: "{max} critères au plus.",
    checklist: {
      rivalry: "Rivalité : intensité et justification",
      newEntrants: "Nouveaux entrants : intensité et justification",
      substitutes: "Substituts : intensité et justification",
      buyers: "Clients : intensité et justification",
      suppliers: "Fournisseurs : intensité et justification",
    },
  },

  // ==================== GUIDE D'UNE ÉTAPE ====================
  guide: {
    title: "Comprendre l'étape",
    read: "Lire le chapitre",
    exampleTitle: "Exemple : Infosystem",
    exampleShow: "Voir l'exemple Infosystem",
    exampleHide: "Masquer l'exemple",
  },

  // ==================== GABARIT : ANALYSE INTERNE ====================
  internal: {
    chainTitle: "1. Chaîne de valeur",
    chainIntro:
      "Les activités du modèle choisi sont proposées : renommez-les, retirez celles qui ne " +
      "s'appliquent pas, ajoutez les vôtres, puis évaluez chacune.",
    modelTitle: "Choisissez le modèle de chaîne de valeur",
    modelIntro:
      "Votre entreprise livre-t-elle principalement des produits physiques (modèle Porter) ou " +
      "résout-elle des problèmes pour ses clients (modèle services) ?",
    models: {
      porter: "Porter (industrie)",
      services: "Services",
    },
    modelHints: {
      porter:
        "Pour une entreprise qui fabrique, transporte ou vend des produits physiques " +
        "(industrie, agroalimentaire, distribution, construction).",
      services:
        "Pour une entreprise qui vend du conseil, de la maintenance, de l'informatique, de la " +
        "santé, de l'éducation, de la finance ou tout métier où la relation et le savoir " +
        "priment sur le produit physique.",
    },
    modelMixed:
      "Cas mixte (par exemple un fabricant qui fait aussi beaucoup de service après-vente) : " +
      "choisissez Porter et ajoutez vos activités de service dans « Services ».",
    modelChoose: "Choisir ce modèle",
    modelCurrent: "Modèle : {model}",
    modelSwitchTo: "Passer au modèle {model}",
    modelConfirm:
      "Les activités seront remplacées par celles du modèle {model} ; leurs évaluations et " +
      "commentaires seront perdus. Les ressources VRIO sont gardées.",
    modelConfirmYes: "Remplacer les activités",
    cancel: "Annuler",
    kinds: {
      primary: "Activités principales",
      support: "Activités de soutien",
    },
    porter: {
      inboundLogistics: "Logistique d'approvisionnement",
      operations: "Production",
      outboundLogistics: "Logistique de distribution",
      marketingSales: "Marketing et vente",
      service: "Services",
      infrastructure: "Infrastructure de l'entreprise",
      humanResources: "Gestion des ressources humaines",
      technology: "Développement technologique",
      procurement: "Approvisionnements",
    },
    services: {
      attract: "Attirer les clients",
      diagnose: "Diagnostiquer",
      deliver: "Mettre en place",
      dailySupport: "Soutenir au quotidien",
      emergency: "Intervenir en urgence",
      administration: "Direction et administration",
      humanResources: "Gestion des ressources humaines",
      technology: "Technologie",
      procurement: "Approvisionnement",
    },
    fields: {
      name: "Activité",
      description: "Ce que fait l'entreprise",
      evaluation: "Évaluation",
      comment: "Commentaire",
    },
    evaluations: {
      strength: "Point fort",
      improve: "À renforcer",
      weakness: "Point faible",
      marginal: "Marginal (ne s'applique pas)",
    },
    evaluationNone: "À évaluer",
    addActivity: "Ajouter une activité",
    noActivity: "Aucune activité dans ce groupe.",
    untitled: "Activité sans nom",
    maxActivities: "{max} activités au plus.",
    resourcesTitle: "2. Ressources et analyse VRIO",
    resourcesIntro:
      "Pour chaque ressource ou compétence, répondez aux quatre questions dans l'ordre. Le " +
      "résultat suit l'arbre de décision ; une réponse « partiel » compte comme « non » et " +
      "rend le résultat à confirmer.",
    resourceName: "Ressource ou compétence",
    category: "Catégorie (facultatif)",
    tests: {
      value: "Valeur",
      rarity: "Rareté",
      imitability: "Difficile à imiter",
      organization: "Organisation pour l'exploiter",
    },
    answers: {
      yes: "Oui",
      no: "Non",
      partial: "Partiel",
    },
    answerNone: "–",
    justification: "Justification",
    result: "Résultat",
    resultPending: "Répondez aux questions dans l'ordre.",
    outcomes: {
      disadvantage: "Désavantage concurrentiel",
      parity: "Parité concurrentielle",
      temporary: "Avantage temporaire",
      unexploited: "Avantage inexploité",
      sustained: "Avantage durable",
    },
    tentative: "à confirmer",
    addResource: "Ajouter une ressource",
    noResource: "Ajoutez une première ressource (ex. : savoir-faire, marque, équipement).",
    untitledResource: "Ressource sans nom",
    maxResources: "{max} ressources au plus.",
    checklist: {
      model: "Modèle de chaîne de valeur choisi",
      activities: "Au moins 4 activités évaluées",
      resources: "Au moins 3 ressources passées au VRIO",
      complete: "Les quatre tests remplis pour chaque ressource",
    },
  },

  // ==================== GABARIT : PARTIES PRENANTES ====================
  stakeholders: {
    listTitle: "1. Parties prenantes",
    listIntro:
      "Notez le pouvoir et l'intérêt de chaque partie prenante de 1 (faible) à 5 (fort) ; " +
      "à partir de 3, ils sont considérés comme forts.",
    fields: {
      name: "Partie prenante",
      expectations: "Attentes",
      power: "Pouvoir",
      interest: "Intérêt",
      engagementCurrent: "Engagement actuel",
      engagementDesired: "Engagement souhaité",
      approach: "Approche",
      actions: "Actions",
    },
    levelNone: "–",
    engagements: {
      unaware: "Ignorant",
      resistant: "Réfractaire",
      neutral: "Neutre",
      supportive: "Favorable",
      leading: "Moteur",
    },
    engagementNone: "À préciser",
    add: "Ajouter une partie prenante",
    none: "Ajoutez une première partie prenante (ex. : clients, employés, banque).",
    untitled: "Partie prenante sans nom",
    max: "{max} parties prenantes au plus.",
    gridTitle: "2. Matrice pouvoir-intérêt",
    gridIntro:
      "La case est calculée à partir du pouvoir et de l'intérêt. Glissez une partie prenante " +
      "ou choisissez une autre case pour la placer à la main.",
    powerAxis: "Pouvoir",
    interestAxis: "Intérêt",
    quadrants: {
      manage: "Gérer de près",
      satisfy: "Satisfaire",
      inform: "Informer",
      monitor: "Surveiller",
    },
    quadrantHints: {
      manage: "Pouvoir fort, intérêt fort.",
      satisfy: "Pouvoir fort, intérêt faible.",
      inform: "Pouvoir faible, intérêt fort.",
      monitor: "Pouvoir faible, intérêt faible.",
    },
    unplaced: "À placer (pouvoir ou intérêt manquant)",
    unplacedEmpty: "Toutes les parties prenantes nommées sont placées.",
    placeIn: "Case de « {name} »",
    placeAuto: "Automatique ({quadrant})",
    placeAutoNone: "Automatique",
    manual: "placée à la main",
    resetAuto: "Revenir au placement automatique",
    noHighPower:
      "Vraiment personne n'a de pouvoir sur votre entreprise ? Pensez à vos banques, à vos " +
      "grands clients, aux organismes qui vous réglementent.",
    checklist: {
      count: "Au moins 5 parties prenantes nommées",
      placed: "Chaque partie prenante placée dans la matrice",
      highPower: "Au moins une partie prenante à « Gérer de près » ou « Satisfaire »",
    },
  },

  // ==================== GABARIT : SYNTHÈSE (SWOT, TOWS, ENJEUX) ====================
  synthesis: {
    swotTitle: "1. Matrice SWOT",
    swotIntro:
      "Rassemblez les forces et faiblesses (internes) et les opportunités et menaces " +
      "(externes). L'étiquette « É1 » à « É4 » rappelle l'étape d'où vient un élément.",
    keys: {
      strengths: "Forces",
      weaknesses: "Faiblesses",
      opportunities: "Opportunités",
      threats: "Menaces",
    },
    keyHints: {
      strengths: "Interne, favorable",
      weaknesses: "Interne, défavorable",
      opportunities: "Externe, favorable",
      threats: "Externe, défavorable",
    },
    itemLabel: "Élément de la case « {key} »",
    origin: "Repris de l'étape {step}",
    addItem: "Ajouter",
    emptyKey: "Aucun élément pour l'instant.",
    maxItems: "{max} éléments au plus par case.",
    untitled: "élément sans texte",
    importOpen: "Reprendre les étapes 1 à 4",
    importTitle: "Éléments à reprendre",
    importIntro:
      "Cochez les éléments à ajouter à la SWOT. Les facteurs PESTEL, les forces d'intensité " +
      "forte, les activités évaluées et les ressources VRIO sont proposés ; l'étape 4 " +
      "n'alimente pas la SWOT automatiquement.",
    importNone:
      "Rien à reprendre pour l'instant : complétez d'abord les étapes 1 à 3 (nature des " +
      "facteurs, intensité des forces, évaluation des activités, tests VRIO).",
    importPresent: "déjà dans la SWOT",
    importConfirm: "Ajouter les éléments cochés ({count})",
    importCancel: "Fermer",
    towsTitle: "2. Matrice TOWS",
    towsIntro:
      "Croisez les cases de la SWOT pour dégager des pistes d'action. Liez chaque piste aux " +
      "éléments de la SWOT qu'elle combine.",
    quadrants: {
      so: "Forces × Opportunités",
      st: "Forces × Menaces",
      wo: "Faiblesses × Opportunités",
      wt: "Faiblesses × Menaces",
    },
    quadrantHints: {
      so: "Utiliser ses forces pour saisir les opportunités.",
      st: "Utiliser ses forces pour contrer les menaces.",
      wo: "Corriger ses faiblesses grâce aux opportunités.",
      wt: "Réduire ses faiblesses et se protéger des menaces.",
    },
    towsLabel: "Piste « {quadrant} »",
    addTows: "Ajouter une piste",
    emptyTows: "Aucune piste pour l'instant.",
    maxTows: "{max} pistes au plus.",
    links: "Éléments liés",
    linksNone: "Aucun élément à lier : complétez d'abord les cases concernées.",
    issuesTitle: "3. Enjeux stratégiques",
    issuesIntro:
      "Formulez deux ou trois enjeux majeurs qui découlent de votre SWOT et de vos pistes " +
      "TOWS ; ils orienteront la suite de l'étude.",
    issueTitle: "Enjeu",
    issueExplanation: "Explication",
    issueLinks: "S'appuie sur",
    addIssue: "Ajouter un enjeu",
    emptyIssues: "Aucun enjeu pour l'instant.",
    maxIssues: "{max} enjeux au plus.",
    untitledIssue: "Enjeu sans titre",
    checklist: {
      swot: "Au moins un élément dans chaque case de la SWOT",
      tows: "Au moins une piste TOWS",
      issues: "Deux ou trois enjeux stratégiques nommés",
    },
  },

  // ==================== GABARIT : CAP ====================
  direction: {
    visionTitle: "1. Vision",
    visionIntro:
      "Où serez-vous dans 5 à 10 ans ? Une phrase qui donne une direction et qui n'appartient " +
      "qu'à vous.",
    visionLabel: "Vision",
    nameTestTitle: "Test du remplacement du nom",
    nameTestIntro:
      "Remplacez le nom de l'organisation par celui d'un concurrent. Si la phrase reste " +
      "vraie, elle ne dit rien de vous.",
    competitorLabel: "Concurrent",
    competitorHint: "Choisissez un concurrent du profil ou saisissez un autre nom.",
    competitorOther: "Autre nom…",
    competitorNone: "Choisir un concurrent",
    competitorCustom: "Nom du concurrent",
    rewritten: "Votre vision, au nom de {competitor} :",
    rewrittenEmpty: "Rédigez la vision et choisissez un concurrent pour lancer le test.",
    question: "Cette phrase reste-t-elle vraie pour ce concurrent ?",
    answers: {
      yes: "Oui, elle reste vraie",
      no: "Non, elle ne lui va pas",
    },
    states: {
      pending: "Test à faire.",
      stale: "La vision a changé depuis le test : refaites-le.",
      passed: "Test réussi : votre vision vous distingue.",
      failed:
        "Test échoué : la vision pourrait être celle d'un concurrent. Précisez ce qui " +
        "n'appartient qu'à vous, puis refaites le test.",
    },
    missionTitle: "2. Mission",
    missionIntro: "Pourquoi existez-vous, et pour qui ?",
    missionLabel: "Mission",
    valuesTitle: "3. Valeurs",
    valuesIntro:
      "Comment vous comportez-vous ? Pour chaque valeur, un geste concret qui la rend visible " +
      "au quotidien.",
    valueName: "Valeur",
    valueGesture: "Geste concret",
    addValue: "Ajouter une valeur",
    emptyValues: "Aucune valeur pour l'instant.",
    maxValues: "{max} valeurs au plus.",
    untitledValue: "Valeur sans nom",
    objectivesTitle: "4. Objectifs SMART",
    objectivesIntro:
      "Spécifiques, mesurables, atteignables, réalistes, temporellement définis. Vérifiez " +
      "chaque critère et reliez l'objectif aux enjeux de la synthèse.",
    objectiveLabel: "Objectif {no}",
    objectiveIndicator: "Indicateur",
    objectiveTarget: "Cible",
    objectiveDeadline: "Échéance",
    smartLegend: "Critères SMART",
    smart: {
      specific: "Spécifique",
      measurable: "Mesurable",
      achievable: "Atteignable",
      realistic: "Réaliste",
      timeBound: "Temporellement défini",
    },
    smartHints: {
      specific: "Il dit précisément ce qui doit changer.",
      measurable: "Un chiffre ou un fait permet de dire s'il est atteint.",
      achievable: "L'équipe a une prise réelle sur le résultat.",
      realistic: "Il tient compte des moyens et des contraintes.",
      timeBound: "Il a une échéance.",
    },
    smartCount: "{count} critère(s) sur 5",
    smartOk: "Objectif SMART",
    issueLinks: "Répond aux enjeux",
    noIssues: "Aucun enjeu nommé à l'étape 5.",
    issuesGroup: "Enjeux de la synthèse",
    addObjective: "Ajouter un objectif",
    emptyObjectives: "Aucun objectif pour l'instant.",
    maxObjectives: "{max} objectifs au plus.",
    untitledObjective: "Objectif sans texte",
    checklist: {
      vision: "Vision rédigée",
      nameTest: "Test du remplacement du nom réussi sur la vision actuelle",
      mission: "Mission rédigée",
      values: "Au moins deux valeurs, chacune avec un geste concret",
      objectives: "Au moins un objectif coché sur les cinq critères SMART",
    },
  },

  // ==================== GABARIT : CHOIX ====================
  choice: {
    genericTitle: "1. Stratégie générique",
    genericIntro:
      "Sur quoi repose votre avantage (coûts plus bas ou valeur unique), et pour quelle cible " +
      "(large ou étroite) ?",
    genericLegend: "Position retenue",
    axisAdvantage: "Avantage",
    axisTarget: "Cible",
    advantages: { cost: "Coûts plus bas", differentiation: "Valeur unique" },
    targets: { broad: "Large", narrow: "Étroite" },
    positions: {
      cost: "Domination par les coûts",
      differentiation: "Différenciation",
      focusCost: "Focalisation par les coûts",
      focusDifferentiation: "Focalisation par la différenciation",
    },
    justification: "Pourquoi cette position ?",
    ansoffTitle: "2. Options et matrice d'Ansoff",
    ansoffIntro:
      "Listez les options envisagées et placez chacune dans une case : produits actuels ou " +
      "nouveaux, marchés actuels ou nouveaux.",
    axisProducts: "Produits",
    axisMarkets: "Marchés",
    current: "Actuels",
    new: "Nouveaux",
    cells: {
      penetration: "Pénétration du marché",
      productDevelopment: "Développement de produits",
      marketDevelopment: "Développement de marchés",
      diversification: "Diversification",
    },
    cellNone: "Case à choisir",
    cellEmpty: "Aucune option.",
    unplaced: "Options sans case : {count}",
    optionsTitle: "3. Évaluation des options",
    optionsIntro:
      "Pertinence : l'option répond-elle aux enjeux ? Acceptabilité : les parties prenantes " +
      "clés l'accepteront-elles ? Faisabilité : en avez-vous les moyens ? Puis décidez.",
    optionLabel: "Option {no}",
    ansoffLabel: "Case d'Ansoff",
    criteria: {
      relevance: "Pertinence",
      acceptability: "Acceptabilité",
      feasibility: "Faisabilité",
    },
    ratings: { yes: "Oui", partial: "Partiel", no: "Non" },
    ratingNone: "–",
    comment: "Commentaire",
    decisionLabel: "Décision",
    decisions: { retained: "Retenue", rejected: "Écartée" },
    decisionNone: "À décider",
    issueLinks: "Répond aux enjeux",
    noIssues: "Aucun enjeu nommé à l'étape 5.",
    issuesGroup: "Enjeux de la synthèse",
    warnings: {
      failedCriterion: "Option retenue malgré un « non » ({criteria}) : est-ce voulu ?",
      noIssue: "Option retenue sans enjeu lié : à quel enjeu répond-elle ?",
    },
    addOption: "Ajouter une option",
    emptyOptions: "Aucune option pour l'instant.",
    maxOptions: "{max} options au plus.",
    untitledOption: "Option sans texte",
    statementTitle: "4. Stratégie retenue",
    statementIntro:
      "Énoncez en quelques phrases la stratégie que vous retenez : la position, la direction " +
      "de croissance et les options choisies.",
    statementLabel: "Énoncé de la stratégie",
    retainedSummary: "Options retenues",
    retainedNone: "Aucune option retenue pour l'instant.",
    renunciationsTitle: "5. Ce que nous ne ferons pas",
    renunciationsIntro: "Une stratégie, c'est aussi dire ce qu'on ne fera pas.",
    renunciationLabel: "Renoncement {no}",
    addRenunciation: "Ajouter un renoncement",
    emptyRenunciations: "Aucun renoncement pour l'instant.",
    maxRenunciations: "{max} renoncements au plus.",
    checklist: {
      generic: "Position dans les stratégies génériques choisie",
      options: "Au moins deux options évaluées sur les trois critères",
      retained: "Au moins une option retenue",
      statement: "Énoncé de la stratégie rédigé",
      renunciations: "Au moins un renoncement",
    },
  },

  // ==================== GABARIT : ACTION ====================
  action: {
    roadmapTitle: "1. Feuille de route",
    roadmapIntro:
      "Traduisez les options retenues en chantiers : qui en répond, quand ils commencent et " +
      "finissent. Découpez au besoin un chantier en phases.",
    workstreamLabel: "Chantier {no}",
    owner: "Responsable",
    start: "Début",
    end: "Fin",
    phasesLegend: "Phases (facultatives)",
    phaseLabel: "Phase {no}",
    addPhase: "Ajouter une phase",
    maxPhases: "{max} phases au plus.",
    untitledPhase: "Phase sans nom",
    optionLinks: "Met en œuvre les options",
    optionsGroup: "Options retenues à l'étape 7",
    noOptions: "Aucune option retenue à l'étape 7.",
    objectiveLinks: "Contribue aux objectifs",
    objectivesGroup: "Objectifs de l'étape 6",
    noObjectives: "Aucun objectif rédigé à l'étape 6.",
    warnings: {
      badDates: "La fin précède le début.",
      phaseOutside: "Une phase déborde du chantier ou a ses dates inversées.",
      noOption: "Aucune option liée : quelle option retenue ce chantier met-il en œuvre ?",
    },
    addWorkstream: "Ajouter un chantier",
    emptyWorkstreams: "Aucun chantier pour l'instant.",
    maxWorkstreams: "{max} chantiers au plus.",
    untitledWorkstream: "Chantier sans nom",
    ganttTitle: "Vue Gantt",
    ganttIntro: "Calculée à partir des dates des chantiers et de leurs phases.",
    ganttEmpty: "Datez au moins un chantier (début et fin) pour afficher la vue Gantt.",
    ganttTruncated: "Seuls les {max} premiers mois sont affichés.",
    ganttPeriod: "{name} : de {start} à {end}",
    scorecardTitle: "2. Tableau de bord équilibré",
    scorecardIntro:
      "Pour chaque perspective, choisissez les indicateurs qui diront si la stratégie avance. " +
      "Mêlez indicateurs de résultat (ils constatent) et indicateurs avancés (ils annoncent).",
    perspectives: {
      financial: "Finances",
      customer: "Clients",
      internal: "Processus internes",
      learning: "Apprentissage et croissance",
    },
    perspectiveHints: {
      financial: "Comment la stratégie se traduit-elle en résultats financiers ou budgétaires ?",
      customer: "Que doivent constater les clients ou les bénéficiaires ?",
      internal: "Dans quels processus devons-nous exceller ?",
      learning: "Quelles compétences, quels outils et quelle culture faut-il développer ?",
    },
    perspectiveCovered: "Perspective couverte",
    indicatorName: "Indicateur",
    definition: "Définition (mode de calcul)",
    target: "Cible",
    frequency: "Fréquence",
    frequencyNone: "À choisir",
    frequencies: {
      monthly: "Mensuelle",
      quarterly: "Trimestrielle",
      semiannual: "Semestrielle",
      annual: "Annuelle",
    },
    kind: "Type",
    kindNone: "À choisir",
    kinds: { lagging: "Résultat", leading: "Avancé" },
    indicatorObjectives: "Suit les objectifs",
    addIndicator: "Ajouter un indicateur",
    emptyIndicators: "Aucun indicateur dans cette perspective.",
    maxIndicators: "{max} indicateurs au plus, toutes perspectives confondues.",
    untitledIndicator: "Indicateur sans nom",
    risksTitle: "3. Risques (facultatif)",
    risksIntro:
      "Qu'est-ce qui pourrait faire dérailler la mise en œuvre ? Pour chaque risque, le signal " +
      "qui doit alerter et la réponse prévue.",
    riskLabel: "Risque {no}",
    signal: "Signal d'alerte",
    response: "Réponse prévue",
    riskWorkstream: "Chantier exposé",
    riskWorkstreamNone: "Aucun en particulier",
    addRisk: "Ajouter un risque",
    emptyRisks: "Aucun risque pour l'instant.",
    maxRisks: "{max} risques au plus.",
    untitledRisk: "Risque sans texte",
    checklist: {
      workstream: "Au moins un chantier avec un responsable, un début et une fin",
      scorecard: "Au moins un indicateur nommé dans chacune des quatre perspectives",
    },
  },

  // ==================== PLAN STRATÉGIQUE (ÉTAPE 9) ====================
  plan: {
    intro:
      "Le plan rassemble votre travail des étapes 1 à 8 en huit sections. Chaque paragraphe " +
      "garde ses sources : l'annexe de traçabilité montre d'où vient chaque affirmation.",
    notGenerated:
      "Le plan n'a pas encore été généré. La génération assemble vos étapes validées, sans " +
      "IA ; vous pourrez ensuite modifier chaque section ou demander au coach de la rédiger.",
    generate: "Générer le plan",
    generating: "Génération…",
    generatedAt: "Plan généré le {date}.",
    neverValidated: "Le plan ne se valide pas : modifiez-le librement.",
    regenerateAll: "Tout régénérer depuis les étapes",
    regenerateAllConfirm:
      "Les huit sections seront remplacées par un nouvel assemblage des étapes. Le contenu " +
      "actuel reste disponible dans l'historique des versions.",
    sections: {
      situation: "1. Où en sommes-nous",
      issues: "2. Nos enjeux",
      direction: "3. Notre cap",
      strategy: "4. Notre stratégie et ce que nous ne ferons pas",
      workstreams: "5. Nos chantiers",
      objectives: "6. Nos objectifs et indicateurs",
      risks: "7. Nos risques",
      monitoring: "8. Notre suivi",
    },
    origins: {
      assembled: "Assemblée depuis les étapes",
      coach: "Rédigée avec le coach",
      edited: "Modifiée",
    },
    regenerateSection: "Régénérer depuis les étapes",
    regenerateConfirm:
      "Le contenu actuel de cette section sera remplacé. Il reste disponible dans " +
      "l'historique des versions.",
    coachWrite: "Rédiger avec le coach",
    coachWriting: "Le coach rédige cette section…",
    coachWaitSave: "Attendez la fin de l'enregistrement pour solliciter le coach.",
    coachConfirm:
      "Le coach rédige une proposition à partir de vos étapes, en citant ses sources. Elle " +
      "utilise une partie du budget de coach de l'étude ; vous choisirez ensuite de remplacer " +
      "la section ou non.",
    confirm: "Confirmer",
    cancel: "Annuler",
    proposalTitle: "Proposition du coach",
    proposalReplace: "Remplacer la section",
    proposalIgnore: "Ignorer",
    proposalDropped: "{count} paragraphe(s) sans source vérifiable écarté(s).",
    proposalEmpty: "Le coach n'a rien proposé d'utilisable pour cette section.",
    paragraph: "Paragraphe {no}",
    addParagraph: "Ajouter un paragraphe",
    removeParagraph: "Retirer le paragraphe {no}",
    maxParagraphs: "{max} paragraphes au plus par section.",
    emptySection: "Cette section est vide.",
    sourcesCount: "{count} source(s)",
    noSource: "Sans source",
    annexTitle: "Annexe : traçabilité",
    annexIntro:
      "Chaque paragraphe du plan renvoie à l'étape et à l'élément d'où il vient. Un élément " +
      "supprimé depuis est signalé : relisez le paragraphe concerné.",
    annexEmpty: "Aucun paragraphe ne cite de source pour l'instant.",
    annexParagraph: "§ {no}",
    readOnly: "Vous consultez le plan en lecture seule.",

    // Export du plan en PDF et DOCX (S8b)
    export: {
      title: "Exporter le plan",
      intro:
        "Le fichier reprend la dernière version enregistrée : les huit sections, la feuille " +
        "de route en Gantt, le tableau de bord équilibré et l'annexe de traçabilité.",
      pdf: "Exporter en PDF",
      docx: "Exporter en DOCX",
      preparing: "Préparation du fichier…",
      waitSave: "Attendez la fin de l'enregistrement pour exporter.",
      failed: "L'export a échoué. Réessayez dans un instant.",
      documentTitle: "Plan stratégique",
      question: "Question stratégique",
      exportedOn: "Version exportée le {date}",
      preparedWith: "Préparé avec Kalami Stratégie",
      contents: "Sommaire",
      footer: "Plan stratégique — {name}",
      emptySection: "Cette section est vide.",
      ganttTitle: "Annexe A : feuille de route",
      ganttEmpty: "Aucun chantier daté à l'étape 8.",
      scorecardTitle: "Annexe B : tableau de bord équilibré",
      scorecardEmpty: "Aucun indicateur dans cette perspective.",
      annexTitle: "Annexe C : traçabilité",
      workstream: "Chantier",
      period: "Période",
      none: "—",
    },

    // Textes du plan assemblé (repris tels quels dans le contenu)
    assembled: {
      scopeCompany: "L'analyse porte sur l'ensemble de l'organisation {name}.",
      scopeUnit: "L'analyse porte sur {name}, au sein de {parent}.",
      question: "Question stratégique : {question}",
      noIssues: "Aucun enjeu n'a été nommé dans la synthèse (étape 5).",
      vision: "Vision : {text}",
      mission: "Mission : {text}",
      values: "Nos valeurs :",
      gesture: "au quotidien",
      objectives: "Nos objectifs :",
      position: "Position retenue : {position}.",
      retained: "Options retenues :",
      renunciations: "Ce que nous ne ferons pas :",
      noRenunciations: "Aucun renoncement n'a été formulé à l'étape 7.",
      owner: "responsable",
      period: "période",
      range: "de {start} à {end}",
      noWorkstreams: "Aucun chantier n'a été défini à l'étape 8.",
      measuredObjectives: "Objectifs mesurés :",
      indicator: "indicateur",
      target: "cible",
      deadline: "échéance",
      signal: "signal d'alerte",
      response: "réponse prévue",
      noRisks: "Aucun risque n'a été formalisé à l'étape 8.",
      frequency: "Suivi à fréquence {frequency} :",
      milestones: "Jalons (fin des chantiers) :",
      milestone: "{name} : {date}",
      noMonitoring: "Aucun rythme de suivi ni jalon n'a été défini à l'étape 8.",
    },

    // Libellés de l'annexe de traçabilité
    trace: {
      profile: "Profil",
      scopeUnit: "{name}, au sein de {parent}",
      from: "(issu de É{step})",
      missing: "É{step} · élément introuvable (supprimé depuis)",
      kinds: {
        scope: "périmètre",
        question: "question stratégique",
        tows: "piste TOWS",
        issue: "enjeu",
        vision: "vision",
        mission: "mission",
        value: "valeur",
        objective: "objectif",
        generic: "position générique",
        statement: "énoncé de stratégie",
        retained: "option retenue",
        option: "option",
        renunciation: "renoncement",
        workstream: "chantier",
        indicator: "indicateur",
        risk: "risque",
      },
    },
  },

  // ==================== COACH IA ====================
  coach: {
    title: "Coach",
    intro:
      "Le coach relit le gabarit enregistré, pose des questions et évalue votre analyse. Il " +
      "ne modifie rien sans votre accord.",
    tabs: {
      review: "Relecture",
      deepen: "Questions",
      score: "Évaluation",
      research: "Recherche",
      synthesize: "Propositions",
    },
    notAvailable: "Cette fonction du coach n'est pas encore disponible.",
    book: "Selon le livre : {text}",
    request: "Demander une relecture",
    requesting: "Le coach relit votre gabarit…",
    again: "Relire à nouveau",
    waitSave: "Attendez la fin de l'enregistrement pour demander une relecture.",
    readOnly: "Seuls le propriétaire et les contributeurs peuvent solliciter le coach.",
    validatedStep: "Étape validée : le coach relira l'étape quand elle sera rouverte.",
    disabled: "Le coach n'est pas disponible pour le moment.",
    classDisabled: "Coach désactivé par l'enseignant pour cette étape.",
    summaryTitle: "Appréciation d'ensemble",
    reviewedAt: "Relecture du {date}",
    outdated:
      "Le gabarit a changé depuis cette relecture : certaines suggestions peuvent ne plus " +
      "s'appliquer.",
    noSuggestions: "Le coach n'a pas de suggestion pour ce gabarit.",
    rule: "Erreur classique : {title}",
    proposal: "Proposition",
    current: "Texte actuel",
    accept: "Accepter",
    modify: "Modifier",
    reject: "Rejeter",
    noted: "Pris en compte",
    applyEdited: "Appliquer ma version",
    cancel: "Annuler",
    editLabel: "Votre version",
    notApplicable:
      "Cette proposition ne peut plus être appliquée telle quelle (élément retiré ou texte " +
      "trop long).",
    decisions: {
      accepted: "Acceptée",
      modified: "Modifiée",
      rejected: "Rejetée",
    },
    deepen: {
      intro:
        "Des questions pour aller plus loin. Traitez-les dans votre gabarit ou écartez celles " +
        "qui ne s'appliquent pas.",
      request: "Demander des questions",
      requesting: "Le coach prépare ses questions…",
      again: "Nouvelles questions",
      askedAt: "Questions du {date}",
      outdated: "Le gabarit a changé depuis ces questions.",
      none: "Le coach n'a pas de question pour ce gabarit.",
      why: "Pourquoi cette question : {text}",
      treat: "Marquer comme traitée",
      dismiss: "Écarter",
      decisions: {
        accepted: "Traitée",
        modified: "Traitée",
        rejected: "Écartée",
      },
    },
    score: {
      intro:
        "Une note indicative sur 100, avec les critères et les points à améliorer. Elle ne " +
        "bloque jamais la validation de l'étape.",
      request: "Demander une évaluation",
      requesting: "Le coach évalue votre gabarit…",
      again: "Évaluer à nouveau",
      scoredAt: "Évaluation du {date}",
      outdated: "Le gabarit a changé depuis cette évaluation.",
      total: "{score} / 100",
      totalLabel: "Note indicative",
      criteriaTitle: "Critères",
      criteria: {
        completeness: "Complétude",
        precision: "Précision",
        rules: "Erreurs classiques évitées",
        coherence: "Cohérence avec le profil",
      },
      strengths: "Points forts",
      improvements: "Points à améliorer",
      noImprovements: "Le coach ne relève pas de point à améliorer.",
    },
    research: {
      intro:
        "Le coach cherche sur le Web des faits récents et sourcés pour cette étape. " +
        "Ajoutez ceux qui vous semblent pertinents, après avoir vérifié leur source.",
      request: "Lancer une recherche",
      requesting: "Le coach cherche des faits sur le Web…",
      again: "Nouvelle recherche",
      searchedAt: "Recherche du {date}",
      none: "La recherche n'a pas trouvé de fait utilisable pour cette étape.",
      target: "Destination : {target}",
      sources: "Sources",
      pageAge: "publiée : {date}",
      hypothesis: "Hypothèse à vérifier : aucune source trouvée",
      add: "Ajouter",
      dismiss: "Écarter",
      notApplicable:
        "Ce fait ne peut pas être ajouté (gabarit plein ou texte trop long). Ajoutez-le à " +
        "la main si besoin.",
      decisions: {
        accepted: "Ajouté",
        modified: "Ajouté",
        rejected: "Écarté",
      },
    },
    synthesize: {
      intro:
        "Le coach propose des éléments de SWOT, des pistes TOWS et des enjeux tirés de vos " +
        "étapes 1 à 4 et du profil. Cochez ceux à ajouter : rien de ce que vous avez saisi " +
        "n'est remplacé.",
      request: "Demander des propositions",
      requesting: "Le coach prépare ses propositions…",
      again: "Nouvelles propositions",
      proposedAt: "Propositions du {date}",
      outdated: "La synthèse a changé depuis ces propositions.",
      none: "Le coach n'a rien à proposer pour l'instant : complétez d'abord les étapes 1 à 4.",
      swotTitle: "Matrice SWOT",
      towsTitle: "Pistes TOWS",
      issuesTitle: "Enjeux stratégiques",
      toVerify: "À vérifier :",
      toVerifyBadge: "À vérifier (profil seul)",
      duplicate: "Déjà présent",
      links: "S'appuie sur : {items}",
      applyHint:
        "Les éléments cochés sont ajoutés à la synthèse ; les autres sont écartés. Les " +
        "doublons ne sont pas cochés.",
      apply: "Appliquer la sélection ({count})",
      dismissAll: "Tout écarter",
      applied: "Propositions ajoutées à la synthèse : {count}.",
      skipped:
        "Certaines propositions n'ont pas été ajoutées (doublon ou nombre maximal atteint).",
      decided: "Propositions écartées.",
      decisions: {
        accepted: "Ajoutée",
        modified: "Ajoutée",
        rejected: "Écartée",
      },
    },
    usage: "Forfait du coach : {pct} % utilisé (≈ {reviews} relectures restantes)",
    usageNear: "Le forfait du coach de cette étude est presque épuisé.",
    locked: "Le coach de cette étude est verrouillé : un forfait l'ouvre pour toute l'équipe.",
    pageLink: "Forfait et consommation",
    estimate: "≈ {pct} % du forfait",
    errors: {
      unavailable: "Le coach n'est pas disponible pour le moment.",
      coach_disabled: "Le coach est désactivé par l'administrateur.",
      coach_disabled_step: "Coach désactivé par l'enseignant pour cette étape.",
      coach_locked:
        "Le coach de cette étude est verrouillé. Choisissez un forfait pour l'ouvrir.",
      forbidden: "Vous n'avez pas les droits nécessaires sur cette étude.",
      prerequisites_missing: "Des étapes préalables ne sont pas encore validées.",
      step_validated: "Cette étape est validée : rouvrez-la pour la faire relire.",
      rate_limited:
        "Vous avez sollicité le coach plusieurs fois en peu de temps. Réessayez dans quelques " +
        "minutes.",
      budget_exhausted:
        "Le forfait du coach de cette étude est épuisé. Rechargez-le pour continuer.",
      refused: "Le coach n'a pas pu traiter ce contenu. Reformulez-le puis réessayez.",
      timeout: "Le coach a mis trop de temps à répondre. Réessayez dans un instant.",
      busy: "Le service du coach est très sollicité. Réessayez dans un instant.",
      failed: "La demande n'a pas abouti. Réessayez dans un instant.",
      not_published: "Cette fonction du coach n'est pas encore disponible.",
      unreadable: "Ce fichier n'a pas pu être lu. Vérifiez qu'il n'est ni protégé ni endommagé.",
      image_too_large: "Une image ne peut pas dépasser 5 Mo pour être analysée.",
      document_too_long:
        "Ce document est trop long pour être analysé d'un bloc. Joignez un extrait (quelques " +
        "pages ou une feuille).",
    },
  },

  // ==================== PAGE DU COACH D'UNE ÉTUDE (v0.11.1) ====================
  coachPage: {
    title: "Coach IA de l'étude",
    back: "Retour à l'étude",
    intro:
      "Le coach relit vos analyses, pose des questions, évalue vos gabarits et cherche des " +
      "faits sourcés. Un forfait l'ouvre pour toute l'équipe de l'étude ; il se recharge à " +
      "tout moment.",
    lockedTitle: "Coach verrouillé",
    lockedIntro:
      "Cette étude n'a pas encore de forfait. Vous pouvez remplir toutes les étapes sans le " +
      "coach ; il s'ouvre dès qu'un forfait est ajouté.",
    exhaustedTitle: "Forfait épuisé",
    exhaustedIntro: "Rechargez le forfait pour continuer à utiliser le coach.",
    gaugeTitle: "Forfait en cours",
    breakdownTitle: "Consommation par étape",
    breakdownIntro: "Part du forfait utilisée par chaque fonction du coach.",
    noUsage: "Le coach n'a pas encore été utilisé pour cette étude.",
    columns: {
      step: "Étape",
      fn: "Fonction",
      requests: "Demandes",
      pct: "Part du forfait",
    },
    attachments: "Documents joints",
    pct: "{pct} %",
    functions: {
      review: "Relecture",
      deepen: "Questions",
      score: "Évaluation",
      research: "Recherche Web",
      synthesize: "Propositions de synthèse",
      extract: "Analyse d'un document",
      plan: "Rédaction du plan",
    },
    offersTitle: "Forfaits",
    rechargeTitle: "Recharger le forfait",
    offersIntro:
      "Un forfait s'ajoute à ce qui reste. Le nombre de relectures est indicatif : une " +
      "recherche Web ou un long gabarit consomment davantage.",
    approxReviews: "≈ {count} relectures",
    paymentSoon: "Paiement bientôt",
    paymentSoonHelp:
      "Le paiement en ligne arrive bientôt. En attendant, écrivez à l'administrateur pour " +
      "ouvrir ou recharger le coach de votre étude.",
    noOffers: "Aucun forfait n'est proposé pour le moment.",
  },

  // ==================== ÉQUIPE ET JOURNAL (S9a) ====================
  team: {
    navTeam: "Équipe",
    navJournal: "Journal",
    back: "Retour à l'étude",
    cancel: "Ne rien changer",
    kicker: "Travail en équipe",
    title: "Équipe de l'étude",
    intro:
      "Invitez les personnes qui travailleront avec vous. Le propriétaire valide les étapes ; " +
      "les contributeurs les remplissent ; les observateurs lisent sans modifier.",
    roleHelp: {
      owner: "Valide les étapes, invite et gère l'équipe.",
      contributor: "Remplit les étapes et dialogue avec le coach.",
      observer: "Lit l'étude et exporte le plan, sans rien modifier.",
    },
    members: {
      title: "Membres",
      you: "vous",
      joined: "Membre depuis le {date}",
      noName: "Nom non renseigné",
      roleLabel: "Rôle de {name}",
      changeRole: "Changer le rôle",
      remove: "Retirer",
      removeConfirm: "Retirer {name} de l'étude ? Ses attributions d'étapes seront retirées.",
      removed: "Membre retiré.",
      roleChanged: "Rôle modifié.",
      leave: "Quitter l'étude",
      leaveConfirm:
        "Quitter l'étude ? Vous n'y aurez plus accès, sauf nouvelle invitation du propriétaire.",
    },
    invite: {
      title: "Inviter une personne",
      email: "Courriel",
      role: "Rôle",
      submit: "Envoyer l'invitation",
      sending: "Envoi…",
      sent: "Invitation envoyée à {email}. Le lien est valable 14 jours.",
      notSent:
        "Invitation créée, mais le courriel n'a pas pu partir. Transmettez vous-même ce lien " +
        "(valable 14 jours) :",
      copy: "Copier le lien",
      copied: "Lien copié",
      ownerOnly: "Seul le propriétaire invite de nouveaux membres.",
    },
    pending: {
      title: "Invitations en attente",
      none: "Aucune invitation en attente.",
      expires: "Expire le {date}",
      expired: "Expirée",
      renew: "Renvoyer",
      revoke: "Annuler l'invitation",
      revokeConfirm: "Annuler l'invitation de {email} ? Son lien ne fonctionnera plus.",
      renewed: "Invitation renvoyée à {email}. Le nouveau lien est valable 14 jours.",
      revoked: "Invitation annulée.",
    },
    assign: {
      title: "Responsables des étapes",
      intro:
        "Indicatif : la personne responsable d'une étape la fait avancer. Tous les " +
        "contributeurs gardent le droit de la modifier.",
      label: "Responsable de l'étape {no}",
      none: "Personne",
      saved: "Responsable enregistré.",
      onCard: "Responsable : {name}",
    },
    name: {
      title: "Votre nom dans l'équipe",
      label: "Nom affiché",
      help: "Sans nom, les autres membres voient votre courriel.",
      save: "Enregistrer",
      saved: "Nom enregistré.",
    },
    invitation: {
      kicker: "Invitation",
      title: "Rejoindre une étude stratégique",
      body: "{inviter} vous invite à rejoindre l'étude « {company} » comme {role}.",
      accept: "Accepter l'invitation",
      decline: "Refuser",
      declined: "Invitation refusée. Vous pouvez fermer cette page.",
      notFound:
        "Ce lien d'invitation n'est pas valide. Vérifiez qu'il est complet ou demandez une " +
        "nouvelle invitation.",
      expired: "Cette invitation a expiré. Demandez à {inviter} de vous la renvoyer.",
      closed: "Cette invitation n'est plus valable.",
      mismatch:
        "Cette invitation est adressée à {email}. Connectez-vous avec ce courriel, confirmé, " +
        "pour l'accepter.",
      signOut: "Changer de compte",
      alreadyMember: "Vous êtes déjà membre de cette étude.",
      open: "Ouvrir l'étude",
      home: "Mes études",
    },
    received: {
      title: "Invitations reçues",
      body: "{inviter} vous invite à l'étude « {company} » comme {role}.",
      expires: "Valable jusqu'au {date}",
    },
    email: {
      subject: "{inviter} vous invite à l'étude « {company} »",
      greeting: "Bonjour,",
      body:
        "{inviter} vous invite à rejoindre l'étude stratégique « {company} » sur Kalami " +
        "Stratégie, comme {role}.",
      cta: "Voir l'invitation",
      account:
        "Pour accepter, connectez-vous (ou créez votre compte) avec cette adresse : {email}.",
      validity:
        "Ce lien est valable 14 jours. Si vous ne vous attendiez pas à cette invitation, " +
        "ignorez ce courriel.",
    },
    journal: {
      kicker: "Travail en équipe",
      title: "Journal d'activité",
      intro: "Les actions de l'équipe sur l'étude, de la plus récente à la plus ancienne.",
      none: "Aucune activité enregistrée pour l'instant.",
      more: "Entrées plus anciennes",
      latest: "Revenir aux plus récentes",
      someone: "Une personne",
      actions: {
        invitation_sent: "{actor} a invité une personne comme {role}.",
        invitation_renewed: "{actor} a renvoyé une invitation ({role}).",
        invitation_revoked: "{actor} a annulé une invitation ({role}).",
        invitation_declined: "{actor} a refusé l'invitation.",
        member_joined: "{actor} a rejoint l'étude comme {role}.",
        member_role_changed: "{actor} a donné le rôle {role} à {target}.",
        member_removed: "{actor} a retiré {target} de l'étude.",
        member_left: "{actor} a quitté l'étude.",
        step_assigned: "{actor} a confié l'étape {step} à {target}.",
        step_unassigned: "{actor} a retiré le responsable de l'étape {step}.",
        step_started: "{actor} a commencé l'étape {step}.",
        step_validated: "{actor} a validé l'étape {step}.",
        step_reopened: "{actor} a rouvert l'étape {step}.",
        step_needs_review: "L'étape {step} est à revoir après une modification en amont.",
        comment_added: "{actor} a commenté l'étape {step}.",
        class_assigned: "{actor} a distribué cette étude à la classe « {class} ».",
      },
    },
    errors: {
      invalid_email: "Ce courriel n'est pas valide.",
      invalid_role: "Choisissez le rôle Contributeur ou Observateur.",
      already_member: "Cette personne est déjà membre de l'étude.",
      already_invited:
        "Une invitation attend déjà la réponse de cette personne : renvoyez-la plutôt.",
      invite_rate_limited: "Trop d'invitations envoyées en une heure. Réessayez plus tard.",
      too_many_invitations:
        "Cette étude compte déjà 30 invitations en attente : annulez-en une d'abord.",
      invitation_closed: "Cette invitation n'est plus valable.",
      invitation_expired: "Cette invitation a expiré.",
      invitation_not_found: "Cette invitation n'existe pas.",
      email_mismatch: "Cette invitation est adressée à un autre courriel.",
      not_member: "Cette personne n'est plus membre de l'étude.",
      owner_role: "Le rôle du propriétaire ne change pas et il ne quitte pas son étude.",
      invalid_assignee: "Seul un propriétaire ou un contributeur peut être responsable.",
      invalid_token: "Le lien d'invitation n'a pas pu être créé. Réessayez.",
      invalid_name: "Le nom affiché compte 120 caractères au plus.",
      class_teacher: "L'enseignant de la classe reste observateur de l'étude.",
    },
  },

  // ==================== DISCUSSION ET NOTIFICATIONS (S9b) ====================
  comments: {
    title: "Discussion",
    intro:
      "Échangez avec l'équipe sur cette étape. Tapez @ pour mentionner un membre ; il en est " +
      "averti.",
    about: "À propos de :",
    wholeStep: "Toute l'étape",
    clearTarget: "Commenter toute l'étape plutôt",
    placeholder: "Votre commentaire…",
    replyPlaceholder: "Votre réponse…",
    label: "Commentaire",
    counter: "{count} / 2 000",
    submit: "Publier",
    sending: "Envoi…",
    reply: "Répondre",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    deleteConfirm: "Supprimer ce commentaire ?",
    resolve: "Marquer résolu",
    reopen: "Rouvrir",
    resolvedBy: "Résolu par {name}",
    edited: "modifié",
    deletedBody: "Commentaire supprimé.",
    none: "Aucun commentaire sur cette étape pour l'instant.",
    noneForTarget: "Aucun fil sur cet élément.",
    showAll: "Voir tous les fils",
    filtered: "Fils sur : {label}",
    showResolved: "Afficher les fils résolus ({count})",
    hideResolved: "Masquer les fils résolus",
    badgeAdd: "Commenter : {label}",
    badgeCount: "{count} commentaire(s) en cours sur : {label}",
    suggestions: "Membres à mentionner",
    someone: "Une personne",
    sections: {
      factor: "Facteur",
      criterion: "Critère",
      activity: "Activité",
      resource: "Ressource",
      stakeholder: "Partie prenante",
      tows: "Stratégie TOWS",
      issue: "Enjeu",
      vision: "Vision",
      mission: "Mission",
      value: "Valeur",
      objective: "Objectif",
      generic: "Stratégie générique",
      option: "Option",
      statement: "Énoncé stratégique",
      renunciation: "Renoncement",
      workstream: "Chantier",
      indicator: "Indicateur",
      risk: "Risque",
    },
    errors: {
      invalid_comment: "Un commentaire compte entre 1 et 2 000 caractères.",
      too_many_mentions: "Mentionnez 10 personnes au plus dans un commentaire.",
      comment_rate_limited:
        "Trop de commentaires en peu de temps. Réessayez dans quelques minutes.",
      comment_not_found: "Ce commentaire n'existe plus.",
      invalid_parent: "On répond au premier commentaire d'un fil seulement.",
      invalid_target: "Cet élément n'est pas encore enregistré : réessayez dans un instant.",
      not_author: "Seul l'auteur du commentaire, ou le propriétaire, peut faire cela.",
    },
  },

  // ==================== PRÉSENCE (S9c) ====================
  presence: {
    onStep: "Aussi sur cette étape :",
    inStudy: "Aussi dans l'étude :",
    alone: "Personne d'autre n'est connecté en ce moment.",
    editing: "modifie « {label} »",
    editingElement: "{names} modifie cet élément",
    editingElementMany: "{names} modifient cet élément",
    and: " et ",
    stepPeers: "Sur cette étape : {names}",
    remoteSaved: "{name} a enregistré cette étape à {time} ; la page est à jour.",
    conflictKept:
      "{name} a enregistré cette étape entre-temps. Votre saisie est gardée dans l'historique " +
      "des versions (« Copie de secours ») : rechargez la page, puis restaurez-la au besoin.",
    conflictNotKept:
      "Cette étape a été enregistrée ailleurs entre-temps et votre saisie n'a pas pu être " +
      "gardée en copie : copiez vos derniers changements avant de recharger la page.",
    someone: "Un autre membre",
  },
  notifications: {
    kicker: "Travail en équipe",
    title: "Notifications",
    intro:
      "Mentions, réponses à vos fils et commentaires sur les étapes dont vous êtes responsable.",
    bell: "Notifications",
    bellUnread: "Notifications : {count} non lue(s)",
    none: "Aucune notification pour l'instant.",
    unread: "Non lue",
    open: "Voir le commentaire",
    markAll: "Tout marquer comme lu",
    more: "Notifications plus anciennes",
    latest: "Revenir aux plus récentes",
    kinds: {
      mention: "{actor} vous a mentionné à l'étape {step} de « {company} ».",
      reply: "{actor} a répondu à un fil où vous écrivez, étape {step} de « {company} ».",
      step_comment:
        "{actor} a commenté l'étape {step} de « {company} », dont vous êtes responsable.",
    },
    preference: {
      title: "Courriels",
      label: "Recevoir un courriel quand un membre me mentionne",
      help: "Les autres notifications restent sur cette page et dans la cloche.",
      save: "Enregistrer",
      saved: "Préférence enregistrée.",
    },
    email: {
      subject: "{actor} vous a mentionné dans l'étude « {company} »",
      greeting: "Bonjour,",
      body: "{actor} vous a mentionné à l'étape {step} de l'étude « {company} » :",
      cta: "Voir le commentaire",
      footer:
        "Vous recevez ce courriel parce qu'un membre de l'étude vous a mentionné. Vous pouvez " +
        "désactiver ces courriels depuis vos notifications : {url}",
    },
  },

  // ==================== MODE ENSEIGNANT (S10a) ====================
  classes: {
    nav: "Mes classes",
    kicker: "Mode enseignant",
    title: "Mes classes",
    intro:
      "Créez une classe, inscrivez vos étudiants par lien ou par courriel, puis distribuez " +
      "une étude à chacun ou à chaque équipe. Vous suivez leur avancement et commentez " +
      "leurs études comme observateur.",
    notTeacher:
      "Le mode enseignant est ouvert sur demande pendant la phase de lancement : écrivez à " +
      "l'équipe Kalami pour l'activer sur votre compte.",
    credits: "Crédits d'étude disponibles : {count} (une étude distribuée consomme un crédit)",
    none: "Vous n'avez pas encore de classe.",
    active: "Classes en cours",
    archived: "Classes archivées",
    archivedBadge: "Archivée",
    counts: "{students} étudiant(s) · {studies} étude(s)",
    due: "Remise indicative le {date}",
    open: "Ouvrir la classe",
    back: "Mes classes",
    create: {
      title: "Nouvelle classe",
      name: "Nom de la classe",
      namePlaceholder: "Stratégie d'entreprise — groupe 02",
      institution: "Établissement (facultatif)",
      term: "Session (facultatif)",
      termPlaceholder: "Automne 2026",
      dueDate: "Date de remise indicative (facultatif)",
      dueHelp:
        "Affichée aux étudiants. Après cette date, les études non terminées sont signalées " +
        "« en retard » dans le suivi, sans rien bloquer.",
      submit: "Créer la classe",
      creating: "Création…",
    },
    tabs: {
      tracking: "Suivi",
      students: "Étudiants",
      distribute: "Distribuer",
      settings: "Réglages",
    },
    tracking: {
      title: "Suivi de la classe",
      none: "Aucune étude distribuée pour l'instant. Passez par l'onglet « Distribuer ».",
      study: "Étude",
      members: "Étudiants",
      progress: "Avancement",
      steps: "Étapes",
      lastActivity: "Dernière activité",
      late: "En retard",
      done: "Terminée",
      validated: "{count}/9",
      stepTitle: "Étape {no} — {title} : {status}",
      open: "Ouvrir",
      openStudy: "Ouvrir l'étude « {company} »",
      summary: "{studies} étude(s) · {done} terminée(s) · {late} en retard",
    },
    students: {
      title: "Étudiants inscrits",
      none: "Aucun étudiant inscrit pour l'instant.",
      studies: "{count} étude(s)",
      joined: "Inscrit le {date}",
      remove: "Retirer",
      removeConfirm:
        "Retirer {name} de la classe ? Ses études restent en place et vous en restez " +
        "observateur.",
      removed: "Étudiant retiré de la classe.",
    },
    link: {
      title: "Lien de classe",
      intro:
        "Toute personne connectée qui ouvre ce lien rejoint la classe. Régénérez-le pour " +
        "invalider l'ancien, ou désactivez-le une fois les inscriptions faites.",
      none: "Le lien de classe est désactivé.",
      hidden:
        "Un lien est actif. Pour des raisons de sécurité, il n'est montré qu'une fois : " +
        "régénérez-le pour en obtenir un nouveau.",
      fresh: "Nouveau lien de classe (copiez-le maintenant, il ne sera plus affiché) :",
      create: "Créer le lien",
      regenerate: "Régénérer le lien",
      regenerateConfirm: "Régénérer le lien ? L'ancien lien ne fonctionnera plus.",
      disable: "Désactiver le lien",
      disabled: "Lien de classe désactivé.",
    },
    invite: {
      title: "Inviter par courriel",
      emails: "Courriels (un par ligne ou séparés par des virgules)",
      help: "30 courriels au plus par envoi. Chaque invitation est valable 14 jours.",
      submit: "Envoyer les invitations",
      sending: "Envoi…",
      sent: "{count} invitation(s) envoyée(s).",
      notSent:
        "Ces invitations ont été créées, mais le courriel n'est pas parti. Transmettez " +
        "vous-même chaque lien (valable 14 jours) :",
      failed: "Non invités : {list}",
      tooMany: "30 courriels au plus par envoi.",
      empty: "Indiquez au moins un courriel.",
    },
    pending: {
      title: "Invitations en attente",
      none: "Aucune invitation en attente.",
      expires: "Expire le {date}",
      expired: "Expirée",
      renew: "Renvoyer",
      revoke: "Annuler",
      revokeConfirm: "Annuler l'invitation de {email} ? Son lien ne fonctionnera plus.",
      renewed: "Invitation renvoyée à {email}.",
      revoked: "Invitation annulée.",
    },
    distribute: {
      title: "Distribuer une étude",
      intro:
        "Chaque étude distribuée consomme un de vos crédits. Le premier étudiant d'une " +
        "équipe en est propriétaire (il valide les étapes), les autres contributeurs ; " +
        "vous êtes ajouté comme observateur et ne pouvez pas en être retiré.",
      company: "Entreprise ou cas étudié",
      question: "Question stratégique (facultatif)",
      mode: "Répartition",
      individual: "Une étude par étudiant",
      teams: "Par équipes",
      select: "Étudiants",
      selectAll: "Tout sélectionner",
      selectNone: "Tout désélectionner",
      teamOf: "Équipe de {name}",
      teamNone: "Pas d'étude",
      teamNumber: "Équipe {no}",
      teamsHelp:
        "Choisissez une équipe pour chaque étudiant (6 au plus par équipe). Dans chaque " +
        "équipe, le premier de la liste en sera propriétaire.",
      summary: "{studies} étude(s) seront créées, pour {credits} crédit(s) disponible(s).",
      submit: "Distribuer",
      distributing: "Distribution…",
      done: "{count} étude(s) distribuée(s).",
      noStudents: "Inscrivez des étudiants avant de distribuer une étude.",
      nothing: "Sélectionnez au moins un étudiant.",
      teamTooLarge: "Une équipe compte 6 étudiants au plus.",
      archived: "Cette classe est archivée : réactivez-la dans les réglages pour distribuer.",
    },
    settings: {
      title: "Réglages de la classe",
      infoTitle: "Description",
      save: "Enregistrer",
      saving: "Enregistrement…",
      saved: "Réglages enregistrés.",
      coachTitle: "Coach IA",
      coachIntro:
        "Coupez le coach pour les étapes que vos étudiants doivent faire sans aide. Les " +
        "autres étapes gardent le coach.",
      coachStep: "Coach désactivé à l'étape {no} — {title}",
      budget: "Plafond d'IA par étude, en dollars américains (facultatif)",
      budgetHelp:
        "Remplace le plafond général pour les études de cette classe. Laissez vide pour " +
        "garder le plafond général. Maximum 50 $.",
      statusTitle: "Archivage",
      archiveHelp:
        "Archiver une classe ferme les inscriptions et la distribution. Aucune étude n'est " +
        "supprimée et vous en restez observateur.",
      archive: "Archiver la classe",
      archiveConfirm: "Archiver la classe ? Les études restent accessibles.",
      unarchive: "Réactiver la classe",
      archivedDone: "Classe archivée.",
      unarchivedDone: "Classe réactivée.",
    },
    join: {
      kicker: "Classe",
      title: "Rejoindre une classe",
      body: "{teacher} vous invite à rejoindre la classe « {name} ».",
      submit: "Rejoindre la classe",
      joining: "Inscription…",
      notFound:
        "Ce lien de classe n'est pas valide ou a été désactivé. Demandez un nouveau lien à " +
        "votre enseignant.",
      archived: "Cette classe est archivée : les inscriptions sont fermées.",
      expired: "Cette invitation a expiré. Demandez à votre enseignant de la renvoyer.",
      closed: "Cette invitation n'est plus valable.",
      mismatch:
        "Cette invitation est adressée à {email}. Connectez-vous avec ce courriel, confirmé, " +
        "pour rejoindre la classe.",
      signOut: "Changer de compte",
      isTeacher: "Vous êtes l'enseignant de cette classe.",
      alreadyMember: "Vous êtes déjà inscrit à cette classe.",
      openClass: "Ouvrir la classe",
      home: "Mes études",
    },
    student: {
      title: "Mes classes",
      teacher: "Enseignant : {name}",
      due: "Remise indicative le {date}",
      studiesTitle: "Mes études de classe",
      waiting: "Votre enseignant ne vous a pas encore distribué d'étude.",
      leave: "Quitter la classe",
      leaveConfirm:
        "Quitter la classe « {name} » ? Vos études restent accessibles, mais vous ne " +
        "recevrez plus de nouvelle étude.",
      left: "Vous avez quitté la classe.",
    },
    study: {
      badge: "Classe : {name}",
      due: "Remise indicative le {date}",
      late: "Date de remise passée",
      teacher: "Enseignant",
      teacherHelp: "Ajouté par la classe : il suit l'étude et ne peut pas être retiré.",
    },
    email: {
      subject: "{teacher} vous invite à la classe « {name} »",
      greeting: "Bonjour,",
      body:
        "{teacher} vous invite à rejoindre la classe « {name} » sur Kalami Stratégie, pour " +
        "y réaliser une étude stratégique.",
      cta: "Rejoindre la classe",
      account:
        "Pour rejoindre la classe, connectez-vous (ou créez votre compte) avec cette " +
        "adresse : {email}.",
      validity:
        "Ce lien est valable 14 jours. Si vous ne vous attendiez pas à cette invitation, " +
        "ignorez ce courriel.",
    },
    errors: {
      not_teacher: "Cette action est réservée à l'enseignant de la classe.",
      invalid_name: "Donnez un nom à la classe.",
      text_too_long: "Un des champs est trop long.",
      invalid_date: "La date de remise n'est pas valide.",
      invalid_status: "Statut de classe inconnu.",
      invalid_budget: "Le plafond est un montant entre 0 et 50 $, avec deux décimales au plus.",
      invalid_steps: "Seules les étapes 1 à 8 ont un coach.",
      too_many_classes: "Vous avez déjà 50 classes en cours : archivez-en une d'abord.",
      class_archived: "Cette classe est archivée.",
      class_full: "Cette classe compte déjà 300 étudiants.",
      invalid_study: "Indiquez l'entreprise étudiée (200 caractères au plus).",
      invalid_groups: "La répartition des étudiants n'est pas valide. Rechargez la page.",
      not_enough_credits: "Vous n'avez pas assez de crédits d'étude pour cette distribution.",
      link_not_found: "Ce lien de classe n'est pas valide ou a été désactivé.",
      is_teacher: "Vous êtes l'enseignant de cette classe.",
      too_many_invitations:
        "Cette classe compte déjà 300 invitations en attente : annulez-en d'abord.",
    },
  },

  // ==================== ADMINISTRATION ====================
  admin: {
    title: "Stratégie",
    grantTitle: "Accorder des crédits d'étude",
    grantIntro:
      "En attendant l'ouverture des paiements, chaque crédit permet à un compte de créer " +
      "une étude.",
    email: "Courriel du compte",
    quantity: "Nombre de crédits",
    note: "Note (facultatif)",
    grant: "Accorder",
    granted: "{quantity} crédit(s) accordé(s) à {email}.",
    userNotFound: "Aucun compte n'utilise ce courriel.",
    invalidQuantity: "Indiquez un nombre entre 1 et 100.",
    teachers: {
      title: "Enseignants",
      intro:
        "Le statut enseignant ouvre le mode classe (/strategie/classes). Chaque étude " +
        "distribuée consomme un crédit d'étude de l'enseignant : accordez-lui des crédits " +
        "ci-dessus.",
      action: "Statut",
      enable: "Activer le statut enseignant",
      disable: "Retirer le statut enseignant",
      submit: "Appliquer",
      enabled: "Statut enseignant activé pour {email}.",
      disabled: "Statut enseignant retiré à {email}. Ses classes restent en place.",
      none: "Aucun enseignant pour l'instant.",
      columns: {
        email: "Courriel",
        since: "Depuis le",
        credits: "Crédits disponibles",
        classes: "Classes",
      },
    },
    studiesTitle: "Études",
    noStudies: "Aucune étude pour l'instant.",
    columns: {
      company: "Organisation",
      owner: "Propriétaire",
      created: "Créée le",
      updated: "Modifiée le",
      progress: "Étapes validées",
    },
    guides: {
      link: "Guide des étapes",
      title: "Guide des étapes",
      intro:
        "Textes fournis par l'auteur pour chaque étape. Un champ vide n'est pas affiché aux " +
        "utilisateurs.",
      back: "Retour à Stratégie",
      bookTitle: "Livre guide",
      bookIntro:
        "Les liens « Lire le chapitre » ouvrent ce livre, pour les lecteurs qui y ont accès.",
      bookNone: "Aucun livre guide",
      bookSave: "Enregistrer le livre guide",
      bookSaved: "Livre guide enregistré.",
      stepTitle: "Étape {no} · {title}",
      explanation: "Explication de l'étape",
      example: "Exemple Infosystem",
      lockReason: "Raison du verrou (affichée quand l'étape n'est pas ouverte)",
      chapter: "Chapitre du livre guide (numéro, vide = aucun lien)",
      save: "Enregistrer l'étape",
      saved: "Guide de l'étape enregistré.",
      tooLong: "{max} caractères au plus.",
      invalidChapter: "Indiquez un numéro de chapitre entier, ou laissez le champ vide.",
    },
    coach: {
      link: "Coach IA",
      title: "Coach IA",
      back: "Retour à Stratégie",
      promptsLink: "Consignes du coach",
      rulesLink: "Erreurs classiques",
      settingsTitle: "Réglages",
      settingsIntro:
        "Prix en dollars US par million de jetons, à vérifier sur la grille tarifaire " +
        "d'Anthropic. Ils servent à estimer le coût de chaque demande.",
      enabled: "Coach activé",
      model: "Modèle (identifiant de l'API)",
      inputPrice: "Prix en entrée ($ US / million de jetons)",
      outputPrice: "Prix en sortie ($ US / million de jetons)",
      rateLimit: "Demandes par utilisateur",
      rateWindow: "Fenêtre du débit (minutes)",
      searchPrice: "Prix d'une recherche Web ($ US)",
      searchMaxUses: "Recherches Web par demande (1 à 20)",
      save: "Enregistrer les réglages",
      saved: "Réglages du coach enregistrés.",
      invalid: "Vérifiez les valeurs : un nombre positif est attendu dans chaque champ.",
      invalidModel:
        "Identifiant de modèle invalide (lettres minuscules, chiffres, points, tirets).",
      allowanceTitle: "Accorder un montant libre",
      allowanceIntro:
        "Ajoute un montant au forfait d'une étude (dédommagement, essai). Une étude sans " +
        "forfait ni montant accordé garde le coach verrouillé.",
      study: "Étude",
      amount: "Montant ($ US)",
      note: "Note (facultatif)",
      grant: "Accorder",
      granted: "Montant de {amount} $ US accordé.",
      invalidAmount: "Indiquez un montant entre 0,01 et 1000.",
      packsLink: "Forfaits du coach",
      usageTitle: "Consommation par étude",
      usageIntro: "Chiffres seulement : le contenu des études n'est pas affiché ici.",
      noUsage: "Aucune demande au coach pour l'instant.",
      columns: {
        company: "Organisation",
        owner: "Propriétaire",
        requests: "Demandes",
        spent: "Dépensé ($ US)",
        budget: "Forfaits ($ US)",
        last: "Dernière demande",
      },
    },
    coachPacks: {
      title: "Forfaits du coach",
      back: "Retour au coach IA",
      intro:
        "Un forfait couvre un coût Anthropic en dollars US (jamais montré aux clients, qui " +
        "voient un pourcentage et un nombre approximatif de relectures). Laissez les prix " +
        "vides tant que le paiement n'est pas ouvert : le client voit « Paiement bientôt ».",
      newTitle: "Nouveau forfait",
      name: "Nom affiché",
      cost: "Coût couvert ($ US)",
      priceXof: "Prix en FCFA (facultatif)",
      priceEur: "Prix en euros (facultatif)",
      priceCad: "Prix en dollars canadiens (facultatif)",
      active: "Proposé aux clients",
      position: "Ordre d'affichage",
      create: "Créer le forfait",
      save: "Enregistrer",
      saved: "Forfait enregistré.",
      inactive: "Retiré",
      approx: "≈ {count} relectures",
      none: "Aucun forfait pour l'instant.",
      grantTitle: "Accorder un forfait à une étude",
      grantIntro:
        "Ouvre ou recharge le coach pour toute l'équipe de l'étude, en attendant le paiement " +
        "en ligne.",
      study: "Étude",
      pack: "Forfait",
      note: "Note (facultatif)",
      grant: "Accorder",
      granted: "Forfait accordé : le coach de l'étude est ouvert.",
      errors: {
        invalid_name: "Indiquez un nom de 1 à 80 caractères.",
        invalid_amount: "Le coût couvert est un montant entre 0,01 et 1000 $ US.",
        invalid_price: "Un prix, s'il est indiqué, est un nombre positif (FCFA : entier).",
        pack_not_found: "Ce forfait n'existe plus.",
        study_not_found: "Cette étude n'existe plus.",
      },
    },
    coachPrompts: {
      title: "Consignes du coach",
      intro:
        "Une consigne est utilisée par le coach seulement une fois publiée. Les brouillons " +
        "restent invisibles pour les utilisateurs.",
      back: "Retour au coach IA",
      functions: {
        review: "Relecture",
        deepen: "Questions d'approfondissement",
        score: "Évaluation",
        research: "Recherche Web sourcée (étapes 1 et 2)",
        extract: "Analyse des documents joints",
        synthesize: "Propositions pour la synthèse (étape 5)",
        plan: "Rédaction d'une section du plan (étape 9)",
      },
      general: "Toutes les étapes",
      profileScope: "Profil de l'organisation",
      stepLabel: "Étape {no}",
      version: "Version {version}",
      createdAt: "Modifiée le {date}",
      publishedAt: "Publiée le {date}",
      status: {
        current: "En vigueur",
        draft: "Brouillon",
        archived: "Ancienne version",
      },
      none: "Aucune version publiée : le coach ne propose pas encore cette fonction.",
      body: "Texte de la consigne",
      note: "Note de version (facultatif)",
      saveDraft: "Enregistrer le brouillon",
      newDraft: "Nouveau brouillon",
      newDraftHint: "Part du texte en vigueur ; rien n'est publié avant votre décision.",
      publish: "Publier ce brouillon",
      discard: "Abandonner le brouillon",
      restore: "Restaurer comme brouillon",
      diffTitle: "Changements par rapport à la version en vigueur",
      noDiff: "Aucun changement par rapport à la version en vigueur.",
      allNew: "Aucune version en vigueur : tout le texte est nouveau.",
      history: "Anciennes versions ({count})",
      show: "Afficher le texte",
      saved: "Brouillon enregistré.",
      published: "Consigne publiée : le coach l'utilise dès maintenant.",
      discarded: "Brouillon abandonné.",
      restored: "Ancienne version copiée dans le brouillon. Relisez-la puis publiez-la.",
      invalid: "Fonction ou étape invalide.",
      emptyBody: "Le texte de la consigne est vide.",
      tooLong: "{max} caractères au plus.",
      notDraft: "Cette version n'est plus un brouillon.",
      notFound: "Version introuvable.",
    },
    coachRules: {
      title: "Erreurs classiques",
      intro:
        "Erreurs que le coach signale dans ses relectures. L'explication du livre est " +
        "affichée sous la suggestion quand elle est remplie. Chaque modification est " +
        "conservée dans l'historique.",
      back: "Retour au coach IA",
      newTitle: "Nouvelle erreur classique",
      code: "Code",
      codeHint:
        "Lettres minuscules, chiffres et soulignés (2 à 60). Il ne peut plus être modifié.",
      step: "Étape",
      general: "Toutes les étapes",
      stepLabel: "Étape {no}",
      ruleTitle: "Titre",
      explanation: "Explication selon le livre (facultatif)",
      position: "Ordre d'affichage",
      active: "Active",
      inactive: "Inactive",
      emptyExplanation: "Explication du livre à saisir.",
      save: "Enregistrer",
      create: "Créer l'erreur classique",
      saved: "Erreur classique enregistrée.",
      created: "Erreur classique créée.",
      invalid: "Vérifiez le titre (300 caractères au plus), l'étape et l'ordre.",
      invalidCode: "Code invalide : lettres minuscules, chiffres et soulignés, 2 à 60.",
      codeTaken: "Ce code est déjà utilisé.",
      notFound: "Erreur classique introuvable.",
      history: "Historique ({count})",
      changedAt: "Avant le {date}",
    },
  },
};

export default strategyFr;
