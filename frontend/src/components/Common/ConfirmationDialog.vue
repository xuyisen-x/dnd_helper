<script setup lang="ts">
import { useConfirmationBox } from '@/composables/useConfirmationBox'

const { state, confirm, cancel } = useConfirmationBox()
</script>

<template>
  <div v-if="state.isOpen" class="confirmation-mask" @click.self="cancel">
    <div class="confirmation-dialog" role="dialog" aria-modal="true">
      <div class="dialog-header">{{ state.title }}</div>
      <div class="dialog-body">
        <p class="dialog-message">{{ state.message }}</p>
      </div>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="cancel">取消</button>
        <button class="btn-primary" @click="confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-primary {
  background-color: var(--dnd-dragon-red);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
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

.confirmation-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.confirmation-dialog {
  background: var(--dnd-parchment-bg);
  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 12px;
  padding: 18px 20px;
  width: min(420px, 88vw);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-header {
  font-weight: 700;
  color: var(--dnd-ink-primary);
  font-size: 1rem;
}

.dialog-body {
  font-size: 0.9rem;
  color: var(--dnd-ink-secondary);
  font-family: 'Georgia', serif;
}

.dialog-message {
  margin: 0;
  white-space: pre-wrap;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
