# Découpage en sprints — Kalami, plateforme de lecture (projet 1)

Le projet 2 (assistant stratégie, [cahier](cahiers/CAHIER_DES_CHARGES_assistant_strategie.md))
démarre après la v1.0.0 de la plateforme de lecture.

| Sprint | Contenu | Version | Statut |
|---|---|---|---|
| 0 | Fondations : Next.js, Supabase, config, redirections 301, CI, docs | v0.1.0 | 🟡 en cours |
| 1 | Comptes et rôles : courriel, Google, profils, MFA admin, RLS | v0.2.0 | ✅ (Google à configurer) |
| 2 | Catalogue : catégories, accueil, fiches, auteurs, recherche, prix par devise | v0.3.0 | ✅ |
| 3 | Contenu protégé : conversion DOCX/EPUB, extrait, API chapitres (403), débit | v0.4.0 | ✅ |
| 4 | Liseuse : page tournée, défilement, réglages, marque-page, protection, filigrane | v0.5.0 | ✅ |
| 4b | Design : identité visuelle (couleurs, typographie, logo), composants, refonte des pages, contrastes | v0.5.1 | ✅ |
| 7 | Annotations, citation (APA/MLA/Chicago), carte de partage | v0.6.0 | ✅ |
| 8 | PDF filigrané : génération Chromium, lien signé 24 h, 3 téléchargements | v0.7.0 | ⬜ |
| 9 | Espace auteur : contrat, dépôt, aperçu, validation admin, tableau de bord | v0.8.0 | ⬜ |
| 11a | PWA, Loi 25 / RGPD, accessibilité | v0.9.0 | ⬜ |
| 5 | Paiement carte : commandes, Stripe + Stripe Tax, webhook, droits, promos, reçus | v0.10.0 | ⬜ |
| 6 | Mobile Money manuel : numéros marchands, saisie de transaction, validation admin | v0.11.0 | ⬜ |
| 10 | Grand livre, remboursements, versements, administration, audit | v0.12.0 | ⬜ |
| 11b | Critères d'acceptation, mise en production | v1.0.0 | ⬜ |

Ordre revu le 2026-10-08 : les paiements (5, 6) passent en dernier. Le grand livre (10) en dépend
et les suit ; la mise en production (11b) clôt le projet. D'ici là, les droits de lecture sont
accordés par l'administrateur.

## Tests critiques (cahier §7.3)
- Sprint 3 : l'API du chapitre 2 renvoie 403 sans droit d'accès.
- Sprint 4 : la recherche ne renvoie rien hors des parties autorisées.
- Sprint 5 : le droit de lecture n'est accordé que par le webhook signé, une seule fois par événement.
- Sprint 6 : le droit n'est accordé que par la validation d'un administrateur.
- Sprint 7 : un surlignage reste ancré après changement de police.
- Sprint 10 : écritures du grand livre cohérentes avec la commission.
- Tous : politiques RLS testées.
