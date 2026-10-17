import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { serveExport } from './serve-export.mjs';
import { CONTRACT, normalizeCoin, numberValue, safeUrl } from '../site/data.js';
const require = createRequire(process.env.SOLSIMD_TOOLS ? resolve(process.env.SOLSIMD_TOOLS, 'package.json') : import.meta.url);
const { chromium, webkit } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const sharp = require('sharp');
await mkdir('test/scratch/screenshots', { recursive: true });
await mkdir('artifacts/screenshots', { recursive: true });
const results = [], limitations = [];
async function check(name, action) { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
const fixture = {
  // Synthetic values are isolated test inputs. They are never copied into site/ or dist/.
  name: 'solanaSIMD', symbol: 'SOLSIMD', chain: 'solana', token: CONTRACT,
  buyUrl: `https://pump.fun/coin/${CONTRACT}?test=buy`, chartUrl: `https://dexscreener.com/solana/${CONTRACT}?test=chart`,
  x: 'https://x.com/SuperIMD_eth', telegram: null,
  market: { priceUsd: .00000125, marketCap: 1250, liquidityUsd: 430, volume24h: 0 },
  tokenomics: { totalSupply: 1000000000, decimals: 6, fixedSupply: true, allocation: [{ label: 'Test curve allocation', percent: 79.3 }, { label: 'Test liquidity allocation', percent: 20.7 }], team: 'Test-only team text', tradingFee: 'Test-only fee text', creatorFeesGoTo: '100% 8HLm…7JqW', launchedOn: 'pump.fun' }
};
await check('Feed validation rejects mismatched tokens, unsafe links, non-finite values, and broken allocations', () => {
  assert.throws(() => normalizeCoin({ ...fixture, token: 'not-the-assigned-token' }));
  assert.throws(() => normalizeCoin({ ...fixture, chain: 'ethereum' }));
  for (const value of [null, '', '  ', false, {}, -1, Infinity, NaN]) assert.equal(numberValue(value), null);
  assert.equal(numberValue(0), 0); assert.equal(numberValue('1.25'), 1.25);
  assert.equal(safeUrl('javascript:alert(1)'), null); assert.equal(safeUrl('http://example.com'), null);
  assert.equal(normalizeCoin({ ...fixture, tokenomics: null }).tokenomics, null);
  assert.deepEqual(normalizeCoin({ ...fixture, tokenomics: { ...fixture.tokenomics, allocation: [{ label: 'Invalid total', percent: 60 }] } }).tokenomics.allocation, []);
});
const preview = await serveExport();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [], failedResources = [], externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (req) => { if (!req.failure()?.errorText?.includes('ABORTED')) failedResources.push(req.url()); });
  page.on('request', (req) => { if (!req.url().startsWith(new URL(preview.url).origin) && !req.url().startsWith('data:')) externalRequests.push(req.url()); });
  let feed = structuredClone(fixture), feedMode = 'success', calls = 0;
  await page.route('**/simd-coin.json', async (route) => {
    calls++;
    if (feedMode === 'fail') return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    if (feedMode === 'malformed') return route.fulfill({ status: 200, contentType: 'application/json', body: '<invalid-json>' });
    if (feedMode === 'timeout') return;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feed) });
  });
  await page.goto(preview.url); await page.locator('#feed-status').filter({ hasText: 'Updated' }).waitFor(); await page.evaluate(() => document.fonts.ready);
  await check('390px first screen contains product, 24 agents, and complete primary action', async () => {
    assert.equal(await page.locator('.agent').count(), 24);
    assert.match(await page.locator('h1').innerText(), /Built by the swarm/);
    const heroBuy = await page.locator('.hero-actions [data-buy]').boundingBox();
    assert(heroBuy && heroBuy.y >= 0 && heroBuy.y + heroBuy.height <= 844);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.hero-actions [data-buy]').getAttribute('href'), fixture.buyUrl);
    for (const link of await page.locator('[data-chart]').all()) assert.equal(await link.getAttribute('href'), fixture.chartUrl);
    assert.equal(await page.locator('[data-stat="volume24h"] dd').innerText(), '$0.00');
    await page.screenshot({ path: 'test/scratch/screenshots/390-test-state.png' });
  });
  await check('Agent grid supports tap, all 24 unique steps, arrows, Home, End, Escape, and visible focus', async () => {
    const agent = page.locator('.agent').first(); await agent.focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.agent').nth(1).evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('.agent').nth(7).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('End'); assert.equal(await page.locator('.agent').last().getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Home'); assert.equal(await agent.getAttribute('aria-pressed'), 'true');
    const outline = await agent.evaluate((node) => { const s=getComputedStyle(node); return [s.outlineStyle,s.outlineWidth]; });
    assert.deepEqual(outline, ['solid', '2px']);
    const names = await page.locator('.agent').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
    assert.equal(new Set(names).size, 24);
    for (let i=0;i<24;i++) { await page.locator('.agent').nth(i).click(); assert.equal(await page.locator('.agent.is-active').count(),1); assert.ok((await page.locator('#agent-description').innerText()).length > 10); }
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.agent.is-active').count(),0);
  });
  await check('Mobile navigation opens, closes with Escape and outside click, and follows section anchors', async () => {
    await page.locator('.menu-toggle').click(); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('.menu-toggle').evaluate((node) => node === document.activeElement),true);
    await page.locator('.menu-toggle').click(); await page.locator('#hero-title').click(); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    await page.locator('.menu-toggle').click(); await page.locator('#nav-links a[href="#chart"]').click();
    assert.equal(new URL(page.url()).hash,'#chart'); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  });
  await check('Real clipboard contains exact final contract and canonical website URL', async () => {
    await page.locator('.contract-large [data-copy]').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), CONTRACT);
    assert.match(await page.locator('#copy-status').innerText(), /Contract address copied/);
    await page.locator('[data-copy="link"]').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()),'https://solanasimd.si-md.xyz/');
  });
  await check('Buy guide switches all three panels, cycles, and supports tab arrow keys', async () => {
    await page.locator('#buy-tab-1').click();
    for(let i=1;i<=3;i++) {
      assert.equal(await page.locator(`#buy-panel-${i}`).isVisible(),true);
      assert.equal(await page.locator('#buy-art-number').textContent(),String(i));
      await page.locator('#next-step').click();
    }
    assert.equal(await page.locator('#buy-tab-1').getAttribute('aria-selected'),'true');
    await page.locator('#buy-tab-1').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#buy-tab-2').getAttribute('aria-selected'),'true');
    await page.keyboard.press('End'); assert.equal(await page.locator('#buy-tab-3').getAttribute('aria-selected'),'true');
    assert.match(await page.locator('#buy-panel-1').innerText(), /SOL/);
  });
  await check('30-second refresh, animated-value endpoints, and honest in-session SVG chart', async () => {
    await page.clock.install(); const before=calls;
    feed.market.priceUsd=.0000015; feed.market.marketCap=1500;
    await page.clock.fastForward(30001); await page.waitForFunction(() => document.querySelector('#tick-chart:not([hidden])'));
    assert(calls > before); assert.match(await page.locator('#tick-chart').getAttribute('aria-label'), /2 observed price updates/);
    assert.equal(await page.locator('[data-stat="marketCap"] dd').innerText(),'$1,500.00');
    assert.equal(await page.locator('#tick-chart .chart-line').count(),1);
  });
  await check('Failed refresh preserves prior values with a clear stale-data message and recovers', async () => {
    feedMode='fail'; await page.locator('#refresh-data').click(); await page.locator('#feed-status').filter({hasText:'showing previous data'}).waitFor();
    assert.equal(await page.locator('[data-stat="marketCap"] dd').innerText(),'$1,500.00');
    feedMode='success'; await page.locator('#refresh-data').click(); await page.locator('#feed-status').filter({hasText:'Updated'}).waitFor();
  });
  await check('Null market and tokenomics hide values and allocation, while supply/holders link to chart', async () => {
    feed={...fixture,market:{priceUsd:null,marketCap:null,liquidityUsd:null,volume24h:null},tokenomics:null};
    await page.locator('#refresh-data').click(); await page.locator('#feed-status').filter({hasText:'Market quotes unavailable'}).waitFor();
    assert.equal(await page.locator('#market-stats').isVisible(),false); assert.equal(await page.locator('#allocation').isVisible(),false);
    assert.match(await page.locator('#supply-value').innerText(), /see the chart/);
    assert.equal(await page.locator('#supply-value a').getAttribute('href'),fixture.chartUrl);
    assert.equal(await page.locator('#fixed-supply-row').isVisible(),false);
    assert.equal(await page.locator('#decimals-row').isVisible(),false);
  });
  await check('All six PNG downloads are real images; X share intents are distinct and prefilled', async () => {
    assert.equal(await page.locator('.meme-item').count(),6);
    for(const link of await page.locator('.meme-image').all()) {
      const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
      assert.match(download.suggestedFilename(), /\.png$/);
      const path=await download.path(); const bytes=await readFile(path); assert.equal(bytes.subarray(1,4).toString(),'PNG');
      const meta=await sharp(bytes).metadata(); assert.equal(meta.width,720); assert.equal(meta.height,600);
    }
    const intents=await page.locator('.share-intent').evaluateAll(nodes=>nodes.map(node=>node.href));
    assert.equal(new Set(intents).size,3);
    intents.forEach(href=>{const url=new URL(href);assert.equal(url.host,'x.com');assert.ok(url.searchParams.get('text').includes('$SOLSIMD'));assert.equal(url.searchParams.get('url'),'https://solanasimd.si-md.xyz/');});
  });
  await check('All local href/src and anchor destinations exist; no empty or inert navigation links', async () => {
    const links=await page.locator('a').evaluateAll(nodes=>nodes.map(node=>({href:node.getAttribute('href'),base:node.baseURI})));
    for(const {href,base} of links) {
      if(href===null) continue; // Hidden Telegram has no destination until the hosting feed supplies one.
      assert(href && href!=='#');
      if(href.startsWith('#')) assert.equal(await page.locator(href).count(),1);
      else if(new URL(href,base).origin===new URL(preview.url).origin) assert.equal((await page.request.get(new URL(href,base).href)).status(),200);
    }
    for(const image of await page.locator('img').all()) assert.equal(await image.evaluate(node=>node.complete && node.naturalWidth>0),true);
    assert.equal(await page.locator('form,input,iframe,canvas').count(),0);
  });
  await check('Production export reflows at 320, 360, 375, 390, 620, 900, 1440 and 1920px', async () => {
    for(const width of [320,360,375,390,620,900,1440,1920]) {
      await page.setViewportSize({width,height:900});
      // Scroll to each section to exercise reveal states and sticky navigation at its actual position.
      for(const section of await page.locator('main>section').all()) await section.scrollIntoViewIfNeeded();
      await page.evaluate(()=>scrollTo(0,0));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}`);
      const overflow=await page.locator('h1,h2,h3,p,code,button:not(.agent),a:not(.meme-image)').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length && n.scrollWidth>n.clientWidth+2 && getComputedStyle(n).display!=='inline').map(n=>n.outerHTML.slice(0,140)));
      assert.deepEqual(overflow,[],`Text overflow at ${width}`);
    }
  });
  await check('Reduced motion stops CSS animations; system font files load; no unexpected network or script errors', async () => {
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.playState==='running').length),0);
    assert.equal(await page.evaluate(()=>document.fonts.check('600 32px Orbitron')),true);
    assert.equal(await page.evaluate(()=>document.fonts.check('400 14px "Fira Mono"')),true);
    assert.deepEqual(errors,[]); assert.deepEqual(failedResources,[]); assert.deepEqual(externalRequests,[]);
  });
  await check('Automated accessibility scan of all revealed content finds no WCAG 2 A/AA violations', async () => {
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    await writeFile('test/scratch/axe.json',JSON.stringify(audit,null,2));
    assert.deepEqual(audit.violations.map(({id,impact,nodes})=>({id,impact,targets:nodes.map(n=>n.target)})),[]);
  });
  await check('200% text enlargement reflows at 390px without losing the primary action or contract', async () => {
    await page.setViewportSize({width:390,height:844}); await page.addStyleTag({content:'html{font-size:200%}'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('.hero-actions [data-buy]').isVisible(),true);
    assert.equal(await page.locator('.contract-large code').innerText(),CONTRACT);
    await page.reload(); await page.locator('.agent').first().waitFor();
  });
  await check('Initial service failure, malformed JSON, mismatched token and timeout offer recovery without fake stats', async () => {
    for(const mode of ['fail','malformed','wrong-token','timeout']) {
      feed=mode==='wrong-token'?{...fixture,token:'different-token'}:structuredClone(fixture);
      feedMode=mode==='wrong-token'?'success':mode;
      await page.reload();
      if(mode==='timeout') await page.clock.fastForward(12001);
      await page.locator('#feed-status').filter({hasText:'refresh to retry'}).waitFor();
      assert.equal(await page.locator('#market-stats').isVisible(),false);
      assert.equal(await page.locator('#allocation').isVisible(),false);
      assert.match(await page.locator('#supply-value').innerText(),/see the chart/);
      assert.equal(await page.locator('#refresh-data').isEnabled(),true);
    }
    feedMode='success'; feed=structuredClone(fixture);
    await page.locator('#refresh-data').click(); await page.locator('#feed-status').filter({hasText:'Updated'}).waitFor();
  });
  await check('Clipboard rejection falls back and reports a useful failure if the platform refuses both paths', async () => {
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Test denial');}}});document.execCommand=()=>false;});
    await page.locator('.contract-large [data-copy]').click();
    assert.match(await page.locator('#copy-status').innerText(),/Select the full contract address/);
    assert.equal(await page.locator('.contract-large code').innerText(),CONTRACT);
  });
  await check('404 page has the same design, valid local assets, and a working home link at 375 and 1440px', async () => {
    for(const width of [375,1440]){
      await page.setViewportSize({width,height:900}); await page.goto(new URL('404.html',preview.url).href); await page.evaluate(()=>document.fonts.ready);
      assert.match(await page.title(),/Specimen not found/); assert.equal(await page.locator('h1').innerText(),'This one escaped the grid.');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.equal(await page.locator('.error-art').evaluate(node=>node.naturalWidth>0),true);
      await page.screenshot({path:`artifacts/screenshots/404-${width}.webp`,type:'webp',quality:75});
      await page.getByRole('link',{name:'Return to the swarm'}).click(); assert.match(await page.title(),/solanaSIMD/);
    }
  });
  // Evidence uses the actual hosting feed, never the synthetic fixture values above.
  const liveResponse=await fetch('https://solanasimd.si-md.xyz/simd-coin.json',{signal:AbortSignal.timeout(12000)});
  if(!liveResponse.ok) throw Error(`Live evidence feed: ${liveResponse.status}`);
  const live=await liveResponse.json();
  await page.unroute('**/simd-coin.json');
  await page.route('**/simd-coin.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(live)}));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await check('Pause/resume motion and hover electric arcs work in the production UI',async()=>{
    await page.setViewportSize({width:1440,height:1000});await page.goto(preview.url);await page.locator('.agent').first().waitFor();
    assert.ok(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)>0);
    await page.locator('.stage-aside .motion-toggle').click(); assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
    await page.locator('.stage-aside .motion-toggle').click(); assert.ok(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)>0);
    await page.locator('.agent').nth(4).hover();assert.equal(await page.locator('.agent').nth(4).getAttribute('aria-pressed'),'true');
    await page.waitForFunction(()=>getComputedStyle(document.querySelectorAll('.agent-arcs')[4]).opacity==='1');
    await page.screenshot({path:'artifacts/screenshots/agent-hover.webp',type:'webp',quality:80});
    await page.mouse.move(10,10);
  });
  await check('Final live-feed screenshots and measured contrast at mobile and desktop widths',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const [width,height] of [[390,844],[375,812],[1440,1000]]){
      await page.setViewportSize({width,height});await page.goto(preview.url);await page.locator('#feed-status').filter({hasText:/Updated|Market quotes unavailable/}).waitFor();await page.evaluate(()=>document.fonts.ready);
      for(const section of await page.locator('main>section').all()) await section.scrollIntoViewIfNeeded();
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`artifacts/screenshots/home-${width}.webp`,type:'webp',quality:80});
      if(width!==375) await page.screenshot({path:`artifacts/screenshots/home-${width}-full.webp`,fullPage:true,type:'webp',quality:70});
    }
    const pairs=await page.evaluate(()=>{
      const names=['.hero-definition','.button-primary','.nav-links a','.contract-strip','[data-stat="volume24h"] dd','.token-data dt','.step-controls button[aria-selected="true"]'];
      return names.map(selector=>{const node=document.querySelector(selector); const s=getComputedStyle(node);let parent=node,bg='';while(parent){bg=getComputedStyle(parent).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)')break;parent=parent.parentElement;}return{selector,foreground:s.color,background:bg};});
    });
    const lum=rgb=>rgb.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
    const contrast=pairs.map(pair=>{const fg=pair.foreground.match(/[\d.]+/g).slice(0,3).map(Number),bg=pair.background.match(/[\d.]+/g).slice(0,3).map(Number);const a=lum(fg),b=lum(bg);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5);return{...pair,ratio:Number(ratio.toFixed(2))};});
    await writeFile('artifacts/contrast.json',JSON.stringify(contrast,null,2)+'\n');
    const metadata=await sharp('dist/dex-header.png').metadata();assert.equal(metadata.width,1500);assert.equal(metadata.height,500);
  });
  await context.close();
  // Run Safari's engine if host libraries permit; be explicit if it cannot launch.
  let safari;
  try { safari=await webkit.launch({headless:true,...(process.env.SOLSIMD_WEBKIT_EXECUTABLE?{executablePath:process.env.SOLSIMD_WEBKIT_EXECUTABLE}:{})}); }
  catch(error){limitations.push(`WebKit could not launch: ${error.message.split('\n').filter(Boolean).slice(0,2).join(' ')}`);console.log('LIMITATION WebKit host dependencies unavailable.');}
  if(safari){
    try{
      const safariPage=await safari.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true,isMobile:true});
      const safariErrors=[];safariPage.on('pageerror',error=>safariErrors.push(error.message));
      let safariFeed=fixture;
      await safariPage.route('**/simd-coin.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(safariFeed)}));
      await safariPage.goto(preview.url);await safariPage.locator('#feed-status').filter({hasText:'Updated'}).waitFor();await safariPage.evaluate(()=>document.fonts.ready);
      await safariPage.locator('.agent').first().tap();assert.equal(await safariPage.locator('.agent.is-active').count(),1);
      await safariPage.keyboard.press('ArrowRight');assert.equal(await safariPage.locator('.agent').nth(1).getAttribute('aria-pressed'),'true');
      await safariPage.locator('.menu-toggle').tap();assert.equal(await safariPage.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
      await safariPage.keyboard.press('Escape');assert.equal(await safariPage.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      await safariPage.locator('#buy-tab-2').tap();assert.equal(await safariPage.locator('#buy-panel-2').isVisible(),true);
      await safariPage.locator('#next-step').tap();assert.equal(await safariPage.locator('#buy-panel-3').isVisible(),true);
      assert.equal(await safariPage.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
      assert.equal(await safariPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(safariErrors,[]);
      safariFeed=live;await safariPage.reload();await safariPage.locator('#feed-status').filter({hasText:/Updated|Market quotes unavailable/}).waitFor();
      await safariPage.evaluate(()=>{scrollTo(0,0);return document.fonts.ready;});
      const safariBuy=await safariPage.locator('.hero-actions [data-buy]').boundingBox();assert(safariBuy && safariBuy.y+safariBuy.height<=844);
      await safariPage.screenshot({path:'artifacts/screenshots/webkit-390.webp',type:'webp',quality:80});
      results.push({name:'WebKit touch and keyboard agent grid, menu, guide, reduced motion and layout at 390px',passed:true});
      console.log('PASS WebKit touch and keyboard interaction at 390px');
    }finally{await safari.close();}
  }
} catch(error){
  results.push({name:'Execution stopped at the first failed assertion',passed:false,error:error.stack});
  console.error(error);process.exitCode=1;
} finally {
  if(browser)await browser.close();await preview.close();
  await writeFile('artifacts/interaction-results.json',JSON.stringify({results,limitations},null,2)+'\n');
  console.log(`${results.filter(r=>r.passed).length} passed; ${results.filter(r=>!r.passed).length} failed.`);
}
