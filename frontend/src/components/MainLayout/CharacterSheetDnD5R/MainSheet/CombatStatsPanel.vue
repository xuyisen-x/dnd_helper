<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5rData } from '@/stores/rules/dnd5r'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5rData,
  set: (val) => (store.data = val),
})

type hitDiceType = 'd6' | 'd8' | 'd10' | 'd12'

const hpChangeInput = ref('')

// 处理伤害、治疗处理逻辑
const applyHpChange = (type: 'heal' | 'damage') => {
  const amount = parseInt(hpChangeInput.value)
  if (isNaN(amount) || amount <= 0) return

  const hp = sheet.value.combat.hp
  let current = hp.current
  const maxHp = hp.max
  let temp = Number(hp.temp) || 0

  if (type === 'heal') {
    current = Math.min(current + amount, maxHp) // 治疗：不超过最大生命值
    sheet.value.combat.deathSaves.fail = 0 // 治疗时重置失败的死亡豁免
    sheet.value.combat.deathSaves.success = 0 // 治疗时重置成功的死亡豁免
  } else {
    let damageRemaining = amount
    // 优先扣除临时生命值
    if (temp > 0) {
      if (temp >= damageRemaining) {
        temp -= damageRemaining
        damageRemaining = 0
      } else {
        damageRemaining -= temp
        temp = 0
      }
    }
    // 如果当前生命值为0，说明已经濒死，进行死亡豁免相关处理
    if (current === 0 && damageRemaining > 0) {
      if (damageRemaining >= maxHp) {
        // 一次性受到等于或超过最大生命值的伤害，直接死亡
        sheet.value.combat.deathSaves.fail = 3
      } else {
        // 处于濒死状态时受到伤害，自动失败一次死亡豁免
        sheet.value.combat.deathSaves.fail += 1
      }
    }
    // 一次性伤害超过了当前生命值+最大生命值，直接死亡
    if (damageRemaining >= current + maxHp) {
      sheet.value.combat.deathSaves.fail = 3
    }
    // 扣除剩余伤害
    current = Math.max(current - damageRemaining, 0)
  }

  sheet.value.combat.hp.current = current
  sheet.value.combat.hp.temp = temp === 0 ? '' : String(temp)

  hpChangeInput.value = ''
}

// 处理纯数字输入
const handleNumInputHpChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  hpChangeInput.value = target.value
}

const handleNumInputMax = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  sheet.value.combat.hp.max = Number(target.value)
}

const handleNumInputTemp = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  sheet.value.combat.hp.temp = target.value === '' ? '' : String(target.value)
}

const handleNumInputCurrent = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  sheet.value.combat.hp.current = Number(target.value)
}

const handleNumInputHd = (e: Event, type: hitDiceType, field: 'total' | 'current') => {
  const target = e.target as HTMLInputElement
  const tmp = target.value.replace(/\D/g, '') // 只留数字
  target.value = tmp.length > 2 ? tmp.slice(0, 2) : tmp // 限制两位数
  sheet.value.combat.hitDice[type][field] = Number(target.value)
}

const toggleDeathSave = (type: 'success' | 'fail', index: number) => {
  const currentVal = sheet.value.combat.deathSaves[type]
  sheet.value.combat.deathSaves[type] = currentVal === index ? index - 1 : index
}
</script>

