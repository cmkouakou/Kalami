# Étude de prix — Kalami Stratégie et paiements

Version : brouillon 1 — 2026-10-17 — **à valider par l'auteur** (aucun prix n'est saisi dans l'app)

---

## 1. Modèle retenu (rappel des décisions du 2026-10-16)

- `/strategie` consultable par tous (navigation, essai) ; **créer une étude est payant**.
- **Coach IA = paiement distinct**, par étude, sous forme de **forfaits** (recharges illimitées).
- Le client ne voit jamais de $ US : seulement le % du forfait et « ≈ N relectures ».
- Un acheteur du livre « a accès » à Stratégie (portée à trancher, voir § 6).
- Pas d'abonnement en v1 (cahier des charges).

---

## 2. Coûts réels du coach (production, 2026-10-17)

Source : table `coach_requests`, lecture seule. 1 seule étude, 12 demandes, modèle
`claude-opus-5-5`, total **1,75 $ US**.

| Fonction | Étape | Demandes | Coût moyen | Jetons entrée / sortie (moy.) |
|----------|-------|----------|------------|-------------------------------|
| Relecture | É1 | 1 | 0,09 $ | 3 448 / 3 720 |
| Relecture | É2 | 3 | 0,12 $ | 5 969 / 4 993 |
| Relecture | É3 | 2 | 0,11 $ | 5 466 / 4 362 |
| Relecture | É5 | 1 | 0,22 $ | 26 891 / 5 829 |
| Évaluation | É4 | 2 | 0,07 $ | 4 824 / 2 515 |
| Évaluation | É5 | 1 | 0,18 $ | 27 517 / 3 407 |
| Approfondissement | É1 | 1 | 0,05 $ | 3 212 / 1 879 |
| Recherche Web | É1 | 1 | 0,48 $ | 89 399 / 3 793 |

Constat : le coût monte avec le contexte (à partir de l'étape 5, le coach reçoit les étapes
précédentes). **Étapes 6 à 9, synthèse, pièces jointes et plan : jamais mesurés.**

### Projection d'une étude complète (hypothèses)

Hypothèse : les étapes 6 à 8 coûtent comme l'étape 5 (≈ 0,22 $ la relecture, 0,18 $
l'évaluation) ; une section du plan rédigée par le coach ≈ 0,20 $ ; la synthèse ≈ 0,30 $.

| Usage | Contenu | Coût estimé |
|-------|---------|-------------|
| Léger | 1 relecture par étape, quelques évaluations | ≈ 2 $ US |
| Moyen | 2 relectures + 1 évaluation par étape, 1 recherche Web, synthèse, 4 sections du plan | ≈ 5,5 à 6 $ US |
| Intensif | Relances fréquentes, plusieurs recherches, plan entier par le coach | ≈ 12 $ US |

Ces trois niveaux correspondent aux forfaits déjà créés dans la base (2 $, 6 $, 12 $).

👉 **À faire avant de figer les prix** : mesurer une étude complète (étapes 6 à 9) sur l'étude
« departement commercial » pour confirmer ou corriger la projection.

---

## 3. Hypothèses de calcul

| Élément | Valeur retenue | Fiabilité |
|---------|----------------|-----------|
| 1 $ US en $ CA | 1,40 | Août 2026 ≈ 1,40-1,41 |
| 1 $ CA en € | 0,625 | 1er oct. 2026 ≈ 0,625 |
| 1 $ US en € | ≈ 0,875 | Déduit des deux précédents |
| 1 € en FCFA | 655,957 | Parité fixe |
| 1 $ US en FCFA | ≈ 574 | Déduit |
| Stripe, carte canadienne | 2,9 % + 0,30 $ CA | Sources tierces, à vérifier sur stripe.com/ca/pricing |
| Stripe, carte étrangère en € | ≈ 5,7 % + 0,30 $ CA (+0,8 % carte étrangère, +2 % conversion) | Sources tierces, contradictoires |
| Mobile Money (Wave / Orange) | 1,5 % (prudent) | Wave annonce ≈ 1 %, non officiel |

Le coût du coach est un **plafond** : le budget du forfait n'est pas toujours consommé en
entier, donc la marge réelle sera supérieure à celle calculée ci-dessous.

---

## 4. Prix proposés

### 4.1 Création d'une étude (sans coach)

Coût marginal quasi nul (base de données, hébergement). Repères du marché : LivePlan
15-40 $ US / mois, Upmetrics 7-37 $ US / mois (abonnements).

| Devise | Prix proposé | Net après frais |
|--------|--------------|-----------------|
| CAD | **29,99 $** | ≈ 28,82 $ |
| EUR | **19,99 €** | ≈ 18,66 € |
| XOF | **9 900 FCFA** | ≈ 9 750 FCFA |

Le prix en FCFA est volontairement plus bas (≈ 15 €) pour tenir compte du pouvoir d'achat
en Afrique de l'Ouest.

### 4.2 Forfaits du coach (par étude, recharges illimitées)

