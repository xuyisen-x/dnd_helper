<script setup lang="ts">
import { computed, ref } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import OneAutoFitText from '@/components/Common/OneRowAutoFitText.vue'
import EditArrayPopover from '../Common/EditArrayPopover.vue'
import { useDnd5Logic, formatWithSign } from '@/composables/rules/useDnd5Logic'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const { extraSaveAllModify, extraSkillAllModify } = useDnd5Logic(sheet)

const openSkillConfig = ref<boolean>(false)
const openSaveConfig = ref<boolean>(false)
</script>

<template>
  <div class="shield-card">
    <div class="list-row">
      <div class="bold-text">全部技能加值</div>
      <div
        class="modify-num"
        :class="{ clickable: !openSkillConfig }"
        @click="openSkillConfig = true"
      >
        <OneAutoFitText :min-size="10" :max-size="16">
          <span class="modify-num-text">{{ formatWithSign(extraSkillAllModify) }}</span>
        </OneAutoFitText>
        <EditArrayPopover
          v-if="openSkillConfig"
          v-model="sheet.extra_modify.skill_all"
          @close="openSkillConfig = false"
          @click.stop
        />
      </div>
    </div>
    <div class="list-row">
      <div class="bold-text">全部豁免加值</div>
      <div
        class="modify-num"
        :class="{ clickable: !openSaveConfig }"
        @click="openSaveConfig = true"
      >
        <OneAutoFitText :min-size="10" :max-size="16">
          <span class="modify-num-text">{{ formatWithSign(extraSaveAllModify) }}</span>
        </OneAutoFitText>
        <EditArrayPopover
          v-if="openSaveConfig"
          v-model="sheet.extra_modify.save_all"
          @close="openSaveConfig = false"
          @click.stop
        />
      </div>
    </div>
    <div class="list-row">
      <div class="wrapper">
        <div
          title="熟练"
          class="circle-check clickable"
          :class="{ checked: sheet.extra_modify.jack_of_all_trades }"
          @click="sheet.extra_modify.jack_of_all_trades = !sheet.extra_modify.jack_of_all_trades"
        ></div>
      </div>
      <div class="bold-text">万事通</div>
    </div>
  </div>
</template>

<style scoped>
/* --- 整体容器 --- */
.shield-card {
  width: 160px; /* 宽度固定 */
  /* 关键：高度自适应，填充父容器剩余空间 */
  display: flex;
  flex-direction: column;

  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px 10px 30px 30px; /* 底部圆角更大，像个U型盾 */
  background-color: var(--color-background);
  position: relative;
  font-family: 'Georgia', serif;
  color: var(--dnd-ink-primary);
  padding: 10px 15px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.modify-num {
  width: 25px;
  text-align: center;
  border-bottom: 1px solid var(--dnd-ink-secondary);
  margin-left: 6px;
  color: var(--dnd-ink-primary);
  font-weight: bold;
  font-size: 0.9rem;
  position: relative;
}

.bold-text {
  font-weight: bold;
  font-size: 0.9rem;
}

.circle-check {
  width: 14px;
  height: 14px;
  border: 1px solid var(--dnd-ink-primary);
  border-radius: 50%;
}
.circle-check.checked {
  background-color: var(--dnd-ink-primary);
}
body.has-mouse .circle-check:hover {
  border-color: var(--dnd-dragon-red);
}
body.has-mouse .circle-check.checked:hover {
  background-color: var(--dnd-dragon-red);
}

.wrapper {
  width: 25px;
  display: flex;
  justify-content: center;
  margin-right: 6px;
}

.modify-num-text {
  font-weight: bold;
  height: 100%;
}
</style>
