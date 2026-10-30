import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales – Beauty Connect" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-10 font-display text-2xl font-bold text-noir">{children}</h2>;

export default function MentionsLegales() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14 leading-relaxed text-noir/80">
      <p className="text-xs font-semibold tracking-[0.18em] text-or-dark">INFORMATIONS LÉGALES</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-noir sm:text-5xl">Mentions légales</h1>
      <p className="mt-3 text-sm text-noir/50">Dernière mise à jour : {LEGAL.miseAJour}</p>

      <H>Éditeur du site</H>
      <p className="mt-3">Le site {LEGAL.site} ({LEGAL.marque}) est édité par :</p>
      <ul className="mt-3 space-y-1">
        <li><b>{LEGAL.editeur}</b></li>
        <li>{LEGAL.statut}</li>
        <li>Adresse : {LEGAL.adresse}</li>
        <li>Email : <a className="text-or-dark underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></li>
        <li>Téléphone : {LEGAL.telephone}</li>
        <li>Numéro d’entreprise (BCE) : {LEGAL.bce || "en cours d’enregistrement"}</li>
        {LEGAL.tva && <li>TVA : {LEGAL.tva}</li>}
      </ul>

      <H>Hébergement</H>
      <p className="mt-3">Le site est hébergé par <b>Vercel Inc.</b>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com). Les données sont stockées par <b>Supabase</b> sur des serveurs situés dans l’Union européenne (Irlande).</p>

      <H>Activité</H>
      <p className="mt-3">{LEGAL.marque} est une plateforme qui met en relation des clientes et des professionnels de la beauté (coiffure, esthétique, onglerie, maquillage, massage…). Chaque professionnel est seul responsable de ses prestations, de ses prix, de ses produits et du respect de la réglementation applicable à son activité.</p>

      <H>Paiements</H>
      <p className="mt-3">Les paiements en ligne sont traités de façon sécurisée par <b>Stripe Payments Europe Ltd</b> (Irlande). {LEGAL.marque} n’a jamais accès aux numéros de carte bancaire.</p>

      <H>Propriété intellectuelle</H>
      <p className="mt-3">Le nom {LEGAL.marque}, le logo, les textes et le design du site sont protégés. Toute reproduction sans autorisation écrite est interdite. Les photos et contenus publiés par les professionnels restent leur propriété ; ils garantissent disposer des droits nécessaires.</p>

      <H>Responsabilité</H>
      <p className="mt-3">Nous faisons notre possible pour que les informations du site soient exactes et à jour, sans pouvoir le garantir. {LEGAL.marque} ne peut être tenue responsable d’une interruption du site, d’une erreur dans les informations publiées par un professionnel ou d’un litige entre une cliente et un professionnel.</p>

      <H>Données personnelles</H>
      <p className="mt-3">Le traitement de vos données est expliqué dans notre <Link href="/confidentialite" className="text-or-dark underline">politique de confidentialité</Link>.</p>

      <H>Droit applicable</H>
      <p className="mt-3">Le présent site est soumis au droit belge. En cas de litige, et après une tentative de solution amiable, les tribunaux de Bruxelles sont compétents, sans préjudice des règles protégeant les consommateurs.</p>

      <H>Contact</H>
      <p className="mt-3">Une question ? Écrivez-nous à <a className="text-or-dark underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> ou via la page <Link href="/contact" className="text-or-dark underline">Contact</Link>.</p>
    </article>
  );
}
