<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { showToast } from '@/stores/toast'
import { isUsingMouse } from '@/composables/useGlobalState'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发文件选择
const triggerSelect = () => {
  fileInputRef.value?.click()
}

// 处理文件变动
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    console.error('请选择图片文件')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('图片大小不能超过 10MB', 'error')
    return
  }

  // 3. 转换为 Base64
  const reader = new FileReader()

  reader.onload = (e) => {
    if (e.target?.result) {
      sheet.value.portraitBase64 = e.target.result as string
    }
  }

  reader.onerror = () => {
    showToast('文件读取失败', 'error')
  }

  reader.readAsDataURL(file)

  // 清空 input，防止选择同一张图时不触发 change 事件
  target.value = ''
}

// 移除头像 (可选功能：右键移除？或者加个小按钮？这里演示右键移除)
const removeAvatar = () => {
  if (confirm('确定要移除立绘吗？')) {
    sheet.value.portraitBase64 = ''
  }
}
</script>

<template>
  <div
    class="portrait-uploader"
    @click="triggerSelect"
    @contextmenu.prevent="
      () => {
        if (isUsingMouse) removeAvatar()
      }
    "
    v-longpress="
      () => {
        if (!isUsingMouse) removeAvatar()
      }
    "
    title="左键上传，右键移除"
  >
    <img
      v-if="sheet.portraitBase64"
      :src="sheet.portraitBase64"
      alt="Character Portrait"
      class="avatar-img"
    />

    <div v-else class="placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
        <g
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </g>
      </svg>
      <span class="upload-text">点击以上传立绘</span>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.portrait-uploader {
  width: 100%;
  aspect-ratio: 1 / 1;

  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  border: 2px solid var(--dnd-ink-secondary);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

body.has-mouse .portrait-uploader:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 图片样式 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 关键：保证图片填满且不变形 */
  display: block;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* 占位符样式 */
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--dnd-ink-secondary);
  gap: 8px;
}

.upload-text {
  font-size: 0.8rem;
  font-weight: bold;
}

/* 隐藏 Input */
.hidden-input {
  display: none;
}
</style>
