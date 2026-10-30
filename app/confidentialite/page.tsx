import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité – Beauty Connect" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-10 font-display text-2xl font-bold text-noir">{children}</h2>;
const L = ({ items }: { items: React.ReactNode[] }) => <ul className="mt-3 list-disc space-y-1.5 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export default function Confidentialite() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14 leading-relaxed text-noir/80">
      <p className="text-xs font-semibold tracking-[0.18em] text-or-dark">VOS DONNÉES</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-noir sm:text-5xl">Politique de confidentialité</h1>
      <p className="mt-3 text-sm text-noir/50">Dernière mise à jour : {LEGAL.miseAJour}</p>
      <p className="mt-6">Chez {LEGAL.marque}, nous respectons votre vie privée. Cette page explique, simplement, quelles données nous collectons, pourquoi, et quels sont vos droits, conformément au Règlement général sur la protection des données (RGPD).</p>

      <H>Qui est responsable de vos données ?</H>
      <p className="mt-3"><b>{LEGAL.editeur}</b>, {LEGAL.adresse}. Contact : <a className="text-or-dark underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.</p>
      <p className="mt-2">Pour les rendez-vous, chaque salon est aussi responsable des données de ses propres clientes (fiche cliente, historique, notes).</p>

      <H>Les données que nous collectons</H>
      <L items={[
        <><b>Votre compte</b> : prénom, nom, email, téléphone, ville, mot de passe (chiffré).</>,
        <><b>Vos rendez-vous</b> : salon, prestation, date, heure, notes, adresse si le professionnel se déplace.</>,
        <><b>Vos paiements</b> : montant et statut. Les données de carte sont gérées uniquement par Stripe.</>,
        <><b>Vos avis et favoris</b>.</>,
        <><b>Pour les professionnels</b> : informations du salon, photos, prestations, prix, horaires, abonnement.</>,
        <><b>Données techniques</b> : visites des fiches salon, notifications sur votre téléphone si vous les acceptez.</>,
      ]} />

      <H>Pourquoi nous les utilisons</H>
      <L items={[
        "Créer et gérer votre compte.",
        "Réserver, confirmer et vous rappeler vos rendez-vous (email, notification).",
        "Traiter les paiements et les factures.",
        "Publier les avis et améliorer la plateforme.",
        <>Vous envoyer les <b>offres et promotions</b> des salons où vous êtes déjà allée. Chaque email contient un lien pour <b>ne plus les recevoir</b>.</>,
        "Respecter nos obligations légales (comptabilité, sécurité).",
      ]} />
      <p className="mt-3">Ces traitements reposent sur l’exécution du service que vous demandez, nos obligations légales, notre intérêt légitime (sécurité, amélioration, offres aux clientes existantes) ou votre consentement (notifications), que vous pouvez retirer à tout moment.</p>

      <H>Avec qui nous les partageons</H>
      <p className="mt-3">Nous ne vendons jamais vos données. Elles sont partagées uniquement avec :</p>
      <L items={[
        "le salon chez qui vous réservez ;",
        "nos prestataires techniques : Vercel (hébergement), Supabase (base de données, UE), Stripe (paiements), Resend (envoi des emails).",
      ]} />
      <p className="mt-3">Certains prestataires sont situés aux États-Unis. Les transferts sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types ou cadre de protection des données UE–États-Unis).</p>

      <H>Combien de temps nous les gardons</H>
      <L items={[
        "Compte : tant qu’il est actif, puis supprimé dans les 3 ans sans activité.",
        "Rendez-vous et paiements : jusqu’à 7 ans, pour les obligations comptables.",
        "Désinscription des offres : conservée pour ne plus vous écrire.",
      ]} />

      <H>Vos droits</H>
      <p className="mt-3">Vous pouvez à tout moment demander à <b>voir</b>, <b>corriger</b>, <b>supprimer</b> ou <b>récupérer</b> vos données, vous <b>opposer</b> à leur utilisation ou en <b>limiter</b> l’usage. Écrivez-nous à <a className="text-or-dark underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : nous répondons sous un mois.</p>
      <p className="mt-2">Si vous estimez que vos droits ne sont pas respectés, vous pouvez porter plainte auprès de l’<b>Autorité de protection des données</b>, rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be).</p>

      <H>Cookies</H>
      <p className="mt-3">Nous utilisons uniquement les cookies nécessaires au fonctionnement du site, par exemple pour rester connectée. Nous n’utilisons pas de cookies publicitaires.</p>

      <H>Sécurité</H>
      <p className="mt-3">Les échanges sont chiffrés (https), les mots de passe sont protégés et l’accès aux données est limité aux personnes qui en ont besoin.</p>

      <p className="mt-10 text-sm text-noir/50">Voir aussi nos <Link href="/mentions-legales" className="text-or-dark underline">mentions légales</Link>.</p>
    </article>
  );
}
