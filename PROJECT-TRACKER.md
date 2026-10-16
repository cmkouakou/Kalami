# 📊 Suivi — Kalami (plateforme de lecture)
Version actuelle : v0.9.1 · Stratégie v0.11.3 | Statut : 🟡 En cours (projet 1 en pause ; Stratégie S0-S10a et forfaits du coach livrés)

## 💰 Coûts cumulés
| Session | Date | Travaux | Tokens est. | Coût |
|---------|------|---------|-------------|------|
| #1 | 2026-10-06 | Analyse des cahiers, plan, découpage en sprints, Sprint 0 | ~60 000 | ~0.36 $ |
| #2 | 2026-10-06 | Sprint 1 : authentification, profils, MFA admin, RLS | ~90 000 | ~0.54 $ |
| #3 | 2026-10-07 | Sprint 2 : catalogue, recherche, devises, administration | ~180 000 | ~1.08 $ |
| #4 | 2026-10-08 | Sprint 3 : conversion DOCX/EPUB, extrait, API chapitres, droits | ~200 000 | ~1.20 $ |
| #5 | 2026-10-09 | Sprint 4 : liseuse, marque-page, signets, recherche, protection | ~250 000 | ~1.50 $ |
| #6 | 2026-10-09 | Sprint 4b : charte, composants, refonte des pages et de la liseuse | ~300 000 | ~1.80 $ |
| #7 | 2026-10-10 | Sprint 7 : surlignages, notes, citation, carte de partage | ~280 000 | ~1.68 $ |
| #8 | 2026-10-09 | Sprint 9 : espace auteur, contrat, aperçu, validation | ~320 000 | ~1.92 $ |
| #9 | 2026-10-09 | Sprint 8 : PDF filigrané, lien signé, 3 téléchargements, purge ; onglets + Google, filet de sécurité OAuth (v0.8.3) | ~260 000 | ~1.56 $ |
| #10 | 2026-10-11 | Stratégie S0+S1 : migration, profil, carte des 9 étapes, cascade, crédits, admin | ~300 000 | ~1.80 $ |
| #11 | 2026-10-11 | Stratégie S2 : gabarits PESTEL et cinq forces, sauvegarde auto, versions | ~280 000 | ~1.68 $ |
| #12 | 2026-10-11 | Stratégie S3 : chaîne de valeur, VRIO, parties prenantes, guide des étapes | ~260 000 | ~1.56 $ |
| #13 | 2026-10-11 | Stratégie v0.4.1 : textes du guide, modèle services, nouveaux minimums des étapes 3 et 4 | ~150 000 | ~0.90 $ |
| #14 | 2026-10-11 | Stratégie v0.4.2 : accès direct à l'application (connexion, inscription, en-tête propres) | ~120 000 | ~0.72 $ |
| #15 | 2026-10-13 | Stratégie S4a : coach IA (relecture, suggestions, plafond, débit, admin) | ~330 000 | ~1.98 $ |
| #16 | 2026-10-13 | Stratégie S4b : questions, score, administration des consignes et des règles, périmètre | ~340 000 | ~2.04 $ |
| #17 | 2026-10-13 | Stratégie S5a : recherche Web sourcée, sources, coût des recherches | ~300 000 | ~1.80 $ |
| #18 | 2026-10-14 | Stratégie S5b : pièces jointes du profil, analyse par le coach, préremplissage | ~320 000 | ~1.92 $ |
| #19 | 2026-10-14 | Stratégie S6a : synthèse SWOT, reprise des étapes 1 à 3, TOWS, enjeux | ~300 000 | ~1.80 $ |
| #20 | 2026-10-14 | Stratégie S6b : propositions du coach pour la synthèse, décisions groupées | ~250 000 | ~1.50 $ |
| #21 | 2026-10-15 | Stratégie S7a : gabarits Cap (test du nom, SMART) et Choix (Porter, Ansoff, évaluation) | ~300 000 | ~1.80 $ |
| #22 | 2026-10-15 | Stratégie S7b : gabarit Action (chantiers, Gantt au mois, tableau de bord équilibré, risques) | ~280 000 | ~1.68 $ |
| #23 | 2026-10-15 | Stratégie S8a : plan stratégique (8 sections assemblées, traçabilité, édition, coach de rédaction) | ~320 000 | ~1.92 $ |
| #24 | 2026-10-15 | Stratégie S8b : export du plan en PDF et DOCX (Gantt, tableau de bord, traçabilité) | ~250 000 | ~1.50 $ |
| #25 | 2026-10-15 | Stratégie S9a : équipe, invitations par courriel (Resend), responsables d'étape, journal | ~330 000 | ~1.98 $ |
| #26 | 2026-10-15 | Stratégie S9b : commentaires par étape et par élément, mentions, notifications (cloche, page, courriel de mention) | ~300 000 | ~1.80 $ |
| #27 | 2026-10-16 | Stratégie S9c : présence Realtime, verrouillage doux, copie de secours en cas de conflit | ~280 000 | ~1.68 $ |
| #28 | 2026-10-16 | Stratégie S10a : mode enseignant (classes, inscription, distribution, suivi, coach par étape) | ~420 000 | ~2.52 $ |
| #29 | 2026-10-16 | Stratégie v0.11.1 : forfaits du coach (verrou par étude, jauge en %, consommation, recharges, admin des forfaits, mémoire des relectures) | ~600 000 | ~3.60 $ |
| #30 | 2026-10-16 | Sprint 11a-1 : textes légaux versionnés, bandeau des témoins, registre, export JSON, suppression du compte (30 jours) | ~350 000 | ~2.10 $ |
| #31 | 2026-10-16 | Sprint 11a-2 : PWA (deux applis installables, service worker en liste blanche, hors ligne), accessibilité (évitement, 404, audit axe) | ~300 000 | ~1.80 $ |
| **TOTAL** | | | **~8 620 000** | **~51.72 $** |

