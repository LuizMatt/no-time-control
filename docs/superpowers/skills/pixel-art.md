---
name: pixel-art-gamejam
description: Cria sprites, tilesets, props e animações 2D em pixel art nítida usando exclusivamente a paleta oficial de 16 cores do projeto. Use sempre que gerar ou editar assets visuais do jogo.
---

# Especificação de Pixel Art do Projeto

Você está gerando assets para um **jogo de plataforma 2D em pixel art** rodando em **Kaplay.js (TypeScript)** com grid base de **32×32 pixels**.

## 1. Paleta Obrigatória (16 Cores Travadas)

É **estritamente proibido** usar qualquer cor fora destes 16 códigos hexadecimais (além de transparente `rgba(0,0,0,0)`):

| Token | Hex         | Função Visual                                                |
| :---- | :---------- | :----------------------------------------------------------- |
| `.`   | `#00000000` | Transparente                                                 |
| `K`   | `#1f0e1c`   | Contorno principal, sombras máximas, vazio                   |
| `P`   | `#3e2137`   | Ameixa escuro — contorno suave e sombra profunda quente      |
| `S`   | `#584563`   | Cinza-arroxeado — sombra de pedra, metal e estrutura urbana  |
| `L`   | `#8c8fae`   | Lavanda-ardósia — metal claro, concreto iluminado, névoa     |
| `B`   | `#9a6348`   | Marrom quente — madeira, terra, couro, tronco                |
| `T`   | `#d79b7d`   | Pêssego/bege — pele clara, madeira iluminada, tijolo claro   |
| `W`   | `#f5edba`   | Creme — luz máxima, brilho especular, olhos, destaques de UI |
| `G`   | `#647d34`   | Verde-oliva escuro — vegetação base, musgo, uniforme         |
| `Y`   | `#c0c741`   | Verde-lima — folhagem iluminada, ácido/energia, destaque     |
| `O`   | `#e4943a`   | Laranja-âmbar — fogo, ouro, luz quente, alerta, ferrugem     |
| `R`   | `#9d303b`   | Vermelho-carmesim — dano, telhado, sombra vermelha, sangue   |
| `C`   | `#d26471`   | Coral — luz de tecido vermelho, detalhe orgânico             |
| `V`   | `#70377f`   | Roxo vibrante — energia arcana/neon, sombra saturada         |
| `D`   | `#17434b`   | Azul-petróleo escuro — sombra profunda fria, metal escuro    |
| `M`   | `#34859d`   | Azul-petróleo médio — água, vidro, aço frio, neon secundário |
| `A`   | `#7ec4c1`   | Ciano-água claro — brilho neon/energia, gelo, reflexo        |

## 2. Rampas de Sombreamento Permitidas

Como não há cores intermediárias, sempre sombreie seguindo estas transições:

- **Neutra / Metal / Pedra:** `K` → `S` → `L` → `W` (ou `D` → `M` → `A` → `W` para metal frio)
- **Madeira / Terra / Pele:** `P` → `B` → `T` → `W`
- **Vegetação / Orgânico:** `D` ou `P` → `G` → `Y` → `W`
- **Quente / Fogo / Perigo:** `P` → `R` → `O` → `W` (ou `R` → `C` → `T` para tecidos/pele)
- **Energia / Cyberpunk / Místico:** `K` → `P` → `V` → `A` → `W`

## 3. Leitura de Plataforma 2D (Figura vs. Fundo)

- **Tiles de fundo / parallax:** Mantenha em baixo contraste usando majoritariamente `K`, `P`, `S`, `D` e `B`. Nunca use `W`, `Y`, `O` ou `A` em grandes áreas de fundo.
- **Tiles sólidos (chão/plataformas):** Borda superior bem definida (ex.: `G`/`Y` para grama, `L`/`W` para metal/concreto, `B`/`T` para madeira) com miolo mais escuro (`P`, `S`, `D`, `B`) para leitura imediata de colisão.
- **Personagem, inimigos, perigos e coletáveis:** Use silhueta fechada com contorno escuro (`K` ou `P`) e concentre os tons de alto valor (`W`, `A`, `O`, `Y`, `C`) nas áreas de foco (cabeça, arma, projéteis, núcleo).

## 4. Regras Técnicas e Exportação (Kaplay.js)

1. **Escala 1x pura:** Sem anti-aliasing, blur, gradientes ou pixels semitransparentes.
2. **Consistência de animação:** Todos os frames de um sprite sheet devem ter exatamente a mesma largura e altura (ex.: `32x32` para tiles/player ou dimensões inteiras fixas por inimigo), alinhados horizontalmente em uma única tira (`sliceX = totalFrames`, `sliceY = 1`) e ancorados pela base inferior (pés no mesmo eixo Y).
3. **Compilação via Script:** Escreva cada frame como matriz 2D usando os tokens da tabela acima e compile o `.png` final via script Node.js (`pngjs`) para garantir cores exatas bit a bit, informando ao final os índices de `anims` prontos para o `loadSprite()` do Kaplay.js.
