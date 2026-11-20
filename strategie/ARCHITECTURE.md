# Architecture — Kalami Stratégie : le cours

Sprint 0 (cadrage), 2026-11-19. Proposition à valider avant tout code.

## Besoins retenus

1. Cours interactif sur Kalami : leçons, schémas, exercices, quiz, examen.
2. Outils d'apprentissage de la liseuse : surlignage, notes, lecture à voix haute.
3. **Cohorte de Côte d'Ivoire** : l'administrateur donne l'accès lui-même.
4. **Suivi par apprenant** : leçons terminées, en cours, pourcentage d'achèvement, temps de
   formation, dernière activité, résultats aux quiz.
5. **Vente au public** : prix Mobile Money (FCFA) et Stripe, fixés dans l'admin.
6. Lien avec Kalami Stratégie : chaque leçon renvoie à l'étape correspondante.

## Réutilisé tel quel

| Besoin | Brique existante |
|---|---|
| Contenu typé en TypeScript | `src/lib/powerbi/content.ts`, `inline.ts` (blocs, balisage) |
| Affichage des blocs, progression | `src/components/powerbi/` (lesson-blocks, progress-ring) |
| Surlignage, notes, lecture à voix haute | `src/components/reader/` (highlight-dom, note-dialog, use-read-aloud) |
| Commandes, Stripe, Mobile Money | `orders`, `order_items`, webhook Stripe, validation MM dans l'admin |
| Codes promo | `promo_check` |
| Mesure du temps | méthode de `reading_activity` (écarts plafonnés à 5 min) |

## Décisions de l'utilisateur (2026-11-19)

1. **Compte d'abord** : chaque apprenant crée son compte Kalami avant tout. L'admin donne
   l'accès en saisissant des courriels de comptes existants ; un courriel inconnu est signalé
   (« aucun compte : l'apprenant doit d'abord s'inscrire »). Pas d'invitation par courriel.
2. **Livre inclus pour la cohorte** : l'accès donné par l'admin accorde aussi le livre
   (droit `entitlements` de source `admin_grant`) ; le retrait de l'accès au cours ne retire
   pas le livre sans confirmation.
3. **Note et diplôme** : la note finale combine les quiz de module, les exercices notés et
   l'examen final (pondération réglable dans l'admin). Le diplôme s'ouvre quand tous les
   quiz sont réussis (seuil réglable, 70 % par défaut) et que l'examen est réussi. Il est
   généré en PDF (même chaîne Chromium que les PDF filigranés) avec le **nom de l'inscrit**,
   la note, la date et un numéro unique vérifiable sur une page publique
   `/strategie/cours/diplome/[numero]`. L'apprenant confirme l'orthographe de son nom une
   seule fois avant la génération ; ensuite seul l'admin peut la corriger.

## Code (dans `src/`, comme le reste du site)

```
src/lib/cours/              → programme (modules.ts), leçons (lessons/<module>/<leçon>.ts),
                              exercices (types et correction), progression
src/components/cours/       → lecteur de leçon, exercices, quiz, schémas SVG, barre latérale
src/app/strategie/cours/    → accueil du cours, /[module]/[lecon], /examen, /attestation
src/app/(site)/admin/(espace)/cours/
                            → apprenants et accès, cohortes, suivi, prix
src/app/api/cours/          → enregistrement de la progression, du temps, des réponses
```

Le dossier `strategie/` garde le travail préparatoire : programme, brouillons, sources des
schémas. Les textes extraits des sources (`sources-extraites/`) ne sont jamais versionnés.

## Base de données (une migration)

| Table | Rôle |
|---|---|
| `course_cohorts` | cohortes (nom, pays, dates, note) |
| `course_access` | droit d'accès : apprenant, source `purchase` ou `admin_grant`, cohorte, commande, accordé par, révoqué le |
| `course_lesson_progress` | par apprenant et leçon : commencée le, terminée le, secondes |
| `course_activity` | temps par jour (comme `reading_activity`) |
| `course_attempts` | réponses aux exercices, quiz et examen, note |
| `course_annotations` | surlignages et notes, ancrés par bloc et décalage |
| `course_settings` | prix FCFA et prix carte, leçons gratuites, livre associé, seuils de réussite |
| `course_diplomas` | diplôme délivré : numéro unique, nom imprimé, note finale, date, PDF |

- `order_items.kind` reçoit la valeur `course`. Le webhook Stripe et la validation Mobile
  Money accordent `course_access` comme ils accordent déjà un livre.
