<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import { showToast } from '@/stores/toast'

const CharacterSheetDnD5 = defineAsyncComponent(
  () => import('@/components/MainLayout/CharacterSheetDnD5.vue'),
)

const activeCharacterStore = useActiveCharacterStore()

const CUSTOM_EXT = '.crst' // 自定义扩展名，方便用户识别

const handleSave = () => {
  try {
    const dataStr = activeCharacterStore.exportData() // 获取导出的 Base64 字符串

    const blob = new Blob([dataStr], { type: 'text/plain' }) // 创建 Blob 对象

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 获取角色名称和规则，用于生成文件名
    const charName = activeCharacterStore.getCharacterName().replace(/[\\/:*?"<>|]/g, '_')
    const rule = activeCharacterStore.rule
    // 文件名格式：名字_规则_时间戳.json
    link.download = `${charName}_${rule}_${new Date().toISOString().slice(0, 10)}${CUSTOM_EXT}`

    // 触发点击并清理
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('角色卡导出成功！', 'success')
  } catch (e) {
    console.error(e)
    showToast('导出失败', 'error')
  }
}

const handleLoad = () => {
  // 动态创建一个文件输入框
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = CUSTOM_EXT

  // 监听文件选择
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // 读取文件内容
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        activeCharacterStore.importData(result)
        showToast('角色卡读取成功！', 'success')
      } else {
        showToast('文件内容无效', 'error')
      }
    }

    reader.onerror = () => {
      showToast('文件读取发生错误', 'error')
    }

    reader.readAsText(file)
  }

  input.click()
}
</script>

<template>
  <div class="page-container">
    <div class="sheet-wrapper">
      <div class="btn-group">
        <button class="dnd-btn btn-primary" @click="handleLoad">读取档案</button>
        <button class="dnd-btn btn-primary" @click="handleSave">保存角色</button>
      </div>
      <CharacterSheetDnD5
        v-if="activeCharacterStore.rule === 'dnd5r' || activeCharacterStore.rule === 'dnd5e'"
      />
    </div>
    <div class="footnote">
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

.btn-group {
  width: 100%;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-bottom: 10px;
}

/* --- D&D 风格按钮 --- */
.dnd-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 按钮：羊皮纸深色 / 墨水色 */
.btn-primary {
  background-color: var(--dnd-parchment-card);
  color: var(--dnd-ink-primary);
  border: 1px solid var(--dnd-gold);
}
body.has-mouse .btn-primary:hover {
  background-color: var(--dnd-gold); /* 悬停变金色 */
  color: #fff;
}
</style>
