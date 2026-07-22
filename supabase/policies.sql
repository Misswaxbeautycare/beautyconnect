-- ============================================================
-- Misswaxbeautycare — Politiques de sécurité Row Level Security
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- Activer RLS sur toutes les tables sensibles
alter table users enable row level security;
alter table salons enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table notifications enable row level security;

-- Fonction utilitaire : rôle de l'utilisateur connecté
create or replace function current_user_role()
returns text
language sql stable
as $$
  select role from users where auth_id = auth.uid();
$$;

-- Fonction utilitaire : id interne de l'utilisateur connecté
create or replace function current_user_id()
returns text
language sql stable
as $$
  select id from users where auth_id = auth.uid();
$$;

-- ---------- USERS ----------
create policy "Un utilisateur lit son propre profil"
  on users for select
  using (auth_id = auth.uid());

create policy "Un utilisateur modifie son propre profil"
  on users for update
  using (auth_id = auth.uid());

create policy "Admin lit tous les profils"
  on users for select
  using (current_user_role() = 'ADMIN');

-- ---------- SALONS ----------
create policy "Tout le monde voit les salons actifs et approuvés"
  on salons for select
  using (is_active = true and is_approved = true);

create policy "Le propriétaire gère son salon"
  on salons for all
  using (owner_id = current_user_id());

create policy "Admin gère tous les salons"
  on salons for all
  using (current_user_role() = 'ADMIN');

-- ---------- SERVICES ----------
create policy "Tout le monde voit les prestations actives"
  on services for select
  using (is_active = true);

create policy "Le professionnel gère ses prestations"
  on services for all
  using (
    salon_id in (select id from salons where owner_id = current_user_id())
  );

-- ---------- BOOKINGS ----------
create policy "La cliente voit ses réservations"
  on bookings for select
  using (client_id = current_user_id());

create policy "La cliente crée une réservation"
  on bookings for insert
  with check (client_id = current_user_id());

create policy "Le professionnel voit les réservations de son salon"
  on bookings for select
  using (salon_id in (select id from salons where owner_id = current_user_id()));

create policy "Le professionnel met à jour les réservations de son salon"
  on bookings for update
  using (salon_id in (select id from salons where owner_id = current_user_id()));

-- ---------- REVIEWS ----------
create policy "Tout le monde lit les avis"
  on reviews for select
  using (true);

create policy "La cliente écrit un avis sur sa réservation"
  on reviews for insert
  with check (client_id = current_user_id());

-- ---------- FAVORITES ----------
create policy "La cliente gère ses favoris"
  on favorites for all
  using (client_id = current_user_id());

-- ---------- PRODUCTS ----------
create policy "Tout le monde voit les produits actifs"
  on products for select
  using (is_active = true);

create policy "Le professionnel gère ses produits"
  on products for all
  using (salon_id in (select id from salons where owner_id = current_user_id()));

-- ---------- ORDERS ----------
create policy "La cliente voit ses commandes"
  on orders for select
  using (client_id = current_user_id());

-- ---------- NOTIFICATIONS ----------
create policy "L'utilisateur voit ses notifications"
  on notifications for select
  using (user_id = current_user_id());
