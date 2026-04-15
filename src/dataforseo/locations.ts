/**
 * Canonical DataForSEO location_code mappings for Foundry North (Compass + Trigger).
 * Single source of truth — import from `@foundrynorth/core/dataforseo`.
 *
 * @see https://docs.dataforseo.com/v3/appendix/google/locations/
 */

/** Nielsen DMA string (frontend / proposal context) → DataForSEO location_code */
export const DMA_LOCATION_CODES: Record<string, number> = {
  "minneapolis-st. paul, mn": 1020819,
  "minneapolis-st paul, mn": 1020819,
  "minneapolis-st. paul": 1020819,
  "minneapolis-st paul": 1020819,
  "twin cities, mn": 1020819,
  "twin cities": 1020819,
  "new york, ny": 1023191,
  "los angeles, ca": 1013962,
  "chicago, il": 1016367,
  "houston, tx": 1026481,
  "dallas-ft worth, tx": 1026339,
  "dallas-fort worth, tx": 1026339,
  "phoenix, az": 1012728,
  "seattle-tacoma, wa": 1027744,
  "denver, co": 1014519,
  "atlanta, ga": 1015573,
  "miami-ft lauderdale, fl": 1015163,
  "tampa-st petersburg, fl": 1015315,
  "boston, ma": 1018127,
  "washington, dc": 1015079,
  "san francisco-oakland, ca": 1014226,
};

/** City, state → DataForSEO location_code */
export const CITY_LOCATION_CODES: Record<string, number> = {
  "minneapolis,mn": 1020819,
  "minneapolis-st. paul,mn": 1020819,
  "minneapolis-st paul,mn": 1020819,
  "st paul,mn": 1021191,
  "st. paul,mn": 1021191,
  "saint paul,mn": 1021191,
  "bloomington,mn": 1020299,
  "duluth,mn": 1020532,
  "rochester,mn": 1021050,
  "new york,ny": 1023191,
  "los angeles,ca": 1013962,
  "chicago,il": 1016367,
  "houston,tx": 1026481,
  "phoenix,az": 1012728,
  "philadelphia,pa": 1025197,
  "san antonio,tx": 1026595,
  "san diego,ca": 1014221,
  "dallas,tx": 1026339,
  "san jose,ca": 1014240,
  "austin,tx": 1026246,
  "jacksonville,fl": 1015127,
  "fort worth,tx": 1026400,
  "columbus,oh": 1024683,
  "indianapolis,in": 1016822,
  "charlotte,nc": 1023860,
  "san francisco,ca": 1014226,
  "seattle,wa": 1027744,
  "denver,co": 1014519,
  "washington,dc": 1015079,
  "boston,ma": 1018127,
  "nashville,tn": 1025873,
  "baltimore,md": 1018058,
  "detroit,mi": 1018911,
  "oklahoma city,ok": 1024884,
  "portland,or": 1025033,
  "las vegas,nv": 1022276,
  "milwaukee,wi": 1028264,
  "memphis,tn": 1025839,
  "louisville,ky": 1017517,
  "atlanta,ga": 1015573,
  "miami,fl": 1015163,
  "kansas city,mo": 1020574,
  "tucson,az": 1012907,
  "mesa,az": 1012691,
  "raleigh,nc": 1024052,
  "omaha,ne": 1021742,
  "long beach,ca": 1013988,
  "virginia beach,va": 1027405,
  "oakland,ca": 1014100,
  "sacramento,ca": 1014177,
  "tulsa,ok": 1025013,
  "tampa,fl": 1015315,
  "new orleans,la": 1017712,
  "pittsburgh,pa": 1025189,
  "cincinnati,oh": 1024678,
  "miami beach,fl": 1015165,
};

/** US state → DataForSEO state-level location_code */
export const STATE_LOCATION_CODES: Record<string, number> = {
  al: 21133,
  ak: 21132,
  az: 21134,
  ar: 21135,
  ca: 21136,
  co: 21137,
  ct: 21138,
  de: 21139,
  fl: 21140,
  ga: 21141,
  hi: 21142,
  id: 21143,
  il: 21144,
  in: 21145,
  ia: 21146,
  ks: 21147,
  ky: 21148,
  la: 21149,
  me: 21150,
  md: 21151,
  ma: 21152,
  mi: 21153,
  mn: 21154,
  ms: 21155,
  mo: 21156,
  mt: 21157,
  ne: 21158,
  nv: 21159,
  nh: 21160,
  nj: 21161,
  nm: 21162,
  ny: 21163,
  nc: 21164,
  nd: 21165,
  oh: 21166,
  ok: 21167,
  or: 21168,
  pa: 21169,
  ri: 21170,
  sc: 21171,
  sd: 21172,
  tn: 21173,
  tx: 21174,
  ut: 21175,
  vt: 21176,
  va: 21177,
  wa: 21178,
  wv: 21179,
  wi: 21180,
  wy: 21181,
  /** District of Columbia — metro-level code (not a generic state bucket) */
  dc: 1015079,
};

