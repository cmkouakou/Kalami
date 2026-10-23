# Recette v1.0 — Kalami

Auteur : Claude Marcel · Version : v0.13.8 · Date : 2026-10-22
Périmètre : critères d'acceptation (cahier des charges §8) et exigences légales et de
sécurité (§6) de la plateforme de lecture, avant la mise en production v1.0.0 (Sprint 11b).

Chaque point renvoie au test automatique qui le prouve (`npm test`), puis à l'essai réel à
faire sur le site en ligne. Les tests `tests/integration/*-rls` tournent sur la base de
développement Supabase ; les tests `tests/unit` n'ont besoin d'aucun service.

Légende : ✅ prouvé par un test automatique · 👤 essai réel à faire par Claude Marcel ·
⚠️ limite connue.

## 1. Critères d'acceptation (§8)

| # | Critère | Preuve automatique | Essai réel |
|---|---------|--------------------|------------|
| 1 | Un visiteur lit le sommaire et le chapitre 1 sans compte ; la page suivante affiche l'écran d'achat ; l'API du chapitre 2 répond 403 | ✅ `unit/chapter-route` : « refuse le chapitre 2 sans droit de lecture (403, aucun contenu) », « sert le chapitre 1 en extrait, sans cache », « coupe le dernier chapitre de l'extrait » · ✅ `unit/content-access` : decideAccess · ✅ `unit/reader` : « indique les chapitres lisibles selon l'accès » · ✅ `integration/content-rls` : « interdit la lecture des chapitres aux visiteurs », « publie le sommaire sans contenu, avec le chapitre 1 en extrait » | 👤 Fenêtre privée : ouvrir un livre, lire le chapitre 1, tourner la page → écran d'achat |
| 2 | Paiement par carte et Mobile Money de test : le livre est débloqué en moins de 10 s après le webhook | ✅ `unit/payments` : signature, « confie une session Kalami à stripe_process_event », « n'accorde rien pour une session terminée mais non payée » · ✅ `integration/orders-rls` : « livre le livre, le PDF et l'étude offerte au paiement confirmé » (accordé dans la même transaction que le webhook) · ✅ `integration/mobile-money-rls` et `unit/mobile-money` : « suit la commande de la déclaration à la décision » · La page de remerciement se recharge toutes les 2 s (`order-status-poller`) | 👤 Achat par carte de test Stripe (4242…) en production, chronométré · 👤 Achat Mobile Money, déclaration puis validation dans l'administration |
| 3 | Le signet est retrouvé sur un second appareil | ✅ `integration/reader-rls` : « enregistre et met à jour la position du lecteur », « réserve les signets à leur propriétaire » · ✅ `unit/position-route` : « enregistre la position du lecteur (204…) » · ✅ `unit/reader` : « reprend la position la plus récente entre le serveur et l'appareil » | 👤 Lire et poser un signet sur l'ordinateur, rouvrir le livre sur le téléphone |
| 4 | Un surlignage reste ancré après un changement de taille de police | ✅ `unit/annotations` : « donne le même passage avant et après un changement de police » (ancrage par bloc et décalage, indépendant de la pagination) · ✅ `integration/annotations-rls` | 👤 Surligner, passer la police au maximum, vérifier le passage |
| 5 | Ctrl+C, clic droit et impression n'extraient pas le texte de la liseuse | ✅ `unit/reader-protection` (v0.13.8) : clic droit, glisser, copier/couper, Ctrl+C/A/P/S/U bloqués ; seule la référence à citer est copiable ; sélection trop longue annulée ; impression masquée par `@media print` | 👤 Essayer les trois sur ordinateur · ⚠️ dissuasif seulement : capture d'écran et outils de développement restent possibles (d'où le filigrane) |
| 6 | Le PDF acheté porte nom, courriel et numéro de commande sur chaque page ; le lien expire | ✅ `unit/pdf` : « imprime l'acheteur en filigrane, en page de titre et en pied de page », « n'intègre aucune ressource externe » · ✅ `integration/pdf-rls` : « consomme 3 téléchargements puis refuse, et refuse un fichier expiré », droit visible par son seul titulaire | 👤 Télécharger le PDF d'un achat, vérifier une page au hasard ; réessayer le lien après expiration |
| 7 | Un auteur dépose un DOCX, le prévisualise, le soumet ; l'administrateur valide ; le livre apparaît au catalogue | ✅ `unit/content-convert`, `unit/content-docx-layout` : conversion DOCX · ✅ `unit/author` : « sert la version en attente en aperçu, à l'équipe seulement », parseReview · ✅ `integration/author-rls` : brouillon jamais publié directement, contrat exigé, fiche verrouillée une fois soumise, « réserve la validation d'une soumission à l'administrateur (aal2) » (v0.13.8) · ✅ `integration/catalog-rls` : « montre aux visiteurs les livres publiés, jamais les brouillons » | 👤 Parcours complet avec un compte auteur de test, validation avec le compte administrateur (MFA) · ⚠️ la validation elle-même n'est pas automatisée : elle exige une session administrateur aal2 (code TOTP) |
| 8 | Chaque vente produit des écritures au grand livre cohérentes avec la commission | ✅ `integration/ledger-rls` : « pose une écriture équilibrée au paiement, avec la part de l'auteur », « passe une écriture inverse au remboursement » · ✅ `unit/ledger` : frais et conversions de devise, points de base | 👤 Après l'achat de test du point 2 : vérifier la vente dans l'espace auteur et l'administration |

## 2. Exigences légales et de sécurité (§6)

| Exigence | Preuve automatique | Essai réel |
|----------|--------------------|------------|
| Politique de confidentialité Loi 25 / RGPD, bannière de consentement et registre des consentements | ✅ `unit/legal` : témoin de consentement, export des données personnelles · ✅ `integration/legal-rls` : choix enregistré par le serveur, « registre non modifiable directement », demande de suppression idempotente | 👤 Bannière au premier passage, export et demande de suppression depuis le compte |
| Pages légales modifiables par l'administrateur | ✅ `integration/legal-rls` : « textes lisibles par un visiteur, non modifiables », « publication refusée à un non-administrateur » | 👤 Relire et publier les textes définitifs (conditions, vente, confidentialité) |
| RLS stricte | ✅ Les 32 fichiers `integration/*-rls` (profils, catalogue, contenu, commandes, PDF, auteurs, grand livre, versements, Stratégie…) · ✅ `integration/rls` : « refuse is_admin() à un administrateur sans MFA (aal1) » · Audit : `docs/SECURITE.md` §2 | — |
| Signature des webhooks et idempotence des paiements | ✅ `unit/payments` : signature valide, secret ou corps modifié refusé, rejeu de plus de 5 min refusé · ✅ `integration/orders-rls` : « ne traite un événement qu'une fois et ne livre jamais deux fois » · ✅ `integration/security-rls` : remboursement unique même si l'événement est rejoué | 👤 Rejouer un événement depuis le tableau de bord Stripe |
| Aucune donnée de carte sur nos serveurs (Stripe Checkout) | ✅ `unit/payments` : « envoie le montant de la base, la devise et la marque Kalami » (paiement sur la page Stripe) · CSP sans formulaire de carte (`unit/security`) | — |
| En-têtes de sécurité, CSRF, limitation du débit, fichiers déposés | ✅ `unit/security` (CSP, HSTS, CSRF, signature des fichiers, cron, débit) · ✅ `integration/security-rls` | 👤 Vérifier la CSP connecté (console du navigateur sans erreur) |

## 3. Bilan

- Les 8 critères et les exigences du §6 sont couverts par des tests automatiques, à deux
  réserves près : la validation administrateur (point 7, MFA) et le délai réel de 10 s
  (point 2, dépend de Stripe et du réseau). Ces deux points passent par l'essai réel.
- La recette est prononcée quand `npm test` passe en entier et que les essais 👤 sont
  cochés sur le site en ligne (Sprint 11b, étape 3), avant la version v1.0.0.