- RLS : chaque apprenant ne lit et n'écrit que sa progression ; l'admin lit tout.
- **Temps de formation** : battement toutes les 30 s seulement si l'onglet est visible et
  qu'il y a eu une action récente. Les écarts sont plafonnés, donc une page oubliée ouverte ne
  compte pas.

## Écrans d'administration : `/admin/cours`

- **Apprenants** : ajouter des courriels de comptes existants un par un ou en lot (collage
  d'une liste, rapport des courriels sans compte), choisir la cohorte, accorder le livre en
  même temps, retirer un accès.
- **Diplômes** : liste des diplômes délivrés, correction du nom, régénération du PDF.
- **Suivi** : un tableau par cohorte (apprenant, % d'achèvement, leçons terminées / en cours,
  temps total, dernière activité, moyenne aux quiz), tri et export CSV ; une fiche par
  apprenant avec le détail module par module.
- **Prix** : prix Mobile Money (FCFA), prix carte, leçons offertes en aperçu. Les codes promo
  existants s'appliquent.

## Sprints

| Sprint | Contenu | Disque D: |
|---|---|---|
| S0 | Cadrage : inventaire, programme, architecture (ce document) | oui (fait) |
| S1 | Lecteur de cours, exercices, progression, temps, surlignage et notes ; **leçon pilote** (Module 1, leçon 1) | non |
| S2 | Admin : accès, invitations, cohortes, suivi, prix ; achat Stripe et Mobile Money | non |
| S3 | Modules 1 et 2 | oui |
| S4 | Modules 3 et 4 | oui |
| S5 | Modules 5, 6 et 7 | oui |
| S5b | Calendrier de diffusion par cohorte (voir ci-dessous) — fait, v0.33.0 | non |
| S6 | Modules 8 et 9 — fait, v0.34.0 | oui |
| S7 | Modules 10, 11 et 12 | oui — fait, v0.35.0 |
| S8a | Module 13 : plan en une page, cas Ajinomoto, votre propre plan | oui — fait, v0.36.0 |
| S8b | Quiz de module, examen final, note finale, diplôme PDF, page de vérification | non |
| S8c | Page de vente, référencement | non |

Avec S1 et S2, la cohorte peut commencer dès la fin de S3 : les modules suivants s'ajoutent
sans interruption au fur et à mesure.

## S5b — Calendrier de diffusion par cohorte (livré en v0.33.0)

Demande de l'utilisateur, le 2026-11-20. Recevoir tout le cours d'un coup décourage les
apprenants. Comme un professeur avec sa classe, l'administrateur ouvre les modules ou les
leçons à des dates précises.

- **Calendrier par cohorte** : chaque module reçoit une date d'ouverture. Une leçon peut
  avoir sa propre date, qui remplace celle du module. Sans date, le contenu est ouvert.
- **Activation par cohorte** : la diffusion programmée s'active cohorte par cohorte. Les
  apprenants sans cohorte, et les cohortes non programmées, gardent l'accès complet. Les
  apprenants actuels ne perdent donc rien.
- **Lecture en avance** : option par cohorte qui ouvre la prochaine leçon en lecture
  seulement, avant sa date. Ses exercices restent fermés jusqu'à la date d'ouverture.
- **Côté apprenant** : le programme affiche les leçons à venir, verrouillées, avec la
  mention « disponible le … ». Le cours ne paraît plus tout entier d'un coup.
- **Contrôle côté serveur** : une leçon fermée ne s'affiche pas et ses exercices ne
  s'enregistrent pas, même si on tape son adresse directement. Masquer le lien ne
  suffit pas.
- **Admin** : dans la fiche de la cohorte (/admin/cours), un tableau des modules et des
  leçons avec un champ de date pour chacun. Un générateur propose un calendrier à partir
  d'une date de départ et d'un rythme (par exemple un module par semaine), qu'on ajuste
  ensuite à la main.
- **Fuseau** : on stocke un instant précis (timestamptz). L'ouverture se fait à minuit
  dans le fuseau de la cohorte, d'Abidjan ou de Montréal selon le cas.
- **Plus tard** : envoyer un courriel aux apprenants quand une leçon s'ouvre.
- **Migration** : une table du calendrier et des fonctions RPC d'administration, à faire
  appliquer par l'utilisateur.

## Points de vigilance

- **Vie privée** : le suivi du temps et des résultats doit être annoncé dans la politique de
  confidentialité et sur la page d'accueil du cours.
- **Droits** : textes, schémas et exercices sont originaux. Les cas d'entreprises réelles
  reposent sur des faits publics, vérifiés et datés.
- **Next.js** : la mise à jour de sécurité 16.4.2 → 16.4.6 est à faire avant S1.