/**
 * Nielsen DMA code (e.g. "527") → DataForSEO location_code.
 * @see fn-v2 historical `lib/dataforseo-locations` (merged here).
 */
export const DMA_TO_DATAFORSEO: Record<string, number> = {
  "501": 1023191,
  "803": 1013962,
  "602": 1016367,
  "504": 1025197,
  "807": 1026339,
  "511": 1015079,
  "618": 1026481,
  "506": 1018127,
  "524": 1015573,
  "753": 1012728,
  "651": 1014226,
  "819": 1027744,
  "548": 1018911,
  "539": 1015315,
  "527": 1020819,
  "510": 1015163,
  "623": 1014519,
  "650": 1014221,
  "534": 1015186,
  "505": 1020587,
  "641": 1026595,
  "659": 1025033,
  "542": 1023860,
  "751": 1014177,
  "512": 1025189,
  "517": 1018058,
  "560": 1024052,
  "528": 1016822,
  "515": 1025873,
  "567": 1020574,
  "557": 1027170,
  "564": 1024678,
  "544": 1028264,
  "563": 1024683,
  "521": 1026050,
  "820": 1022276,
  "635": 1026246,
  "561": 1015127,
  "520": 1025839,
  "609": 1014013,
  "556": 1027368,
  "671": 1012521,
  "538": 1017712,
  "532": 1017517,
  "573": 1023054,
  "541": 1024884,
  "552": 1027333,
  "569": 1024133,
  "518": 1014013,
  "555": 1015345,
};

export const USA_LOCATION_CODE = 2840;

/** Alias for STATE_LOCATION_CODES — same map, Nielsen/DMA helper name */
export const STATE_TO_DATAFORSEO = STATE_LOCATION_CODES;

export function getLocationCodeFromDMA(dmaString: string): number {
  if (!dmaString) return USA_LOCATION_CODE;

  const cleanedString = dmaString
    .replace(/\s*\(DMA\s*\d+\)\s*/i, "")
    .trim()
    .toLowerCase();

  const dmaCode = DMA_LOCATION_CODES[cleanedString];
  if (dmaCode) return dmaCode;

  const withoutState = cleanedString.replace(/,\s*[a-z]{2}$/i, "").trim();
  const dmaCodeNoState = DMA_LOCATION_CODES[withoutState];
  if (dmaCodeNoState) return dmaCodeNoState;

  const match = cleanedString.match(/^(.+),\s*([a-z]{2})$/i);
  if (match) {
    return getLocationCode(match[1].trim(), match[2].trim());
  }

  return USA_LOCATION_CODE;
}

export function getLocationCode(city?: string, state?: string): number {
  if (!city && !state) return USA_LOCATION_CODE;

  if (city && state) {
    const cityKey = `${city.toLowerCase().trim()},${state.toLowerCase().trim()}`;
    const cityCode = CITY_LOCATION_CODES[cityKey];
    if (cityCode) return cityCode;
  }

  if (state) {
    const sc = STATE_LOCATION_CODES[state.toLowerCase().trim()];
    if (sc) return sc;
  }

  return USA_LOCATION_CODE;
}

export function getLocationCodeForDMA(dmaCode: string): number {
  const code = DMA_TO_DATAFORSEO[dmaCode];
  if (code) return code;
  return USA_LOCATION_CODE;
}

export function getLocationCodeForState(state: string): number {
  const code = STATE_LOCATION_CODES[state.toLowerCase()];
  if (code) return code;
  return USA_LOCATION_CODE;
}

/**
 * Resolve a loose hint (e.g. "minneapolis", "United States") to a location_code.
 * Used by @fn-compass/dataforseo client for single-string geo hints.
 */
export function resolveDataForSeoLocationHint(hint: string): number {
  const h = hint.toLowerCase().trim();
  if (h === "united states" || h === "usa" || h === "us") return USA_LOCATION_CODE;

  const compact = h.replace(/\s/g, "");
  if (CITY_LOCATION_CODES[compact]) return CITY_LOCATION_CODES[compact];

  for (const [key, code] of Object.entries(CITY_LOCATION_CODES)) {
    if (key.startsWith(`${h},`)) return code;
  }

  return USA_LOCATION_CODE;
}
