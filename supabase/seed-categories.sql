-- Catégories de base Misswaxbeautycare
insert into categories (id, name, slug, icon) values
  (gen_random_uuid(), 'Coiffeur', 'coiffeur', 'scissors'),
  (gen_random_uuid(), 'Esthéticienne', 'estheticienne', 'sparkles'),
  (gen_random_uuid(), 'Barbier', 'barbier', 'razor'),
  (gen_random_uuid(), 'Maquilleur', 'maquilleur', 'palette'),
  (gen_random_uuid(), 'Onglerie', 'onglerie', 'hand'),
  (gen_random_uuid(), 'Massage', 'massage', 'heart-hand'),
  (gen_random_uuid(), 'Spa', 'spa', 'flower'),
  (gen_random_uuid(), 'Extension de cils', 'extension-de-cils', 'eye'),
  (gen_random_uuid(), 'Épilation', 'epilation', 'zap'),
  (gen_random_uuid(), 'Soins visage', 'soins-visage', 'smile'),
  (gen_random_uuid(), 'Soins corps', 'soins-corps', 'user'),
  (gen_random_uuid(), 'Beauté afro', 'beaute-afro', 'star'),
  (gen_random_uuid(), 'Maquillage permanent', 'maquillage-permanent', 'pen-tool')
on conflict (slug) do nothing;
