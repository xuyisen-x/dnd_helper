<script setup lang="ts">
import { computed, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { DND5R_ABILITY_FULL_NAMES, DND5R_SKILL_FULL_NAMES } from '@/stores/rules/dnd5r'
import type { Dnd5rData, SixAbilityKeysDnd5r, SkillsListDnd5r } from '@/stores/rules/dnd5r'
import { useDnd5rLogic, formatWithSign } from '@/composables/rules/useDnd5rLogic'
import DiceIcon from '@/components/DiceIcon.vue'
import EditPopover from './EditPopover.vue'
import SkillDetailsPopover from './SkillDetailsPopover.vue'

// 接收唯一的参数：属性枚举 Key
const props = defineProps<{
  abilityKey: SixAbilityKeysDnd5r
}>()

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5rData,
  set: (val) => (store.data = val),
})

// 获取 DnD5R 规则逻辑相关的计算属性和方法
const { abilityModifies, saveModifies, skillModifies } = useDnd5rLogic(sheet)

// 筛选当前属性下的技能
const currentSkills = (Object.keys(sheet.value.skills) as Array<keyof SkillsListDnd5r>).filter(
  (skillKey) => sheet.value.skills[skillKey].key === props.abilityKey,
)

// 处理只允许输入正整数的函数
const handleScoreInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let cleanValue = target.value.replace(/\D/g, '') // 1. 移除所有非数字字符
  cleanValue = cleanValue.length > 2 ? cleanValue.slice(0, 2) : cleanValue // 2.限制最大两位数
  target.value = cleanValue === '' ? '0' : cleanValue // 3. 更新输入框显示
  sheet.value.abilities[props.abilityKey].score = cleanValue === '' ? 0 : Number(cleanValue) // 4. 更新数据模型
}

// 当前哪个气泡正在弹出
const currentEditPopover = ref<'save' | keyof SkillsListDnd5r | null>(null)
</script>

<template>
  <div class="shield-card">
    <!-- 属性名称 -->
    <div class="card-header">
      <h3>{{ DND5R_ABILITY_FULL_NAMES[props.abilityKey] }}</h3>
    </div>
    <!-- 属性值和调整值 -->
    <div class="main-stats">
      <div class="mod-container">
        <div class="mod-circle">
          <span class="placeholder-big">{{
            formatWithSign(abilityModifies[props.abilityKey])
          }}</span>
        </div>
        <span class="label-text mod-label">调整值</span>
      </div>

      <div class="score-container">
        <div class="score-box">
          <input
            type="text"
            inputmode="numeric"
            class="score-input"
            :value="sheet.abilities[abilityKey].score"
            @input="handleScoreInput"
          />
        </div>
        <span class="label-text score-label">属性值</span>
      </div>

      <svg class="bg-lines" viewBox="0 0 150 100" preserveAspectRatio="none">
        <path d="M0,0 Q20,60 75,90" fill="none" class="line-stroke" stroke-width="1.5" />
        <path d="M150,0 Q130,60 75,90" fill="none" class="line-stroke" stroke-width="1.5" />
      </svg>
    </div>
    <!-- 属性相关加值 -->
    <div class="list-section">
      <!-- 豁免加值 -->
      <div class="list-row" :class="{ 'divider-row': currentSkills.length > 0 }">
        <div
          title="熟练"
          class="circle-check clickable"
          :class="{ checked: sheet.abilities[abilityKey].save }"
          @click="sheet.abilities[abilityKey].save = !sheet.abilities[abilityKey].save"
        ></div>
        <div class="modify-num clickable" title="豁免调整值" @click="currentEditPopover = 'save'">
          {{ formatWithSign(saveModifies[props.abilityKey]) }}
          <EditPopover
            v-if="currentEditPopover === 'save'"
            v-model="sheet.extra_modify.save[props.abilityKey]"
            @close="currentEditPopover = null"
            @click.stop
          />
        </div>
        <div class="text-label bold">豁免</div>
        <DiceIcon class="clickable" title="roll!!!" />
      </div>
      <!-- 技能加值 -->
      <div v-for="skillKey in currentSkills" :key="skillKey" class="list-row">
        <div
          title="熟练"
          class="circle-check clickable"
          :class="{ checked: sheet.skills[skillKey].prof }"
          @click="sheet.skills[skillKey].prof = !sheet.skills[skillKey].prof"
        ></div>
        <div class="modify-num clickable" title="技能调整值" @click="currentEditPopover = skillKey">
          {{ formatWithSign(skillModifies[skillKey]) }}
          <EditPopover
            v-if="currentEditPopover === skillKey"
            v-model="sheet.extra_modify.skill[skillKey]"
            @close="currentEditPopover = null"
            @click.stop
          />
          <SkillDetailsPopover :skill-key="skillKey" />
        </div>
        <div class="text-label">{{ DND5R_SKILL_FULL_NAMES[skillKey] }}</div>
        <div
          title="专精"
          class="circle-check clickable"
          :class="{ checked: sheet.skills[skillKey].expert }"
          :style="{ visibility: sheet.skills[skillKey].prof ? 'visible' : 'hidden' }"
          @click="sheet.skills[skillKey].expert = !sheet.skills[skillKey].expert"
        ></div>
        <DiceIcon class="clickable" title="roll!!!" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shield-card {
  width: 160px;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px 10px 40px 40px;
  background-color: var(--color-background);
  padding-bottom: 15px;
  position: relative;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
}

