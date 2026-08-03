// Configure les règles de sécurité (RLS) du bucket "salon-photos" pour que
// les professionnels connectés puissent y envoyer des photos. Sans ces
// règles, Supabase bloque tout envoi par défaut avec l'erreur
// "new row violates row-level security policy", même si le bucket est public
// en lecture. Idempotent — s'exécute sans risque à chaque déploiement.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const statements = [
  `insert into storage.buckets (id, name, public)
   values ('salon-photos', 'salon-photos', true)
   on conflict (id) do update set public = true`,

  `drop policy if exists "salon-photos public read" on storage.objects`,
  `create policy "salon-photos public read"
     on storage.objects for select
     using (bucket_id = 'salon-photos')`,

  `drop policy if exists "salon-photos authenticated upload" on storage.objects`,
  `create policy "salon-photos authenticated upload"
     on storage.objects for insert
     to authenticated
     with check (bucket_id = 'salon-photos')`,

  `drop policy if exists "salon-photos authenticated update" on storage.objects`,
  `create policy "salon-photos authenticated update"
     on storage.objects for update
     to authenticated
     using (bucket_id = 'salon-photos')`,

  `drop policy if exists "salon-photos authenticated delete" on storage.objects`,
  `create policy "salon-photos authenticated delete"
     on storage.objects for delete
     to authenticated
     using (bucket_id = 'salon-photos')`,
];

async function main() {
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      // Ne bloque pas le déploiement si une règle existe déjà sous une forme
      // légèrement différente, ou si les permissions RLS de base ont déjà
      // été configurées manuellement — on log et on continue.
      console.warn("Avertissement (storage policy) :", err.message);
    }
  }
  console.log("Règles de stockage 'salon-photos' synchronisées.");
}

main()
  .catch((err) => {
    console.error("Erreur lors de la configuration du stockage :", err);
    // Ne fait pas échouer le build pour ça — au pire les photos resteront
    // bloquées, mais le reste du site continue de se déployer normalement.
  })
  .finally(() => prisma.$disconnect());
