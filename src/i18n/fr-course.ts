/**
 * =============================================================
 *  Fichier    : fr-course.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Textes français du cours de stratégie : accueil, programme, page de
 *               leçon, encadrés, exercices, annotations, lecture à voix haute et
 *               messages d'erreur. Lus via getCourseDictionary() (course.ts).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
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
      "l'accès. L'inscription en ligne ouvrira prochainement.",
    compte: "Courriel de votre compte : {email}",
  },

  lecon: {
    retour: "Programme du cours",
    moduleLecon: "Module {m} · Leçon {l}",
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
};

export default courseFr;
