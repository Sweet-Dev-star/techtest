/**
 * The two closed vocabularies the registration form offers.
 *
 * Both are validated server-side against these lists — a select element is a
 * convenience for the person filling it in, never a guarantee about what
 * arrives in the request.
 */

export const DEVELOPER_TYPES = [
  { value: "frontend", label: "Front End developer" },
  { value: "backend", label: "Back End developer" },
  { value: "fullstack", label: "Full Stack developer" },
  { value: "devops", label: "DevOps Engineer" },
  { value: "qa", label: "QA Engineer" },
] as const;

export type DeveloperType = (typeof DEVELOPER_TYPES)[number]["value"];

export function isDeveloperType(value: string): value is DeveloperType {
  return DEVELOPER_TYPES.some((type) => type.value === value);
}

export function developerTypeLabel(value: string): string {
  return DEVELOPER_TYPES.find((type) => type.value === value)?.label ?? value;
}

// ISO 3166-1 alpha-2. Names come from Intl rather than a hand-maintained list,
// so they stay correct and correctly spelled without us curating them.
const COUNTRY_CODES =
  "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(
    " ",
  );

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const COUNTRIES: { code: string; name: string }[] = COUNTRY_CODES.map((code) => ({
  code,
  name: regionNames.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

const COUNTRY_SET = new Set(COUNTRY_CODES);

export function isCountryCode(value: string): boolean {
  return COUNTRY_SET.has(value);
}

export function countryName(code: string): string {
  return regionNames.of(code) ?? code;
}

export const MIN_AGE = 16;
export const MAX_AGE = 99;
export const MIN_PASSWORD_LENGTH = 10;
