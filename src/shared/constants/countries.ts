export interface CountryOption {
    code: string;
    alpha2: string;
    label: string;
}

const EXCLUDED_COUNTRY_CODES = new Set([
    "RUS",
    "BLR",
    "IRN",
    "PRK",
    "SYR",
    "YEM",
    "AFG",
    "SDN",
    "SSD",
    "CUB",
    "VEN",
    "ZWE",
    "MMR",
    "MLI",
    "COD",
    "CAF",
    "SOM",
    "IRQ",
    "HTI",
]);

const ALL_COUNTRIES: CountryOption[] = [
    { code: "ALB", alpha2: "AL", label: "Albania" },
    { code: "DZA", alpha2: "DZ", label: "Algeria" },
    { code: "AND", alpha2: "AD", label: "Andorra" },
    { code: "AGO", alpha2: "AO", label: "Angola" },
    { code: "ATG", alpha2: "AG", label: "Antigua and Barbuda" },
    { code: "ARG", alpha2: "AR", label: "Argentina" },
    { code: "ARM", alpha2: "AM", label: "Armenia" },
    { code: "AUS", alpha2: "AU", label: "Australia" },
    { code: "AUT", alpha2: "AT", label: "Austria" },
    { code: "AZE", alpha2: "AZ", label: "Azerbaijan" },
    { code: "BHS", alpha2: "BS", label: "Bahamas" },
    { code: "BHR", alpha2: "BH", label: "Bahrain" },
    { code: "BGD", alpha2: "BD", label: "Bangladesh" },
    { code: "BRB", alpha2: "BB", label: "Barbados" },
    { code: "BEL", alpha2: "BE", label: "Belgium" },
    { code: "BLZ", alpha2: "BZ", label: "Belize" },
    { code: "BEN", alpha2: "BJ", label: "Benin" },
    { code: "BTN", alpha2: "BT", label: "Bhutan" },
    { code: "BOL", alpha2: "BO", label: "Bolivia" },
    { code: "BIH", alpha2: "BA", label: "Bosnia and Herzegovina" },
    { code: "BWA", alpha2: "BW", label: "Botswana" },
    { code: "BRA", alpha2: "BR", label: "Brazil" },
    { code: "BRN", alpha2: "BN", label: "Brunei" },
    { code: "BGR", alpha2: "BG", label: "Bulgaria" },
    { code: "BFA", alpha2: "BF", label: "Burkina Faso" },
    { code: "BDI", alpha2: "BI", label: "Burundi" },
    { code: "CPV", alpha2: "CV", label: "Cabo Verde" },
    { code: "KHM", alpha2: "KH", label: "Cambodia" },
    { code: "CMR", alpha2: "CM", label: "Cameroon" },
    { code: "CAN", alpha2: "CA", label: "Canada" },
    { code: "TCD", alpha2: "TD", label: "Chad" },
    { code: "CHL", alpha2: "CL", label: "Chile" },
    { code: "CHN", alpha2: "CN", label: "China" },
    { code: "COL", alpha2: "CO", label: "Colombia" },
    { code: "COM", alpha2: "KM", label: "Comoros" },
    { code: "COG", alpha2: "CG", label: "Congo" },
    { code: "CRI", alpha2: "CR", label: "Costa Rica" },
    { code: "CIV", alpha2: "CI", label: "Cote d'Ivoire" },
    { code: "HRV", alpha2: "HR", label: "Croatia" },
    { code: "CYP", alpha2: "CY", label: "Cyprus" },
    { code: "CZE", alpha2: "CZ", label: "Czech Republic" },
    { code: "DNK", alpha2: "DK", label: "Denmark" },
    { code: "DJI", alpha2: "DJ", label: "Djibouti" },
    { code: "DMA", alpha2: "DM", label: "Dominica" },
    { code: "DOM", alpha2: "DO", label: "Dominican Republic" },
    { code: "ECU", alpha2: "EC", label: "Ecuador" },
    { code: "EGY", alpha2: "EG", label: "Egypt" },
    { code: "SLV", alpha2: "SV", label: "El Salvador" },
    { code: "GNQ", alpha2: "GQ", label: "Equatorial Guinea" },
    { code: "ERI", alpha2: "ER", label: "Eritrea" },
    { code: "EST", alpha2: "EE", label: "Estonia" },
    { code: "SWZ", alpha2: "SZ", label: "Eswatini" },
    { code: "ETH", alpha2: "ET", label: "Ethiopia" },
    { code: "FJI", alpha2: "FJ", label: "Fiji" },
    { code: "FIN", alpha2: "FI", label: "Finland" },
    { code: "FRA", alpha2: "FR", label: "France" },
    { code: "GAB", alpha2: "GA", label: "Gabon" },
    { code: "GMB", alpha2: "GM", label: "Gambia" },
    { code: "GEO", alpha2: "GE", label: "Georgia" },
    { code: "DEU", alpha2: "DE", label: "Germany" },
    { code: "GHA", alpha2: "GH", label: "Ghana" },
    { code: "GRC", alpha2: "GR", label: "Greece" },
    { code: "GRD", alpha2: "GD", label: "Grenada" },
    { code: "GTM", alpha2: "GT", label: "Guatemala" },
    { code: "GIN", alpha2: "GN", label: "Guinea" },
    { code: "GNB", alpha2: "GW", label: "Guinea-Bissau" },
    { code: "GUY", alpha2: "GY", label: "Guyana" },
    { code: "HND", alpha2: "HN", label: "Honduras" },
    { code: "HUN", alpha2: "HU", label: "Hungary" },
    { code: "ISL", alpha2: "IS", label: "Iceland" },
    { code: "IND", alpha2: "IN", label: "India" },
    { code: "IDN", alpha2: "ID", label: "Indonesia" },
    { code: "IRL", alpha2: "IE", label: "Ireland" },
    { code: "ISR", alpha2: "IL", label: "Israel" },
    { code: "ITA", alpha2: "IT", label: "Italy" },
    { code: "JAM", alpha2: "JM", label: "Jamaica" },
    { code: "JPN", alpha2: "JP", label: "Japan" },
    { code: "JOR", alpha2: "JO", label: "Jordan" },
    { code: "KAZ", alpha2: "KZ", label: "Kazakhstan" },
    { code: "KEN", alpha2: "KE", label: "Kenya" },
    { code: "KIR", alpha2: "KI", label: "Kiribati" },
    { code: "KWT", alpha2: "KW", label: "Kuwait" },
    { code: "KGZ", alpha2: "KG", label: "Kyrgyzstan" },
    { code: "LAO", alpha2: "LA", label: "Laos" },
    { code: "LVA", alpha2: "LV", label: "Latvia" },
    { code: "LBN", alpha2: "LB", label: "Lebanon" },
    { code: "LSO", alpha2: "LS", label: "Lesotho" },
    { code: "LBR", alpha2: "LR", label: "Liberia" },
    { code: "LBY", alpha2: "LY", label: "Libya" },
    { code: "LIE", alpha2: "LI", label: "Liechtenstein" },
    { code: "LTU", alpha2: "LT", label: "Lithuania" },
    { code: "LUX", alpha2: "LU", label: "Luxembourg" },
    { code: "MDG", alpha2: "MG", label: "Madagascar" },
    { code: "MWI", alpha2: "MW", label: "Malawi" },
    { code: "MYS", alpha2: "MY", label: "Malaysia" },
    { code: "MDV", alpha2: "MV", label: "Maldives" },
    { code: "MLT", alpha2: "MT", label: "Malta" },
    { code: "MHL", alpha2: "MH", label: "Marshall Islands" },
    { code: "MRT", alpha2: "MR", label: "Mauritania" },
    { code: "MUS", alpha2: "MU", label: "Mauritius" },
    { code: "MEX", alpha2: "MX", label: "Mexico" },
    { code: "FSM", alpha2: "FM", label: "Micronesia" },
    { code: "MDA", alpha2: "MD", label: "Moldova" },
    { code: "MCO", alpha2: "MC", label: "Monaco" },
    { code: "MNG", alpha2: "MN", label: "Mongolia" },
    { code: "MNE", alpha2: "ME", label: "Montenegro" },
    { code: "MAR", alpha2: "MA", label: "Morocco" },
    { code: "MOZ", alpha2: "MZ", label: "Mozambique" },
    { code: "NAM", alpha2: "NA", label: "Namibia" },
    { code: "NRU", alpha2: "NR", label: "Nauru" },
    { code: "NPL", alpha2: "NP", label: "Nepal" },
    { code: "NLD", alpha2: "NL", label: "Netherlands" },
    { code: "NZL", alpha2: "NZ", label: "New Zealand" },
    { code: "NIC", alpha2: "NI", label: "Nicaragua" },
    { code: "NER", alpha2: "NE", label: "Niger" },
    { code: "NGA", alpha2: "NG", label: "Nigeria" },
    { code: "MKD", alpha2: "MK", label: "North Macedonia" },
    { code: "NOR", alpha2: "NO", label: "Norway" },
    { code: "OMN", alpha2: "OM", label: "Oman" },
    { code: "PAK", alpha2: "PK", label: "Pakistan" },
    { code: "PLW", alpha2: "PW", label: "Palau" },
    { code: "PSE", alpha2: "PS", label: "Palestine" },
    { code: "PAN", alpha2: "PA", label: "Panama" },
    { code: "PNG", alpha2: "PG", label: "Papua New Guinea" },
    { code: "PRY", alpha2: "PY", label: "Paraguay" },
    { code: "PER", alpha2: "PE", label: "Peru" },
    { code: "PHL", alpha2: "PH", label: "Philippines" },
    { code: "POL", alpha2: "PL", label: "Poland" },
    { code: "PRT", alpha2: "PT", label: "Portugal" },
    { code: "QAT", alpha2: "QA", label: "Qatar" },
    { code: "ROU", alpha2: "RO", label: "Romania" },
    { code: "RWA", alpha2: "RW", label: "Rwanda" },
    { code: "KNA", alpha2: "KN", label: "Saint Kitts and Nevis" },
    { code: "LCA", alpha2: "LC", label: "Saint Lucia" },
    { code: "VCT", alpha2: "VC", label: "Saint Vincent and the Grenadines" },
    { code: "WSM", alpha2: "WS", label: "Samoa" },
    { code: "SMR", alpha2: "SM", label: "San Marino" },
    { code: "STP", alpha2: "ST", label: "Sao Tome and Principe" },
    { code: "SAU", alpha2: "SA", label: "Saudi Arabia" },
    { code: "SEN", alpha2: "SN", label: "Senegal" },
    { code: "SRB", alpha2: "RS", label: "Serbia" },
    { code: "SYC", alpha2: "SC", label: "Seychelles" },
    { code: "SLE", alpha2: "SL", label: "Sierra Leone" },
    { code: "SGP", alpha2: "SG", label: "Singapore" },
    { code: "SVK", alpha2: "SK", label: "Slovakia" },
    { code: "SVN", alpha2: "SI", label: "Slovenia" },
    { code: "SLB", alpha2: "SB", label: "Solomon Islands" },
    { code: "ZAF", alpha2: "ZA", label: "South Africa" },
    { code: "KOR", alpha2: "KR", label: "South Korea" },
    { code: "ESP", alpha2: "ES", label: "Spain" },
    { code: "LKA", alpha2: "LK", label: "Sri Lanka" },
    { code: "SUR", alpha2: "SR", label: "Suriname" },
    { code: "SWE", alpha2: "SE", label: "Sweden" },
    { code: "CHE", alpha2: "CH", label: "Switzerland" },
    { code: "TJK", alpha2: "TJ", label: "Tajikistan" },
    { code: "TZA", alpha2: "TZ", label: "Tanzania" },
    { code: "THA", alpha2: "TH", label: "Thailand" },
    { code: "TLS", alpha2: "TL", label: "Timor-Leste" },
    { code: "TGO", alpha2: "TG", label: "Togo" },
    { code: "TON", alpha2: "TO", label: "Tonga" },
    { code: "TTO", alpha2: "TT", label: "Trinidad and Tobago" },
    { code: "TUN", alpha2: "TN", label: "Tunisia" },
    { code: "TUR", alpha2: "TR", label: "Turkey" },
    { code: "TKM", alpha2: "TM", label: "Turkmenistan" },
    { code: "TUV", alpha2: "TV", label: "Tuvalu" },
    { code: "UGA", alpha2: "UG", label: "Uganda" },
    { code: "UKR", alpha2: "UA", label: "Ukraine" },
    { code: "ARE", alpha2: "AE", label: "United Arab Emirates" },
    { code: "GBR", alpha2: "GB", label: "United Kingdom" },
    { code: "USA", alpha2: "US", label: "United States" },
    { code: "URY", alpha2: "UY", label: "Uruguay" },
    { code: "UZB", alpha2: "UZ", label: "Uzbekistan" },
    { code: "VUT", alpha2: "VU", label: "Vanuatu" },
    { code: "VAT", alpha2: "VA", label: "Vatican City" },
    { code: "VNM", alpha2: "VN", label: "Vietnam" },
    { code: "ZMB", alpha2: "ZM", label: "Zambia" },
];

