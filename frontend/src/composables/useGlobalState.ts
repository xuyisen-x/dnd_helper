import { ref } from 'vue'

export const isUsingMouse = ref(window.matchMedia('(hover: hover)').matches)
