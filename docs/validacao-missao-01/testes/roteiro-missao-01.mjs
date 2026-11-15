// Roteiro de validação da Missão 01 — Space Historians (v2)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = process.argv[3] ?? './shots';
const ONLY = process.argv[4]; // 'desktop' | 'tablet'
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: false,
  args: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'],
});

const state = (page) => page.evaluate(() => {
  const g = window.__game;
  const r = (v) => ({ x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) });
  const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  return {
    astro: r(g.astronaut.position), cam: r(g.camera.position), tgt: r(g.camera.target), alpha: g.camera.alpha,
    distStation: d(g.astronaut.position, g.station.position), distLM: d(g.astronaut.position, g.landingSite.position),
    toast: !document.querySelector('#discovery-toast').classList.contains('hidden'),
    card: !document.querySelector('#discovery-card').classList.contains('hidden'),
  };
});

async function holdUntil(page, key, predicate, timeout = 15000) {
  await page.keyboard.down(key);
  const t0 = Date.now();
  let s = await state(page);
  while (!predicate(s) && Date.now() - t0 < timeout) { await page.waitForTimeout(50); s = await state(page); }
  await page.keyboard.up(key);
  return { s, ms: Date.now() - t0 };
}

async function placeInFrontOfStation(page, dist = 4.5) {
  await page.evaluate((dist) => {
    const g = window.__game;
    g.astronaut.position.x = g.station.position.x;
    g.astronaut.position.z = g.station.position.z + dist;
    g.camera.alpha = Math.PI / 2;
    g.camera.target.copyFrom(g.astronaut.position.add(new g.astronaut.position.constructor(0, 1.5, 0)));
  }, dist);
  await page.waitForTimeout(400);
}

async function stationScreenPoint(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const mesh = g.station.getChildMeshes().find((m) => m.name === 'alsep-central');
    const c = mesh.getBoundingInfo().boundingSphere.centerWorld;
    const V = c.constructor;
    const engine = g.scene.getEngine();
    const w = engine.getRenderWidth(), h = engine.getRenderHeight();
    const M = g.scene.getTransformMatrix().constructor;
    const p = V.Project(c, M.Identity(), g.scene.getTransformMatrix(), g.camera.viewport.toGlobal(w, h));
    const rect = engine.getRenderingCanvas().getBoundingClientRect();
    return { x: rect.left + (p.x / w) * rect.width, y: rect.top + (p.y / h) * rect.height };
  });
}

