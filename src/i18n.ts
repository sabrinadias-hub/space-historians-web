// Idiomas do jogo: textos de interface (HUD, avisos, ficha, atividades e simulações).
// As histórias ficam em story-data.ts (português) e story-data.en.ts (inglês).

export type Lang = 'pt' | 'en';
export const LANGS: Lang[] = ['pt', 'en'];

const pt = {
  htmlLang: 'pt-BR',
  pageTitle: 'Space Historians — Arquivo Lunar',
  canvasLabel: 'Exploração 3D da superfície lunar',
  // Escolha de idioma
  languageEyebrow: 'IDIOMA · LANGUAGE',
  languageTitle: 'Escolha o idioma',
  languageHint: 'Choose your language',
  changeLanguage: 'Trocar idioma',
  // Nome do explorador
  nameEyebrow: 'IDENTIFICAÇÃO DA TRIPULAÇÃO',
  nameTitle: 'Como devemos chamar<br /><em>você, explorador?</em>',
  namePlaceholder: 'Nome do explorador',
  nameLabel: 'Nome do explorador (de 2 a 24 caracteres)',
  nameContinue: 'CONTINUAR',
  nameError: 'Escreva um nome com 2 a 24 caracteres.',
  // Prólogo (o texto fica em story-data)
  prologueNext: 'PRÓXIMO',
  prologueBack: 'VOLTAR',
  prologuePage: (page: number, total: number) => `Página ${page} de ${total}`,
  startButton: 'ESCOLHER LOCAL DE EXPLORAÇÃO',
  // HUD
  archive: 'ARQUIVO LUNAR',
  objective: 'OBJETIVO ATUAL',
  route: 'ROTA DE EXPLORAÇÃO',
  walk: 'CAMINHAR',
  walkHint: 'Use as teclas ou setas',
  joystick: 'ARRASTE PARA CAMINHAR',
  joystickLabel: 'Controle de movimento: arraste para caminhar',
  credit: 'PERSONAGEM 3D · POLY BY GOOGLE · CC BY',
  missionEyebrow: (number: string, mission: string) => `MISSÃO ${number} · ${mission.toUpperCase()}`,
  archiveDoneEyebrow: 'ARQUIVO LUNAR · 12 DE 12',
  archiveDoneTitle: 'Arquivo lunar concluído',
  archiveDoneObjective: (points: number) => `Arquivo completo · ${points} pontos`,
  welcome: (name: string) => `Boas-vindas, ${name}! Os 12 locais estão liberados: escolha um destino na rota ou caminhe até um equipamento.`,
  freeEyebrow: 'EXPLORAÇÃO LIVRE · 12 LOCAIS',
  freeTitle: 'Escolha um local de exploração',
  freeObjective: 'Escolha um destino na rota',
  justCompleted: (number: string, next: string) => `Ficha ${number} concluída · sugestão: ${next}`,
  routeNew: 'não explorado',
  routeProgress: 'em andamento',
  routeDone: 'concluído ✓',
  routeActive: 'destino',
  setDestination: 'Definir como destino',
  recommendedOrder: 'Ordem recomendada, não obrigatória',
  // Pontuação
  knowledgeHud: 'CONHECIMENTO',
  bonusHud: 'BÔNUS',
  // Aviso de proximidade
  toastFound: 'OBJETO ENCONTRADO',
  toastArchive: 'FICHA DO ARQUIVO',
  investigate: 'INVESTIGAR ',
  openCard: 'ABRIR FICHA ',
  // Ficha
  cardEyebrow: (number: string, total: string) => `DESCOBERTA ${number} DE ${total}`,
  points: (score: number, max: number) => `${score} / ${max} PONTOS`,
  reward: (done: boolean, reward: number) => `${done ? '✓ ' : '+'}${reward} PONTOS`,
  earned: (reward: number) => `+${reward} pontos.`,
  tabs: { identity: 'O que é?', function: 'O que fez na Lua?', evidence: 'Como sabemos?' },
  tabsLabel: 'Camadas de conhecimento',
  stepDone: '✓ CONCLUÍDO',
  // Quiz bônus
  quizTitle: 'QUIZ OPCIONAL',
  quizValue: 'Vale +10 pontos bônus',
  quizDone: '★ Bônus conquistado',
  earnedBonus: (bonus: number) => `+${bonus} pontos bônus.`,
  // Foto
  photoCredit: (credit: string) => `Foto: ${credit}`,
  photoFallback: 'Foto indisponível no momento',
  // Badge e mochila
  badgeEarned: 'BADGE CONQUISTADO',
  badgeBonus: 'BÔNUS',
  badgeStates: { new: 'Não explorado', progress: 'Em andamento', done: 'Conquistado' },
  badgeSteps: (done: number) => `${done} de 3 camadas`,
  backpack: 'MOCHILA',
  backpackTitle: 'Mochila digital',
  backpackExplorer: 'EXPLORADOR',
  backpackHint: 'Toque em um badge para abrir a ficha. Locais ainda não explorados viram o seu destino.',
  editName: 'Editar nome',
  saveName: 'SALVAR',
  cancel: 'CANCELAR',
  close: 'FECHAR',
  languageLabel: 'IDIOMA',
  missionLabel: 'MISSÃO',
  yearLabel: 'ANO',
  factsSummary: 'O que é fato e o que é ficção',
  factsLabel: 'Fatos históricos:',
  fictionLabel: 'Ficção do jogo:',
  continue: 'CONTINUAR EXPLORANDO',
  // Epílogo
  equipmentLabel: 'EQUIPAMENTOS',
  equipmentValue: '12 investigados',
  knowledgeLabel: 'CONHECIMENTO',
  bonusLabel: 'BÔNUS',
  totalLabel: 'TOTAL',
  distinctionLabel: 'DISTINÇÃO',
  epilogueScore: (score: number, max: number) => `${score} / ${max}`,
  epilogueExplorer: (name: string, distinction: string) => `${distinction} · ${name}`,
  // Atividades
  defaultHint: 'Quase! Observe as pistas e tente novamente.',
  useSimulation: 'Use a simulação acima para liberar as respostas.',
  missingMatches: (count: number) => (count === 1 ? 'Falta 1 associação.' : `Faltam ${count} associações.`),
  // Simulações
  simTag: 'REPRESENTAÇÃO DO JOGO',
  sim: {
    recordA: 'Registro A', recordB: 'Registro B', seismoLabel: 'Dois registros de sismógrafo', showRecords: '▶ Mostrar os registros',
    historical: 'Imagem histórica (1967)', today: 'Hoje, no jogo', camera: 'câmera?', scoop: 'pá?', comparePhotos: '🔍 Comparar as imagens',
    photoLabel: 'Comparação entre a imagem histórica e a atual da Surveyor 3',
    origin: 'origem', sensor: (i: number) => `sensor ${i}`, sensorRecord: (i: number) => `registro do sensor ${i}`,
    depth: '≈ 3 km (ilustração)', makeVibration: '💥 Produzir vibração', pulseLabel: 'Simulação de vibração chegando aos sensores',
    surface: 'superfície', sensorAt1: 'sensor a 1 m', sensorAt2: 'sensor a 2,3 m', illustrative: 'valores ilustrativos',
    readings: ['−21,0 °C', '−18,7 °C'], readSensors: '🌡 Ler os sensores', heatLabel: 'Corte do solo com dois sensores de temperatura',
    unfold: '📦 Desdobrar o rover', driveTo: (stop: string) => `🚙 Dirigir até ${stop}`, arrived: '✓ Chegou à estação de coleta', roverLabel: 'Mapa do percurso do rover',
    earth: 'Terra', reflector: 'refletor', roundTrip: '≈ 2,5 s (ida e volta)', seconds: (value: string) => `${value} s`, decimal: ',',
    sendPulse: '🔦 Enviar pulso de laser', laserLabel: 'Pulso de laser entre a Terra e o refletor na Lua',
    descent: 'estágio de descida (base)', cabin: 'cabine', cabinLabel: 'Cabine: estágio de subida', separate: '🚀 Separar a cabine', lmLabel: 'Módulo lunar com os dois estágios',
    seismometer: 'sismômetro', takeStep: '👣 Dar um passo', stepLabel: 'Astronauta dando um passo e o gráfico do sismômetro',
  },
  // Sem WebGL
  noWebglEyebrow: 'NÃO FOI POSSÍVEL ABRIR O MAPA LUNAR',
  noWebglTitle: 'O 3D está desligado neste navegador',
  noWebglText: 'Para explorar a Lua, peça a um adulto para ativar a <strong>aceleração de hardware</strong> nas configurações do navegador (Chrome ou Edge: Configurações → Sistema) e recarregue a página.',
  noWebglSmall: 'Este navegador não ofereceu WebGL nem WebGPU. Em computadores da escola, o 3D pode estar bloqueado pela rede ou pelo administrador: tente outro navegador ou dispositivo.',
};

