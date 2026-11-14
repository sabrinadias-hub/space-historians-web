# Space Historians

Protótipo de jogo educativo 3D criado para o NASA Space Apps Challenge. Crianças de 8 a 12 anos exploram a superfície lunar, encontram equipamentos deixados por missões espaciais e investigam suas histórias.

## Estado atual

- exploração lunar em 3D;
- astronauta controlável com `W`, `A`, `S`, `D` ou setas (direção relativa à câmera);
- joystick na tela para tablets;
- colisão com equipamentos e rochas;
- primeiro objeto: ALSEP da Apollo 12, com o módulo lunar da NASA como marco do pouso;
- ficha reabrível (aproximar-se, clicar no equipamento ou tecla `E`);
- progresso salvo no navegador;
- prólogo narrativo;
- três camadas de investigação;
- atividades interativas e pontuação de conhecimento;
- estrutura preparada para 12 descobertas.

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

## Créditos

Consulte [ASSET_CREDITS.md](ASSET_CREDITS.md) para os créditos e licenças dos modelos utilizados.

## Status

Protótipo em desenvolvimento. Ainda não representa a versão final do jogo.