<template>
  <div class="combat-panel">
    <!-- 生命值栏 -->
    <div class="col hp-section">
      <div class="section-header">生命值</div>

      <div class="hp-main-layout">
        <div class="hp-current">
          <input
            type="text"
            inputmode="numeric"
            v-model.number="sheet.combat.hp.current"
            @input="handleNumInputCurrent"
            class="input-huge"
          />
          <span class="label">当前</span>
        </div>

        <div class="v-divider"></div>

        <div class="hp-side">
          <div class="hp-field">
            <input
              type="text"
              inputmode="numeric"
              v-model="sheet.combat.hp.temp"
              @input="handleNumInputTemp"
              class="input-medium text-temp"
              placeholder="-"
            />
            <span class="label">临时</span>
          </div>
          <div class="hp-field">
            <input
              type="text"
              inputmode="numeric"
              v-model.number="sheet.combat.hp.max"
              @input="handleNumInputMax"
              class="input-medium"
            />
            <span class="label">最大</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="action-btn heal" @click="applyHpChange('heal')" title="治疗">+</button>
        <input
          type="text"
          inputmode="numeric"
          class="action-input"
          placeholder="数值"
          :value="hpChangeInput"
          @input="handleNumInputHpChange"
          @keyup.enter="applyHpChange('damage')"
        />
        <button class="action-btn damage" @click="applyHpChange('damage')" title="伤害">-</button>
      </div>
    </div>

    <div class="panel-divider"></div>

    <!-- 生命骰栏 -->
    <div class="col hd-section">
      <div class="section-header">生命骰</div>
      <div class="center-content">
        <div class="hd-box">
          <div v-for="type in ['d6', 'd8', 'd10', 'd12']" :key="type" class="hd-field">
            <input
              type="text"
              inputmode="numeric"
              class="input-small"
              @input="
                (e) => {
                  handleNumInputHd(e, type as hitDiceType, 'current')
                }
              "
              v-model.number="sheet.combat.hitDice[type as hitDiceType].current"
            />
            <div class="hd-separator">/</div>
            <input
              type="text"
              inputmode="numeric"
              class="input-small"
              @input="
                (e) => {
                  handleNumInputHd(e, type as hitDiceType, 'total')
                }
              "
              v-model.number="sheet.combat.hitDice[type as hitDiceType].total"
            />
            <div style="padding-left: 10px">{{ type.toUpperCase() }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-divider"></div>

    <!-- 死亡豁免栏 -->
    <div class="col ds-section">
      <div class="section-header">死亡豁免</div>
      <div class="center-content">
        <div class="ds-row">
          <span class="ds-label">成功</span>
          <div class="check-group">
            <div
              v-for="i in 3"
              :key="`s-${i}`"
              class="circle-check success"
              :class="{ active: sheet.combat.deathSaves.success >= i }"
              @click="toggleDeathSave('success', i)"
            ></div>
          </div>
        </div>

        <div class="ds-row">
          <span class="ds-label">失败</span>
          <div class="check-group">
            <div
              v-for="i in 3"
              :key="`f-${i}`"
              class="circle-check fail"
              :class="{ active: sheet.combat.deathSaves.fail >= i }"
              @click="toggleDeathSave('fail', i)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 整体容器风格 --- */
.combat-panel {
  display: flex;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 通用列样式 */
.col {
  display: flex;
  flex-direction: column;
  padding: 0 10px;
}

.hp-section {
  flex: 2;
} /* HP 区域宽一点 */
.hd-section {
  flex: 1;
  align-items: center;
}
.ds-section {
  flex: 1;
  align-items: center;
}

/* 黑色细分割线 */
.panel-divider {
  width: 1px;
  background-color: var(--dnd-ink-secondary);
  opacity: 0.3;
  margin: 5px 0;
}

/* 标题样式 */
.section-header {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  text-transform: uppercase;
  text-align: center;
  letter-spacing: 1px;
}

/* --- 1. HP 区域样式 --- */
.hp-main-layout {
  display: flex;
  flex: 1;
  align-items: center;
  width: 100%;
}

.hp-current {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.v-divider {
  width: 1px;
  height: 60%;
  background-color: var(--dnd-ink-secondary);
  opacity: 0.2;
  margin: 0 10px;
}
.hp-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 60px;
}

.hp-field {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 输入框文字样式 */
.input-huge {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--dnd-ink-primary);
  width: 100%;
  text-align: center;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.input-medium {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  width: 100%;
  text-align: center;
}
.text-temp {
  color: var(--dnd-magic-blue);
} /* 临时生命用蓝色 */

.input-small {
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
  width: 30px;
  text-align: center;
}

.label {
  font-size: 0.8rem;
  color: var(--dnd-ink-primary);
  margin-top: 2px;
  text-transform: uppercase;
}

/* 快速操作条 */
.quick-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px;
  border-radius: 15px;
}
.action-input {
  flex: 1;
  text-align: center;
  font-size: 1rem;
  background: transparent;
  border: none;
  outline: none;
  color: var(--dnd-ink-primary);
}
.action-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  line-height: 1;
}
.action-btn.heal {
  background-color: #2e7d32;
} /* 绿 */
.action-btn.damage {
  background-color: var(--dnd-dragon-red);
} /* 红 */
.action-btn:hover {
  filter: brightness(1.1);
}

/* --- 2. 生命骰 --- */
.center-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.hd-box {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.hd-field {
  display: flex;
  align-items: center;
}
.hd-separator {
  font-size: 1.2rem;
  color: var(--dnd-ink-secondary);
  opacity: 0.5;
}

/* --- 3. 死亡豁免 --- */
.ds-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 6px;
  gap: 8px;
}
.ds-label {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
}
.check-group {
  display: flex;
  gap: 8px;
}
.circle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}
/* 成功：绿色实心 */
.success.active {
  background-color: #2e7d32;
  border-color: #2e7d32;
}
/* 失败：红色实心 */
.fail.active {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
}
</style>
