# Architecture et décisions — Kalami

Référence fonctionnelle : [cahier des charges de la plateforme de lecture](cahiers/CAHIER_DES_CHARGES_plateforme_lecture.md).

## Principes
- **Une seule application Next.js** pour la plateforme de lecture et, plus tard, l'assistant
  stratégie (`/strategie`) : mêmes comptes, même session, mêmes commandes et paiements.
- **Commandes génériques** : un article de commande a un type (`book`, `pdf`, puis `study`,
  `study_pack`, `ai_topup` pour le projet 2) afin de ne pas refaire le module de paiement.
- **RLS sur toutes les tables.** La clé secrète Supabase n'est utilisée que côté serveur.
- **Montants en entiers** (plus petite unité de la devise ; le XOF n'a pas de décimales).
- Code et noms de tables en anglais ; interface et commentaires en français.

## Décisions validées (2026-10-06)
| Sujet | Décision | Raison |
|---|---|---|
| Conversion DOCX | `mammoth` | `pandoc` indisponible sur Vercel |
| Conversion EPUB | `jszip` + nettoyage HTML | Extraction des chapitres sans binaire externe |
| Ancrage | Identifiant stable par bloc + décalage de caractères | Annotations et coupures indépendantes de la pagination |
| PDF filigrané | Chromium headless (`puppeteer-core` + `@sparticuz/chromium`) | HTML → PDF ; `pdf-lib` seul ne rend pas le HTML |
| Limitation de débit | Table Postgres (journal d'accès) | Aucun service supplémentaire en v1 |
| MFA administrateur | Supabase Auth MFA (TOTP), niveau `aal2` exigé dans la RLS | Exigence du cahier §2 |
| Mobile Money v1 | **Paiement manuel** (voir ci-dessous) | CinetPay reporté |

## Mobile Money en v1 (paiement manuel)
1. L'administrateur configure les numéros marchands (Wave, Orange Money…) par pays.
2. Le lecteur choisit Mobile Money : l'application crée une commande « en attente » et affiche
   le montant, le numéro à payer et une référence de commande.
3. Le lecteur paie depuis son téléphone puis saisit **son numéro de transaction** (et le numéro
   payeur) dans l'application.
4. L'administrateur rapproche la transaction de son relevé et **valide** (ou refuse avec motif).
5. La validation accorde le droit de lecture, crée les écritures du grand livre et envoie le reçu.

Garanties : un numéro de transaction ne peut être utilisé qu'une fois ; seule une action
administrateur (journalisée dans l'audit) accorde le droit. Le passage à CinetPay se fera
derrière la même interface de fournisseur de paiement.

## Next.js 16 — points d'attention
- `middleware.ts` → **`proxy.ts`**.
- `cacheComponents` activé : les données dynamiques (cookies, session) doivent être lues dans
  des composants enveloppés par `<Suspense>`.
- Documentation de la version installée : `node_modules/next/dist/docs/`.
