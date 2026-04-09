<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'

const CharacterSheetDnD5 = defineAsyncComponent(
  () => import('@/components/MainLayout/CharacterSheetDnD5.vue'),
)

const FileBottonGroup = __TAURI__
  ? defineAsyncComponent(() => import('@/components/Common/FileBottonGroupDesktop.vue'))
  : defineAsyncComponent(() => import('@/components/Common/FileBottonGroupWeb.vue'))

const activeCharacterStore = useActiveCharacterStore()

const isTauri = __TAURI__
</script>

<template>
  <div class="page-container">
    <div class="sheet-wrapper">
      <FileBottonGroup />
      <CharacterSheetDnD5
        v-if="activeCharacterStore.rule === 'dnd5r' || activeCharacterStore.rule === 'dnd5e'"
      />
    </div>
    <div class="footnote" v-if="!isTauri">
      <a href="https://beian.miit.gov.cn/" target="_blank">浙ICP备2025215728号-1</a>
    </div>
  </div>
</template>

<style scoped>
.footnote {
  width: 100%;
  text-align: center;
  margin-top: 10px;

  font-size: 0.75rem;
  color: var(--dnd-ink-secondary);

  display: flex;
  justify-content: center;
  align-items: center;
}

.footnote a {
  text-decoration: none;
}

body.has-mouse .footnote a:hover {
  color: var(--dnd-dragon-red);
  text-decoration: underline;
}

.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: visible;
  padding: 1rem 0 1rem 0;
}

.sheet-wrapper {
  width: fit-content;
  margin: 0 auto;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--color-background-mute);
  padding: 20px;
}
</style>
