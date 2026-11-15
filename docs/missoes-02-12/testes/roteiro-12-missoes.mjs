// Roteiro completo: 12 descobertas, atividades, bloqueio em sequência e epílogo.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = process.argv[3] ?? './shots-12';
const VIEWPORT = process.argv[4] === 'tablet' ? { width: 1024, height: 768 } : { width: 1366, height: 768 };
const TOUCH = process.argv[4] === 'tablet';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: false, args: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: VIEWPORT, hasTouch: TOUCH, isMobile: TOUCH });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

const click = (selector) => (TOUCH ? page.tap(selector) : page.click(selector));
const clickLoc = (locator) => (TOUCH ? locator.tap() : locator.click());

await page.goto(`${BASE}?reiniciar`);
await page.waitForFunction(() => document.documentElement.dataset.nasaModel && document.documentElement.dataset.kenneyAssets, null, { timeout: 60000 });
const story = await page.evaluate(() => window.__game.story);
check('12 descobertas nos dados', story.discoveries.length === 12);
await click('#start-button');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/00-inicio.png` });

const isOpen = () => page.evaluate(() => !document.querySelector('#discovery-card').classList.contains('hidden'));
const toast = () => page.evaluate(() => ({
  visible: !document.querySelector('#discovery-toast').classList.contains('hidden'),
  eyebrow: document.querySelector('#toast-eyebrow').textContent,
  title: document.querySelector('#toast-title').textContent,
  button: getComputedStyle(document.querySelector('#investigate-button')).display !== 'none',
}));
async function goTo(index) {
  await page.evaluate((i) => window.__game.teleport(i, 5), index);
  await page.waitForTimeout(450);
}

// Bloqueio: a 02 não abre antes de concluir a 01
await goTo(1);
const locked = await toast();
check('02 bloqueada antes de concluir a 01', locked.visible && locked.eyebrow.includes('BLOQUEADO') && !locked.button, JSON.stringify(locked));
if (!TOUCH) { await page.keyboard.press('e'); await page.waitForTimeout(200); check('tecla E não abre ficha bloqueada', !(await isOpen())); }
await page.screenshot({ path: `${OUT}/01-bloqueada.png` });

async function runSimulation() {
  for (let i = 0; i < 6; i += 1) {
    const action = page.locator('#story-panel .sim-action');
    if (!(await action.count()) || (await action.isDisabled())) break;
    await clickLoc(action);
    await page.waitForTimeout(1300);
  }
  await page.waitForTimeout(2800); // laser leva 2,5 s
}

async function solve(discovery, stepIndex, { tryWrong }) {
  const activity = discovery.steps[stepIndex].activity;
  const type = activity.type ?? 'choice';
  const feedback = () => page.textContent('#story-panel .activity-feedback');
  if (type === 'choice') {
    if (activity.simulation) {
      const waiting = await page.locator('#story-panel .story-options.waiting').count();
      if (!waiting) return 'opções não aguardam a simulação';
      await runSimulation();
    }
    if (tryWrong) {
      const wrong = activity.options.findIndex((_, i) => i !== activity.correct);
      await clickLoc(page.locator(`#story-panel [data-option="${wrong}"]`));
      if (!(await feedback()).startsWith('Pista')) return 'erro sem pista';
    }
    await clickLoc(page.locator(`#story-panel [data-option="${activity.correct}"]`));
  } else if (type === 'match') {
    const rows = page.locator('#story-panel .match-row');
    if (tryWrong && activity.pairs.length > 1) {
      for (let r = 0; r < activity.pairs.length; r += 1) {
        const answer = activity.pairs[(r + 1) % activity.pairs.length].answer;
        await clickLoc(rows.nth(r).locator(`button[data-answer="${answer}"]`));
      }
      if (!(await feedback()).startsWith('Pista')) return 'associação errada sem pista';
    }
    for (let r = 0; r < activity.pairs.length; r += 1) await clickLoc(rows.nth(r).locator(`button[data-answer="${activity.pairs[r].answer}"]`));
  } else if (type === 'order') {
    if (tryWrong) {
      await clickLoc(page.locator('#story-panel .order-pool button', { hasText: activity.sequence[1] }));
      if (!(await feedback()).startsWith('Pista')) return 'ordem errada sem pista';
    }
    for (const label of activity.sequence) await clickLoc(page.locator('#story-panel .order-pool button', { hasText: label }));
  } else {
    await runSimulation();
  }
  await page.waitForTimeout(150);
  const cls = await page.getAttribute('#story-panel .activity-feedback', 'class');
  return cls.includes('success') ? 'ok' : `sem sucesso (${await feedback()})`;
}

