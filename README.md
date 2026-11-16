# Space Historians

Protótipo de jogo educativo 3D criado para o NASA Space Apps Challenge. Crianças de 8 a 12 anos exploram a superfície lunar, encontram equipamentos deixados por missões espaciais e investigam suas histórias.

## Estado atual

- exploração lunar em 3D;
- astronauta controlável com `W`, `A`, `S`, `D` ou setas (direção relativa à câmera);
- joystick na tela para tablets;
- colisão com equipamentos e rochas;
- abertura em etapas: idioma → nome do explorador (obrigatório, 2 a 24 caracteres) → prólogo em páginas curtas;
- **exploração livre**: as 12 descobertas ficam disponíveis desde o início, em qualquer ordem; a rota mostra a ordem recomendada e cada item vira destino com um clique (ALSEP da Apollo 12, Surveyor 3, ALSEP da Apollo 14, ALSEP da Apollo 15, Rover da Apollo 15, ALSEP da Apollo 16, Rover da Apollo 16, Refletor da Apollo 11, Base do Eagle, PSEP da Apollo 11, ALSEP da Apollo 17, Rover da Apollo 17);
- módulo lunar oficial da NASA como marco do pouso da Apollo 12; demais equipamentos em modelos simplificados (`src/models.ts`);
- seta no chão apontando para o destino escolhido e placas em todos os equipamentos;
- **fotos reais da NASA** em cada ficha, com texto alternativo e crédito (`public/images/discoveries/`, originais em `assets-src/discoveries/`);
- ficha reabrível (aproximar-se, clicar no equipamento, tecla `E` ou pela rota de exploração);
- três camadas por equipamento (10 + 20 + 30 = 60 pontos de **conhecimento**, até 720) e um **quiz opcional** por equipamento (+10 pontos **bônus**, até 120; total máximo 840). O quiz não bloqueia nada, errar não tira pontos e o bônus vale uma vez;
- **mochila digital** (botão no HUD ou tecla `M`) com 12 badges gerados pelo jogo: não explorado, em andamento, conquistado e estrela de bônus; permite editar o nome e trocar o idioma;
- epílogo, aberto só depois das 12 descobertas, com nome do explorador, conhecimento, bônus, total e escolha da descoberta favorita;
- atividades de escolha, associação, ordenação e oito simulações identificadas como representação do jogo (`src/activities.ts`);
- bloco "O que é fato e o que é ficção" em cada ficha;
- progresso salvo no navegador em uma única chave versionada (`space-historians:progress:v2`), com migração automática do formato anterior.
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
| Abrir a mochila | botão "Mochila" ou `M` | botão "Mochila" |
| Escolher destino | clicar em um item da rota | tocar em um badge não explorado na mochila |

Na abertura, escolha **Português** ou **English**. Para abrir direto em um idioma (por exemplo, numa apresentação), use `?lang=pt` ou `?lang=en` no endereço.

Para apagar o progresso salvo (nome, pontos, etapas, quizzes, badges, destino e favorita), abra o jogo com `?reiniciar` no final do endereço.

O jogo usa **WebGL** e, se o navegador bloquear o WebGL, tenta **WebGPU** automaticamente. Se nenhum dos dois estiver disponível, uma mensagem explica como ativar a aceleração de hardware. Para testar o caminho WebGPU num navegador com WebGL, abra com `?render=webgpu`. O motor em uso fica em `document.documentElement.dataset.renderer` (`webgl` ou `webgpu`).

## Gerar versão de produção

```bash
npm run build
```

Os arquivos publicados serão criados na pasta `dist`.

## Publicar no Netlify

O arquivo [`netlify.toml`](netlify.toml) já traz toda a configuração: comando `npm run build`, pasta `dist`, Node 22 e cache longo para os arquivos gerados e os modelos 3D.

Para publicar pela primeira vez (só uma vez):

1. Entre em [app.netlify.com](https://app.netlify.com) com a conta do GitHub.
2. **Add new site → Import an existing project → GitHub** e escolha o repositório `space-historians-web`.
3. Em **Branch to deploy**, deixe `main`. Os outros campos são preenchidos pelo `netlify.toml`.
4. Clique em **Deploy**. O endereço fica como `https://<nome>.netlify.app`; o nome pode ser trocado em **Site configuration → Change site name**.

Depois disso, cada push na `main` publica uma nova versão, e cada pull request ganha um link de prévia.

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

Cada descoberta define título, missão, ano, local, posição no mapa, tipo de equipamento, foto (`image`, `imageAlt`, `imageCredit`), encontro, as três etapas (com a atividade de cada uma), o quiz bônus (`quiz`) e o bloco de fatos e ficção. O prólogo fica em `gameStory.prologue.pages`. Tipos de atividade disponíveis: `choice` (padrão), `match`, `order` e `simulation`.

O mapa do jogo é uma representação compacta: na Lua real, os locais das missões ficam a centenas de quilômetros uns dos outros.

## Créditos

Consulte [ASSET_CREDITS.md](ASSET_CREDITS.md) para os créditos e licenças dos modelos utilizados.

## Status

Protótipo em desenvolvimento. Ainda não representa a versão final do jogo.
