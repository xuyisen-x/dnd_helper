<script setup lang="ts">
import { computed, ref } from 'vue'
import type { OutputNode } from '@/wasm_utils/oxidice/pkg/oxidice'
import { isUsingMouse } from '@/composables/useGlobalState'
import { useDiceToolsResultStore } from '@/stores/rules/dnd5/dice-tool-stores'

const props = defineProps<{
  node: OutputNode
}>()

const store = useDiceToolsResultStore()

const isTightLayout = computed(() => {
  const type = props.node.layout.type
  return [
    'atom',
    'prefix', // -5
    'tightInfix', // 1d20
    'tightPostfix', // 4dF
    'specialModifier', // 1d10!>5
  ].includes(type)
})

const isSelected = computed(() => {
  return store.isSelectedNode(props.node.id)
})

const isHovered = ref(false)

const labelClicked = () => {
  if (isSelected.value) {
    store.clearSelectedValue()
  } else {
    store.setSelectedValue(props.node.value, props.node.id)
  }
}

const mouseEntered = () => {
  if (isUsingMouse.value) {
    isHovered.value = true
  }
}

const mouseLeft = () => {
  if (isUsingMouse.value) {
    isHovered.value = false
  }
}
</script>

<template>
  <span
    class="expression-node"
    :class="{ 'mod-tight': isTightLayout, selected: isSelected, hovered: isHovered }"
  >
    <span v-if="node.wrapInParentheses" class="symbol paren">(</span>

    <template v-if="node.layout.type === 'atom'">
      <span>{{ node.label }}</span>
    </template>

    <template v-else-if="node.layout.type === 'list'">
      <span class="symbol bracket">[</span>
      <span v-for="(child, index) in node.layout.children" :key="child.id" class="list-item">
        <span v-if="index > 0" class="symbol comma">, </span>
        <ExpressionNodeT :node="child" />
      </span>
      <span class="symbol bracket">]</span>
    </template>

    <template v-else-if="node.layout.type === 'prefix'">
      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >
      <ExpressionNodeT :node="node.layout.children" />
    </template>

    <template v-else-if="node.layout.type === 'infix'">
      <ExpressionNodeT :node="node.layout.children[0]" />
      <span
        class="op-spacing op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
      >
        {{ node.label }}
      </span>
      <ExpressionNodeT :node="node.layout.children[1]" />
    </template>

    <template v-else-if="node.layout.type === 'tightInfix'">
      <ExpressionNodeT :node="node.layout.children[0]" />
      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >
      <ExpressionNodeT :node="node.layout.children[1]" />
    </template>

    <template v-else-if="node.layout.type === 'tightPostfix'">
      <ExpressionNodeT :node="node.layout.children" />
      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >
    </template>

    <template v-else-if="node.layout.type === 'function'">
      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >
      <span class="symbol paren">(</span>
      <span v-for="(child, index) in node.layout.children" :key="child.id">
        <span v-if="index > 0" class="symbol comma">, </span>
        <ExpressionNodeT :node="child" />
      </span>
      <span class="symbol paren">)</span>
    </template>

    <template v-else-if="node.layout.type === 'filter'">
      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >
      <span class="op-spacing-sm text-operator">{{ node.layout.children[0] }}</span>
      <ExpressionNodeT :node="node.layout.children[2]" />
      <span class="symbol paren">(</span>
      <ExpressionNodeT :node="node.layout.children[1]" />
      <span class="symbol paren">)</span>
    </template>

    <template v-else-if="node.layout.type === 'specialModifier'">
      <ExpressionNodeT :node="node.layout.children[0]" />

      <span
        class="op-not-atom"
        @click="labelClicked"
        @mouseenter="mouseEntered"
        @mouseleave="mouseLeft"
        >{{ node.label }}</span
      >

      <template v-if="node.layout.children[1]">
        <span
          class="op-not-atom"
          @click="labelClicked"
          @mouseenter="mouseEntered"
          @mouseleave="mouseLeft"
          >{{ node.layout.children[1][0] }}</span
        >
        <ExpressionNodeT :node="node.layout.children[1][1]" />
      </template>

      <template v-if="node.layout.children[2]">
        <span
          class="op-not-atom"
          @click="labelClicked"
          @mouseenter="mouseEntered"
          @mouseleave="mouseLeft"
          >lt</span
        >
        <ExpressionNodeT :node="node.layout.children[2]" />
      </template>

      <template v-if="node.layout.children[3]">
        <span
          class="op-not-atom"
          @click="labelClicked"
          @mouseenter="mouseEntered"
          @mouseleave="mouseLeft"
          >lc</span
        >
        <ExpressionNodeT :node="node.layout.children[3]" />
      </template>
    </template>

    <span v-if="node.wrapInParentheses" class="symbol paren">)</span>
  </span>
</template>

<style scoped>
.expression-node {
  display: inline-flex;
  align-items: baseline;

  flex-wrap: wrap;
  white-space: normal;
  row-gap: 2px;

  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--dnd-ink-primary);

  cursor: pointer;
}

.expression-node.mod-tight {
  white-space: nowrap;
  flex-wrap: nowrap;
}

/* 符号通用样式 */
.symbol {
  color: var(--dnd-ink-secondary);
  font-weight: normal;
}

.paren,
.bracket {
  opacity: 0.8;
}

.comma {
  margin-right: 0.3em;
}

/* 间距控制类 */
.op-spacing {
  margin: 0 0.35em;
}

.op-spacing-sm {
  margin-left: 0.2em;
}

.op-not-atom {
  font-weight: 600;
  color: var(--dnd-dragon-red);
}

/* 列表项样式优化：确保列表项内部对齐，但允许在逗号处换行 */
.list-item {
  display: inline-flex;
  align-items: baseline;
}

.expression-node.selected {
  background-color: var(--dnd-magic-blue-trans);
  border-radius: 4px;
}

.expression-node.hovered {
  border: 1px solid var(--dnd-ink-secondary);
  border-radius: 4px;
}
</style>
