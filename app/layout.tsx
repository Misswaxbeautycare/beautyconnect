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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeautyConnect",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "light only" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" style={{ colorScheme: "light only" }}>
      <body className="overflow-x-hidden bg-white">
        <Navbar />
        <main className="min-h-screen bg-white">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
