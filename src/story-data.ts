// Conteúdo narrativo do jogo. Fonte: documento "Space Historians — As histórias que ficaram na Lua".
// Os textos ficam aqui para que possam ser revisados e traduzidos sem mexer na cena 3D.

/** Simulações exibidas na ficha. São sempre identificadas como representações do jogo. */
export type Simulation =
  | { kind: 'seismic-compare' }
  | { kind: 'photo-compare' }
  | { kind: 'seismic-pulse'; sensors: 1 | 3; subsurface?: boolean }
  | { kind: 'heat-probe' }
  | { kind: 'rover-drive'; stops: string[] }
  | { kind: 'laser' }
  | { kind: 'lm-stages' }
  | { kind: 'footstep' };

type ActivityBase = {
  prompt: string;
  success: string;
  /** Pista exibida quando a resposta está incorreta. */
  hint?: string;
};

/** Escolher uma opção. Se houver simulação, ela precisa ser usada antes de responder. */
export type ChoiceActivity = ActivityBase & {
  type?: 'choice';
  options: string[];
  correct: number;
  simulation?: Simulation;
};

/** Associar cada item à sua evidência. */
export type MatchActivity = ActivityBase & {
  type: 'match';
  pairs: { item: string; answer: string }[];
};

/** Colocar etapas na ordem certa. `sequence` está na ordem correta. */
export type OrderActivity = ActivityBase & {
  type: 'order';
  sequence: string[];
};

/** Concluir uma simulação (dirigir o rover, separar os estágios, produzir uma vibração). */
export type SimulationActivity = ActivityBase & {
  type: 'simulation';
  simulation: Simulation;
};

export type Activity = ChoiceActivity | MatchActivity | OrderActivity | SimulationActivity;

export type StoryStep = {
  id: 'identity' | 'function' | 'evidence';
  label: string;
  reward: number;
  title: string;
  paragraphs: string[];
  activity: Activity;
};

/** Tipo de equipamento: define o modelo 3D simplificado e o ícone da ficha. */
export type EquipmentKind = 'alsep' | 'surveyor' | 'rover' | 'reflector' | 'lm-descent' | 'psep';

export type Discovery = {
  number: string;
  title: string;
  subtitle: string;
  mission: string;
  year: string;
  location: string;
  kind: EquipmentKind;
  /** Fotografia histórica do equipamento (caminho público). */
  image: string;
  /** Descrição da fotografia para leitores de tela. */
  imageAlt: string;
  /** Crédito da fotografia; igual em todos os idiomas. */
  imageCredit: string;
  /** Posição no mapa do jogo (x, z). O mapa é uma representação compacta, fora de escala. */
  position: { x: number; z: number };
  route: { label: string; detail: string };
  objective: string;
  teaser: string;
  encounter: string[];
  steps: StoryStep[];
  /** Pergunta bônus opcional (vale pontos extras; nunca bloqueia o progresso). */
  quiz: ChoiceActivity;
  facts: string;
  fiction: string;
};

export type Prologue = {
  eyebrow: string;
  title: string;
  /** Páginas do prólogo. Os parágrafos são exibidos como HTML. */
  pages: { paragraphs: string[]; quote?: string }[];
};

const LABELS = { identity: 'O que é?', function: 'O que fez na Lua?', evidence: 'Como sabemos?' } as const;

