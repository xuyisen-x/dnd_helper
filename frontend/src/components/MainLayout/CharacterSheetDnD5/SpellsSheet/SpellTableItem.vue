<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import { computed, ref } from 'vue'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import EditArrayPopover from '../Common/EditArrayPopover.vue'
import AbilityIcon from '@/components/Icons/AbilityIcon.vue'
import DiceIcon from '@/components/Icons/DiceIcon.vue'
import RollConfigPopover from '../Common/RollConfigPopover.vue'
import ExistingSpellsEditor from './ExistingSpellsEditor.vue'
import CustomSpellEditor from './CustomSpellEditor.vue'
import SpellDetailPanel from '../SpellList/SpellDetailPanel.vue'
import SpellListsPanel from './SpellListsPanel.vue'
import { useDnd5Logic } from '@/composables/rules/useDnd5Logic'
import { isUsingMouse } from '@/composables/useGlobalState'
import { useDiceBox } from '@/composables/useDiceBox'
import { addDiceResult } from '@/stores/dice-result'
import type { Spell } from '@/types/dnd5-spells'

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

const addingExistingSpell = ref(false)
const addingCustomSpell = ref(false)

const addExistingSpell = () => {
  addingExistingSpell.value = true
}

const addCustomSpell = () => {
  addingCustomSpell.value = true
}

const selectedSpell = ref<null | Spell>(null)
</script>

<template>
  <div class="details-panel">
    <div v-if="sheet.spells.list.length === 0" class="empty-tip">点击 "+" 创建一个新的法术列表</div>
    <div v-else-if="currentList === undefined" class="empty-tip">请选择一个法术列表</div>
    <div v-else class="main-content">
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
      <div class="divider"></div>
      <div class="list-and-detail">
        <SpellListsPanel
          :id="props.id!"
          :selected-spell-id="selectedSpell?.id"
          @select="selectedSpell = $event"
        ></SpellListsPanel>
        <div class="btn-and-detail">
          <div class="btn-group">
            <div class="add-spell-btn" @click="addExistingSpell">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7.833 18c1.4 0 2.62.819 3.195 2.028a1 1 0 0 1-1.806.86A1.54 1.54 0 0 0 7.833 20H3a1 1 0 1 1 0-2zM21 18a1 1 0 1 1 0 2h-4.833c-.567 0-1.135.357-1.389.889a1 1 0 0 1-1.806-.86A3.58 3.58 0 0 1 16.167 18z"
                />
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M8.889 3.006a4.33 4.33 0 0 1 3.11 1.564A4.33 4.33 0 0 1 15.333 3H22a1 1 0 0 1 1 1v12.001a1 1 0 0 1-1 1L15.333 17c-.658 0-1.085.162-1.372.354a1.93 1.93 0 0 0-.65.76A3.1 3.1 0 0 0 13 19.33v.009l-.005.097a1 1 0 0 1-1.99 0L11 19.334v-.005l-.004-.068a3.1 3.1 0 0 0-.305-1.151a1.9 1.9 0 0 0-.64-.76c-.28-.19-.698-.35-1.343-.35H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6.667zM11 5v12.334h2V5z"
                  clip-rule="evenodd"
                />
              </svg>
              添加已有法术
            </div>
            <div class="add-spell-btn" @click="addCustomSpell">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                >
                  <path d="M3 21h4L20 8a1.5 1.5 0 0 0-4-4L3 17zM14.5 5.5l4 4" />
                  <path d="M12 8L7 3L3 7l5 5M7 8L5.5 9.5M16 12l5 5l-4 4l-5-5m4 1l-1.5 1.5" />
                </g>
              </svg>
              添加自定义法术
            </div>
          </div>
          <div class="detail-wrapper">
            <SpellDetailPanel :spell="selectedSpell" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <ExistingSpellsEditor
      :id="props.id!"
      v-if="addingExistingSpell"
      @close="addingExistingSpell = false"
    />
    <CustomSpellEditor
      :id="props.id!"
      v-else-if="addingCustomSpell"
      @close="addingCustomSpell = false"
    />
  </Teleport>
</template>

<style scoped>
.details-panel {
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 90px;
  padding: 10px;
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
.divider {
  height: 2px;
  background-color: var(--dnd-ink-secondary);
  width: 100%;
  margin: 10px 0;
  opacity: 0.5;
}
.main-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.btn-group {
  display: flex;
  gap: 10px;
  justify-content: right;
}
.add-spell-btn {
  width: 180px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 6px 0;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  /* 防止文字被选中 */
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  background-color: rgba(255, 255, 255, 0.4);
  border: 1px solid var(--dnd-ink-secondary);
  color: var(--dnd-ink-primary);
}
body.has-mouse .add-spell-btn:hover {
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--dnd-ink-primary);
}

.btn-and-detail {
  min-height: 0;
  min-width: 0;
  align-self: self-start;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 700px;
}

.list-and-detail {
  max-height: 700px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.detail-wrapper {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
