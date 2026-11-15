// Atividades da ficha: escolher, associar, ordenar e simulações.
// As simulações são desenhos simples (SVG) e sempre aparecem marcadas como representação do jogo.
import type { Activity, Simulation } from './story-data';

type RenderOptions = {
  /** A atividade já foi concluída antes (mostra o resultado, sem interação). */
  solved: boolean;
  /** Texto de sucesso (com ou sem a recompensa). */
  successText: (earned: boolean) => string;
  onSolved: () => void;
};

const DEFAULT_HINT = 'Quase! Observe as pistas e tente novamente.';

function shuffle<T>(items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Evita que a ordem embaralhada seja igual à original (a resposta ficaria óbvia).
  if (result.length > 1 && result.every((item, index) => item === items[index])) result.push(result.shift()!);
  return result;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderActivity(host: HTMLElement, activity: Activity, options: RenderOptions) {
  const wrapper = el('div', 'story-activity');
  wrapper.appendChild(el('strong', undefined, activity.prompt));
  const body = el('div', 'activity-body');
  const feedback = el('p', 'activity-feedback');
  feedback.setAttribute('aria-live', 'polite');
  wrapper.append(body, feedback);
  host.appendChild(wrapper);

  const showSuccess = (earned: boolean) => {
    feedback.textContent = options.successText(earned);
    feedback.className = 'activity-feedback success';
  };
  const showHint = () => {
    feedback.textContent = activity.hint ?? DEFAULT_HINT;
    feedback.className = 'activity-feedback try-again';
  };
  const solve = () => {
    showSuccess(true);
    options.onSolved();
  };

  switch (activity.type ?? 'choice') {
    case 'choice': renderChoice(); break;
    case 'match': renderMatch(); break;
    case 'order': renderOrder(); break;
    case 'simulation': renderSimulationOnly(); break;
  }
  if (options.solved) showSuccess(false);

  function renderChoice() {
    if (activity.type !== undefined && activity.type !== 'choice') return;
    const choice = activity;
    let simulationDone = !choice.simulation || options.solved;
    const optionsRow = el('div', 'story-options');
    const buttons = choice.options.map((label, index) => {
      const button = el('button', undefined, label);
      button.dataset.option = String(index);
      optionsRow.appendChild(button);
      return button;
    });
    const lock = () => buttons.forEach((button, index) => {
      button.disabled = true;
      button.classList.toggle('correct', index === choice.correct);
      button.classList.remove('wrong');
    });
    const setWaiting = (waiting: boolean) => {
      optionsRow.classList.toggle('waiting', waiting);
      buttons.forEach((button) => { button.disabled = waiting; });
    };

    if (choice.simulation) {
      body.appendChild(createSimulation(choice.simulation, options.solved, () => {
        simulationDone = true;
        setWaiting(false);
        feedback.textContent = '';
        feedback.className = 'activity-feedback';
      }));
    }
    body.appendChild(optionsRow);
    if (options.solved) { lock(); return; }
    if (!simulationDone) {
      setWaiting(true);
      feedback.textContent = 'Use a simulação acima para liberar as respostas.';
      feedback.className = 'activity-feedback';
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      if (!simulationDone) return;
      if (index !== choice.correct) {
        button.classList.add('wrong');
        showHint();
        return;
      }
      lock();
      solve();
    }));
  }

  function renderMatch() {
    if (activity.type !== 'match') return;
    const pairs = activity.pairs;
    const answers = shuffle([...new Set(pairs.map((pair) => pair.answer))]);
    const selected: (string | null)[] = pairs.map(() => null);
    const list = el('div', 'match-list');
    const rows = pairs.map((pair, rowIndex) => {
      const row = el('div', 'match-row');
      row.appendChild(el('span', 'match-item', pair.item));
      const choices = el('div', 'match-choices');
      const buttons = answers.map((answer) => {
        const button = el('button', undefined, answer);
        button.dataset.answer = answer;
        button.addEventListener('click', () => {
          selected[rowIndex] = answer;
          buttons.forEach((other) => other.classList.toggle('selected', other === button));
          row.classList.remove('wrong');
          check();
        });
        choices.appendChild(button);
        return button;
      });
      row.appendChild(choices);
      list.appendChild(row);
      return { row, buttons };
    });
    body.appendChild(list);

    const lock = () => rows.forEach(({ row, buttons }, index) => {
      row.classList.remove('wrong');
      row.classList.add('right');
      buttons.forEach((button) => {
        button.disabled = true;
        button.classList.toggle('selected', button.dataset.answer === pairs[index].answer);
      });
    });
    if (options.solved) { lock(); return; }

    function check() {
      if (selected.some((answer) => answer === null)) {
        feedback.textContent = `Faltam ${selected.filter((answer) => answer === null).length} associação(ões).`;
        feedback.className = 'activity-feedback';
        return;
      }
      const wrong = pairs.map((pair, index) => selected[index] !== pair.answer);
      if (wrong.some(Boolean)) {
        wrong.forEach((isWrong, index) => rows[index].row.classList.toggle('wrong', isWrong));
        showHint();
        return;
      }
      lock();
      solve();
    }
  }

  function renderOrder() {
    if (activity.type !== 'order') return;
    const sequence = activity.sequence;
    const picked: string[] = [];
    const slots = el('ol', 'order-slots');
    const pool = el('div', 'story-options order-pool');
    const drawSlots = () => {
      slots.innerHTML = '';
      sequence.forEach((_, index) => {
        const slot = el('li', picked[index] ? 'filled' : '', picked[index] ?? '…');
        slots.appendChild(slot);
      });
    };
    const buttons = shuffle(sequence).map((label) => {
      const button = el('button', undefined, label);
      button.addEventListener('click', () => {
        if (label !== sequence[picked.length]) {
          // Ordem errada: mostra a pista e recomeça.
          picked.length = 0;
          buttons.forEach((other) => { other.disabled = false; other.classList.remove('correct'); });
          button.classList.add('wrong');
          setTimeout(() => button.classList.remove('wrong'), 700);
          drawSlots();
          showHint();
          return;
        }
        picked.push(label);
        button.disabled = true;
        button.classList.add('correct');
        drawSlots();
        if (picked.length === sequence.length) solve();
      });
      pool.appendChild(button);
      return button;
    });
    body.append(slots, pool);
    if (options.solved) {
      picked.push(...sequence);
      buttons.forEach((button) => { button.disabled = true; button.classList.add('correct'); });
    }
    drawSlots();
  }

  function renderSimulationOnly() {
    if (activity.type !== 'simulation') return;
    body.appendChild(createSimulation(activity.simulation, options.solved, () => { if (!options.solved) solve(); }));
  }
}

