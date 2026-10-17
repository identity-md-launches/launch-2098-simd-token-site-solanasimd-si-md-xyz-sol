// Rebuild the supplied-logo compositions with SVG and headless-browser rasterization.
// No image generation service, canvas, external asset fetch, or runtime rendering dependency.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(process.env.SOLSIMD_TOOLS ? resolve(process.env.SOLSIMD_TOOLS, 'package.json') : import.meta.url);
const sharp = require('sharp');
const { chromium } = require('playwright');
const root = new URL('../site/', import.meta.url);
const image = `data:image/webp;base64,${(await readFile(new URL('assets/logo.webp', root))).toString('base64')}`;
const displayFont = (await readFile(new URL('assets/fonts/orbitron-latin.woff2', root))).toString('base64');
const bodyFont = (await readFile(new URL('assets/fonts/fira-mono-regular.woff2', root))).toString('base64');
const fontStyle = `<style>@font-face{font-family:Orbitron;src:url(data:font/woff2;base64,${displayFont})} @font-face{font-family:Fira;src:url(data:font/woff2;base64,${bodyFont})}text{font-family:Fira,monospace}</style>`;
const logoSymbol = `<symbol id="meme-logo" viewBox="0 0 768 768"><image href="${image}" width="768" height="768"/></symbol>`;
const coin = (x, y, size, extra='') => `<use href="#meme-logo" x="${x}" y="${y}" width="${size}" height="${size}" ${extra}/>`;
const line = (x1,y1,x2,y2,extra='') => `<path d="M${x1} ${y1} ${x2} ${y2}" stroke="#ccff00" fill="none" ${extra}/>`;
const title = (lines) => lines.map((text,i)=>`<text x="40" y="${510+i*38}" fill="#f5f5f5" font-size="26">${text.replace(/&/g,'&amp;')}</text>`).join('');
const base = (content, lines, background='#030303') => `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="600" viewBox="0 0 720 600">${fontStyle}<defs>${logoSymbol}<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="#24271a" stroke-width="1"/></pattern><clipPath id="scene"><rect x="0" y="0" width="720" height="458"/></clipPath></defs><rect width="720" height="600" fill="${background}"/><rect width="720" height="458" fill="url(#grid)"/><g clip-path="url(#scene)">${content}</g><rect x="0" y="458" width="720" height="142" fill="#0c0c0c"/>${line(40,458,680,458)}${title(lines)}<path d="M18 18h24m-24 0v24m684-24h-24m24 0v24" stroke="#ccff00" fill="none"/></svg>`;
const helmet = (cx,cy) => `<g transform="translate(${cx} ${cy})"><path d="M-42 0q0-46 42-46T42 0z" fill="#ccff00" stroke="#030303" stroke-width="4"/><path d="M-51 0H51M0-45V-8" stroke="#030303" stroke-width="6"/></g>`;
const arms = (cx,cy,size=1) => `<g transform="translate(${cx} ${cy}) scale(${size})" fill="none" stroke="#f5f5f5" stroke-width="9" stroke-linecap="round"><path d="M-32 8-55-6-69-54m98 62 25-14 16-48"/><path d="m-69-54-10-9m10 9-1-15m71 15 10-9m-10 9 1-15" stroke-width="5"/></g>`;
const memes = [
  { name:'mustache', svg:base(`${coin(-235,-480,1200)}<path d="M170 250q120-60 180-17 70-43 177 14" fill="none" stroke="#ccff00" stroke-width="12" opacity=".7"/><path d="M42 380h102m430 0h104" stroke="#ccff00" stroke-width="2"/>`,['AI built this coin.','The mustache built the legend.']) },
  { name:'builders', svg:base(Array.from({length:8},(_,i)=>{const x=56+(i%4)*160,y=65+Math.floor(i/4)*180;return coin(x,y,130)+helmet(x+65,y+29);}).join('')+`<g fill="#0c0c0c" stroke="#ccff00" stroke-width="2"><rect x="62" y="332" width="89" height="97" transform="rotate(-8 62 332)"/><path d="M76 348h48m-48 14h48m-48 14h28m455-22h100v48H531z"/></g><path d="M543 367h76m-76 14h76" stroke="#ccff00"/>`,['One form. Infinite agents.','Zero promises.']) },
  { name:'homework', svg:base(`${coin(175,15,370)}<path d="M174 340q75-25 150 24m222-24q-75-25-150 24" fill="none" stroke="#f5f5f5" stroke-width="21" stroke-linecap="round"/><path d="M85 372h550v30H85z" fill="#0c0c0c" stroke="#ccff00" stroke-width="3"/><path d="M116 402v80m488-80v80" stroke="#ccff00" stroke-width="9"/><g transform="translate(420 318) rotate(-10)"><rect width="130" height="76" fill="#f5f5f5"/><text x="28" y="54" font-size="42" fill="#030303">A+</text></g>`,['When AI does your','meme homework:']) },
  { name:'fair-meme', svg:base(`<defs><clipPath id="classic"><rect width="360" height="460"/></clipPath><clipPath id="lime"><rect x="360" width="360" height="460"/></clipPath></defs><rect x="360" width="360" height="458" fill="#ccff00"/><g clip-path="url(#classic)">${coin(130,0,460)}</g><g clip-path="url(#lime)">${coin(130,0,460)}<path d="M350 195h140l-10 63h-49l-20-31-13 31h-45z" fill="#030303" stroke="#ccff00" stroke-width="3"/><path d="M410 387 454 347 485 363 528 311 569 320 638 239" fill="none" stroke="#030303" stroke-width="6"/></g><path d="M360 0v458" stroke="#ccff00" stroke-width="3"/>`,['Fair launch?','More like fair meme.']) },
  { name:'transparency', svg:base(`${coin(175,10,370)}<path d="m220 264-82 48 37 59m321-107 82 48-37 59" fill="none" stroke="#f5f5f5" stroke-width="15" stroke-linecap="round"/><path d="m246 250-70 100h368L453 250" fill="#ccff00" opacity=".08"/><rect x="120" y="323" width="480" height="80" rx="4" fill="#ccff00" fill-opacity=".18" stroke="#ccff00" stroke-width="2"/><text x="360" y="374" font-size="32" text-anchor="middle" fill="#ccff00">100% → 8HLm…7JqW</text>`,['Creator fee 100% onchain.','Transparency flex.']) },
  { name:'innocent', svg:base(Array.from({length:6},(_,i)=>{const x=68+(i%3)*215,y=35+Math.floor(i/3)*210;return coin(x,y,155)+arms(x+77,y+125,.8)+`<g fill="#f5f5f5" stroke="#030303" stroke-width="2"><ellipse cx="${x+63}" cy="${y+70}" rx="11" ry="15"/><ellipse cx="${x+92}" cy="${y+70}" rx="11" ry="15"/></g><g fill="#030303"><circle cx="${x+63}" cy="${y+69}" r="5"/><circle cx="${x+92}" cy="${y+69}" r="5"/></g>`;}).join(''),['Swarm-built means','no one to blame.']) }
];
const header = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500">${fontStyle}<defs>${logoSymbol}<pattern id="grid" width="62.5" height="62.5" patternUnits="userSpaceOnUse"><path d="M62.5 0H0v62.5" fill="none" stroke="#232619"/></pattern></defs><rect width="1500" height="500" fill="#030303"/><rect width="1500" height="500" fill="url(#grid)"/><circle cx="278" cy="250" r="219" fill="#ccff000e" stroke="#ccff00" stroke-width="1"/>${coin(78,50,400)}<text x="550" y="237" fill="#f5f5f5" font-family="Orbitron" style="font-family:Orbitron" font-weight="700" font-size="91">solana<tspan fill="#ccff00">SIMD</tspan></text><text x="557" y="331" fill="#ccff00" font-size="60">$SOLSIMD</text><path d="M550 370h790M30 30h50m-50 0v50m1440 390h-50m50 0v-50" stroke="#ccff00" fill="none"/></svg>`;
await mkdir(new URL('assets/memes/',root),{recursive:true});
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({deviceScaleFactor:1});
  async function render(svg, width, height) {
    await page.setViewportSize({width,height});
    await page.setContent(`<html><head><style>html,body{margin:0;width:100%;height:100%;background:#030303}svg{display:block}</style></head><body>${svg}</body></html>`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
    return page.screenshot({type:'png',animations:'disabled'});
  }
  for(const meme of memes){
    const png=await render(meme.svg,720,600);
    await writeFile(new URL(`assets/memes/${meme.name}.svg`,root),meme.svg);
    await sharp(png).png({palette:true,colours:64,compressionLevel:9}).toFile(new URL(`assets/memes/${meme.name}.png`,root).pathname);
    await sharp(png).webp({quality:80}).toFile(new URL(`assets/memes/${meme.name}.webp`,root).pathname);
  }
  await writeFile(new URL('assets/dex-header.svg',root),header);
  await sharp(await render(header,1500,500)).png({palette:true,colours:96,compressionLevel:9}).toFile(new URL('dex-header.png',root).pathname);
  console.log('Generated six original-logo SVG / PNG / WebP meme compositions and the 1500×500 DexScreener header.');
}finally{await browser.close();}
