// @ts-check

export const CONTRACT = 'GCqB4jMYPJ5fYNVAu2vrRA9qTBtzjSHtXqjVC1eQLBsU';
export const SITE_URL = 'https://solanasimd.si-md.xyz/';

/** @typedef {{ label: string, percent: number }} Allocation */
/** @typedef {{ totalSupply: number | null, decimals: number | null, fixedSupply: boolean | null, allocation: Allocation[], team: string | null, tradingFee: string | null, creatorFeesGoTo: string | null, launchedOn: string | null }} Tokenomics */
/** @typedef {{ priceUsd: number | null, marketCap: number | null, liquidityUsd: number | null, volume24h: number | null }} Market */
/** @typedef {{ market: Market, tokenomics: Tokenomics | null, buyUrl: string | null, chartUrl: string | null, x: string | null, telegram: string | null }} Coin */

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function isRecord(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }

/** @param {unknown} value @returns {number | null} */
export function numberValue(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

/** @param {unknown} value @returns {string | null} */
export function textValue(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }

/** @param {unknown} value @returns {string | null} */
export function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Validate the feed before rendering it. Names and the token contract never change from the brief.
 * @param {unknown} input @returns {Coin}
 */
export function normalizeCoin(input) {
  if (!isRecord(input) || input.token !== CONTRACT || input.chain !== 'solana') {
    throw new Error('The market response does not identify this Solana token.');
  }
  const market = isRecord(input.market) ? input.market : {};
  const raw = isRecord(input.tokenomics) ? input.tokenomics : null;
  /** @type {Allocation[]} */
  const allocation = [];
  if (raw && Array.isArray(raw.allocation)) {
    for (const item of raw.allocation) {
      if (!isRecord(item)) continue;
      const label = textValue(item.label), percent = numberValue(item.percent);
      if (label && percent !== null && percent <= 100) allocation.push({ label, percent });
    }
  }
  // An allocation bar is only meaningful if the reported percentages form a whole.
  const sum = allocation.reduce((total, item) => total + item.percent, 0);
  const totalSupply = raw ? numberValue(raw.totalSupply) : null;
  const decimals = raw ? numberValue(raw.decimals) : null;
  return {
    market: { priceUsd: numberValue(market.priceUsd), marketCap: numberValue(market.marketCap), liquidityUsd: numberValue(market.liquidityUsd), volume24h: numberValue(market.volume24h) },
    tokenomics: raw ? {
      totalSupply,
      decimals: decimals !== null && Number.isInteger(decimals) && decimals <= 255 ? decimals : null,
      fixedSupply: typeof raw.fixedSupply === 'boolean' ? raw.fixedSupply : null,
      allocation: allocation.length && Math.abs(sum - 100) < .05 ? allocation : [],
      team: textValue(raw.team), tradingFee: textValue(raw.tradingFee), creatorFeesGoTo: textValue(raw.creatorFeesGoTo), launchedOn: textValue(raw.launchedOn)
    } : null,
    buyUrl: safeUrl(input.buyUrl), chartUrl: safeUrl(input.chartUrl), x: safeUrl(input.x), telegram: safeUrl(input.telegram)
  };
}

/** @param {number} value @param {boolean} [isPrice] */
export function formatUsd(value, isPrice = false) {
  if (isPrice && value > 0 && value < .000001) return `$${value.toPrecision(4)}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: isPrice && value < 1 ? 8 : 2, minimumFractionDigits: isPrice && value < 1 ? 0 : 2 }).format(value);
}
