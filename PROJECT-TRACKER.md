# 📊 Suivi — Kalami (plateforme de lecture)
Version actuelle : v0.8.2 | Statut : 🟡 En cours (Sprint 8 terminé : PDF filigrané)

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
| #9 | 2026-10-09 | Sprint 8 : PDF filigrané, lien signé, 3 téléchargements, purge | ~260 000 | ~1.56 $ |
| **TOTAL** | | | **~1 940 000** | **~11.64 $** |

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
- [ ] Sprint 11a, puis paiements 5, 6, 10 et 11b — voir [docs/SPRINTS.md](docs/SPRINTS.md)