// ---------------------------------------------------------------------------
// Simulações
// ---------------------------------------------------------------------------

function createSimulation(simulation: Simulation, alreadyDone: boolean, onDone: () => void): HTMLElement {
  const box = el('div', 'sim');
  box.appendChild(el('span', 'sim-tag', 'REPRESENTAÇÃO DO JOGO'));
  const stage = el('div', 'sim-stage');
  const controls = el('div', 'sim-controls');
  box.append(stage, controls);
  const builder = SIMULATIONS[simulation.kind];
  builder(simulation as never, { stage, controls, alreadyDone, done: onDone });
  return box;
}

type SimContext = { stage: HTMLElement; controls: HTMLElement; alreadyDone: boolean; done: () => void };

function actionButton(context: SimContext, label: string, onClick: (button: HTMLButtonElement) => void) {
  const button = el('button', 'sim-action', label);
  button.addEventListener('click', () => onClick(button));
  context.controls.appendChild(button);
  return button;
}

/** Desenha uma linha de sismógrafo. `bursts` são [posição 0..1, amplitude, duração 0..1]. */
function tracePath(width: number, height: number, bursts: [number, number, number][], noise = 1.2) {
  const mid = height / 2;
  let d = `M0 ${mid}`;
  for (let x = 0; x <= width; x += 2) {
    const t = x / width;
    let y = Math.sin(x * 1.7) * noise * 0.5;
    for (const [start, amplitude, duration] of bursts) {
      if (t >= start && t <= start + duration) {
        const local = (t - start) / duration;
        y += Math.sin(local * Math.PI * 18) * amplitude * Math.exp(-local * 3.2);
      }
    }
    d += ` L${x} ${(mid + y).toFixed(1)}`;
  }
  return d;
}

