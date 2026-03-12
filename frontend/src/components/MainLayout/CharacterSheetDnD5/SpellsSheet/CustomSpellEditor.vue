<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import type { Spell } from '@/types/dnd5-spells'
import { nanoid } from 'nanoid'

const TipTapEditor = defineAsyncComponent(() => import('@/components/Common/TipTapEditor.vue'))

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})
const emit = defineEmits(['close'])

const newSpell = ref<Spell>({
  id: nanoid(),
  name: '', // done
  english_name: '', // done
  level: 0, //done
  school: 'abjuration', //done
  class_list: [], // don't care
  is_ritual: false, // done
  casting_time: '', // done
  range: '', // done
  need_verbal: false, // done
  need_somatic: false, // done
  material: null, // done
  need_concentration: false, // done
  duration: '', // done
  description: '',
  source: 'CUSTOM', // don't care
  is_legacy: false, // don't care
})

const closeDialog = () => {
  emit('close')
}

const props = defineProps<{
  id: string
}>()

const closeEditDialog = () => {
  emit('close')
}

const saveEditDialog = () => {
  const targetSpellList = sheet.value.spells.list.find((list) => list.id === props.id)
  if (targetSpellList !== undefined) {
    targetSpellList.spells.push({
      spell: newSpell.value,
      prepared: false,
      dontCount: false,
      notes: '',
      freeUsage: '',
      afterLongRest: '',
      afterShortRest: '',
    })
  }
  emit('close')
}

const toggleMaterial = () => {
  if (newSpell.value.material === null) {
    newSpell.value.material = ''
  } else {
    newSpell.value.material = null
  }
}
</script>

<template>
  <div class="add-spell-dialog-mask" @click.self="closeDialog">
    <div class="add-spell-feature-dialog">
      <div class="name-display">
        <input
          class="spell-name"
          type="text"
          v-model="newSpell.name"
          placeholder="请输入法术名称"
        />
        <input
          class="english"
          type="text"
          v-model="newSpell.english_name"
          placeholder="请输入法术英文名称"
        />
      </div>
      <div class="main-display">
        <div class="details-panel">
          <div class="label">法术环阶</div>
          <div class="level-selector">
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 0 }"
              @click="newSpell.level = 0"
            >
              戏法
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 1 }"
              @click="newSpell.level = 1"
            >
              一环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 2 }"
              @click="newSpell.level = 2"
            >
              二环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 3 }"
              @click="newSpell.level = 3"
            >
              三环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 4 }"
              @click="newSpell.level = 4"
            >
              四环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 5 }"
              @click="newSpell.level = 5"
            >
              五环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 6 }"
              @click="newSpell.level = 6"
            >
              六环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 7 }"
              @click="newSpell.level = 7"
            >
              七环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 8 }"
              @click="newSpell.level = 8"
            >
              八环
            </div>
            <div
              class="level-item"
              :class="{ checked: newSpell.level === 9 }"
              @click="newSpell.level = 9"
            >
              九环
            </div>
          </div>
          <div class="label">法术学派</div>
          <div class="school-selector">
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'abjuration' }"
              @click="newSpell.school = 'abjuration'"
            >
              防护
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'conjuration' }"
              @click="newSpell.school = 'conjuration'"
            >
              咒法
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'divination' }"
              @click="newSpell.school = 'divination'"
            >
              预言
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'enchantment' }"
              @click="newSpell.school = 'enchantment'"
            >
              惑控
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'evocation' }"
              @click="newSpell.school = 'evocation'"
            >
              塑能
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'illusion' }"
              @click="newSpell.school = 'illusion'"
            >
              幻术
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'necromancy' }"
              @click="newSpell.school = 'necromancy'"
            >
              死灵
            </div>
            <div
              class="school-item"
              :class="{ checked: newSpell.school === 'transmutation' }"
              @click="newSpell.school = 'transmutation'"
            >
              变化
            </div>
          </div>
          <div class="label">法术成分</div>
          <div class="components-group">
            <div class="filter-chip" @click="newSpell.need_verbal = !newSpell.need_verbal">
              <div class="check-icon" :class="{ checked: newSpell.need_verbal }">
                <svg v-if="newSpell.need_verbal" viewBox="0 0 24 24" class="svg-icon">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span class="choice-label">言语成分</span>
            </div>
            <div class="filter-chip" @click="newSpell.need_somatic = !newSpell.need_somatic">
              <div class="check-icon" :class="{ checked: newSpell.need_somatic }">
                <svg v-if="newSpell.need_somatic" viewBox="0 0 24 24" class="svg-icon">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span class="choice-label">姿势成分</span>
            </div>
            <div class="filter-chip" @click="toggleMaterial()">
              <div class="check-icon" :class="{ checked: newSpell.material !== null }">
                <svg v-if="newSpell.material !== null" viewBox="0 0 24 24" class="svg-icon">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span class="choice-label">材料成分</span>
            </div>
            <div v-if="newSpell.material !== null">
              <input
                class="material-input"
                type="text"
                v-model="newSpell.material"
                placeholder="请输入材料成分"
              />
            </div>
            <div v-else></div>
          </div>
          <div class="label">其他</div>
          <div class="other-group">
            <div class="choice-group">
              <div
                class="filter-chip"
                @click="newSpell.need_concentration = !newSpell.need_concentration"
              >
                <div class="check-icon" :class="{ checked: newSpell.need_concentration }">
                  <svg v-if="newSpell.need_concentration" viewBox="0 0 24 24" class="svg-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span class="choice-label">需要专注</span>
              </div>
              <div class="filter-chip" @click="newSpell.is_ritual = !newSpell.is_ritual">
                <div class="check-icon" :class="{ checked: newSpell.is_ritual }">
                  <svg v-if="newSpell.is_ritual" viewBox="0 0 24 24" class="svg-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span class="choice-label">仪式施法</span>
              </div>
            </div>
            <div class="labeled-input">
              <div class="choice-label">施法时间：</div>
              <input
                class="material-input"
                type="text"
                v-model="newSpell.casting_time"
                placeholder="请输入施法时间"
              />
            </div>
            <div class="labeled-input">
              <div class="choice-label">施法范围：</div>
              <input
                class="material-input"
                type="text"
                v-model="newSpell.range"
                placeholder="请输入施法范围"
              />
            </div>
            <div class="labeled-input">
              <div class="choice-label">持续时间：</div>
              <input
                class="material-input"
                type="text"
                v-model="newSpell.duration"
                placeholder="请输入持续时间"
              />
            </div>
          </div>
        </div>
        <div class="description-panel">
          <div class="label">法术描述</div>
          <div class="editor-wrapper">
            <TipTapEditor v-model="newSpell.description" placeholder="请输入法术描述" />
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <div style="flex: 1"></div>
        <button class="btn-ghost" @click="closeEditDialog">取消</button>
        <button class="btn-primary" @click="saveEditDialog">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-spell-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.add-spell-feature-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  width: min(520px, 90vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  height: 90vh;
  width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  font-family: Georgia, serif;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  color: var(--dnd-ink-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-dragon-red-hover);
}

