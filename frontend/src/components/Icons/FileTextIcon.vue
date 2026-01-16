<script setup lang="ts">
import { useAttrs } from 'vue'
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    class="icon"
    :class="attrs.class"
  >
    <title>{{ attrs.title }}</title>
    <path
      fill="currentColor"
      d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"
    ></path>
  </svg>
</template>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  fill: currentColor;
}
</style>
