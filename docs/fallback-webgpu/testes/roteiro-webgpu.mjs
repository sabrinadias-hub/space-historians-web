// Roteiro do fallback WebGPU: abre o mapa lunar com WebGL e com WebGPU e compara.
// Uso: node roteiro-webgpu.mjs [endereço] [pasta de saída]
// O WebGPU usa o SwiftShader (GPU por software) para não depender do driver de vídeo da máquina.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = process.argv[3] ?? './shots-webgpu';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: false,
  args: ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-unsafe-webgpu', '--use-webgpu-adapter=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const mode of ['webgl', 'webgpu']) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}?reiniciar&lang=pt${mode === 'webgpu' ? '&render=webgpu' : ''}`);
  await page.waitForFunction(() => document.documentElement.dataset.nasaModel, null, { timeout: 60000 });
  const renderer = await page.evaluate(() => document.documentElement.dataset.renderer);
  check(`${mode}: motor em uso`, renderer === mode, renderer);
  check(`${mode}: modelo da NASA carregado`, (await page.evaluate(() => document.documentElement.dataset.nasaModel)) === 'loaded');
  check(`${mode}: sem aviso de 3D indisponível`, await page.evaluate(() => document.querySelector('#no-webgl')?.hidden === true));

  await page.click('#start-button');
  await page.waitForTimeout(3000);
  // Caminha um pouco para garantir que a cena continua sendo desenhada.
  await page.keyboard.down('w'); await page.waitForTimeout(800); await page.keyboard.up('w');
  await page.screenshot({ path: `${OUT}/mapa-${mode}.png` });
  check(`${mode}: sem erros no console`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/resultados-webgpu.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} falha(s)` : `\n${results.length}/${results.length} ok`);
process.exit(failed ? 1 : 0);