.card-header {
  text-align: center;
  padding-top: 5px;
}
.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--dnd-ink-primary);
}

.main-stats {
  position: relative;
  height: 120px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mod-container {
  position: absolute;
  left: 12px;
  top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.mod-circle {
  width: 88px;
  height: 88px;
  border: 3px solid var(--dnd-ink-primary);
  border-radius: 50%;

  background-color: var(--color-background);

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 2px 2px 6px rgba(43, 33, 24, 0.15);
}

.placeholder-big {
  font-size: 2.6rem;
  font-weight: 900;
  line-height: 1;
  padding-bottom: 4px;
}

.score-container {
  position: absolute;
  right: 12px;
  top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}

.score-box {
  width: 65px;
  height: 55px;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 0 6px 6px 0;
  border-left: none;
  margin-left: -20px;
  padding-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(var(--dnd-gold-dim), var(--dnd-gold-dim));
  background-color: var(--color-background);
}

.score-input {
  width: 100%;
  height: 100%;
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  text-align: center;
  transform: translateX(5px);
  background: transparent;
  border: none;
  outline: none;
}

.label-text {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--dnd-ink-secondary);
  text-transform: uppercase;
  position: absolute;
}

.mod-label {
  bottom: -18px;
}

.score-label {
  bottom: -18px;
  right: 0;
  width: 100%;
  text-align: center;
  padding-left: 10px;
}

.line-stroke {
  stroke: var(--dnd-ink-secondary);
  opacity: 0.5;
}
.bg-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.list-section {
  margin-top: 15px;
  padding: 0 15px;
}
.list-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.divider-row {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dnd-ink-secondary);
  margin-bottom: 8px;
}
.circle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 50%;
  margin-right: 6px;
}
.circle-check:hover {
  border-color: var(--dnd-dragon-red);
}
.circle-check.checked {
  background-color: var(--dnd-ink-primary);
}
.circle-check.checked:hover {
  background-color: var(--dnd-dragon-red);
}
.modify-num {
  width: 25px;
  text-align: center;
  border-bottom: 1px solid var(--dnd-ink-secondary);
  font-weight: bold;
  margin-right: 6px;
  color: var(--dnd-ink-primary);

  position: relative;
}
.text-label {
  font-size: 0.9rem;
  color: var(--dnd-ink-primary);
  flex: 1;
}
.text-label.bold {
  font-weight: bold;
}
</style>
