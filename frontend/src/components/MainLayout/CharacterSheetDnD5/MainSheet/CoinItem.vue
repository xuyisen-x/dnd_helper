<script setup lang="ts">
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { computed } from 'vue'

const store = useActiveCharacterStore()
interface Props {
  coinType: 'CP' | 'SP' | 'EP' | 'GP' | 'PP'
}

const props = defineProps<Props>()

const coin = (() => {
  switch (props.coinType) {
    case 'CP':
      return computed({
        get: () => (store.data as Dnd5Data).coins.cp,
        set: (val) => ((store.data as Dnd5Data).coins.cp = val),
      })
    case 'SP':
      return computed({
        get: () => (store.data as Dnd5Data).coins.sp,
        set: (val) => ((store.data as Dnd5Data).coins.sp = val),
      })
    case 'EP':
      return computed({
        get: () => (store.data as Dnd5Data).coins.ep,
        set: (val) => ((store.data as Dnd5Data).coins.ep = val),
      })
    case 'GP':
      return computed({
        get: () => (store.data as Dnd5Data).coins.gp,
        set: (val) => ((store.data as Dnd5Data).coins.gp = val),
      })
    case 'PP':
      return computed({
        get: () => (store.data as Dnd5Data).coins.pp,
        set: (val) => ((store.data as Dnd5Data).coins.pp = val),
      })
  }
})()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/[^\d]/g, '')
  coin.value = parseInt(value) || 0
  target.value = String(coin.value)
}

const inputFontSize = computed(() => {
  const len = String(coin.value || '').length
  if (len >= 7) return '0.8rem'
  if (len >= 6) return '0.9rem'
  if (len >= 5) return '1rem'
  return '1.2rem'
})
</script>

<template>
  <div class="coin-container">
    <div class="coin-label">{{ props.coinType }}</div>

    <div class="shield-body">
      <div class="input-wrapper">
        <input
          type="text"
          class="coin-input"
          :value="coin"
          @input="handleInput"
          :style="{ fontSize: inputFontSize }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.coin-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
}

.coin-label {
  font-family: 'Georgia', serif;
  font-size: 1.2rem;
  color: var(--dnd-ink-secondary);
  margin-bottom: 2px;
  line-height: 1;
}

/* 盾牌外框 */
.shield-body {
  width: 100%;
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 2px 2px 12px 12px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 50px;
}

/* 输入框包裹层 (蓝色背景) */
.input-wrapper {
  padding: 5px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 实际的 input 框 */
.coin-input {
  width: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: bold;
  color: var(--dnd-ink-primary);
  outline: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
}
</style>