body.has-mouse .btn-ghost:hover {
  color: var(--dnd-ink-primary);
  border-color: var(--dnd-ink-primary);
  background-color: rgba(0, 0, 0, 0.04);
}

.name-display {
  display: flex;
  flex-direction: column;
  width: 70%;
}

.main-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  gap: 20px;
  min-height: 0;
}

.spell-name {
  margin: 0;
  color: var(--dnd-dragon-red);
  background: transparent;
  border: none;
  font-family: inherit;
  outline: none;
  width: 100%;
  font-size: 2rem;
}

.english {
  margin: 4px 0 10px;
  font-style: italic;
  color: var(--dnd-ink-secondary);
  background: transparent;
  border: none;
  font-family: inherit;
  outline: none;
  width: 100%;
  font-size: 1rem;
}

.material-input:focus,
.spell-name:focus,
.english:focus {
  border-bottom: 1px solid var(--dnd-dragon-red);
  background-color: rgba(255, 255, 255, 0.2);
}

.label {
  font-size: 1rem;
  color: var(--dnd-ink-secondary);
  margin-top: 10px;
  margin-bottom: 5px;
}

.level-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: 35px 35px;
  gap: 8px;
}

.school-item,
.level-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dnd-ink-secondary);
  color: var(--dnd-ink-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

body.has-mouse .school-item:hover,
body.has-mouse .level-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  border-color: var(--dnd-ink-primary);
}

.school-item.checked,
.level-item.checked {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
  color: var(--dnd-mithral-text);
}

body.has-mouse .school-item.checked:hover,
body.has-mouse .level-item.checked:hover {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
}

.school-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 35px 35px;
  gap: 8px;
}

.check-icon {
  width: 18px;
  height: 18px;
  border-radius: 20%;
  border: 2px solid var(--dnd-stone-text);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.check-icon.checked {
  background-color: var(--dnd-dragon-red);
  border-color: var(--dnd-dragon-red);
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  margin-left: 10px;
}

.svg-icon {
  stroke: var(--dnd-mithral-text);
  fill: none;
  stroke-width: 4;
}

.choice-label {
  font-size: 1rem;
  font-weight: bold;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  display: flex;
  align-items: center; /* 核心：垂直居中 */
}

.components-group {
  display: grid;
  gap: 10px;
  grid-template-columns: auto auto auto 1fr;
}

.material-input {
  color: var(--dnd-ink-secondary);
  background: transparent;
  border: none;
  font-family: inherit;
  outline: none;
  width: 100%;
  font-size: 1rem;
}

.other-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 4px;
  column-gap: 10px;
}

.choice-group {
  display: flex;
  gap: 10px;
  flex-direction: row;
}

.labeled-input {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

.details-panel {
  max-height: 100%;
  overflow-y: auto;
}

.description-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 4px;
  padding: 10px;
  overflow-y: auto;
}
</style>