## ✅ Fonctionnalités
- [x] Sprint 0 — socle Next.js, configuration, redirections, CI, documentation
- [x] Sprint 0 — projet Supabase « Kalami » relié (whzwodxfymvfufzfhhkv)
- [x] Sprint 0 — projet Vercel importé, variables définies, premier déploiement réussi (2026-10-09)
- [x] Sprint 0 — domaine kalami-livres.com relié (DNS Porkbun → Vercel), site accessible
- [x] Sprint 0 — URLs de redirection Supabase configurées pour kalami-livres.com
- [x] Sprint 1 — code des comptes et rôles (v0.2.0)
- [x] Sprint 1 — migration appliquée sur Supabase + tests RLS (20/20)
- [x] Sprint 1 — compte administrateur promu, MFA TOTP vérifiée
- [x] Sprint 1 — URL du site et URLs de redirection (localhost)
- [x] Sprint 1 — fournisseur Google configuré (mode test ; publication après les pages légales du 11a)
- [x] Sprint 2 — catalogue public, devises, administration (v0.3.0)
- [ ] Sprint 2 — test de l'administration connecté avec MFA (par l'utilisateur)
- [ ] CI — variables GitHub NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY
- [x] Sprint 3 — contenu protégé : conversion, extrait, API 403/429, droits (v0.4.0)
- [x] Sprint 3 — migration `20261008120000_content.sql` appliquée, tests d'intégration 85/85
- [ ] Sprint 3 — essai réel : dépôt d'un DOCX et d'un EPUB en administration
- [x] Sprint 4 — liseuse : page tournée, défilement, réglages, signets, recherche (v0.5.0)
- [x] Sprint 4 — migration `20261009120000_reader.sql` appliquée, tests d'intégration 23/23
- [ ] Sprint 4 — essai réel de la liseuse (ordinateur, tablette, téléphone)
- [x] Sprint 4b — design : charte, composants, pages, liseuse, contrastes AA (v0.5.1)
- [ ] Sprint 4b — revue visuelle par l'utilisateur (ordinateur, téléphone, 3 thèmes)
- [x] Sprint 7 — annotations : surlignages, notes, citation, partage (v0.6.0)
- [x] Sprint 7 — migration `20261010120000_annotations.sql` appliquée, tests 203/203 (dont RLS 4/4)
- [ ] Sprint 7 — essai réel : sélection sur téléphone Android (appui long), partage d'image
- [x] Sprint 9 — espace auteur : contrat, dépôt, aperçu, validation, tableau de bord (v0.8.0)
- [x] Sprint 9 — migration `20261011120000_author_space.sql` appliquée, tests RLS 7/7
- [x] Sprint 9 — premier contrat publié (brouillon docs/contrat-auteur-brouillon.txt)
- [x] Sprint 9 — contrat finalisé et republié (relecture juridique conseillée)
- [x] Sprint 8 — PDF filigrané : Chromium, lien signé 24 h, 3 téléchargements, purge (v0.8.1)
- [ ] Sprint 8 — appliquer `20261012120000_pdf.sql`, définir `CRON_SECRET` dans Vercel
- [ ] Sprint 8 — essai réel : option PDF sur un livre, droit accordé, téléchargement
- [x] Sprint 11a-1 — textes légaux, témoins, export et suppression du compte (v0.9.0, code)
- [x] Sprint 11a-1 — migration 20261031120000 appliquée, historique réparé, tests RLS legal-rls (8/8)
- [x] Sprint 11a-2 — PWA et accessibilité (v0.9.1), unitaires 511/511, axe 0 violation
- [ ] Paiements 5, 6, 10 et 11b — voir [docs/SPRINTS.md](docs/SPRINTS.md)

