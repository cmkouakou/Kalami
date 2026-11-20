# Recette du lancement — Cours de stratégie

Auteur : Claude Marcel · Version : v0.39.1 · Date : 2026-11-20
Périmètre : parcours réel du cours sur le site en ligne (kalami-livres.com), avant de
l'annoncer. Chaque case se coche à la main. Prévoir environ 2 heures, plus 24 heures
d'attente pour un second essai d'examen (facultatif).

Comptes à préparer :
- **A** : votre compte administrateur (avec son code MFA) ;
- **B** : un compte de test neuf (une autre adresse courriel), qui achètera par carte ;
- **C** : un second compte de test, qui paiera par Mobile Money.

Légende : 🖥️ ordinateur · 📱 téléphone (en données mobiles, pas sur le réseau de
l'université) · ⚠️ point sensible.

---

## 0. Préparation (compte A)

- [ ] Migration `20261127120000_course_diplomas.sql` appliquée sur la base de production.
- [ ] Le site en ligne affiche la version v0.39.1 ou plus récente (déploiement terminé).
- [ ] `/admin/cours/prix` : prix en FCFA, euros et dollars canadiens saisis, livre associé
      choisi, interrupteur « en vente » activé.
- [ ] `/admin/cours/diplomes` : relire les réglages (seuils, poids de la note, mentions).
- [ ] `/admin/mobile-money` : au moins un opérateur actif avec son numéro marchand.

## 1. Visiteur sans compte (fenêtre privée 🖥️, puis 📱)

- [ ] Menu de Kalami Stratégie : le lien « Le cours » mène à `/strategie/cours`.
- [ ] L'accueil `/strategie` montre l'encart « Le cours de stratégie ».
- [ ] La page de vente affiche toutes ses sections : accroche, chiffres clés, ce que vous
      saurez faire, format, programme, offre, auteur, questions fréquentes.
- [ ] Le prix s'affiche dans la bonne devise et le bouton est « Se connecter pour acheter ».
- [ ] « Voir l'offre » descend jusqu'à l'offre ; les questions fréquentes s'ouvrent.
- [ ] Relire la phrase de l'auteur (à corriger dans `src/i18n/fr-course.ts` si besoin).
- [ ] « Lire la leçon 1.1 gratuitement » ouvre la leçon **sans demander de connexion**.
- [ ] Leçon 1.1 : texte complet, exercices fermés (« réservés aux inscrits »), encart
      « Voir l'offre » en haut et en bas.
- [ ] Sélectionner un passage : la barre propose de se connecter (rien n'est enregistré).
- [ ] Ouvrir la leçon 1.2 : la connexion est demandée.
- [ ] 📱 Mise en page sans défilement horizontal ; boutons faciles à toucher.

## 2. Partage et référencement

- [ ] Coller le lien `/strategie/cours` dans WhatsApp ou Facebook : l'image d'aperçu
      (titre, accroche, « 13 modules · 52 leçons courtes · 16 heures ») s'affiche.
- [ ] `https://kalami-livres.com/sitemap.xml` contient `/strategie/cours` et
      `/strategie/cours/m1/l1`.
- [ ] `https://kalami-livres.com/robots.txt` ferme `/strategie/cours/annotations`,
      `/strategie/cours/examen` et `/strategie/cours/diplome/`.
- [ ] Test des résultats enrichis de Google (search.google.com/test/rich-results) sur
      `/strategie/cours` : « Cours » et « FAQ » détectés, sans erreur.
- [ ] Search Console : demander l'indexation des deux adresses.

## 3. Achat par carte (compte B 🖥️)

- [ ] Créer le compte B depuis « Se connecter pour acheter » ; on revient sur le cours.
- [ ] Connecté sans inscription : la page de vente reste affichée, avec le bouton d'achat.
- [ ] La leçon 1.1 se lit et se surligne ; sa progression n'est pas enregistrée.
- [ ] Payer par carte. ⚠️ Avec une vraie carte, prévoir le remboursement dans Stripe
      ensuite (ou faire l'essai en mode test si l'environnement le permet).
- [ ] Annuler un premier paiement : le message « paiement annulé » s'affiche au retour.
- [ ] Après paiement : accès immédiat, `/strategie/cours` montre le tableau de bord.
- [ ] Le livre associé apparaît dans la bibliothèque du compte B.
- [ ] `/admin/commandes` (compte A) : la commande du cours figure, au bon montant.

## 4. Achat Mobile Money (compte C 📱)

- [ ] Choisir Mobile Money, payer en FCFA et déclarer le paiement.
- [ ] Avant validation : pas d'accès ; l'attente de 24 heures est annoncée.
- [ ] `/admin/paiements-mobile-money` (compte A) : le paiement est dans « À valider ».
- [ ] Le valider : le compte C reçoit l'accès et l'avis de décision.
- [ ] Refuser un second paiement de test : il passe dans « Refusés », sans accès.

## 5. Apprentissage (compte B)

- [ ] Leçon 1.1 complète cette fois : exercices ouverts, bouton « terminée ».
- [ ] Répondre à un exercice : la correction et la meilleure note s'affichent.
- [ ] Surligner, ajouter une note, citer et partager un passage.
- [ ] `/strategie/cours/annotations` : le passage y est ; le toucher ramène à la leçon.
- [ ] Marquer la leçon terminée : la progression du tableau de bord augmente.
- [ ] Rouvrir sur 📱 avec le même compte : surlignages et progression retrouvés.
- [ ] `/admin/cours/suivi` (compte A) : le compte B apparaît avec sa leçon et son temps.

## 6. Quiz, examen et diplôme (compte B)

⚠️ L'examen s'ouvre seulement quand les 13 quiz sont réussis : compter environ 1 h 30.

- [ ] Quiz du module 1 (dernière leçon du module) : échouer d'abord, le corrigé reste caché.
- [ ] Le réussir : le corrigé s'affiche.
- [ ] Réussir les 12 autres quiz ; l'examen s'ouvre (compteur 13 / 13).
- [ ] Passer l'examen et le réussir : la note finale et la mention s'affichent.
- [ ] `/strategie/cours/diplome` : le PDF se télécharge, nom et mention exacts.
- [ ] Le lien de vérification du diplôme s'ouvre en fenêtre privée (page publique).
- [ ] `/admin/cours/diplomes` : le diplôme figure ; corriger le nom imprimé fonctionne.

## 7. Nettoyage (compte A)

- [ ] Rembourser les achats réels de test (Stripe) et retirer l'accès des comptes B et C
      dans `/admin/cours/apprenants`, si vous ne voulez pas les garder.
- [ ] Noter ici tout défaut trouvé, avec la page et l'appareil :

| # | Page | Appareil | Défaut constaté |
|---|------|----------|-----------------|
|   |      |          |                 |
