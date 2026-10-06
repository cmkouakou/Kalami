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
};

export default fr;

/** Structure attendue de tout dictionnaire de langue. */
export type Dictionary = typeof fr;
