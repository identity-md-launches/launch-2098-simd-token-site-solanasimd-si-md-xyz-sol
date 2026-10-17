import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { serveExport } from './serve-export.mjs';
import { CONTRACT, formatUsd } from '../site/data.js';

const require = createRequire(process.env.SOLSIMD_TOOLS ? resolve(process.env.SOLSIMD_TOOLS, 'package.json') : import.meta.url);
const { chromium } = require('playwright');
const preview = await serveExport();
const results = [], measurements = {};
await mkdir('artifacts/screenshots', { recursive: true });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Synthetic review inputs only; no fixture is bundled with site/ or dist/.
  let feed = { name: 'solanaSIMD', symbol: 'SOLSIMD', token: CONTRACT, chain: 'solana', tokenomics: null,
    market: { priceUsd: .1, marketCap: 100000000, volume24h: 10000000, liquidityUsd: 10000000 } };
  await page.route('**/simd-coin.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feed) }));
  const load = async () => {
    await page.goto(preview.url);
    await page.locator('#feed-status').filter({ hasText: 'Updated' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  const refresh = async () => {
    await page.locator('#refresh-data').click();
    await page.waitForFunction(expected => document.querySelector('[data-stat="marketCap"] dd').dataset.value === String(expected), feed.market.marketCap);
    await page.waitForFunction(expected => document.querySelector('[data-stat="priceUsd"] dd').dataset.value === String(expected), feed.market.priceUsd);
    await page.waitForFunction(() => !document.querySelector('#refresh-data').disabled);
  };
  const check = async (name, action) => { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); };
  const marketGeometry = () => page.evaluate(() => ({
    viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    stacked: document.querySelector('#market-stats').classList.contains('is-stacked'),
    values: [...document.querySelectorAll('#market-stats dd')].map(node => ({
      text: node.textContent, width: node.clientWidth, scrollWidth: node.scrollWidth,
      x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y,
      fontSize: getComputedStyle(node).fontSize
    }))
  }));
  const assertAmountsFit = async () => {
    const geometry = await marketGeometry();
    assert.equal(geometry.scrollWidth, geometry.viewport);
    geometry.values.forEach(value => assert.ok(value.scrollWidth <= value.width, `${value.text} exceeds its column`));
    for (const [key, value] of Object.entries(feed.market)) {
      assert.equal(await page.locator(`[data-stat="${key}"] dd`).innerText(), formatUsd(value, key === 'priceUsd'));
    }
    return geometry;
  };

  await check('Long market amounts stay complete and separate at 320/360px, and wider grids adapt to content', async () => {
    measurements.market = [];
    for (const width of [360, 320]) {
      await page.setViewportSize({ width, height: 844 });
      feed.market = width === 360 ? { priceUsd: .1, marketCap: 100000000, volume24h: 10000000, liquidityUsd: 10000000 }
        : { priceUsd: .01, marketCap: 10000000, volume24h: 1000000, liquidityUsd: 1000000 };
      await load(); await page.locator('#market-stats').scrollIntoViewIfNeeded();
      const geometry = await assertAmountsFit();
      assert.equal(new Set(geometry.values.map(value => value.x)).size, 1);
      assert.ok(geometry.values.every(value => value.fontSize === '20px'));
      measurements.market.push(geometry);
      await page.screenshot({ path: `artifacts/screenshots/revision-market-${width}.webp`, type: 'webp', quality: 80 });
    }
    await page.setViewportSize({ width: 900, height: 900 });
    feed.market = { priceUsd: .1, marketCap: 1250, volume24h: 100, liquidityUsd: 1000 };
    await load();
    assert.equal(new Set((await assertAmountsFit()).values.map(value => value.x)).size, 4);
    feed.market.marketCap = 1000000000000; await refresh();
    let geometry = await assertAmountsFit(); assert.equal(geometry.stacked, true); measurements.market.push(geometry);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('#market-stats').classList.contains('is-stacked'));
    measurements.market.push(await assertAmountsFit());
    feed.market.marketCap = 1250; await refresh();
    geometry = await assertAmountsFit(); assert.equal(geometry.stacked, false);
    assert.equal(new Set(geometry.values.map(value => value.x)).size, 4);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addStyleTag({ content: 'html{font-size:200%}' });
    feed.market.marketCap = 1000000000000; await refresh();
    await assertAmountsFit();
  });

  await check('All 24 agent selections preserve hero and action positions at 320, 360 and 390px', async () => {
    measurements.agents = [];
    const position = () => page.evaluate(() => ({
      detail: document.querySelector('#agent-detail').getBoundingClientRect().height,
      title: document.querySelector('#hero-title').getBoundingClientRect().top + scrollY,
      actions: document.querySelector('.hero-actions').getBoundingClientRect().top + scrollY
    }));
    for (const motion of ['reduce', 'no-preference']) {
      await page.emulateMedia({ reducedMotion: motion });
      for (const width of [320, 360, 390]) {
        await page.setViewportSize({ width, height: 844 }); await load();
        const initial = await position(); assert.equal(initial.detail, 72);
        for (const agent of await page.locator('.agent').all()) {
          await agent.evaluate(node => node.click());
          assert.deepEqual(await position(), initial, `${width}px ${motion}: ${await agent.getAttribute('aria-label')}`);
        }
        measurements.agents.push({ width, motion, ...initial });
        if (width === 390) {
          const buy = await page.locator('.hero-actions [data-buy]').boundingBox();
          assert.ok(buy && buy.y + buy.height <= 844);
        }
      }
    }
  });

  await check('A long animated chart connects all 16 observations and remains complete at the 40-observation cap', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    feed.market = { priceUsd: .00000125, marketCap: 1250, volume24h: 100, liquidityUsd: 1000 }; await load();
    const chartGeometry = () => page.locator('.chart-line').evaluate(node => ({
      length: node.getTotalLength(), pathLength: node.getAttribute('pathLength'),
      dasharray: getComputedStyle(node).strokeDasharray, offset: getComputedStyle(node).strokeDashoffset,
      points: node.getAttribute('d').split(' ').length, caption: document.querySelector('#chart-caption').textContent
    }));
    for (let i = 0; i < 15; i++) { feed.market.priceUsd = i % 2 ? .00000125 : .00000126; await refresh(); }
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.chart-line')).strokeDashoffset === '0px');
    const sixteen = await chartGeometry();
    assert.ok(sixteen.length > 1800); assert.equal(sixteen.pathLength, '1');
    assert.equal(sixteen.dasharray, '1px'); assert.equal(sixteen.points, 16);
    await page.locator('#price-chart').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/screenshots/revision-chart-16.webp', type: 'webp', quality: 85 });
    for (let i = 0; i < 27; i++) { feed.market.priceUsd = i % 2 ? .00000125 : .00000126; await refresh(); }
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.chart-line')).strokeDashoffset === '0px');
    const forty = await chartGeometry(); assert.equal(forty.points, 40); assert.equal(forty.pathLength, '1'); assert.equal(forty.dasharray, '1px');
    assert.match(forty.caption, /^40 observations/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.chart-line').evaluate(node => getComputedStyle(node).strokeDasharray), 'none');
    measurements.chart = { sixteen, forty };
  });

  await check('Guide numerals fade out then in, with immediate panels and safe interruption/reduced-motion behavior', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await load();
    const numeral = page.locator('#buy-art-number');
    const clickNext = () => page.locator('#next-step').evaluate(node => node.click());
    const settle = async number => {
      await page.waitForFunction(expected => {
        const node = document.querySelector('#buy-art-number');
        return node.textContent === expected && node.getAnimations().length === 0 && getComputedStyle(node).opacity === '1';
      }, number);
    };
    measurements.numerals = [];
    for (const number of ['2', '3']) {
      const oldNumber = await numeral.textContent();
      // Inspect the transition immediately in the same task as the click, then sample each phase.
      const fadeOut = await page.evaluate(() => {
        document.querySelector('#next-step').click();
        const node = document.querySelector('#buy-art-number'), animation = node.getAnimations()[0];
        animation.pause(); animation.currentTime = 75;
        return { number: node.textContent, opacity: Number(getComputedStyle(node).opacity), duration: animation.effect.getTiming().duration };
      });
      assert.equal(fadeOut.number, oldNumber); assert.ok(fadeOut.opacity > 0 && fadeOut.opacity < 1); assert.equal(fadeOut.duration, 150);
      assert.equal(await page.locator(`#buy-panel-${number}`).isVisible(), true);
      await numeral.evaluate(node => node.getAnimations()[0].finish());
      await page.waitForFunction(expected => document.querySelector('#buy-art-number').textContent === expected, number);
      const fadeIn = await numeral.evaluate(node => {
        const animation = node.getAnimations()[0]; animation.pause(); animation.currentTime = 75;
        return { number: node.textContent, opacity: Number(getComputedStyle(node).opacity), duration: animation.effect.getTiming().duration };
      });
      assert.equal(fadeIn.number, number); assert.ok(fadeIn.opacity > 0 && fadeIn.opacity < 1); assert.equal(fadeIn.duration, 150);
      await numeral.evaluate(node => node.getAnimations()[0].finish()); await settle(number);
      measurements.numerals.push({ fadeOut, fadeIn });
    }
    // Rapid changes must leave only the most recent step; no automatic tab advances.
    await page.evaluate(() => { document.querySelector('#next-step').click(); document.querySelector('#next-step').click(); });
    await settle('2'); assert.equal(await page.locator('#buy-tab-2').getAttribute('aria-selected'), 'true');
    await clickNext(); await page.emulateMedia({ reducedMotion: 'reduce' }); await settle('3');
    await clickNext(); assert.equal(await numeral.textContent(), '1'); assert.equal(await numeral.evaluate(node => node.getAnimations().length), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('.mobile-motion').disabled);
    await page.evaluate(() => { document.querySelector('#next-step').click(); document.querySelector('.mobile-motion').click(); });
    await settle('2'); assert.equal(await page.locator('body').evaluate(node => node.classList.contains('motion-paused')), true);
    await clickNext(); assert.equal(await numeral.textContent(), '3'); assert.equal(await numeral.evaluate(node => node.getAnimations().length), 0);
    assert.deepEqual(errors, []);
  });
} catch (error) {
  results.push({ name: 'Revision validation stopped at the first failed assertion', passed: false, error: error.stack });
  console.error(error); process.exitCode = 1;
} finally {
  if (browser) await browser.close(); await preview.close();
  await writeFile('artifacts/revision-results.json', JSON.stringify({ results, measurements }, null, 2) + '\n');
  console.log(`${results.filter(result => result.passed).length} passed; ${results.filter(result => !result.passed).length} failed.`);
}
