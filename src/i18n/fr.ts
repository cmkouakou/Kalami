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
      intro: "Saisissez votre adresse : nous vous enverrons un lien pour choisir un nouveau mot de passe.",
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
