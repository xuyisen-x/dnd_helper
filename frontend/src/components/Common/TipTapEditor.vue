<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Image from '@tiptap/extension-image'
import ResizableImage from './ResizableImage.vue'

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

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // 保留原有的 src, alt, title 属性
      width: {
        default: null,
        // 告诉 Tiptap，如果存在 width 属性，就把他写进 HTML 标签里
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
    }
  },
  // 2. 将渲染权交给我们的 Vue 组件
  addNodeView() {
    return VueNodeViewRenderer(ResizableImage)
  },
}).configure({
  // 核心修复点：允许 Tiptap 在解析 HTML 时接受 Base64 图片！
  allowBase64: true,
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Highlight,
    Typography,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    CustomImage,
  ],
  editorProps: {
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items
      if (!items) return false

      let hasImage = false

      // 遍历剪贴板内容，寻找图片
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          hasImage = true
          const file = item.getAsFile()

          if (file) {
            // 使用 FileReader 将图片转换为 Base64
            const reader = new FileReader()
            reader.onload = (e) => {
              const base64 = e.target?.result as string
              // 将转好的 Base64 插入到光标位置
              editor.value?.commands.setImage({ src: base64 })
            }
            reader.readAsDataURL(file)
          }
        }
      }

      // 如果剪贴板里有图片，我们自己处理了，就返回 true 阻止默认粘贴行为
      // 如果没有图片（比如纯文本），返回 false 让 Tiptap 走默认逻辑
      return hasImage
    },
  },
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
  padding: 10px;
}

:deep(.ProseMirror strong),
:deep(.ProseMirror b) {
  font-weight: bold; /* 或者用 700 / 600 */
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--dnd-ink-secondary, #ccc); /* 左侧经典的粗竖线 */
  margin: 1rem 0;
  padding: 0.5rem 0 0.5rem 1rem; /* 给左边留出内边距，让文字不要贴着线 */
  color: #555; /* 字体颜色稍微变浅，以示区别 */
  background-color: rgba(0, 0, 0, 0.02); /* 可选：给个极淡的背景色 */
  border-radius: 0 4px 4px 0;
}

/* 保证引用块里面的段落不要有额外的奇怪边距 */
:deep(.ProseMirror blockquote p) {
  margin: 0;
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