function animateStroke(path: SVGPathElement, ms: number) {
  const length = path.getTotalLength?.() ?? 1000;
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.getBoundingClientRect();
  path.style.transition = `stroke-dashoffset ${ms}ms linear`;
  path.style.strokeDashoffset = '0';
}

const SIMULATIONS: { [K in Simulation['kind']]: (sim: Extract<Simulation, { kind: K }>, context: SimContext) => void } = {
  'seismic-compare': (_sim, context) => {
    const w = 300; const h = 54;
    context.stage.innerHTML = `
      <svg viewBox="0 0 ${w} ${h * 2 + 40}" class="sim-svg" role="img" aria-label="Dois registros de sismógrafo">
        <text x="0" y="12" class="sim-label">Registro A</text>
        <path class="trace" data-trace="a" d="${tracePath(w, h, [], 1)}" transform="translate(0 14)"/>
        <text x="0" y="${h + 34}" class="sim-label">Registro B</text>
        <path class="trace hot" data-trace="b" d="${tracePath(w, h, [[0.12, 22, 0.85]])}" transform="translate(0 ${h + 36})"/>
      </svg>`;
    const paths = [...context.stage.querySelectorAll<SVGPathElement>('path.trace')];
    if (context.alreadyDone) return;
    paths.forEach((path) => { path.style.opacity = '0'; });
    actionButton(context, '▶ Mostrar os registros', (button) => {
      button.disabled = true;
      paths.forEach((path) => { path.style.opacity = '1'; animateStroke(path, 1600); });
      setTimeout(context.done, 1650);
    });
  },

  'photo-compare': (_sim, context) => {
    const surveyor = (complete: boolean) => `
      <g stroke="#cfd5ea" stroke-width="2" fill="none">
        <path d="M60 95 L35 130 M60 95 L85 130 M60 95 L60 132"/>
        <rect x="42" y="70" width="36" height="26" fill="#3a4170"/>
        <path d="M60 70 L60 40 M48 40 L72 40"/>
        <rect x="70" y="30" width="34" height="12" fill="#6b7bd1" stroke="none"/>
      </g>
      ${complete
        ? '<rect class="part" x="22" y="74" width="16" height="12" fill="#ff9d4c"/><path class="part" d="M80 92 L100 112 L108 108" stroke="#ff9d4c" stroke-width="4" fill="none"/>'
        : '<rect class="missing" x="22" y="74" width="16" height="12"/><path class="missing" d="M80 92 L100 112 L108 108" fill="none"/>'}`;
    context.stage.innerHTML = `
      <svg viewBox="0 0 300 160" class="sim-svg" role="img" aria-label="Comparação entre a imagem histórica e a atual da Surveyor 3">
        <text x="10" y="14" class="sim-label">Imagem histórica (1967)</text>
        <g transform="translate(10 10)">${surveyor(true)}</g>
        <text x="160" y="14" class="sim-label">Hoje, no jogo</text>
        <g transform="translate(160 10)">${surveyor(false)}</g>
        <g class="callouts" opacity="0">
          <circle cx="190" cy="90" r="16" class="callout"/><text x="168" y="122" class="sim-label hot">câmera?</text>
          <circle cx="262" cy="118" r="16" class="callout"/><text x="236" y="152" class="sim-label hot">pá?</text>
        </g>
      </svg>`;
    const callouts = context.stage.querySelector<SVGGElement>('.callouts')!;
    if (context.alreadyDone) { callouts.setAttribute('opacity', '1'); return; }
    actionButton(context, '🔍 Comparar as imagens', (button) => {
      button.disabled = true;
      callouts.style.transition = 'opacity .6s';
      callouts.setAttribute('opacity', '1');
      setTimeout(context.done, 700);
    });
  },

  'seismic-pulse': (sim, context) => {
    const sensors = sim.sensors;
    const w = 300;
    const sensorX = sensors === 1 ? [210] : [110, 180, 250];
    const traceH = 34;
    const top = sim.subsurface ? 110 : 60;
    context.stage.innerHTML = `
      <svg viewBox="0 0 ${w} ${top + sensors * (traceH + 14) + 6}" class="sim-svg" role="img" aria-label="Simulação de vibração chegando aos sensores">
        <rect x="0" y="30" width="${w}" height="${sim.subsurface ? 70 : 22}" class="soil"/>
        ${sim.subsurface ? `<g class="subsurface" opacity="0">
          <path d="M0 62 Q150 52 300 66" class="layer"/><path d="M0 84 Q150 78 300 90" class="layer"/>
          <path d="M150 34 L150 92" class="arrow-down"/><text x="156" y="96" class="sim-label">≈ 3 km (ilustração)</text></g>` : ''}
        <g transform="translate(24 22)"><rect x="-8" y="-4" width="16" height="10" fill="#ff9d4c"/><text x="-14" y="-8" class="sim-label">origem</text></g>
        ${sensorX.map((x, i) => `<g transform="translate(${x} 28)"><path d="M-6 6 L0 -6 L6 6 Z" fill="#73dcb0"/><text x="-14" y="-10" class="sim-label">sensor ${i + 1}</text></g>`).join('')}
        <circle class="ripple" cx="24" cy="30" r="0"/>
        ${sensorX.map((_, i) => `<text x="0" y="${top + i * (traceH + 14) + 10}" class="sim-label">registro do sensor ${i + 1}</text>
          <path class="trace" data-index="${i}" d="${tracePath(w, traceH, [], 1)}" transform="translate(0 ${top + i * (traceH + 14) + 12})"/>`).join('')}
      </svg>`;
    const traces = [...context.stage.querySelectorAll<SVGPathElement>('path.trace')];
    const ripple = context.stage.querySelector<SVGCircleElement>('.ripple')!;
    const subsurface = context.stage.querySelector<SVGGElement>('.subsurface');
    const burstsFor = (i: number): [number, number, number][] => [[(sensorX[i] - 24) / w * 0.9, 14, 0.35]];
    const finalState = () => {
      traces.forEach((trace, i) => { trace.setAttribute('d', tracePath(w, traceH, burstsFor(i), 1)); trace.classList.add('hot'); });
      subsurface?.setAttribute('opacity', '1');
    };
    if (context.alreadyDone) { finalState(); return; }
    actionButton(context, '💥 Produzir vibração', (button) => {
      button.disabled = true;
      const start = performance.now();
      const duration = 1600;
      const step = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / duration));
        ripple.setAttribute('r', String(t * (w - 24)));
        ripple.style.opacity = String(1 - t);
        traces.forEach((trace, i) => {
          const reached = t * (w - 24) >= sensorX[i] - 24;
          if (reached && !trace.classList.contains('hot')) {
            trace.setAttribute('d', tracePath(w, traceH, burstsFor(i), 1));
            trace.classList.add('hot');
          }
        });
        if (t < 1) requestAnimationFrame(step);
        else {
          if (subsurface) { subsurface.style.transition = 'opacity .8s'; subsurface.setAttribute('opacity', '1'); }
          context.done();
        }
      };
      requestAnimationFrame(step);
    });
  },

  'heat-probe': (_sim, context) => {
    context.stage.innerHTML = `
      <svg viewBox="0 0 300 150" class="sim-svg" role="img" aria-label="Corte do solo com dois sensores de temperatura">
        <rect x="0" y="20" width="300" height="130" class="soil deep"/>
        <text x="8" y="14" class="sim-label">superfície</text>
        <line x1="150" y1="10" x2="150" y2="140" class="probe"/>
        <circle cx="150" cy="70" r="7" class="sensor"/><text x="164" y="66" class="sim-label">sensor a 1 m</text>
        <circle cx="150" cy="128" r="7" class="sensor"/><text x="164" y="124" class="sim-label">sensor a 2,3 m</text>
        <text x="164" y="84" class="reading" data-reading="0"></text>
        <text x="164" y="142" class="reading" data-reading="1"></text>
        <text x="8" y="146" class="sim-label">valores ilustrativos</text>
      </svg>`;
    const readings = [...context.stage.querySelectorAll<SVGTextElement>('.reading')];
    const values = ['−21,0 °C', '−18,7 °C'];
    const show = () => readings.forEach((reading, i) => { reading.textContent = values[i]; });
    if (context.alreadyDone) { show(); return; }
    actionButton(context, '🌡 Ler os sensores', (button) => {
      button.disabled = true;
      readings[0].textContent = values[0];
      setTimeout(() => { readings[1].textContent = values[1]; context.done(); }, 600);
    });
  },

  'rover-drive': (sim, context) => {
    const points = [[30, 110], [140, 60], [260, 96]];
    context.stage.innerHTML = `
      <svg viewBox="0 0 300 150" class="sim-svg" role="img" aria-label="Mapa do percurso do rover">
        <path d="M${points.map((p) => p.join(' ')).join(' L')}" class="route"/>
        ${points.map(([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="9" class="stop" data-stop="${i}"/><text x="${x - 24}" y="${y + 26}" class="sim-label">${sim.stops[i] ?? ''}</text></g>`).join('')}
        <g class="rover" transform="translate(${points[0][0]} ${points[0][1]}) scale(0.45)">
          <rect x="-16" y="-8" width="32" height="12" rx="3" fill="#ffd078"/>
          <circle cx="-11" cy="6" r="5" fill="#2b2f52"/><circle cx="11" cy="6" r="5" fill="#2b2f52"/>
          <path d="M8 -8 L8 -20 M2 -22 L14 -22" stroke="#cfd5ea" stroke-width="2"/>
        </g>
      </svg>`;
    const rover = context.stage.querySelector<SVGGElement>('.rover')!;
    const stops = [...context.stage.querySelectorAll<SVGCircleElement>('.stop')];
    const place = (i: number, scale: number) => rover.setAttribute('transform', `translate(${points[i][0]} ${points[i][1] - 4}) scale(${scale})`);
    const finish = () => { place(points.length - 1, 1); stops.forEach((stop) => stop.classList.add('visited')); };
    if (context.alreadyDone) { finish(); return; }
    stops[0].classList.add('visited');
    let stage = 0;
    rover.style.transition = 'transform .9s ease-in-out';
    const button = actionButton(context, '📦 Desdobrar o rover', () => {
      if (stage === 0) {
        place(0, 1);
        stage = 1;
        button.textContent = `🚙 Dirigir até ${sim.stops[1]}`;
        return;
      }
      button.disabled = true;
      place(stage, 1);
      stops[stage].classList.add('visited');
      setTimeout(() => {
        stage += 1;
        if (stage >= points.length) { button.textContent = '✓ Chegou à estação de coleta'; context.done(); return; }
        button.disabled = false;
        button.textContent = `🚙 Dirigir até ${sim.stops[stage]}`;
      }, 950);
    });
  },

  laser: (_sim, context) => {
    context.stage.innerHTML = `
      <svg viewBox="0 0 300 130" class="sim-svg" role="img" aria-label="Pulso de laser entre a Terra e o refletor na Lua">
        <circle cx="34" cy="65" r="26" fill="#2a66d6"/><text x="14" y="112" class="sim-label">Terra</text>
        <circle cx="272" cy="65" r="14" fill="#9aa0b4"/><rect x="258" y="58" width="8" height="8" fill="#ff9d4c"/><text x="246" y="112" class="sim-label">refletor</text>
        <line class="beam" x1="60" y1="62" x2="60" y2="62"/>
        <line class="beam back" x1="258" y1="68" x2="258" y2="68"/>
        <text x="110" y="24" class="timer">0,0 s</text>
      </svg>`;
    const [beam, back] = [...context.stage.querySelectorAll<SVGLineElement>('.beam')];
    const timer = context.stage.querySelector<SVGTextElement>('.timer')!;
    const finalState = () => {
      beam.setAttribute('x2', '258');
      back.setAttribute('x2', '60');
      timer.textContent = '≈ 2,5 s (ida e volta)';
    };
    if (context.alreadyDone) { finalState(); return; }
    actionButton(context, '🔦 Enviar pulso de laser', (button) => {
      button.disabled = true;
      beam.setAttribute('x2', '60');
      back.setAttribute('x2', '258');
      const start = performance.now();
      const duration = 2500;
      const step = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / duration));
        if (t < 0.5) beam.setAttribute('x2', String(60 + (t / 0.5) * 198));
        else { beam.setAttribute('x2', '258'); back.setAttribute('x2', String(258 - ((t - 0.5) / 0.5) * 198)); }
        timer.textContent = `${(t * 2.5).toFixed(1).replace('.', ',')} s`;
        if (t < 1) requestAnimationFrame(step);
        else { finalState(); context.done(); }
      };
      requestAnimationFrame(step);
    });
  },

  'lm-stages': (_sim, context) => {
    context.stage.innerHTML = `
      <svg viewBox="0 0 300 160" class="sim-svg" role="img" aria-label="Módulo lunar com os dois estágios">
        <g class="descent">
          <rect x="112" y="92" width="76" height="30" fill="#c8a24a"/>
          <path d="M112 120 L88 148 M188 120 L212 148 M130 122 L124 150 M170 122 L176 150" stroke="#cfd5ea" stroke-width="3"/>
          <path d="M196 98 L204 98 M196 106 L204 106 M196 114 L204 114 M200 94 L200 122" stroke="#cfd5ea" stroke-width="1.5"/>
          <text x="96" y="86" class="sim-label">estágio de descida (base)</text>
        </g>
        <g class="ascent" tabindex="0" role="button" aria-label="Cabine: estágio de subida">
          <path d="M120 92 L124 60 L150 46 L176 60 L180 92 Z" fill="#b9bfd5" stroke="#fff" stroke-width="1.5"/>
          <rect x="140" y="62" width="20" height="12" fill="#2b2f52"/>
          <text x="186" y="58" class="sim-label hot">cabine</text>
        </g>
      </svg>`;
    const ascent = context.stage.querySelector<SVGGElement>('.ascent')!;
    const launch = () => {
      ascent.style.transition = 'transform 1.6s ease-in, opacity 1.6s';
      ascent.style.transform = 'translateY(-150px)';
      ascent.style.opacity = '0';
    };
    if (context.alreadyDone) { ascent.style.opacity = '0'; return; }
    let launched = false;
    const go = () => {
      if (launched) return;
      launched = true;
      button.disabled = true;
      launch();
      setTimeout(context.done, 1650);
    };
    ascent.style.cursor = 'pointer';
    ascent.addEventListener('click', go);
    ascent.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') go(); });
    const button = actionButton(context, '🚀 Separar a cabine', go);
  },

  footstep: (_sim, context) => {
    const w = 300; const h = 50;
    context.stage.innerHTML = `
      <svg viewBox="0 0 ${w} 140" class="sim-svg" role="img" aria-label="Astronauta dando um passo e o gráfico do sismômetro">
        <g class="walker" transform="translate(40 40)">
          <circle cx="0" cy="-14" r="9" fill="#e9e6dc"/><rect x="-8" y="-4" width="16" height="22" rx="5" fill="#e9e6dc"/>
          <rect class="leg" x="-7" y="16" width="5" height="14" fill="#e9e6dc"/><rect x="2" y="16" width="5" height="14" fill="#e9e6dc"/>
        </g>
        <ellipse class="footprint" cx="58" cy="74" rx="6" ry="3" opacity="0"/>
        <text x="90" y="30" class="sim-label">sismômetro</text>
        <path class="trace" d="${tracePath(w, h, [], 1)}" transform="translate(0 84)"/>
      </svg>`;
    const trace = context.stage.querySelector<SVGPathElement>('.trace')!;
    const footprint = context.stage.querySelector<SVGEllipseElement>('.footprint')!;
    const walker = context.stage.querySelector<SVGGElement>('.walker')!;
    const finalState = () => {
      trace.setAttribute('d', tracePath(w, h, [[0.45, 18, 0.3]], 1));
      trace.classList.add('hot');
      footprint.setAttribute('opacity', '1');
      walker.setAttribute('transform', 'translate(58 40)');
    };
    if (context.alreadyDone) { finalState(); return; }
    actionButton(context, '👣 Dar um passo', (button) => {
      button.disabled = true;
      walker.style.transition = 'transform .5s';
      walker.setAttribute('transform', 'translate(58 40)');
      setTimeout(() => { finalState(); context.done(); }, 550);
    });
  },
};

