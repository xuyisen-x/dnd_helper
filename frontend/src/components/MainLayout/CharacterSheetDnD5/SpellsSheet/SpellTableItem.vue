<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import EditArrayPopover from '../Common/EditArrayPopover.vue'
import AbilityIcon from '@/components/Icons/AbilityIcon.vue'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import RollConfigPopover from '../Common/RollConfigPopover.vue'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import { isUsingMouse } from '@/composables/useGlobalState'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'

const props = defineProps<{
  id: string | null
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { getSpellAttackBonus, getSpellDC } = useDnd5Logic(sheet)

const currentList = computed(() => {
  return sheet.value.spells.list.find((list) => list.id === props.id)
})

const isEditingDC = ref(false)
const isEditingAttackBonus = ref(false)

const spellAttackBonus = computed(() => {
  if (props.id === null) return 0
  return getSpellAttackBonus(props.id)
})

const spellDC = computed(() => {
  if (props.id === null) return 0
  return getSpellDC(props.id)
})

const { parseAndRoll } = useDiceBox()

const rollSpellAttack = async () => {
  // 首先得到加值
  const modify = spellAttackBonus.value
  // // 构造掷骰字符串
  const rollString = `1d20${modify >= 0 ? '+' : ''}${modify}`
  const title = `法术攻击掷骰`
  const result = await parseAndRoll(rollString)

  if (result !== null) {
    addDiceResult(result, rollString, title)
  }
}

const isConfigOpen = ref(false)
const openConfig = () => {
  isConfigOpen.value = true
}
</script>

<template>
  <div class="details-panel">
    <div v-if="sheet.spells.list.length === 0" class="empty-tip">点击 "+" 创建一个新的法术列表</div>
    <div v-else-if="currentList === undefined" class="empty-tip">请选择一个法术列表</div>
    <div v-else>
      <div class="header-grid">
        <div class="name-box">
          <input
            type="text"
            v-model="currentList.name"
            class="input-title"
            placeholder="未命名法术列表"
          />
          <label>法术列表名称</label>
        </div>
        <div class="ability-grid">
          <div class="label center-text">施法属性</div>
          <div class="icon-grid">
            <div
              class="ability-icon"
              @click="currentList.ability = 'int'"
              :class="{ active: currentList.ability === 'int' }"
            >
              <AbilityIcon type="int" class="clickable" />
            </div>
            <div
              class="ability-icon"
              @click="currentList.ability = 'wis'"
              :class="{ active: currentList.ability === 'wis' }"
            >
              <AbilityIcon type="wis" class="clickable" />
            </div>
            <div
              class="ability-icon"
              @click="currentList.ability = 'cha'"
              :class="{ active: currentList.ability === 'cha' }"
            >
              <AbilityIcon type="cha" class="clickable" />
            </div>
            <div class="icon-label center-text" :class="{ active: currentList.ability === 'int' }">
              智力
            </div>
            <div class="icon-label center-text" :class="{ active: currentList.ability === 'wis' }">
              感知
            </div>
            <div class="icon-label center-text" :class="{ active: currentList.ability === 'cha' }">
              魅力
            </div>
          </div>
        </div>
        <div class="stat-panel">
          <div class="panel-header">
            <span class="label">法术攻击加值</span>
            <div
              class="dice-container"
              @click="rollSpellAttack"
              @contextmenu.prevent.stop="
                () => {
                  if (isUsingMouse) openConfig()
                }
              "
              v-longpress="
                () => {
                  if (!isUsingMouse) openConfig()
                }
              "
            >
              <DiceIcon class="clickable" title="roll!!!" />
              <RollConfigPopover
                v-if="isConfigOpen"
                title="法术攻击掷骰"
                :baseModifier="spellAttackBonus"
                @close="isConfigOpen = false"
              />
            </div>
          </div>
          <div class="panel-divider"></div>
          <div class="panel-content">
            <span
              class="big-value clickable"
              title="点击修改法术攻击加值"
              @click="isEditingAttackBonus = true"
              >{{ spellAttackBonus }}</span
            >
            <EditArrayPopover
              v-if="isEditingAttackBonus"
              v-model="currentList.extra_attack_bonus"
              @close="isEditingAttackBonus = false"
              @click.stop
            />
          </div>
        </div>
        <div class="stat-panel">
          <div class="panel-header">
            <span class="label">法术豁免DC</span>
          </div>
          <div class="panel-divider"></div>
          <div class="panel-content">
            <span
              class="big-value clickable"
              title="点击修改法术豁免DC加值"
              @click="isEditingDC = true"
              >{{ spellDC }}</span
            >
            <EditArrayPopover
              v-if="isEditingDC"
              v-model="currentList.extra_dc"
              @close="isEditingDC = false"
              @click.stop
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-panel {
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 90px;
}
.empty-tip {
  text-align: center;
  color: var(--dnd-ink-secondary);
  font-style: italic;
  padding: 20px;
  opacity: 0.7;
}
.name-box {
  flex: 1; /* 占据剩余空间 */
  min-width: 200px;
}
.input-title {
  font-size: 2rem; /* 姓名特别大 */
  font-weight: bold;
  height: 50px;
  font-family: 'Georgia', serif;
}
.header-grid {
  display: grid;
  grid-template-columns: 1fr 240px 180px 180px;
  gap: 10px;
  margin: 5px 10px;
  height: 110px;
  align-items: center; /* 添加这一行实现纵向居中 */
}
.stat-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 65px;
}

.panel-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  position: relative;
  z-index: 1;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 4px 0;
  background-color: rgba(0, 0, 0, 0.03);
  position: relative;
}

.label {
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  letter-spacing: 1px;
}

.big-value {
  font-family: 'Georgia', serif;
  font-size: 2.4rem; /* 核心数据大一点 */
  color: var(--dnd-ink-primary);
  line-height: 1;
}

.panel-divider {
  height: 2px;
  background-color: var(--dnd-ink-primary);
  width: 100%;
  opacity: 0.8;
}
.ability-grid {
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: 4px;
}
.center-text {
  justify-self: center;
}
.ability-icon {
  font-size: 3rem;
  margin: 0;
  padding: 0;
  line-height: 1;
  color: var(--dnd-ink-secondary);
}
.icon-grid {
  display: grid;
  grid-template-columns: 3rem 3rem 3rem;
  grid-template-rows: 3rem auto;
  justify-content: center;
  align-items: center;
  gap: 0px 20px;
  margin-top: 8px;
}
.ability-icon.active {
  color: var(--dnd-dragon-red);
  transform: scale(1.1);
}
.icon-label {
  font-weight: bold;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
  letter-spacing: 1px;
  color: var(--dnd-ink-secondary);
}
.icon-label.active {
  color: var(--dnd-ink-primary);
  transform: scale(1.1);
}
.dice-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