## 🧭 Kalami Stratégie (projet 2) — voir [docs/SPRINTS-strategie.md](docs/SPRINTS-strategie.md)
- [x] S0+S1 — fondations, profil, carte des 9 étapes, cascade, crédits admin (Stratégie v0.2.0)
- [x] S0+S1 — migration `20261013120000_strategy_core.sql` appliquée, tests RLS 12/12
- [ ] S0+S1 — s'accorder un crédit dans /admin/strategie et parcourir une étude de test
- [x] S2 — gabarits PESTEL et cinq forces, sauvegarde auto, versions (Stratégie v0.3.0)
- [x] S2 — migration `20261014120000_strategy_templates.sql` appliquée, tests RLS gabarits 12/12
- [x] S3 — chaîne de valeur, VRIO, parties prenantes, guide des étapes (Stratégie v0.4.0)
- [x] S3 — migration `20261015120000_strategy_guides.sql` appliquée, tests 332/332
- [x] S3 — explications, exemples Infosystem et chapitres chargés par migration (Stratégie v0.4.1)
- [x] Modèle « services » de la chaîne de valeur (liste de l'auteur) et minimums 3-4 confirmés
- [x] v0.4.1 — migration `20261016120000_strategy_guides_content.sql` appliquée, tests 342/342, MVP S0-S3 testé en local
- [x] v0.4.2 — accès direct : /strategie a ses pages de connexion, son en-tête, ses redirections
- [x] S4a — coach IA : relecture, suggestions, plafond, débit, admin (Stratégie v0.5.0), tests 362/362
- [x] S4a — migration `20261017120000_strategy_coach.sql` appliquée le 2026-10-13 (RLS coach 7/7)
- [ ] S4a — relire la consigne de relecture v1 (rédigée par Claude, en vigueur dès la migration) et compléter les explications « selon le livre » des 10 erreurs classiques
- [x] S4a — prix d'Opus 5.5 (4 $ / 20 $ par million de jetons) vérifiés dans la documentation officielle
- [x] S4b — questions d'approfondissement, score, administration des consignes et des règles, périmètre (Stratégie v0.5.1)
- [x] S4b — migration `20261018120000_strategy_coach_admin.sql` appliquée le 2026-10-13, tests 384/384
- [ ] S4b — relire puis publier les brouillons relecture v2, questions v1 et évaluation v1 dans /admin/strategie/coach/consignes
- [x] S5a — recherche Web sourcée, bouton « Ajouter », sources conservées (Stratégie v0.6.0) ; prix des recherches vérifié (10 $ les 1 000)
- [x] S5a — migration `20261019120000_strategy_coach_research.sql` appliquée le 2026-10-13, intégration coach 13/13
- [x] S5a — consigne research v1 publiée
- [x] S5b — pièces jointes du profil, résumé et préremplissage (Stratégie v0.6.1)
- [x] S5b — migration `20261020120000_strategy_attachments.sql` appliquée le 2026-10-14 (éditeur SQL, historique réparé), intégration pièces jointes 6/6, coach 13/13
- [ ] S5b — consigne extract v1 à relire et publier
- [x] S6a — synthèse : SWOT avec reprise des étapes 1 à 3, TOWS, 2 ou 3 enjeux (Stratégie v0.7.0), unitaires 343/343
- [x] S6a — migration `20261021120000_strategy_synthesis.sql` appliquée le 2026-10-14 (éditeur SQL, historique réparé), intégration synthèse 8/8, guides 15/15
- [x] S6b — préremplissage par le coach (SWOT, pistes TOWS, enjeux), contexte des étapes 1 à 4 (Stratégie v0.7.1), unitaires 359/359
- [ ] S6b — appliquer `20261022120000_strategy_coach_synthesis.sql`, puis lancer l'intégration synthèse du coach (4 tests)
- [ ] S6b — consigne synthesize v1 à relire et publier
- [x] S7a — Cap (vision et test du nom, mission, valeurs, objectifs SMART) et Choix (Porter, Ansoff, évaluation, énoncé, renoncements) (Stratégie v0.8.0)
- [x] S7a — migration `20261023120000_strategy_direction_choice.sql` appliquée le 2026-10-15 (éditeur SQL ; `repair --status applied 20261023120000` avant un push CLI), intégration cap et choix 15/15
- [x] S7b — Action : chantiers et phases en Gantt au mois, tableau de bord équilibré (4 perspectives), risques (Stratégie v0.8.1)
- [x] S7b — migration `20261024120000_strategy_action.sql` appliquée le 2026-10-15 (éditeur SQL ; `repair --status applied 20261024120000` avant un push CLI), intégration action 10/10
- [x] S8a — plan stratégique : 8 sections assemblées sans IA, annexe de traçabilité, édition, régénération, coach par section (Stratégie v0.9.0), unitaires 407/407
- [x] S8a — migration `20261025120000_strategy_plan.sql` appliquée (2026-10-15), intégration du plan 5/5
- [x] S8a — consigne plan v1 publiée (2026-10-15)
- [x] S8b — export du plan en PDF et DOCX, Gantt et tableau de bord en annexe, pour tous les membres (Stratégie v0.9.1), unitaires 417/417
- [x] S9a — équipe : invitations par lien et courriel (Resend), rôles, départ, responsables d'étape, journal d'activité (Stratégie v0.10.0), unitaires 432/432
- [x] S9a — migration `20261026120000_strategy_team.sql` appliquée (2026-10-15), intégration équipe 10/10
- [x] S9b — commentaires (étape et élément), mentions, notifications : cloche, page, courriel de mention (Stratégie v0.10.1), unitaires 451/451
- [x] S9b — migration `20261027120000_strategy_comments.sql` appliquée (2026-10-16), historique réparé, intégration commentaires 11/11
- [x] S9c — présence et verrouillage doux (Realtime), copie de secours en cas de conflit (Stratégie v0.10.2), unitaires 462/462
- [x] S9c — migration `20261028120000_strategy_realtime.sql` appliquée (2026-10-16), historique réparé, intégration présence 6/6
- [x] S10a — mode enseignant : statut admin, classes, lien et invitations, distribution par groupe, suivi, coach coupable par étape (Stratégie v0.11.0), unitaires 482/482
- [x] S10a — migration `20261029120000_strategy_classes.sql` appliquée (2026-10-16, éditeur SQL, historique réparé), intégration classes 11/11, coach 7/7, équipe 10/10
- [x] v0.11.1 — forfaits du coach : verrou par étude, jauge en %, page de consommation, forfaits « Paiement bientôt », admin des forfaits, mémoire des relectures ; unitaires 485/485, build OK
- [x] v0.11.1 — migration `20261030120000_strategy_coach_packs.sql` appliquée (2026-10-16, éditeur SQL, historique réparé), intégration coach 9/9, classes 11/11, pièces jointes 6/6, plan 5/5, synthèse 4/4, recherche 3/3
- [x] v0.11.2 — diagnostic des courriels d'invitation (raison du refus de Resend dans les journaux Vercel, message distinct), unitaires 489/489
- [x] v0.11.3 — export PDF réparé (binaire Chromium inclus dans la fonction Vercel), liens étape précédente / suivante ; unitaires 511/511, build OK
- [ ] S10b — cas Ajinomoto, Infosystem et corrigé (fichiers de l'auteur à fournir)
- [ ] S12 — limiter le débit des exports du plan (aucun limiteur générique sans migration)
- [ ] Publier « La stratégie d'entreprise » pour que « Lire le chapitre » apparaisse
