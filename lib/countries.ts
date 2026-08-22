export interface CountryConfig {
  code: string; // utilisé en interne et dans les URL (?pays=)
  label: string; // affiché tel quel dans le champ "country" du salon
  currencyCode: "EUR" | "USD";
  currencySymbol: string;
  // Devise secondaire affichée entre parenthèses, le cas échéant (ex: CDF
  // pour la RDC, où les prix se pensent souvent en dollars mais se
  // payent parfois en francs congolais au quotidien).
  secondaryCurrency?: {
    code: "CDF";
    symbol: string;
    // Taux de conversion manuel — le franc congolais est trop instable
    // pour se fier à un taux de change automatique non vérifié. À mettre
    // à jour ponctuellement sur demande plutôt que de dépendre d'une API
    // externe dont la fiabilité n'est pas garantie pour cette devise.
    rateFromPrimary: number;
  };
}

export const countries: CountryConfig[] = [
  {
    code: "BE",
    label: "Belgique",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "CD",
    label: "RDC",
    currencyCode: "USD",
    currencySymbol: "$",
    secondaryCurrency: { code: "CDF", symbol: "FC", rateFromPrimary: 2800 },
  },
];

export const defaultCountry = countries[0];

export function getCountryConfig(countryLabel: string | null | undefined): CountryConfig {
  return countries.find((c) => c.label === countryLabel) ?? defaultCountry;
}

export function getCountryByCode(code: string | null | undefined): CountryConfig {
  return countries.find((c) => c.code === code) ?? defaultCountry;
}

// Formate un prix selon le pays du salon — affiche la devise secondaire
// entre parenthèses quand elle existe (ex: "20 $ (≈ 56 000 FC)").
export function formatPriceForCountry(amount: number, countryLabel: string | null | undefined): string {
  const country = getCountryConfig(countryLabel);
  const primary = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: country.currencyCode,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

  if (!country.secondaryCurrency) return primary;

  const secondaryAmount = Math.round(amount * country.secondaryCurrency.rateFromPrimary);
  const secondary = new Intl.NumberFormat("fr-FR").format(secondaryAmount);
  return `${primary} (≈ ${secondary} ${country.secondaryCurrency.symbol})`;
}
