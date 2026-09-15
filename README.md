# 🐦 Flappy Bird

Clone do Flappy Bird em HTML5 Canvas + JavaScript puro. Sem dependências, sem build.

## Jogar

Abra `index.html` no navegador, ou sirva a pasta:

```bash
npx serve -p 5173 .
```

## Controles

| Ação      | Tecla / gesto              |
|-----------|----------------------------|
| Voar      | Espaço, ↑, clique ou toque |
| Pausar    | P                          |
| Reiniciar | R                          |

## Funcionalidades

- Física com gravidade e impulso, rotação do pássaro conforme a velocidade
- Canos com altura aleatória e detecção de colisão
- Recorde salvo no `localStorage`
- Efeitos sonoros gerados via WebAudio (sem arquivos de áudio)
- Paralaxe de nuvens e prédios no fundo
- Funciona no celular (toque)

## Estrutura

```
index.html   # marcação
style.css    # layout da página
game.js      # toda a lógica do jogo
```

## Licença

MIT
