// @ts-check
import { CONTRACT, SITE_URL, normalizeCoin, formatUsd } from './data.js';

/** @template {Element} T @param {string} selector @returns {T} */
function element(selector) {
  const found = document.querySelector(selector);
  if (!found) throw new Error(`Required element missing: ${selector}`);
  return /** @type {T} */ (found);
}
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
const motionEnabled = () => !paused && !motionQuery.matches;

// This is an illustrated index of the build, never a claim of agent execution telemetry.
const agents = [
  ['Deployed pump.fun contract', 'The token’s Solana contract identifies this unofficial specimen.'],
  ['Designed logo medallion', 'Wild hair and an existential mustache, pressed into a coin.'],
  ['Wired up price feed', 'Same-origin market observations, refreshed every 30 seconds.'],
  ['Composed the agent grid', 'Six columns, four rows, and a build step behind every head.'],
  ['Set the lime palette', 'Black, white, and #ccff00. Restraint, with a neon exception.'],
  ['Typeset the specimen', 'Orbitron display type meets Fira Mono’s technical rhythm.'],
  ['Mapped the contract link', 'The explorer link opens the exact Solana token address.'],
  ['Built the copy control', 'Copy the full contract without reconstructing an abbreviation.'],
  ['Prepared the market view', 'Missing quotes stay hidden. No invented prices or histories.'],
  ['Drew the circuit traces', 'SVG wiring gives the agent grid its electric backdrop.'],
  ['Assembled the launch scene', 'Three slices of one medallion: type, paint, stamp.'],
  ['Wrote the wallet guide', 'Three steps on pump.fun. This website connects no wallet.'],
  ['Mapped the allocation', 'Tokenomics appear only when the live feed supplies them.'],
  ['Marked the fee recipient', 'The creator’s supplied abbreviated address stays explicit.'],
  ['Cropped the mustache', 'A close-up for the meme lab. Science required a closer look.'],
  ['Equipped the builders', 'Construction helmets, a form sheet, and a very small keyboard.'],
  ['Graded the meme homework', 'A neon desk and an A+ paper. Peer review remains absent.'],
  ['Split the fair-launch meme', 'One side classic, the other sporting a completely artistic chart.'],
  ['Lit the transparency tape', 'A lime address strip turns the creator fee into a composition.'],
  ['Raised the swarm’s hands', 'An entire grid of innocent expressions. No one to blame.'],
  ['Bundled the PNG specimens', 'Every meme has a local PNG download, ready to share.'],
  ['Prepared the social dispatch', 'Choose a prewritten X intent or copy the website link.'],
  ['Adapted the mobile grid', 'The same agent board, with touch targets and arrow-key support.'],
  ['Respected reduced motion', 'The swarm goes still when your system asks it to.']
];

const board = element('#agent-board');
const grid = element('#agent-grid');
/** @type {HTMLButtonElement[]} */
const agentButtons = [];
let selectedAgent = -1;
/** @param {number} index */
function selectAgent(index) {
  selectedAgent = index;
  agentButtons.forEach((button, i) => {
    button.classList.toggle('is-active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
    button.tabIndex = i === index ? 0 : -1;
  });
  element('#agent-role').textContent = agents[index][0];
  element('#agent-description').textContent = agents[index][1];
}
function clearAgent() {
  selectedAgent = -1;
  agentButtons.forEach((button, i) => { button.classList.remove('is-active'); button.setAttribute('aria-pressed', 'false'); button.tabIndex = i === 0 ? 0 : -1; });
  element('#agent-role').textContent = '';
  element('#agent-description').textContent = 'An illustrated build, not a live agent monitor.';
}
agents.forEach(([title], index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'agent';
  button.style.setProperty('--delay', `${-(index % 7)}s`);
  button.style.setProperty('--tilt', `${[-7, 3, -3, 5, 0, -5][index % 6]}deg`);
  button.setAttribute('aria-label', `Agent ${index + 1}: ${title}`);
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-describedby', 'agent-description');
  button.tabIndex = index === 0 ? 0 : -1;
  button.innerHTML = '<svg class="agent-portrait" viewBox="0 0 160 160" aria-hidden="true"><use href="#head"/><path class="agent-arcs" d="m20 59 16-13-4-13 20 6 6-20 15 10L88 9l7 22 24-8-6 21 22 1-9 17M45 111l13-7 12 7 10-6 14 7 12-6 12 7"/></svg><span class="agent-tooltip" aria-hidden="true"></span>';
  /** @type {HTMLElement} */ (button.querySelector('.agent-tooltip')).textContent = title;
  button.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') selectAgent(index); });
  button.addEventListener('focus', () => selectAgent(index));
  button.addEventListener('click', () => selectAgent(index));
  button.addEventListener('keydown', (event) => {
    const movement = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 6, ArrowUp: -6 };
    const change = movement[/** @type {keyof typeof movement} */ (event.key)];
    if (change !== undefined) {
      event.preventDefault();
      agentButtons[(index + change + agents.length) % agents.length].focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); agentButtons[event.key === 'Home' ? 0 : agents.length - 1].focus();
    } else if (event.key === 'Escape') { clearAgent(); }
  });
  agentButtons.push(button); grid.append(button);
});
grid.addEventListener('pointerleave', () => { if (!grid.contains(document.activeElement)) clearAgent(); });
grid.addEventListener('focusout', () => queueMicrotask(() => { if (!grid.contains(document.activeElement) && selectedAgent >= 0) clearAgent(); }));

