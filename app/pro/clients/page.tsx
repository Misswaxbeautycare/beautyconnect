import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ContactsManager } from "@/components/pro/ContactsManager";
import { formatDate, formatPrice } from "@/lib/utils";

interface ClientSummary {
  key: string;
  name: string;
  phone: string | null;
  visitCount: number;
  lastVisit: Date;
  totalPaid: number;
}

export default async function ClientsFidelesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const contacts = await prisma.contact.findMany({
    where: { salonId: salon.id },
    orderBy: { name: "asc" },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      salonId: salon.id,
      status: { notIn: ["CANCELLED", "REFUSED"] },
    },
    include: { client: true, payment: true },
    orderBy: { date: "desc" },
  });

  const parClient = new Map<string, ClientSummary>();

  for (const b of bookings) {
    const key = b.clientId ?? `guest:${b.guestEmail ?? b.guestPhone ?? b.guestName ?? b.id}`;
    const name = b.client
      ? `${b.client.firstName} ${b.client.lastName}`
      : b.guestName ?? "Client sans nom";
    const phone = b.client?.phone ?? b.guestPhone ?? null;
    const paid = b.payment?.status === "PAID" ? Number(b.payment.amount) : 0;

    const existing = parClient.get(key);
    if (existing) {
      existing.visitCount += 1;
      existing.totalPaid += paid;
      if (b.date > existing.lastVisit) existing.lastVisit = b.date;
    } else {
      parClient.set(key, { key, name, phone, visitCount: 1, lastVisit: b.date, totalPaid: paid });
    }
  }

  const clients = Array.from(parClient.values()).sort((a, b) => {
    if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount;
    return b.lastVisit.getTime() - a.lastVisit.getTime();
  });

  const fideles = clients.filter((c) => c.visitCount >= 2);
  const autres = clients.filter((c) => c.visitCount < 2);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Clientes fidèles</h1>
      <p className="mt-1 text-noir/60">
        Classées par nombre de visites dans votre salon.
      </p>

      <div className="mt-10">
        <ContactsManager initialContacts={contacts} />
      </div>

      {clients.length === 0 ? (
        <p className="mt-10 text-noir/40">Aucune cliente pour le moment.</p>
      ) : (
        <>
          {fideles.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg text-noir">
                Fidèles (2 visites ou plus)
              </h2>
              <div className="space-y-3">
                {fideles.map((c) => (
                  <ClientRow key={c.key} client={c} />
                ))}
              </div>
            </div>
          )}

          {autres.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 font-display text-lg text-noir">
                Une seule visite pour le moment
              </h2>
              <div className="space-y-3">
                {autres.map((c) => (
                  <ClientRow key={c.key} client={c} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClientRow({ client }: { client: ClientSummary }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="font-medium text-noir">{client.name}</p>
        <p className="text-sm text-noir/60">
          {client.phone ?? "Téléphone non renseigné"} · Dernière visite : {formatDate(client.lastVisit)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-noir">{client.visitCount} visite{client.visitCount > 1 ? "s" : ""}</p>
        {client.totalPaid > 0 && (
          <p className="text-xs text-noir/40">{formatPrice(client.totalPaid)} au total</p>
        )}
      </div>
    </Card>
  );
}
