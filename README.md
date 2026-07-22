# Beauty Connect

**Réservez. Connectez. Rayonnez.**

_Powered by Misswaxbeautycare_

Plateforme SaaS de réservation beauté (type Treatwell/Fresha) avec deux espaces
(Clientes & Professionnels) et une administration complète, propulsée par
Next.js 15, Supabase, Prisma et Stripe.

---

## 📦 Ce qui est déjà construit (Phase 1 — Fondation)

- **Base de données complète** (`prisma/schema.prisma`) : utilisateurs & rôles,
  salons, catégories, prestations, réservations, paiements, avis, favoris,
  boutique (produits/commandes), promotions, notifications.
- **Sécurité Supabase** (`supabase/policies.sql`) : Row Level Security par rôle
  (Client / Professionnel / Admin).
- **13 catégories** beauté pré-remplies (`supabase/seed-categories.sql`).
- **Authentification** (inscription / connexion) via Supabase Auth.
- **Page d'accueil** premium (noir / blanc / or / beige), grille de catégories,
  animations.
- **Recherche & filtres** (ville, catégorie).
- **Fiche salon** avec avis + **calendrier de réservation dynamique** (les
  créneaux se mettent à jour automatiquement selon le service et le jour
  choisis).
- **Paiement Stripe** (Checkout) avec choix acompte / paiement complet, et
  webhook de confirmation automatique.
- **Tableaux de bord** : Cliente (RDV, favoris), Professionnel (RDV du jour, CA
  du mois, nouvelles clientes, commission), Administrateur (utilisateurs,
  salons, commissions).
- **Middleware** de protection des espaces privés (`/client`, `/pro`, `/admin`).

## 🔜 Phase 2 (à construire ensuite, sur cette même base)

- Gestion complète du salon côté pro : horaires, jours de fermeture, photos
  (Cloudinary), prestations (CRUD), promotions.
- Boutique en ligne complète (panier, commande, paiement produits).
- Emails transactionnels (Resend) : confirmation, rappel 24h, rappel 2h
  (via Vercel Cron).
- Notifications in-app en temps réel (Supabase Realtime).
- Formulaire d'avis avec upload photo.
- Statistiques graphiques (Recharts) sur les tableaux de bord.
- Back-office admin complet (CRUD utilisateurs, validation salons, gestion
  des commissions et catégories).
- **Modules futurs indépendants** (sans reconstruire l'existant) : Miss
  Académy (formations), vente de tissus wax, etc. — il suffira d'ajouter de
  nouvelles tables Prisma et de nouvelles routes `/app`.

---

## 🚀 Déploiement (sans ligne de commande)

Tu peux déployer entièrement via les interfaces web, sans terminal.

### 1. Mettre le code sur GitHub
1. Va sur [github.com/new](https://github.com/new) et crée un dépôt
   `beautyconnect`.
2. Sur la page du dépôt vide, clique **"uploading an existing file"**.
3. Glisse-dépose tout le contenu de ce dossier (garde la structure des
   sous-dossiers) et valide (**Commit changes**).

### 2. Créer le projet Supabase
1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Une fois créé, ouvre **SQL Editor** dans le menu de gauche.
3. Colle et exécute le contenu de `prisma/schema.prisma`... en réalité,
   génère d'abord les tables via Prisma (voir section "Base de données"
   ci-dessous), **puis** colle et exécute `supabase/policies.sql`, puis
   `supabase/seed-categories.sql`.
4. Dans **Project Settings → API**, récupère `Project URL`, `anon public key`
   et `service_role key`.
5. Dans **Project Settings → Database**, récupère la `Connection string`
   (mode "Transaction" pour `DATABASE_URL`, mode "Session" pour `DIRECT_URL`).

### 3. Créer le projet Stripe
1. Sur [dashboard.stripe.com](https://dashboard.stripe.com), récupère tes
   clés API (mode test pour commencer).
2. Une fois le site déployé sur Vercel (étape 4), reviens créer un
   **Webhook** dans Stripe pointant vers
   `https://ton-domaine.vercel.app/api/stripe/webhook`, événement
   `checkout.session.completed`, puis copie le `Signing secret`.

### 4. Déployer sur Vercel
1. Va sur [vercel.com/new](https://vercel.com/new) et connecte ton compte
   GitHub.
2. Importe le dépôt `beautyconnect`.
3. Dans **Environment Variables**, ajoute toutes les variables listées dans
   `.env.example` avec tes vraies valeurs (Supabase, Stripe, Cloudinary...).
4. Clique **Deploy**. Ton site est en ligne en quelques minutes.

### 5. Base de données — appliquer le schéma
Comme tu évites la ligne de commande : le plus simple est d'utiliser
l'intégration **Vercel ↔ Supabase** (onglet *Storage/Integrations* dans
Vercel) qui peut exécuter `prisma db push` automatiquement au build, ou de
demander à Claude Code / un développeur d'exécuter `npx prisma db push` une
seule fois. Une fois les tables créées, tout le reste (policies, seed) se
fait depuis l'éditeur SQL web de Supabase comme indiqué ci-dessus.

---

## 🗂 Structure du projet

```
beautyconnect/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/login/       # Connexion
│   ├── (auth)/register/    # Inscription (cliente ou pro)
│   ├── recherche/          # Recherche + filtres
│   ├── salon/[id]/         # Fiche salon + réservation
│   ├── client/dashboard/   # Espace cliente
│   ├── pro/dashboard/      # Espace professionnel
│   ├── admin/dashboard/    # Espace administrateur
│   └── api/                # Routes API (bookings, stripe, users)
├── components/
│   ├── ui/                 # Button, Card (réutilisables)
│   ├── layout/              # Navbar, Footer
│   ├── booking/             # Calendrier de réservation
│   └── salon/                # Carte salon
├── lib/                    # Prisma, Supabase, Stripe, validations Zod
├── prisma/schema.prisma    # Schéma complet de la base de données
├── supabase/                # Policies RLS + seed des catégories
└── middleware.ts            # Protection des espaces privés
```

## 🎨 Identité visuelle

- **Couleurs** : Noir (`#0A0A0A`), Blanc, Or (`#C9A24B`), Beige (`#F3EEE6`)
- **Polices** : Playfair Display (titres), Inter (texte)
- **Style** : premium, épuré, inspiré de Treatwell / Fresha / Booksy

## 🔑 Rôles

| Rôle | Accès |
|---|---|
| `CLIENT` | Réserve, paie, laisse des avis, gère ses favoris |
| `PROFESSIONAL` | Gère son salon, ses prestations, son agenda, ses clientes |
| `ADMIN` | Supervise utilisateurs, salons, paiements, commissions |

## 📝 Licence

Propriété de Misswaxbeautycare — Tous droits réservés.
