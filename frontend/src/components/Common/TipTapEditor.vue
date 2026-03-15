<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: '请输入内容',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// 4. 监听外部传入的 modelValue 变化（比如从后端拉取了新数据）
watch(
  () => props.modelValue,
  (newValue) => {
    // 防止光标跳动：只有当外部传入的值和编辑器当前值不一致时，才重新设置内容
    const isSame = editor.value?.getHTML() === newValue
    if (!isSame && editor.value) {
      // false 表示不要触发新的更新事件
      editor.value.commands.setContent(newValue, { emitUpdate: false })
    }
  },
)

// 5. 组件销毁时，清理编辑器实例释放内存
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="tiptap-wrapper">
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.tiptap-wrapper {
  min-height: 100%;
  cursor: text;
}

.tiptap-wrapper:focus-within {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 穿透修改编辑区域的基础样式，去掉默认的蓝色聚焦框 */
:deep(.ProseMirror) {
  outline: none;
  min-height: 120px;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  /* 读取插件注入的 data-placeholder 属性值 */
  content: attr(data-placeholder);
  /* 悬浮在输入区域上，不占据实际排版空间 */
  float: left;
  /* 颜色变淡，看起来像占位符 */
  color: var(--dnd-ink-secondary);
  pointer-events: none;
  height: 0;
}
</style>
