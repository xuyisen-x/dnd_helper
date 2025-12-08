<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import DamageTypeIcon from '@/components/Icons/DamageTypeIcon.vue'
import SusceptibilityIcon from '@/components/Icons/SusceptibilityIcon.vue'
import type { Dnd5Data, DamageSusceptibilitiesDnd5 } from '@/stores/rules/dnd5'
import { DAMAGE_TYEP_NAMES } from '@/stores/rules/dnd5'
import { computed } from 'vue'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const toggle_susceptibilities = (
  key: keyof DamageSusceptibilitiesDnd5,
  new_value: 'immunity' | 'resistance' | 'vulnerability' | 'normal',
) => {
  sheet.value.features.damage_susceptibilities[key] = new_value
}
</script>

<template>
  <div class="damage-susceptibility-panel">
    <div
      v-for="(value, key) in sheet.features.damage_susceptibilities"
      :key="key"
      class="susceptibility-item"
    >
      <div class="icon"><DamageTypeIcon :type="key" /></div>
      <div
        class="name"
        :class="{
          'name-immunity': value === 'immunity',
          'name-resistance': value === 'resistance',
          'name-vulnerability': value === 'vulnerability',
        }"
      >
        {{ DAMAGE_TYEP_NAMES[key] }}
      </div>
      <div class="status-panel">
        <div
          class="icon-check icon-check-immunity"
          @click="toggle_susceptibilities(key, 'immunity')"
          :class="{ checked: value === 'immunity' }"
        >
          <SusceptibilityIcon type="immunity" />
        </div>
        <div
          class="icon-check icon-check-resistance"
          @click="toggle_susceptibilities(key, 'resistance')"
          :class="{ checked: value === 'resistance' }"
        >
          <SusceptibilityIcon type="resistance" />
        </div>
        <div
          class="icon-check icon-check-normal"
          @click="toggle_susceptibilities(key, 'normal')"
          :class="{ checked: value === 'normal' }"
        >
          <SusceptibilityIcon type="normal" />
        </div>
        <div
          class="icon-check icon-check-vulnerability"
          @click="toggle_susceptibilities(key, 'vulnerability')"
          :class="{ checked: value === 'vulnerability' }"
        >
          <SusceptibilityIcon type="vulnerability" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.name {
  margin-left: 8px;
}

.status-panel {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

.damage-susceptibility-panel {
  background-color: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 5px;
  display: grid;
  grid-template-rows: repeat(auto-fill);
}

.susceptibility-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  border-bottom: 1px solid var(--dnd-ink-secondary);
}

.icon-check {
  user-select: none;
  -webkit-user-select: none; /* Safari/Chrome */
  -webkit-touch-callout: none;
  cursor: pointer;
  opacity: 0.4;
  transition:
    opacity 0.2s,
    color 0.2s;
  color: var(--dnd-ink-secondary);
}
body.has-mouse .icon-check:active {
  transform: scale(0.95);
}
.icon-check.checked {
  opacity: 1;
}

body.has-mouse .icon-check-immunity:hover,
.icon-check-immunity.checked {
  color: green;
}

body.has-mouse .icon-check-resistance:hover,
.icon-check-resistance.checked {
  color: cornflowerblue;
}

body.has-mouse .icon-check-normal:hover,
.icon-check-normal.checked {
  color: var(--dnd-ink-primary);
}

body.has-mouse .icon-check-vulnerability:hover,
.icon-check-vulnerability.checked {
  color: firebrick;
}

.name-immunity {
  color: green;
  font-weight: bold;
  text-decoration: line-through;
}

.name-resistance {
  color: cornflowerblue;
  font-weight: bold;
}

.name-vulnerability {
  color: firebrick;
  font-weight: bold;
}
</style>