const discoveries: Discovery[] = [
  {
    number: '01',
    title: 'ALSEP da Apollo 12',
    subtitle: 'O chão guardou a partida',
    mission: 'Apollo 12',
    year: '1969',
    location: 'Oceanus Procellarum',
    kind: 'alsep',
    image: '/images/discoveries/01-apollo-12-alsep.webp',
    imageAlt: 'A central da estação, coberta por uma manta prateada e com uma antena em forma de haste, sobre o solo cheio de pegadas; ao fundo, o módulo lunar Intrepid.',
    imageCredit: 'NASA · AS12-47-6928',
    position: { x: 1.8, z: -6.5 },
    route: { label: 'Estação Lunar', detail: 'Apollo 12' },
    objective: 'Encontre a estação lunar',
    teaser: 'Siga o sinal luminoso. Um laboratório deixado na Lua ainda tem uma história para contar.',
    encounter: [
      'Uma antena se destaca em Oceanus Procellarum. Cabos ligam a central a instrumentos espalhados pelo terreno.',
      'Você abre a ficha. Um registro cheio de pequenas oscilações aparece na tela.',
      'Por que o chão se moveu? A resposta pode estar em uma nave que já partiu.',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Uma estação científica',
        paragraphs: [
          'Você encontrou o ALSEP da Apollo 12, uma estação científica instalada em 1969.',
          'Ela reunia instrumentos para investigar a Lua, incluindo um sismômetro, que registrava vibrações do solo. Sua antena transmitia medições à Terra.',
          'Depois da partida dos astronautas, a estação continuou enviando informações.',
        ],
        activity: {
          prompt: 'Qual instrumento registrava as vibrações do solo?',
          options: ['Sismômetro', 'Câmera', 'Antena parabólica'],
          correct: 0,
          success: 'Descoberta registrada: uma estação podia continuar a pesquisa sem pessoas ao lado.',
          hint: 'Pista: releia o texto e procure o instrumento que registrava as vibrações do solo.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'O chão registrou o impacto',
        paragraphs: [
          'O sismômetro percebeu vibrações da decolagem do Intrepid. Depois, registrou por quase uma hora as vibrações do impacto planejado de seu estágio de subida, já vazio.',
        ],
        activity: {
          prompt: 'Qual registro mostra vibrações que continuam depois do impacto?',
          options: ['━━━ linha quase imóvel', '〰〰〰 oscilações prolongadas'],
          correct: 1,
          simulation: { kind: 'seismic-compare' },
          success: 'As oscilações aparecem. Você encontrou a pista deixada pelo acontecimento!',
          hint: 'Pista: depois do impacto, o chão continuou vibrando por quase uma hora. Qual registro mostra um movimento que continua?',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Registros que se confirmam',
        paragraphs: [
          'Os registros da missão documentam o impacto. Os dados do sismômetro mostram as vibrações. Relacionar os dois ajudou os cientistas a interpretar o sinal e testar o instrumento.',
        ],
        activity: {
          prompt: 'Que duas evidências precisam ser ligadas?',
          options: ['Registro do impacto + sinal sísmico', 'Fotografia + marca de roda', 'Mapa + amostra de rocha'],
          correct: 0,
          success: 'Sua ficha está completa. O módulo partiu, mas o chão guardou seu rastro.',
          hint: 'Pista: o texto fala de dois registros que se confirmam: um da missão e outro do sismômetro.',
        },
      },
    ],
    quiz: {
      prompt: 'O que a antena desta estação fazia?',
      options: ['Iluminava o terreno durante a noite', 'Transmitia as medições para a Terra', 'Registrava as vibrações do solo'],
      correct: 1,
      success: 'Isso mesmo! A antena enviava as medições para a Terra, mesmo depois da partida dos astronautas.',
      hint: 'Pista: em “O que é?”, procure o que o texto diz sobre a antena.',
    },
    facts: 'Instalação em 1969, instrumentos, transmissão e registros da decolagem e do impacto. Fontes da ficha: NASA e estudos do ALSEP.',
    fiction: 'Percurso, registros simplificados, desafio, mochila e pontos.',
  },
  {
    number: '02',
    title: 'Surveyor 3',
    subtitle: 'A visita que deixou pistas',
    mission: 'Surveyor 3',
    year: '1967',
    location: 'Oceano das Tempestades',
    kind: 'surveyor',
    image: '/images/discoveries/02-surveyor-3.webp',
    imageAlt: 'Astronauta ao lado da Surveyor 3, tocando a câmera da sonda; ao fundo, o módulo lunar da Apollo 12.',
    imageCredit: 'NASA · AS12-48-7134',
    position: { x: -14, z: -19 },
    route: { label: 'Surveyor 3', detail: 'sonda robótica' },
    objective: 'Encontre a sonda dentro da cratera',
    teaser: 'Uma estrutura de três pernas espera dentro de uma cratera. Algumas peças parecem faltar.',
    encounter: [
      'Dentro de uma cratera, você encontra uma estrutura de três pernas. Na imagem histórica aberta pela mochila, ela parece mais completa.',
      'Você aproxima as duas imagens. Algumas peças estão ausentes.',
      'Alguém esteve ali depois do pouso?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Um robô antes dos astronautas',
        paragraphs: [
          'Esta é a Surveyor 3, uma sonda robótica da NASA que pousou em 1967, no Oceano das Tempestades.',
          'Ela estudou a superfície antes da chegada dos primeiros astronautas ao solo lunar.',
          'Seu pouso teve uma surpresa: a sonda deu dois saltos antes de parar!',
        ],
        activity: {
          prompt: 'Quem investigou esse terreno antes dos astronautas?',
          options: ['Uma sonda robótica', 'Um carro lunar', 'Uma estação com antena'],
          correct: 0,
          success: 'Descoberta registrada: um robô investigou esse terreno antes dos astronautas.',
          hint: 'Pista: a Surveyor 3 pousou em 1967, dois anos antes da chegada da Apollo 12.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Imagens, uma pá e uma visita',
        paragraphs: [
          'Sua câmera registrou mais de seis mil imagens. Uma pequena pá investigou a resistência do solo, ajudando a avaliar se ele sustentaria um módulo lunar.',
          'Em 1969, astronautas da Apollo 12 visitaram a sonda e recuperaram componentes.',
        ],
        activity: {
          prompt: 'Compare as imagens. Quais componentes foram recuperados na visita de 1969?',
          options: ['A câmera e a pá', 'As três pernas', 'A cratera inteira'],
          correct: 0,
          simulation: { kind: 'photo-compare' },
          success: 'As diferenças começam a fazer sentido.',
          hint: 'Pista: as pernas continuam na cratera. Procure as peças que sumiram da imagem atual.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Três evidências, um mistério',
        paragraphs: [
          'Os registros da Apollo 12 documentam a visita. As peças levadas à Terra permitiram estudar efeitos da exposição ao ambiente lunar. Imagens orbitais ajudam a localizar a estrutura restante.',
        ],
        activity: {
          type: 'match',
          prompt: 'Associe cada pista à sua evidência.',
          pairs: [
            { item: 'A visita', answer: 'Registros da Apollo 12' },
            { item: 'O estudo das peças', answer: 'Componentes levados à Terra' },
            { item: 'A localização', answer: 'Imagens orbitais' },
          ],
          success: 'Você resolveu o mistério. Sua mochila guarda as descobertas; a Surveyor permanece na cratera.',
          hint: 'Pista: releia o texto. Cada evidência responde a uma pergunta diferente.',
        },
      },
    ],
    quiz: {
      prompt: 'Quantas imagens a câmera da Surveyor 3 registrou?',
      options: ['Cerca de cem', 'Exatamente doze', 'Mais de seis mil'],
      correct: 2,
      success: 'Isso! A câmera da Surveyor 3 registrou mais de seis mil imagens da superfície.',
      hint: 'Pista: em “O que fez na Lua?”, procure o que o texto diz sobre a câmera.',
    },
    facts: 'Pouso e saltos, câmera, pá, visita da Apollo 12 e recuperação de componentes. Fontes da ficha: NASA e NSSDCA.',
    fiction: 'Mistério, comparação interativa e pontuação.',
  },
  {
    number: '03',
    title: 'ALSEP da Apollo 14',
    subtitle: 'Uma pergunta debaixo dos pés',
    mission: 'Apollo 14',
    year: '1971',
    location: 'Fra Mauro',
    kind: 'alsep',
    image: '/images/discoveries/03-apollo-14-alsep.webp',
    imageAlt: 'A central da estação, embrulhada em uma manta dourada, com o mastro da antena à frente e cabos espalhados pelo solo de Fra Mauro.',
    imageCredit: 'NASA · AS14-67-9378',
    position: { x: -30, z: -36 },
    route: { label: 'Estação Lunar', detail: 'Apollo 14' },
    objective: 'Siga os cabos da estação em Fra Mauro',
    teaser: 'Em Fra Mauro, cabos levam a uma estação que investigava o que não se vê.',
    encounter: [
      'Em Fra Mauro, você acompanha os cabos de uma estação científica.',
      'A mochila apresenta uma ilustração do terreno. Abaixo da superfície, uma região aparece coberta por uma interrogação.',
      'Como descobrir algo sobre um lugar que você não consegue enxergar?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Uma estação que usa vibrações',
        paragraphs: [
          'Este é o ALSEP da Apollo 14, instalado em 1971.',
          'O conjunto chegou no módulo Antares. Seus instrumentos foram preparados para realizar pesquisas e enviar medições à Terra depois da partida da tripulação.',
          'Entre eles estava um experimento sísmico ativo.',
        ],
        activity: {
          prompt: 'Qual experimento fazia parte desta estação?',
          options: ['Um experimento sísmico ativo', 'Um refletor de laser', 'Um carro lunar'],
          correct: 0,
          success: 'Descoberta registrada: essa estação investigava o terreno usando vibrações.',
          hint: 'Pista: o último parágrafo diz qual experimento estava entre os instrumentos.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Uma pista atravessa o solo',
        paragraphs: [
          'O experimento produzia vibrações na superfície. Sensores registravam os sinais que passavam pelo terreno, ajudando a estudar suas camadas rasas.',
          'Na simulação, um sensor aguarda o sinal.',
        ],
        activity: {
          type: 'simulation',
          prompt: 'Produza uma vibração virtual e observe quando ela aparece no registro do sensor.',
          simulation: { kind: 'seismic-pulse', sensors: 1 },
          success: 'A marca surge na tela. Uma pista atravessou o solo!',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Da vibração à descoberta',
        paragraphs: [
          'Os pesquisadores conheciam a origem das vibrações e estudavam os sinais recebidos. Os documentos dos instrumentos e as pesquisas sobre seus resultados explicam essa investigação.',
        ],
        activity: {
          type: 'order',
          prompt: 'Toque nas etapas na ordem certa.',
          sequence: ['Produzir a vibração', 'Registrar o sinal', 'Estudar os dados'],
          success: 'A interrogação dá lugar à descoberta: movimentos registrados na superfície ajudavam a investigar o que havia abaixo dela.',
          hint: 'Pista: primeiro algo precisa acontecer no solo; só depois existe um sinal para estudar.',
        },
      },
    ],
    quiz: {
      prompt: 'Em qual módulo lunar esta estação chegou à Lua?',
      options: ['Antares', 'Falcon', 'Eagle'],
      correct: 0,
      success: 'Certo! O ALSEP da Apollo 14 chegou a Fra Mauro no módulo Antares.',
      hint: 'Pista: o segundo parágrafo de “O que é?” diz o nome do módulo.',
    },
    facts: 'Instalação, transporte no Antares e experimento sísmico ativo. Fontes da ficha: NASA e estudo dos experimentos.',
    fiction: 'Ilustração, sequência interativa e sinais simulados.',
  },
  {
    number: '04',
    title: 'ALSEP da Apollo 15',
    subtitle: 'A pista invisível',
    mission: 'Apollo 15',
    year: '1971',
    location: 'Hadley–Apennine',
    kind: 'alsep',
    image: '/images/discoveries/04-apollo-15-alsep.webp',
    imageAlt: 'A antena e a central dourada da estação em primeiro plano; um cabo cor de cobre atravessa o solo até um instrumento ao longe.',
    imageCredit: 'NASA · AS15-87-11845',
    position: { x: -12, z: -50 },
    route: { label: 'Estação Lunar', detail: 'Apollo 15' },
    objective: 'Encontre a estação de Hadley–Apennine',
    teaser: 'Encontre uma pista que não aparece em uma fotografia.',
    encounter: [
      'Você chega à estação de Hadley–Apennine. Antena, cabos e instrumentos aparecem no terreno.',
      'O desafio da mochila é curto: “Encontre uma pista que não aparece em uma fotografia.”',
      'Você observa novamente. Talvez seja preciso olhar de outro jeito.',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Calor que vem de dentro',
        paragraphs: [
          'Este é o ALSEP da Apollo 15, instalado em 1971.',
          'Ele chegou no módulo Falcon e reunia instrumentos para estudar a Lua. Entre eles estavam um sismômetro e um experimento de fluxo de calor.',
          'A pista procurada está nas medições de temperatura.',
        ],
        activity: {
          prompt: 'Onde está a pista que não aparece na fotografia?',
          options: ['Nas medições de temperatura', 'Na cor das rochas', 'No formato da antena'],
          correct: 0,
          success: 'Descoberta registrada: o interior lunar também podia ser investigado pelo calor.',
          hint: 'Pista: o último parágrafo revela onde a pista está.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Sensores em duas profundidades',
        paragraphs: [
          'Sensores ajudaram a estimar quanto calor escapava do interior da Lua naquela região.',
          'Na simulação, você vê o solo com sensores em duas profundidades.',
        ],
        activity: {
          prompt: 'Compare as temperaturas simuladas. O que você observa?',
          options: [
            'O sensor mais fundo marca uma temperatura mais alta',
            'Os dois sensores marcam exatamente o mesmo',
            'O sensor mais raso é o mais quente',
          ],
          correct: 0,
          simulation: { kind: 'heat-probe' },
          success: 'As leituras ficam lado a lado. Você encontrou informações que a aparência da paisagem não revelava.',
          hint: 'Pista: compare os dois números. Qual sensor está mais perto do interior da Lua?',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'A evidência certa',
        paragraphs: [
          'Os cientistas estudaram medições dos sensores para estimar a passagem de calor pelo terreno. A ficha indica estudos dos instrumentos e dos resultados.',
        ],
        activity: {
          prompt: 'Qual evidência sustenta essa descoberta?',
          options: ['Os dados de temperatura dos sensores', 'Uma fotografia da paisagem'],
          correct: 0,
          success: 'Você selecionou as medições. A pista invisível agora faz parte do seu arquivo.',
          hint: 'Pista: lembre-se do desafio: a pista não aparece em uma fotografia.',
        },
      },
    ],
    quiz: {
      prompt: 'Além do experimento de fluxo de calor, que outro instrumento fazia parte desta estação?',
      options: ['Um refletor de laser', 'Uma pá robótica', 'Um sismômetro'],
      correct: 2,
      success: 'Isso! A estação reunia um sismômetro e um experimento de fluxo de calor.',
      hint: 'Pista: o segundo parágrafo de “O que é?” cita dois instrumentos.',
    },
    facts: 'Instalação, transporte no Falcon e investigação do calor interno. Fontes da ficha: NASA e estudo científico.',
    fiction: 'Desafio, corte do solo e temperaturas ilustrativas.',
  },
  {
    number: '05',
    title: 'Rover da Apollo 15',
    subtitle: 'O carro que precisava caber',
    mission: 'Apollo 15',
    year: '1971',
    location: 'Hadley–Apennine',
    kind: 'rover',
    image: '/images/discoveries/05-apollo-15-rover.webp',
    imageAlt: 'O rover estacionado, com dois assentos, quatro rodas e uma antena em forma de guarda-chuva, diante de montanhas lunares.',
    imageCredit: 'NASA · AS15-88-11901',
    position: { x: 6, z: -42 },
    route: { label: 'Rover', detail: 'Apollo 15' },
    objective: 'Siga as marcas de rodas',
    teaser: 'Marcas de rodas levam a um carro estacionado. Como ele coube dentro da nave?',
    encounter: [
      'Marcas de rodas conduzem você até um carro estacionado.',
      'A mochila mostra o veículo e o compartimento do Falcon. Você compara os tamanhos.',
      'Há um problema curioso para resolver: como aquele carro viajou dentro da nave?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'O primeiro carro na Lua',
        paragraphs: [
          'Este é o Lunar Roving Vehicle da Apollo 15, de 1971: o primeiro carro dirigido na Lua.',
          'Ele tinha dois assentos e quatro rodas de malha metálica. Transportava astronautas, ferramentas e amostras pela região de Hadley–Apennine.',
        ],
        activity: {
          prompt: 'O que o rover transportava?',
          options: ['Astronautas, ferramentas e amostras', 'Combustível para a nave', 'Água para uma base'],
          correct: 0,
          success: 'Descoberta registrada: explorar a Lua também ganhou caminhos sobre rodas.',
          hint: 'Pista: o segundo parágrafo lista o que ele levava.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Viajar dobrado',
        paragraphs: [
          'O rover levou a tripulação até a borda de Hadley Rille para observar o terreno e coletar amostras. Percorreu 27,9 quilômetros durante a missão.',
          'O segredo do transporte era viajar dobrado!',
        ],
        activity: {
          type: 'simulation',
          prompt: 'Conduza a cópia virtual do rover até a estação de coleta.',
          simulation: { kind: 'rover-drive', stops: ['Módulo', 'Cratera', 'Hadley Rille'] },
          success: 'Agora você compreende como ele coube e por que foi útil.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Três perguntas, três evidências',
        paragraphs: [
          'Documentos da NASA descrevem o transporte e a abertura do carro. Registros informam a distância percorrida, e imagens orbitais identificam seu estacionamento.',
        ],
        activity: {
          type: 'match',
          prompt: 'Associe cada pergunta à sua evidência.',
          pairs: [
            { item: 'Como chegou', answer: 'Documentos sobre o transporte' },
            { item: 'Quanto percorreu', answer: 'Registros da distância' },
            { item: 'Onde ficou', answer: 'Imagens orbitais' },
          ],
          success: 'Você retorna à visão do equipamento. Ele continua parado, mas sua ficha agora conta uma viagem.',
          hint: 'Pista: uma imagem tirada de cima mostra um lugar; os registros mostram números.',
        },
      },
    ],
    quiz: {
      prompt: 'De que eram feitas as rodas deste rover?',
      options: ['De borracha cheia de ar', 'De malha metálica', 'De madeira'],
      correct: 1,
      success: 'Isso! As quatro rodas do rover eram de malha metálica.',
      hint: 'Pista: o segundo parágrafo de “O que é?” descreve as rodas.',
    },
    facts: 'Primeiro carro lunar, transporte dobrado, Hadley Rille e percurso de 27,9 km. Fontes da ficha: NASA, NSSDC e LROC.',
    fiction: 'Cópia dirigível, trajeto e associação de evidências.',
  },
  {
    number: '06',
    title: 'ALSEP da Apollo 16',
    subtitle: 'O espaço em branco',
    mission: 'Apollo 16',
    year: '1972',
    location: 'Terras altas de Descartes',
    kind: 'alsep',
    image: '/images/discoveries/06-apollo-16-alsep.webp',
    imageAlt: 'Vista da estação nas terras altas de Descartes: a antena à direita e instrumentos espalhados pelo solo, ligados por cabos finos.',
    imageCredit: 'NASA · AS16-113-18355',
    position: { x: 24, z: -54 },
    route: { label: 'Estação Lunar', detail: 'Apollo 16' },
    objective: 'Encontre a estação de Descartes',
    teaser: 'Uma ficha com um espaço em branco. Por que falta uma medição?',
    encounter: [
      'Nas terras altas de Descartes, você encontra outra estação.',
      'A mochila abre dois campos: vibrações e calor. O primeiro tem dados; o segundo, uma observação histórica.',
      'Por que aquele espaço não mostra uma medição?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Pesquisas no mesmo lugar',
        paragraphs: [
          'Este é o ALSEP da Apollo 16, instalado em 1972.',
          'Ele chegou no módulo Orion. O conjunto incluía uma central, antena e instrumentos ligados por cabos, com experimentos sísmicos e de fluxo de calor.',
        ],
        activity: {
          prompt: 'Quais experimentos este conjunto reunia?',
          options: ['Sísmicos e de fluxo de calor', 'Apenas uma câmera', 'Um refletor de laser'],
          correct: 0,
          success: 'Descoberta registrada: uma estação reunia pesquisas diferentes no mesmo local.',
          hint: 'Pista: o fim do segundo parágrafo cita os experimentos.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Quem recebeu primeiro?',
        paragraphs: [
          'O experimento sísmico ativo ajudou a estudar as camadas rasas do terreno.',
          'Na simulação, sensores recebem uma vibração em momentos diferentes.',
        ],
        activity: {
          prompt: 'Compare os registros. Qual sensor recebeu o sinal primeiro?',
          options: ['Sensor 1, o mais próximo', 'Sensor 2', 'Sensor 3, o mais distante'],
          correct: 0,
          simulation: { kind: 'seismic-pulse', sensors: 3 },
          success: 'Você salvou a observação. Falta compreender o campo do calor: para isso, consulte o que aconteceu durante a instalação.',
          hint: 'Pista: a vibração sai de um ponto e viaja pelo solo. Qual sensor ela alcança antes?',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Registrar o que deu errado',
        paragraphs: [
          'Os documentos da missão registram que um cabo do experimento de calor se rompeu durante a instalação. Esse experimento foi perdido.',
        ],
        activity: {
          prompt: 'Como completar o campo do calor?',
          options: ['“Experimento perdido”, segundo o registro histórico', 'Inventar uma temperatura qualquer', 'Apagar o campo da ficha'],
          correct: 0,
          success: 'O espaço em branco ganhou uma explicação. Você aprendeu que uma pesquisa também precisa registrar problemas e reconhecer os resultados que não conseguiu obter.',
          hint: 'Pista: o registro histórico conta o que aconteceu com o cabo.',
        },
      },
    ],
    quiz: {
      prompt: 'O que aconteceu com o cabo do experimento de calor?',
      options: ['Ele se rompeu durante a instalação', 'Foi levado de volta à Terra', 'Foi trocado por uma antena'],
      correct: 0,
      success: 'Isso! O cabo se rompeu durante a instalação, e os documentos da missão registraram o problema.',
      hint: 'Pista: em “Como sabemos?”, veja o que os documentos da missão registram.',
    },
    facts: 'Instalação, estudo sísmico e perda do experimento de calor. Fontes da ficha: NASA e estudo dos instrumentos.',
    fiction: 'Campos digitais, comparação dos sinais e desafio.',
  },
  {
    number: '07',
    title: 'Rover da Apollo 16',
    subtitle: 'A câmera que ficou',
    mission: 'Apollo 16',
    year: '1972',
    location: 'Descartes',
    kind: 'rover',
    image: '/images/discoveries/07-apollo-16-rover.webp',
    imageAlt: 'Um astronauta no rover, à esquerda, e o módulo lunar Orion, à direita, com pegadas e marcas de rodas no solo.',
    imageCredit: 'NASA · AS16-116-18578',
    position: { x: 40, z: -40 },
    route: { label: 'Rover', detail: 'Apollo 16' },
    objective: 'Siga as marcas de rodas em Descartes',
    teaser: '“Ela teve vista de uma partida.” Qual partida?',
    encounter: [
      'Você segue marcas de rodas em Descartes até encontrar um veículo estacionado.',
      'A câmera ganha destaque no painel. Uma frase aparece: “Ela teve vista de uma partida.”',
      'Qual partida? Abra a ficha para investigar.',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Um carro elétrico na Lua',
        paragraphs: [
          'Este é o rover da Apollo 16, usado por John Young e Charles Duke em 1972.',
          'O carro elétrico tinha quatro rodas e dois assentos. Viajou dobrado no Orion e foi aberto na superfície lunar.',
        ],
        activity: {
          prompt: 'Como o rover viajou até a Lua?',
          options: ['Dobrado, dentro do Orion', 'Montado, preso do lado de fora', 'Em um foguete só para ele'],
          correct: 0,
          success: 'Descoberta registrada: o carro ajudava a transportar pessoas, ferramentas e amostras.',
          hint: 'Pista: o segundo parágrafo conta como ele viajou.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Até North Ray',
        paragraphs: [
          'O rover ampliou a área de exploração. Levou os astronautas à North Ray Crater, onde coletaram amostras na região de House Rock.',
        ],
        activity: {
          type: 'simulation',
          prompt: 'Conduza a cópia virtual pelo percurso até a estação de coleta.',
          simulation: { kind: 'rover-drive', stops: ['Módulo', 'North Ray', 'House Rock'] },
          success: 'Você abre a pista da câmera: ela teve vista da decolagem do Orion. O carro ficou enquanto a tripulação partia.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Um último olhar',
        paragraphs: [
          'O documento da NASA indicado na ficha registra que a decolagem ocorreu à vista da câmera. Imagens orbitais ajudam a identificar o estacionamento final.',
        ],
        activity: {
          type: 'match',
          prompt: 'Relacione cada pista à sua evidência.',
          pairs: [
            { item: 'A decolagem vista pela câmera', answer: 'Documento da NASA' },
            { item: 'O estacionamento final', answer: 'Imagem orbital' },
          ],
          success: 'Você resolveu a pista. A câmera daquele carro fazia parte de um último olhar sobre a partida.',
          hint: 'Pista: uma imagem tirada da órbita mostra onde o carro está.',
        },
      },
    ],
    quiz: {
      prompt: 'Que lugar o rover ajudou os astronautas a alcançar?',
      options: ['A cratera Shorty', 'Hadley Rille', 'A North Ray Crater'],
      correct: 2,
      success: 'Isso! O rover levou John Young e Charles Duke até a North Ray Crater, onde coletaram amostras.',
      hint: 'Pista: releia “O que fez na Lua?” e procure o nome da cratera.',
    },
    facts: 'Tripulação, transporte, locais de coleta e câmera com vista da decolagem. Fontes da ficha: NASA, NSSDC e LROC.',
    fiction: 'Destaque da câmera, percurso virtual e desafio.',
  },
  {
    number: '08',
    title: 'Refletor da Apollo 11',
    subtitle: 'Uma mensagem de luz',
    mission: 'Apollo 11',
    year: '1969',
    location: 'Mar da Tranquilidade',
    kind: 'reflector',
    image: '/images/discoveries/08-apollo-11-reflector.webp',
    imageAlt: 'O painel refletor, com dezenas de pequenos elementos, sobre o solo cheio de pegadas; no canto, uma perna do módulo Eagle.',
    imageCredit: 'NASA · AS11-40-5952',
    position: { x: 44, z: -18 },
    route: { label: 'Refletor', detail: 'Apollo 11' },
    objective: 'Encontre o pequeno painel',
    teaser: 'Um pequeno painel ajuda a medir uma distância enorme.',
    encounter: [
      'Perto da base do Eagle, um pequeno painel chama sua atenção.',
      'Ele parece simples diante da paisagem enorme.',
      'A mochila apresenta o desafio: “Descubra como este objeto ajuda a medir uma distância entre a Terra e a Lua.”',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Um painel que devolve luz',
        paragraphs: [
          'Este é o refletor de laser da Apollo 11, instalado em 1969.',
          'O painel tem cem elementos de sílica que devolvem parte da luz na direção de onde ela veio. Pode fazer isso sem produzir sua própria energia.',
        ],
        activity: {
          prompt: 'O que o painel faz com a luz que recebe?',
          options: ['Devolve parte dela na direção de onde veio', 'Guarda a luz como uma bateria', 'Produz sua própria luz'],
          correct: 0,
          success: 'Descoberta registrada: um painel pode devolver luz recebida da Terra.',
          hint: 'Pista: o painel funciona sem produzir energia própria.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Ida e volta da luz',
        paragraphs: [
          'Observatórios terrestres enviam pulsos de laser ao refletor. Parte da luz retorna.',
          'Envie um pulso no simulador e acompanhe seu tempo de ida e volta.',
        ],
        activity: {
          prompt: 'O que esse intervalo de tempo permite descobrir?',
          options: ['A distância entre a Terra e a Lua', 'A temperatura da Lua', 'O tamanho do painel'],
          correct: 0,
          simulation: { kind: 'laser' },
          success: 'Uma linha luminosa desenhou o percurso, e o tempo apareceu no painel. Esse intervalo guarda uma distância!',
          hint: 'Pista: a luz viaja sempre na mesma velocidade. Quanto mais longe, mais tempo ela leva.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'O tempo vira distância',
        paragraphs: [
          'Medindo o tempo da viagem da luz, os cientistas calculam a distância entre o observatório e o refletor. As medições ajudam a acompanhar variações na distância Terra–Lua.',
        ],
        activity: {
          type: 'match',
          prompt: 'Associe cada medição ao que ela permite descobrir.',
          pairs: [
            { item: 'Tempo de ida e volta do pulso', answer: 'Cálculo da distância' },
            { item: 'Medições repetidas ao longo dos anos', answer: 'Variações da distância Terra–Lua' },
          ],
          success: 'Você encontrou o segredo. O painel ficou na Lua, mas sua utilidade alcança observatórios na Terra.',
          hint: 'Pista: um único tempo dá uma distância; muitas medições mostram mudanças.',
        },
      },
    ],
    quiz: {
      prompt: 'Quantos elementos de sílica o painel tem?',
      options: ['Dez', 'Cem', 'Mil'],
      correct: 1,
      success: 'Isso! São cem elementos que devolvem parte da luz na direção de onde ela veio.',
      hint: 'Pista: o segundo parágrafo de “O que é?” diz quantos elementos o painel tem.',
    },
    facts: 'Instalação, cem elementos, funcionamento e método de medição. Fontes da ficha: ILRS e documentos da Apollo 11.',
    fiction: 'Laser controlável, feixe visível e tempo ilustrativo.',
  },
  {
    number: '09',
    title: 'Base do Eagle',
    subtitle: 'A nave incompleta',
    mission: 'Apollo 11',
    year: '1969',
    location: 'Mar da Tranquilidade',
    kind: 'lm-descent',
    image: '/images/discoveries/09-eagle-base-lro.webp',
    imageAlt: 'Imagem orbital em preto e branco do terreno cheio de crateras do Mar da Tranquilidade, onde ficou a base do Eagle.',
    imageCredit: 'NASA/GSFC/Arizona State University · LRO',
    position: { x: 54, z: -4 },
    route: { label: 'Base do Eagle', detail: 'Apollo 11' },
    objective: 'Encontre a base do Eagle',
    teaser: 'Quatro pernas, uma escada e uma placa. Mas a nave parece incompleta.',
    encounter: [
      'Você identifica uma sombra na imagem orbital. A reconstrução revela quatro pernas, uma escada e uma placa.',
      'Mas a nave parece incompleta.',
      'Você consulta o arquivo. A parte que falta é justamente a pista para compreender o que aconteceu.',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'A parte de baixo do módulo',
        paragraphs: [
          'Este é o estágio de descida do Eagle, o módulo lunar da Apollo 11.',
          'Ele pousou com Neil Armstrong e Buzz Aldrin em 20 de julho de 1969. Tinha motor para frear a descida, quatro pernas e uma escada.',
        ],
        activity: {
          prompt: 'Que parte do Eagle ficou na Lua?',
          options: ['O estágio de descida, a parte de baixo', 'A cabine dos astronautas', 'O módulo inteiro'],
          correct: 0,
          success: 'Descoberta registrada: essa estrutura era a parte inferior do módulo.',
          hint: 'Pista: a nave parece incompleta. Pense em qual parte levou os astronautas embora.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'A cabine parte, a base fica',
        paragraphs: [
          'A base ajudou no pouso e serviu de apoio à decolagem. A parte superior levou os astronautas de volta à órbita para encontrar a Columbia.',
        ],
        activity: {
          type: 'simulation',
          prompt: 'Toque na cabine do modelo virtual e acompanhe a separação dos estágios.',
          simulation: { kind: 'lm-stages' },
          success: 'A cabine parte na animação. A base permanece. Agora a forma incompleta faz sentido.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Uma descoberta e uma incerteza',
        paragraphs: [
          'Os documentos da missão descrevem a separação. Uma imagem orbital indicada na ficha mostra a base na superfície.',
          'O destino final do estágio de subida não foi confirmado.',
        ],
        activity: {
          type: 'match',
          prompt: 'Associe cada parte ao que sabemos sobre ela.',
          pairs: [
            { item: 'A base na superfície', answer: 'Vista em imagem orbital' },
            { item: 'O destino final do estágio de subida', answer: 'Desconhecido: não confirmado' },
          ],
          success: 'Sua investigação registra tanto a descoberta quanto a incerteza que permanece.',
          hint: 'Pista: o texto diz claramente o que não foi confirmado.',
        },
      },
    ],
    quiz: {
      prompt: 'A parte superior do Eagle levou os astronautas de volta à órbita para encontrar qual nave?',
      options: ['Columbia', 'Challenger', 'Intrepid'],
      correct: 0,
      success: 'Certo! A parte superior do Eagle levou os astronautas de volta à órbita para encontrar a Columbia.',
      hint: 'Pista: em “O que fez na Lua?”, veja para onde a parte superior levou os astronautas.',
    },
    facts: 'Pouso, estágios, permanência da base e destino final não confirmado do estágio de subida. Fontes: documentos e imagem orbital da ficha.',
    fiction: 'Busca guiada e modelo animado.',
  },
  {
    number: '10',
    title: 'PSEP da Apollo 11',
    subtitle: 'O outro rastro de um passo',
    mission: 'Apollo 11',
    year: '1969',
    location: 'Mar da Tranquilidade',
    kind: 'psep',
    image: '/images/discoveries/10-apollo-11-seismometer.webp',
    imageAlt: 'Um astronauta caminha perto do PSEP, com seus dois painéis solares abertos; ao fundo, o módulo Eagle e uma bandeira.',
    imageCredit: 'NASA · AS11-40-5948',
    position: { x: 40, z: 9 },
    route: { label: 'PSEP', detail: 'Apollo 11' },
    objective: 'Siga as pegadas até o aparelho',
    teaser: 'Além da marca na poeira, que outra pista uma pisada pode deixar?',
    encounter: [
      'Pegadas conduzem você até um aparelho com dois painéis solares.',
      'A mochila apresenta uma pergunta: “Além da marca na poeira, que outra pista uma pisada pode deixar?”',
      'A resposta está naquele equipamento.',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Sismômetros movidos a Sol',
        paragraphs: [
          'Este é o PSEP da Apollo 11, instalado em 21 de julho de 1969.',
          'O conjunto tinha quatro sismômetros, antena e dois painéis solares. Sismômetros registram vibrações do chão.',
        ],
        activity: {
          prompt: 'O que os sismômetros registram?',
          options: ['Vibrações do chão', 'A luz do Sol', 'A temperatura do ar'],
          correct: 0,
          success: 'Descoberta registrada: movimentos do solo podem virar dados.',
          hint: 'Pista: a última frase do texto explica.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Um passo no gráfico',
        paragraphs: [
          'O PSEP registrou vibrações dos passos dos astronautas e de movimentos da tripulação dentro do Eagle.',
          'Faça o personagem da simulação dar um passo e observe o gráfico.',
        ],
        activity: {
          prompt: 'O que a oscilação no gráfico representa?',
          options: ['A vibração causada pelo passo', 'A pegada na poeira', 'O vento na Lua'],
          correct: 0,
          simulation: { kind: 'footstep' },
          success: 'Uma oscilação apareceu. A pegada mostra o lugar da pisada; o registro representa sua vibração.',
          hint: 'Pista: na Lua não há vento. O instrumento sente o chão tremer.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Sinais com explicação',
        paragraphs: [
          'Os relatórios da missão documentam os sinais. Os cientistas conseguiram relacionar alguns deles a atividades conhecidas da tripulação.',
        ],
        activity: {
          type: 'match',
          prompt: 'Associe cada rastro ao lugar onde ele aparece.',
          pairs: [
            { item: 'A vibração da pisada', answer: 'Sinal no sismômetro' },
            { item: 'O lugar da pisada', answer: 'Pegada na poeira' },
          ],
          success: 'Você encontrou o outro rastro de um passo. Uma pista ficou na poeira; outra pôde ser registrada por um instrumento.',
          hint: 'Pista: uma pista se vê no chão; a outra só aparece no instrumento.',
        },
      },
    ],
    quiz: {
      prompt: 'Quantos sismômetros o PSEP tinha?',
      options: ['Um', 'Dois', 'Quatro'],
      correct: 2,
      success: 'Isso! O PSEP tinha quatro sismômetros, além de uma antena e dois painéis solares.',
      hint: 'Pista: o segundo parágrafo de “O que é?” lista as partes do conjunto.',
    },
    facts: 'Instalação, composição e registros de passos e movimentos. Fontes da ficha: relatórios científicos e da missão Apollo 11.',
    fiction: 'Personagem da simulação, gráfico e ondas coloridas.',
  },
  {
    number: '11',
    title: 'ALSEP da Apollo 17',
    subtitle: 'Uma descoberta sem túnel',
    mission: 'Apollo 17',
    year: '1972',
    location: 'Taurus–Littrow',
    kind: 'alsep',
    image: '/images/discoveries/11-apollo-17-alsep.webp',
    imageAlt: 'Um instrumento coberto por uma manta dourada sobre o solo cheio de pegadas; ao fundo, outros equipamentos da estação, ligados por cabos, diante das montanhas de Taurus–Littrow.',
    imageCredit: 'NASA · AS17-134-20503',
    position: { x: 22, z: 26 },
    route: { label: 'Estação Lunar', detail: 'Apollo 17' },
    objective: 'Encontre a estação de Taurus–Littrow',
    teaser: 'Como investigar rochas que estão muito abaixo de você?',
    encounter: [
      'Em Taurus–Littrow, você encontra uma estação científica.',
      'No painel, uma seta aponta para baixo da superfície. Não há túnel nem passagem.',
      'Como investigar rochas que estão muito abaixo do lugar onde você está?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'Ondas que investigam',
        paragraphs: [
          'Este é o ALSEP da Apollo 17, ativado em dezembro de 1972.',
          'Ele chegou no módulo Challenger. Seus instrumentos foram instalados para realizar medições e transmitir os dados à Terra.',
          'Entre eles estava um experimento de perfil sísmico.',
        ],
        activity: {
          prompt: 'Qual experimento ajudava a investigar o interior?',
          options: ['Um experimento de perfil sísmico', 'Uma câmera de televisão', 'Um painel refletor'],
          correct: 0,
          success: 'Descoberta registrada: ondas podiam ajudar a investigar o interior lunar.',
          hint: 'Pista: o último parágrafo cita o experimento.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: 'Três quilômetros abaixo',
        paragraphs: [
          'As ondas registradas pelo experimento ajudaram a investigar a crosta lunar até cerca de três quilômetros de profundidade naquela região.',
        ],
        activity: {
          prompt: 'Compare os sinais dos sensores. O que acontece nos sensores mais distantes?',
          options: ['O sinal chega mais tarde', 'O sinal chega antes', 'Nada muda'],
          correct: 0,
          simulation: { kind: 'seismic-pulse', sensors: 3, subsurface: true },
          success: 'Uma ilustração do subsolo se abre. Ela representa a região investigada e ajuda você a acompanhar a explicação.',
          hint: 'Pista: a onda precisa viajar mais para chegar aos sensores distantes.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'Evidência ou ilustração?',
        paragraphs: [
          'Os pesquisadores estudaram os registros das ondas para investigar as estruturas sob a superfície. Os estudos indicados na ficha explicam esses resultados.',
        ],
        activity: {
          prompt: 'Qual é a evidência dessa descoberta?',
          options: ['Os registros dos sensores', 'A ilustração do subsolo feita para o jogo'],
          correct: 0,
          success: 'Você completou a descoberta. A investigação alcançou profundidades que os astronautas não precisaram visitar: o caminho até elas estava nos sinais.',
          hint: 'Pista: a ilustração só ajuda a explicar; os dados vieram dos instrumentos.',
        },
      },
    ],
    quiz: {
      prompt: 'Até que profundidade as ondas ajudaram a investigar a crosta lunar naquela região?',
      options: ['Cerca de três metros', 'Cerca de três quilômetros', 'Até o centro da Lua'],
      correct: 1,
      success: 'Isso! As ondas ajudaram a investigar a crosta até cerca de três quilômetros de profundidade, sem nenhum túnel.',
      hint: 'Pista: o título e o texto de “O que fez na Lua?” trazem a profundidade.',
    },
    facts: 'Ativação, transporte e investigação sísmica até cerca de 3 km na região. Fontes da ficha: NASA e estudo científico.',
    fiction: 'Desafio, sinais simplificados e ilustração subterrânea.',
  },
  {
    number: '12',
    title: 'Rover da Apollo 17',
    subtitle: 'O detalhe perto da roda',
    mission: 'Apollo 17',
    year: '1972',
    location: 'Taurus–Littrow',
    kind: 'rover',
    image: '/images/discoveries/12-apollo-17-rover.webp',
    imageAlt: 'O rover estacionado ao lado de uma bandeira, visto do alto a partir do módulo lunar; no canto, aparece uma peça do módulo.',
    imageCredit: 'NASA · AS17-140-21354',
    position: { x: 2, z: 40 },
    route: { label: 'Rover', detail: 'Apollo 17' },
    objective: 'Acompanhe as marcas de rodas',
    teaser: 'Um pequeno detalhe perto da roda merece uma página na história.',
    encounter: [
      'Você acompanha marcas de rodas até um carro estacionado.',
      'O arquivo destaca uma pequena região perto da roda. Diante de um veículo inteiro, aquele detalhe parece discreto.',
      'Por que ele merece uma página na história da missão?',
    ],
    steps: [
      {
        id: 'identity',
        label: LABELS.identity,
        reward: 10,
        title: 'O último rover',
        paragraphs: [
          'Este é o rover da Apollo 17, usado em 1972 por Eugene Cernan e Harrison Schmitt.',
          'O carro elétrico tinha quatro rodas e dois assentos. Transportava astronautas, ferramentas e amostras por Taurus–Littrow.',
        ],
        activity: {
          prompt: 'Quem usou este rover?',
          options: ['Eugene Cernan e Harrison Schmitt', 'Neil Armstrong e Buzz Aldrin', 'John Young e Charles Duke'],
          correct: 0,
          success: 'Descoberta registrada: o veículo ampliava os deslocamentos da exploração.',
          hint: 'Pista: o primeiro parágrafo traz os nomes da tripulação.',
        },
      },
      {
        id: 'function',
        label: LABELS.function,
        reward: 20,
        title: '35,7 km e um para-lama',
        paragraphs: [
          'O rover percorreu 35,7 quilômetros durante a missão. Viajou dobrado no Challenger.',
        ],
        activity: {
          type: 'simulation',
          prompt: 'Abra a cópia virtual e percorra o trajeto indicado no simulador.',
          simulation: { kind: 'rover-drive', stops: ['Módulo', 'Cratera Shorty', 'Estação de coleta'] },
          success: 'Ao concluir, você consulta o detalhe: uma extensão do para-lama se soltou. Uma roda passou a lançar poeira sobre a tripulação e o carro. Uma pequena peça fazia diferença no trabalho.',
        },
      },
      {
        id: 'evidence',
        label: LABELS.evidence,
        reward: 30,
        title: 'O alcance e a dificuldade',
        paragraphs: [
          'O resumo da missão indicado na ficha registra tanto a distância percorrida quanto o episódio do para-lama.',
        ],
        activity: {
          prompt: 'Onde estão registradas a distância e o episódio do para-lama?',
          options: ['No resumo da missão', 'Apenas em uma pintura', 'Em nenhum registro'],
          correct: 0,
          success: 'Você completou a ficha. Ela agora conta o alcance da viagem e uma dificuldade encontrada no caminho. O rover permanece na superfície; sua história segue com você.',
          hint: 'Pista: o texto diz qual documento registra as duas informações.',
        },
      },
    ],
    quiz: {
      prompt: 'O que aconteceu depois que a extensão do para-lama se soltou?',
      options: ['Uma roda passou a lançar poeira sobre a tripulação e o carro', 'O rover parou de andar', 'A antena do rover caiu'],
      correct: 0,
      success: 'Isso! Sem a extensão do para-lama, a roda jogava poeira na tripulação e no carro. Uma peça pequena fazia diferença!',
      hint: 'Pista: depois de percorrer o trajeto no simulador, a ficha conta o que o detalhe perto da roda causou.',
    },
    facts: 'Tripulação, transporte dobrado, percurso de 35,7 km e episódio do para-lama. Fontes da ficha: NASA e NSSDC.',
    fiction: 'Destaque visual, cópia dirigível e trajeto.',
  },
];

const prologue: Prologue = {
  eyebrow: 'PRÓLOGO · UM ARQUIVO CHEIO DE PERGUNTAS',
  title: 'Um arquivo cheio de perguntas',
  pages: [
    {
      paragraphs: [
        'A superfície lunar ocupa a janela da sua nave. Há crateras, pedras e sombras compridas. No mapa, pequenos pontos marcam os locais que você poderá explorar.',
        'Você abre a mochila digital. O arquivo <strong>Space Historians</strong> aparece com doze fichas ainda incompletas.',
      ],
    },
    {
      paragraphs: [
        'Cada uma tem o nome de um equipamento. Algumas mostram antenas; outras, carros de rodas incomuns. Há até a base de uma nave cuja parte superior já não está ali.',
        'Uma mensagem apresenta sua missão:',
      ],
      quote: 'Equipamentos guardam histórias. Para descobri-las, observe, experimente nas simulações e procure evidências.',
    },
    {
      paragraphs: [
        'Você seleciona um dos locais disponíveis. O mapa mostra o caminho até o primeiro objeto.',
        'Antes de sair, você olha novamente para as fichas. Encontrar os equipamentos será apenas o começo. O verdadeiro desafio será compreender como cada um ajudou as pessoas a conhecer melhor a Lua.',
      ],
    },
  ],
};

export const gameStory = {
  prologue,
  discoveries,
  epilogue: {
    eyebrow: 'EPÍLOGO · O QUE VOCÊ LEVA DA LUA',
    title: 'Arquivo lunar concluído',
    paragraphs: [
      'Os espaços que antes continham perguntas agora guardam descobertas: uma sonda visitada anos depois do pouso, carros que viajaram dobrados, instrumentos que registraram passos e ondas que ajudaram a investigar o subsolo.',
      'Você aprendeu a procurar diferentes tipos de evidência: imagens, medições, componentes estudados e documentos de missão. Também encontrou uma informação que permanece desconhecida e um experimento que não conseguiu produzir os resultados esperados.',
    ],
    distinction: 'Historiador ou historiadora da Lua',
    favoritePrompt: 'Escolha sua descoberta favorita para marcar no diário digital.',
    closing: 'Você não trouxe nenhum objeto de volta. Trouxe maneiras de compreender suas histórias.',
  },
};

// ---------------------------------------------------------------------------
// Tradução: outros idiomas fornecem só os textos; a estrutura vem daqui.
// ---------------------------------------------------------------------------

export type GameStory = typeof gameStory;

export type ActivityText = {
  prompt: string;
  success: string;
  hint?: string;
  options?: string[];
  pairs?: { item: string; answer: string }[];
  sequence?: string[];
  /** Nomes das paradas do rover (simulação rover-drive). */
  stops?: string[];
};

export type DiscoveryText = {
  title: string;
  subtitle: string;
  location: string;
  /** Descrição da fotografia (o caminho e o crédito vêm do original). */
  imageAlt: string;
  route: { label: string; detail: string };
  objective: string;
  teaser: string;
  encounter: string[];
  steps: { title: string; paragraphs: string[]; activity: ActivityText }[];
  /** Pergunta bônus: prompt, options (mesma ordem do original), success e hint. */
  quiz: ActivityText;
  facts: string;
  fiction: string;
};

export type StoryText = {
  prologue: GameStory['prologue'];
  discoveries: DiscoveryText[];
  epilogue: GameStory['epilogue'];
};

/** Usa a tradução só se tiver o mesmo tamanho do original (mantém a resposta certa no mesmo lugar). */
function sameShape<T>(base: T[], translated: T[] | undefined, where: string): T[] {
  if (translated && translated.length === base.length) return translated;
  console.warn(`Tradução incompleta em ${where}; usando o texto original.`);
  return base;
}

function localizeSimulation(simulation: Simulation, stops: string[] | undefined, where: string): Simulation {
  return simulation.kind === 'rover-drive' ? { ...simulation, stops: sameShape(simulation.stops, stops, `${where} (paradas)`) } : simulation;
}

function localizeChoice(base: ChoiceActivity, text: ActivityText, where: string): ChoiceActivity {
  return {
    ...base,
    prompt: text.prompt,
    success: text.success,
    hint: text.hint,
    options: sameShape(base.options, text.options, where),
    simulation: base.simulation && localizeSimulation(base.simulation, text.stops, where),
  };
}

function localizeActivity(base: Activity, text: ActivityText, where: string): Activity {
  const common = { prompt: text.prompt, success: text.success, hint: text.hint };
  switch (base.type) {
    case 'match': return { ...base, ...common, pairs: sameShape(base.pairs, text.pairs, where) };
    case 'order': return { ...base, ...common, sequence: sameShape(base.sequence, text.sequence, where) };
    case 'simulation': return { ...base, ...common, simulation: localizeSimulation(base.simulation, text.stops, where) };
    default: return localizeChoice(base, text, where);
  }
}

/** Monta a história em outro idioma a partir dos textos traduzidos. */
export function localizeStory(text: StoryText): GameStory {
  if (text.discoveries.length !== discoveries.length) console.warn('Tradução com número diferente de descobertas.');
  return {
    prologue: text.prologue,
    epilogue: text.epilogue,
    discoveries: discoveries.map((base, index) => {
      const t = text.discoveries[index];
      if (!t) return base;
      return {
        ...base,
        title: t.title,
        subtitle: t.subtitle,
        location: t.location,
        imageAlt: t.imageAlt,
        route: t.route,
        objective: t.objective,
        teaser: t.teaser,
        encounter: t.encounter,
        facts: t.facts,
        fiction: t.fiction,
        steps: base.steps.map((step, s) => {
          const st = t.steps[s];
          if (!st) return step;
          return { ...step, title: st.title, paragraphs: st.paragraphs, activity: localizeActivity(step.activity, st.activity, `${base.number}/${step.id}`) };
        }),
        quiz: t.quiz ? localizeChoice(base.quiz, t.quiz, `${base.number}/quiz`) : base.quiz,
      };
    }),
  };
}