function updateMotionButtons() {
  document.querySelectorAll('.motion-toggle').forEach((button) => {
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = motionQuery.matches ? 'Motion reduced by system' : paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
    if (button instanceof HTMLButtonElement) button.disabled = motionQuery.matches;
  });
}
document.querySelectorAll('.motion-toggle').forEach((button) => button.addEventListener('click', () => {
  paused = !paused; document.body.classList.toggle('motion-paused', paused); updateMotionButtons();
  if (!motionEnabled()) settleStepNumber();
}));
motionQuery.addEventListener('change', updateMotionButtons); updateMotionButtons();

const menuToggle = /** @type {HTMLButtonElement} */ (element('.menu-toggle'));
const menu = element('#nav-links');
/** @param {boolean} open @param {boolean} [restore] */
function setMenu(open, restore = false) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.classList.toggle('is-open', open);
  if (!open && restore) menuToggle.focus();
}
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') setMenu(false, true); });
document.addEventListener('click', (event) => { if (event.target instanceof Node && !menu.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false); });
matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));

let toastTimer = 0;
/** @type {HTMLElement | null} */
let lastCopyTrigger = null;
function dismissNotice() {
  /** @type {HTMLElement} */ (element('#copy-status')).hidden = true;
  clearTimeout(toastTimer); lastCopyTrigger?.focus({ preventScroll: true });
}
element('#dismiss-notice').addEventListener('click', dismissNotice);
/** @param {string} message @param {boolean} [persistent] */
function notify(message, persistent = false) {
  const status = /** @type {HTMLElement} */ (element('#copy-status'));
  element('#copy-message').textContent = message; status.hidden = false; status.classList.add('is-visible');
  clearTimeout(toastTimer);
  if (!persistent) toastTimer = window.setTimeout(() => { status.hidden = true; }, 5000);
}
/** @param {string} text */
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Try the native selection fallback. */ }
  }
  const previous = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = text; textarea.setAttribute('readonly', ''); textarea.setAttribute('aria-label', 'Text to copy');
  textarea.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none;';
  document.body.append(textarea); textarea.select();
  const copied = document.execCommand('copy'); textarea.remove();
  if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
  if (!copied) throw new Error('Clipboard unavailable');
}
document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  lastCopyTrigger = /** @type {HTMLElement} */ (button);
  const contract = button.getAttribute('data-copy') === 'contract';
  try { await copyText(contract ? CONTRACT : SITE_URL); notify(contract ? 'Contract address copied.' : 'Website link copied.'); }
  catch { notify(contract ? 'Copy unavailable. Select the full contract address shown on this page.' : `Copy unavailable. The website is ${SITE_URL}`, true); }
}));

