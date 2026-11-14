export type StoryStep = {
  id: 'identity' | 'function' | 'evidence';
  label: string;
  reward: number;
  title: string;
  paragraphs: string[];
  activity: {
    prompt: string;
    options: string[];
    correct: number;
    success: string;
    /** Pista exibida quando a resposta está incorreta. */
    hint?: string;
  };
};

export const gameStory = {
  prologue: {
    eyebrow: 'PRÓLOGO · UM ARQUIVO CHEIO DE PERGUNTAS',
    title: 'As histórias que ficaram na Lua',
    paragraphs: [
      'A superfície lunar ocupa a janela da sua nave. Há crateras, pedras e sombras compridas. No mapa, pequenos pontos marcam os locais que você poderá explorar.',
      'Você abre a mochila digital. O arquivo Space Historians aparece com doze fichas ainda incompletas.',
      'Equipamentos guardam histórias. Para descobri-las, observe, experimente nas simulações e procure evidências.',
    ],
    mission: 'Encontre os equipamentos e descubra como cada um ajudou as pessoas a conhecer melhor a Lua.',
  },
  firstDiscovery: {
    number: '01',
    title: 'ALSEP da Apollo 12',
    subtitle: 'O chão guardou a partida',
    mission: 'Apollo 12',
    year: '1969',
    location: 'Oceanus Procellarum',
    encounter: [
      'Uma antena se destaca em Oceanus Procellarum. Cabos ligam a central a instrumentos espalhados pelo terreno.',
      'Você abre a ficha. Um registro cheio de pequenas oscilações aparece na tela.',
      'Por que o chão se moveu? A resposta pode estar em uma nave que já partiu.',
    ],
    steps: [
      {
        id: 'identity',
        label: 'O que é?',
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
        label: 'O que fez na Lua?',
        reward: 20,
        title: 'O chão registrou o impacto',
        paragraphs: [
          'O sismômetro percebeu vibrações da decolagem do Intrepid. Depois, registrou por quase uma hora as vibrações do impacto planejado de seu estágio de subida, já vazio.',
        ],
        activity: {
          prompt: 'Qual registro mostra vibrações que continuam depois do impacto?',
          options: ['━━━ linha quase imóvel', '〰〰〰 oscilações prolongadas'],
          correct: 1,
          success: 'As oscilações aparecem. Você encontrou a pista deixada pelo acontecimento!',
          hint: 'Pista: depois do impacto, o chão continuou vibrando por quase uma hora. Qual registro mostra um movimento que continua?',
        },
      },
      {
        id: 'evidence',
        label: 'Como sabemos?',
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
    ] satisfies StoryStep[],
  },
} as const;
