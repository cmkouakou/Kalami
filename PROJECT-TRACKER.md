# 📊 Suivi — Kalami (plateforme de lecture)
Version actuelle : v0.4.0 | Statut : 🟡 En cours (Sprint 3 terminé, migration appliquée)

## 💰 Coûts cumulés
| Session | Date | Travaux | Tokens est. | Coût |
|---------|------|---------|-------------|------|
| #1 | 2026-10-06 | Analyse des cahiers, plan, découpage en sprints, Sprint 0 | ~60 000 | ~0.36 $ |
| #2 | 2026-10-06 | Sprint 1 : authentification, profils, MFA admin, RLS | ~90 000 | ~0.54 $ |
| #3 | 2026-10-07 | Sprint 2 : catalogue, recherche, devises, administration | ~180 000 | ~1.08 $ |
| #4 | 2026-10-08 | Sprint 3 : conversion DOCX/EPUB, extrait, API chapitres, droits | ~200 000 | ~1.20 $ |
| **TOTAL** | | | **~530 000** | **~3.18 $** |

## ✅ Fonctionnalités
- [x] Sprint 0 — socle Next.js, configuration, redirections, CI, documentation
- [x] Sprint 0 — projet Supabase « Kalami » relié (whzwodxfymvfufzfhhkv)
- [ ] Sprint 0 — import Vercel + variables d'environnement (par l'utilisateur)
- [x] Sprint 1 — code des comptes et rôles (v0.2.0)
- [x] Sprint 1 — migration appliquée sur Supabase + tests RLS (20/20)
- [x] Sprint 1 — compte administrateur promu, MFA TOTP vérifiée
- [x] Sprint 1 — URL du site et URLs de redirection (localhost)
- [ ] Sprint 1 — fournisseur Google (client OAuth à créer)
- [x] Sprint 2 — catalogue public, devises, administration (v0.3.0)
- [ ] Sprint 2 — test de l'administration connecté avec MFA (par l'utilisateur)
- [ ] CI — variables GitHub NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY
- [x] Sprint 3 — contenu protégé : conversion, extrait, API 403/429, droits (v0.4.0)
- [x] Sprint 3 — migration `20261008120000_content.sql` appliquée, tests d'intégration 85/85
- [ ] Sprint 3 — essai réel : dépôt d'un DOCX et d'un EPUB en administration
- [ ] Sprints 4 à 11 — voir [docs/SPRINTS.md](docs/SPRINTS.md)
