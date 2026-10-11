/**
 * =============================================================
 *  Fichier    : fr-strategy.ts
 *  Projet     : Kalami Stratégie
 *  Description: Textes français de l'assistant stratégie (accueil, études, profil, carte
 *               des étapes, gabarits PESTEL et cinq forces, administration des crédits).
 *               Rattachés à fr.ts sous « strategy ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 * =============================================================
 */

const strategyFr = {
  name: "Stratégie",
  title: "Kalami Stratégie",
  description:
    "Analysez la stratégie d'une entreprise réelle pas à pas, avec la démarche du livre " +
    "« La stratégie d'entreprise : analyse et mise en œuvre par l'exemple ».",
  nav: {
    home: "Présentation",
    studies: "Mes études",
  },

  // ==================== ACCUEIL ====================
  landing: {
    kicker: "Kalami Stratégie",
    title: "De l'analyse au plan stratégique, une étape à la fois.",
    subtitle:
      "Seul ou en équipe, appliquez à votre entreprise la démarche du livre : " +
      "environnement, concurrence, ressources, parties prenantes, puis synthèse, cap, " +
      "choix et feuille de route.",
    start: "Commencer une étude",
    signIn: "Se connecter pour commencer",
    phasesTitle: "Une démarche en quatre temps",
    coachNote:
      "Un coach vous relira, posera des questions et signalera les erreurs classiques. " +
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
    companyName: "Nom de l'entreprise",
    question: "Votre question stratégique",
    questionHint: "Exemples : « Faut-il croître ? », « Comment préparer la relève ? »",
    submit: "Créer l'étude",
  },

  // ==================== PROFIL ====================
  profile: {
    title: "Profil de l'entreprise",
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
      companyName: "Nom de l'entreprise",
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
    onePerLine: "Une entrée par ligne.",
    teamRole: "Rôle ou équipe",
    teamHeadcount: "Effectif",
    addTeam: "Ajouter une équipe",
    removeTeam: "Retirer cette équipe",
    invalid: "Vérifiez les champs suivants : {fields}.",
    save: "Enregistrer le profil",
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
    generate: "Générer la stratégie",
    generateLater: "Disponible quand les 8 étapes seront validées",
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
    planSoon: "La génération du plan stratégique arrive dans une prochaine version.",
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
    plan_step: "Le plan stratégique se valide en le générant.",
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
    studiesTitle: "Études",
    noStudies: "Aucune étude pour l'instant.",
    columns: {
      company: "Entreprise",
      owner: "Propriétaire",
      created: "Créée le",
      updated: "Modifiée le",
      progress: "Étapes validées",
    },
  },
};

export default strategyFr;
