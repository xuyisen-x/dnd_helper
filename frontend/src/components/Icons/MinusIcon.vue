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
    <path fill="currentColor" d="M5 11V13H19V11H5Z"></path>
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
