# Validação online no Netlify: 16/11/2026

- **Site:** https://space-historians-game.netlify.app/
- **Versão:** `main` do fork `GridWebTi/space-historians-web`, commit `76a2281` (merge de `feat/mvp-exploracao-livre`)
- **Navegador:** Chrome, tela de computador, renderização WebGL
- **Início do teste:** `?reiniciar&lang=pt`, para começar sem progresso salvo

## Resultado

O deploy funcionou e a versão nova está no ar. Todos os pontos testados passaram.

| Verificação | Resultado |
|---|---|
| Nome obrigatório | 1 letra mostra erro; o nome válido aparece nas boas-vindas e na mochila |
| Exploração livre | 12 destinos na rota, nenhum bloqueado; o clique na rota marca o destino e a seta aponta para ele |
| HUD | conhecimento 0 / 720 e bônus 0 / 120 |
| Fotos | as 12 respondem `200 image/webp`; a ficha da Apollo 12 mostra a foto e o crédito "Foto: NASA · AS12-47-6928" |
| Quiz bônus | a resposta errada mostra uma pista e não tira pontos; a certa dá +10 e mostra "★ Bônus conquistado" |
| Mochila | 12 badges |
| Recarregar a página | nome, quiz, destino e bônus mantidos (chave `space-historians:progress:v2`) |
| Console | sem erros |

## O que não foi testado online

- Atividades das três camadas de cada ficha.
- Epílogo.
- Inglês.
- Telas de tablet e celular.

Esses pontos foram testados no ambiente local antes do PR (ver [README.md](README.md)).

## Observação

Em produção, o `window.__game` não existe, porque só é exposto em desenvolvimento. Por isso o teste foi feito pela própria interface.

## Próximo passo

Os PRs #1 a #6 em `sabrinadias-hub/space-historians-web` continuam abertos e podem ser mesclados sem conflito. A dona do repositório precisa mesclar em ordem, do #1 ao #6, porque a conta `GridWebTi` só tem leitura lá.