for (let i = 0; i < 12; i += 1) {
  const d = story.discoveries[i];
  await goTo(i);
  const t = await toast();
  check(`${d.number} aviso perto do equipamento`, t.visible && t.title === d.title && t.button, `${t.eyebrow}`);
  if (TOUCH) await click('#investigate-button'); else await page.keyboard.press('e');
  await page.waitForTimeout(300);
  if (!(await isOpen())) { check(`${d.number} ficha abre`, false); continue; }
  check(`${d.number} ficha mostra título certo`, (await page.textContent('#card-title')) === d.title);
  const tabs = page.locator('#story-tabs button');
  const problems = [];
  for (let s = 0; s < 3; s += 1) {
    await clickLoc(tabs.nth(s));
    const result = await solve(d, s, { tryWrong: s === 2 || i < 2 });
    if (result !== 'ok') problems.push(`etapa ${s + 1}: ${result}`);
    if (s === 1) await page.screenshot({ path: `${OUT}/${d.number}-etapa2.png` });
  }
  const score = (await page.textContent('#knowledge-score')).trim();
  check(`${d.number} três atividades concluídas, 60 pontos`, problems.length === 0 && score.startsWith('60 /'), problems.join('; ') || score);
  // Reabrir aba concluída mostra o resultado
  await clickLoc(tabs.nth(1));
  check(`${d.number} etapa reaberta mostra sucesso`, (await page.getAttribute('#story-panel .activity-feedback', 'class')).includes('success'));
  await page.screenshot({ path: `${OUT}/${d.number}-ficha.png` });
  await click('#continue-button');
  await page.waitForTimeout(350);
  const count = await page.textContent('#archive-count');
  check(`${d.number} arquivo ${String(i + 1).padStart(2, '0')}/12`, count === String(i + 1).padStart(2, '0'), count);
  if (i === 0) {
    check('objetivo após 01 indica a próxima', (await page.textContent('#objective-text')).includes('Surveyor 3'), await page.textContent('#objective-text'));
    await page.evaluate(() => { window.__game.astronaut.position.set(-4.2, 0, 7); });
    await page.waitForTimeout(400);
    check('seta-guia visível rumo à próxima', await page.evaluate(() => window.__game.scene.getMeshByName('seta-guia').isEnabled()));
    await page.screenshot({ path: `${OUT}/01-seta-guia.png` });
  }
}

const epilogueOpen = await page.evaluate(() => !document.querySelector('#epilogue').classList.contains('hidden'));
check('epílogo aparece ao concluir as 12', epilogueOpen);
if (epilogueOpen) {
  check('epílogo mostra 720 pontos', (await page.textContent('#epilogue-score')).startsWith('720'), await page.textContent('#epilogue-score'));
  await clickLoc(page.locator('#epilogue-favorites button').nth(7));
  await page.screenshot({ path: `${OUT}/99-epilogo.png` });
  await click('#epilogue-close');
  await page.waitForTimeout(300);
}
check('HUD mostra arquivo completo', (await page.textContent('#objective-text')).includes('720'), await page.textContent('#objective-text'));
// Reler ficha concluída pela rota
await clickLoc(page.locator('#route-list button').first());
await page.waitForTimeout(300);
check('rota permite reler ficha concluída', await isOpen());
if (await isOpen()) await click('#continue-button');

await page.goto(BASE);
await page.waitForFunction(() => document.documentElement.dataset.nasaModel);
check('progresso completo salvo após recarregar', (await page.textContent('#archive-count')) === '12');
const favorite = await page.evaluate(() => JSON.parse(localStorage.getItem('space-historians:progresso:v1'))._meta.favorite);
check('favorita salva no diário', favorite === '08', String(favorite));
check('sem erros no console', errors.length === 0, errors.join(' | '));

await browser.close();
fs.writeFileSync(`${OUT}/resultados.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} verificações aprovadas`);
