<script lang="ts" setup>
import CharacterSheetView from './MainLayout/CharacterSheetView.vue'
</script>

<template>
  <div class="app-layout">
    <main class="main-content">
      <div class="content-wrapper">
        <CharacterSheetView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  /* 头部固定高度，剩下给内容 */
  grid-template-rows: 1fr;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-background-mute); /* 整体背景偏深一点，突出纸张 */
  overflow: hidden;
}

/* --- 主内容区 --- */
.main-content {
  background-color: var(--dnd-parchment-bg); /* 羊皮纸背景 */
  overflow-y: auto;
  overflow-x: visible;
  position: relative;

  /* 这里的 padding 是为了让内容不贴边 */
  padding: 0;
}

.content-wrapper {
  margin: 0 auto;
  padding: 20px;
  min-height: 100%;
}

/* --- 页面切换过渡动画 --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