export type UiText = typeof pt;

const en: UiText = {
  htmlLang: 'en',
  pageTitle: 'Space Historians — Lunar Archive',
  canvasLabel: '3D exploration of the lunar surface',
  languageEyebrow: 'IDIOMA · LANGUAGE',
  languageTitle: 'Choose your language',
  languageHint: 'Escolha o idioma',
  changeLanguage: 'Change language',
  nameEyebrow: 'CREW IDENTIFICATION',
  nameTitle: 'What should we<br /><em>call you, explorer?</em>',
  namePlaceholder: 'Explorer name',
  nameLabel: 'Explorer name (2 to 24 characters)',
  nameContinue: 'CONTINUE',
  nameError: 'Write a name with 2 to 24 characters.',
  prologueNext: 'NEXT',
  prologueBack: 'BACK',
  prologuePage: (page, total) => `Page ${page} of ${total}`,
  startButton: 'CHOOSE AN EXPLORATION SITE',
  archive: 'LUNAR ARCHIVE',
  objective: 'CURRENT OBJECTIVE',
  route: 'EXPLORATION ROUTE',
  walk: 'WALK',
  walkHint: 'Use the keys or arrows',
  joystick: 'DRAG TO WALK',
  joystickLabel: 'Movement control: drag to walk',
  credit: '3D CHARACTER · POLY BY GOOGLE · CC BY',
  missionEyebrow: (number, mission) => `MISSION ${number} · ${mission.toUpperCase()}`,
  archiveDoneEyebrow: 'LUNAR ARCHIVE · 12 OF 12',
  archiveDoneTitle: 'Lunar archive complete',
  archiveDoneObjective: (points) => `Archive complete · ${points} points`,
  welcome: (name) => `Welcome, ${name}! All 12 sites are open: choose a destination on the route or walk up to a piece of equipment.`,
  freeEyebrow: 'FREE EXPLORATION · 12 SITES',
  freeTitle: 'Choose an exploration site',
  freeObjective: 'Choose a destination on the route',
  justCompleted: (number, next) => `File ${number} complete · suggestion: ${next}`,
  routeNew: 'not explored',
  routeProgress: 'in progress',
  routeDone: 'complete ✓',
  routeActive: 'destination',
  setDestination: 'Set as destination',
  recommendedOrder: 'Recommended order, not required',
  knowledgeHud: 'KNOWLEDGE',
  bonusHud: 'BONUS',
  toastFound: 'OBJECT FOUND',
  toastArchive: 'ARCHIVE FILE',
  investigate: 'INVESTIGATE ',
  openCard: 'OPEN FILE ',
  cardEyebrow: (number, total) => `DISCOVERY ${number} OF ${total}`,
  points: (score, max) => `${score} / ${max} POINTS`,
  reward: (done, reward) => `${done ? '✓ ' : '+'}${reward} POINTS`,
  earned: (reward) => `+${reward} points.`,
  tabs: { identity: 'What is it?', function: 'What did it do?', evidence: 'How do we know?' },
  tabsLabel: 'Knowledge layers',
  stepDone: '✓ COMPLETE',
  quizTitle: 'OPTIONAL QUIZ',
  quizValue: 'Worth +10 bonus points',
  quizDone: '★ Bonus earned',
  earnedBonus: (bonus) => `+${bonus} bonus points.`,
  photoCredit: (credit) => `Photo: ${credit}`,
  photoFallback: 'Photo unavailable right now',
  badgeEarned: 'BADGE EARNED',
  badgeBonus: 'BONUS',
  badgeStates: { new: 'Not explored', progress: 'In progress', done: 'Earned' },
  badgeSteps: (done) => `${done} of 3 layers`,
  backpack: 'BACKPACK',
  backpackTitle: 'Digital backpack',
  backpackExplorer: 'EXPLORER',
  backpackHint: 'Tap a badge to open its file. Sites you have not explored yet become your destination.',
  editName: 'Edit name',
  saveName: 'SAVE',
  cancel: 'CANCEL',
  close: 'CLOSE',
  languageLabel: 'LANGUAGE',
  missionLabel: 'MISSION',
  yearLabel: 'YEAR',
  factsSummary: 'What is fact and what is fiction',
  factsLabel: 'Historical facts:',
  fictionLabel: 'Game fiction:',
  continue: 'KEEP EXPLORING',
  equipmentLabel: 'EQUIPMENT',
  equipmentValue: '12 investigated',
  knowledgeLabel: 'KNOWLEDGE',
  bonusLabel: 'BONUS',
  totalLabel: 'TOTAL',
  distinctionLabel: 'DISTINCTION',
  epilogueScore: (score, max) => `${score} / ${max}`,
  epilogueExplorer: (name, distinction) => `${distinction} · ${name}`,
  defaultHint: 'Almost! Look at the clues and try again.',
  useSimulation: 'Use the simulation above to unlock the answers.',
  missingMatches: (count) => (count === 1 ? '1 match left.' : `${count} matches left.`),
  simTag: 'GAME REPRESENTATION',
  sim: {
    recordA: 'Record A', recordB: 'Record B', seismoLabel: 'Two seismograph records', showRecords: '▶ Show the records',
    historical: 'Historical image (1967)', today: 'Today, in the game', camera: 'camera?', scoop: 'scoop?', comparePhotos: '🔍 Compare the images',
    photoLabel: 'Comparison between the historical and current images of Surveyor 3',
    origin: 'source', sensor: (i) => `sensor ${i}`, sensorRecord: (i) => `sensor ${i} record`,
    depth: '≈ 3 km (illustration)', makeVibration: '💥 Make a vibration', pulseLabel: 'Simulation of a vibration reaching the sensors',
    surface: 'surface', sensorAt1: 'sensor at 1 m', sensorAt2: 'sensor at 2.3 m', illustrative: 'illustrative values',
    readings: ['−21.0 °C', '−18.7 °C'], readSensors: '🌡 Read the sensors', heatLabel: 'Soil cross-section with two temperature sensors',
    unfold: '📦 Unfold the rover', driveTo: (stop) => `🚙 Drive to ${stop}`, arrived: '✓ Reached the sampling station', roverLabel: 'Map of the rover route',
    earth: 'Earth', reflector: 'reflector', roundTrip: '≈ 2.5 s (round trip)', seconds: (value) => `${value} s`, decimal: '.',
    sendPulse: '🔦 Send a laser pulse', laserLabel: 'Laser pulse between Earth and the reflector on the Moon',
    descent: 'descent stage (base)', cabin: 'cabin', cabinLabel: 'Cabin: ascent stage', separate: '🚀 Separate the cabin', lmLabel: 'Lunar module with its two stages',
    seismometer: 'seismometer', takeStep: '👣 Take a step', stepLabel: 'Astronaut taking a step and the seismometer graph',
  },
  noWebglEyebrow: 'COULD NOT OPEN THE LUNAR MAP',
  noWebglTitle: '3D is turned off in this browser',
  noWebglText: 'To explore the Moon, ask an adult to turn on <strong>hardware acceleration</strong> in the browser settings (Chrome or Edge: Settings → System) and reload the page.',
  noWebglSmall: 'This browser offered neither WebGL nor WebGPU. On school computers, 3D may be blocked by the network or an administrator: try another browser or device.',
};