export const ALLOWED_COUNTRIES = ALL_COUNTRIES.filter(
    (country) => !EXCLUDED_COUNTRY_CODES.has(country.code)
);

const ALLOWED_COUNTRY_LABEL_SET = new Set(ALLOWED_COUNTRIES.map((country) => country.label));

export function isAllowedCountry(country: string) {
    return ALLOWED_COUNTRY_LABEL_SET.has(country);
}

/** Lookup: country label → alpha-2, alpha-3 → alpha-2 */
const LABEL_TO_ALPHA2 = new Map<string, string>();
const ALPHA3_TO_ALPHA2 = new Map<string, string>();
for (const c of ALL_COUNTRIES) {
    LABEL_TO_ALPHA2.set(c.label.toLowerCase(), c.alpha2);
    ALPHA3_TO_ALPHA2.set(c.code, c.alpha2);
}

/**
 * Convert a country value (full name like "United Kingdom", alpha-3 like "GBR",
 * or already alpha-2 like "GB") to an ISO 3166-1 alpha-2 code.
 * Returns `null` when conversion is not possible.
 */
export function countryToAlpha2(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Already alpha-2
    if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;

    // Alpha-3 → alpha-2
    const fromAlpha3 = ALPHA3_TO_ALPHA2.get(trimmed.toUpperCase());
    if (fromAlpha3) return fromAlpha3;

    // Label (full name) → alpha-2
    const fromLabel = LABEL_TO_ALPHA2.get(trimmed.toLowerCase());
    if (fromLabel) return fromLabel;

    return null;
}

