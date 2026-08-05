export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Contact</h1>
      <p className="mt-4 text-noir/70">
        Une question, une suggestion, ou besoin d&apos;aide avec votre compte ? Écrivez-nous :
      </p>
      <a
        href="mailto:contact@misswaxbeautycare.com"
        className="mt-4 inline-block rounded-full bg-or px-6 py-3 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white transition"
      >
        contact@misswaxbeautycare.com
      </a>
    </div>
  );
}
