# Découpage en sprints — Kalami Stratégie (projet 2)

Assistant d'analyse stratégique sous `/strategie`, mêmes comptes, même Supabase, même déploiement
que la plateforme de lecture ([cahier](cahiers/CAHIER_DES_CHARGES_assistant_strategie.md)).
Démarré le 2026-10-11 ; le projet 1 est en pause (reste : 11a, 5, 6, 10, 11b).
S0 et S1 ont été livrés ensemble (Stratégie v0.2.0, 2026-10-11) ; S2 livré en Stratégie v0.3.0 (2026-10-11) ; S3 livré en Stratégie v0.4.0 (2026-10-11) ; S4a (coach : relecture) livré en Stratégie v0.5.0 (2026-10-13) ; S4b (questions, score, administration du coach) livré en Stratégie v0.5.1 (2026-10-13) ; S5a (recherche Web sourcée) livré en Stratégie v0.6.0 (2026-10-13) ; S5b (pièces jointes du profil) livré en Stratégie v0.6.1 (2026-10-14) ; S6a (synthèse SWOT, TOWS, enjeux) livré en Stratégie v0.7.0 (2026-10-14) ; S6b (propositions du coach pour la synthèse) livré en Stratégie v0.7.1 (2026-10-14) ; S7a (Cap et Choix) livré en Stratégie v0.8.0 (2026-10-15) ; S7b (Action) livré en Stratégie v0.8.1 (2026-10-15) ; S8a (plan stratégique : génération, édition, traçabilité) livré en Stratégie v0.9.0 (2026-10-15) ; S8b (export PDF et DOCX) livré en Stratégie v0.9.1 (2026-10-15).

Version propre au module (« Stratégie vX.Y.Z »), indépendante de la version de l'application.
Jusqu'au S11, les études sont ouvertes par des **crédits d'étude accordés par l'administrateur**.

| Sprint | Contenu | Version | Statut |
|---|---|---|---|
| S0 | Fondations : espace `/strategie`, accueil, tables de base, RLS, crédits d'étude, création d'une étude | v0.1.0 | ✅ |
| S1 | Profil de l'entreprise, carte des 9 étapes, dépendances, statuts, validation, invalidation en cascade | v0.2.0 | ✅ |
| S2 | Gabarits 1-2 : PESTEL (impact-incertitude, scénarios 2×2), cinq forces et comparaison ; sauvegarde auto, versions | v0.3.0 | ✅ |
| S3 | Gabarits 3-4 : chaîne de valeur (Porter ou services), VRIO, parties prenantes ; explications, exemple Infosystem, lien liseuse | v0.4.0 → v0.4.2 | ✅ |
| S4a | Coach IA : relecture, sorties JSON (Zod), suggestions, erreurs classiques ; consommation, plafond, débit, réglages admin | v0.5.0 | ✅ |
| S4b | Coach IA : questions d'approfondissement, score ; administration des consignes et des règles avec historique | v0.5.1 | ✅ |
| S5a | Recherche Web sourcée (PESTEL, cinq forces), sources conservées, coût des recherches | v0.6.0 | ✅ |
| S5b | Pièces jointes du profil, résumé et préremplissage | v0.6.1 | ✅ |
| S6a | Synthèse : SWOT avec reprise des étapes 1 à 3 (cases à cocher), TOWS, 2 ou 3 enjeux | v0.7.0 | ✅ |
| S6b | Synthèse : préremplissage par le coach (SWOT, pistes TOWS, enjeux), contexte des étapes 1 à 4 | v0.7.1 | ✅ |
| S7a | Gabarits 6-7 : Cap (vision et test du remplacement du nom, mission, valeurs avec geste, objectifs SMART liés aux enjeux), Choix (Porter, Ansoff, évaluation oui / partiel / non, énoncé, renoncements) | v0.8.0 | ✅ |
| S7b | Gabarit 8 : Action (chantiers en Gantt au mois, tableau de bord équilibré en 4 perspectives) | v0.8.1 | ✅ |
| S8a | Plan stratégique : 8 sections assemblées depuis les étapes (sans IA), traçabilité, édition, régénération par section, rédaction par le coach avec sources vérifiées | v0.9.0 | ✅ |
| S8b | Plan stratégique : export PDF et DOCX | v0.9.1 | ✅ |
| S9a | Collaboration : invitations (lien et courriel Resend), rôles, départ, responsables d'étape, journal d'activité | v0.10.0 | ✅ |
| S9b | Collaboration : commentaires (étape et élément), mentions, notifications (cloche, page, courriel de mention) | v0.10.1 | ✅ |
| S9c | Collaboration : présence et verrouillage doux (Realtime) | v0.10.2 | ⬜ |
| S10 | Mode enseignant et cas d'entraînement (Ajinomoto, Infosystem, corrigé) | v0.11.0 | ⬜ |
| S11 | Paiement de l'étude (après les sprints 5-6 du projet 1) : prix par région, réduction livre, lots, recharges d'IA | v0.12.0 | ⬜ |
| S12 | Critères d'acceptation §12, confidentialité, audit, accessibilité, mise en production ; clé API par fédération d'identité (WIF) au lieu d'une clé statique | v1.0.0 | ⬜ |

S4 et S10 pourront être coupés en deux (a/b) s'ils dépassent le quota d'une session.

## À fournir par l'auteur (rien n'est inventé)
- Clé API Anthropic (S4), à coller soi-même dans `.env.local` et Vercel (type « Secret »).
- Explications des 9 outils, erreurs classiques du livre, exemple Infosystem (S3-S4).
- Cas Ajinomoto et ses annexes (S10). Prix : étude, lot, recharge (S11).

## Tests critiques (cahier §11.3)
- S1 : dépendances entre étapes, invalidation en cascade, permissions par rôle.
- S4 : plafonds d'IA, validation des sorties JSON du coach.
- S9 : deux membres éditent la même étude sans perte de données.
- Tous : politiques RLS testées.
