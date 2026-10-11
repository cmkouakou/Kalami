/**
 * =============================================================
 *  Fichier    : fr-strategy.ts
 *  Projet     : Kalami Stratégie
 *  Description: Textes français de l'assistant stratégie (accueil, études, profil, carte
 *               des étapes, administration des crédits). Rattachés à fr.ts sous « strategy ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
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