async function desktop() {
  console.log('\n=== DESKTOP 1366x768 ===');
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}?reiniciar`);
  await page.waitForFunction(() => document.documentElement.dataset.nasaModel && document.documentElement.dataset.kenneyAssets, null, { timeout: 60000 });
  const ds = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  check('modelos 3D carregados', ds.nasaModel === 'loaded' && ds.kenneyAssets === 'loaded', JSON.stringify(ds));
  check('prólogo preenchido', await page.evaluate(() => document.querySelector('#prologue-pages').textContent.length > 50));
  await page.screenshot({ path: `${OUT}/d01-intro.png` });

  await page.click('#start-button');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/d02-cena-inicial.png` });

  // Setas não giram a câmera
  const a0 = (await state(page)).alpha;
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  check('setas não giram a câmera', Math.abs((await state(page)).alpha - a0) < 0.01);

  // Andar até a estação
  const walk = await holdUntil(page, 'w', (s) => s.toast);
  check('aviso aparece ao se aproximar (W = frente)', walk.s.toast, `${walk.ms} ms, distância ${walk.s.distStation.toFixed(1)}`);
  check('câmera acompanha o astronauta', Math.hypot(walk.s.tgt.x - walk.s.astro.x, walk.s.tgt.z - walk.s.astro.z) < 2.5);
  await page.screenshot({ path: `${OUT}/d03-aviso.png` });

  // Velocidade independente de fps (≈4,5 u/s)
  const p0 = (await state(page)).astro;
  await page.keyboard.down('a'); await page.waitForTimeout(1000); await page.keyboard.up('a');
  const p1 = (await state(page)).astro;
  const speed = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  check('velocidade ≈ 4,5 unidades/s', speed > 3.5 && speed < 5.5, speed.toFixed(2));
  await page.keyboard.down('d'); await page.waitForTimeout(1000); await page.keyboard.up('d');

  // Colisão: insistir em andar para dentro da estação
  await placeInFrontOfStation(page, 5);
  let minDist = 99;
  await page.keyboard.down('w');
  for (let i = 0; i < 50; i++) { await page.waitForTimeout(60); minDist = Math.min(minDist, (await state(page)).distStation); }
  await page.keyboard.up('w');
  check('colisão: não atravessa a central do ALSEP', minDist > 1.1, `menor distância ${minDist.toFixed(2)}`);
  await page.screenshot({ path: `${OUT}/d04-colisao.png` });

  // Teclas presas ao perder o foco
  await page.keyboard.down('s');
  await page.waitForTimeout(150);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const b0 = (await state(page)).astro;
  await page.waitForTimeout(600);
  const b1 = (await state(page)).astro;
  await page.keyboard.up('s');
  check('perder o foco solta as teclas', Math.hypot(b1.x - b0.x, b1.z - b0.z) < 0.1);

  // Abrir pela tecla E
  await placeInFrontOfStation(page, 5);
  await page.keyboard.press('e');
  await page.waitForTimeout(250);
  check('tecla E abre a ficha', (await state(page)).card);
  await page.screenshot({ path: `${OUT}/d05-ficha.png` });

  // Esc fecha
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('Esc fecha a ficha', !(await state(page)).card);

  // Clique no equipamento 3D abre
  await placeInFrontOfStation(page, 6);
  const pt = await stationScreenPoint(page);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  check('clicar no equipamento 3D abre a ficha', (await state(page)).card, `ponto ${Math.round(pt.x)},${Math.round(pt.y)}`);
  if (!(await state(page)).card) await page.keyboard.press('e');

  const score = () => page.textContent('#knowledge-score');
  const tabs = page.locator('#story-tabs button');
  check('pontuação inicial 0/60', (await score()).trim() === '0 / 60 PONTOS', await score());

  await tabs.nth(0).click();
  await page.locator('[data-option="1"]').click();
  const hint = await page.textContent('.activity-feedback');
  check('erro mostra pista específica', hint.startsWith('Pista:'), hint);
  check('erro não dá pontos', (await score()).startsWith('0 /'));
  await page.locator('[data-option="0"]').click();
  check('acerto aba 1 = 10', (await score()).startsWith('10 /'));
  check('opções travadas após acerto', await page.evaluate(() => [...document.querySelectorAll('[data-option]')].every((b) => b.disabled)));
  await page.locator('[data-option="2"]').click({ force: true });
  check('sucesso permanece após clicar em outra opção', (await page.textContent('.activity-feedback')).includes('Descoberta registrada'));
  await page.screenshot({ path: `${OUT}/d06-aba1-acerto.png` });

  await tabs.nth(1).click();
  await tabs.nth(0).click();
  check('aba concluída reaberta mostra acerto', await page.evaluate(() => !!document.querySelector('#story-panel .correct') && document.querySelector('.activity-feedback').classList.contains('success')));

  await tabs.nth(1).click();
  check('aba 2: respostas aguardam a simulação', await page.locator('.story-options.waiting').count() === 1);
  await page.locator('.sim-action').click();
  await page.waitForTimeout(1900);
  await page.locator('[data-option="1"]').click();
  check('acerto aba 2 = 30', (await score()).startsWith('30 /'));
  await tabs.nth(2).click();
  await page.locator('[data-option="0"]').click();
  check('acerto aba 3 = 60', (await score()).startsWith('60 /'));
  await tabs.nth(2).click();
  await page.locator('[data-option="0"]').click({ force: true });
  check('sem pontos duplicados', (await score()).startsWith('60 /'));
  await page.screenshot({ path: `${OUT}/d07-ficha-completa.png` });

  await page.click('#continue-button');
  await page.waitForTimeout(400);
  check('objetivo atualizado após concluir', (await page.textContent('#objective-text')).includes('concluída'), await page.textContent('#objective-text'));
  check('rota 01 marcada como concluída', await page.evaluate(() => document.querySelector('#route-01').classList.contains('done')));
  check('arquivo lunar 01/12', (await page.textContent('#archive-count')) === '01');
  await page.screenshot({ path: `${OUT}/d08-concluido.png` });

  // Afastar e voltar: aviso reaparece
  const away = await holdUntil(page, 's', (s) => !s.toast, 8000);
  const back = await holdUntil(page, 'w', (s) => s.toast, 8000);
  check('afastar e voltar: aviso reaparece', !away.s.toast && back.s.toast);
  check('aviso indica reabrir ficha', (await page.textContent('#toast-eyebrow')).includes('FICHA'));

  // Câmera girada: W vai para onde a câmera olha
  const box = await page.locator('#game-canvas').boundingBox();
  await page.mouse.move(box.width / 2, box.height / 2 + 100);
  await page.mouse.down();
  await page.mouse.move(box.width / 2 + 350, box.height / 2 + 100, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const c0 = await state(page);
  await page.keyboard.down('w'); await page.waitForTimeout(700); await page.keyboard.up('w');
  const c1 = await state(page);
  const fwd = { x: c0.tgt.x - c0.cam.x, z: c0.tgt.z - c0.cam.z };
  const mv = { x: c1.astro.x - c0.astro.x, z: c1.astro.z - c0.astro.z };
  const cos = (fwd.x * mv.x + fwd.z * mv.z) / (Math.hypot(fwd.x, fwd.z) * Math.hypot(mv.x, mv.z) || 1);
  check('com câmera girada, W segue a câmera', cos > 0.9, `giro ${(c0.alpha - a0).toFixed(2)} rad, cos=${cos.toFixed(2)}`);
  await page.screenshot({ path: `${OUT}/d09-camera-girada.png` });

  // Progresso salvo após recarregar
  await page.goto(BASE);
  await page.waitForFunction(() => document.documentElement.dataset.nasaModel);
  check('progresso salvo após recarregar', (await page.textContent('#archive-count')) === '01' && await page.evaluate(() => document.querySelector('#route-01').classList.contains('done')));

  check('sem erros no console', errors.filter((e) => !/favicon/.test(e)).length === 0, errors.join(' | '));
  await ctx.close();
}

