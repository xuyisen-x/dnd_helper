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
    <path fill="currentColor" d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
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
