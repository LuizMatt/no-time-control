# Milestone 4: Barra de Especial, Transformação em Lobisomem (`Q`) & HUD Completo

## Objetivo
Implementar o segundo pilar do jogo (*"O tempo controla você, até a transformação"*): a barra de especial que carrega ao combater, a transformação em **Lobisomem (`Q`)** com ataque de garras universal (`1.0x` de dano contra qualquer Era), bônus de velocidade e pulo, e o **HUD completo** fixo na tela (`ui/hud.ts`).

---

## Arquivos a Criar / Modificar

1. `src/systems/specialMeter.ts` *(criar)*
2. `src/ui/hud.ts` *(criar)*
3. `src/entities/player.ts` *(modificar — reagir à transformação no visual, movimento e pulo)*
4. `src/systems/weaponSystem.ts` *(modificar — ataque de garras quando `state.transformed === true`)*
5. `src/scenes/stage.ts` *(modificar — inicializar `initSpecialMeter()` e `createHud()`)*

---

## Tasks Detalhadas

### Task 4.1: Sistema de Barra de Especial e Transformação (`systems/specialMeter.ts`)
- **Arquivo:** `src/systems/specialMeter.ts`
- Criar `initSpecialMeter()`:
  - Escutar eventos `"combat:hit"` (soma `SPECIAL_GAIN_HIT` a `state.special` se `!state.transformed`) e `"combat:kill"` (soma `SPECIAL_GAIN_KILL`, limitado a `SPECIAL_MAX = 100`).
  - Registrar tecla `Q` (`KEYS.TRANSFORM`):
    - Se `state.special >= SPECIAL_MAX` e `!state.transformed`:
      - Define `state.transformed = true`.
      - Emite `"transform:start"`.
  - No loop `k.onUpdate()`:
    - Enquanto `state.transformed === true`:
      - Drena `state.special` à taxa de `(SPECIAL_MAX / TRANSFORM_DURATION) * k.dt()`.
      - Quando `state.special <= 0`:
        - `state.special = 0`, `state.transformed = false`.
        - Emite `"transform:end"`.

### Task 4.2: Transformação no Player e Ataque de Garras
- **Arquivo:** `src/entities/player.ts`
  - Escutar `"transform:start"` e `"transform:end"`:
    - Quando transformado: muda a cor/escala do placeholder do player (ex.: vermelho-carmesim/roxo lupino maior com aura pulsante), aplica `WEREWOLF_SPEED_MULT` na movimentação e `WEREWOLF_JUMP_MULT` no pulo.
    - Quando termina: restaura cor e dimensões normais.
- **Arquivo:** `src/systems/weaponSystem.ts`
  - Se `state.transformed === true`, pressionar `H` ignora a arma equipada (`1/2/3`) e executa o **Golpe de Garras do Lobisomem**:
    - Alcance `WEREWOLF_RANGE`, cooldown rápido `WEREWOLF_COOLDOWN`, dano alto `WEREWOLF_DAMAGE` e `weaponEra = "universal"` (garantindo **100% de dano contra inimigos e Boss de qualquer Era**), com efeito visual de rasgo de garras.

### Task 4.3: HUD Completo (`ui/hud.ts`)
- **Arquivo:** `src/ui/hud.ts`
- Criar `createHud()` usando elementos `k.fixed()` (para não se moverem com a câmera):
  1. **Indicador de Tempo Atual (canto superior direito ou topo central):**
     - Caixa com a cor e nome da Era ativa (`TEMPO: PASSADO / PRESENTE / FUTURO`) + dica da arma ideal (`ARMA EFICAZ: [1] / [2] / [3]`).
  2. **Barra de Vida do Player (canto superior esquerdo):**
     - Corações/segmentos ou barra (`HP: 5/5`) que atualiza em tempo real.
  3. **Barra de Especial / Lobisomem (abaixo do HP):**
     - Barra progressiva `0..100%`.
     - Quando cheia (`100%`), pisca com o aviso `"PRONTO! [Q] LOBISOMEM"`.
     - Durante a transformação, exibe `"MODO LOBISOMEM ATIVO"` drenando.
  4. **Seletor das 3 Armas (`[1] Passado`, `[2] Presente`, `[3] Futuro`):**
     - Destaca visualmente qual arma está selecionada no momento (`state.activeWeapon`) e indica quando o modo Lobisomem substitui as armas por `"GARRAS ATIVAS"`.
  5. **Slot para Barra de Vida do Boss (parte inferior da tela):**
     - Fica oculto até `state.bossActive === true` (usado no Milestone 5).

---

## Como Testar no Navegador
1. Rodar `npm run dev`.
2. Verificar que o HUD fixo mostra claramente: HP, Barra de Especial, as 3 Armas (`1/2/3`) destacando a arma ativa, e o Indicador da Era atual.
3. Atacar e derrotar inimigos para encher a barra de especial até 100% (ver o aviso `[Q] LOBISOMEM`).
4. Pressionar `Q`:
   - Confirmar que o player muda de visual, corre mais rápido e pula mais alto.
   - Atacar com `H` inimigos de qualquer Era e confirmar que as garras causam **100% de dano (`effective: true`)** mesmo sem trocar de arma.
   - Aguardar os `7s` (`TRANSFORM_DURATION`) até a barra zerar e o player voltar à forma humana.

---

## Definition of Done (DoD)
- [ ] `npx tsc --noEmit` limpo
- [ ] Barra de especial enche ao causar dano/matar e drena suavemente durante a transformação
- [ ] Tecla `Q` ativa o modo Lobisomem com buffs de movimento/pulo e garras universais (`1.0x` em qualquer Era)
- [ ] HUD permanece fixo na tela (`k.fixed()`) e reflete `state` sem atraso
