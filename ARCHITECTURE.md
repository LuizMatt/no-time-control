# ARCHITECTURE.md

> Título provisório: **???** (definir). Game jam, 48h, 1–2 pessoas, TypeScript + Kaplay.

## 1. Visão geral

Platformer 2D side-scroller. O player é um lobisomem em busca de respostas sobre o que está acontecendo com ele. O jogo abre com uma cutscene em que um psicólogo pergunta: **"Quem está no controle, você ou o tempo?"**

Cada fase existe em **3 variantes temporais**: Passado, Presente e Futuro. A variante é **sorteada ao entrar na fase**, então o player nunca sabe de antemão em qual tempo vai cair. Existem **3 armas** (teclas `1`, `2`, `3`), uma eficaz contra os inimigos de cada tempo. Uma **barra de especial** enche ao combater e, quando cheia, o player se transforma em lobisomem por alguns segundos.

### Pilares (guiam qualquer decisão de escopo)

1. **Reagir ao tempo.** O player identifica o tempo rápido e troca de arma. Esse é o loop central.
2. **O tempo controla você, até a transformação.** O lobisomem é o momento de retomar o controle (acerta qualquer inimigo).
3. **Barato de produzir.** Uma estrutura de fase, três "skins" de dados. Nada de três fases separadas.

---

## 2. Stack

| Item | Escolha |
|---|---|
| Linguagem | TypeScript (strict) |
| Engine | Kaplay |
| Build/dev server | Vite |
| Assets | `public/assets/` (sprites, sons, música) |
| Deploy | Build estático (itch.io / GitHub Pages) |

Inicialização do Kaplay com `global: false`, para ter tipagem forte e evitar poluir o escopo global:

```ts
// src/core/k.ts
import kaplay from "kaplay";
export const k = kaplay({ width: 960, height: 540, letterbox: true, background: [0, 0, 0] });
```

Todos os módulos importam `k` de `core/k.ts`.

---

## 3. Estrutura de pastas

```
src/
  main.ts                 # registra cenas e chama go("boot")
  core/
    k.ts                  # instância do Kaplay
    constants.ts          # tamanhos, gravidade, teclas
    state.ts              # GameState (run atual)
    assets.ts             # loadSprite / loadSound centralizados
  data/                    # TUDO que é balanceamento/conteúdo fica aqui
    eras.ts               # config visual/sonora por tempo
    weapons.ts            # stats das 3 armas
    enemies.ts            # tabela de inimigos por tempo
    stages.ts             # layout (tilemap) + spawns por fase
    story.ts              # falas do psicólogo e diálogos entre fases
  scenes/
    boot.ts               # carrega assets
    intro.ts              # cutscene do psicólogo
    stage.ts              # fase jogável (recebe stageIndex + era)
    interlude.ts          # diálogo/resposta entre fases
    gameover.ts
    ending.ts
  systems/
    eraDirector.ts        # sorteio do tempo + aplica skin
    weaponSystem.ts       # troca/disparo/dano por arma
    specialMeter.ts       # barra + transformação
    spawner.ts            # spawn de inimigos por era
  entities/
    player.ts
    enemy.ts              # factory a partir de data/enemies.ts
    projectile.ts
    pickup.ts
  ui/
    hud.ts                # vida, especial, arma ativa, ícone do tempo
    dialogue.ts           # caixa de texto com typewriter
    eraBanner.ts          # banner "PASSADO / PRESENTE / FUTURO"
  types/
    index.ts              # Era, WeaponId, EnemyDef, etc.
```

Regra de dependência: `data/` não importa nada de `scenes/`, `systems/` ou `entities/`. `scenes/` orquestra; `systems/` e `entities/` implementam; `ui/` só lê estado.

---

## 4. Fluxo de cenas

```
boot → intro (psicólogo) → stage(0) → interlude → stage(1) → ... → stage(N) → ending
                              │
                              └── (morte) → gameover → stage(mesmo índice, novo sorteio) | intro
```