const TEXTS: Record<Lang, UiText> = { pt, en };
const STORAGE_KEY = 'space-historians:idioma';

let current: Lang = 'pt';

/** Textos de interface no idioma atual. */
export function ui(): UiText {
  return TEXTS[current];
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignora */ }
  document.documentElement.lang = TEXTS[lang].htmlLang;
  document.title = TEXTS[lang].pageTitle;
  applyStaticTexts();
}

/** Idioma pedido na URL (?lang=en) ou o último escolhido neste navegador. */
export function preferredLang(): { lang: Lang; fromUrl: boolean } {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  const isLang = (value: string | null): value is Lang => LANGS.includes(value as Lang);
  if (isLang(fromUrl)) return { lang: fromUrl, fromUrl: true };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return { lang: saved, fromUrl: false };
  } catch { /* ignora */ }
  const browser = navigator.language?.toLowerCase().slice(0, 2);
  return { lang: isLang(browser) ? browser : 'en', fromUrl: false };
}

type StaticKey = { [K in keyof UiText]: UiText[K] extends string ? K : never }[keyof UiText];

/** Aplica os textos fixos do HTML marcados com data-i18n, data-i18n-html e data-i18n-aria. */
export function applyStaticTexts() {
  const text = ui();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    node.textContent = text[node.dataset.i18n as StaticKey];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((node) => {
    node.innerHTML = text[node.dataset.i18nHtml as StaticKey];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', text[node.dataset.i18nAria as StaticKey]);
  });
}
