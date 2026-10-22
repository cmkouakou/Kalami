# Rapport de sécurité — Kalami

Auteur : Claude Marcel · Version : v0.13.1 · Date : 2026-10-22
Périmètre : plateforme de lecture et assistant Stratégie (Sprints 11s-1 et 11s-2, OWASP Top 10).

## 1. Synthèse

| Volet | Résultat | Version |
|-------|----------|---------|
| Dépendances (Next 16.4.2, `npm audit`) | 3 alertes modérées sans correctif (sprintf-js via mammoth, outil en ligne de commande seulement) | v0.13.0 |
| En-têtes HTTP et CSP | En ligne en production (CSP, HSTS 2 ans, X-Frame-Options DENY, nosniff, Referrer-Policy, COOP, Permissions-Policy) | v0.13.0 |
| CSRF | Proxy : mutation d'un autre site ou action serveur sans Origin → 403 | v0.13.0 |
| Limitation du débit | Connexion, inscription, liens, codes promo, exports, choix des témoins | v0.13.0, v0.13.1 |
| Fichiers déposés | Signature (premiers octets) contrôlée, fichier forgé supprimé | v0.13.0 |
| RLS et fonctions SECURITY DEFINER | 4 écarts mineurs corrigés (§2) | v0.13.1 |
| Secrets et journaux | Aucun écart (§3) | v0.13.1 |
| SSRF de l'export PDF | Protégé ; défense en profondeur ajoutée (§4) | v0.13.1 |
| Sondes en production | 8/8 conformes (§5) | v0.13.1 |

## 2. Base de données

Constats sur la base de développement (`whzwodxfymvfufzfhhkv`) le 2026-10-22 :

- Toutes les tables du schéma `public` ont la RLS. Six tables n'ont aucune politique et ne sont
  donc lisibles que par le rôle service : `chapters`, `content_access_log`, `notifications`,
  `rate_limit_hits`, `study_activity`, `study_comment_mentions` (voulu).
- Politiques ouvertes aux visiteurs : lecture seule du catalogue (`authors`, `books`,
  `book_prices`, `categories`), des textes légaux, des réglages publics et des étapes du
  référentiel Stratégie.
- Seaux de stockage : seul `covers` est public ; `manuscripts`, `payout-proofs`, `pdf-exports`
  et `study-attachments` sont privés.
- Toutes les fonctions SECURITY DEFINER fixent `search_path`. Celles ouvertes aux comptes
  vérifient l'appelant (`auth.uid()`, `is_admin`, `study_role`, `strategy_class_teacher`,
  `strategy_own_class`, `current_author_id`), sauf les écarts ci-dessous.

| Écart | Risque | Correctif (migration `20261112120000`) |
|-------|--------|----------------------------------------|
| `record_consent` appelable avec la clé publique, identifiant de visiteur au choix | Registre des consentements remplissable à volonté | Rôle service seulement ; compte passé par le serveur ; 30 choix par heure et par IP |
| `strategy_attachment_objects(étude)` sans contrôle | Nombre de pièces jointes de n'importe quelle étude | 0 pour un non-membre |
| `strategy_profile_complete`, `strategy_missing_prerequisites` | Avancement de n'importe quelle étude (identifiant à deviner) | Droit retiré aux comptes ; appelées par des fonctions SECURITY DEFINER |
| `handle_new_user`, `orders_set_mm_fee`, `orders_write_ledger` ouvertes à `anon` | Nul (fonctions de déclencheur non appelables directement) | Droit retiré par principe |

Fonctions volontairement ouvertes aux visiteurs : `author_deposit_allowed`, `authors_open`,
`get_book_toc` (sommaire sans contenu), `strategy_offer_list` (offres en vente).

## 3. Secrets et journaux

- `.env*` ignorés par git (sauf `.env.example`, sans valeur sensible). Aucune clé Stripe,
  Supabase, Anthropic ni jeton JWT dans les fichiers suivis ni dans l'historique.
- Variables publiques (`NEXT_PUBLIC_*`) : nom et adresse de l'application, adresse et clé
  publiable Supabase seulement.
- 17 `console.error` côté serveur : codes et messages d'erreur, identifiants d'événement ou de
  compte ; aucun secret, courriel ni jeton. Les courriels servant au débit sont hachés.

## 4. Export PDF (SSRF)

- Le HTML des chapitres passe par une liste blanche de balises ; seules les images intégrées
  (`data:image/webp|png|jpeg`) sont gardées ; les textes insérés sont échappés.
- Chromium bloque toute requête autre que `data:` (interception Puppeteer).
- v0.13.1 : JavaScript désactivé dans la page, car l'interception ne couvre pas les WebSockets.

## 5. Sondes en production (www.kalami-livres.com, 2026-10-22)

| Sonde | Attendu | Obtenu |
|-------|---------|--------|
| Webhook Stripe sans signature | 400 | 400 |
| Webhook Stripe, signature fausse | 400 | 400 |
| Paiement sans session | 401 | 401 |
| Paiement, POST d'un autre site | 403 | 403 |
| Tâche planifiée sans secret | 401 | 401 |
| `/admin` sans session | Connexion | 307 → `/connexion?suivant=/admin` |
| `/compte` sans session | Connexion | 307 → `/connexion?suivant=/compte` |
| Chapitre 2 d'un livre inexistant | 404 | 404 |

Les accès sans droit (IDOR, chapitres, recherche, annotations, commandes, versements, études)
sont couverts par les 32 suites d'intégration `tests/integration/*-rls.test.ts`.

## 6. Reste à faire

- Essai de la CSP dans le navigateur en production, avec une session : connexion Google,
  dépôts, présence en temps réel. Déjà vérifiés sans violation le 2026-10-22 (écouteur
  `securitypolicyviolation`) : accueil, fiche du livre, liseuse (polices, figures, pages
  tournées), bandeau des témoins (action serveur 200), préchargement des pages.
- Revoir ce rapport avant la mise en production (Sprint 11b).