- `go("stage", { stageIndex, era })`: o `era` já vem sorteado por quem chama (ver `eraDirector`).
- `interlude` mostra a "resposta" da fase (pista da história) e volta para `stage`.
- Cada cena é uma função em arquivo próprio, registrada em `main.ts` com `k.scene(...)`.

---

## 5. Modelo de dados central

```ts
// types/index.ts
export type Era = "past" | "present" | "future";
export type WeaponId = "w1" | "w2" | "w3";

export interface EraConfig {
  label: string;               // "PASSADO"
  tint: [number, number, number];  // cor de fundo/overlay
  bgSprite: string;
  music: string;
  weapon: WeaponId;            // arma eficaz neste tempo
  enemyPool: string[];         // ids em data/enemies.ts
}

export interface WeaponDef {
  id: WeaponId;
  key: "1" | "2" | "3";
  era: Era;                    // contra qual tempo é eficaz
  damage: number;
  cooldown: number;
  kind: "melee" | "projectile";
  range: number;
}

export interface EnemyDef {
  id: string;
  era: Era;
  hp: number;
  speed: number;
  contactDamage: number;
  behavior: "patrol" | "chase" | "fly" | "shoot";
  sprite: string;
}
```

```ts
// core/state.ts
export const state = {
  stageIndex: 0,
  currentEra: "present" as Era,
  hp: 5,
  maxHp: 5,
  special: 0,        // 0..SPECIAL_MAX
  transformed: false,
  eraHistory: [] as Era[],
};
export function resetRun() { /* volta tudo ao inicial */ }
```

Estado de run é um objeto simples (sem classes). Cenas leem/escrevem nele; entidades emitem eventos.

---

## 6. Sistemas principais

### 6.1 Era Director (`systems/eraDirector.ts`)
- Sorteia o tempo da fase usando **shuffle bag** (embaralha `[past, present, future]` e consome; ao esvaziar, reembaralha). Evita o mesmo tempo muitas vezes seguidas e garante que o player veja os três.
- Expõe `pickEra(): Era` e `applyEra(era)` (tinge o fundo, toca a música, mostra o banner, ativa o `enemyPool`).
- **Legibilidade do tempo (crítico):** cada era precisa ser identificável em < 1s via paleta, música, banner no início e ícone permanente no HUD.

### 6.2 Weapon System (`systems/weaponSystem.ts`)
- Teclas `1/2/3` setam a arma ativa. Disparo/ataque em uma tecla única (ex.: `J` ou clique).
- **Regra de dano:** `dano = weapon.damage × multiplicador`, onde o multiplicador é `1.0` se `weapon.era === enemy.era`, ou `WRONG_ERA_MULT` caso contrário (constante em `constants.ts`, ver pergunta em aberto).
- Quando transformado: multiplicador sempre `1.0` (e o ataque vira garras, ver 6.3).

### 6.3 Special Meter (`systems/specialMeter.ts`)
- Enche ao causar dano e ao matar (valores em `constants.ts`).
- Cheio → prompt "pressione `Q`" (tecla de transformação). Transformado por `TRANSFORM_DURATION` s:
  - ataque corpo a corpo de garras que acerta **qualquer** inimigo;
  - velocidade/pulo maiores;
  - a barra drena até acabar e volta à forma normal.
- Emite eventos `"transform:start"` / `"transform:end"` para o player, HUD e áudio reagirem sem acoplamento.

### 6.4 Spawner (`systems/spawner.ts`)
- Lê spawns da fase (`data/stages.ts`) e instancia inimigos **a partir do `enemyPool` da era atual**. O layout é o mesmo nas três variantes; muda quem aparece e a aparência.

### 6.5 Inimigos (`entities/enemy.ts`)
- Uma factory `makeEnemy(def: EnemyDef, pos)` monta o game object com componentes Kaplay (`sprite`, `pos`, `area`, `body`, `health`, tags `"enemy"` e `"era:past"` etc.).
- Comportamentos (`patrol/chase/fly/shoot`) são pequenas funções em um mapa `behaviors`, não classes.

