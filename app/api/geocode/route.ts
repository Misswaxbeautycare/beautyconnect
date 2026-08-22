import { NextRequest, NextResponse } from "next/server";

// Convertit une adresse tapée par la cliente en coordonnées GPS, via
// Nominatim (OpenStreetMap, gratuit, sans clé). Passe par le serveur plutôt
// que d'appeler Nominatim directement depuis le navigateur : ça évite les
// soucis de CORS et respecte leur règle d'un User-Agent identifiable.
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();
  if (!address || address.length < 5) {
    return NextResponse.json({ error: "Adresse trop courte" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { "User-Agent": "BeautyConnect (contact@misswaxbeautycare.com)" } }
    );
    const results = await res.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Adresse introuvable. Vérifiez l'orthographe." }, { status: 404 });
    }

    return NextResponse.json({
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
      label: results[0].display_name as string,
    });
  } catch (err) {
    console.error("[geocode]", err);
    return NextResponse.json({ error: "Impossible de localiser cette adresse pour le moment." }, { status: 502 });
  }
}
