# No Time Control

> *"Quem está no controle, você ou o tempo?"*

**No Time Control** é um jogo de plataforma 2D (*side-scroller* de ação) desenvolvido em 48 horas para uma game jam. Você controla um lobisomem em busca de respostas sobre o que está acontecendo consigo mesmo, enfrentando um estágio completo com checkpoints e um Boss final — enquanto o próprio tempo tenta tomar o controle.

## Sobre o Jogo

O estágio existe em **3 variantes temporais**:
- **Passado** *(Era Primitiva)*
- **Presente** *(Era Urbana)*
- **Futuro** *(Era Cibernética)*

### Mecânicas Principais
- **Respawn Temporal:** A era inicial é sorteada ao começar. Sempre que você morre, renasce no último checkpoint alcançado, mas o tempo **muda obrigatoriamente** para uma era diferente — alterando cenário, música, inimigos e a variante do Boss.
- **Armas por Era:** Cada era possui uma arma eficaz contra seus inimigos e Boss. Atacar com a arma de outra era causa apenas **25% de dano**:
  - `1` — **Lâmina Ancestral** *(Passado — corpo a corpo)*
  - `2` — **Pistola Tática** *(Presente — tiro reto)*
  - `3` — **Canhão de Plasma** *(Futuro — tiro perfurante)*
- **Transformação em Lobisomem:** Combater enche a barra de especial. Quando cheia, pressione `Q` para se transformar em lobisomem, ganhando velocidade, pulo aprimorado e **100% de dano em qualquer era**.

## Controles

| Ação | Tecla |
| --- | --- |
| Mover | `A` / `D` |
| Pular | `Espaço` |
| Atacar | `H` |
| Dash | `J` |
| Transformar (Lobisomem) | `Q` |
| Trocar arma | `1` / `2` / `3` |
| Pausar | `Esc` |

## Tecnologias Utilizadas

- **[TypeScript](https://www.typescriptlang.org/)** — Tipagem estática (`strict: true`)
- **[KAPLAY](https://kaplayjs.com/)** — Engine 2D para jogos web
- **[Vite](https://vite.dev/)** — Servidor de desenvolvimento e bundler
- **Node.js (`pngjs` / `jpeg-js`)** — Scripts de geração e verificação de assets de UI

## Assets e Créditos

### Arte e Paleta
Assets utilizados como base para a direção de arte e cenários do jogo:
- **Paleta de cores:** [NA16 Palette — Lospec](https://lospec.com/palette-list/na16)
- **Parallax (Futuro / Era Cibernética):** [Industrial Parallax Background — OpenGameArt](https://opengameart.org/content/industrial-parallax-background)
- **Parallax (Presente / Era Urbana):** [Minimalist Sidescroll City — OpenGameArt](https://opengameart.org/content/minimalist-sidescroll-city)
- **Parallax (Passado / Era Primitiva):** [Mountain at Dusk Background — OpenGameArt](https://opengameart.org/content/mountain-at-dusk-background)

### Áudio
- **Efeitos sonoros (base utilizada para os demais SFX):** [Laser Shot — OpenGameArt](https://opengameart.org/content/laser-shot-0)
- **Música:** Trilha autoral criada por [MeninoArtemis](https://github.com/MeninoArtemis), transformada em estilo chiptune/bits com auxílio de IA.

## Como Executar

```sh
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:3001)
npm run dev
```

### Outros Comandos

```sh
# Build de produção (gera os arquivos em dist/)
npm run build

# Pré-visualizar o build localmente
npm run preview

# Gerar pacote .zip pronto para publicação (ex.: itch.io)
npm run zip

# Verificar tipos TypeScript
npm run check
```