const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[role="tab"]'));
let currentStep = 0;
const stepNumber = element('#buy-art-number');
/** @type {Animation | null} */
let stepFade = null;
function settleStepNumber() {
  stepFade?.cancel(); stepFade = null;
  stepNumber.textContent = String(currentStep + 1);
}
function updateStepNumber() {
  const number = String(currentStep + 1);
  const changed = stepNumber.textContent !== number;
  stepFade?.cancel(); stepFade = null;
  if (!changed || !motionEnabled()) { settleStepNumber(); return; }
  const timing = { duration: 150, easing: 'cubic-bezier(.2,0,0,1)' };
  const fadeOut = stepNumber.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, fill: 'forwards' });
  stepFade = fadeOut;
  fadeOut.onfinish = () => {
    if (stepFade !== fadeOut) return;
    stepNumber.textContent = number; fadeOut.cancel();
    const fadeIn = stepNumber.animate([{ opacity: 0 }, { opacity: 1 }], timing);
    stepFade = fadeIn;
    fadeIn.onfinish = () => { if (stepFade === fadeIn) stepFade = null; };
  };
}
motionQuery.addEventListener('change', () => { if (motionQuery.matches) settleStepNumber(); });
/** @param {number} step @param {boolean} [focus] */
function showStep(step, focus = false) {
  currentStep = step;
  tabs.forEach((tab, index) => {
    tab.setAttribute('aria-selected', String(index === step)); tab.tabIndex = index === step ? 0 : -1;
    /** @type {HTMLElement} */ (element(`#buy-panel-${index + 1}`)).hidden = index !== step;
  });
  updateStepNumber();
  element('#next-step').innerHTML = `${step === 2 ? 'Back to step 1' : 'Next step'} <svg class="icon" aria-hidden="true"><use href="#chevron"/></svg>`;
  if (focus) tabs[step].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showStep(index));
  tab.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showStep((index + (event.key === 'ArrowRight' ? 1 : 2)) % 3, true); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); showStep(event.key === 'Home' ? 0 : 2, true); }
  });
});
element('#next-step').addEventListener('click', () => showStep((currentStep + 1) % 3));

if ('IntersectionObserver' in window && !motionQuery.matches) {
  const reveals = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); reveals.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((item, index) => {
    if (item.getBoundingClientRect().top > innerHeight) {
      item.classList.add('is-pending'); /** @type {HTMLElement} */ (item).style.setProperty('--reveal-delay', `${index % 3 * 80}ms`); reveals.observe(item);
    }
  });
}
document.querySelectorAll('.magnetic').forEach((button) => {
  button.addEventListener('pointermove', (raw) => {
    const event = /** @type {PointerEvent} */ (raw);
    if (!motionEnabled() || event.pointerType !== 'mouse' || !matchMedia('(hover: hover)').matches) return;
    const rect = button.getBoundingClientRect();
    /** @type {HTMLElement} */ (button).style.translate = `${(event.clientX - rect.left - rect.width / 2) * .055}px ${(event.clientY - rect.top - rect.height / 2) * .08}px`;
  });
  button.addEventListener('pointerleave', () => { /** @type {HTMLElement} */ (button).style.translate = ''; });
});

/** @type {{price:number, time:number}[]} */
const ticks = [];
/** @type {Map<Element, number>} */
const numberFrames = new Map();
const marketStats = /** @type {HTMLElement} */ (element('#market-stats'));
function fitMarketStats() {
  if (marketStats.hidden) return;
  // Try the responsive columns first; a full amount must fit before we keep them.
  marketStats.classList.remove('is-stacked');
  const overflow = [...marketStats.querySelectorAll('dd')].some((value) => value.scrollWidth > value.clientWidth);
  marketStats.classList.toggle('is-stacked', overflow);
}
new ResizeObserver(fitMarketStats).observe(marketStats);
void document.fonts.ready.then(fitMarketStats);
/** @param {HTMLElement} target @param {number} value @param {boolean} isPrice */
function animateNumber(target, value, isPrice) {
  const previous = Number(target.dataset.value);
  const oldFrame = numberFrames.get(target); if (oldFrame) cancelAnimationFrame(oldFrame);
  target.dataset.value = String(value);
  if (!motionEnabled() || !Number.isFinite(previous) || previous === value) { target.textContent = formatUsd(value, isPrice); return; }
  const start = performance.now();
  /** @param {number} now */
  const frame = (now) => {
    const progress = Math.min((now - start) / 500, 1);
    target.textContent = formatUsd(previous + (value - previous) * (1 - (1 - progress) ** 3), isPrice);
    if (progress < 1 && motionEnabled()) numberFrames.set(target, requestAnimationFrame(frame));
    else { target.textContent = formatUsd(value, isPrice); numberFrames.delete(target); }
    fitMarketStats();
  };
  numberFrames.set(target, requestAnimationFrame(frame));
}

