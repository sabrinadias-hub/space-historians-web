// Rolagem das modais: em cada tamanho de tela, o fim da abertura, da ficha (abas 1 e 3) e do epílogo
// precisa ser alcançável, a roda do mouse precisa rolar a ficha e nada pode rolar para o lado.
// Uso: node roteiro-rolagem.mjs [prefixo de saída] [endereço]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = process.argv[2] ?? './shots-scroll/ficha';
const BASE = process.argv[3] ?? 'http://127.0.0.1:5173/';
const all = {};
const VIEWPORTS = [[1366, 768], [1280, 720], [1024, 768], [900, 900], [1366, 600], [768, 1024], [1024, 600], [390, 844], [844, 390]];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: false, args: ['--use-angle=gl', '--ignore-gpu-blocklist'] });
// Rola todos os ancestrais roláveis até o fim e verifica se o elemento ficou visível dentro de todos os recortes.
const reach = (sel) => {
  const el = document.querySelector(sel); if (!el) return 'ausente';
  const chain = []; for (let n = el.parentElement; n; n = n.parentElement) chain.push(n);
  for (const n of chain) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight) n.scrollTop = n.scrollHeight; }
  const r = el.getBoundingClientRect();
  let top = 0, bottom = innerHeight;
  for (const n of chain) { const cs = getComputedStyle(n); if (cs.overflowY !== 'visible') { const c = n.getBoundingClientRect(); top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); } }
  return r.top >= top - 1 && r.bottom <= bottom + 1 ? 'ok' : `cortado (fundo ${Math.round(r.bottom)} > limite ${Math.round(bottom)})`;
};
let fails = 0;
for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${BASE}?reiniciar&lang=pt`);
  await page.waitForFunction(() => document.documentElement.dataset.nasaModel, null, { timeout: 60000 });
  const intro = await page.evaluate(reach, '#start-button');
  await page.click('#start-button', { force: true }).catch(() => page.evaluate(() => document.querySelector('#start-button').click()));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__game.teleport(0, 5)); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('#investigate-button').click()); await page.waitForTimeout(500);
  const res = { intro };
  for (const t of [0, 2]) {
    await page.evaluate((i) => document.querySelectorAll('.story-tabs button')[i]?.click(), t); await page.waitForTimeout(300);
    res[`aba${t + 1}`] = await page.evaluate(reach, '#continue-button');
  }
  // Nenhuma área da ficha pode rolar para o lado.
  res.horizontal = await page.evaluate(() => {
    const bad = [document.querySelector('#discovery-card'), ...document.querySelectorAll('#discovery-card *')].filter((n) => /(auto|scroll)/.test(getComputedStyle(n).overflowX) && n.scrollWidth > n.clientWidth + 1);
    return bad.length ? `rola para o lado: ${bad.map((n) => n.id || n.className).join(', ')}` : 'ok';
  });
  // Roda do mouse de verdade sobre a ficha.
  res.roda = await (async () => {
    const box = await page.evaluate(() => { const c = document.querySelector('.artifact-card'); c.scrollTop = 0; c.querySelector('.artifact-copy').scrollTop = 0; const r = c.getBoundingClientRect(); return { x: r.right - 60, y: r.top + r.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 400); await page.waitForTimeout(400);
    const moved = await page.evaluate(() => { const c = document.querySelector('.artifact-card'); return c.scrollTop + c.querySelector('.artifact-copy').scrollTop; });
    const needs = await page.evaluate(() => { const c = document.querySelector('.artifact-card'), k = c.querySelector('.artifact-copy'); return c.scrollHeight > c.clientHeight + 1 || k.scrollHeight > k.clientHeight + 1; });
    return !needs || moved > 0 ? 'ok' : 'roda não rola';
  })();
  await page.evaluate(() => { const c = document.querySelector('.artifact-card'); c.scrollTop = 1e5; c.querySelector('.artifact-copy').scrollTop = 1e5; });
  await page.screenshot({ path: `${OUT}-${w}x${h}.png` });
  // Epílogo com conteúdo longo (12 favoritas e textos), aberto direto para medir a rolagem.
  await page.evaluate(() => {
    document.querySelector('#discovery-card').classList.add('hidden');
    const e = document.querySelector('#epilogue'); e.classList.remove('hidden');
    document.querySelector('#epilogue-text').innerHTML = '<p>Texto do epílogo com várias linhas para ocupar espaço na tela.</p>'.repeat(5);
    document.querySelector('#epilogue-favorites').innerHTML = Array.from({ length: 12 }, (_, i) => `<button>${i + 1} Equipamento</button>`).join('');
  });
  await page.waitForTimeout(300);
  res.epilogo = await page.evaluate(reach, '#epilogue-close');
  const bad = Object.values(res).some((v) => v !== 'ok'); if (bad) fails++;
  all[`${w}x${h}`] = res;
  console.log(`${bad ? '❌' : '✅'} ${w}x${h}`, JSON.stringify(res));
  await page.close();
}
await browser.close();
fs.writeFileSync(`${OUT}-resultados.json`, JSON.stringify(all, null, 2));
console.log(fails ? `${fails} tamanho(s) com problema` : 'todos ok');