| Forfait | Budget IA | CAD | EUR | XOF | Marge brute (min.) |
|---------|-----------|-----|-----|-----|--------------------|
| Essentiel | 2 $ US | **9,99 $** | **6,99 €** | **3 500 FCFA** | ≈ 66 % |
| Approfondi | 6 $ US | **24,99 $** | **16,99 €** | **9 900 FCFA** | ≈ 62 % |
| Intensif | 12 $ US | **44,99 $** | **29,99 €** | **17 500 FCFA** | ≈ 59 % |

Calcul : prix − coût IA converti − frais de paiement. Exemple Essentiel CAD :
9,99 − 2,80 − 0,59 = 6,60 $ de marge (66 %). Le prix au $ de budget baisse avec la taille
du forfait (dégressif) pour encourager les gros forfaits.

### 4.3 Lots pour enseignants

| Lot | Remise | Prix CAD | Prix EUR | Prix XOF |
|-----|--------|----------|----------|----------|
| 10 études | −20 % | 239,92 $ | 159,92 € | 79 200 FCFA |
| 30 études | −35 % | 584,80 $ | 389,80 € | 193 050 FCFA |

Le coach de classe se vend à part (forfaits ci-dessus par étude, ou un « budget de classe » à
définir). Proposition : forfait Essentiel par étude du lot à −20 %.

### 4.4 Frais fixes et seuil de rentabilité

À vérifier : Vercel Pro ≈ 20 $ US / mois et Supabase Pro ≈ 25 $ US / mois quand le projet
quittera les plans gratuits, soit ≈ 63 $ CA / mois. Seuil : **≈ 3 études + 3 forfaits
Essentiel par mois**.

---

## 5. Taxes (à confirmer avec un comptable)

- Au Québec, un **petit fournisseur** (moins de 30 000 $ de ventes taxables sur 4 trimestres)
  n'est pas tenu de s'inscrire à la TPS/TVQ. Au-delà : inscription obligatoire.
- Proposition : afficher les prix **taxes comprises** tant que Stripe Tax reste désactivé
  (interrupteur admin déjà prévu au Sprint 5b).

---

## 6. Décisions de l'auteur (2026-10-17)

- Propositions **validées** (prix des § 4.1 à 4.3).
- TPS/TVQ : **dispense** (petit fournisseur, moins de 30 000 $) → prix affichés sans taxe.
- Paiement **par carte (Stripe) ou par Mobile Money**, au choix du client.
- Mobile Money **manuel**, comme BRVM Analyser : le client choisit un opérateur, voit le numéro
  marchand affiché, paie hors de l'app, puis saisit son numéro de transaction ; l'admin valide
  et le droit est débloqué. Wave et Orange Money actifs au départ ; les autres réseaux
  (MTN MoMo, Moov Money, Free Money…) sont prévus mais désactivés, à activer par l'admin dès
  l'abonnement. Les numéros sont saisis dans l'admin, jamais dans le code.
- Prix du livre : 12,99 $ CA (aligné sur 5 000 FCFA, 1 $ CA = 411 FCFA) / 7,60 € / 5 000 FCFA.

## 6 bis. Questions initiales (pour mémoire)

1. **Prix d'une étude** : 29,99 $ CA / 19,99 € / 9 900 FCFA ?
2. **Forfaits du coach** : garder 3 forfaits (2 / 6 / 12 $ US) aux prix du § 4.2 ?
3. **Acheteurs du livre** (18,99 $ CA) — choisir une option :
   - A. 1 étude offerte, coach payant (coût pour toi ≈ 0 $) ;
   - B. 1 étude offerte + forfait Essentiel offert (coût ≈ 2,80 $ CA par livre vendu) ;
   - C. −50 % sur la première étude.
   Recommandation : **A**, car le forfait Essentiel se vend ensuite facilement (9,99 $).
4. **Lots enseignants** : remises −20 % (10 études) et −35 % (30 études) ?
5. **Mesure complète** : d'accord pour mesurer les étapes 6 à 9 sur l'étude d'exemple
   (≈ 1 à 2 $ US de coach) avant de figer les prix ?

---

## 7. Sources

- Frais Stripe Canada : [Venn](https://www.venn.ca/resources/how-to-save-on-your-stripe-payments-for-canadian-businesses),
  [Checkout Page](https://checkoutpage.com/blog/stripe-international-fees) — officiel :
  <https://stripe.com/ca/pricing>
- Frais Wave / Orange Money : [Kolonell](https://kolonell.com/fr/blog/comparatif-frais-wave-orange-money-free-money-marchand-2026)
  (estimations non officielles)
- Taux de change : [ValutaFX USD/CAD](https://www.valutafx.com/history/usd-cad-2026-08-04),
  [exchange-rates.org CAD/EUR](https://www.exchange-rates.org/exchange-rate-history/cad-eur-2026-10-01)
- Concurrence : [StartupSavant](https://startupsavant.com/7-business-planning-software-tools),
  [GetApp LivePlan](https://www.getapp.com/all-software/a/liveplan/)
- Coûts du coach : table `coach_requests` (production, 2026-10-17)
