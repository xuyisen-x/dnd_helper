<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActiveCharacterStore } from '@/stores/active-character'
import type { Dnd5Data } from '@/stores/rules/dnd5'
import { showToast } from '@/stores/toast'
import { isUsingMouse } from '@/composables/useGlobalState'
import { confirmationBox } from '@/composables/useConfirmationBox'

const store = useActiveCharacterStore()
const sheet = computed({
  get: () => store.data as Dnd5Data,
  set: (val) => (store.data = val),
})

const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发文件选择
const triggerSelect = () => {
  if (!isUsingMouse.value) {
    fileInputRef.value?.click()
  } else if (!sheet.value.portraitBase64) {
    fileInputRef.value?.click()
  }
}

// 处理文件变动
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
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
const removeAvatar = async () => {
  const confirmed = await confirmationBox('移除立绘', `确定要移除立绘吗？此操作无法撤销。`)
  if (confirmed) {
    sheet.value.portraitBase64 = ''
  }
}
</script>

<template>
  <div
    class="portrait-uploader"
    @click="triggerSelect"
    v-longpress="
      () => {
        if (!isUsingMouse) removeAvatar()
      }
    "
  >
    <img
      v-if="sheet.portraitBase64"
      :src="sheet.portraitBase64"
      alt="Character Portrait"
      class="avatar-img"
    />

    <button
      v-if="sheet.portraitBase64"
      class="remove-btn"
      @click.stop="removeAvatar"
      title="移除立绘"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18 6L6 18M6 6l12 12"
        />
      </svg>
    </button>

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
      <span class="upload-text">点击以添加立绘</span>
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
  cursor: pointer;
}

.upload-text {
  font-size: 0.8rem;
  font-weight: bold;
}

/* 隐藏 Input */
.hidden-input {
  display: none;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;

  /* 居中 SVG 图标 */
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  z-index: 10;

  /* 默认隐藏，等待 hover 触发 */
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}

/* 按钮自身的 hover 效果 */
.remove-btn:hover {
  background-color: var(--dnd-dragon-red); /* 悬浮时变红提示危险操作 */
}

/* 核心：只有当外层容器被 hover 且处于 mouse 模式时，才显示按钮 */
body.has-mouse .portrait-uploader:hover .remove-btn {
  opacity: 1;
}
</style>