async function tablet(label, viewport) {
  console.log(`\n=== TABLET ${label} ${viewport.width}x${viewport.height} ===`);
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}?reiniciar`);
  await page.waitForFunction(() => document.documentElement.dataset.nasaModel, null, { timeout: 60000 });
  await page.screenshot({ path: `${OUT}/t-${label}-01-intro.png` });
  await page.tap('#start-button');
  await page.waitForTimeout(600);
  const joy = page.locator('#joystick');
  const visible = await joy.isVisible().catch(() => false);
  check(`[${label}] joystick visível`, visible);
  check(`[${label}] dica de teclado escondida`, !(await page.locator('.controls').isVisible()));
  await page.screenshot({ path: `${OUT}/t-${label}-02-cena.png` });
  if (visible) {
    const b = await joy.boundingBox();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const s0 = await state(page);
    await touch('touchStart', cx, cy);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', cx, cy - i * 6); await page.waitForTimeout(16); }
    let s1 = s0;
    for (let i = 0; i < 80 && !s1.toast; i++) { await page.waitForTimeout(50); s1 = await state(page); }
    await page.screenshot({ path: `${OUT}/t-${label}-03-andando.png` });
    await touch('touchEnd');
    check(`[${label}] joystick move o astronauta`, Math.hypot(s1.astro.x - s0.astro.x, s1.astro.z - s0.astro.z) > 2);
    check(`[${label}] aviso aparece com joystick`, s1.toast);
    if (s1.toast) {
      await page.tap('#investigate-button');
      await page.waitForTimeout(300);
      check(`[${label}] ficha abre por toque`, (await state(page)).card);
      await page.screenshot({ path: `${OUT}/t-${label}-04-ficha.png` });
      const fits = await page.evaluate(() => { const r = document.querySelector('#continue-button').getBoundingClientRect(); const sc = document.querySelector('.artifact-card'); return { btnBottom: Math.round(r.bottom), vh: innerHeight, scrollable: sc.scrollHeight > sc.clientHeight || document.querySelector('.artifact-copy').scrollHeight > document.querySelector('.artifact-copy').clientHeight }; });
      check(`[${label}] ficha acessível (botão visível ou rolável)`, fits.btnBottom <= fits.vh || fits.scrollable, JSON.stringify(fits));
    }
  }
  check(`[${label}] sem erros`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

if (!ONLY || ONLY === 'desktop') await desktop();
if (!ONLY || ONLY === 'tablet') {
  await tablet('paisagem', { width: 1024, height: 768 });
  await tablet('retrato', { width: 768, height: 1024 });
}
await browser.close();
fs.writeFileSync(`${OUT}/resultados.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas`);