---

## 7. Fase (cena `stage`)

1. Recebe `{ stageIndex, era }`.
2. Constrói o nível a partir do tilemap de `data/stages.ts` (`k.addLevel`).
3. `eraDirector.applyEra(era)`.
4. Cria player, HUD, spawner.
5. Condição de vitória: chegar à saída (ou limpar a área) → `go("interlude", ...)`.
6. Morte: `go("gameover")`.

**Sobre variantes de layout:** para 48h, o layout é o mesmo nas 3 eras e só muda a skin e os inimigos. Se sobrar tempo, adicionar 1–2 plataformas/obstáculos exclusivos por era.

---

## 8. Narrativa

- Tudo em `data/story.ts` como dados: `{ speaker, text }[]` por momento.
- `intro`: psicólogo faz a pergunta ("Quem está no controle, você ou o tempo?"), depois o jogo começa.
- `interlude`: uma "resposta"/memória por fase, revelando o que acontece com o lobisomem.
- Sugestão temática (opcional): passado = culpa, presente = ansiedade, futuro = medo. Os diálogos podem puxar isso.
- `ui/dialogue.ts`: caixa de texto com efeito typewriter, avança com `Espaço`/`Enter`.

---

## 9. Escopo para 48h

### MVP (obrigatório)
- [ ] Intro com psicólogo
- [ ] 1 layout de fase reaproveitado
- [ ] 3 eras (paleta + música/ambiente + banner + HUD)
- [ ] 3 armas, troca por `1/2/3`
- [ ] 2 tipos de inimigo por era (6 no total)
- [ ] Barra de especial + transformação
- [ ] 3 fases com diálogo entre elas + final
- [ ] Game over / restart

### Se sobrar tempo
- [ ] Boss final
- [ ] Mudança de era no meio da fase
- [ ] Layouts/obstáculos exclusivos por era
- [ ] Screenshake, partículas, juice geral

### Plano sugerido (2 pessoas)

| Janela | Pessoa A (gameplay) | Pessoa B (conteúdo/arte/áudio) |
|---|---|---|
| 0–6h | Setup, player, movimento, tilemap | Placeholders, paleta das 3 eras, roteiro |
| 6–16h | Armas, inimigos, dano por era | Sprites/inimigos, sons, falas |
| 16–28h | Era Director, especial/transformação | Intro/interlude, HUD, música |
| 28–40h | Fases 2–3, balanceamento | Arte final, polimento visual |
| 40–48h | Bugs, build, publicação | Juice, página do jogo, playtest |

> Com 1 pessoa só: corta para 2 fases + 2 inimigos por era e usa placeholders (retângulos coloridos) até o fim.

**Regra de ouro:** gameplay com **placeholders primeiro** (`k.rect()` colorido por era). Arte entra só depois que o loop estiver divertido.

---

## 10. Riscos e decisões

| Risco | Mitigação |
|---|---|
| Player não entende em qual tempo está | Banner + paleta forte + música + ícone fixo no HUD; testar com alguém de fora |
| Arma errada frustra | `WRONG_ERA_MULT` ajustável em um lugar só; feedback visual/sonoro de "inefetivo" |
| Escopo estoura | Pilares + lista de corte acima; dados em `data/` facilitam adicionar/remover conteúdo |
| Bugs de cena/estado | `state.ts` único, `resetRun()` claro, sem estado escondido em módulos |

---

## 11. Perguntas em aberto (decidir cedo)

1. Armas: corpo a corpo, à distância ou mistura? (Proposta: passado = lâmina curta, presente = tiro reto, futuro = energia que atravessa.)
2. Arma errada: dano zero ou reduzido (ex.: 25%)?
3. Tecla de ataque e de transformação (propostas: `J`/clique e `Q`).
4. Quantas fases e se haverá boss.
5. Fonte da arte (feita pela equipe, asset pack, placeholders).
6. Idioma dos textos (PT-BR assumido) e título do jogo.
