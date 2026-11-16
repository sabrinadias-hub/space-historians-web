// Roteiro de idiomas: escolha PT/EN, troca, ?lang, preferência salva, textos traduzidos.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = process.argv[3] ?? './shots-i18n';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: false, args: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-BR' });
const page = await ctx.newPage();
const errors = [];
const warnings = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning' && /Tradução/.test(m.text())) warnings.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

const text = (selector) => page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? '', selector);
const visible = (selector) => page.isVisible(selector);
// Letras típicas do português que não devem aparecer na interface em inglês.
const portugueseLeftovers = () => page.evaluate(() => {
  const found = document.body.innerText.match(/[^\n]*[çãõáéíóúâêôà][^\n]*/gi) ?? [];
  return found.filter((line) => !/Português|Brasil/.test(line)).slice(0, 5);
});

await page.goto(`${BASE}?reiniciar`);
await page.waitForFunction(() => document.documentElement.dataset.nasaModel, null, { timeout: 60000 });
check('abertura mostra escolha de idioma', (await visible('#language-step')) && !(await visible('#prologue-step')));
check('duas opções: Português e English', (await page.locator('.language-option').count()) === 2);
check('sugere português para navegador pt-BR', await page.evaluate(() => document.querySelector('.language-option.suggested')?.dataset.lang === 'pt'));
await page.screenshot({ path: `${OUT}/01-escolha-idioma.png` });

// Inglês
await page.click('.language-option[data-lang="en"]');
await page.waitForTimeout(300);
check('EN: html lang = en', (await page.evaluate(() => document.documentElement.lang)) === 'en');
check('EN: título da página', (await page.title()).includes('Lunar Archive'));
check('EN: prólogo', (await text('#prologue-eyebrow')).startsWith('PROLOGUE'), await text('#prologue-eyebrow'));
check('EN: botão iniciar', (await text('#start-button')).includes('OPEN THE LUNAR MAP'));
await page.screenshot({ path: `${OUT}/02-prologo-en.png` });

// Trocar idioma antes de começar
await page.click('#change-language');
check('trocar idioma volta à escolha', await visible('#language-step'));
await page.click('.language-option[data-lang="pt"]');
check('PT: prólogo em português', (await text('#prologue-eyebrow')).startsWith('PRÓLOGO'));
check('PT: HUD em português', (await text('#objective-text')) === 'Encontre a estação lunar');
await page.click('#change-language');
await page.click('.language-option[data-lang="en"]');

await page.click('#start-button');
await page.waitForTimeout(600);
check('EN: HUD arquivo', (await text('.progress-card > span')) === 'LUNAR ARCHIVE');
check('EN: HUD objetivo', (await text('.objective small')) === 'CURRENT OBJECTIVE' && (await text('#objective-text')) === 'Find the lunar station');
check('EN: HUD missão', (await text('#mission-eyebrow')) === 'MISSION 01 · APOLLO 12', await text('#mission-eyebrow'));
check('EN: rota', (await text('.route-card .eyebrow')) === 'EXPLORATION ROUTE' && (await text('#route-01 span')).includes('current'));
check('EN: controles', (await text('.controls strong')) === 'WALK');
check('EN: placas 3D em inglês', await page.evaluate(() => !!window.__game.scene.getMeshByName('placa-01 · Apollo 12 ALSEP') && !window.__game.scene.getMeshByName('placa-01 · ALSEP da Apollo 12')));
check('EN: nenhuma letra do português no HUD', (await portugueseLeftovers()).length === 0, (await portugueseLeftovers()).join(' | '));
await page.screenshot({ path: `${OUT}/03-hud-en.png` });

// Aviso e ficha
await page.evaluate(() => window.__game.teleport(0, 5));
await page.waitForTimeout(400);
check('EN: aviso', (await text('#toast-eyebrow')) === 'OBJECT FOUND' && (await text('#investigate-button')).startsWith('INVESTIGATE'));
await page.screenshot({ path: `${OUT}/04-aviso-en.png` });
await page.keyboard.press('e');
await page.waitForTimeout(300);
check('EN: ficha', (await text('#card-eyebrow')) === 'DISCOVERY 01 OF 12' && (await text('#card-title')) === 'Apollo 12 ALSEP');
check('EN: pontos', (await text('#knowledge-score')) === '0 / 60 POINTS');
check('EN: abas', (await page.locator('#story-tabs button').allTextContents()).join('|').includes('What is it?'));
check('EN: rótulos da ficha', (await text('#card-mission')) === 'Apollo 12' && (await page.textContent('dt')) === 'MISSION');
await page.locator('#story-tabs button').nth(0).click();
await page.locator('[data-option="1"]').click();
check('EN: pista em inglês', (await text('.activity-feedback')).startsWith('Clue:'));
await page.locator('[data-option="0"]').click();
check('EN: sucesso em inglês', (await text('.activity-feedback')).includes('+10 points.'));
await page.locator('#story-tabs button').nth(1).click();
check('EN: simulação', (await text('.sim-tag')) === 'GAME REPRESENTATION' && (await text('.sim-action')).includes('Show the records'));
check('EN: aviso da simulação', (await text('.activity-feedback')).startsWith('Use the simulation'));
await page.click('.sim-action');
await page.waitForTimeout(1900);
check('EN: nenhuma letra do português na ficha', (await portugueseLeftovers()).length === 0, (await portugueseLeftovers()).join(' | '));
await page.screenshot({ path: `${OUT}/05-ficha-en.png` });
await page.keyboard.press('Escape');

// ?lang=en pula a escolha
await page.goto(`${BASE}?lang=en`);
await page.waitForFunction(() => document.documentElement.dataset.nasaModel);
check('?lang=en pula a escolha', !(await visible('#language-step')) && (await visible('#prologue-step')) && (await text('#start-button')).includes('OPEN'));

// Preferência lembrada
await page.goto(BASE);
await page.waitForFunction(() => document.documentElement.dataset.nasaModel);
check('última escolha sugerida (en)', await page.evaluate(() => document.querySelector('.language-option.suggested')?.dataset.lang === 'en'));
check('progresso mantido entre idiomas', await page.evaluate(() => JSON.parse(localStorage.getItem('space-historians:progresso:v1'))['01'].includes('identity')));
check('sem avisos de tradução incompleta', warnings.length === 0, warnings.join(' | '));
check('sem erros no console', errors.length === 0, errors.join(' | '));
await browser.close();

// Sem WebGL, em inglês
const noGl = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--disable-3d-apis'] });
const p2 = await noGl.newPage({ viewport: { width: 1366, height: 768 } });
await p2.goto(`${BASE}?lang=en`);
await p2.waitForTimeout(2500);
check('sem WebGL: mensagem em inglês', (await p2.textContent('#no-webgl h2')).includes('3D is turned off'));
await p2.screenshot({ path: `${OUT}/06-sem-webgl-en.png` });
await noGl.close();

fs.writeFileSync(`${OUT}/resultados.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} verificações aprovadas`);