const chart = /** @type {SVGSVGElement} */ (element('#tick-chart'));
const chartEmpty = /** @type {HTMLElement} */ (element('#chart-empty'));
const svgNS = 'http://www.w3.org/2000/svg';
/** @param {string} tag @param {Record<string, string | number>} attrs @param {string} [text] */
function svgElement(tag, attrs, text) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text) node.textContent = text;
  return node;
}
function drawChart() {
  if (ticks.length < 2) return;
  chart.removeAttribute('hidden'); chartEmpty.hidden = true;
  const width = Math.max(280, Math.round(element('#price-chart').getBoundingClientRect().width));
  const height = 280, pad = 24, end = width - 100;
  chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const prices = ticks.map((tick) => tick.price), min = Math.min(...prices), max = Math.max(...prices);
  const points = ticks.map((tick, index) => ({ x: pad + (index / (ticks.length - 1)) * (end - pad), y: max === min ? 132 : 36 + (1 - (tick.price - min) / (max - min)) * 190, price: tick.price }));
  chart.replaceChildren();
  chart.append(svgElement('path', { d: points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '), pathLength: 1, fill: 'none', stroke: '#ccff00', 'stroke-width': 2, class: 'chart-line' }));
  points.forEach((point, index) => {
    const size = point.price === min || point.price === max ? 18 : 12;
    // On long sessions keep the line readable while preserving first/last and extrema.
    if (points.length > 12 && index % 3 && index !== points.length - 1 && point.price !== min && point.price !== max) return;
    chart.append(svgElement('use', { href: '#coin', x: point.x - size / 2, y: point.y - size / 2, width: size, height: size }));
  });
  const latest = points[points.length - 1];
  chart.append(svgElement('text', { x: end + 12, y: latest.y + 4, fill: '#ccff00', 'font-family': 'Fira Mono, monospace', 'font-size': 12 }, formatUsd(latest.price, true)));
  const timeFormat = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  chart.append(svgElement('text', { x: pad, y: 267, fill: '#a3a69c', 'font-family': 'Fira Mono, monospace', 'font-size': 12 }, timeFormat.format(ticks[0].time)));
  chart.append(svgElement('text', { x: end, y: 267, fill: '#a3a69c', 'text-anchor': 'end', 'font-family': 'Fira Mono, monospace', 'font-size': 12 }, timeFormat.format(ticks[ticks.length - 1].time)));
  chart.setAttribute('aria-label', `${ticks.length} observed price updates. Latest ${formatUsd(latest.price, true)}. Session low ${formatUsd(min, true)}, high ${formatUsd(max, true)}.`);
  element('#chart-caption').textContent = `${ticks.length} observations in this browser session. Earlier activity is on the full chart.`;
}
new ResizeObserver(() => drawChart()).observe(element('#price-chart'));

/** @param {import('./data.js').Coin} coin */
function renderCoin(coin) {
  if (coin.buyUrl) document.querySelectorAll('a[data-buy]').forEach((link) => link.setAttribute('href', /** @type {string} */ (coin.buyUrl)));
  if (coin.chartUrl) document.querySelectorAll('a[data-chart]').forEach((link) => link.setAttribute('href', /** @type {string} */ (coin.chartUrl)));
  if (coin.x) {
    const social = element('#community-x'); social.setAttribute('href', coin.x);
    const handle = new URL(coin.x).pathname.split('/').filter(Boolean)[0];
    social.childNodes[0].textContent = handle ? `Follow @${handle} ` : 'Follow on X ';
  }
  const telegram = /** @type {HTMLAnchorElement} */ (element('#community-telegram'));
  telegram.hidden = !coin.telegram;
  if (coin.telegram) telegram.href = coin.telegram;
  let visibleStats = 0;
  for (const [key, value] of Object.entries(coin.market)) {
    const row = /** @type {HTMLElement} */ (element(`[data-stat="${key}"]`));
    row.hidden = value === null;
    if (value !== null) { visibleStats++; animateNumber(/** @type {HTMLElement} */ (row.querySelector('dd')), value, key === 'priceUsd'); }
  }
  marketStats.hidden = !visibleStats;
  fitMarketStats();
  const supply = element('#supply-value'), tokenomics = coin.tokenomics;
  if (tokenomics && tokenomics.totalSupply !== null) supply.textContent = new Intl.NumberFormat('en-US').format(tokenomics.totalSupply);
  else {
    const link = document.createElement('a'); link.href = coin.chartUrl || /** @type {HTMLAnchorElement} */ (element('a[data-chart]')).href; link.textContent = 'see the chart ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('data-chart', ''); supply.replaceChildren(link);
  }
  const fixedRow = /** @type {HTMLElement} */ (element('#fixed-supply-row'));
  fixedRow.hidden = !tokenomics || tokenomics.fixedSupply === null;
  element('#fixed-supply-value').textContent = tokenomics?.fixedSupply === true ? 'Fixed supply' : 'Variable supply';
  /** @type {HTMLElement} */ (element('#decimals-row')).hidden = tokenomics?.decimals == null;
  element('#decimals-value').textContent = tokenomics?.decimals != null ? String(tokenomics.decimals) : '';
  const allocation = tokenomics?.allocation || [];
  /** @type {HTMLElement} */ (element('#allocation')).hidden = !allocation.length;
  const bar = element('#allocation-bar'), legend = element('#allocation-legend'); bar.replaceChildren(); legend.replaceChildren();
  allocation.forEach(({ label, percent }) => {
    const segment = document.createElement('span'); segment.style.flexBasis = `${percent}%`; bar.append(segment);
    const item = document.createElement('li'), name = document.createElement('span'), value = document.createElement('span');
    name.textContent = label; value.textContent = `${percent}%`; item.append(name, value); legend.append(item);
  });
  const team = /** @type {HTMLElement} */ (element('#team-note'));
  team.hidden = !tokenomics?.team; team.textContent = tokenomics?.team || '';
  const fee = /** @type {HTMLElement} */ (element('#trading-fee'));
  fee.hidden = !tokenomics?.tradingFee; fee.textContent = tokenomics?.tradingFee ? `Trading fee: ${tokenomics.tradingFee}` : '';
  if (coin.market.priceUsd !== null) {
    const previous = ticks.at(-1)?.price;
    ticks.push({ price: coin.market.priceUsd, time: Date.now() }); if (ticks.length > 40) ticks.shift();
    if (previous !== undefined && previous !== coin.market.priceUsd && motionEnabled()) {
      board.classList.remove('has-tick'); void /** @type {HTMLElement} */ (board).offsetWidth; board.classList.add('has-tick');
    }
    if (ticks.length === 1) {
      element('#chart-empty-title').textContent = 'First observation received.';
      element('#chart-empty-copy').textContent = 'The session chart begins with the next price update. Keep this page open or explore earlier activity on the full chart.';
    }
    drawChart();
  }
  return visibleStats;
}

let inFlight = false, hadSuccess = false;
const refresh = /** @type {HTMLButtonElement} */ (element('#refresh-data'));
async function refreshData() {
  if (inFlight) return;
  inFlight = true; refresh.disabled = true;
  const status = element('#feed-status');
  if (!hadSuccess) status.textContent = 'Requesting market data';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/simd-coin.json', { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Market response ${response.status}`);
    const coin = normalizeCoin(await response.json());
    const count = renderCoin(coin); hadSuccess = true;
    const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
    status.textContent = count ? `Updated ${time} · local time` : 'Market quotes unavailable · view the full chart';
    if (coin.market.priceUsd === null && !ticks.length) {
      element('#chart-empty-title').textContent = 'Price is not available yet.';
      element('#chart-empty-copy').textContent = 'The feed has no price quote for this token right now. Check the full chart or refresh the data.';
    }
  } catch {
    status.textContent = hadSuccess ? 'Update unavailable · showing previous data' : 'Live feed unavailable · refresh to retry';
    if (!hadSuccess) {
      element('#chart-empty-title').textContent = 'The feed is taking a breather.';
      element('#chart-empty-copy').textContent = 'Live market data could not be loaded. Refresh to try again, or open the full chart on DexScreener.';
    }
  } finally { clearTimeout(timeout); inFlight = false; refresh.disabled = false; }
}
refresh.addEventListener('click', refreshData);
let refreshTimer = window.setInterval(() => { if (!document.hidden) void refreshData(); }, 30000);
document.addEventListener('visibilitychange', () => {
  clearInterval(refreshTimer);
  if (!document.hidden) { void refreshData(); refreshTimer = window.setInterval(() => { void refreshData(); }, 30000); }
});
void refreshData();
