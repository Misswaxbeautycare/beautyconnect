import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Beauty Connect | Réservez. Connectez. Rayonnez.",
  description:
    "Plateforme de réservation beauté : coiffeurs, esthéticiennes, barbiers, onglerie, spa et plus. Réservez en ligne, payez en toute sécurité. Powered by Misswaxbeautycare.",
  keywords: [
    "réservation beauté",
    "salon de coiffure",
    "esthéticienne",
    "onglerie",
    "spa",
    "Belgique",
  ],
  openGraph: {
    title: "Beauty Connect",
    description: "Réservez. Connectez. Rayonnez.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
