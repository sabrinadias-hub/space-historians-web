# Space Historians

Protótipo de jogo educativo 3D criado para o NASA Space Apps Challenge. Crianças de 8 a 12 anos exploram a superfície lunar, encontram equipamentos deixados por missões espaciais e investigam suas histórias.

## Estado atual

- exploração lunar em 3D;
- astronauta controlável com `W`, `A`, `S`, `D` ou setas (direção relativa à câmera);
- joystick na tela para tablets;
- colisão com equipamentos e rochas;
- **12 descobertas**, na ordem do roteiro, liberadas uma de cada vez (ALSEP da Apollo 12, Surveyor 3, ALSEP da Apollo 14, ALSEP da Apollo 15, Rover da Apollo 15, ALSEP da Apollo 16, Rover da Apollo 16, Refletor da Apollo 11, Base do Eagle, PSEP da Apollo 11, ALSEP da Apollo 17, Rover da Apollo 17);
- módulo lunar oficial da NASA como marco do pouso da Apollo 12; demais equipamentos em modelos simplificados (`src/models.ts`);
- seta no chão e placas indicando a próxima descoberta;
- ficha reabrível (aproximar-se, clicar no equipamento, tecla `E` ou pela rota de exploração);
- prólogo, três camadas por equipamento (10 + 20 + 30 pontos, até 720 no total) e epílogo com escolha da descoberta favorita;
- atividades de escolha, associação, ordenação e oito simulações identificadas como representação do jogo (`src/activities.ts`);
- bloco "O que é fato e o que é ficção" em cada ficha;
- progresso salvo no navegador.
- **dois idiomas: português e inglês**, escolhidos na abertura (vale para a sessão inteira: interface, histórias, atividades, simulações e placas do mapa).

## Executar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no navegador.

## Controles

| Ação | Computador | Tablet |
|---|---|---|
| Caminhar | `W` `A` `S` `D` ou setas | joystick na tela |
| Girar a câmera | arrastar com o mouse | arrastar com o dedo |
| Abrir a ficha | chegar perto + `E`, ou clicar no equipamento | tocar em "Investigar" ou no equipamento |
| Fechar a ficha | `Esc`, clicar fora ou "Continuar explorando" | "Continuar explorando" |

Na abertura, escolha **Português** ou **English**. Para abrir direto em um idioma (por exemplo, numa apresentação), use `?lang=pt` ou `?lang=en` no endereço.

Para apagar o progresso salvo (testes e apresentações), abra o jogo com `?reiniciar` no final do endereço.

O jogo precisa de WebGL. Se a aceleração de hardware estiver desligada no navegador, uma mensagem explica como ativá-la.

## Gerar versão de produção

```bash
npm run build
```

Os arquivos publicados serão criados na pasta `dist`.

## Tecnologias

- TypeScript
- Vite
- Babylon.js

## Conteúdo

Os textos narrativos ficam centralizados em `src/story-data.ts`. Isso permite atualizar histórias e preparar traduções sem alterar a estrutura 3D.

### Idiomas

- `src/i18n.ts`: textos da interface (HUD, avisos, ficha, atividades, simulações) em português e inglês.
- `src/story-data.en.ts`: as histórias em inglês. Contém **só textos**; ordem, posições, respostas certas e pontuação vêm de `src/story-data.ts`. As listas de opções, associações e etapas devem ter o mesmo tamanho e a mesma ordem do português (se não tiverem, o jogo avisa no console e usa o original).
- Para incluir um novo idioma: crie outro arquivo como `story-data.en.ts`, adicione os textos em `i18n.ts` e um botão na tela de idioma.

Cada descoberta define título, missão, ano, local, posição no mapa, tipo de equipamento, encontro, as três etapas (com a atividade de cada uma) e o bloco de fatos e ficção. Tipos de atividade disponíveis: `choice` (padrão), `match`, `order` e `simulation`.

O mapa do jogo é uma representação compacta: na Lua real, os locais das missões ficam a centenas de quilômetros uns dos outros.

## Créditos

Consulte [ASSET_CREDITS.md](ASSET_CREDITS.md) para os créditos e licenças dos modelos utilizados.

## Status

Protótipo em desenvolvimento. Ainda não representa a versão final do jogo.
